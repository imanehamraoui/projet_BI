'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';

const patientsSimules = [
  { id: 1, nom: 'El Idrissi', prenom: 'Youssef', service: 'Cardiologie', chambre: 'C-201', soin_du_jour: 'Prise de sang', statut: 'En cours', heure: '08:00', notes: 'Patient stable, surveillance tension' },
  { id: 2, nom: 'Benali', prenom: 'Fatima', service: 'Neurologie', chambre: 'N-105', soin_du_jour: 'Injection IV', statut: 'Terminé', heure: '07:30', notes: 'Injection effectuée sans complications' },
  { id: 3, nom: 'Alaoui', prenom: 'Mohamed', service: 'Pédiatrie', chambre: 'P-312', soin_du_jour: 'Soins plaie', statut: 'À faire', heure: '10:00', notes: 'Changement pansement prévu' },
  { id: 4, nom: 'Chraibi', prenom: 'Sara', service: 'Orthopédie', chambre: 'O-408', soin_du_jour: 'Pansement', statut: 'En cours', heure: '09:15', notes: 'Post-opératoire jour 2' },
  { id: 5, nom: 'Tazi', prenom: 'Ahmed', service: 'Urgences', chambre: 'U-102', soin_du_jour: 'Monitoring', statut: 'En cours', heure: '06:00', notes: 'Monitoring cardiaque continu' },
  { id: 6, nom: 'Bouazza', prenom: 'Khadija', service: 'Cardiologie', chambre: 'C-205', soin_du_jour: 'ECG', statut: 'À faire', heure: '11:00', notes: 'ECG de contrôle programmé' },
  { id: 7, nom: 'Lahlou', prenom: 'Omar', service: 'Neurologie', chambre: 'N-110', soin_du_jour: 'Administration médicaments', statut: 'Terminé', heure: '07:00', notes: 'Traitement anti-épileptique administré' },
  { id: 8, nom: 'Senhaji', prenom: 'Amina', service: 'Urgences', chambre: 'U-108', soin_du_jour: 'Perfusion', statut: 'En cours', heure: '08:30', notes: 'Réhydratation IV en cours' },
];

const services = ['Tous', 'Cardiologie', 'Neurologie', 'Pédiatrie', 'Orthopédie', 'Urgences'];

export default function InfirmierPatients() {
  const [patients, setPatients] = useState(patientsSimules);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('Tous');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/patients');
      if (res.data?.data?.length > 0) {
        // Map backend data to our frontend format if necessary
        const formattedData = res.data.data.map((p: any) => ({
          ...p,
          id: p.id || Math.random(),
          nom: p.nom || 'Inconnu',
          prenom: p.prenom || '',
          service: p.service || 'Général',
          chambre: p.chambre || 'N/A',
          soin_du_jour: p.soin_du_jour || 'Soins standards',
          statut: p.statut || 'À faire',
          heure: p.heure || '09:00',
          notes: p.notes || ''
        }));
        setPatients(formattedData.slice(0, 8)); // Use API data, limit to 8 for display
      }
    } catch {
       // Silent catch, fallback data remains
    }
  }, []);

  useAutoRefresh(fetchData, 30);

  const filteredPatients = patients.filter(p => {
    const matchesSearch = (p.nom + ' ' + p.prenom).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = selectedService === 'Tous' || p.service === selectedService;
    return matchesSearch && matchesService;
  });

  const getStatusColor = (statut: string) => {
    if (statut === 'Terminé') return { bg: '#dcfce7', color: '#16a34a' }; // Green
    if (statut === 'À faire') return { bg: '#fef9c3', color: '#ca8a04' }; // Yellow
    if (statut === 'En cours') return { bg: '#eef2ff', color: '#1565C0' }; // Blue
    return { bg: '#f3f4f6', color: '#6b7280' }; // Gray
  };

  const handleViewPatient = (patient: any) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  return (
    <div style={{ background: '#E0F2FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="infirmier" activeItem="Patients" />
      
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Banner Alert */}
        <div style={{ 
          background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '12px', 
          padding: '12px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>💉</span>
          <span style={{ color: '#BE123C', fontSize: '14px', fontWeight: '600' }}>
            Accès limité — Soins du jour uniquement
          </span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Patients du jour</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Liste des patients nécessitant des soins</p>
          </div>
          <RefreshButton onRefresh={fetchData} color="#0369A1" />
        </div>

        {/* Controls */}
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
            {services.map(service => (
              <button
                key={service}
                onClick={() => setSelectedService(service)}
                style={{
                  background: selectedService === service ? '#0369A1' : 'white',
                  color: selectedService === service ? 'white' : '#6B7280',
                  border: selectedService === service ? 'none' : '1px solid #E5E7EB',
                  borderRadius: '20px', padding: '6px 16px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {service}
              </button>
            ))}
          </div>
        </div>

        {/* Patients Table */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F0F9FF' }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>Patient</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>Service & Chambre</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>Soin du Jour</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>Statut</th>
                <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: '12px', color: '#0369A1', fontWeight: '700' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient, i) => (
                <tr key={patient.id} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: 'linear-gradient(135deg, #0369A1, #0EA5E9)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '16px'
                      }}>
                        {patient.nom.charAt(0)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1a1a2e' }}>{patient.nom} {patient.prenom}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>ID: #{(1000 + patient.id).toString()}</p>
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
                    }}>
                      {patient.statut}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleViewPatient(patient)}
                      style={{ 
                        background: 'linear-gradient(135deg, #0369A1, #0EA5E9)', 
                        color: 'white', border: 'none', borderRadius: '8px', 
                        padding: '8px 16px', fontSize: '12px', fontWeight: '600',
                        cursor: 'pointer'
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

      {/* Patient Modal */}
      {isModalOpen && selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '500px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0369A1, #0EA5E9)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Détails du Soin</h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.9 }}>{selectedPatient.nom} {selectedPatient.prenom}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
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
                  }}>
                    {selectedPatient.statut}
                  </span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '600', color: '#1a1a2e' }}>{selectedPatient.soin_du_jour}</p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#6B7280' }}>
                  <span>⏱ Prévu : {selectedPatient.heure}</span>
                </div>
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#92400E' }}>Notes Médicales</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#B45309', lineHeight: '1.5' }}>{selectedPatient.notes}</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Fermer
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: '#0369A1', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Dossier Soin →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
