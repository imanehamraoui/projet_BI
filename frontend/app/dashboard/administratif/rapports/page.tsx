'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { getAdministratifApiError, isAdministratifAccount } from '@/lib/administratif-utils';
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

interface Activite { mois: string; rapports: number }
interface TypeCount { type: string; count: number }

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
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [activite, setActivite] = useState<Activite[]>([]);
  const [parType, setParType] = useState<TypeCount[]>([]);
  const [filterType, setFilterType] = useState('Tous');
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      setError('');
      const res = await api.get('/api/administratif/rapports?annee=2024');
      const d = res.data;
      if (d.rapports) setRapports(d.rapports);
      if (d.activite) setActivite(d.activite);
      if (d.par_type) setParType(d.par_type);
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

  const types = useMemo(() => {
    const unique = [...new Set(rapports.map((r) => r.type))];
    return ['Tous', ...unique];
  }, [rapports]);

  const statuts = useMemo(() => {
    const unique = [...new Set(rapports.map((r) => r.statut))];
    return ['Tous', ...unique];
  }, [rapports]);

  const filtered = rapports.filter(r => {
    const matchType = filterType === 'Tous' || r.type === filterType;
    const matchStatut = filterStatut === 'Tous' || r.statut === filterStatut;
    return matchType && matchStatut;
  });

  const handleDownload = (rapport: Rapport) => {
    setNotification(`✅ Rapport "${rapport.titre}" — ${rapport.taille}`);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div style={{ background: '#E8F5E9', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="administratif" activeItem="Rapports" />

      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: 'white', border: '1px solid #E5E7EB',
          borderRadius: '12px', padding: '12px 20px',
          color: '#1a1a2e', fontWeight: '600', fontSize: '13px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>{notification}</div>
      )}

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
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Rapports</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              {rapports.length} rapports disponibles — Données 2024
            </p>
          </div>
          <RefreshButton onRefresh={fetchData} color="#166534" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Rapports', value: rapports.length, icon: '📄', color: '#166534' },
            { label: 'Générés', value: rapports.filter(r => r.statut === 'Généré').length, icon: '✅', color: '#16a34a' },
            { label: 'Financiers', value: rapports.filter(r => r.type === 'Financier').length, icon: '💰', color: '#1565C0' },
            { label: 'Médicaux', value: rapports.filter(r => r.type === 'Médical').length, icon: '🏥', color: '#7C3AED' },
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

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>
              Activité mensuelle
            </p>
            {activite.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={activite}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="rapports" stroke="#166534" strokeWidth={2.5} dot={{ fill: '#166534', r: 4 }} name="Rapports" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>Aucune donnée</p>
            )}
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Par type</p>
            {parType.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={parType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="type" type="category" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#16a34a" radius={[0,4,4,0]} name="Rapports" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px 0' }}>Aucune donnée</p>
            )}
          </div>
        </div>

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
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>Aucun rapport</td></tr>
              ) : filtered.map((r) => (
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
                    <button onClick={() => handleDownload(r)} style={{
                      background: 'linear-gradient(135deg, #166534, #16a34a)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      padding: '6px 14px', fontSize: '11px', cursor: 'pointer', fontWeight: '600'
                    }}>⬇️ Télécharger</button>
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
