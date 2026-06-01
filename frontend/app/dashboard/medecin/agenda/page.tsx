'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface RDV {
  id: number;
  patient: string;
  type: string;
  heure: string;
  duree: string;
  service: string;
  statut: 'Confirmé' | 'En attente' | 'Annulé';
}

const rdvData: RDV[] = [
  { id: 1, patient: 'El Idrissi Youssef', type: 'Consultation', heure: '09:00', duree: '30 min', service: 'Cardiologie', statut: 'Confirmé' },
  { id: 2, patient: 'Benali Fatima', type: 'Suivi', heure: '09:30', duree: '20 min', service: 'Neurologie', statut: 'Confirmé' },
  { id: 3, patient: 'Alaoui Mohamed', type: 'Urgence', heure: '10:00', duree: '45 min', service: 'Cardiologie', statut: 'En attente' },
  { id: 4, patient: 'Chraibi Sara', type: 'Consultation', heure: '11:00', duree: '30 min', service: 'Pédiatrie', statut: 'Confirmé' },
  { id: 5, patient: 'Tazi Ahmed', type: 'Suivi', heure: '14:00', duree: '20 min', service: 'Cardiologie', statut: 'Confirmé' },
  { id: 6, patient: 'Berrada Khadija', type: 'Consultation', heure: '14:30', duree: '30 min', service: 'Neurologie', statut: 'En attente' },
  { id: 7, patient: 'Mansouri Omar', type: 'Suivi', heure: '15:30', duree: '20 min', service: 'Cardiologie', statut: 'Annulé' },
];

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

export default function MedecinAgenda() {
  const [rdvs, setRdvs] = useState<RDV[]>(rdvData);
  const [selectedDay, setSelectedDay] = useState('08');
  const [filter, setFilter] = useState('Tous');
  const [selectedRdv, setSelectedRdv] = useState<RDV | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmAnnuler, setShowConfirmAnnuler] = useState<number | null>(null);
  const [notification, setNotification] = useState('');

  const filters = ['Tous', 'Confirmé', 'En attente', 'Annulé'];
  const filtered = rdvs.filter(r => filter === 'Tous' || r.statut === filter);

  const handleVoir = (rdv: RDV) => {
    setSelectedRdv(rdv);
    setShowModal(true);
  };

  const handleAnnuler = (id: number) => {
    setShowConfirmAnnuler(id);
  };

  const confirmerAnnulation = (id: number) => {
    setRdvs(prev => prev.map(r => r.id === id ? { ...r, statut: 'Annulé' } : r));
    setShowConfirmAnnuler(null);
    setNotification('RDV annulé avec succès');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleConfirmer = (id: number) => {
    setRdvs(prev => prev.map(r => r.id === id ? { ...r, statut: 'Confirmé' } : r));
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
                background: `linear-gradient(135deg, ${typeColors[selectedRdv.type]}, ${typeColors[selectedRdv.type]}99)`,
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
              { label: 'Type', value: selectedRdv.type },
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
              {selectedRdv.statut === 'En attente' && (
                <button onClick={() => { handleConfirmer(selectedRdv.id); setShowModal(false); }} style={{
                  flex: 1, background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  padding: '12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
                }}>
                  ✅ Confirmer
                </button>
              )}
              {selectedRdv.statut !== 'Annulé' && (
                <button onClick={() => { handleAnnuler(selectedRdv.id); setShowModal(false); }} style={{
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
            <div key={rdv.id} style={{
              background: 'white', borderRadius: '16px', padding: '16px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', gap: '16px',
              borderLeft: `4px solid ${typeColors[rdv.type] || '#1565C0'}`
            }}>
              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1565C0' }}>{rdv.heure}</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#9CA3AF' }}>{rdv.duree}</p>
              </div>
              <div style={{ width: '1px', height: '40px', background: '#E5E7EB' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  background: `linear-gradient(135deg, ${typeColors[rdv.type]}, ${typeColors[rdv.type]}99)`,
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
                background: `${typeColors[rdv.type]}15`, color: typeColors[rdv.type],
                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
              }}>{rdv.type}</span>
              <span style={{
                background: statutColors[rdv.statut].bg, color: statutColors[rdv.statut].color,
                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
              }}>{rdv.statut}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleVoir(rdv)} style={{
                  background: '#EEF2FF', color: '#1565C0', border: 'none',
                  borderRadius: '8px', padding: '6px 12px', fontSize: '11px',
                  cursor: 'pointer', fontWeight: '600'
                }}>Voir</button>
                {rdv.statut === 'En attente' && (
                  <button onClick={() => handleConfirmer(rdv.id)} style={{
                    background: '#DCFCE7', color: '#16a34a', border: 'none',
                    borderRadius: '8px', padding: '6px 12px', fontSize: '11px',
                    cursor: 'pointer', fontWeight: '600'
                  }}>Confirmer</button>
                )}
                {rdv.statut !== 'Annulé' && (
                  <button onClick={() => handleAnnuler(rdv.id)} style={{
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