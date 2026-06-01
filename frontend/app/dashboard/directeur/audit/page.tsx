'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const auditData = [
  { id: 1, user: 'dr.benali', action: 'GET', resource: '/api/patients', timestamp: '2024-01-15 08:23:45', ip: '192.168.1.101', statut: 'Succès' },
  { id: 2, user: 'marie.admin', action: 'GET', resource: '/api/dashboard/kpis', timestamp: '2024-01-15 08:45:12', ip: '192.168.1.102', statut: 'Succès' },
  { id: 3, user: 'prof.rhanem', action: 'GET', resource: '/api/patients', timestamp: '2024-01-15 09:12:30', ip: '192.168.1.103', statut: 'Succès' },
  { id: 4, user: 'sophie.inf', action: 'GET', resource: '/api/patients/142', timestamp: '2024-01-15 09:30:00', ip: '192.168.1.104', statut: 'Succès' },
  { id: 5, user: 'sophie.inf', action: 'GET', resource: '/api/dashboard/kpis', timestamp: '2024-01-15 09:31:15', ip: '192.168.1.104', statut: 'Refusé' },
  { id: 6, user: 'dr.benali', action: 'POST', resource: '/api/patients/update', timestamp: '2024-01-15 10:05:22', ip: '192.168.1.101', statut: 'Succès' },
  { id: 7, user: 'prof.rhanem', action: 'GET', resource: '/api/patients/nom', timestamp: '2024-01-15 10:30:00', ip: '192.168.1.103', statut: 'Refusé' },
  { id: 8, user: 'marie.admin', action: 'GET', resource: '/api/patients/finances', timestamp: '2024-01-15 11:00:45', ip: '192.168.1.102', statut: 'Succès' },
  { id: 9, user: 'directeur.chu', action: 'GET', resource: '/api/audit', timestamp: '2024-01-15 11:15:00', ip: '192.168.1.100', statut: 'Succès' },
  { id: 10, user: 'sophie.inf', action: 'GET', resource: '/api/patients/antecedents', timestamp: '2024-01-15 11:45:30', ip: '192.168.1.104', statut: 'Refusé' },
  { id: 11, user: 'dr.benali', action: 'GET', resource: '/api/dashboard/tendances', timestamp: '2024-01-15 12:00:00', ip: '192.168.1.101', statut: 'Succès' },
  { id: 12, user: 'marie.admin', action: 'POST', resource: '/api/rapports/generate', timestamp: '2024-01-15 14:30:00', ip: '192.168.1.102', statut: 'Succès' },
  { id: 13, user: 'prof.rhanem', action: 'GET', resource: '/api/patients/finances', timestamp: '2024-01-15 15:00:00', ip: '192.168.1.103', statut: 'Refusé' },
  { id: 14, user: 'dr.benali', action: 'DELETE', resource: '/api/patients/temp/55', timestamp: '2024-01-15 16:00:00', ip: '192.168.1.101', statut: 'Succès' },
  { id: 15, user: 'directeur.chu', action: 'GET', resource: '/api/audit/export', timestamp: '2024-01-15 17:00:00', ip: '192.168.1.100', statut: 'Succès' },
];

const activityData = [
  { time: '08:00', actions: 45, denied: 2 },
  { time: '10:00', actions: 120, denied: 15 },
  { time: '12:00', actions: 85, denied: 5 },
  { time: '14:00', actions: 150, denied: 10 },
  { time: '16:00', actions: 90, denied: 4 },
  { time: '18:00', actions: 30, denied: 1 },
];

export default function DirecteurAudit() {
  const [logs, setLogs] = useState(auditData);
  const [selectedUser, setSelectedUser] = useState('Tous');
  const [selectedAction, setSelectedAction] = useState('Tous');
  const [searchResource, setSearchResource] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/audit');
      if (res.data?.data?.length > 0) {
        const formattedLogs = res.data.data.map((l: any, i: number) => ({
          id: i + 1,
          user: l.username || l.user,
          action: l.action,
          resource: l.resource_accessed || l.resource,
          timestamp: new Date(l.timestamp).toLocaleString(),
          ip: l.ip_address || 'N/A',
          statut: l.is_granted ? 'Succès' : 'Refusé'
        }));
        setLogs(formattedLogs);
      }
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  const filteredLogs = logs.filter(log => {
    const matchUser = selectedUser === 'Tous' || log.user === selectedUser;
    const matchAction = selectedAction === 'Tous' || log.action === selectedAction;
    const matchResource = log.resource.toLowerCase().includes(searchResource.toLowerCase());
    return matchUser && matchAction && matchResource;
  });

  const getActionStyle = (action: string) => {
    if (action === 'GET') return { bg: '#EEF2FF', color: '#1565C0', border: '#BFDBFE' };
    if (action === 'POST') return { bg: '#DCFCE7', color: '#16a34a', border: '#BBF7D0' };
    if (action === 'DELETE') return { bg: '#FEE2E2', color: '#dc2626', border: '#FECACA' };
    return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };
  };

  const users = ['Tous', 'dr.benali', 'marie.admin', 'prof.rhanem', 'sophie.inf'];

  return (
    <div style={{ background: '#F1F5F9', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="directeur" activeItem="Audit" />
      
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Security Banner */}
        <div style={{ 
          background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', 
          padding: '12px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>🛡️</span>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px' }}>
            Journal d'Audit — Accès Directeur Uniquement
          </span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Traçabilité & Sécurité</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Historique complet des actions système</p>
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
            { label: 'Total Actions (24h)', value: '14,592', color: '#1e293b' },
            { label: 'Utilisateurs Actifs', value: '184', color: '#1565C0' },
            { label: 'Accès Refusés (RLS)', value: '42', color: '#ea580c' },
            { label: 'Alertes Sécurité', value: '3', color: '#dc2626' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>{k.label}</p>
              <p style={{ margin: 0, color: k.color, fontSize: '28px', fontWeight: '800' }}>{k.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Main Logs */}
          <div style={{ flex: 3 }}>
            {/* Filters */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px 16px' }}>
                  <span style={{ color: '#9CA3AF' }}>🔍</span>
                  <input 
                    type="text" 
                    placeholder="Rechercher une ressource (ex: /api/patients)..." 
                    value={searchResource}
                    onChange={(e) => setSearchResource(e.target.value)}
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%', color: '#334155' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>User:</span>
                  {users.map(u => (
                    <button
                      key={u}
                      onClick={() => setSelectedUser(u)}
                      style={{
                        background: selectedUser === u ? '#1e293b' : 'white',
                        color: selectedUser === u ? 'white' : '#64748b',
                        border: selectedUser === u ? 'none' : '1px solid #E2E8F0',
                        borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {u}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', borderLeft: '1px solid #E2E8F0', paddingLeft: '24px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Action:</span>
                  {['Tous', 'GET', 'POST', 'DELETE'].map(a => (
                    <button
                      key={a}
                      onClick={() => setSelectedAction(a)}
                      style={{
                        background: selectedAction === a ? '#1e293b' : 'white',
                        color: selectedAction === a ? 'white' : '#64748b',
                        border: selectedAction === a ? 'none' : '1px solid #E2E8F0',
                        borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {a}
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
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Horodatage</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Utilisateur & IP</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Action & Ressource</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: '#1e293b', fontWeight: '700' }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px', fontSize: '12px', color: '#64748b' }}>
                        {log.timestamp}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{log.user}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{log.ip}</p>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            background: getActionStyle(log.action).bg, color: getActionStyle(log.action).color, border: \`1px solid \${getActionStyle(log.action).border}\`,
                            padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800'
                          }}>
                            {log.action}
                          </span>
                          <span style={{ fontSize: '13px', color: '#334155', fontFamily: 'monospace' }}>{log.resource}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {log.statut === 'Succès' ? (
                          <span style={{ background: '#DCFCE7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>Succès</span>
                        ) : (
                          <span style={{ background: '#FEE2E2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Refusé (RLS)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Aucun log trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column (Alerts & Chart) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>Activité (Dernières 12h)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activityData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="actions" stroke="#1e293b" fill="#F1F5F9" strokeWidth={2} />
                  <Area type="monotone" dataKey="denied" stroke="#dc2626" fill="#FEE2E2" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <h3 style={{ margin: 0, fontSize: '15px', color: '#dc2626', fontWeight: '700' }}>Alertes RLS</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {logs.filter(l => l.statut === 'Refusé').slice(0, 4).map(alert => (
                  <div key={alert.id} style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>{alert.user}</span>
                      <span style={{ fontSize: '11px', color: '#dc2626' }}>{alert.timestamp.split(' ')[1]}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#7f1d1d', fontFamily: 'monospace' }}>Tentative d'accès à {alert.resource}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
