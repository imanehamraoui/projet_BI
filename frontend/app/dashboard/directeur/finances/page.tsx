'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface KPI {
  revenus_total?: number;
}

const dataEvolution = [
  { mois: 'Jan', revenus: 185000, depenses: 142000, benefice: 43000 },
  { mois: 'Fév', revenus: 192000, depenses: 138000, benefice: 54000 },
  { mois: 'Mar', revenus: 178000, depenses: 151000, benefice: 27000 },
  { mois: 'Avr', revenus: 205000, depenses: 145000, benefice: 60000 },
  { mois: 'Mai', revenus: 198000, depenses: 149000, benefice: 49000 },
  { mois: 'Jun', revenus: 212000, depenses: 158000, benefice: 54000 },
  { mois: 'Jul', revenus: 188000, depenses: 145000, benefice: 43000 },
  { mois: 'Aoû', revenus: 195000, depenses: 151000, benefice: 44000 },
  { mois: 'Sep', revenus: 220000, depenses: 160000, benefice: 60000 },
  { mois: 'Oct', revenus: 245000, depenses: 165000, benefice: 80000 },
  { mois: 'Nov', revenus: 215000, depenses: 155000, benefice: 60000 },
  { mois: 'Déc', revenus: 230000, depenses: 170000, benefice: 60000 },
];

const dataServices = [
  { service: 'Cardio', depense: 420000 },
  { service: 'Neuro', depense: 380000 },
  { service: 'Pédia', depense: 250000 },
  { service: 'Ortho', depense: 310000 },
  { service: 'Urgence', depense: 520000 },
  { service: 'Rech.', depense: 180000 },
  { service: 'Admin', depense: 240000 },
];

const transactionsRecentes = [
  { id: 1, date: '12 Oct 2024', type: 'Dépense', libelle: 'Achat équipements bloc opératoire', service: 'Orthopédie', montant: '-145,000 MAD', statut: 'Payé' },
  { id: 2, date: '11 Oct 2024', type: 'Revenu', libelle: 'Remboursement CNSS groupé', service: 'Administration', montant: '+85,200 MAD', statut: 'Reçu' },
  { id: 3, date: '10 Oct 2024', type: 'Dépense', libelle: 'Salaires personnel (Octobre)', service: 'Administration', montant: '-850,000 MAD', statut: 'En cours' },
  { id: 4, date: '09 Oct 2024', type: 'Revenu', libelle: 'Subvention Ministère Santé', service: 'Direction', montant: '+500,000 MAD', statut: 'Reçu' },
  { id: 5, date: '08 Oct 2024', type: 'Dépense', libelle: 'Renouvellement stock pharmacie', service: 'Urgences', montant: '-92,500 MAD', statut: 'Payé' },
  { id: 6, date: '07 Oct 2024', type: 'Dépense', libelle: 'Maintenance IRM', service: 'Neurologie', montant: '-35,000 MAD', statut: 'En attente' },
];

export default function DirecteurFinances() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [filterType, setFilterType] = useState('Tous');
  const [filterService, setFilterService] = useState('Tous');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/dashboard/kpis?annee=2024');
      if (res.data?.kpis) {
        setKpis({ revenus_total: res.data.kpis.financier?.chiffre_affaires || 0 });
      }
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  const filteredTransactions = transactionsRecentes.filter(t => {
    const matchType = filterType === 'Tous' || t.type === filterType;
    const matchService = filterService === 'Tous' || t.service === filterService || filterService === 'Administration';
    return matchType && matchService;
  });

  const formatMAD = (value: number) => {
    return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="directeur" activeItem="Finances" />
      
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Vue Financière Globale</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Bilan complet des revenus et dépenses</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshButton onRefresh={fetchData} color="#1e293b" />
            <div style={{ background: '#FEF9C3', borderRadius: '12px', padding: '8px 16px', border: '1px solid #FDE68A', fontSize: '13px', color: '#92400E', fontWeight: '700' }}>
              ⭐ Accès Complet
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Revenus Totaux', value: kpis?.revenus_total ? formatMAD(kpis.revenus_total) : '2.4M MAD', color: '#16a34a', bg: '#DCFCE7' },
            { label: 'Dépenses Totales', value: '1.8M MAD', color: '#dc2626', bg: '#FEE2E2' },
            { label: 'Bénéfice Net', value: '600K MAD', color: '#1565C0', bg: '#EEF2FF' },
            { label: 'Budget Restant', value: '45%', color: '#ca8a04', bg: '#FEF9C3' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <p style={{ margin: 0, color: '#64748b', fontSize: '12px', fontWeight: '600' }}>{k.label}</p>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: k.bg, border: \`2px solid \${k.color}\` }} />
              </div>
              <p style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '800' }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <div style={{ flex: 2, background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Évolution Mensuelle (MAD)</h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#16a34a' }}/> <span style={{ fontSize: '11px', color: '#64748b' }}>Revenus</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#dc2626' }}/> <span style={{ fontSize: '11px', color: '#64748b' }}>Dépenses</span></div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dataEvolution} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => \`\${val / 1000}k\`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="revenus" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="depenses" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Dépenses par Service</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataServices} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis dataKey="service" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={60} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="depense" fill="#1e293b" radius={[0, 4, 4, 0]} barSize={16}>
                  {dataServices.map((entry, index) => (
                    <Cell key={index} fill={index === 4 ? '#dc2626' : '#1e293b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Transactions Récentes</h3>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#334155', outline: 'none' }}
              >
                <option value="Tous">Tous les types</option>
                <option value="Revenu">Revenus</option>
                <option value="Dépense">Dépenses</option>
              </select>
              
              <select 
                value={filterService} 
                onChange={e => setFilterService(e.target.value)}
                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', color: '#334155', outline: 'none' }}
              >
                <option value="Tous">Tous les services</option>
                <option value="Administration">Administration</option>
                <option value="Urgences">Urgences</option>
                <option value="Orthopédie">Orthopédie</option>
                <option value="Neurologie">Neurologie</option>
              </select>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Libellé & Service</th>
                <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Montant</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Statut</th>
                <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: '#475569' }}>{t.date}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: t.type === 'Revenu' ? '#DCFCE7' : '#FEE2E2',
                      color: t.type === 'Revenu' ? '#16a34a' : '#dc2626'
                    }}>
                      {t.type === 'Revenu' ? '↓' : '↑'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{t.libelle}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>{t.service}</p>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <span style={{ 
                      fontSize: '14px', fontWeight: '700',
                      color: t.type === 'Revenu' ? '#16a34a' : '#dc2626'
                    }}>
                      {t.montant}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{ 
                      background: t.statut === 'Payé' || t.statut === 'Reçu' ? '#DCFCE7' : t.statut === 'En cours' ? '#FEF9C3' : '#F1F5F9', 
                      color: t.statut === 'Payé' || t.statut === 'Reçu' ? '#16a34a' : t.statut === 'En cours' ? '#ca8a04' : '#64748b',
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>
                      {t.statut}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', color: '#1e293b', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      Détails
                    </button>
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
