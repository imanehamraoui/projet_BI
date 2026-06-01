'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { getChercheurApiError } from '@/lib/chercheur-utils';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#5B21B6', '#7C3AED', '#A78BFA', '#DDD6FE', '#1565C0', '#0EA5E9'];

interface AgeRow { tranche: string; count: number; femmes: number; hommes: number }
interface RegionRow { region: string; patients: number; hommes: number; femmes: number }
interface DiagRow { name: string; value: number }
interface TendanceRow { mois: string; cas: number; gueris: number }
interface Kpis { total_patients: number; age_moyen: number; taux_guerison: number; pathologies: number }

export default function ChercheurAnalyses() {
  const [activeAnalyse, setActiveAnalyse] = useState('age');
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [dataAge, setDataAge] = useState<AgeRow[]>([]);
  const [dataRegion, setDataRegion] = useState<RegionRow[]>([]);
  const [dataDiagnostics, setDataDiagnostics] = useState<DiagRow[]>([]);
  const [dataTendance, setDataTendance] = useState<TendanceRow[]>([]);

  const maxAgeCount = useMemo(
    () => Math.max(...dataAge.map((d) => d.count), 1),
    [dataAge]
  );

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      setError('');
      const res = await api.get('/api/chercheur/analyses?annee=2024');
      const data = res.data;
      if (data.kpis) setKpis(data.kpis);
      if (data.par_age) setDataAge(data.par_age);
      if (data.par_region) setDataRegion(data.par_region);
      if (data.diagnostics) setDataDiagnostics(data.diagnostics);
      if (data.tendances) setDataTendance(data.tendances);
    } catch (e) {
      setError(getChercheurApiError(e));
    }
  }, []);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) fetchData();
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 30);

  const kpiCards = [
    { label: 'Total Patients', value: kpis ? kpis.total_patients.toLocaleString('fr-FR') : '—', icon: '👥' },
    { label: 'Âge Moyen', value: kpis ? `${kpis.age_moyen} ans` : '—', icon: '📊' },
    { label: 'Taux Guérison', value: kpis ? `${kpis.taux_guerison}%` : '—', icon: '💊' },
    { label: 'Pathologies', value: kpis ? String(kpis.pathologies) : '—', icon: '🔬' },
  ];

  return (
    <div style={{ background: '#EDE9FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="chercheur" activeItem="Analyses" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
            padding: '12px 16px', marginBottom: '16px', color: '#B91C1C', fontSize: '13px'
          }}>{error}</div>
        )}
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
              Analyses Statistiques
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              Données anonymisées — Hôpital Ibn Sina 2024
            </p>
          </div>
          <RefreshButton onRefresh={fetchData} color="#5B21B6" />
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {kpiCards.map((kpi) => (
            <div key={kpi.label} style={{
              background: 'white', borderRadius: '14px', padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: '#F5F3FF', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px'
              }}>{kpi.icon}</div>
              <div>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
                <p style={{ margin: 0, color: '#5B21B6', fontSize: '22px', fontWeight: '800' }}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Analyses */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { key: 'age', label: '👥 Par Âge' },
            { key: 'region', label: '🗺️ Par Région' },
            { key: 'diagnostic', label: '🔬 Diagnostics' },
            { key: 'tendance', label: '📈 Tendances' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveAnalyse(tab.key)} style={{
              padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: activeAnalyse === tab.key ? '#5B21B6' : 'white',
              color: activeAnalyse === tab.key ? 'white' : '#6B7280',
              fontSize: '12px', fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Graphiques selon tab actif */}
        {activeAnalyse === 'age' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
                Distribution par tranche d'âge
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dataAge}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="tranche" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend />
                  <Bar dataKey="femmes" fill="#7C3AED" radius={[4,4,0,0]} name="Femmes" />
                  <Bar dataKey="hommes" fill="#A78BFA" radius={[4,4,0,0]} name="Hommes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
                Résumé statistique
              </p>
              {dataAge.map((d) => (
                <div key={d.tranche} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: '600' }}>{d.tranche} ans</span>
                    <span style={{ fontSize: '12px', color: '#5B21B6', fontWeight: '700' }}>{d.count} patients</span>
                  </div>
                  <div style={{ background: '#F5F3FF', borderRadius: '4px', height: '6px' }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
                      borderRadius: '4px', height: '6px',
                      width: `${(d.count / maxAgeCount) * 100}%`
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAnalyse === 'region' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
                Répartition géographique
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dataRegion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="region" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend />
                  <Bar dataKey="hommes" fill="#5B21B6" radius={[4,4,0,0]} name="Hommes" />
                  <Bar dataKey="femmes" fill="#A78BFA" radius={[4,4,0,0]} name="Femmes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
                Top régions
              </p>
              {dataRegion.map((r, i) => (
                <div key={r.region} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid #F3F4F6'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '12px', fontWeight: '700'
                    }}>{i + 1}</div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e' }}>{r.region}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#5B21B6' }}>{r.patients}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAnalyse === 'diagnostic' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
                Répartition des pathologies
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={dataDiagnostics} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {dataDiagnostics.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
                Détail pathologies
              </p>
              {dataDiagnostics.map((d, i) => (
                <div key={d.name} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[i] }} />
                      <span style={{ fontSize: '13px', color: '#374151', fontWeight: '600' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: COLORS[i], fontWeight: '700' }}>{d.value}%</span>
                  </div>
                  <div style={{ background: '#F5F3FF', borderRadius: '4px', height: '8px' }}>
                    <div style={{
                      background: COLORS[i], borderRadius: '4px', height: '8px',
                      width: `${d.value}%`, transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeAnalyse === 'tendance' && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
                Tendances cas — guérisons 2024
              </p>
              <span style={{ background: '#F5F3FF', color: '#5B21B6', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                Taux guérison moyen : 91%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dataTendance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="cas" stroke="#5B21B6" strokeWidth={2.5} dot={{ fill: '#5B21B6', r: 4 }} name="Nouveaux cas" />
                <Line type="monotone" dataKey="gueris" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 4 }} name="Guérisons" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}