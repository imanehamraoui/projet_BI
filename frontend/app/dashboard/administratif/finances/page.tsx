'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface FinanceData {
  revenus_total?: number;
  depenses_total?: number;
  benefice?: number;
}

const dataDefaut = [
  { mois: 'Jan', revenus: 85000, depenses: 62000 },
  { mois: 'Fév', revenus: 92000, depenses: 58000 },
  { mois: 'Mar', revenus: 78000, depenses: 71000 },
  { mois: 'Avr', revenus: 105000, depenses: 65000 },
  { mois: 'Mai', revenus: 98000, depenses: 59000 },
  { mois: 'Jun', revenus: 112000, depenses: 68000 },
  { mois: 'Jul', revenus: 88000, depenses: 55000 },
  { mois: 'Aoû', revenus: 95000, depenses: 61000 },
];

const transactions = [
  { label: 'Recette consultations', montant: '+48,200', type: 'recette', date: '08/05/2026', statut: 'Reçu' },
  { label: 'Salaires personnel', montant: '-95,000', type: 'depense', date: '07/05/2026', statut: 'Payé' },
  { label: 'Équipements médicaux', montant: '-28,750', type: 'depense', date: '06/05/2026', statut: 'En attente' },
  { label: 'Paiement fournisseur', montant: '-12,500', type: 'depense', date: '05/05/2026', statut: 'Payé' },
  { label: 'Recette hospitalisations', montant: '+65,400', type: 'recette', date: '04/05/2026', statut: 'Reçu' },
  { label: 'Maintenance équipements', montant: '-8,200', type: 'depense', date: '03/05/2026', statut: 'Payé' },
];

export default function AdminFinances() {
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [data, setData] = useState(dataDefaut);
  const [filterType, setFilterType] = useState('Tous');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/dashboard/kpis?annee=2024');
      setFinance(res.data);
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  const filtered = transactions.filter(t =>
    filterType === 'Tous' || t.type === filterType.toLowerCase()
  );

  return (
    <div style={{ background: '#E8F5E9', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="administratif" activeItem="Finances" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
              Gestion Financière
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              Hôpital Ibn Sina — {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <RefreshButton onRefresh={fetchData} color="#166534" />
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[
            { label: 'Revenus Total', value: finance?.revenus_total ? `${finance.revenus_total.toLocaleString()} MAD` : '430,230 MAD', icon: '💰', color: '#166534', bg: '#DCFCE7', change: '+15%' },
            { label: 'Dépenses Total', value: '286,450 MAD', icon: '📉', color: '#dc2626', bg: '#FEE2E2', change: '-3%' },
            { label: 'Bénéfice Net', value: '143,780 MAD', icon: '📈', color: '#1565C0', bg: '#EEF2FF', change: '+22%' },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: 'white', borderRadius: '16px', padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: kpi.bg, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '22px'
                }}>{kpi.icon}</div>
                <span style={{
                  background: '#DCFCE7', color: '#16a34a',
                  borderRadius: '20px', padding: '4px 10px',
                  fontSize: '11px', fontWeight: '600'
                }}>↑ {kpi.change}</span>
              </div>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>{kpi.label}</p>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '22px', fontWeight: '800' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Revenus vs Dépenses</p>
              <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>2024</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v) => `${Number(v).toLocaleString()} MAD`} />
                <Legend />
                <Bar dataKey="revenus" fill="#16a34a" radius={[4,4,0,0]} name="Revenus" />
                <Bar dataKey="depenses" fill="#86efac" radius={[4,4,0,0]} name="Dépenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: '12px' }}>Évolution Bénéfice</p>
            <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '26px', fontWeight: '800' }}>143,780 MAD</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={data.map(d => ({ ...d, benefice: d.revenus - d.depenses }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mois" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v) => `${Number(v).toLocaleString()} MAD`} />
                <Line type="monotone" dataKey="benefice" stroke="#166534" strokeWidth={2.5} dot={{ fill: '#166534', r: 3 }} name="Bénéfice" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Transactions récentes</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Tous', 'Recette', 'Depense'].map((f) => (
                <button key={f} onClick={() => setFilterType(f)} style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                  background: filterType === f ? '#166534' : '#F3F4F6',
                  color: filterType === f ? 'white' : '#6B7280',
                  fontSize: '11px', fontWeight: '600'
                }}>{f}</button>
              ))}
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0FDF4' }}>
                {['Description', 'Montant (MAD)', 'Date', 'Statut'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', color: '#166534', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{t.label}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: t.montant.startsWith('+') ? '#16a34a' : '#dc2626' }}>
                    {t.montant} MAD
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6B7280' }}>{t.date}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                      background: t.statut === 'Reçu' ? '#DCFCE7' : t.statut === 'Payé' ? '#EEF2FF' : '#FEF9C3',
                      color: t.statut === 'Reçu' ? '#16a34a' : t.statut === 'Payé' ? '#1565C0' : '#ca8a04'
                    }}>{t.statut}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}