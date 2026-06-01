'use client';

import { useRouter } from 'next/navigation';
import { useKeycloak } from '@react-keycloak/web';

export default function StatsPage() {
  const router = useRouter();
  const { keycloak } = useKeycloak();

  return (
    <div style={{
      background: '#E8F0FE',
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      {/* ── SIDEBAR ── */}
      <div style={{
        width: '90px',
        background: 'white',
        borderRadius: '0 24px 24px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '28px 0',
        gap: '28px',
        boxShadow: '4px 0 20px rgba(21,101,192,0.08)',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 100
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, #1565C0, #1976D2)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 6px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="white"/>
            </svg>
          </div>
          <p style={{ fontSize: '10px', color: '#1565C0', fontWeight: '700', margin: 0 }}>Médecin</p>
        </div>

        {[
          { label: 'Dashboard', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="#1565C0"/><rect x="14" y="3" width="7" height="7" rx="1" fill="#1565C0" opacity="0.4"/><rect x="3" y="14" width="7" height="7" rx="1" fill="#1565C0" opacity="0.4"/><rect x="14" y="14" width="7" height="7" rx="1" fill="#1565C0" opacity="0.4"/></svg>, onClick: () => router.push('/dashboard/medecin') },
          { label: 'Patients', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#9CA3AF"/></svg>, onClick: () => router.push('/dashboard/medecin/patients') },
          { label: 'Messages', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#9CA3AF"/></svg>, onClick: () => router.push('/dashboard/medecin/messages') },
          { label: 'Agenda', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="#9CA3AF"/></svg>, onClick: () => router.push('/dashboard/medecin/agenda') },
          { label: 'Stats', active: true, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="#1565C0"/></svg>, onClick: () => router.push('/dashboard/medecin/stats') },
        ].map((item) => (
          <div key={item.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            cursor: 'pointer'
          }} onClick={item.onClick}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: item.active ? '#E3F2FD' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: item.active ? '3px solid #1565C0' : '3px solid transparent',
              transition: 'all 0.2s ease'
            }}>
              {item.svg}
            </div>
            <span style={{ fontSize: '9px', color: item.active ? '#1565C0' : '#9CA3AF', fontWeight: item.active ? '700' : '400' }}>
              {item.label}
            </span>
          </div>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            onClick={() => keycloak?.logout()}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="#EF4444"/>
              </svg>
            </div>
            <span style={{ fontSize: '9px', color: '#EF4444', fontWeight: '600' }}>Logout</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(21,101,192,0.08)'
        }}>
          <h1 style={{ color: '#1565C0', marginBottom: '16px' }}>📊 Statistiques Annuelles 2024</h1>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {[
              { label: 'Total Consultations', value: '542', trend: '+12%' },
              { label: 'Patients Traités', value: '238', trend: '+8%' },
              { label: 'Taux Guérison', value: '94.2%', trend: '+3.1%' },
              { label: 'Satisfaction Patient', value: '4.8/5', trend: '+0.3' },
            ].map((stat, idx) => (
              <div key={idx} style={{
                border: '1px solid #E0E7FF',
                borderRadius: '8px',
                padding: '16px',
                background: 'linear-gradient(135deg, #E3F2FD, #F0F7FF)'
              }}>
                <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0' }}>{stat.label}</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: '#1565C0', margin: '0 0 8px 0' }}>{stat.value}</p>
                <p style={{ fontSize: '12px', color: '#22C55E', margin: 0 }}>{stat.trend} par rapport l\'année précédente</p>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '32px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              border: '1px solid #E0E7FF',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ color: '#1565C0', marginBottom: '16px' }}>Répartition par Type</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { type: 'Consultation', value: 45 },
                  { type: 'Diagnostic', value: 30 },
                  { type: 'Suivi', value: 15 },
                  { type: 'Prescription', value: 10 },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#333' }}>{item.type}</span>
                      <span style={{ fontWeight: '600', color: '#1565C0' }}>{item.value}%</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#E0E7FF',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${item.value}%`,
                        background: 'linear-gradient(90deg, #1565C0, #1976D2)'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              border: '1px solid #E0E7FF',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{ color: '#1565C0', marginBottom: '16px' }}>Résultats Mensuels</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map((month, idx) => (
                  <div key={idx} style={{
                    textAlign: 'center',
                    padding: '8px',
                    background: idx < 8 ? '#E3F2FD' : '#F0F7FF',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#1565C0'
                  }}>
                    {month}
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
