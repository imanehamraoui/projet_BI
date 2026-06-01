'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

interface Rapport {
  id: number;
  titre: string;
  type: string;
  date: string;
  statut: string;
  taille: string;
}

const rapportsDefaut: Rapport[] = [
  { id: 1, titre: 'Rapport mensuel — Mai 2026', type: 'Financier', date: '08/05/2026', statut: 'Généré', taille: '2.4 MB' },
  { id: 2, titre: 'Bilan consultations T1 2026', type: 'Médical', date: '01/04/2026', statut: 'Généré', taille: '1.8 MB' },
  { id: 3, titre: 'Rapport personnel — Avril', type: 'RH', date: '30/04/2026', statut: 'Généré', taille: '980 KB' },
  { id: 4, titre: 'Analyse revenus 2025', type: 'Financier', date: '15/01/2026', statut: 'Archivé', taille: '3.2 MB' },
  { id: 5, titre: 'Statistiques patients 2025', type: 'Médical', date: '31/12/2025', statut: 'Archivé', taille: '4.1 MB' },
  { id: 6, titre: 'Rapport audit interne', type: 'Audit', date: '20/03/2026', statut: 'En cours', taille: '—' },
];

const dataActivite = [
  { mois: 'Jan', rapports: 8 },
  { mois: 'Fév', rapports: 12 },
  { mois: 'Mar', rapports: 9 },
  { mois: 'Avr', rapports: 15 },
  { mois: 'Mai', rapports: 6 },
];

const dataTypes = [
  { type: 'Financier', count: 12 },
  { type: 'Médical', count: 8 },
  { type: 'RH', count: 5 },
  { type: 'Audit', count: 3 },
];

const typeColors: Record<string, { bg: string; color: string }> = {
  'Financier': { bg: '#DCFCE7', color: '#166534' },
  'Médical': { bg: '#EEF2FF', color: '#1565C0' },
  'RH': { bg: '#FEF9C3', color: '#ca8a04' },
  'Audit': { bg: '#F5F3FF', color: '#7C3AED' },
};

const statutColors: Record<string, { bg: string; color: string }> = {
  'Généré': { bg: '#DCFCE7', color: '#16a34a' },
  'Archivé': { bg: '#F3F4F6', color: '#6B7280' },
  'En cours': { bg: '#FEF9C3', color: '#ca8a04' },
};

export default function AdminRapports() {
  const [rapports, setRapports] = useState<Rapport[]>(rapportsDefaut);
  const [filterType, setFilterType] = useState('Tous');
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [notification, setNotification] = useState('');
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/audit');
      if (res.data?.length > 0) {
        // Transformer les données audit en rapports
      }
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  const handleDownload = (rapport: Rapport) => {
    if (rapport.statut === 'En cours') {
      setNotification('⏳ Rapport en cours de génération...');
    } else {
      setNotification(`✅ Téléchargement de "${rapport.titre}" lancé !`);
    }
    setTimeout(() => setNotification(''), 3000);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const newRapport: Rapport = {
        id: rapports.length + 1,
        titre: `Rapport automatique — ${new Date().toLocaleDateString('fr-FR')}`,
        type: 'Financier',
        date: new Date().toLocaleDateString('fr-FR'),
        statut: 'Généré',
        taille: '1.2 MB'
      };
      setRapports(prev => [newRapport, ...prev]);
      setGenerating(false);
      setNotification('✅ Nouveau rapport généré avec succès !');
      setTimeout(() => setNotification(''), 3000);
    }, 2000);
  };

  const types = ['Tous', 'Financier', 'Médical', 'RH', 'Audit'];
  const statuts = ['Tous', 'Généré', 'Archivé', 'En cours'];

  const filtered = rapports.filter(r => {
    const matchType = filterType === 'Tous' || r.type === filterType;
    const matchStatut = filterStatut === 'Tous' || r.statut === filterStatut;
    return matchType && matchStatut;
  });

  return (
    <div style={{ background: '#E8F5E9', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="administratif" activeItem="Rapports" />

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: 'white', border: '1px solid #E5E7EB',
          borderRadius: '12px', padding: '12px 20px',
          color: '#1a1a2e', fontWeight: '600', fontSize: '13px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          {notification}
        </div>
      )}

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Rapports</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              {rapports.length} rapports disponibles
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshButton onRefresh={fetchData} color="#166534" />
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{
                background: generating ? '#9CA3AF' : 'linear-gradient(135deg, #166534, #16a34a)',
                color: 'white', border: 'none', borderRadius: '12px',
                padding: '10px 20px', fontSize: '13px', cursor: generating ? 'not-allowed' : 'pointer',
                fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
              {generating ? '⏳ Génération...' : '+ Générer rapport'}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Rapports', value: rapports.length, icon: '📄', color: '#166534' },
            { label: 'Générés', value: rapports.filter(r => r.statut === 'Généré').length, icon: '✅', color: '#16a34a' },
            { label: 'Archivés', value: rapports.filter(r => r.statut === 'Archivé').length, icon: '🗃️', color: '#6B7280' },
            { label: 'En cours', value: rapports.filter(r => r.statut === 'En cours').length, icon: '⏳', color: '#ca8a04' },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: 'white', borderRadius: '14px', padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: '#F0FDF4', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px'
              }}>{kpi.icon}</div>
              <div>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
                <p style={{ margin: 0, color: kpi.color, fontSize: '26px', fontWeight: '800' }}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
              Rapports générés par mois
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dataActivite}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="rapports" stroke="#166534" strokeWidth={2.5} dot={{ fill: '#166534', r: 4 }} name="Rapports" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
              Par type
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dataTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="type" type="category" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#16a34a" radius={[0,4,4,0]} name="Rapports" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {types.map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: filterType === t ? '#166534' : 'white',
              color: filterType === t ? 'white' : '#6B7280',
              fontSize: '11px', fontWeight: '600', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}>{t}</button>
          ))}
          <div style={{ width: '1px', background: '#E5E7EB', margin: '0 4px' }} />
          {statuts.map(s => (
            <button key={s} onClick={() => setFilterStatut(s)} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: filterStatut === s ? '#1565C0' : 'white',
              color: filterStatut === s ? 'white' : '#6B7280',
              fontSize: '11px', fontWeight: '600', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}>{s}</button>
          ))}
        </div>

        {/* Liste Rapports */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0FDF4' }}>
                {['Titre', 'Type', 'Date', 'Taille', 'Statut', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#166534', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>📄</span>
                      <p style={{ margin: 0, fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{r.titre}</p>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: typeColors[r.type]?.bg, color: typeColors[r.type]?.color,
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>{r.type}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6B7280' }}>{r.date}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6B7280' }}>{r.taille}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: statutColors[r.statut]?.bg, color: statutColors[r.statut]?.color,
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>{r.statut}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button
                      onClick={() => handleDownload(r)}
                      style={{
                        background: r.statut === 'En cours' ? '#F3F4F6' : 'linear-gradient(135deg, #166534, #16a34a)',
                        color: r.statut === 'En cours' ? '#6B7280' : 'white',
                        border: 'none', borderRadius: '8px',
                        padding: '6px 14px', fontSize: '11px',
                        cursor: 'pointer', fontWeight: '600'
                      }}>
                      {r.statut === 'En cours' ? '⏳' : '⬇️ Télécharger'}
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