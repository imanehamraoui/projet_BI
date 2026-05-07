import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime, timedelta
import json
import random

# ══════════════════════════════════════════════
# CONNEXION ELASTICSEARCH (données réelles Marwa)
# ══════════════════════════════════════════════

def get_real_audit_logs():
    """Récupère les vrais logs depuis Elasticsearch de Marwa"""
    try:
        from elasticsearch import Elasticsearch
        es = Elasticsearch("http://localhost:9200")
        result = es.search(index="audit_logs", size=1000, body={"query": {"match_all": {}}})
        logs = []
        for hit in result["hits"]["hits"]:
            logs.append(hit["_source"])
        print(f"✅ {len(logs)} logs récupérés depuis Elasticsearch")
        return pd.DataFrame(logs)
    except Exception as e:
        print(f"⚠️  Elasticsearch non disponible ({e})")
        print("🔄 Utilisation des données simulées...")
        return generate_audit_logs_simules()

# ══════════════════════════════════════════════
# DONNÉES SIMULÉES (fallback si Marwa pas prête)
# ══════════════════════════════════════════════

def generate_audit_logs_simules(n=500):
    """Génère des logs simulés si Elasticsearch non disponible"""
    users = [
        {"username": "dr.benali", "role": "medecin"},
        {"username": "dr.alaoui", "role": "medecin"},
        {"username": "marie.admin", "role": "administratif"},
        {"username": "prof.rhanem", "role": "chercheur"},
        {"username": "sophie.inf", "role": "infirmier"},
        {"username": "directeur.chu", "role": "directeur"},
    ]
    actions = ["GET /api/patients", "GET /api/dashboard/kpis",
               "GET /api/patients/{id}", "GET /api/audit"]
    logs = []
    base_time = datetime.now() - timedelta(days=30)
    for i in range(n):
        user = random.choice(users)
        hour = random.randint(0, 23)
        is_anomaly = random.random() < 0.10
        log = {
            "username": user["username"],
            "role": user["role"],
            "action": random.choice(actions),
            "hour": hour if not is_anomaly else random.randint(0, 5),
            "nb_requests": random.randint(1, 10) if not is_anomaly else random.randint(50, 200),
            "timestamp": (base_time + timedelta(
                days=random.randint(0, 30), hours=hour
            )).isoformat(),
        }
        logs.append(log)
    return pd.DataFrame(logs)

# ══════════════════════════════════════════════
# ISOLATION FOREST
# ══════════════════════════════════════════════

def detect_anomalies(df):
    """Détecte les accès anormaux avec Isolation Forest"""
    features = df[["hour", "nb_requests"]].copy()
    role_map = {
        "medecin": 1,
        "administratif": 2,
        "chercheur": 3,
        "infirmier": 4,
        "directeur": 5
    }
    features["role_encoded"] = df["role"].map(role_map).fillna(0)
    model = IsolationForest(
        contamination=0.1,
        random_state=42,
        n_estimators=100
    )
    predictions = model.fit_predict(features)
    scores = model.score_samples(features)
    df["anomaly_predicted"] = predictions
    df["anomaly_score_raw"] = scores
    min_score = scores.min()
    max_score = scores.max()
    df["risk_score"] = ((scores - max_score) / (min_score - max_score) * 100).round(1)
    df["is_anomaly"] = predictions == -1
    return df, model

# ══════════════════════════════════════════════
# RAPPORT
# ══════════════════════════════════════════════

def generate_report(df):
    """Génère un rapport des anomalies détectées"""
    anomalies = df[df["is_anomaly"] == True].copy()
    print("\n" + "="*60)
    print("   RAPPORT DÉTECTION D'ANOMALIES — Hôpital Ibn Sina")
    print("="*60)
    print(f"\n📊 Total logs analysés    : {len(df)}")
    print(f"🚨 Anomalies détectées    : {len(anomalies)}")
    print(f"✅ Accès normaux          : {len(df) - len(anomalies)}")
    print(f"📈 Taux d'anomalies       : {len(anomalies)/len(df)*100:.1f}%")
    print("\n" + "-"*60)
    print("🔴 TOP 10 ACCÈS LES PLUS SUSPECTS")
    print("-"*60)
    top_anomalies = anomalies.nlargest(10, "risk_score")[
        ["username", "role", "action", "hour", "nb_requests", "risk_score"]
    ]
    for _, row in top_anomalies.iterrows():
        print(f"\n👤 Utilisateur  : {row['username']} ({row['role']})")
        print(f"   Action       : {row['action']}")
        print(f"   Heure        : {row['hour']}h00")
        print(f"   Nb requêtes  : {row['nb_requests']}")
        print(f"   Score risque : {row['risk_score']}/100 🚨")
    print("\n" + "-"*60)
    print("📊 ANOMALIES PAR UTILISATEUR")
    print("-"*60)
    by_user = anomalies.groupby(["username", "role"]).size().reset_index(name="nb_anomalies")
    by_user = by_user.sort_values("nb_anomalies", ascending=False)
    for _, row in by_user.iterrows():
        print(f"  {row['username']} ({row['role']}) : {row['nb_anomalies']} anomalies")
    results = {
        "generated_at": datetime.now().isoformat(),
        "total_logs": len(df),
        "total_anomalies": len(anomalies),
        "anomaly_rate": round(len(anomalies)/len(df)*100, 1),
        "top_anomalies": top_anomalies.to_dict(orient="records")
    }
    with open("anomaly_report.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("\n✅ Rapport sauvegardé dans anomaly_report.json")
    print("="*60 + "\n")
    return results

# ══════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════

if __name__ == "__main__":
    print("🔄 Récupération des logs d'audit...")
    df = get_real_audit_logs()

    print("🤖 Entraînement du modèle Isolation Forest...")
    df, model = detect_anomalies(df)

    print("📝 Génération du rapport...")
    results = generate_report(df)

    print("🎯 Détection d'anomalies terminée !")