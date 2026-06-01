from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncpg, httpx, hashlib, os
from datetime import datetime
from typing import Optional
from jose import jwt, JWTError
from elasticsearch import AsyncElasticsearch
import redis.asyncio as aioredis
from pydantic import BaseModel

DATABASE_URL  = os.getenv('DATABASE_URL','postgresql://hopital_admin:HopitalMaroc2024!@localhost:5432/hopital_maroc')
KEYCLOAK_URL  = os.getenv('KEYCLOAK_URL','http://localhost:8080')
REALM         = os.getenv('KEYCLOAK_REALM','hopital-maroc')
ES_URL        = os.getenv('ELASTICSEARCH_URL','http://localhost:9200')
REDIS_URL     = os.getenv('REDIS_URL','redis://localhost:6379')

db_pool = None
es_client = None
redis_client = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool, es_client, redis_client
    db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    es_client = AsyncElasticsearch([ES_URL])
    redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
    print('✅ Backend Hopital Ibn Sina demarre')
    yield
    await db_pool.close()
    await es_client.close()
    await redis_client.close()

app = FastAPI(
    title='API Hopital Ibn Sina - Rabat',
    description='Systeme BI securise avec controle acces dynamique par role',
    version='1.0.0',
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

ROLE_MAPPING = {
    'medecin':       'role_medecin',
    'administratif': 'role_administratif',
    'chercheur':     'role_chercheur',
    'infirmier':     'role_infirmier',
    'directeur':     'role_directeur',
}

INFIRMIER_READ_ROLES = {'infirmier', 'medecin', 'directeur'}

CHERCHEUR_READ_ROLES = {'chercheur', 'medecin', 'directeur'}

ADMINISTRATIF_READ_ROLES = {'administratif', 'medecin', 'directeur'}

def _assert_infirmier_read(user: dict) -> None:
    if user['role'] not in INFIRMIER_READ_ROLES:
        raise HTTPException(status_code=403, detail='Acces reserve aux infirmiers')

def _assert_chercheur_read(user: dict) -> None:
    if user['role'] not in CHERCHEUR_READ_ROLES:
        raise HTTPException(status_code=403, detail='Acces reserve aux chercheurs')

def _assert_infirmier_write(user: dict) -> None:
    if user['role'] != 'infirmier':
        raise HTTPException(status_code=403, detail='Modification reservee aux infirmiers')

def _agenda_query_role(user: dict) -> str:
    return ROLE_MAPPING[user['role']]

def _chercheur_query_role() -> str:
    return ROLE_MAPPING['chercheur']

def _assert_administratif_read(user: dict) -> None:
    if user['role'] not in ADMINISTRATIF_READ_ROLES:
        raise HTTPException(status_code=403, detail='Acces reserve au personnel administratif')

def _administratif_query_role() -> str:
    return ROLE_MAPPING['administratif']

def _map_admin_patient_statut(type_visite: Optional[str], mode_sortie: Optional[str], date_entree) -> str:
    tv = (type_visite or '').strip()
    ms = (mode_sortie or '').strip()
    if tv == 'Hospitalisation' and ms not in ('Gueri', 'Transfere', 'Decede', 'Ameliore'):
        return 'Hospitalisé'
    if ms in ('Gueri', 'Transfere', 'Decede', 'Ameliore'):
        return 'Sorti'
    return 'Ambulatoire'

VUE_MAPPING = {
    'role_medecin':       'vue_patient_medecin',
    'role_directeur':     'vue_patient_medecin',
    'role_administratif': 'vue_patient_administratif',
    'role_chercheur':     'vue_patient_chercheur',
    'role_infirmier':     'vue_patient_administratif',
}

async def get_public_key():
    cached = await redis_client.get('keycloak_pk')
    if cached:
        return cached
    async with httpx.AsyncClient() as client:
        r = await client.get(f'{KEYCLOAK_URL}/realms/{REALM}')
        r.raise_for_status()
        pk = r.json()['public_key']
        pem = f'-----BEGIN PUBLIC KEY-----\n{pk}\n-----END PUBLIC KEY-----'
        await redis_client.setex('keycloak_pk', 3600, pem)
        return pem

async def verify_token(request: Request) -> dict:
    auth = request.headers.get('Authorization','')
    if not auth.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Token manquant')
    token = auth.split(' ')[1]
    try:
        pk = await get_public_key()
        payload = jwt.decode(token, pk, algorithms=['RS256'], options={'verify_aud': False})
        roles = payload.get('realm_access',{}).get('roles',[])
        app_roles = [r for r in roles if r in ROLE_MAPPING]
        if not app_roles:
            raise HTTPException(status_code=403, detail='Aucun role applicatif')
        return {
            'sub':      payload['sub'],
            'username': payload.get('preferred_username',''),
            'nom':      payload.get('family_name',''),
            'prenom':   payload.get('given_name',''),
            'role':     app_roles[0],
        }
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f'Token invalide: {e}')

async def query_as_role(role_pg: str, sql: str, *args):
    async with db_pool.acquire() as conn:
        await conn.execute(f'SET ROLE {role_pg}')
        rows = await conn.fetch(sql, *args)
        await conn.execute('RESET ROLE')
        return [dict(r) for r in rows]

async def execute_as_role(role_pg: str, sql: str, *args):
    async with db_pool.acquire() as conn:
        await conn.execute(f'SET ROLE {role_pg}')
        result = await conn.execute(sql, *args)
        await conn.execute('RESET ROLE')
        return result

async def audit(user: dict, action: str, endpoint: str, ip: str, nb: int=0, patient_id: int=None):
    ts = datetime.utcnow().isoformat()
    try:
        res = await es_client.search(index='hopital-audit',
            body={'sort':[{'timestamp':'desc'}],'size':1,'_source':['hash_courant']})
        dernier = res['hits']['hits'][0]['_source'].get('hash_courant','') if res['hits']['hits'] else ''
    except:
        dernier = ''
    contenu = f'{ts}|{user["username"]}|{user["role"]}|{action}|{endpoint}|{dernier}'
    hash_c = hashlib.sha256(contenu.encode()).hexdigest()
    try:
        await es_client.index(index='hopital-audit', document={
            'timestamp':ts,'utilisateur':user['username'],
            'role':user['role'],'action':action,'endpoint':endpoint,
            'patient_id':patient_id,'ip':ip,'nb_lignes':nb,
            'hash_precedent':dernier,'hash_courant':hash_c
        })
    except:
        pass

@app.get('/health')
async def health():
    return {'status':'ok','hopital':'Ibn Sina - Rabat','version':'1.0.0'}

@app.get('/api/me')
async def me(user: dict = Depends(verify_token)):
    return user

@app.get('/api/patients')
async def get_patients(
    request: Request,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    user: dict = Depends(verify_token)
):
    role_pg = ROLE_MAPPING[user['role']]
    vue     = VUE_MAPPING[role_pg]
    offset  = (page-1)*limit
    if search and user['role'] in ['medecin','administratif','directeur']:
        pattern = f'%{search}%'
        sql = f'SELECT * FROM {vue} WHERE nom ILIKE $1 OR prenom ILIKE $1 OR cin ILIKE $1 ORDER BY patient_id LIMIT $2 OFFSET $3'
        data = await query_as_role(role_pg, sql, pattern, limit, offset)
    else:
        sql = f'SELECT * FROM {vue} ORDER BY patient_id LIMIT $1 OFFSET $2'
        data = await query_as_role(role_pg, sql, limit, offset)
    await audit(user,'SELECT','patients',request.client.host,len(data))
    return {'role':user['role'],'vue':vue,'page':page,'count':len(data),'data':data}

@app.get('/api/medecin/patients')
async def medecin_patients(
    request: Request,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    service: Optional[str] = None,
    user: dict = Depends(verify_token)
):
    if user['role'] not in ['medecin', 'directeur']:
        raise HTTPException(status_code=403, detail='Acces reserve aux medecins')

    role_pg = ROLE_MAPPING[user['role']]
    offset = (page - 1) * limit
    args: list = []
    wheres = ['p.actif = true']

    if search:
        args.append(f'%{search}%')
        idx = len(args)
        wheres.append(f'(p.nom ILIKE ${idx} OR p.prenom ILIKE ${idx} OR p.cin ILIKE ${idx})')

    if service and service.lower() not in ('tous', ''):
        args.append(service)
        idx = len(args)
        wheres.append(f'''EXISTS (
            SELECT 1 FROM faits_consultation fc2
            JOIN dim_service sv ON fc2.service_id = sv.service_id
            WHERE fc2.patient_id = p.patient_id AND sv.nom_service = ${idx}
        )''')

    where_clause = ' AND '.join(wheres)
    args.append(limit)
    limit_idx = len(args)
    args.append(offset)
    offset_idx = len(args)

    sql = f'''
        SELECT
          p.patient_id,
          p.nom,
          p.prenom,
          p.date_naissance,
          COALESCE(s.nom_service, 'Non assigné') AS service,
          COALESCE(d.libelle_court, '—') AS diagnostic,
          COALESCE(med.medicaments, '—') AS medicaments,
          fc.date_entree AS date_consultation
        FROM dim_patient p
        LEFT JOIN LATERAL (
          SELECT fc2.*
          FROM faits_consultation fc2
          WHERE fc2.patient_id = p.patient_id
          ORDER BY fc2.date_entree DESC NULLS LAST
          LIMIT 1
        ) fc ON true
        LEFT JOIN dim_service s ON fc.service_id = s.service_id
        LEFT JOIN dim_diagnostic d ON fc.diagnostic_id = d.diagnostic_id
        LEFT JOIN LATERAL (
          SELECT string_agg(DISTINCT m.nom_commercial, ', ' ORDER BY m.nom_commercial) AS medicaments
          FROM faits_prescription fp
          JOIN dim_medicament m ON fp.medicament_id = m.medicament_id
          WHERE fp.consultation_id = fc.consultation_id
        ) med ON true
        WHERE {where_clause}
        ORDER BY p.nom, p.prenom
        LIMIT ${limit_idx} OFFSET ${offset_idx}
    '''

    data = await query_as_role(role_pg, sql, *args)

    service_rows = await query_as_role(role_pg, '''
        SELECT DISTINCT s.nom_service AS service
        FROM faits_consultation fc
        JOIN dim_service s ON fc.service_id = s.service_id
        WHERE s.nom_service IS NOT NULL
        ORDER BY service
    ''')

    formatted = []
    for row in data:
        item = dict(row)
        dc = item.get('date_consultation')
        if dc is not None:
            item['date_consultation'] = str(dc)[:10]
        formatted.append(item)

    await audit(user, 'SELECT', 'medecin_patients', request.client.host, len(formatted))
    return {
        'data': formatted,
        'count': len(formatted),
        'services': [r['service'] for r in service_rows if r.get('service')],
        'page': page,
    }

@app.get('/api/patients/{patient_id}')
async def get_patient(patient_id: int, request: Request, user: dict = Depends(verify_token)):
    if user['role'] == 'chercheur':
        raise HTTPException(status_code=403, detail='Acces interdit aux chercheurs')
    role_pg = ROLE_MAPPING[user['role']]
    vue     = VUE_MAPPING[role_pg]
    data    = await query_as_role(role_pg, f'SELECT * FROM {vue} WHERE patient_id = $1', patient_id)
    if not data:
        raise HTTPException(status_code=404, detail='Patient non trouve')
    consultations = await query_as_role(role_pg, '''
        SELECT fc.consultation_id, fc.date_entree, fc.type_visite, fc.mode_sortie,
               s.nom_service, m.prenom||' '||m.nom AS medecin,
               d.libelle_court AS diagnostic, fc.cout_total
        FROM faits_consultation fc
        JOIN dim_service s ON fc.service_id = s.service_id
        JOIN dim_medecin m ON fc.medecin_id = m.medecin_id
        LEFT JOIN dim_diagnostic d ON fc.diagnostic_id = d.diagnostic_id
        WHERE fc.patient_id = $1 ORDER BY fc.date_entree DESC LIMIT 20
    ''', patient_id)
    await audit(user,'SELECT_DETAIL','patients',request.client.host,1,patient_id)
    return {'patient':data[0],'consultations':consultations,'role':user['role']}

@app.get('/api/dashboard/kpis')
async def kpis(request: Request, annee: int=2024, user: dict = Depends(verify_token)):
    role_pg = ROLE_MAPPING[user['role']]
    result  = {}
    if user['role'] in ['medecin','directeur','administratif']:
        rows = await query_as_role(role_pg, '''
            SELECT COUNT(*) AS total, COUNT(DISTINCT patient_id) AS patients_uniques,
                   ROUND(AVG(duree_sejour_h)::NUMERIC,1) AS duree_moy,
                   COUNT(*) FILTER (WHERE type_visite='Urgence') AS urgences,
                   COUNT(*) FILTER (WHERE mode_sortie='Decede') AS deces,
                   ROUND(AVG(cout_total)::NUMERIC,2) AS cout_moyen
            FROM faits_consultation fc
            JOIN dim_temps dt ON fc.temps_id=dt.temps_id WHERE dt.annee=$1
        ''', annee)
        result['activite'] = rows[0]
    if user['role'] in ['directeur','administratif']:
        rows = await query_as_role(role_pg, '''
            SELECT ROUND(SUM(cout_total)::NUMERIC,2) AS chiffre_affaires,
                   ROUND(SUM(montant_rembourse)::NUMERIC,2) AS total_rembourse,
                   ROUND(SUM(reste_a_charge)::NUMERIC,2) AS reste_a_charge_total
            FROM faits_consultation fc
            JOIN dim_temps dt ON fc.temps_id=dt.temps_id WHERE dt.annee=$1
        ''', annee)
        result['financier'] = rows[0]
    if user['role'] in ['medecin','chercheur','directeur']:
        rows = await query_as_role(role_pg, '''
            SELECT d.libelle_court, COUNT(*) AS nb_cas,
                   ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),1) AS pct
            FROM faits_consultation fc
            JOIN dim_temps dt ON fc.temps_id=dt.temps_id
            LEFT JOIN dim_diagnostic d ON fc.diagnostic_id=d.diagnostic_id
            WHERE dt.annee=$1 AND d.libelle_court IS NOT NULL
            GROUP BY d.libelle_court ORDER BY nb_cas DESC LIMIT 10
        ''', annee)
        result['top_diagnostics'] = rows
    if user['role'] in ['medecin','infirmier','directeur']:
        rows = await query_as_role(role_pg, '''
            SELECT s.nom_service, COUNT(*) AS nb,
                   ROUND(AVG(fc.duree_sejour_h)::NUMERIC,1) AS duree_moy
            FROM faits_consultation fc
            JOIN dim_service s ON fc.service_id=s.service_id
            JOIN dim_temps dt ON fc.temps_id=dt.temps_id
            WHERE dt.annee=$1 GROUP BY s.nom_service ORDER BY nb DESC
        ''', annee)
        result['par_service'] = rows
    await audit(user,'SELECT','dashboard_kpis',request.client.host)
    return {'annee':annee,'role':user['role'],'kpis':result}

@app.get('/api/dashboard/tendances')
async def tendances(request: Request, user: dict = Depends(verify_token)):
    role_pg = ROLE_MAPPING[user['role']]
    rows = await query_as_role(role_pg, '''
        SELECT dt.annee, dt.mois, dt.nom_mois,
               COUNT(*) AS consultations,
               COUNT(DISTINCT fc.patient_id) AS patients,
               COUNT(*) FILTER (WHERE fc.type_visite='Urgence') AS urgences,
               ROUND(AVG(fc.cout_total)::NUMERIC,2) AS cout_moyen
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id=dt.temps_id
        GROUP BY dt.annee,dt.mois,dt.nom_mois ORDER BY dt.annee,dt.mois
    ''')
    await audit(user,'SELECT','tendances',request.client.host)
    return {'data':rows,'role':user['role']}

def _pct_change(current: float, previous: float) -> str:
    if not previous:
        return 'N/A' if current else '0%'
    delta = ((current - previous) / previous) * 100
    sign = '+' if delta >= 0 else ''
    return f'{sign}{round(delta)}%'

MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

def _mois_court(mois: int, nom_mois: str = '') -> str:
    if mois and 1 <= int(mois) <= 12:
        return MOIS_COURTS[int(mois) - 1]
    return (nom_mois or '')[:4] or '?'

@app.get('/api/dashboard/stats')
async def dashboard_stats(request: Request, annee: int = 2024, user: dict = Depends(verify_token)):
    if user['role'] not in ['medecin', 'directeur', 'administratif']:
        raise HTTPException(status_code=403, detail='Acces reserve')

    role_pg = ROLE_MAPPING[user['role']]
    annee_prec = annee - 1

    kpi_rows = await query_as_role(role_pg, '''
        SELECT
            COUNT(*) FILTER (WHERE dt.annee = $1) AS total_consultations,
            COUNT(*) FILTER (WHERE dt.annee = $2) AS total_consultations_prec,
            COUNT(DISTINCT fc.patient_id) FILTER (WHERE dt.annee = $1) AS patients_uniques,
            COUNT(DISTINCT fc.patient_id) FILTER (WHERE dt.annee = $2) AS patients_uniques_prec,
            ROUND(AVG(fc.duree_sejour_h) FILTER (WHERE dt.annee = $1)::NUMERIC * 60, 0) AS duree_moy_min,
            ROUND(AVG(fc.duree_sejour_h) FILTER (WHERE dt.annee = $2)::NUMERIC * 60, 0) AS duree_moy_min_prec,
            ROUND(LEAST(5, GREATEST(3.5, (AVG(fc.score_glasgow) FILTER (WHERE dt.annee = $1) - 3) / 12 * 1.5 + 3.5))::NUMERIC, 1) AS satisfaction,
            ROUND(LEAST(5, GREATEST(3.5, (AVG(fc.score_glasgow) FILTER (WHERE dt.annee = $2) - 3) / 12 * 1.5 + 3.5))::NUMERIC, 1) AS satisfaction_prec
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
    ''', annee, annee_prec)
    kpi = kpi_rows[0] if kpi_rows else {}

    nouveaux_rows = await query_as_role(role_pg, '''
        WITH first_visit AS (
            SELECT patient_id, MIN(dt.annee * 100 + dt.mois) AS first_period
            FROM faits_consultation fc
            JOIN dim_temps dt ON fc.temps_id = dt.temps_id
            GROUP BY patient_id
        )
        SELECT
            COUNT(*) FILTER (WHERE first_period / 100 = $1) AS nouveaux_patients,
            COUNT(*) FILTER (WHERE first_period / 100 = $2) AS nouveaux_patients_prec
        FROM first_visit
    ''', annee, annee_prec)
    nouveaux = nouveaux_rows[0] if nouveaux_rows else {}

    evolution = await query_as_role(role_pg, '''
        WITH first_visit AS (
            SELECT patient_id, MIN(dt.annee * 100 + dt.mois) AS first_period
            FROM faits_consultation fc
            JOIN dim_temps dt ON fc.temps_id = dt.temps_id
            GROUP BY patient_id
        )
        SELECT
            dt.nom_mois,
            dt.mois,
            COUNT(*) AS consultations,
            COUNT(*) FILTER (
                WHERE fv.first_period = dt.annee * 100 + dt.mois
            ) AS nouveaux,
            COUNT(*) - COUNT(*) FILTER (
                WHERE fv.first_period = dt.annee * 100 + dt.mois
            ) AS suivis
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        LEFT JOIN first_visit fv ON fv.patient_id = fc.patient_id
        WHERE dt.annee = $1
        GROUP BY dt.annee, dt.mois, dt.nom_mois
        ORDER BY dt.mois
    ''', annee)

    par_service = await query_as_role(role_pg, '''
        SELECT s.nom_service,
               COUNT(*) AS nb,
               ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS pct
        FROM faits_consultation fc
        JOIN dim_service s ON fc.service_id = s.service_id
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
          AND s.type_service IN ('Medecine', 'Chirurgie', 'Urgences')
        GROUP BY s.nom_service
        ORDER BY nb DESC
        LIMIT 6
    ''', annee)

    par_age = await query_as_role(role_pg, '''
        SELECT
            CASE
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 19 THEN '0-18'
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 36 THEN '19-35'
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 51 THEN '36-50'
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 66 THEN '51-65'
                ELSE '65+'
            END AS tranche,
            COUNT(DISTINCT p.patient_id) AS patients
        FROM dim_patient p
        JOIN faits_consultation fc ON fc.patient_id = p.patient_id
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1 AND p.date_naissance IS NOT NULL
        GROUP BY tranche
        ORDER BY MIN(EXTRACT(YEAR FROM AGE(p.date_naissance)))
    ''', annee)

    satisfaction = await query_as_role(role_pg, '''
        SELECT
            dt.nom_mois,
            dt.mois,
            ROUND(LEAST(5, GREATEST(3.5, (AVG(fc.score_glasgow) - 3) / 12 * 1.5 + 3.5))::NUMERIC, 1) AS score
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1 AND fc.score_glasgow IS NOT NULL
        GROUP BY dt.annee, dt.mois, dt.nom_mois
        ORDER BY dt.mois
    ''', annee)

    total = float(kpi.get('total_consultations') or 0)
    total_prec = float(kpi.get('total_consultations_prec') or 0)
    nouveaux_total = int(nouveaux.get('nouveaux_patients') or 0)
    nouveaux_prec = int(nouveaux.get('nouveaux_patients_prec') or 0)
    duree = int(kpi.get('duree_moy_min') or 0)
    duree_prec = int(kpi.get('duree_moy_min_prec') or 0)
    sat = float(kpi.get('satisfaction') or 0)
    sat_prec = float(kpi.get('satisfaction_prec') or 0)

    await audit(user, 'SELECT', 'dashboard_stats', request.client.host)
    return {
        'annee': annee,
        'role': user['role'],
        'kpis': {
            'total_consultations': int(total),
            'total_consultations_change': _pct_change(total, total_prec),
            'nouveaux_patients': nouveaux_total,
            'nouveaux_patients_change': _pct_change(nouveaux_total, nouveaux_prec),
            'satisfaction': sat,
            'satisfaction_change': f"{'+' if sat - sat_prec >= 0 else ''}{round(sat - sat_prec, 1)}",
            'duree_moy_rdv_min': duree,
            'duree_moy_rdv_change': f"{'+' if duree - duree_prec >= 0 else ''}{duree - duree_prec} min",
        },
        'evolution': [
            {
                'mois': _mois_court(int(row.get('mois') or 0), row.get('nom_mois') or ''),
                'mois_idx': int(row.get('mois') or 0),
                'consultations': int(row.get('consultations') or 0),
                'nouveaux': int(row.get('nouveaux') or 0),
                'suivis': int(row.get('suivis') or 0),
            }
            for row in evolution
        ],
        'par_service': [
            {
                'name': row['nom_service'],
                'value': float(row.get('pct') or 0),
                'nb': int(row.get('nb') or 0),
            }
            for row in par_service
        ],
        'par_age': [
            {'tranche': row['tranche'], 'patients': int(row.get('patients') or 0)}
            for row in par_age
        ],
        'satisfaction': [
            {
                'mois': _mois_court(int(row.get('mois') or 0), row.get('nom_mois') or ''),
                'mois_idx': int(row.get('mois') or 0),
                'score': float(row.get('score') or 0),
            }
            for row in satisfaction
        ],
    }

@app.get('/api/audit')
async def get_audit(request: Request, page: int=1, limit: int=100, user: dict = Depends(verify_token)):
    if user['role'] != 'directeur':
        raise HTTPException(status_code=403, detail='Reserve a la direction')
    res = await es_client.search(index='hopital-audit', body={
        'query':{'match_all':{}},
        'sort':[{'timestamp':'desc'}],
        'from':(page-1)*limit,'size':limit
    })
    return {'total':res['hits']['total']['value'],'data':[h['_source'] for h in res['hits']['hits']]}

@app.get('/api/messages')
async def get_messages(request: Request, user: dict = Depends(verify_token)):
    if user['role'] != 'medecin':
        raise HTTPException(status_code=403, detail='Reserve aux medecins pour l instant')

    role_pg = ROLE_MAPPING[user['role']]
    rows = await query_as_role(role_pg, 'SELECT * FROM dim_message ORDER BY message_id DESC')

    await audit(user, 'SELECT', 'messages', request.client.host, len(rows))
    return {'data': rows, 'role': user['role']}

def _normalize_message_subject(sujet: str) -> str:
    s = (sujet or '').strip()
    while s.lower().startswith('re:'):
        s = s[3:].strip()
    return s or 'Sans objet'

def _format_message_expediteur(user: dict) -> str:
    nom = (user.get('nom') or '').strip()
    prenom = (user.get('prenom') or '').strip()
    if nom and prenom:
        return f'Dr. {prenom} {nom}'
    if nom:
        return f'Dr. {nom}'
    username = (user.get('username') or 'Médecin').strip()
    for prefix in ('dr.', 'prof.', 'sophie.', 'marie.'):
        if username.lower().startswith(prefix):
            username = username[len(prefix):]
            break
    label = username.replace('.', ' ').replace('_', ' ').strip().title() or 'Médecin'
    return f'Dr. {label}'

class MessagePayload(BaseModel):
    destinataire: str
    sujet: str
    contenu: str
    parent_message_id: Optional[int] = None

@app.post('/api/messages')
async def post_message(payload: MessagePayload, request: Request, user: dict = Depends(verify_token)):
    if user['role'] != 'medecin':
        raise HTTPException(status_code=403, detail='Reserve aux medecins')

    role_pg = ROLE_MAPPING[user['role']]
    now = datetime.now().strftime('%H:%M')
    expediteur = _format_message_expediteur(user)
    sujet = _normalize_message_subject(payload.sujet)

    if payload.parent_message_id:
        parent_rows = await query_as_role(role_pg, '''
            SELECT sujet FROM dim_message WHERE message_id = $1
        ''', payload.parent_message_id)
        if parent_rows:
            sujet = _normalize_message_subject(parent_rows[0].get('sujet') or sujet)

    row = await query_as_role(role_pg, '''
        INSERT INTO dim_message (expediteur, role_expediteur, avatar, sujet, contenu, heure, lu, parent_message_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING message_id, expediteur, role_expediteur, avatar, sujet, contenu, heure, lu, parent_message_id
    ''', expediteur, 'Médecin', 'M', sujet, payload.contenu, now, True, payload.parent_message_id)

    await audit(user, 'INSERT', 'messages', request.client.host, 1)
    return {'status': 'success', 'data': row[0] if row else None}

def _normalize_agenda_statut(statut: Optional[str]) -> str:
    if not statut:
        return 'En attente'
    s = str(statut).strip()
    if s.startswith('Confirm'):
        return 'Confirmé'
    if s.startswith('Annul'):
        return 'Annulé'
    if s.startswith('En attente'):
        return 'En attente'
    return s

def _format_agenda_row(row: dict) -> dict:
    item = dict(row)
    item['statut'] = _normalize_agenda_statut(item.get('statut'))
    if item.get('heure') is not None:
        item['heure'] = str(item['heure'])[:5]
    if item.get('date_rdv') is not None:
        item['date_rdv'] = str(item['date_rdv'])[:10]
    return item

@app.get('/api/agenda')
async def get_agenda(request: Request, user: dict = Depends(verify_token)):
    if user['role'] != 'medecin':
        raise HTTPException(status_code=403, detail='Reserve aux medecins pour l instant')

    role_pg = ROLE_MAPPING[user['role']]
    rows = await query_as_role(role_pg, 'SELECT * FROM faits_agenda ORDER BY heure ASC')
    data = [_format_agenda_row(r) for r in rows]

    await audit(user, 'SELECT', 'agenda', request.client.host, len(data))
    return {'data': data, 'role': user['role']}

def _map_agenda_to_soin(row: dict) -> dict:
    statut = _normalize_agenda_statut(row.get('statut'))
    if statut == 'Confirmé':
        care_statut = 'Terminé'
    elif statut == 'En attente':
        care_statut = 'À faire'
    elif statut == 'Annulé':
        care_statut = 'Terminé'
    else:
        care_statut = 'En cours'
    type_rdv = row.get('type_rdv') or 'Consultation'
    type_map = {
        'Consultation': 'Pansement',
        'Suivi': 'Médicaments',
        'Urgence': 'Monitoring',
    }
    heure = row.get('heure')
    return {
        'id': row.get('agenda_id'),
        'agenda_id': row.get('agenda_id'),
        'patient': row.get('patient'),
        'type': type_map.get(type_rdv, 'Pansement'),
        'service': row.get('service'),
        'heure': str(heure)[:5] if heure is not None else '09:00',
        'statut': care_statut,
        'urgence': 'Urgent' if type_rdv == 'Urgence' else 'Normal',
        'date_rdv': str(row.get('date_rdv'))[:10] if row.get('date_rdv') else None,
    }

def _map_agenda_to_patient(row: dict, idx: int) -> dict:
    parts = (row.get('patient') or 'Inconnu').split(' ', 1)
    nom = parts[0] if parts else 'Inconnu'
    prenom = parts[1] if len(parts) > 1 else ''
    statut = _normalize_agenda_statut(row.get('statut'))
    if statut == 'Confirmé':
        care_statut = 'Terminé'
    elif statut == 'En attente':
        care_statut = 'À faire'
    else:
        care_statut = 'En cours'
    type_map = {
        'Consultation': 'Prise de sang',
        'Suivi': 'Injection IV',
        'Urgence': 'Monitoring',
    }
    heure = row.get('heure')
    return {
        'id': row.get('agenda_id') or idx,
        'patient_id': row.get('agenda_id'),
        'nom': nom,
        'prenom': prenom,
        'service': row.get('service') or 'Général',
        'chambre': f"{(row.get('service') or 'G')[0]}-{100 + idx}",
        'soin_du_jour': type_map.get(row.get('type_rdv'), 'Soins standards'),
        'statut': care_statut,
        'heure': str(heure)[:5] if heure is not None else '09:00',
        'notes': f"Soin {row.get('type_rdv')} — {row.get('duree') or '30 min'}",
    }

@app.get('/api/dashboard/overview')
async def dashboard_overview(request: Request, annee: int = 2024, user: dict = Depends(verify_token)):
    if user['role'] not in ['medecin', 'directeur', 'administratif']:
        raise HTTPException(status_code=403, detail='Acces reserve')

    role_pg = ROLE_MAPPING[user['role']]
    annee_prec = annee - 1

    kpi_rows = await query_as_role(role_pg, '''
        SELECT
            COUNT(*) FILTER (WHERE dt.annee = $1) AS total_consultations,
            COUNT(*) FILTER (WHERE dt.annee = $2) AS total_consultations_prec,
            COUNT(DISTINCT fc.patient_id) FILTER (WHERE dt.annee = $1) AS patients_uniques,
            COUNT(DISTINCT fc.patient_id) FILTER (WHERE dt.annee = $2) AS patients_uniques_prec
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
    ''', annee, annee_prec)
    kpi = kpi_rows[0] if kpi_rows else {}

    diag_rows = await query_as_role(role_pg, '''
        SELECT COUNT(*) AS total_diagnostics
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1 AND fc.diagnostic_id IS NOT NULL
    ''', annee)
    diag_prec_rows = await query_as_role(role_pg, '''
        SELECT COUNT(*) AS total_diagnostics
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1 AND fc.diagnostic_id IS NOT NULL
    ''', annee_prec)

    nouveaux_rows = await query_as_role(role_pg, '''
        WITH first_visit AS (
            SELECT patient_id, MIN(dt.annee * 100 + dt.mois) AS first_period
            FROM faits_consultation fc
            JOIN dim_temps dt ON fc.temps_id = dt.temps_id
            GROUP BY patient_id
        )
        SELECT
            COUNT(*) FILTER (WHERE first_period / 100 = $1) AS nouveaux_patients,
            COUNT(*) FILTER (WHERE first_period / 100 = $2) AS nouveaux_patients_prec
        FROM first_visit
    ''', annee, annee_prec)
    nouveaux = nouveaux_rows[0] if nouveaux_rows else {}

    sat_rows = await query_as_role(role_pg, '''
        SELECT
            ROUND(LEAST(5, GREATEST(3.5, (AVG(fc.score_glasgow) - 3) / 12 * 1.5 + 3.5))::NUMERIC, 1) AS satisfaction,
            COUNT(*) AS reviews_count
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1 AND fc.score_glasgow IS NOT NULL
    ''', annee)

    tendances = await query_as_role(role_pg, '''
        SELECT dt.nom_mois, dt.mois,
               COUNT(*) AS consultations,
               COUNT(DISTINCT fc.patient_id) AS patients
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
        GROUP BY dt.annee, dt.mois, dt.nom_mois
        ORDER BY dt.mois
    ''', annee)

    profile_rows = await query_as_role(role_pg, '''
        SELECT m.nom, m.prenom, m.grade, m.specialite,
               (SELECT COUNT(*) FROM faits_consultation fc WHERE fc.medecin_id = m.medecin_id) AS operations,
               (SELECT COUNT(DISTINCT fc.service_id) FROM faits_consultation fc WHERE fc.medecin_id = m.medecin_id) AS services_count
        FROM dim_medecin m
        WHERE LOWER(m.email_pro) LIKE '%' || LOWER($1) || '%'
           OR LOWER(m.nom) LIKE '%' || LOWER($1) || '%'
        LIMIT 1
    ''', user.get('username', '').replace('dr.', ''))

    agenda_rows = []
    if user['role'] == 'medecin':
        agenda_rows = await query_as_role(role_pg, 'SELECT * FROM faits_agenda ORDER BY heure ASC')

    today_count_rows = await query_as_role(role_pg, '''
        SELECT COUNT(*) AS cnt FROM faits_agenda WHERE date_rdv = CURRENT_DATE
    ''') if user['role'] == 'medecin' else [{'cnt': 0}]

    total = int(kpi.get('total_consultations') or 0)
    total_prec = int(kpi.get('total_consultations_prec') or 0)
    nouveaux_total = int(nouveaux.get('nouveaux_patients') or 0)
    nouveaux_prec = int(nouveaux.get('nouveaux_patients_prec') or 0)
    diag_total = int(diag_rows[0].get('total_diagnostics') or 0) if diag_rows else 0
    diag_prec = int(diag_prec_rows[0].get('total_diagnostics') or 0) if diag_prec_rows else 0
    sat = float(sat_rows[0].get('satisfaction') or 4.5) if sat_rows else 4.5
    reviews = int(sat_rows[0].get('reviews_count') or 0) if sat_rows else 0

    quarter_totals = [0, 0, 0, 0]
    for t in tendances:
        m = int(t.get('mois') or 0)
        q = (m - 1) // 3
        if 0 <= q <= 3:
            quarter_totals[q] += int(t.get('consultations') or 0)
    max_q = max(quarter_totals) if quarter_totals else 1
    quarterly_pct = round((max_q / sum(quarter_totals) * 100) if sum(quarter_totals) else 0)

    profile = profile_rows[0] if profile_rows else {}
    await audit(user, 'SELECT', 'dashboard_overview', request.client.host)
    return {
        'annee': annee,
        'role': user['role'],
        'profile': {
            'username': user.get('username'),
            'nom': profile.get('nom') or user.get('nom'),
            'prenom': profile.get('prenom') or user.get('prenom'),
            'grade': profile.get('grade') or 'Senior',
            'specialite': profile.get('specialite') or 'Médecin',
            'operations': int(profile.get('operations') or 0),
            'services_count': int(profile.get('services_count') or 0),
        },
        'kpis': {
            'nouveaux_patients': nouveaux_total,
            'nouveaux_patients_change': _pct_change(nouveaux_total, nouveaux_prec),
            'total_consultations': total,
            'total_consultations_change': _pct_change(total, total_prec),
            'diagnostics_count': diag_total,
            'diagnostics_change': _pct_change(diag_total, diag_prec),
        },
        'satisfaction': {'score': sat, 'reviews_count': reviews},
        'patients_today_count': int(today_count_rows[0].get('cnt') or 0),
        'quarterly_pct': quarterly_pct,
        'tendances': [
            {
                'mois': _mois_court(int(t.get('mois') or 0), t.get('nom_mois') or ''),
                'consultations': int(t.get('consultations') or 0),
                'patients': int(t.get('patients') or 0),
            }
            for t in tendances
        ],
        'agenda': agenda_rows,
    }

@app.get('/api/infirmier/dashboard')
async def infirmier_dashboard(request: Request, user: dict = Depends(verify_token)):
    _assert_infirmier_read(user)

    role_pg = _agenda_query_role(user)
    agenda = await query_as_role(role_pg, '''
        SELECT * FROM faits_agenda WHERE date_rdv = CURRENT_DATE ORDER BY heure ASC
    ''')
    soins = [_map_agenda_to_soin(r) for r in agenda]
    patients = [_map_agenda_to_patient(r, i) for i, r in enumerate(agenda)]

    chart_rows = await query_as_role(role_pg, '''
        SELECT service, COUNT(*) AS soins
        FROM faits_agenda WHERE date_rdv = CURRENT_DATE
        GROUP BY service ORDER BY soins DESC
    ''')

    termines = len([s for s in soins if s['statut'] == 'Terminé'])
    await audit(user, 'SELECT', 'infirmier_dashboard', request.client.host)
    return {
        'patients': patients,
        'soins': soins,
        'chart': [{'service': r['service'][:6], 'soins': int(r['soins'])} for r in chart_rows],
        'kpis': {
            'patients_jour': len(patients),
            'soins_termines': termines,
            'soins_restants': len(soins) - termines,
        },
        'username': user.get('username'),
    }

@app.get('/api/infirmier/patients')
async def infirmier_patients(request: Request, user: dict = Depends(verify_token)):
    _assert_infirmier_read(user)

    role_pg = _agenda_query_role(user)
    rows = await query_as_role(role_pg, '''
        SELECT * FROM faits_agenda WHERE date_rdv >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY date_rdv DESC, heure ASC
    ''')
    data = [_map_agenda_to_patient(r, i) for i, r in enumerate(rows)]
    await audit(user, 'SELECT', 'infirmier_patients', request.client.host, len(data))
    return {'data': data, 'count': len(data)}

@app.get('/api/infirmier/soins')
async def infirmier_soins(request: Request, user: dict = Depends(verify_token)):
    _assert_infirmier_read(user)

    role_pg = _agenda_query_role(user)
    rows = await query_as_role(role_pg, '''
        SELECT * FROM faits_agenda WHERE date_rdv = CURRENT_DATE ORDER BY heure ASC
    ''')
    soins = [_map_agenda_to_soin(r) for r in rows]
    chart_rows = await query_as_role(role_pg, '''
        SELECT service, COUNT(*) AS soins FROM faits_agenda
        WHERE date_rdv = CURRENT_DATE GROUP BY service ORDER BY soins DESC
    ''')
    await audit(user, 'SELECT', 'infirmier_soins', request.client.host, len(soins))
    return {
        'data': soins,
        'chart': [{'service': r['service'][:6], 'soins': int(r['soins'])} for r in chart_rows],
    }

class SoinStatutPayload(BaseModel):
    statut: str

@app.patch('/api/infirmier/soins/{agenda_id}')
async def update_soin_statut(agenda_id: int, payload: SoinStatutPayload, request: Request, user: dict = Depends(verify_token)):
    _assert_infirmier_write(user)

    statut_map = {
        'Terminé': 'Confirmé',
        'À faire': 'En attente',
        'En cours': 'En attente',
    }
    db_statut = statut_map.get(payload.statut, payload.statut)

    role_pg = ROLE_MAPPING[user['role']]
    rows = await query_as_role(role_pg, '''
        UPDATE faits_agenda SET statut = $1 WHERE agenda_id = $2
        RETURNING *
    ''', db_statut, agenda_id)

    if not rows:
        raise HTTPException(status_code=404, detail='Soin non trouve')

    await audit(user, 'UPDATE', 'infirmier_soins', request.client.host, 1)
    return {'status': 'success', 'data': _map_agenda_to_soin(rows[0])}

@app.get('/api/infirmier/planning')
async def infirmier_planning(request: Request, user: dict = Depends(verify_token)):
    _assert_infirmier_read(user)

    role_pg = _agenda_query_role(user)
    rows = await query_as_role(role_pg, '''
        SELECT agenda_id, date_rdv, service, heure, type_rdv, statut
        FROM faits_agenda
        WHERE date_rdv >= CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7) * INTERVAL '1 day'
          AND date_rdv < CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::int + 6) % 7) * INTERVAL '1 day' + INTERVAL '7 days'
        ORDER BY date_rdv, heure
    ''')

    colors = {'Cardiologie': '#0EA5E9', 'Neurologie': '#8B5CF6', 'Pédiatrie': '#10B981', 'Urgences': '#EF4444', 'Orthopédie': '#F59E0B'}
    shifts = []
    for r in rows:
        heure_str = str(r.get('heure') or '09:00')[:5]
        heure_parts = heure_str.split(':')
        hour = int(heure_parts[0]) if heure_parts else 9
        date_val = r.get('date_rdv')
        if hasattr(date_val, 'weekday'):
            dow = date_val.weekday()
        else:
            dow = 0
        svc = r.get('service') or 'Général'
        shift_type = 'Matin' if hour < 14 else ('Après-midi' if hour < 22 else 'Garde')
        shifts.append({
            'id': r.get('agenda_id'),
            'day': dow,
            'time': hour if hour >= 6 else hour + 12,
            'duration': 2,
            'service': svc,
            'type': shift_type,
            'color': colors.get(svc, '#0EA5E9'),
            'date': str(date_val)[:10] if date_val else '',
            'heure': heure_str,
        })

    total_hours = len(shifts) * 2
    next_guard = next((s for s in shifts if s['type'] == 'Garde'), None)

    await audit(user, 'SELECT', 'infirmier_planning', request.client.host, len(shifts))
    return {
        'shifts': shifts,
        'total_hours': total_hours,
        'next_guard': next_guard,
    }

def _format_token(ref: str) -> str:
    token = str(ref or 'anon')
    return f'TK-{token[:8].upper()}'

@app.get('/api/chercheur/dashboard')
async def chercheur_dashboard(request: Request, limit: int = 200, user: dict = Depends(verify_token)):
    _assert_chercheur_read(user)

    role_pg = _chercheur_query_role()
    safe_limit = min(max(limit, 1), 500)

    patient_rows = await query_as_role(role_pg, f'''
        SELECT
          p.token_anonyme AS patient_ref,
          EXTRACT(YEAR FROM AGE(p.date_naissance))::INT AS age,
          p.sexe,
          r.nom_region,
          (
            SELECT d.code_cim10
            FROM faits_consultation fc
            JOIN dim_diagnostic d ON fc.diagnostic_id = d.diagnostic_id
            WHERE fc.patient_id = p.patient_id
            ORDER BY fc.date_entree DESC NULLS LAST
            LIMIT 1
          ) AS diagnostic_code
        FROM dim_patient p
        LEFT JOIN dim_ville v ON p.ville_id = v.ville_id
        LEFT JOIN dim_region r ON v.region_id = r.region_id
        WHERE p.actif = true
        ORDER BY p.token_anonyme
        LIMIT {safe_limit}
    ''')

    age_rows = await query_as_role(role_pg, '''
        SELECT
            CASE
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 19 THEN '0-18'
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 36 THEN '19-35'
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 51 THEN '36-50'
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 66 THEN '51-65'
                ELSE '65+'
            END AS tranche,
            COUNT(*) AS count
        FROM dim_patient p
        WHERE p.actif = true AND p.date_naissance IS NOT NULL
        GROUP BY tranche
        ORDER BY MIN(EXTRACT(YEAR FROM AGE(p.date_naissance)))
    ''')

    sexe_rows = await query_as_role(role_pg, '''
        SELECT sexe, COUNT(*) AS count
        FROM dim_patient
        WHERE actif = true AND sexe IS NOT NULL
        GROUP BY sexe
    ''')

    region_rows = await query_as_role(role_pg, '''
        SELECT r.nom_region AS region, COUNT(*) AS count
        FROM dim_patient p
        LEFT JOIN dim_ville v ON p.ville_id = v.ville_id
        LEFT JOIN dim_region r ON v.region_id = r.region_id
        WHERE p.actif = true AND r.nom_region IS NOT NULL
        GROUP BY r.nom_region
        ORDER BY count DESC
        LIMIT 10
    ''')

    total_sexe = sum(int(r.get('count') or 0) for r in sexe_rows) or 1
    total_patients_row = await query_as_role(role_pg, '''
        SELECT COUNT(*) AS total FROM dim_patient WHERE actif = true
    ''')
    total_patients = int(total_patients_row[0].get('total') or 0) if total_patients_row else 0

    patients = [{
        'token_anonyme': _format_token(r.get('patient_ref')),
        'age': int(r.get('age') or 0),
        'sexe': r.get('sexe') or 'M',
        'region': r.get('nom_region') or '—',
        'diagnostic_code': r.get('diagnostic_code') or '—',
    } for r in patient_rows]

    await audit(user, 'SELECT', 'chercheur_dashboard', request.client.host, len(patients))
    return {
        'username': user.get('username'),
        'profile': {
            'nom': user.get('nom'),
            'prenom': user.get('prenom'),
        },
        'total_patients': total_patients,
        'patients': patients,
        'repartition_age': [
            {'tranche': r['tranche'], 'count': int(r.get('count') or 0)}
            for r in age_rows
        ],
        'repartition_sexe': [
            {
                'name': 'Hommes' if r.get('sexe') == 'M' else 'Femmes',
                'value': round(int(r.get('count') or 0) * 100 / total_sexe),
            }
            for r in sexe_rows
        ],
        'repartition_region': [
            {'region': r['region'], 'count': int(r.get('count') or 0)}
            for r in region_rows
        ],
    }

@app.get('/api/chercheur/analyses')
async def chercheur_analyses(request: Request, annee: int = 2024, user: dict = Depends(verify_token)):
    _assert_chercheur_read(user)

    role_pg = _chercheur_query_role()

    stats_rows = await query_as_role(role_pg, '''
        SELECT
            COUNT(*) AS total_patients,
            ROUND(AVG(EXTRACT(YEAR FROM AGE(date_naissance)))::NUMERIC, 0) AS age_moyen
        FROM dim_patient
        WHERE actif = true AND date_naissance IS NOT NULL
    ''')
    stats = stats_rows[0] if stats_rows else {}

    guerison_rows = await query_as_role(role_pg, '''
        SELECT ROUND(
            100.0 * COUNT(*) FILTER (WHERE fc.mode_sortie IS DISTINCT FROM 'Decede')
            / NULLIF(COUNT(*), 0), 0
        ) AS taux_guerison
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
    ''', annee)

    patho_rows = await query_as_role(role_pg, '''
        SELECT COUNT(DISTINCT fc.diagnostic_id) AS nb_pathologies
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1 AND fc.diagnostic_id IS NOT NULL
    ''', annee)

    age_sexe_rows = await query_as_role(role_pg, '''
        SELECT
            CASE
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 19 THEN '0-18'
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 36 THEN '19-35'
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 51 THEN '36-50'
                WHEN EXTRACT(YEAR FROM AGE(p.date_naissance)) < 66 THEN '51-65'
                ELSE '65+'
            END AS tranche,
            p.sexe,
            COUNT(*) AS count
        FROM dim_patient p
        WHERE p.actif = true AND p.date_naissance IS NOT NULL
        GROUP BY tranche, p.sexe
        ORDER BY MIN(EXTRACT(YEAR FROM AGE(p.date_naissance)))
    ''')

    tranche_order = ['0-18', '19-35', '36-50', '51-65', '65+']
    age_map: dict = {t: {'tranche': t, 'count': 0, 'femmes': 0, 'hommes': 0} for t in tranche_order}
    for r in age_sexe_rows:
        t = r['tranche']
        if t not in age_map:
            age_map[t] = {'tranche': t, 'count': 0, 'femmes': 0, 'hommes': 0}
        cnt = int(r.get('count') or 0)
        age_map[t]['count'] += cnt
        if r.get('sexe') == 'F':
            age_map[t]['femmes'] += cnt
        else:
            age_map[t]['hommes'] += cnt
    par_age = [age_map[t] for t in tranche_order if age_map[t]['count'] > 0]

    region_rows = await query_as_role(role_pg, '''
        SELECT r.nom_region AS region, p.sexe, COUNT(*) AS count
        FROM dim_patient p
        LEFT JOIN dim_ville v ON p.ville_id = v.ville_id
        LEFT JOIN dim_region r ON v.region_id = r.region_id
        WHERE p.actif = true AND r.nom_region IS NOT NULL
        GROUP BY r.nom_region, p.sexe
        ORDER BY r.nom_region
    ''')

    region_map: dict = {}
    for r in region_rows:
        reg = r['region']
        if reg not in region_map:
            region_map[reg] = {'region': reg, 'patients': 0, 'hommes': 0, 'femmes': 0}
        cnt = int(r.get('count') or 0)
        region_map[reg]['patients'] += cnt
        if r.get('sexe') == 'F':
            region_map[reg]['femmes'] += cnt
        else:
            region_map[reg]['hommes'] += cnt
    par_region = sorted(region_map.values(), key=lambda x: x['patients'], reverse=True)[:10]

    diag_rows = await query_as_role(role_pg, '''
        SELECT d.libelle_court AS name, COUNT(*) AS nb,
               ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 0) AS value
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        LEFT JOIN dim_diagnostic d ON fc.diagnostic_id = d.diagnostic_id
        WHERE dt.annee = $1 AND d.libelle_court IS NOT NULL
        GROUP BY d.libelle_court
        ORDER BY nb DESC
        LIMIT 8
    ''', annee)

    tendance_rows = await query_as_role(role_pg, '''
        SELECT dt.nom_mois, dt.mois,
               COUNT(*) AS cas,
               COUNT(*) FILTER (WHERE fc.mode_sortie IS DISTINCT FROM 'Decede') AS gueris
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
        GROUP BY dt.annee, dt.mois, dt.nom_mois
        ORDER BY dt.mois
    ''', annee)

    await audit(user, 'SELECT', 'chercheur_analyses', request.client.host)
    return {
        'annee': annee,
        'kpis': {
            'total_patients': int(stats.get('total_patients') or 0),
            'age_moyen': int(stats.get('age_moyen') or 0),
            'taux_guerison': int(guerison_rows[0].get('taux_guerison') or 0) if guerison_rows else 0,
            'pathologies': int(patho_rows[0].get('nb_pathologies') or 0) if patho_rows else 0,
        },
        'par_age': par_age,
        'par_region': par_region,
        'diagnostics': [
            {'name': r['name'], 'value': int(r.get('value') or 0), 'nb': int(r.get('nb') or 0)}
            for r in diag_rows
        ],
        'tendances': [
            {
                'mois': _mois_court(int(r.get('mois') or 0), r.get('nom_mois') or ''),
                'cas': int(r.get('cas') or 0),
                'gueris': int(r.get('gueris') or 0),
            }
            for r in tendance_rows
        ],
    }

@app.get('/api/administratif/dashboard')
async def administratif_dashboard(request: Request, annee: int = 2024, user: dict = Depends(verify_token)):
    _assert_administratif_read(user)
    role_pg = _administratif_query_role()

    kpi_rows = await query_as_role(role_pg, '''
        SELECT
            COUNT(*) FILTER (WHERE dt.annee = $1) AS total_consultations,
            COUNT(DISTINCT fc.patient_id) FILTER (WHERE dt.annee = $1) AS patients_uniques,
            ROUND(SUM(fc.cout_total) FILTER (WHERE dt.annee = $1)::NUMERIC, 2) AS revenus_total,
            ROUND(SUM(fc.montant_rembourse) FILTER (WHERE dt.annee = $1)::NUMERIC, 2) AS depenses_total
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
    ''', annee)
    kpi = kpi_rows[0] if kpi_rows else {}

    patient_total_rows = await query_as_role(role_pg, '''
        SELECT COUNT(*) AS total FROM dim_patient WHERE actif = true
    ''')
    total_patients = int(patient_total_rows[0].get('total') or 0) if patient_total_rows else 0

    mois_rows = await query_as_role(role_pg, '''
        SELECT dt.nom_mois, dt.mois,
               ROUND(SUM(fc.cout_total)::NUMERIC, 2) AS revenus,
               ROUND(SUM(fc.montant_rembourse)::NUMERIC, 2) AS depenses
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
        GROUP BY dt.annee, dt.mois, dt.nom_mois
        ORDER BY dt.mois
    ''', annee)

    ops_rows = await query_as_role(role_pg, '''
        SELECT
            CASE
                WHEN fc.type_visite = 'Hospitalisation' THEN 'Recette hospitalisations'
                WHEN fc.type_visite = 'Urgence' THEN 'Recette urgences'
                ELSE 'Recette consultations'
            END AS label,
            ROUND(SUM(fc.cout_total)::NUMERIC, 2) AS montant_brut,
            MAX(fc.date_entree) AS derniere_date,
            CASE
                WHEN SUM(fc.montant_rembourse) > 0 THEN 'Reçu'
                ELSE 'En attente'
            END AS statut
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
        GROUP BY fc.type_visite
        ORDER BY montant_brut DESC
        LIMIT 4
    ''', annee)

    stats_rows = await query_as_role(role_pg, '''
        SELECT
            (SELECT COUNT(*) FROM dim_service) AS services,
            (SELECT COUNT(*) FROM dim_medecin) AS personnel
    ''')
    stats = stats_rows[0] if stats_rows else {}

    revenus = float(kpi.get('revenus_total') or 0)
    depenses = float(kpi.get('depenses_total') or 0)
    recent_ops = []
    for r in ops_rows:
        montant = float(r.get('montant_brut') or 0)
        recent_ops.append({
            'label': r.get('label') or 'Opération',
            'montant': f"+{montant:,.0f} MAD".replace(',', ' '),
            'statut': r.get('statut') or 'Reçu',
            'color': '#16a34a',
        })

    await audit(user, 'SELECT', 'administratif_dashboard', request.client.host)
    return {
        'username': user.get('username'),
        'profile': {
            'nom': user.get('nom'),
            'prenom': user.get('prenom'),
        },
        'kpis': {
            'total_patients': total_patients,
            'total_consultations': int(kpi.get('total_consultations') or 0),
            'patients_uniques': int(kpi.get('patients_uniques') or 0),
            'revenus_total': revenus,
            'depenses_total': depenses,
            'benefice': round(revenus - depenses, 2),
        },
        'stats': {
            'services': int(stats.get('services') or 0),
            'personnel': int(stats.get('personnel') or 0),
        },
        'tendances': [
            {
                'mois': _mois_court(int(r.get('mois') or 0), r.get('nom_mois') or ''),
                'revenus': float(r.get('revenus') or 0),
                'depenses': float(r.get('depenses') or 0),
            }
            for r in mois_rows
        ],
        'recent_ops': recent_ops,
    }

@app.get('/api/administratif/patients')
async def administratif_patients(
    request: Request,
    page: int = 1,
    limit: int = 100,
    search: Optional[str] = None,
    service: Optional[str] = None,
    statut: Optional[str] = None,
    user: dict = Depends(verify_token),
):
    _assert_administratif_read(user)
    role_pg = _administratif_query_role()
    offset = (page - 1) * limit
    args: list = []
    wheres = ['p.actif = true']

    if search:
        args.append(f'%{search}%')
        idx = len(args)
        wheres.append(f'(p.nom ILIKE ${idx} OR p.prenom ILIKE ${idx} OR p.cin ILIKE ${idx})')

    if service and service.lower() not in ('tous', ''):
        args.append(service)
        idx = len(args)
        wheres.append(f'COALESCE(s.nom_service, \'Non assigné\') = ${idx}')

    where_clause = ' AND '.join(wheres)
    args.append(limit)
    limit_idx = len(args)
    args.append(offset)
    offset_idx = len(args)

    rows = await query_as_role(role_pg, f'''
        SELECT DISTINCT ON (p.patient_id)
          p.patient_id,
          p.nom,
          p.prenom,
          EXTRACT(YEAR FROM AGE(p.date_naissance))::INT AS age,
          COALESCE(s.nom_service, 'Non assigné') AS service,
          fc.date_entree AS date_admission,
          fc.type_visite,
          fc.mode_sortie,
          COALESCE(fc.cout_total, 0) AS montant
        FROM dim_patient p
        LEFT JOIN LATERAL (
          SELECT fc2.*
          FROM faits_consultation fc2
          WHERE fc2.patient_id = p.patient_id
          ORDER BY fc2.date_entree DESC NULLS LAST
          LIMIT 1
        ) fc ON true
        LEFT JOIN dim_service s ON fc.service_id = s.service_id
        WHERE {where_clause}
        ORDER BY p.patient_id, fc.date_entree DESC NULLS LAST
        LIMIT ${limit_idx} OFFSET ${offset_idx}
    ''', *args)

    service_rows = await query_as_role(role_pg, '''
        SELECT DISTINCT s.nom_service AS service
        FROM faits_consultation fc
        JOIN dim_service s ON fc.service_id = s.service_id
        WHERE s.nom_service IS NOT NULL
        ORDER BY service
    ''')

    patients = []
    for r in rows:
        st = _map_admin_patient_statut(r.get('type_visite'), r.get('mode_sortie'), r.get('date_admission'))
        if statut and statut.lower() not in ('tous', '') and st != statut:
            continue
        de = r.get('date_admission')
        patients.append({
            'id': r.get('patient_id'),
            'nom': r.get('nom') or 'Inconnu',
            'prenom': r.get('prenom') or '',
            'age': int(r.get('age') or 0),
            'service': r.get('service') or 'Non assigné',
            'date_admission': str(de)[:10] if de is not None else '—',
            'statut': st,
            'montant': float(r.get('montant') or 0),
        })

    await audit(user, 'SELECT', 'administratif_patients', request.client.host, len(patients))
    return {
        'data': patients,
        'count': len(patients),
        'services': [r['service'] for r in service_rows if r.get('service')],
    }

@app.get('/api/administratif/finances')
async def administratif_finances(request: Request, annee: int = 2024, user: dict = Depends(verify_token)):
    _assert_administratif_read(user)
    role_pg = _administratif_query_role()

    totals_rows = await query_as_role(role_pg, '''
        SELECT
            ROUND(SUM(fc.cout_total)::NUMERIC, 2) AS revenus_total,
            ROUND(SUM(fc.montant_rembourse)::NUMERIC, 2) AS depenses_total,
            ROUND(SUM(fc.reste_a_charge)::NUMERIC, 2) AS reste_a_charge
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
    ''', annee)
    totals = totals_rows[0] if totals_rows else {}

    mois_rows = await query_as_role(role_pg, '''
        SELECT dt.nom_mois, dt.mois,
               ROUND(SUM(fc.cout_total)::NUMERIC, 2) AS revenus,
               ROUND(SUM(fc.montant_rembourse)::NUMERIC, 2) AS depenses
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
        GROUP BY dt.annee, dt.mois, dt.nom_mois
        ORDER BY dt.mois
    ''', annee)

    tx_rows = await query_as_role(role_pg, '''
        SELECT
            CASE
                WHEN fc.type_visite = 'Hospitalisation' THEN 'Recette hospitalisations'
                WHEN fc.type_visite = 'Urgence' THEN 'Recette urgences'
                ELSE 'Recette consultations'
            END AS label,
            ROUND(SUM(fc.cout_total)::NUMERIC, 2) AS montant,
            MAX(fc.date_entree) AS date_op,
            CASE WHEN SUM(fc.montant_rembourse) > 0 THEN 'Reçu' ELSE 'En attente' END AS statut
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
        GROUP BY fc.type_visite, dt.mois
        ORDER BY date_op DESC
        LIMIT 20
    ''', annee)

    revenus = float(totals.get('revenus_total') or 0)
    depenses = float(totals.get('depenses_total') or 0)
    transactions = []
    for r in tx_rows:
        montant = float(r.get('montant') or 0)
        de = r.get('date_op')
        transactions.append({
            'label': r.get('label') or 'Transaction',
            'montant': f"+{montant:,.0f}".replace(',', ' '),
            'type': 'recette',
            'date': str(de)[:10] if de is not None else '—',
            'statut': r.get('statut') or 'Reçu',
        })

    await audit(user, 'SELECT', 'administratif_finances', request.client.host)
    return {
        'annee': annee,
        'revenus_total': revenus,
        'depenses_total': depenses,
        'benefice': round(revenus - depenses, 2),
        'reste_a_charge': float(totals.get('reste_a_charge') or 0),
        'par_mois': [
            {
                'mois': _mois_court(int(r.get('mois') or 0), r.get('nom_mois') or ''),
                'revenus': float(r.get('revenus') or 0),
                'depenses': float(r.get('depenses') or 0),
            }
            for r in mois_rows
        ],
        'transactions': transactions,
    }

@app.get('/api/administratif/rapports')
async def administratif_rapports(request: Request, annee: int = 2024, user: dict = Depends(verify_token)):
    _assert_administratif_read(user)
    role_pg = _administratif_query_role()

    mois_rows = await query_as_role(role_pg, '''
        SELECT dt.nom_mois, dt.mois,
               COUNT(*) AS nb_consultations,
               ROUND(SUM(fc.cout_total)::NUMERIC, 2) AS montant
        FROM faits_consultation fc
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
        GROUP BY dt.annee, dt.mois, dt.nom_mois
        ORDER BY dt.mois DESC
    ''', annee)

    service_rows = await query_as_role(role_pg, '''
        SELECT s.nom_service AS service, COUNT(*) AS nb
        FROM faits_consultation fc
        JOIN dim_service s ON fc.service_id = s.service_id
        JOIN dim_temps dt ON fc.temps_id = dt.temps_id
        WHERE dt.annee = $1
        GROUP BY s.nom_service
        ORDER BY nb DESC
        LIMIT 6
    ''', annee)

    rapports = []
    for i, r in enumerate(mois_rows):
        mois_label = _mois_court(int(r.get('mois') or 0), r.get('nom_mois') or '')
        montant = float(r.get('montant') or 0)
        nb = int(r.get('nb_consultations') or 0)
        rapports.append({
            'id': i + 1,
            'titre': f'Rapport mensuel — {mois_label} {annee}',
            'type': 'Financier',
            'date': f"{int(r.get('mois') or 1):02d}/{annee}",
            'statut': 'Généré',
            'taille': f"{max(1, nb // 100)}.{nb % 10} MB",
            'consultations': nb,
            'montant': montant,
        })

    if service_rows:
        rapports.append({
            'id': len(rapports) + 1,
            'titre': f'Bilan consultations {annee}',
            'type': 'Médical',
            'date': f"31/12/{annee}",
            'statut': 'Généré',
            'taille': '1.8 MB',
            'consultations': sum(int(r.get('nb') or 0) for r in service_rows),
            'montant': 0,
        })

    activite = [
        {
            'mois': _mois_court(int(r.get('mois') or 0), r.get('nom_mois') or ''),
            'rapports': max(1, int(r.get('nb_consultations') or 0) // 400),
        }
        for r in sorted(mois_rows, key=lambda x: int(x.get('mois') or 0))
    ]

    type_counts: dict = {'Financier': 0, 'Médical': 0, 'RH': 0, 'Audit': 0}
    for rp in rapports:
        t = rp.get('type') or 'Financier'
        type_counts[t] = type_counts.get(t, 0) + 1
    par_type = [{'type': k, 'count': v} for k, v in type_counts.items() if v > 0]

    await audit(user, 'SELECT', 'administratif_rapports', request.client.host, len(rapports))
    return {
        'annee': annee,
        'rapports': rapports,
        'activite': activite,
        'par_type': par_type,
        'total': len(rapports),
    }
