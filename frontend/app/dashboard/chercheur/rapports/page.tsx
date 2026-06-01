'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import api from '@/lib/api';

interface Publication {
  id: number;
  titre: string;
  auteurs: string;
  journal: string;
  date: string;
  statut: 'Publié' | 'En révision' | 'Soumis' | 'Brouillon';
  citations: number;
  type: string;
}

const publicationsDefaut: Publication[] = [
  { id: 1, titre: 'Analyse épidémiologique des maladies cardiovasculaires au Maroc', auteurs: 'Rhanem, El Idrissi, Benali', journal: 'Journal Médical Marocain', date: '2026-03-15', statut: 'Publié', citations: 12, type: 'Article' },
  { id: 2, titre: 'Impact du diabète de type 2 sur la population urbaine de Rabat', auteurs: 'Rhanem, Alaoui', journal: 'Revue Africaine de Santé', date: '2026-01-20', statut: 'Publié', citations: 8, type: 'Article' },
  { id: 3, titre: 'Prévalence des maladies neurologiques dans la région de Rabat-Salé', auteurs: 'Rhanem, Chraibi, Tazi', journal: 'Neurologie Clinique', date: '2026-04-10', statut: 'En révision', citations: 0, type: 'Article' },
  { id: 4, titre: 'Étude comparative des traitements antihypertenseurs', auteurs: 'Rhanem, Berrada', journal: 'Pharmacologie Médicale', date: '2026-02-28', statut: 'Soumis', citations: 0, type: 'Étude' },
  { id: 5, titre: 'Rapport annuel santé publique Ibn Sina 2025', auteurs: 'Équipe de recherche', journal: 'CHU Ibn Sina', date: '2026-01-01', statut: 'Publié', citations: 24, type: 'Rapport' },
  { id: 6, titre: 'Analyse des facteurs de risque cardiovasculaire', auteurs: 'Rhanem', journal: '', date: '2026-05-01', statut: 'Brouillon', citations: 0, type: 'Article' },
];

const statutColors: Record<string, { bg: string; color: string }> = {
  'Publié': { bg: '#DCFCE7', color: '#16a34a' },
  'En révision': { bg: '#FEF9C3', color: '#ca8a04' },
  'Soumis': { bg: '#EEF2FF', color: '#1565C0' },
  'Brouillon': { bg: '#F3F4F6', color: '#6B7280' },
};

const typeColors: Record<string, { bg: string; color: string }> = {
  'Article': { bg: '#F5F3FF', color: '#5B21B6' },
  'Étude': { bg: '#E0F2FE', color: '#0369A1' },
  'Rapport': { bg: '#FEF9C3', color: '#ca8a04' },
};

export default function ChercheurRapports() {
  const [publications, setPublications] = useState<Publication[]>(publicationsDefaut);
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [filterType, setFilterType] = useState('Tous');
  const [search, setSearch] = useState('');
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [notification, setNotification] = useState('');

  const fetchData = useCallback(async () => {
    try {
      await api.get('/api/patients');
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  const statuts = ['Tous', 'Publié', 'En révision', 'Soumis', 'Brouillon'];
  const types = ['Tous', 'Article', 'Étude', 'Rapport'];

  const filtered = publications.filter(p => {
    const matchSearch = p.titre.toLowerCase().includes(search.toLowerCase()) ||
      p.auteurs.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'Tous' || p.statut === filterStatut;
    const matchType = filterType === 'Tous' || p.type === filterType;
    return matchSearch && matchStatut && matchType;
  });

  const handleCiter = (pub: Publication) => {
    setNotification(`✅ Citation copiée pour "${pub.titre.substring(0, 40)}..."`);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleNouveau = () => {
    const nouvelle: Publication = {
      id: publications.length + 1,
      titre: 'Nouvelle publication — ' + new Date().toLocaleDateString('fr-FR'),
      auteurs: 'Rhanem',
      journal: '',
      date: new Date().toISOString().split('T')[0],
      statut: 'Brouillon',
      citations: 0,
      type: 'Article'
    };
    setPublications(prev => [nouvelle, ...prev]);
    setNotification('✅ Nouvelle publication créée !');
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div style={{ background: '#EDE9FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="chercheur" activeItem="Rapports" />

      {/* Notification */}
      {notification && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: 'white', border: '1px solid #E5E7EB',
          borderRadius: '12px', padding: '12px 20px',
          color: '#1a1a2e', fontWeight: '600', fontSize: '13px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
        }}>{notification}</div>
      )}

      {/* Modal détail publication */}
      {selectedPub && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px', width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>Détails Publication</h2>
              <button onClick={() => setSelectedPub(null)} style={{
                background: '#F3F4F6', border: 'none', borderRadius: '8px',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px'
              }}>✕</button>
            </div>

            <div style={{ background: '#F5F3FF', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: '700', color: '#1a1a2e', fontSize: '15px', lineHeight: '1.4' }}>
                {selectedPub.titre}
              </p>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>{selectedPub.auteurs}</p>
            </div>

            {[
              { label: 'Journal', value: selectedPub.journal || 'Non soumis' },
              { label: 'Date', value: selectedPub.date },
              { label: 'Type', value: selectedPub.type },
              { label: 'Statut', value: selectedPub.statut },
              { label: 'Citations', value: `${selectedPub.citations} citations` },
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
              <button onClick={() => handleCiter(selectedPub)} style={{
                flex: 1, background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
                color: 'white', border: 'none', borderRadius: '12px',
                padding: '12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
              }}>📋 Copier citation</button>
              <button onClick={() => setSelectedPub(null)} style={{
                flex: 1, background: '#F3F4F6', color: '#374151',
                border: 'none', borderRadius: '12px',
                padding: '12px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
              }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Publications & Rapports</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              {filtered.length} publications — {publications.filter(p => p.statut === 'Publié').reduce((s, p) => s + p.citations, 0)} citations totales
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
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..." style={{
                  border: 'none', outline: 'none', fontSize: '13px', width: '180px'
                }} />
            </div>
            <button onClick={handleNouveau} style={{
              background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
              color: 'white', border: 'none', borderRadius: '12px',
              padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
            }}>+ Nouvelle publication</button>
          </div>
        </div>

        {/* KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '20px' }}>
          {[
            { label: 'Publications', value: publications.length, icon: '📄', color: '#5B21B6' },
            { label: 'Publiées', value: publications.filter(p => p.statut === 'Publié').length, icon: '✅', color: '#16a34a' },
            { label: 'En cours', value: publications.filter(p => p.statut !== 'Publié' && p.statut !== 'Brouillon').length, icon: '⏳', color: '#ca8a04' },
            { label: 'Citations', value: publications.reduce((s, p) => s + p.citations, 0), icon: '🔗', color: '#1565C0' },
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
          {statuts.map(s => (
            <button key={s} onClick={() => setFilterStatut(s)} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: filterStatut === s ? '#5B21B6' : 'white',
              color: filterStatut === s ? 'white' : '#6B7280',
              fontSize: '11px', fontWeight: '600', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}>{s}</button>
          ))}
          <div style={{ width: '1px', background: '#E5E7EB', margin: '0 4px' }} />
          {types.map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: filterType === t ? '#7C3AED' : 'white',
              color: filterType === t ? 'white' : '#6B7280',
              fontSize: '11px', fontWeight: '600', boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
            }}>{t}</button>
          ))}
        </div>

        {/* Liste Publications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((pub) => (
            <div key={pub.id} style={{
              background: 'white', borderRadius: '16px', padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${pub.statut === 'Publié' ? '#16a34a' : pub.statut === 'En révision' ? '#ca8a04' : pub.statut === 'Soumis' ? '#1565C0' : '#9CA3AF'}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <p style={{ margin: '0 0 6px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px', lineHeight: '1.4' }}>
                    {pub.titre}
                  </p>
                  <p style={{ margin: '0 0 8px', color: '#6B7280', fontSize: '12px' }}>
                    👥 {pub.auteurs}
                    {pub.journal && <span> • 📰 {pub.journal}</span>}
                    <span> • 📅 {pub.date}</span>
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      background: statutColors[pub.statut]?.bg,
                      color: statutColors[pub.statut]?.color,
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>{pub.statut}</span>
                    <span style={{
                      background: typeColors[pub.type]?.bg,
                      color: typeColors[pub.type]?.color,
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>{pub.type}</span>
                    {pub.citations > 0 && (
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>
                        🔗 {pub.citations} citations
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => setSelectedPub(pub)} style={{
                    background: '#F5F3FF', color: '#5B21B6',
                    border: 'none', borderRadius: '8px',
                    padding: '8px 14px', fontSize: '11px',
                    cursor: 'pointer', fontWeight: '600'
                  }}>Voir</button>
                  <button onClick={() => handleCiter(pub)} style={{
                    background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
                    color: 'white', border: 'none', borderRadius: '8px',
                    padding: '8px 14px', fontSize: '11px',
                    cursor: 'pointer', fontWeight: '600'
                  }}>📋 Citer</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}