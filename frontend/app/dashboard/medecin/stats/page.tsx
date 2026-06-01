'use client';

import { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const SERVICE_COLORS = ['#1565C0', '#7C3AED', '#0EA5E9', '#94A3B8', '#16a34a', '#CA8A04'];

interface StatsKpis {
  total_consultations: number;
  total_consultations_change: string;
  nouveaux_patients: number;
  nouveaux_patients_change: string;
  satisfaction: number;
  satisfaction_change: string;
  duree_moy_rdv_min: number;
  duree_moy_rdv_change: string;
}

interface EvolutionPoint {
  mois: string;
  consultations: number;
  nouveaux: number;
  suivis: number;
}

interface ServicePoint {
  name: string;
  value: number;
  nb?: number;
  color?: string;
}

interface AgePoint {
  tranche: string;
  patients: number;
}

interface SatisfactionPoint {
  mois: string;
  score: number;
}

const defaultEvolution: EvolutionPoint[] = [];
const defaultServices: ServicePoint[] = [];
const defaultAge: AgePoint[] = [];
const defaultSatisfaction: SatisfactionPoint[] = [];

function getChangeBadge(change: string) {
  if (!change || change === '—' || change === 'N/A') {
    return { bg: '#F3F4F6', color: '#6B7280', label: change || '—' };
  }
  if (change.startsWith('-')) {
    return { bg: '#FEE2E2', color: '#dc2626', label: change };
  }
  if (change.includes('min') || change.includes('.') && !change.includes('%')) {
    return { bg: '#DCFCE7', color: '#16a34a', label: change.startsWith('+') ? change : `+${change}` };
  }
  return { bg: '#DCFCE7', color: '#16a34a', label: change.startsWith('+') ? change : `+${change}` };
}

export default function MedecinStats() {
  const [annee] = useState(2024);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<StatsKpis | null>(null);
  const [consultationsData, setConsultationsData] = useState(defaultEvolution);
  const [servicesData, setServicesData] = useState(defaultServices);
  const [ageData, setAgeData] = useState(defaultAge);
  const [satisfactionData, setSatisfactionData] = useState(defaultSatisfaction);

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      const res = await api.get(`/api/dashboard/stats?annee=${annee}`);
      const data = res.data;

      if (data?.kpis) setKpis(data.kpis);
      if (data?.evolution) setConsultationsData(data.evolution);
      if (data?.par_service) {
        setServicesData(
          data.par_service.map((s: ServicePoint, i: number) => ({
            ...s,
            color: SERVICE_COLORS[i % SERVICE_COLORS.length],
          }))
        );
      }
      if (data?.par_age) setAgeData(data.par_age);
      if (data?.satisfaction) setSatisfactionData(data.satisfaction);
    } catch {
      // keep fallback empty state
    } finally {
      setLoading(false);
    }
  }, [annee]);

  useAutoRefresh(fetchData, 60);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpiCards = [
    {
      label: 'Total Consultations',
      value: kpis ? kpis.total_consultations.toLocaleString('fr-FR') : '—',
      change: kpis?.total_consultations_change ?? '—',
      icon: '📋',
      color: '#1565C0',
      bg: '#EEF2FF',
    },
    {
      label: 'Nouveaux Patients',
      value: kpis ? String(kpis.nouveaux_patients) : '—',
      change: kpis?.nouveaux_patients_change ?? '—',
      icon: '👥',
      color: '#16a34a',
      bg: '#F0FDF4',
    },
    {
      label: 'Taux Satisfaction',
      value: kpis ? `${kpis.satisfaction}/5` : '—',
      change: kpis?.satisfaction_change ?? '—',
      icon: '⭐',
      color: '#CA8A04',
      bg: '#FEFCE8',
    },
    {
      label: 'Durée Moy. RDV',
      value: kpis ? `${kpis.duree_moy_rdv_min} min` : '—',
      change: kpis?.duree_moy_rdv_change ?? '—',
      icon: '⏱️',
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
  ];

  return (
    <div style={{ background: '#E8F0FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="medecin" activeItem="Stats" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
              Statistiques
            </h1>
            <p suppressHydrationWarning style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              Analyse complète de votre activité — {annee}
              {loading ? ' (chargement...)' : ` · Mis à jour : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          </div>
          <RefreshButton onRefresh={fetchData} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {kpiCards.map((kpi) => {
            const badge = getChangeBadge(kpi.change);
            return (
            <div key={kpi.label} style={{
              background: 'white', borderRadius: '16px', padding: '18px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: kpi.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '18px'
                }}>{kpi.icon}</div>
                <span style={{
                  background: badge.bg, color: badge.color,
                  borderRadius: '20px', padding: '2px 8px',
                  fontSize: '10px', fontWeight: '600'
                }}>{badge.label}</span>
              </div>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '22px', fontWeight: '800' }}>{kpi.value}</p>
            </div>
          );})}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
                Évolution des consultations
              </p>
              <span style={{ background: '#EEF2FF', color: '#1565C0', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>{annee}</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={consultationsData}>
                <defs>
                  <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#1565C0" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [`${value ?? 0} consultations`, '']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Area type="monotone" dataKey="consultations" stroke="#1565C0" strokeWidth={2.5} fill="url(#gc)" name="Total" />
                <Area type="monotone" dataKey="nouveaux" stroke="#16a34a" strokeWidth={2} fill="url(#gn)" name="Nouveaux" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
              Répartition par service
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={servicesData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                  {servicesData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color || SERVICE_COLORS[index % SERVICE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, _name, props) => [
                  `${(props as { payload?: ServicePoint }).payload?.nb ?? 0} consultations (${value ?? 0}%)`,
                  (props as { payload?: ServicePoint }).payload?.name ?? '',
                ]} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {servicesData.map((s) => (
                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: '11px', color: '#6B7280' }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>
                    {s.nb ?? 0} ({Number(s.value).toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
              Distribution par âge
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="tranche" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="patients" fill="#1565C0" radius={[4, 4, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 4px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
              Score de satisfaction
            </p>
            <p style={{ margin: '0 0 16px', color: '#6B7280', fontSize: '12px' }}>
              Note moyenne des patients /5 (basée sur score Glasgow)
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={satisfactionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis domain={[3.5, 5]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#CA8A04" strokeWidth={2.5}
                  dot={{ fill: '#CA8A04', r: 4 }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
