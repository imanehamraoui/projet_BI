'use client';

import { useState, useCallback, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const rapportsSimules = [
  { id: 1, titre: 'Bilan Financier Q3 2024', type: 'Finances', date: '01 Oct 2024', format: 'PDF', taille: '2.4 MB' },
  { id: 2, titre: 'Audit de Sécurité Septembre', type: 'Sécurité', date: '30 Sep 2024', format: 'PDF', taille: '1.1 MB' },
  { id: 3, titre: 'Activité Hospitalière - Sep 2024', type: 'Activité', date: '28 Sep 2024', format: 'Excel', taille: '5.6 MB' },
  { id: 4, titre: 'Effectifs et Rotations', type: 'Personnel', date: '15 Sep 2024', format: 'PDF', taille: '1.8 MB' },
  { id: 5, titre: 'Statistiques Urgences Q3', type: 'Activité', date: '10 Sep 2024', format: 'CSV', taille: '0.8 MB' },
  { id: 6, titre: 'Rapport Annuel 2023', type: 'Général', date: '15 Jan 2024', format: 'PDF', taille: '12.5 MB' },
];

const statsRapports = [
  { mois: 'Jui', total: 12 },
  { mois: 'Aoû', total: 15 },
  { mois: 'Sep', total: 24 },
  { mois: 'Oct', total: 8 },
];

export default function DirecteurRapports() {
  const [rapports, setRapports] = useState(rapportsSimules);
  const [filterType, setFilterType] = useState('Tous');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedReportForPreview, setSelectedReportForPreview] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form states
  const [newReportType, setNewReportType] = useState('Activité mensuelle');
  const [newReportPeriod, setNewReportPeriod] = useState('Mois');
  const [newReportFormat, setNewReportFormat] = useState('PDF');

  const fetchData = useCallback(async () => {}, []);
  useEffect(() => {
    ensureKeycloakSession().then((auth) => {
      if (auth) fetchData();
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 60);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleGenerate = () => {
    const newReport = {
      id: Date.now(),
      titre: `Rapport ${newReportType} (${newReportPeriod})`,
      type: newReportType.split(' ')[0],
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
      format: newReportFormat,
      taille: 'Calcul en cours...'
    };
    setRapports([newReport, ...rapports]);
    setIsModalOpen(false);
    showToast('Génération du rapport lancée ✅');
    
    // Simulate generation finishing
    setTimeout(() => {
      setRapports(prev => prev.map(r => r.id === newReport.id ? { ...r, taille: '1.5 MB' } : r));
      showToast('Rapport généré avec succès 📄');
    }, 2000);
  };

  const handleDownload = () => {
    showToast('Téléchargement démarré 📥');
  };

  const openPreview = (rapport: any) => {
    setSelectedReportForPreview(rapport);
    setIsPreviewOpen(true);
  };

  const filteredRapports = rapports.filter(r => filterType === 'Tous' || r.type === filterType);

  const getTypeStyle = (type: string) => {
    if (type === 'Finances') return { bg: '#DCFCE7', color: '#16a34a' };
    if (type === 'Sécurité' || type === 'Audit') return { bg: '#FEE2E2', color: '#dc2626' };
    if (type === 'Personnel') return { bg: '#FEF9C3', color: '#ca8a04' };
    return { bg: '#EEF2FF', color: '#1565C0' }; // Activité / Général
  };

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="directeur" activeItem="Rapports" />
      
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {toastMessage && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
            background: 'white', borderRadius: '12px', padding: '16px 24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', color: '#1e293b', fontWeight: '600',
            borderLeft: '4px solid #1e293b', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Centre de Rapports</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Génération et archives des rapports institutionnels</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshButton onRefresh={fetchData} color="#1e293b" />
            <div style={{ background: '#FEF9C3', borderRadius: '12px', padding: '8px 16px', border: '1px solid #FDE68A', fontSize: '13px', color: '#92400E', fontWeight: '700' }}>
              ⭐ Accès Complet
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Main Content */}
          <div style={{ flex: 2.5 }}>
            {/* Toolbar */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Filtre:</span>
                {['Tous', 'Activité', 'Finances', 'Personnel', 'Sécurité'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    style={{
                      background: filterType === type ? '#1e293b' : 'white',
                      color: filterType === type ? 'white' : '#64748b',
                      border: filterType === type ? 'none' : '1px solid #E2E8F0',
                      borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                style={{ 
                  background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white', 
                  border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '700', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(30,41,59,0.3)'
                }}
              >
                <span>➕</span> Générer un rapport
              </button>
            </div>

            {/* Reports List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {filteredRapports.map(rapport => (
                <div key={rapport.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ fontSize: '24px', color: '#94a3b8' }}>
                        {rapport.format === 'PDF' ? '📄' : rapport.format === 'Excel' ? '📊' : '📑'}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b', lineHeight: '1.4' }}>{rapport.titre}</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Généré le {rapport.date}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      background: getTypeStyle(rapport.type).bg, color: getTypeStyle(rapport.type).color,
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>
                      {rapport.type}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>{rapport.taille}</span>
                  </div>

                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '16px', display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handleDownload}
                      style={{ flex: 1, background: '#F8FAFC', color: '#334155', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      📥 Télécharger
                    </button>
                    <button 
                      onClick={() => openPreview(rapport)}
                      style={{ flex: 1, background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      👁 Aperçu
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div style={{ flex: 1 }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'sticky', top: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>Activité de génération</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={statsRapports} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="total" stroke="#1e293b" strokeWidth={3} dot={{ r: 4, fill: '#1e293b' }} />
                </LineChart>
              </ResponsiveContainer>
              
              <div style={{ marginTop: '24px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: '#475569' }}>Rapports Programmés</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>Bilan Mensuel (Finances)</span>
                  <span style={{ fontSize: '11px', color: '#16a34a', background: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>Actif</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>Audit Hebdo (Sécurité)</span>
                  <span style={{ fontSize: '11px', color: '#16a34a', background: '#DCFCE7', padding: '2px 8px', borderRadius: '10px' }}>Actif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '450px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Générer un rapport</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Type de rapport</label>
                <select 
                  value={newReportType} 
                  onChange={e => setNewReportType(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1e293b', fontSize: '14px', outline: 'none' }}
                >
                  <option>Activité mensuelle</option>
                  <option>Finances et Budget</option>
                  <option>Personnel et Effectifs</option>
                  <option>Audit et Traçabilité</option>
                  <option>Sécurité Système</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Période d'analyse</label>
                <select 
                  value={newReportPeriod} 
                  onChange={e => setNewReportPeriod(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1e293b', fontSize: '14px', outline: 'none' }}
                >
                  <option>Mois actuel (Octobre 2024)</option>
                  <option>Mois précédent (Septembre 2024)</option>
                  <option>Trimestre (Q3 2024)</option>
                  <option>Année (2024)</option>
                </select>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>Format de sortie</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['PDF', 'Excel', 'CSV'].map(fmt => (
                    <div 
                      key={fmt} 
                      onClick={() => setNewReportFormat(fmt)}
                      style={{ 
                        flex: 1, textAlign: 'center', padding: '12px', borderRadius: '10px', cursor: 'pointer',
                        border: newReportFormat === fmt ? '2px solid #1e293b' : '1px solid #E2E8F0',
                        background: newReportFormat === fmt ? '#F8FAFC' : 'white',
                        color: newReportFormat === fmt ? '#1e293b' : '#64748b',
                        fontWeight: newReportFormat === fmt ? '700' : '500'
                      }}
                    >
                      {fmt}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleGenerate} style={{ flex: 2, background: '#1e293b', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Générer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && selectedReportForPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#F8FAFC', borderRadius: '16px', width: '80%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>👁</span>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Aperçu : {selectedReportForPreview.titre}</h2>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleDownload} style={{ background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Télécharger</button>
                <button onClick={() => setIsPreviewOpen(false)} style={{ background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Fermer</button>
              </div>
            </div>
            <div style={{ flex: 1, padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9' }}>
              <div style={{ background: 'white', padding: '40px', width: '100%', height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px', overflowY: 'auto' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: '20px', marginBottom: '40px' }}>
                  <h1 style={{ margin: '0 0 10px', color: '#1a1a2e', fontSize: '24px' }}>Hôpital Ibn Sina - CHU Rabat</h1>
                  <h2 style={{ margin: 0, color: '#0369A1', fontSize: '20px' }}>{selectedReportForPreview.titre}</h2>
                  <p style={{ margin: '10px 0 0', color: '#64748b' }}>Date de génération : {selectedReportForPreview.date}</p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                  <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#475569' }}>Synthèse Clé 1</h3>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Donnée Majeure</p>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ margin: '0 0 10px', fontSize: '14px', color: '#475569' }}>Synthèse Clé 2</h3>
                    <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>Donnée Secondaire</p>
                  </div>
                </div>

                <div style={{ border: '1px dashed #cbd5e1', padding: '40px', textAlign: 'center', color: '#94a3b8', borderRadius: '8px' }}>
                  Aperçu du contenu paginé du document ({selectedReportForPreview.format})<br/>
                  Les tableaux de données complets sont inclus dans la version téléchargée.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
