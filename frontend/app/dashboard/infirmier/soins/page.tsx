'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const soinsSimules = [
  { id: 1, patient: 'El Idrissi Y.', type: 'Injection', service: 'Cardiologie', heure: '08:00', statut: 'Terminé', urgence: 'Normal' },
  { id: 2, patient: 'Benali F.', type: 'Pansement', service: 'Neurologie', heure: '09:30', statut: 'En cours', urgence: 'Normal' },
  { id: 3, patient: 'Alaoui M.', type: 'Prélèvement', service: 'Pédiatrie', heure: '10:00', statut: 'À faire', urgence: 'Urgent' },
  { id: 4, patient: 'Chraibi S.', type: 'Médicaments', service: 'Orthopédie', heure: '11:15', statut: 'À faire', urgence: 'Normal' },
  { id: 5, patient: 'Tazi A.', type: 'Monitoring', service: 'Urgences', heure: '07:00', statut: 'Terminé', urgence: 'Urgent' },
  { id: 6, patient: 'Bouazza K.', type: 'Injection', service: 'Cardiologie', heure: '14:00', statut: 'À faire', urgence: 'Normal' },
  { id: 7, patient: 'Lahlou O.', type: 'Médicaments', service: 'Neurologie', heure: '12:00', statut: 'À faire', urgence: 'Normal' },
  { id: 8, patient: 'Senhaji A.', type: 'Prélèvement', service: 'Urgences', heure: '15:30', statut: 'À faire', urgence: 'Urgent' },
];

const chartData = [
  { service: 'Cardio', soins: 15 },
  { service: 'Neuro', soins: 8 },
  { service: 'Pédia', soins: 12 },
  { service: 'Ortho', soins: 6 },
  { service: 'Urgence', soins: 24 },
];

const typesSoin = ['Tous', 'Injection', 'Pansement', 'Monitoring', 'Médicaments', 'Prélèvement'];

export default function InfirmierSoins() {
  const [soins, setSoins] = useState(soinsSimules);
  const [selectedType, setSelectedType] = useState('Tous');
  const [selectedUrgence, setSelectedUrgence] = useState('Tous');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedSoin, setSelectedSoin] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    // Simulated fetch - normally would fetch from API
    try {
      // const res = await api.get('/api/soins');
      // if (res.data?.length > 0) setSoins(res.data);
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const markAsDone = (id: number) => {
    setSoins(prev => prev.map(s => s.id === id ? { ...s, statut: 'Terminé' } : s));
    showToast('Soin marqué comme terminé ✅');
  };

  const openModal = (soin: any) => {
    setSelectedSoin(soin);
    setIsModalOpen(true);
  };

  const filteredSoins = soins.filter(s => {
    const matchType = selectedType === 'Tous' || s.type === selectedType;
    const matchUrgence = selectedUrgence === 'Tous' || s.urgence === selectedUrgence;
    return matchType && matchUrgence;
  });

  const getBorderColor = (statut: string, urgence: string) => {
    if (urgence === 'Urgent' && statut !== 'Terminé') return '#dc2626'; // Red
    if (statut === 'Terminé') return '#16a34a'; // Green
    if (statut === 'En cours') return '#ca8a04'; // Yellow
    return '#0369A1'; // Default blue
  };

  const getStatusBadge = (statut: string) => {
    if (statut === 'Terminé') return { bg: '#dcfce7', color: '#16a34a' };
    if (statut === 'À faire') return { bg: '#f1f5f9', color: '#64748b' };
    return { bg: '#fef9c3', color: '#ca8a04' }; // En cours
  };

  const stats = {
    total: soins.length,
    termines: soins.filter(s => s.statut === 'Terminé').length,
    restants: soins.filter(s => s.statut !== 'Terminé').length
  };

  return (
    <div style={{ background: '#E0F2FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="infirmier" activeItem="Soins" />
      
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {toastMessage && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
            background: 'white', borderRadius: '12px', padding: '16px 24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: '#16a34a', fontWeight: '600',
            borderLeft: '4px solid #16a34a', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Gestion des Soins</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Suivi des soins prescrits du jour</p>
          </div>
          <RefreshButton onRefresh={fetchData} color="#0369A1" />
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Main List */}
          <div style={{ flex: 2 }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { label: 'Total Soins', value: stats.total, icon: '📋', color: '#0369A1' },
                { label: 'Terminés', value: stats.termines, icon: '✅', color: '#16a34a' },
                { label: 'Restants', value: stats.restants, icon: '⏳', color: '#ea580c' },
              ].map((k, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '24px', background: '#F8FAFC', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {k.icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{k.label}</p>
                    <p style={{ margin: 0, color: k.color, fontSize: '24px', fontWeight: '800' }}>{k.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151', alignSelf: 'center', marginRight: '8px' }}>Type :</span>
                {typesSoin.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{
                      background: selectedType === type ? '#0369A1' : 'white',
                      color: selectedType === type ? 'white' : '#6B7280',
                      border: selectedType === type ? 'none' : '1px solid #E5E7EB',
                      borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginRight: '8px' }}>Urgence :</span>
                {['Tous', 'Normal', 'Urgent'].map(urg => (
                  <button
                    key={urg}
                    onClick={() => setSelectedUrgence(urg)}
                    style={{
                      background: selectedUrgence === urg ? '#0369A1' : 'white',
                      color: selectedUrgence === urg ? 'white' : '#6B7280',
                      border: selectedUrgence === urg ? 'none' : '1px solid #E5E7EB',
                      borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {urg}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredSoins.map((soin) => (
                <div key={soin.id} style={{ 
                  background: 'white', borderRadius: '16px', padding: '16px 20px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderLeft: \`4px solid \${getBorderColor(soin.statut, soin.urgence)}\`
                }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: '#F0F9FF', color: '#0369A1', fontWeight: '700', padding: '8px 12px', borderRadius: '10px', fontSize: '14px' }}>
                      {soin.heure}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '15px' }}>{soin.patient}</p>
                        {soin.urgence === 'Urgent' && (
                          <span style={{ background: '#FEE2E2', color: '#dc2626', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: '700' }}>URGENT</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>💉 {soin.type}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
                        <span style={{ fontSize: '12px', color: '#475569' }}>🏥 {soin.service}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ 
                      background: getStatusBadge(soin.statut).bg, color: getStatusBadge(soin.statut).color, 
                      padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' 
                    }}>
                      {soin.statut}
                    </span>
                    <button 
                      onClick={() => openModal(soin)}
                      style={{ background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Détails
                    </button>
                    {soin.statut !== 'Terminé' && (
                      <button 
                        onClick={() => markAsDone(soin.id)}
                        style={{ background: '#0369A1', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        ✓ Fait
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div style={{ flex: 1 }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: '24px' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Soins par Service</p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="service" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={60} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="soins" fill="#0EA5E9" radius={[0,4,4,0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
              
              <div style={{ marginTop: '24px', padding: '16px', background: '#F0F9FF', borderRadius: '12px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: '700', color: '#0369A1', fontSize: '13px' }}>Note de service</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#334155', lineHeight: '1.5' }}>
                  Une charge importante est attendue aux Urgences aujourd'hui. Assurez-vous d'avoir le matériel de prélèvement prêt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Détails */}
      {isModalOpen && selectedSoin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '500px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#0369A1', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Détails du Soin — {selectedSoin.patient}</h2>
                <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', marginTop: '6px' }}>{selectedSoin.service}</span>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>Type de soin</p>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{selectedSoin.type}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>Heure prévue</p>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{selectedSoin.heure}</p>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#334155' }}>Prescription :</p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                  {selectedSoin.type === 'Injection' && <li>Amoxicilline 1g IV lent</li>}
                  {selectedSoin.type === 'Injection' && <li>Rincer avec 10ml NaCl</li>}
                  {selectedSoin.type === 'Pansement' && <li>Nettoyage sérum physiologique</li>}
                  {selectedSoin.type === 'Pansement' && <li>Mettre tulle gras et compresse stérile</li>}
                  {selectedSoin.type === 'Prélèvement' && <li>NFS, CRP, Iono sanguin</li>}
                  {selectedSoin.type === 'Prélèvement' && <li>Tubes: EDTA (violet), Sec (rouge)</li>}
                  {(selectedSoin.type === 'Monitoring' || selectedSoin.type === 'Médicaments') && <li>Suivre protocole standard du service</li>}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setIsModalOpen(false)} style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Fermer</button>
                {selectedSoin.statut !== 'Terminé' && (
                  <button onClick={() => { markAsDone(selectedSoin.id); setIsModalOpen(false); }} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    Marquer Terminé
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
