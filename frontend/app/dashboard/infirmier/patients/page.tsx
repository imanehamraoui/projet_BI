'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { getApiErrorMessage } from '@/lib/infirmier-utils';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';

interface Patient {
  id: number;
  nom: string;
  prenom: string;
  service: string;
  chambre: string;
  soin_du_jour: string;
  statut: string;
  heure: string;
  notes: string;
}

export default function InfirmierPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('Tous');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      setError('');
      const res = await api.get('/api/infirmier/patients');
      if (res.data?.data) {
        setPatients(res.data.data);
      }
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) fetchData();
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 30);

  const services = useMemo(() => {
    const unique = [...new Set(patients.map((p) => p.service).filter(Boolean))];
    return ['Tous', ...unique];
  }, [patients]);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = (p.nom + ' ' + p.prenom).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = selectedService === 'Tous' || p.service === selectedService;
    return matchesSearch && matchesService;
  });

  const getStatusColor = (statut: string) => {
    if (statut === 'Terminé') return { bg: '#dcfce7', color: '#16a34a' };
    if (statut === 'À faire') return { bg: '#fef9c3', color: '#ca8a04' };
    if (statut === 'En cours') return { bg: '#eef2ff', color: '#1565C0' };
    return { bg: '#f3f4f6', color: '#6b7280' };
  };

  return (
    <div style={{ background: '#E0F2FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="infirmier" activeItem="Patients" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
            padding: '12px 16px', marginBottom: '16px', color: '#B91C1C', fontSize: '13px'
          }}>{error}</div>
        )}
        <div style={{
          background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '12px',
          padding: '12px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>💉</span>
          <span style={{ color: '#BE123C', fontSize: '14px', fontWeight: '600' }}>
            Accès limité — Soins du jour uniquement
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Patients du jour</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Liste des patients nécessitant des soins</p>
          </div>
          <RefreshButton onRefresh={fetchData} color="#0369A1" />
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px 16px', width: '300px'
            }}>
              <span style={{ color: '#9CA3AF' }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher un patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: '#374151' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {services.map((service) => (
              <button
                key={service}
                onClick={() => setSelectedService(service)}
                style={{
                  background: selectedService === service ? '#0369A1' : 'white',
                  color: selectedService === service ? 'white' : '#6B7280',
                  border: selectedService === service ? 'none' : '1px solid #E5E7EB',
                  borderRadius: '20px', padding: '6px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0F9FF' }}>
                {['Patient', 'Service & Chambre', 'Soin du Jour', 'Statut', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: h === 'Action' ? 'right' : 'left', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => (
                <tr key={patient.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0369A1, #0EA5E9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '16px'
                      }}>{patient.nom.charAt(0)}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{patient.nom} {patient.prenom}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>ID: #{patient.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '500', color: '#374151' }}>{patient.service}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Ch. {patient.chambre}</p>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>💉</span>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1a1a2e' }}>{patient.soin_du_jour}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>Prévu: {patient.heure}</p>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      background: getStatusColor(patient.statut).bg,
                      color: getStatusColor(patient.statut).color,
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                    }}>{patient.statut}</span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      onClick={() => { setSelectedPatient(patient); setIsModalOpen(true); }}
                      style={{
                        background: 'linear-gradient(135deg, #0369A1, #0EA5E9)',
                        color: 'white', border: 'none', borderRadius: '8px',
                        padding: '8px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                      }}
                    >
                      Voir →
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
                    Aucun patient trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '500px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0369A1, #0EA5E9)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Détails du Soin</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>{selectedPatient.nom} {selectedPatient.prenom}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Service</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{selectedPatient.service}</p>
                </div>
                <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>Chambre</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{selectedPatient.chambre}</p>
                </div>
              </div>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0369A1' }}>Soin prescrit</h3>
                  <span style={{
                    background: getStatusColor(selectedPatient.statut).bg,
                    color: getStatusColor(selectedPatient.statut).color,
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                  }}>{selectedPatient.statut}</span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '600', color: '#1a1a2e' }}>{selectedPatient.soin_du_jour}</p>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>⏱ Prévu : {selectedPatient.heure}</span>
              </div>
              <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#92400E' }}>Notes Médicales</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#B45309', lineHeight: '1.5' }}>{selectedPatient.notes}</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsModalOpen(false)} style={{ background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
