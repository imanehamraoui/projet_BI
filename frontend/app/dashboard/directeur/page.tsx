'use client';

import { useState, useCallback } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface KPI {
  total_consultations: number;
  total_patients: number;
  diagnostics_count: number;
  revenus_total?: number;
}

interface AuditLog {
  user: string;
  action: string;
  timestamp: string;
  resource: string;
}

const tendances = [
  { mois: 'Jan', consultations: 320, revenus: 85000 },
  { mois: 'Fév', consultations: 280, revenus: 92000 },
  { mois: 'Mar', consultations: 410, revenus: 78000 },
  { mois: 'Avr', consultations: 390, revenus: 105000 },
  { mois: 'Mai', consultations: 450, revenus: 98000 },
  { mois: 'Jun', consultations: 380, revenus: 112000 },
  { mois: 'Jul', consultations: 290, revenus: 88000 },
  { mois: 'Aoû', consultations: 310, revenus: 95000 },
];

const pieData = [
  { name: 'Médecins', value: 28 },
  { name: 'Infirmiers', value: 85 },
  { name: 'Administratifs', value: 42 },
  { name: 'Chercheurs', value: 12 },
];

const COLORS = ['#1565C0', '#0EA5E9', '#16a34a', '#7C3AED'];

const weekDays = [
  { day: 'Lun', date: '07' },
  { day: 'Mar', date: '08', active: true },
  { day: 'Mer', date: '09' },
  { day: 'Jeu', date: '10' },
  { day: 'Ven', date: '11' },
  { day: 'Sam', date: '12' },
  { day: 'Dim', date: '13' },
];

const auditSimules = [
  { user: 'dr.benali', action: 'GET /api/patients', timestamp: '08:23', resource: 'Patients' },
  { user: 'marie.admin', action: 'GET /api/dashboard/kpis', timestamp: '08:45', resource: 'KPIs' },
  { user: 'prof.rhanem', action: 'GET /api/patients', timestamp: '09:12', resource: 'Recherche' },
  { user: 'sophie.inf', action: 'GET /api/patients/{id}', timestamp: '09:30', resource: 'Patient #142' },
  { user: 'dr.alaoui', action: 'GET /api/dashboard', timestamp: '10:05', resource: 'Dashboard' },
];

export default function DashboardDirecteur() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(auditSimules as any);
  const [userName, setUserName] = useState('Directeur');

  const fetchData = useCallback(async () => {
    try {
      const [kpiRes, auditRes] = await Promise.all([
        api.get('/api/dashboard/kpis?annee=2024'),
        api.get('/api/audit'),
      ]);
      
      if (kpiRes.data?.kpis) {
        const d = kpiRes.data.kpis;
        setKpis({
          total_consultations: d.activite?.total || 0,
          total_patients: d.activite?.patients_uniques || 0,
          diagnostics_count: d.top_diagnostics?.length || 0,
          revenus_total: d.financier?.chiffre_affaires || 0
        });
      }
      
      if (auditRes.data?.data?.length > 0) {
        setAuditLogs(auditRes.data.data.slice(0, 5));
      }
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  return (
    <div style={{
      background: '#F1F5F9',
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <Sidebar role="directeur" activeItem="Dashboard" />

      {/* MAIN */}
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
                Direction Générale
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RefreshButton onRefresh={fetchData} color="#1e293b" />
              <div style={{
                background: '#FEF9C3', borderRadius: '12px', padding: '8px 16px',
                border: '1px solid #FDE68A', fontSize: '13px', color: '#92400E', fontWeight: '700'
              }}>
                ⭐ Accès Complet
              </div>
            </div>
          </div>

          {/* Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 60%, #475569 100%)',
            borderRadius: '20px', padding: '24px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(30,41,59,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, {userName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Vue complète de l'hôpital Ibn Sina.<br/>
                Toutes les données sont accessibles.
              </p>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px', padding: '4px 12px'
              }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
                  ⭐ Directeur Général — Accès total
                </span>
              </div>
            </div>
            <div style={{
              width: '100px', height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '50px'
            }}>👨‍💼</div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Patients', value: kpis?.total_patients ?? '5,000', icon: '👥', color: '#1565C0', bg: '#EEF2FF', change: '+8%' },
              { label: 'Consultations', value: kpis?.total_consultations ?? '50,000', icon: '📋', color: '#16a34a', bg: '#F0FDF4', change: '+12%' },
              { label: 'Diagnostics', value: kpis?.diagnostics_count ?? '28,500', icon: '🔬', color: '#7C3AED', bg: '#F5F3FF', change: '+5%' },
              { label: 'Revenus', value: kpis?.revenus_total ? `${kpis.revenus_total}` : '430K MAD', icon: '💰', color: '#CA8A04', bg: '#FEFCE8', change: '+15%' },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                background: 'white', borderRadius: '16px', padding: '16px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
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
                <p style={{ margin: 0, color: '#6B7280', fontSize: '10px' }}>{kpi.label}</p>
                <p style={{ margin: 0, color: '#1a1a2e', fontSize: '22px', fontWeight: '800' }}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Consultations & Revenus</p>
                <span style={{ background: '#F1F5F9', color: '#1e293b', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>2024</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={tendances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="consultations" stroke="#1565C0" strokeWidth={2.5} dot={{ fill: '#1565C0', r: 3 }} name="Consultations" />
                  <Line type="monotone" dataKey="revenus" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 3 }} name="Revenus (MAD)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Personnel par rôle</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={5} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                {pieData.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }} />
                    <span style={{ fontSize: '10px', color: '#6B7280' }}>{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Trail */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>📋 Journal d'audit</p>
              <span style={{ background: '#FEF9C3', color: '#92400E', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                Directeur uniquement
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['Utilisateur', 'Action', 'Ressource', 'Heure'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#6B7280', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '600', color: '#1565C0' }}>{(log as any).user || (log as any).username}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>{log.action}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: '#EEF2FF', color: '#1565C0', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                        {log.resource}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#6B7280' }}>{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #1e293b, #475569)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
              }}>👨‍💼</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{userName}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>Directeur Général</p>
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ADE80' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              {[
                { label: 'Services', value: '22' },
                { label: 'Personnel', value: '285' },
                { label: 'Patients/j', value: '180' },
                { label: 'Grade', value: 'DG' },
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
                <div key={d.day} style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#9CA3AF' }}>{d.day}</p>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: d.active ? '#1e293b' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: d.active ? '700' : '400', color: d.active ? 'white' : '#374151' }}>{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(30,41,59,0.3)' }}>
            <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: '700' }}>
              ✅ Accès complet autorisé
            </p>
            {['Données patients', 'Diagnostics', 'Finances', 'Audit trail', 'Personnel', 'Statistiques'].map((item) => (
              <div key={item} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{item}</span>
                <span style={{ color: '#4ADE80', fontSize: '14px' }}>✅</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1 }}>
            <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
              📊 Répartition consultations
            </p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={tendances.slice(0, 6)}>
                <Bar dataKey="consultations" fill="#1e293b" radius={[4,4,0,0]} />
                <XAxis dataKey="mois" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}