'use client';

import { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { getAdministratifApiError, isAdministratifAccount } from '@/lib/administratif-utils';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface FinanceData {
  revenus_total: number;
  depenses_total: number;
  benefice: number;
}

interface MoisData { mois: string; revenus: number; depenses: number }
interface Transaction { label: string; montant: string; type: string; date: string; statut: string }

export default function AdminFinances() {
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [data, setData] = useState<MoisData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState('Tous');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      setError('');
      const res = await api.get('/api/administratif/finances?annee=2024');
      const d = res.data;
      setFinance({
        revenus_total: d.revenus_total || 0,
        depenses_total: d.depenses_total || 0,
        benefice: d.benefice || 0,
      });
      if (d.par_mois) setData(d.par_mois);
      if (d.transactions) setTransactions(d.transactions);
    } catch (e) {
      setError(getAdministratifApiError(e));
    }
  }, []);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) fetchData();
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 30);

  const filtered = transactions.filter(t =>
    filterType === 'Tous' || t.type === filterType.toLowerCase()
  );

  return (
    <div style={{ background: '#E8F5E9', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="administratif" activeItem="Finances" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
            padding: '12px 16px', marginBottom: '16px', color: '#B91C1C', fontSize: '13px'
          }}>{error}</div>
        )}
        {!isAdministratifAccount() && !error && (
          <div style={{
            background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px',
            padding: '12px 16px', marginBottom: '16px', color: '#92400E', fontSize: '13px'
          }}>
            Mode consultation — connectez-vous avec <strong>marie.admin</strong> pour le compte administratif.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Gestion Financière</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              Hôpital Ibn Sina — Données 2024
            </p>
          </div>
          <RefreshButton onRefresh={fetchData} color="#166534" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[
            { label: 'Revenus Total', value: finance ? `${finance.revenus_total.toLocaleString('fr-FR')} MAD` : '—', icon: '💰', color: '#166534', bg: '#DCFCE7' },
            { label: 'Dépenses Total', value: finance ? `${finance.depenses_total.toLocaleString('fr-FR')} MAD` : '—', icon: '📉', color: '#dc2626', bg: '#FEE2E2' },
            { label: 'Bénéfice Net', value: finance ? `${finance.benefice.toLocaleString('fr-FR')} MAD` : '—', icon: '📈', color: '#1565C0', bg: '#EEF2FF' },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: 'white', borderRadius: '16px', padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: kpi.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '22px', marginBottom: '12px'
              }}>{kpi.icon}</div>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>{kpi.label}</p>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '22px', fontWeight: '800' }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Revenus vs Dépenses</p>
              <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>2024</span>
            </div>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v) => `${Number(v).toLocaleString('fr-FR')} MAD`} />
                  <Legend />
                  <Bar dataKey="revenus" fill="#16a34a" radius={[4,4,0,0]} name="Revenus" />
                  <Bar dataKey="depenses" fill="#86efac" radius={[4,4,0,0]} name="Dépenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>Aucune donnée</p>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: '12px' }}>Évolution Bénéfice</p>
            <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '26px', fontWeight: '800' }}>
              {finance ? `${finance.benefice.toLocaleString('fr-FR')} MAD` : '—'}
            </p>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={data.map(d => ({ ...d, benefice: d.revenus - d.depenses }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mois" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v) => `${Number(v).toLocaleString('fr-FR')} MAD`} />
                  <Line type="monotone" dataKey="benefice" stroke="#166534" strokeWidth={2.5} dot={{ fill: '#166534', r: 3 }} name="Bénéfice" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '30px 0' }}>—</p>
            )}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Transactions récentes</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Tous', 'Recette'].map((f) => (
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
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>Aucune transaction</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '500', color: '#1a1a2e' }}>{t.label}</td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#16a34a' }}>{t.montant} MAD</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6B7280' }}>{t.date}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px',
                      background: t.statut === 'Reçu' ? '#DCFCE7' : '#FEF9C3',
                      color: t.statut === 'Reçu' ? '#16a34a' : '#ca8a04'
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
