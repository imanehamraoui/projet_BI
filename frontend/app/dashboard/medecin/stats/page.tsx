'use client';

import Sidebar from '@/components/Sidebar';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const consultationsData = [
  { mois: 'Jan', consultations: 320, nouveaux: 80, suivis: 240 },
  { mois: 'Fév', consultations: 280, nouveaux: 60, suivis: 220 },
  { mois: 'Mar', consultations: 410, nouveaux: 110, suivis: 300 },
  { mois: 'Avr', consultations: 390, nouveaux: 95, suivis: 295 },
  { mois: 'Mai', consultations: 450, nouveaux: 120, suivis: 330 },
  { mois: 'Jun', consultations: 380, nouveaux: 85, suivis: 295 },
  { mois: 'Jul', consultations: 290, nouveaux: 70, suivis: 220 },
  { mois: 'Aoû', consultations: 310, nouveaux: 75, suivis: 235 },
];

const servicesData = [
  { name: 'Cardiologie', value: 45, color: '#1565C0' },
  { name: 'Neurologie', value: 28, color: '#7C3AED' },
  { name: 'Pédiatrie', value: 15, color: '#0EA5E9' },
  { name: 'Autres', value: 12, color: '#94A3B8' },
];

const ageData = [
  { tranche: '0-18', patients: 85 },
  { tranche: '19-35', patients: 210 },
  { tranche: '36-50', patients: 380 },
  { tranche: '51-65', patients: 290 },
  { tranche: '65+', patients: 180 },
];

const satisfactionData = [
  { mois: 'Jan', score: 4.2 },
  { mois: 'Fév', score: 4.4 },
  { mois: 'Mar', score: 4.1 },
  { mois: 'Avr', score: 4.6 },
  { mois: 'Mai', score: 4.5 },
  { mois: 'Jun', score: 4.8 },
  { mois: 'Jul', score: 4.7 },
  { mois: 'Aoû', score: 4.5 },
];

export default function MedecinStats() {
  return (
    <div style={{ background: '#E8F0FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="medecin" activeItem="Stats" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
            Statistiques
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
            Analyse complète de votre activité — 2024
          </p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[
            { label: 'Total Consultations', value: '2,830', change: '+12%', icon: '📋', color: '#1565C0', bg: '#EEF2FF' },
            { label: 'Nouveaux Patients', value: '695', change: '+8%', icon: '👥', color: '#16a34a', bg: '#F0FDF4' },
            { label: 'Taux Satisfaction', value: '4.5/5', change: '+0.3', icon: '⭐', color: '#CA8A04', bg: '#FEFCE8' },
            { label: 'Durée Moy. RDV', value: '28 min', change: '-2 min', icon: '⏱️', color: '#7C3AED', bg: '#F5F3FF' },
          ].map((kpi) => (
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
                  background: '#DCFCE7', color: '#16a34a',
                  borderRadius: '20px', padding: '2px 8px',
                  fontSize: '10px', fontWeight: '600'
                }}>↑ {kpi.change}</span>
              </div>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '22px', fontWeight: '800' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Area Chart */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
                Évolution des consultations
              </p>
              <span style={{ background: '#EEF2FF', color: '#1565C0', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>2024</span>
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
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Area type="monotone" dataKey="consultations" stroke="#1565C0" strokeWidth={2.5} fill="url(#gc)" name="Total" />
                <Area type="monotone" dataKey="nouveaux" stroke="#16a34a" strokeWidth={2} fill="url(#gn)" name="Nouveaux" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
              Répartition par service
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={servicesData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                  {servicesData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {servicesData.map((s) => (
                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: '11px', color: '#6B7280' }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Bar Chart Age */}
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
                <Bar dataKey="patients" fill="#1565C0" radius={[4,4,0,0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart Satisfaction */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 4px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
              Score de satisfaction
            </p>
            <p style={{ margin: '0 0 16px', color: '#6B7280', fontSize: '12px' }}>
              Note moyenne des patients /5
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