'use client';

import { useState, useCallback } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

interface KPI {
  total_consultations: number;
  total_patients: number;
  diagnostics_count: number;
}

interface Tendance {
  mois: string;
  consultations: number;
  patients: number;
}

const tendancesDefaut: Tendance[] = [
  { mois: 'Jan', consultations: 320, patients: 180 },
  { mois: 'Fév', consultations: 280, patients: 160 },
  { mois: 'Mar', consultations: 410, patients: 220 },
  { mois: 'Avr', consultations: 390, patients: 210 },
  { mois: 'Mai', consultations: 450, patients: 240 },
  { mois: 'Jun', consultations: 380, patients: 200 },
  { mois: 'Jul', consultations: 290, patients: 150 },
  { mois: 'Aoû', consultations: 310, patients: 170 },
  { mois: 'Sep', consultations: 420, patients: 230 },
  { mois: 'Oct', consultations: 460, patients: 250 },
  { mois: 'Nov', consultations: 400, patients: 215 },
  { mois: 'Déc', consultations: 350, patients: 190 },
];

const recentPatients = [
  { nom: 'El Idrissi Youssef', service: 'Cardiologie', heure: '09:00', statut: 'Consulté' },
  { nom: 'Benali Fatima', service: 'Neurologie', heure: '10:30', statut: 'En attente' },
  { nom: 'Alaoui Mohamed', service: 'Pédiatrie', heure: '11:00', statut: 'Consulté' },
  { nom: 'Chraibi Sara', service: 'Cardiologie', heure: '14:00', statut: 'Programmé' },
];

const weekDays = [
  { day: 'Lun', date: '07' },
  { day: 'Mar', date: '08', active: true },
  { day: 'Mer', date: '09' },
  { day: 'Jeu', date: '10' },
  { day: 'Ven', date: '11' },
  { day: 'Sam', date: '12' },
  { day: 'Dim', date: '13' },
];

const appointments = [
  { name: 'El Idrissi Youssef', type: 'Consultation', time: '09:15 AM' },
  { name: 'Benali Fatima', type: 'Consultation', time: '10:30 AM' },
  { name: 'Alaoui Mohamed', type: 'Consultation', time: '12:30 PM' },
];

export default function DashboardMedecin() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [tendances, setTendances] = useState<Tendance[]>(tendancesDefaut);
  const [userName, setUserName] = useState('Benali');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [kpiRes, tendRes] = await Promise.all([
        api.get('/api/dashboard/kpis?annee=2024'),
        api.get('/api/dashboard/tendances'),
      ]);
      if (kpiRes.data?.kpis) {
        const d = kpiRes.data.kpis;
        setKpis({
          total_consultations: d.activite?.total || 0,
          patients_uniques: d.activite?.patients_uniques || 0,
          duree_sejour_moy: d.activite?.duree_moy || 0,
          urgences_count: d.activite?.urgences || 0
        });
      }
      if (tendRes.data?.data?.length > 0) setTendances(tendRes.data.data);
    } catch {}
  }, []);

  // Initialisation Keycloak une seule fois
  useState(() => {
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (authenticated) {
        setIsAuthenticated(true);
        setUserName(keycloak.tokenParsed?.preferred_username || 'Benali');
        fetchData();
      }
    }).catch(() => {});
  });

  // Refresh automatique toutes les 30 secondes
  useAutoRefresh(fetchData, 30);

  return (
    <div style={{ background: '#E8F0FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="medecin" activeItem="Dashboard" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
                Medical Dashboard
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RefreshButton onRefresh={fetchData} color="#1565C0" />
              <div style={{
                background: 'white', borderRadius: '12px', padding: '10px 20px',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Rechercher...</span>
              </div>
            </div>
          </div>

          {/* Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 60%, #42A5F5 100%)',
            borderRadius: '20px', padding: '24px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px', boxShadow: '0 8px 32px rgba(21,101,192,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, Dr. {userName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Vous avez <strong>7 patients</strong> aujourd'hui.<br/>
                N'oubliez pas de compléter les dossiers.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
                padding: '4px 12px', width: 'fit-content'
              }}>
                <span style={{ color: '#4ADE80', fontSize: '14px' }}>★</span>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>4.5 (124 avis)</span>
              </div>
            </div>
            <div style={{
              width: '120px', height: '120px',
              background: 'rgba(255,255,255,0.15)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px'
            }}>👨‍⚕️</div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Nouveaux Patients', value: kpis?.total_patients ?? '12', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>, change: '+8%' },
              { label: 'Consultations', value: kpis?.total_consultations ?? '54', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>, change: '+12%' },
              { label: 'Diagnostics', value: kpis?.diagnostics_count ?? '1,893', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/></svg>, change: '+5%' },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                background: 'white', borderRadius: '16px', padding: '18px',
                display: 'flex', alignItems: 'center', gap: '14px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>{kpi.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '24px', fontWeight: '800' }}>{kpi.value}</p>
                </div>
                <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: '600' }}>
                  ↑ {kpi.change}
                </span>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Évolution mensuelle</p>
                <span style={{ background: '#EEF2FF', color: '#1565C0', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>2024</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tendances}>
                  <defs>
                    <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#1565C0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="consultations" stroke="#1565C0" strokeWidth={2.5} fill="url(#gc)" name="Consultations" />
                  <Area type="monotone" dataKey="patients" stroke="#42A5F5" strokeWidth={2} fill="none" name="Patients" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #1565C0, #1976D2)',
              borderRadius: '16px', padding: '20px',
              boxShadow: '0 4px 16px rgba(21,101,192,0.3)'
            }}>
              <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Consultations / Trimestre</p>
              <p style={{ margin: '0 0 16px', color: 'white', fontSize: '32px', fontWeight: '800' }}>85%</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={tendances.filter((_, i) => i % 3 === 0)}>
                  <Bar dataKey="consultations" fill="rgba(255,255,255,0.4)" radius={[6,6,0,0]} />
                  <XAxis dataKey="mois" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(21,101,192,0.9)', border: 'none', borderRadius: '12px', color: 'white' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Patients récents */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Patients du jour</p>
              <span style={{ color: '#1565C0', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>Voir tout →</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentPatients.map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: '12px', background: '#F9FAFB'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '700', fontSize: '14px'
                    }}>{p.nom.charAt(0)}</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{p.nom}</p>
                      <p style={{ margin: 0, color: '#9CA3AF', fontSize: '11px' }}>{p.service}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>{p.heure}</p>
                    <span style={{
                      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                      background: p.statut === 'Consulté' ? '#dcfce7' : p.statut === 'En attente' ? '#fef9c3' : '#ede9fe',
                      color: p.statut === 'Consulté' ? '#16a34a' : p.statut === 'En attente' ? '#ca8a04' : '#7c3aed'
                    }}>{p.statut}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
              }}>👨‍⚕️</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Dr. {userName}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>Médecin</p>
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ADE80' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              {[{ label: 'Opér.', value: '103' }, { label: 'Hôpital', value: '3' }, { label: 'Âge', value: '35' }, { label: 'Grade', value: 'Senior' }].map((s) => (
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
                <div key={d.day} style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#9CA3AF' }}>{d.day}</p>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: d.active ? '#1565C0' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: d.active ? '700' : '400', color: d.active ? 'white' : '#374151' }}>{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1565C0, #1976D2)',
            borderRadius: '16px', padding: '16px',
            boxShadow: '0 4px 16px rgba(21,101,192,0.3)'
          }}>
            <p style={{ margin: '0 0 2px', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Prochain RDV</p>
            <p style={{ margin: '0 0 4px', color: 'white', fontWeight: '700', fontSize: '14px' }}>{appointments[0].name}</p>
            <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{appointments[0].type}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{appointments[0].time}</span>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', padding: '3px 10px', borderRadius: '20px' }}>Détails →</span>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1 }}>
            <p style={{ margin: '0 0 14px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Rendez-vous</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {appointments.slice(1).map((apt, i) => (
                <div key={i} style={{ background: '#F9FAFB', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1565C0"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1a1a2e' }}>{apt.type}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6B7280' }}>{apt.name}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>{apt.time}</p>
                    <span style={{ color: '#1565C0', fontSize: '10px', cursor: 'pointer' }}>Détails →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}