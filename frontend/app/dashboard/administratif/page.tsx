'use client';

import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

interface KPI {
  total_consultations: number;
  total_patients: number;
  revenus_total?: number;
}

const dataFinances = [
  { mois: 'Jan', revenus: 85000, depenses: 62000 },
  { mois: 'Fév', revenus: 92000, depenses: 58000 },
  { mois: 'Mar', revenus: 78000, depenses: 71000 },
  { mois: 'Avr', revenus: 105000, depenses: 65000 },
  { mois: 'Mai', revenus: 98000, depenses: 59000 },
  { mois: 'Jun', revenus: 112000, depenses: 68000 },
  { mois: 'Jul', revenus: 88000, depenses: 55000 },
  { mois: 'Aoû', revenus: 95000, depenses: 61000 },
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

const recentOps = [
  { label: 'Paiement fournisseur', montant: '-12,500 MAD', statut: 'Payé', color: '#16a34a' },
  { label: 'Recette consultations', montant: '+48,200 MAD', statut: 'Reçu', color: '#1565C0' },
  { label: 'Salaires personnel', montant: '-95,000 MAD', statut: 'Payé', color: '#16a34a' },
  { label: 'Équipements médicaux', montant: '-28,750 MAD', statut: 'En attente', color: '#ca8a04' },
];

export default function DashboardAdministratif() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (authenticated) {
        setUserName(keycloak.tokenParsed?.preferred_username || 'Admin');
        api.get('/api/dashboard/kpis?annee=2024')
          .then((res) => setKpis(res.data))
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  return (
    <div style={{
      background: '#E8F5E9',
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      {/* SIDEBAR */}
      <div style={{
        width: '90px', background: 'white',
        borderRadius: '0 24px 24px 0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '28px 0', gap: '28px',
        boxShadow: '4px 0 20px rgba(21,101,192,0.08)',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, #166534, #16a34a)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 6px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <p style={{ fontSize: '10px', color: '#166534', fontWeight: '700', margin: 0 }}>Admin</p>
        </div>

        {[
          { label: 'Dashboard', active: true, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="#166534"/><rect x="14" y="3" width="7" height="7" rx="1" fill="#166534" opacity="0.4"/><rect x="3" y="14" width="7" height="7" rx="1" fill="#166534" opacity="0.4"/><rect x="14" y="14" width="7" height="7" rx="1" fill="#166534" opacity="0.4"/></svg> },
          { label: 'Finances', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg> },
          { label: 'Patients', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
          { label: 'Rapports', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: item.active ? '#DCFCE7' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: item.active ? '3px solid #166534' : '3px solid transparent'
            }}>
              {item.svg}
            </div>
            <span style={{ fontSize: '9px', color: item.active ? '#166534' : '#9CA3AF', fontWeight: item.active ? '700' : '400' }}>
              {item.label}
            </span>
          </div>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            onClick={() => keycloak.logout()}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="#EF4444"/>
              </svg>
            </div>
            <span style={{ fontSize: '9px', color: '#EF4444', fontWeight: '600' }}>Logout</span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
                Gestion Administrative
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '10px 20px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#6b7280' }}>
              📅 Hôpital Ibn Sina
            </div>
          </div>

          {/* Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #166534 0%, #16a34a 60%, #4ade80 100%)',
            borderRadius: '20px', padding: '24px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(22,101,52,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, {userName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Gestion financière et administrative<br/>
                Hôpital Ibn Sina — Rabat, Maroc
              </p>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px', padding: '4px 12px'
              }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
                  ✅ Accès administratif complet
                </span>
              </div>
            </div>
            <div style={{
              width: '100px', height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '50px'
            }}>
              👔
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Total Patients', value: kpis?.total_patients ?? '5,000', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>, change: '+8%' },
              { label: 'Consultations', value: kpis?.total_consultations ?? '50,000', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>, change: '+12%' },
              { label: 'Revenus Total', value: kpis?.revenus_total ? `${kpis.revenus_total} MAD` : '430,230 MAD', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>, change: '+15%' },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                background: 'white', borderRadius: '16px', padding: '18px',
                display: 'flex', alignItems: 'center', gap: '14px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #166534, #16a34a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {kpi.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '20px', fontWeight: '800' }}>{kpi.value}</p>
                </div>
                <span style={{
                  background: '#dcfce7', color: '#16a34a',
                  borderRadius: '20px', padding: '4px 10px',
                  fontSize: '11px', fontWeight: '600'
                }}>↑ {kpi.change}</span>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Revenus vs Dépenses</p>
                <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>2024</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataFinances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="revenus" fill="#16a34a" radius={[4,4,0,0]} name="Revenus" />
                  <Bar dataKey="depenses" fill="#86efac" radius={[4,4,0,0]} name="Dépenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: '12px' }}>Évolution Revenus</p>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '26px', fontWeight: '800' }}>430,230 MAD</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={dataFinances}>
                  <Line type="monotone" dataKey="revenus" stroke="#16a34a" strokeWidth={2.5} dot={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Profile */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #166534, #4ade80)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
              }}>👔</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{userName}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>Administratif</p>
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ADE80' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              {[
                { label: 'Services', value: '22' },
                { label: 'Personnel', value: '285' },
                { label: 'Fournisseurs', value: '48' },
                { label: 'Grade', value: 'Senior' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '9px' }}>{s.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '12px', fontWeight: '700' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Calendrier</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {weekDays.map((d) => (
                <div key={d.day} style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#9CA3AF' }}>{d.day}</p>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: d.active ? '#166534' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: d.active ? '700' : '400', color: d.active ? 'white' : '#374151' }}>{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Opérations récentes */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1 }}>
            <p style={{ margin: '0 0 14px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Opérations récentes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentOps.map((op, i) => (
                <div key={i} style={{
                  background: '#F9FAFB', borderRadius: '12px', padding: '12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1a1a2e' }}>{op.label}</p>
                    <span style={{
                      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                      background: op.statut === 'Payé' ? '#dcfce7' : op.statut === 'Reçu' ? '#dbeafe' : '#fef9c3',
                      color: op.statut === 'Payé' ? '#16a34a' : op.statut === 'Reçu' ? '#1565C0' : '#ca8a04'
                    }}>{op.statut}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: op.montant.startsWith('+') ? '#16a34a' : '#ef4444' }}>
                    {op.montant}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}