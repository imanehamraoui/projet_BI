'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { getChercheurApiError, isChercheurAccount } from '@/lib/chercheur-utils';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface Patient {
  token_anonyme: string;
  age: number;
  sexe: string;
  region: string;
  diagnostic_code: string;
}

interface ChartAge { tranche: string; count: number }
interface ChartSexe { name: string; value: number }
interface ChartRegion { region: string; count: number }

const COLORS = ['#1565C0', '#7C3AED'];
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function DashboardChercheur() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [userName, setUserName] = useState('');
  const [dataAge, setDataAge] = useState<ChartAge[]>([]);
  const [dataSexe, setDataSexe] = useState<ChartSexe[]>([]);
  const [dataRegion, setDataRegion] = useState<ChartRegion[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [error, setError] = useState('');

  const weekDays = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        day: DAY_LABELS[d.getDay()],
        date: String(d.getDate()).padStart(2, '0'),
        active: d.toDateString() === today.toDateString(),
      };
    });
  }, []);

  const maxRegionCount = useMemo(
    () => Math.max(...dataRegion.map((r) => r.count), 1),
    [dataRegion]
  );

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      setError('');
      const res = await api.get('/api/chercheur/dashboard?limit=50');
      const data = res.data;

      if (data.patients) setPatients(data.patients.slice(0, 8));
      if (data.total_patients != null) setTotalPatients(data.total_patients);
      if (data.repartition_age?.length) setDataAge(data.repartition_age);
      if (data.repartition_sexe?.length) setDataSexe(data.repartition_sexe);
      if (data.repartition_region?.length) setDataRegion(data.repartition_region);
      if (data.username) setUserName(data.username);
      else if (data.profile?.nom) setUserName(data.profile.nom);
    } catch (e) {
      setError(getChercheurApiError(e));
    }
  }, []);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) {
        setUserName(keycloak.tokenParsed?.preferred_username || 'Chercheur');
        fetchData();
      }
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 30);

  const displayName = userName.replace(/^prof\.?/i, '').trim() || 'Chercheur';

  return (
    <div style={{
      background: '#EDE9FE',
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <Sidebar role="chercheur" activeItem="Dashboard" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
              padding: '12px 16px', marginBottom: '16px', color: '#B91C1C', fontSize: '13px'
            }}>{error}</div>
          )}
          {!isChercheurAccount() && !error && (
            <div style={{
              background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px',
              padding: '12px 16px', marginBottom: '16px', color: '#92400E', fontSize: '13px'
            }}>
              Mode consultation (compte médecin) — données anonymisées en lecture seule.
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
                Recherche Médicale
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                Données anonymisées — RGPD conforme
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RefreshButton onRefresh={fetchData} color="#5B21B6" />
              <div style={{
                background: '#EDE9FE', borderRadius: '12px', padding: '8px 16px',
                border: '1px solid #DDD6FE', fontSize: '13px', color: '#5B21B6', fontWeight: '600'
              }}>
                🔬 Mode Recherche
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 60%, #A78BFA 100%)',
            borderRadius: '20px', padding: '24px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(91,33,182,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, Prof. {displayName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Accès aux données anonymisées uniquement.<br />
                Toutes les données identifiantes sont masquées.
              </p>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px', padding: '4px 12px'
              }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
                  🔒 Données anonymisées RGPD
                </span>
              </div>
            </div>
            <div style={{
              width: '100px', height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '50px'
            }}>🔬</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Distribution par âge</p>
                <span style={{ background: '#EDE9FE', color: '#5B21B6', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>2024</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataAge}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="tranche" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Répartition Sexe</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={dataSexe} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                    {dataSexe.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                {dataSexe.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>{item.name} {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Données patients anonymisées</p>
              <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                🔒 Anonymisé
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F5F3FF' }}>
                  {['Token Anonyme', 'Âge', 'Sexe', 'Région', 'Code Diagnostic'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#5B21B6', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.length > 0 ? patients.map((p) => (
                  <tr key={p.token_anonyme} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>{p.token_anonyme}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>{p.age} ans</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>{p.sexe}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>{p.region}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', fontFamily: 'monospace', color: '#7C3AED' }}>{p.diagnostic_code}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                      Aucune donnée disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #5B21B6, #A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
              }}>🔬</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Prof. {displayName}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>Chercheur</p>
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ADE80' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              {[
                { label: 'Patients', value: totalPatients ? totalPatients.toLocaleString('fr-FR') : String(patients.length || '—') },
                { label: 'Régions', value: String(dataRegion.length || '—') },
                { label: 'Datasets', value: '12' },
                { label: 'Grade', value: 'Prof.' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '9px' }}>{s.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '12px', fontWeight: '700' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Calendrier</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {weekDays.map((d) => (
                <div key={d.day + d.date} style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#9CA3AF' }}>{d.day}</p>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: d.active ? '#5B21B6' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: d.active ? '700' : '400', color: d.active ? 'white' : '#374151' }}>{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(91,33,182,0.3)' }}>
            <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Distribution régionale</p>
            {dataRegion.map((r) => (
              <div key={r.region} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: 'white', fontSize: '11px' }}>{r.region}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{r.count}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '4px', height: '4px' }}>
                  <div style={{
                    background: 'white', borderRadius: '4px', height: '4px',
                    width: `${(r.count / maxRegionCount) * 100}%`
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>🔒 Accès refusés</p>
            {['Nom réel', 'Prénom', 'CIN', 'Téléphone', 'Finances'].map((item) => (
              <div key={item} style={{
                background: '#FFF1F2', border: '1px solid #FECDD3',
                borderRadius: '8px', padding: '8px 12px', marginBottom: '6px',
                display: 'flex', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '12px', color: '#374151' }}>{item}</span>
                <span>🔒</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
