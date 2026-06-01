'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const personnelSimule = [
  { id: 1, nom: 'Dr. Benali', role: 'Médecin', service: 'Cardiologie', statut: 'Actif', date_embauche: '2019-03-15', tel: '+212 6 12 34 56 78', email: 'benali@ibnSina.ma' },
  { id: 2, nom: 'Marie Dupont', role: 'Administratif', service: 'Accueil', statut: 'Actif', date_embauche: '2020-06-01', tel: '+212 6 22 33 44 55', email: 'dupont@ibnSina.ma' },
  { id: 3, nom: 'Prof. Rhanem', role: 'Chercheur', service: 'Recherche', statut: 'Actif', date_embauche: '2015-09-01', tel: '+212 6 33 44 55 66', email: 'rhanem@ibnSina.ma' },
  { id: 4, nom: 'Sophie Martin', role: 'Infirmier', service: 'Urgences', statut: 'Actif', date_embauche: '2021-01-15', tel: '+212 6 44 55 66 77', email: 'martin@ibnSina.ma' },
  { id: 5, nom: 'Dr. Alaoui', role: 'Médecin', service: 'Neurologie', statut: 'Congé', date_embauche: '2018-04-20', tel: '+212 6 55 66 77 88', email: 'alaoui@ibnSina.ma' },
  { id: 6, nom: 'Fatima Zahra', role: 'Infirmier', service: 'Pédiatrie', statut: 'Actif', date_embauche: '2022-02-10', tel: '+212 6 66 77 88 99', email: 'zahra@ibnSina.ma' },
  { id: 7, nom: 'Hassan Tazi', role: 'Administratif', service: 'Comptabilité', statut: 'Actif', date_embauche: '2017-07-01', tel: '+212 6 77 88 99 00', email: 'tazi@ibnSina.ma' },
  { id: 8, nom: 'Dr. Chraibi', role: 'Médecin', service: 'Orthopédie', statut: 'Absent', date_embauche: '2016-11-15', tel: '+212 6 88 99 00 11', email: 'chraibi@ibnSina.ma' },
  { id: 9, nom: 'Amina Senhaji', role: 'Infirmier', service: 'Cardiologie', statut: 'Actif', date_embauche: '2023-03-01', tel: '+212 6 99 00 11 22', email: 'senhaji@ibnSina.ma' },
  { id: 10, nom: 'Dr. Bouazza', role: 'Médecin', service: 'Pédiatrie', statut: 'Actif', date_embauche: '2020-08-15', tel: '+212 6 00 11 22 33', email: 'bouazza@ibnSina.ma' },
  { id: 11, nom: 'Karim Lahlou', role: 'Infirmier', service: 'Neurologie', statut: 'Actif', date_embauche: '2019-11-01', tel: '+212 6 11 22 33 44', email: 'lahlou@ibnSina.ma' },
  { id: 12, nom: 'Sarah Bennani', role: 'Administratif', service: 'RH', statut: 'Congé', date_embauche: '2021-05-20', tel: '+212 6 22 33 44 55', email: 'bennani@ibnSina.ma' },
];

const pieData = [
  { name: 'Médecins', value: 28 },
  { name: 'Infirmiers', value: 85 },
  { name: 'Administratifs', value: 42 },
  { name: 'Chercheurs', value: 12 },
];
const COLORS = ['#1565C0', '#0EA5E9', '#16a34a', '#7C3AED'];

const barData = [
  { service: 'Cardio', count: 42 },
  { service: 'Neuro', count: 35 },
  { service: 'Pédia', count: 38 },
  { service: 'Ortho', count: 25 },
  { service: 'Urgence', count: 58 },
  { service: 'Admin', count: 20 },
];

export default function DirecteurPersonnel() {
  const [personnel, setPersonnel] = useState(personnelSimule);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('Tous');
  const [selectedStatut, setSelectedStatut] = useState('Tous');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    // API not available for personnel yet, using simulated data
  }, []);

  useEffect(() => {
    ensureKeycloakSession().then((auth) => {
      if (auth) fetchData();
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 30);

  const filteredPersonnel = personnel.filter(p => {
    const matchSearch = p.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = selectedRole === 'Tous' || p.role === selectedRole;
    const matchStatut = selectedStatut === 'Tous' || p.statut === selectedStatut;
    return matchSearch && matchRole && matchStatut;
  });

  const getStatusBadge = (statut: string) => {
    if (statut === 'Actif') return { bg: '#dcfce7', color: '#16a34a' };
    if (statut === 'Congé') return { bg: '#fef9c3', color: '#ca8a04' };
    return { bg: '#fee2e2', color: '#dc2626' }; // Absent
  };

  const getRoleColor = (role: string) => {
    if (role === 'Médecin') return '#1565C0';
    if (role === 'Infirmier') return '#0EA5E9';
    if (role === 'Administratif') return '#16a34a';
    if (role === 'Chercheur') return '#7C3AED';
    return '#1e293b';
  };

  const openModal = (emp: any) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="directeur" activeItem="Personnel" />
      
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Ressources Humaines</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Gestion du personnel de l'hôpital</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <RefreshButton onRefresh={fetchData} color="#1e293b" />
            <div style={{ background: '#FEF9C3', borderRadius: '12px', padding: '8px 16px', border: '1px solid #FDE68A', fontSize: '13px', color: '#92400E', fontWeight: '700' }}>
              ⭐ Accès Complet
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Personnel', value: '285', icon: '👥', bg: '#F1F5F9', color: '#1e293b' },
            { label: 'Médecins', value: '28', icon: '🩺', bg: '#EEF2FF', color: '#1565C0' },
            { label: 'Infirmiers', value: '85', icon: '💉', bg: '#E0F2FE', color: '#0EA5E9' },
            { label: 'Administratifs', value: '42', icon: '👔', bg: '#DCFCE7', color: '#16a34a' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '20px', background: k.bg, width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {k.icon}
              </div>
              <div>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{k.label}</p>
                <p style={{ margin: 0, color: k.color, fontSize: '24px', fontWeight: '800' }}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Main Content */}
          <div style={{ flex: 2.5 }}>
            {/* Filters */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px 16px' }}>
                  <span style={{ color: '#9CA3AF' }}>🔍</span>
                  <input 
                    type="text" 
                    placeholder="Rechercher un employé..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: '#334155' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Rôle:</span>
                  {['Tous', 'Médecin', 'Infirmier', 'Administratif', 'Chercheur'].map(role => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      style={{
                        background: selectedRole === role ? '#1e293b' : 'white',
                        color: selectedRole === role ? 'white' : '#64748b',
                        border: selectedRole === role ? 'none' : '1px solid #E2E8F0',
                        borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid #E2E8F0', paddingLeft: '24px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Statut:</span>
                  {['Tous', 'Actif', 'Congé', 'Absent'].map(statut => (
                    <button
                      key={statut}
                      onClick={() => setSelectedStatut(statut)}
                      style={{
                        background: selectedStatut === statut ? '#1e293b' : 'white',
                        color: selectedStatut === statut ? 'white' : '#64748b',
                        border: selectedStatut === statut ? 'none' : '1px solid #E2E8F0',
                        borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {statut}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Employé</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Rôle & Service</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Date d'embauche</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Statut</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPersonnel.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '36px', height: '36px', borderRadius: '10px', 
                            background: `${getRoleColor(emp.role)}15`, color: getRoleColor(emp.role),
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px'
                          }}>
                            {emp.nom.charAt(0)}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{emp.nom}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>ID: EMP-{1000 + emp.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: getRoleColor(emp.role) }}>{emp.role}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{emp.service}</p>
                      </td>
                      <td style={{ padding: '16px', fontSize: '12px', color: '#475569' }}>
                        {emp.date_embauche}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          background: getStatusBadge(emp.statut).bg, color: getStatusBadge(emp.statut).color,
                          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600'
                        }}>
                          {emp.statut}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => openModal(emp)}
                          style={{ background: '#F1F5F9', color: '#1e293b', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Voir →
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPersonnel.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Aucun employé trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column Charts */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Répartition par Rôle</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                    {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {pieData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: COLORS[i] }} />
                      <span style={{ fontSize: '12px', color: '#475569' }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Personnel par Service</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="service" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} width={55} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#475569" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Détails */}
      {isModalOpen && selectedEmployee && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '500px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'white' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '700'
                }}>
                  {selectedEmployee.nom.charAt(0)}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>{selectedEmployee.nom}</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>ID: EMP-{1000 + selectedEmployee.id}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', flex: 1, marginRight: '12px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>Rôle</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: getRoleColor(selectedEmployee.role) }}>{selectedEmployee.role}</p>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>Service</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{selectedEmployee.service}</p>
                </div>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Contact & Infos</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>📧</span>
                    <span style={{ fontSize: '13px', color: '#475569' }}>{selectedEmployee.email}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>📱</span>
                    <span style={{ fontSize: '13px', color: '#475569' }}>{selectedEmployee.tel}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#94a3b8' }}>📅</span>
                    <span style={{ fontSize: '13px', color: '#475569' }}>Embauche: {selectedEmployee.date_embauche}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                  background: getStatusBadge(selectedEmployee.statut).bg, color: getStatusBadge(selectedEmployee.statut).color,
                  padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                }}>
                  Statut : {selectedEmployee.statut}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setIsModalOpen(false)} style={{ background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Fermer</button>
                  <button style={{ background: '#1e293b', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Éditer</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
