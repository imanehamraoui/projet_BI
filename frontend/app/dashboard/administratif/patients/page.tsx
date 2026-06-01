'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { getAdministratifApiError, isAdministratifAccount } from '@/lib/administratif-utils';

interface Patient {
  id?: number;
  nom: string;
  prenom: string;
  age?: number;
  service: string;
  date_admission?: string;
  statut?: string;
  montant?: number;
}

const statutColors: Record<string, { bg: string; color: string }> = {
  'Hospitalisé': { bg: '#EEF2FF', color: '#1565C0' },
  'Ambulatoire': { bg: '#DCFCE7', color: '#16a34a' },
  'Sorti': { bg: '#F3F4F6', color: '#6B7280' },
};

export default function AdminPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<string[]>(['Tous']);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [filterService, setFilterService] = useState('Tous');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      setError('');
      const res = await api.get('/api/administratif/patients?limit=200');
      if (res.data?.data) setPatients(res.data.data);
      if (res.data?.services?.length) setServices(['Tous', ...res.data.services]);
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

  const statuts = useMemo(() => {
    const unique = [...new Set(patients.map((p) => p.statut).filter(Boolean))] as string[];
    return ['Tous', ...unique];
  }, [patients]);

  const filtered = patients.filter(p => {
    const matchSearch = `${p.nom} ${p.prenom}`.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'Tous' || p.statut === filterStatut;
    const matchService = filterService === 'Tous' || p.service === filterService;
    return matchSearch && matchStatut && matchService;
  });

  const totalMontant = filtered.reduce((sum, p) => sum + (p.montant || 0), 0);

  return (
    <div style={{ background: '#E8F5E9', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="administratif" activeItem="Patients" />

      {selectedPatient && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>Dossier Patient</h2>
              <button onClick={() => setSelectedPatient(null)} style={{
                background: '#F3F4F6', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px'
              }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', padding: '16px', background: '#F0FDF4', borderRadius: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #166534, #16a34a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '20px'
              }}>{selectedPatient.nom?.charAt(0)}</div>
              <div>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '16px' }}>{selectedPatient.nom} {selectedPatient.prenom}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>{selectedPatient.service}</p>
              </div>
            </div>
            {[
              { label: 'Âge', value: `${selectedPatient.age ?? '—'} ans` },
              { label: 'Service', value: selectedPatient.service },
              { label: 'Date admission', value: selectedPatient.date_admission || '—' },
              { label: 'Statut', value: selectedPatient.statut || '—' },
              { label: 'Montant facturation', value: `${selectedPatient.montant?.toLocaleString('fr-FR') || 0} MAD` },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ color: '#6B7280', fontSize: '13px' }}>{item.label}</span>
                <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '13px' }}>{item.value}</span>
              </div>
            ))}
            <button onClick={() => setSelectedPatient(null)} style={{
              width: '100%', marginTop: '20px', background: '#F3F4F6', color: '#374151',
              border: 'none', borderRadius: '12px', padding: '12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
            }}>Fermer</button>
          </div>
        </div>
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
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Patients</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              {filtered.length} patients — Total : {totalMontant.toLocaleString('fr-FR')} MAD
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshButton onRefresh={fetchData} color="#166534" />
            <div style={{
              background: 'white', borderRadius: '12px', padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB'
            }}>
              <span>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..." style={{ border: 'none', outline: 'none', fontSize: '13px', width: '160px' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Hospitalisés', value: patients.filter(p => p.statut === 'Hospitalisé').length, color: '#1565C0', bg: '#EEF2FF' },
            { label: 'Ambulatoires', value: patients.filter(p => p.statut === 'Ambulatoire').length, color: '#16a34a', bg: '#DCFCE7' },
            { label: 'Sortis', value: patients.filter(p => p.statut === 'Sorti').length, color: '#6B7280', bg: '#F3F4F6' },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: 'white', borderRadius: '14px', padding: '16px',
              display: 'flex', alignItems: 'center', gap: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: kpi.bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px'
              }}>👥</div>
              <div>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
                <p style={{ margin: 0, color: kpi.color, fontSize: '28px', fontWeight: '800' }}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {statuts.map(s => (
              <button key={s} onClick={() => setFilterStatut(s)} style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: filterStatut === s ? '#166534' : 'white',
                color: filterStatut === s ? 'white' : '#6B7280',
                fontSize: '11px', fontWeight: '600', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>{s}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {services.map(s => (
              <button key={s} onClick={() => setFilterService(s)} style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                background: filterService === s ? '#1565C0' : 'white',
                color: filterService === s ? 'white' : '#6B7280',
                fontSize: '11px', fontWeight: '600', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0FDF4' }}>
                {['Patient', 'Âge', 'Service', 'Admission', 'Statut', 'Facturation', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#166534', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>Aucune donnée disponible</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id ?? i} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #166534, #16a34a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '13px'
                      }}>{p.nom?.charAt(0)}</div>
                      <p style={{ margin: 0, fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{p.nom} {p.prenom}</p>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', color: '#374151' }}>{p.age ?? '—'} ans</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ background: '#F0FDF4', color: '#166534', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
                      {p.service}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '12px', color: '#6B7280' }}>{p.date_admission || '—'}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: statutColors[p.statut || 'Ambulatoire']?.bg,
                      color: statutColors[p.statut || 'Ambulatoire']?.color,
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>{p.statut || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#166534' }}>
                    {p.montant?.toLocaleString('fr-FR') || '—'} MAD
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => setSelectedPatient(p)} style={{
                      background: 'linear-gradient(135deg, #166534, #16a34a)',
                      color: 'white', border: 'none', borderRadius: '8px',
                      padding: '6px 14px', fontSize: '11px', cursor: 'pointer', fontWeight: '600'
                    }}>Voir →</button>
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
