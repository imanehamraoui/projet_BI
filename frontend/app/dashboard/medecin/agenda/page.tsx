'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';

interface AgendaItem {
  id?: number;
  agenda_id?: number;
  heure: string;
  patient: string;
  type_rdv: string;
  duree: string;
  statut: string;
  service?: string;
  date_rdv?: string;
}

export default function MedecinAgenda() {
  const [rdvs, setRdvs] = useState<AgendaItem[]>([]);

  // Restored
  const weekDays = [
    { day: 'Lun', date: '06', rdv: 4 },
    { day: 'Mar', date: '07', rdv: 7 },
    { day: 'Mer', date: '08', rdv: 5, active: true },
    { day: 'Jeu', date: '09', rdv: 6 },
    { day: 'Ven', date: '10', rdv: 3 },
    { day: 'Sam', date: '11', rdv: 2 },
    { day: 'Dim', date: '12', rdv: 0 },
  ];

  const statutColors: Record<string, { bg: string; color: string }> = {
    'Confirmé': { bg: '#DCFCE7', color: '#16a34a' },
    'En attente': { bg: '#FEF9C3', color: '#ca8a04' },
    'Annulé': { bg: '#FEE2E2', color: '#dc2626' },
  };

  const typeColors: Record<string, string> = {
    'Consultation': '#1565C0',
    'Suivi': '#7C3AED',
    'Urgence': '#DC2626',
  };

  const defaultStatutStyle = { bg: '#F3F4F6', color: '#6B7280' };

  function normalizeStatut(statut?: string): string {
    if (!statut) return 'En attente';
    if (statut.startsWith('Confirm')) return 'Confirmé';
    if (statut.startsWith('Annul')) return 'Annulé';
    if (statut.startsWith('En attente')) return 'En attente';
    return statut;
  }

  function getStatutStyle(statut?: string) {
    return statutColors[normalizeStatut(statut)] ?? defaultStatutStyle;
  }

  function getTypeColor(type?: string) {
    return typeColors[type || ''] ?? '#1565C0';
  }

  function getAgendaId(item: AgendaItem) {
    return item.agenda_id ?? item.id ?? 0;
  }
  const [selectedDay, setSelectedDay] = useState('08');
  const [filter, setFilter] = useState('Tous');
  const [selectedRdv, setSelectedRdv] = useState<AgendaItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmAnnuler, setShowConfirmAnnuler] = useState<number | null>(null);
  const [notification, setNotification] = useState('');

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      const res = await api.get('/api/agenda');
      if (res.data?.data) {
        setRdvs(
          res.data.data.map((r: AgendaItem) => ({
            ...r,
            statut: normalizeStatut(r.statut),
            heure: String(r.heure || '').slice(0, 5),
          }))
        );
      }
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) fetchData();
    });
  }, [fetchData]);

  const filters = ['Tous', 'Confirmé', 'En attente', 'Annulé'];
  const filtered = rdvs.filter((r) => filter === 'Tous' || normalizeStatut(r.statut) === filter);

  const handleVoir = (rdv: AgendaItem) => {
    setSelectedRdv(rdv);
    setShowModal(true);
  };

  const handleAnnuler = (id: number) => {
    setShowConfirmAnnuler(id);
  };

  const confirmerAnnulation = (id: number) => {
    setRdvs(prev => prev.map(r => getAgendaId(r) === id ? { ...r, statut: 'Annulé' } : r));
    setShowConfirmAnnuler(null);
    setNotification('RDV annulé avec succès');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleConfirmer = (id: number) => {
    setRdvs(prev => prev.map(r => getAgendaId(r) === id ? { ...r, statut: 'Confirmé' } : r));
    setNotification('RDV confirmé avec succès');
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div style={{ background: '#E8F0FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="medecin" activeItem="Agenda" />

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: '#DCFCE7', border: '1px solid #86EFAC',
          borderRadius: '12px', padding: '12px 20px',
          color: '#16a34a', fontWeight: '600', fontSize: '13px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>
          ✅ {notification}
        </div>
      )}

      {/* Modal Voir RDV */}
      {showModal && selectedRdv && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', padding: '32px',
            width: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>
                Détails du RDV
              </h2>
              <button onClick={() => setShowModal(false)} style={{
                background: '#F3F4F6', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px'
              }}>✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', padding: '16px', background: '#F0F9FF', borderRadius: '16px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${getTypeColor(selectedRdv.type_rdv)}, ${getTypeColor(selectedRdv.type_rdv)}99)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: '700', fontSize: '20px'
              }}>
                {selectedRdv.patient.charAt(0)}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '16px' }}>{selectedRdv.patient}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>{selectedRdv.service}</p>
              </div>
            </div>

            {[
              { label: 'Type', value: selectedRdv.type_rdv },
              { label: 'Heure', value: selectedRdv.heure },
              { label: 'Durée', value: selectedRdv.duree },
              { label: 'Service', value: selectedRdv.service },
              { label: 'Statut', value: selectedRdv.statut },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #F3F4F6'
              }}>
                <span style={{ color: '#6B7280', fontSize: '13px' }}>{item.label}</span>
                <span style={{ color: '#1a1a2e', fontWeight: '600', fontSize: '13px' }}>{item.value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              {selectedRdv && normalizeStatut(selectedRdv.statut) === 'En attente' && (
                <button onClick={() => { handleConfirmer(getAgendaId(selectedRdv)); setShowModal(false); }} style={{
                  flex: 1, background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
                }}>
                  ✅ Confirmer
                </button>
              )}
              {selectedRdv && normalizeStatut(selectedRdv.statut) !== 'Annulé' && (
                <button onClick={() => { handleAnnuler(getAgendaId(selectedRdv)); setShowModal(false); }} style={{
                  flex: 1, background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
                }}>
                  ❌ Annuler le RDV
                </button>
              )}
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, background: '#F3F4F6', color: '#374151',
                border: 'none', borderRadius: '12px',
                padding: '12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
              }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Annulation */}
      {showConfirmAnnuler !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '28px',
            width: '360px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', color: '#1a1a2e' }}>Confirmer l'annulation</h3>
            <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '20px' }}>
              Êtes-vous sûr de vouloir annuler ce rendez-vous ?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => confirmerAnnulation(showConfirmAnnuler)} style={{
                flex: 1, background: '#dc2626', color: 'white',
                border: 'none', borderRadius: '10px', padding: '10px',
                fontSize: '13px', cursor: 'pointer', fontWeight: '600'
              }}>
                Oui, annuler
              </button>
              <button onClick={() => setShowConfirmAnnuler(null)} style={{
                flex: 1, background: '#F3F4F6', color: '#374151',
                border: 'none', borderRadius: '10px', padding: '10px',
                fontSize: '13px', cursor: 'pointer', fontWeight: '600'
              }}>
                Non, garder
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Agenda</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              {filtered.length} rendez-vous aujourd'hui
            </p>
          </div>
          <button style={{
            background: 'linear-gradient(135deg, #1565C0, #1976D2)',
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
          }}>
            + Nouveau RDV
          </button>
        </div>

        {/* Calendrier */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 16px', fontWeight: '700', color: '#1a1a2e', fontSize: '15px' }}>
            Semaine du 6 au 12 Mai 2026
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {weekDays.map((d) => (
              <div key={d.date} onClick={() => setSelectedDay(d.date)} style={{
                flex: 1, textAlign: 'center', padding: '12px 8px',
                borderRadius: '14px', cursor: 'pointer',
                background: selectedDay === d.date ? 'linear-gradient(135deg, #1565C0, #1976D2)' : '#F9FAFB',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: '10px', color: selectedDay === d.date ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>{d.day}</p>
                <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: selectedDay === d.date ? 'white' : '#1a1a2e' }}>{d.date}</p>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: selectedDay === d.date ? 'rgba(255,255,255,0.3)' : '#EEF2FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', fontSize: '10px',
                  color: selectedDay === d.date ? 'white' : '#1565C0', fontWeight: '700'
                }}>
                  {d.rdv}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: filter === f ? '#1565C0' : 'white',
              color: filter === f ? 'white' : '#6B7280',
              fontSize: '12px', fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              {f}
            </button>
          ))}
        </div>

        {/* Liste RDV */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((rdv) => (
            <div key={getAgendaId(rdv)} style={{
              background: 'white', borderRadius: '16px', padding: '16px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '16px',
              borderLeft: `4px solid ${getTypeColor(rdv.type_rdv)}`
            }}>
              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1565C0' }}>{rdv.heure}</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#9CA3AF' }}>{rdv.duree}</p>
              </div>
              <div style={{ width: '1px', height: '40px', background: '#E5E7EB' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: `linear-gradient(135deg, ${getTypeColor(rdv.type_rdv)}, ${getTypeColor(rdv.type_rdv)}99)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: '700', fontSize: '16px'
                }}>
                  {rdv.patient.charAt(0)}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{rdv.patient}</p>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>{rdv.service}</p>
                </div>
              </div>
              <span style={{
                background: `${getTypeColor(rdv.type_rdv)}15`, color: getTypeColor(rdv.type_rdv),
                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
              }}>{rdv.type_rdv}</span>
              <span style={{
                background: getStatutStyle(rdv.statut).bg,
                color: getStatutStyle(rdv.statut).color,
                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
              }}>{normalizeStatut(rdv.statut)}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleVoir(rdv)} style={{
                  background: '#EEF2FF', color: '#1565C0', border: 'none',
                  borderRadius: '8px', padding: '6px 12px', fontSize: '11px',
                  cursor: 'pointer', fontWeight: '600'
                }}>Voir</button>
                {normalizeStatut(rdv.statut) === 'En attente' && (
                  <button onClick={() => handleConfirmer(getAgendaId(rdv))} style={{
                    background: '#DCFCE7', color: '#16a34a', border: 'none',
                    borderRadius: '8px', padding: '6px 12px', fontSize: '11px',
                    cursor: 'pointer', fontWeight: '600'
                  }}>Confirmer</button>
                )}
                {normalizeStatut(rdv.statut) !== 'Annulé' && (
                  <button onClick={() => handleAnnuler(getAgendaId(rdv))} style={{
                    background: '#FEE2E2', color: '#dc2626', border: 'none',
                    borderRadius: '8px', padding: '6px 12px', fontSize: '11px',
                    cursor: 'pointer', fontWeight: '600'
                  }}>Annuler</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}