'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, Legend
} from 'recharts';

const COLORS = ['#5B21B6', '#7C3AED', '#A78BFA', '#DDD6FE', '#1565C0', '#0EA5E9'];

const dataAge = [
  { tranche: '0-18', count: 320, femmes: 160, hommes: 160 },
  { tranche: '19-35', count: 580, femmes: 290, hommes: 290 },
  { tranche: '36-50', count: 750, femmes: 380, hommes: 370 },
  { tranche: '51-65', count: 620, femmes: 300, hommes: 320 },
  { tranche: '65+', count: 430, femmes: 220, hommes: 210 },
];

const dataRegion = [
  { region: 'Rabat', patients: 1250, hommes: 620, femmes: 630 },
  { region: 'Casablanca', patients: 980, hommes: 500, femmes: 480 },
  { region: 'Fès', patients: 720, hommes: 360, femmes: 360 },
  { region: 'Marrakech', patients: 650, hommes: 320, femmes: 330 },
  { region: 'Tanger', patients: 480, hommes: 240, femmes: 240 },
];

const dataDiagnostics = [
  { name: 'Cardiologie', value: 35 },
  { name: 'Neurologie', value: 22 },
  { name: 'Diabète', value: 18 },
  { name: 'Respiratoire', value: 12 },
  { name: 'Autres', value: 13 },
];

const dataTendance = [
  { mois: 'Jan', cas: 420, gueris: 380 },
  { mois: 'Fév', cas: 380, gueris: 340 },
  { mois: 'Mar', cas: 510, gueris: 460 },
  { mois: 'Avr', cas: 490, gueris: 445 },
  { mois: 'Mai', cas: 550, gueris: 500 },
  { mois: 'Jun', cas: 480, gueris: 430 },
  { mois: 'Jul', cas: 390, gueris: 355 },
  { mois: 'Aoû', cas: 410, gueris: 375 },
];

export default function ChercheurAnalyses() {
  const [activeAnalyse, setActiveAnalyse] = useState('age');

  const fetchData = useCallback(async () => {
    try {
      await api.get('/api/dashboard/tendances');
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  return (
    <div style={{ background: '#EDE9FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="chercheur" activeItem="Analyses" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
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
          {[
            { label: 'Total Patients', value: '5,000', icon: '👥', change: '+8%' },
            { label: 'Âge Moyen', value: '44 ans', icon: '📊', change: '+1.2' },
            { label: 'Taux Guérison', value: '91%', icon: '💊', change: '+2%' },
            { label: 'Pathologies', value: '30', icon: '🔬', change: '+3' },
          ].map((kpi) => (
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
                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '600' }}>↑ {kpi.change}</span>
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
                      width: `${(d.count / 750) * 100}%`
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