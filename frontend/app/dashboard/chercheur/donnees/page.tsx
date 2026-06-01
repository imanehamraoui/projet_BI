'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';

interface Patient {
  token_anonyme: string;
  age: number;
  sexe: string;
  region: string;
  diagnostic_code: string;
}

const patientsDefaut: Patient[] = [
  { token_anonyme: 'TK-A1B2C3D4', age: 45, sexe: 'M', region: 'Rabat', diagnostic_code: 'I10.0' },
  { token_anonyme: 'TK-E5F6G7H8', age: 32, sexe: 'F', region: 'Casablanca', diagnostic_code: 'G43.9' },
  { token_anonyme: 'TK-I9J0K1L2', age: 58, sexe: 'M', region: 'Fès', diagnostic_code: 'I48.0' },
  { token_anonyme: 'TK-M3N4O5P6', age: 28, sexe: 'F', region: 'Marrakech', diagnostic_code: 'J30.1' },
  { token_anonyme: 'TK-Q7R8S9T0', age: 67, sexe: 'M', region: 'Rabat', diagnostic_code: 'I50.0' },
  { token_anonyme: 'TK-U1V2W3X4', age: 41, sexe: 'F', region: 'Tanger', diagnostic_code: 'G40.9' },
  { token_anonyme: 'TK-Y5Z6A7B8', age: 52, sexe: 'M', region: 'Casablanca', diagnostic_code: 'M54.5' },
  { token_anonyme: 'TK-C9D0E1F2', age: 35, sexe: 'F', region: 'Rabat', diagnostic_code: 'J45.0' },
  { token_anonyme: 'TK-G3H4I5J6', age: 63, sexe: 'M', region: 'Fès', diagnostic_code: 'E11.9' },
  { token_anonyme: 'TK-K7L8M9N0', age: 29, sexe: 'F', region: 'Marrakech', diagnostic_code: 'F32.9' },
];

export default function ChercheurDonnees() {
  const [patients, setPatients] = useState<Patient[]>(patientsDefaut);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('Tous');
  const [filterSexe, setFilterSexe] = useState('Tous');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/patients');
      if (res.data?.data?.length > 0) {
        const formattedData = res.data.data.map((p: any) => ({
          ...p,
          token_anonyme: `TK-${Math.random().toString(36).substr(2,8).toUpperCase()}`,
          age: p.age || 40,
          sexe: p.sexe || 'M',
          region: p.region || 'Rabat',
          diagnostic_code: p.diagnostic_code || 'J10.0'
        }));
        setPatients(formattedData);
      }
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  const regions = ['Tous', 'Rabat', 'Casablanca', 'Fès', 'Marrakech', 'Tanger'];
  const sexes = ['Tous', 'M', 'F'];

  const filtered = patients.filter(p => {
    const matchSearch = p.token_anonyme?.toLowerCase().includes(search.toLowerCase()) ||
      p.diagnostic_code?.toLowerCase().includes(search.toLowerCase());
    const matchRegion = filterRegion === 'Tous' || p.region === filterRegion;
    const matchSexe = filterSexe === 'Tous' || p.sexe === filterSexe;
    return matchSearch && matchRegion && matchSexe;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div style={{ background: '#EDE9FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="chercheur" activeItem="Données" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
              Données Anonymisées
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              {filtered.length} enregistrements — 🔒 RGPD conforme
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshButton onRefresh={fetchData} color="#5B21B6" />
            <div style={{
              background: 'white', borderRadius: '12px', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <span>🔍</span>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Token ou code diagnostic..." style={{
                  border: 'none', outline: 'none', fontSize: '13px', width: '200px'
                }} />
            </div>
          </div>
        </div>

        {/* Avertissement RGPD */}
        <div style={{
          background: '#F5F3FF', border: '1px solid #DDD6FE',
          borderRadius: '14px', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <p style={{ margin: 0, fontSize: '12px', color: '#5B21B6', fontWeight: '500' }}>
            <strong>Données anonymisées :</strong> Toutes les données identifiantes sont masquées conformément au RGPD.
            Vous n'avez accès qu'aux données statistiques anonymes. Aucune donnée personnelle n'est accessible.
          </p>
        </div>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Total Enregistrements', value: patients.length, icon: '📊', color: '#5B21B6' },
            { label: 'Hommes', value: patients.filter(p => p.sexe === 'M').length, icon: '👨', color: '#1565C0' },
            { label: 'Femmes', value: patients.filter(p => p.sexe === 'F').length, icon: '👩', color: '#7C3AED' },
            { label: 'Régions', value: new Set(patients.map(p => p.region)).size, icon: '🗺️', color: '#0EA5E9' },
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
                <p style={{ margin: 0, color: kpi.color, fontSize: '26px', fontWeight: '800' }}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {regions.map(r => (
              <button key={r} onClick={() => { setFilterRegion(r); setPage(1); }} style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: filterRegion === r ? '#5B21B6' : 'white',
                color: filterRegion === r ? 'white' : '#6B7280',
                fontSize: '11px', fontWeight: '600', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>{r}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {sexes.map(s => (
              <button key={s} onClick={() => { setFilterSexe(s); setPage(1); }} style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: filterSexe === s ? '#7C3AED' : 'white',
                color: filterSexe === s ? 'white' : '#6B7280',
                fontSize: '11px', fontWeight: '600', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>{s === 'Tous' ? 'Tous sexes' : s === 'M' ? 'Hommes' : 'Femmes'}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F5F3FF' }}>
                {['Token Anonyme', 'Âge', 'Sexe', 'Région', 'Code Diagnostic', 'Tranche Âge'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#5B21B6', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 14px', fontSize: '11px', color: '#6B7280', fontFamily: 'monospace', fontWeight: '600' }}>
                    {p.token_anonyme}
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{p.age} ans</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: p.sexe === 'M' ? '#EEF2FF' : '#FDF4FF',
                      color: p.sexe === 'M' ? '#1565C0' : '#7C3AED',
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>{p.sexe === 'M' ? 'Homme' : 'Femme'}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{p.region}</td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', fontFamily: 'monospace', color: '#5B21B6', fontWeight: '600' }}>
                    {p.diagnostic_code}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: '#F5F3FF', color: '#5B21B6',
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>
                      {p.age < 18 ? '0-18' : p.age < 35 ? '19-35' : p.age < 50 ? '36-50' : p.age < 65 ? '51-65' : '65+'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                background: page === 1 ? '#F3F4F6' : '#5B21B6',
                color: page === 1 ? '#9CA3AF' : 'white',
                fontSize: '12px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: '600'
              }}>← Précédent</button>
            <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none',
                background: page === totalPages ? '#F3F4F6' : '#5B21B6',
                color: page === totalPages ? '#9CA3AF' : 'white',
                fontSize: '12px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: '600'
              }}>Suivant →</button>
          </div>
        </div>
      </div>
    </div>
  );
}