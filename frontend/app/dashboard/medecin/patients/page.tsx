'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/api';

interface Patient {
  id?: number;
  nom: string;
  prenom: string;
  age?: number;
  service: string;
  diagnostic?: string;
  medicaments?: string;
  date_consultation?: string;
}

const patientsSimules: Patient[] = [
  { id: 1, nom: 'El Idrissi', prenom: 'Youssef', age: 45, service: 'Cardiologie', diagnostic: 'Hypertension', medicaments: 'Amlodipine 5mg', date_consultation: '2024-05-08' },
  { id: 2, nom: 'Benali', prenom: 'Fatima', age: 32, service: 'Neurologie', diagnostic: 'Migraine', medicaments: 'Sumatriptan', date_consultation: '2024-05-08' },
  { id: 3, nom: 'Alaoui', prenom: 'Mohamed', age: 58, service: 'Cardiologie', diagnostic: 'Arythmie', medicaments: 'Bisoprolol', date_consultation: '2024-05-07' },
  { id: 4, nom: 'Chraibi', prenom: 'Sara', age: 28, service: 'Pédiatrie', diagnostic: 'Rhinite', medicaments: 'Cetirizine', date_consultation: '2024-05-07' },
  { id: 5, nom: 'Tazi', prenom: 'Ahmed', age: 67, service: 'Cardiologie', diagnostic: 'Insuffisance cardiaque', medicaments: 'Furosémide', date_consultation: '2024-05-06' },
  { id: 6, nom: 'Berrada', prenom: 'Khadija', age: 41, service: 'Neurologie', diagnostic: 'Épilepsie', medicaments: 'Valproate', date_consultation: '2024-05-06' },
];

export default function MedecinPatients() {
  const [patients, setPatients] = useState<Patient[]>(patientsSimules);
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState('Tous');
  const router = useRouter();

  useEffect(() => {
    api.get('/api/patients')
      .then((res) => { if (res.data?.length > 0) setPatients(res.data); })
      .catch(() => {});
  }, []);

  const services = ['Tous', 'Cardiologie', 'Neurologie', 'Pédiatrie', 'Orthopédie'];

  const filtered = patients.filter((p) => {
    const matchSearch = `${p.nom} ${p.prenom}`.toLowerCase().includes(search.toLowerCase());
    const matchService = selectedService === 'Tous' || p.service === selectedService;
    return matchSearch && matchService;
  });

  return (
    <div style={{ background: '#E8F0FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="medecin" activeItem="Patients" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
              Mes Patients
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
              {filtered.length} patients trouvés
            </p>
          </div>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un patient..."
              style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#374151', width: '200px' }}
            />
          </div>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {services.map((s) => (
            <button key={s} onClick={() => setSelectedService(s)} style={{
              padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: selectedService === s ? '#1565C0' : 'white',
              color: selectedService === s ? 'white' : '#6B7280',
              fontSize: '12px', fontWeight: '600',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#EEF2FF' }}>
                {['Patient', 'Âge', 'Service', 'Diagnostic', 'Médicaments', 'Date', 'Action'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', color: '#1565C0', fontWeight: '700' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '14px'
                      }}>
                        {p.nom?.charAt(0)}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{p.nom} {p.prenom}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>{p.age ?? '—'} ans</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: '#EEF2FF', color: '#1565C0',
                      padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                    }}>{p.service}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>{p.diagnostic ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#6B7280', fontFamily: 'monospace' }}>{p.medicaments ?? '—'}</td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: '#6B7280' }}>{p.date_consultation ?? '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => router.push(`/dashboard/medecin/patients/${p.id || i}`)}
                      style={{
                        background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                        color: 'white', border: 'none', borderRadius: '8px',
                        padding: '6px 14px', fontSize: '11px', cursor: 'pointer', fontWeight: '600'
                      }}
                    >
                      Voir →
                    </button>
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