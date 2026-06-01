'use client';

import { useRouter } from 'next/navigation';
import keycloak from '@/lib/keycloak';

interface SidebarProps {
  role: 'medecin' | 'administratif' | 'chercheur' | 'infirmier' | 'directeur';
  activeItem: string;
}

const configs = {
  medecin: {
    label: 'Médecin',
    color: '#1565C0',
    bg: '#E3F2FD',
    gradient: 'linear-gradient(135deg, #1565C0, #1976D2)',
    emoji: '🩺',
    items: [
      { label: 'Dashboard', href: '/dashboard/medecin' },
      { label: 'Patients', href: '/dashboard/medecin/patients' },
      { label: 'Messages', href: '/dashboard/medecin/messages' },
      { label: 'Agenda', href: '/dashboard/medecin/agenda' },
      { label: 'Stats', href: '/dashboard/medecin/stats' },
    ]
  },
  administratif: {
    label: 'Admin',
    color: '#166534',
    bg: '#DCFCE7',
    gradient: 'linear-gradient(135deg, #166534, #16a34a)',
    emoji: '👔',
    items: [
      { label: 'Dashboard', href: '/dashboard/administratif' },
      { label: 'Finances', href: '/dashboard/administratif/finances' },
      { label: 'Patients', href: '/dashboard/administratif/patients' },
      { label: 'Rapports', href: '/dashboard/administratif/rapports' },
    ]
  },
  chercheur: {
    label: 'Chercheur',
    color: '#5B21B6',
    bg: '#EDE9FE',
    gradient: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
    emoji: '🔬',
    items: [
      { label: 'Dashboard', href: '/dashboard/chercheur' },
      { label: 'Données', href: '/dashboard/chercheur/donnees' },
      { label: 'Analyses', href: '/dashboard/chercheur/analyses' },
      { label: 'Rapports', href: '/dashboard/chercheur/rapports' },
    ]
  },
  infirmier: {
    label: 'Infirmier',
    color: '#0369A1',
    bg: '#E0F2FE',
    gradient: 'linear-gradient(135deg, #0369A1, #0EA5E9)',
    emoji: '💉',
    items: [
      { label: 'Dashboard', href: '/dashboard/infirmier' },
      { label: 'Patients', href: '/dashboard/infirmier/patients' },
      { label: 'Soins', href: '/dashboard/infirmier/soins' },
      { label: 'Planning', href: '/dashboard/infirmier/planning' },
    ]
  },
  directeur: {
    label: 'Directeur',
    color: '#1e293b',
    bg: '#F1F5F9',
    gradient: 'linear-gradient(135deg, #1e293b, #334155)',
    emoji: '👨‍💼',
    items: [
      { label: 'Dashboard', href: '/dashboard/directeur' },
      { label: 'Personnel', href: '/dashboard/directeur/personnel' },
      { label: 'Finances', href: '/dashboard/directeur/finances' },
      { label: 'Audit', href: '/dashboard/directeur/audit' },
      { label: 'Rapports', href: '/dashboard/directeur/rapports' },
    ]
  },
};

const svgs: Record<string, React.ReactNode> = {
  Dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1" opacity="0.4"/><rect x="3" y="14" width="7" height="7" rx="1" opacity="0.4"/><rect x="14" y="14" width="7" height="7" rx="1" opacity="0.4"/></svg>,
  Patients: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  Messages: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>,
  Agenda: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>,
  Stats: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>,
  Finances: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>,
  Rapports: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>,
  Données: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>,
  Analyses: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>,
  Soins: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>,
  Planning: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>,
  Personnel: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
  Audit: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>,
};

export default function Sidebar({ role, activeItem }: SidebarProps) {
  const router = useRouter();
  const config = configs[role];

  return (
    <div style={{
      width: '90px', background: 'white',
      borderRadius: '0 24px 24px 0',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '28px 0', gap: '20px',
      boxShadow: '4px 0 20px rgba(0,0,0,0.08)',
      position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px',
          background: config.gradient,
          borderRadius: '14px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 6px',
          fontSize: '22px'
        }}>
          {config.emoji}
        </div>
        <p style={{ fontSize: '9px', color: config.color, fontWeight: '700', margin: 0 }}>
          {config.label}
        </p>
      </div>

      {/* Nav Items */}
      {config.items.map((item) => {
        const isActive = activeItem === item.label;
        return (
          <div
            key={item.label}
            onClick={() => router.push(item.href)}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px', cursor: 'pointer'
            }}
          >
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: isActive ? config.bg : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: isActive ? `3px solid ${config.color}` : '3px solid transparent',
              color: isActive ? config.color : '#9CA3AF',
              transition: 'all 0.2s'
            }}>
              {svgs[item.label]}
            </div>
            <span style={{
              fontSize: '9px',
              color: isActive ? config.color : '#9CA3AF',
              fontWeight: isActive ? '700' : '400'
            }}>
              {item.label}
            </span>
          </div>
        );
      })}

      {/* Logout */}
      <div style={{ marginTop: 'auto' }}>
        <div
          onClick={() => {
            try { keycloak.logout(); } catch { router.push('/login'); }
          }}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '4px', cursor: 'pointer'
          }}
        >
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
  );
}