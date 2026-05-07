'use client';

import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface KPI {
  total_consultations: number;
  total_patients: number;
  diagnostics_count: number;
}

const tendances = [
  { mois: 'Jan', consultations: 320, patients: 180 },
  { mois: 'Fév', consultations: 280, patients: 160 },
  { mois: 'Mar', consultations: 410, patients: 220 },
  { mois: 'Avr', consultations: 390, patients: 210 },
  { mois: 'Mai', consultations: 450, patients: 240 },
  { mois: 'Jun', consultations: 380, patients: 200 },
  { mois: 'Jul', consultations: 290, patients: 150 },
  { mois: 'Aoû', consultations: 310, patients: 170 },
];

const appointments = [
  { name: 'El Idrissi Youssef', type: 'Consultation', time: '09:15 AM', color: '#1565C0' },
  { name: 'Benali Fatima', type: 'Consultation', time: '10:30 AM', color: '#1976D2' },
  { name: 'Alaoui Mohamed', type: 'Consultation', time: '12:30 PM', color: '#1976D2' },
  { name: 'Chraibi Sara', type: 'Consultation', time: '15:45 PM', color: '#1976D2' },
];

const weekDays = [
  { day: 'Lun', date: '07' },
  { day: 'Mar', date: '08', active: true },
  { day: 'Mer', date: '09' },
  { day: 'Jeu', date: '10' },
  { day: 'Ven', date: '11' },
  { day: 'Sam', date: '12' },
  { day: 'Dim', date: '13' },
];

export default function DashboardMedecin() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [userName, setUserName] = useState('Benali');

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (authenticated) {
        setUserName(keycloak.tokenParsed?.preferred_username || 'Benali');
        api.get('/api/dashboard/kpis?annee=2024')
          .then((res) => setKpis(res.data))
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

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
        {/* Logo */}
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
              <path d="M11 6h2v2h-2zM11 10h2v2h-2zM11 14h2v2h-2z" fill="white" opacity="0"/>
              <path d="M13 7h-2v3H8v2h3v3h2v-3h3v-2h-3z" fill="white"/>
            </svg>
          </div>
          <p style={{ fontSize: '10px', color: '#1565C0', fontWeight: '700', margin: 0 }}>Médecin</p>
        </div>

        {/* Nav items */}
        {[
          { label: 'Dashboard', active: true, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="#1565C0"/><rect x="14" y="3" width="7" height="7" rx="1" fill="#1565C0" opacity="0.4"/><rect x="3" y="14" width="7" height="7" rx="1" fill="#1565C0" opacity="0.4"/><rect x="14" y="14" width="7" height="7" rx="1" fill="#1565C0" opacity="0.4"/></svg> },
          { label: 'Patients', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#9CA3AF"/></svg> },
          { label: 'Messages', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#9CA3AF"/></svg> },
          { label: 'Agenda', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill="#9CA3AF"/></svg> },
          { label: 'Stats', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="#9CA3AF"/></svg> },
        ].map((item) => (
          <div key={item.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: item.active ? '#E3F2FD' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: item.active ? '3px solid #1565C0' : '3px solid transparent'
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
            onClick={() => keycloak.logout()}>
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
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', gap: '20px' }}>

        {/* CENTER COLUMN */}
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
                Medical Dashboard
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} — {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
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
              <span style={{ color: '#9CA3AF', fontSize: '13px' }}>Rechercher...</span>
            </div>
          </div>

          {/* Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 60%, #42A5F5 100%)',
            borderRadius: '20px', padding: '24px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(21,101,192,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, Dr. {userName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Vous avez <strong>7 patients</strong> aujourd'hui.<br/>
                N'oubliez pas de compléter les dossiers.
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
                padding: '4px 12px', width: 'fit-content'
              }}>
                <span style={{ color: '#4ADE80', fontSize: '14px' }}>★</span>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>4.5 (124 avis)</span>
              </div>
            </div>
            <div style={{
              width: '120px', height: '120px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '60px'
            }}>
              🩺
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr) 1.4fr', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Nouveaux Patients', value: kpis?.total_patients ?? '12', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>, color: '#1565C0' },
              { label: 'Consultations', value: kpis?.total_consultations ?? '54', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36 0-2.55-2.07-4.64-4.62-4.64-1.46 0-2.75.67-3.63 1.7L8.5 3.16l-1.25-1.46C6.37 .67 5.08 0 3.62 0 1.07 0-1 2.09-1 4.64c0 .48.11.92.18 1.36H-1v2h22V6zm-8.5 12.08l-7-6.29V8h14v3.79l-7 6.29z"/></svg>, color: '#1565C0' },
              { label: 'Rendez-vous', value: kpis?.total_consultations ?? '1,256', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>, color: '#1565C0' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'white', borderRadius: '16px', padding: '18px',
                display: 'flex', alignItems: 'center', gap: '14px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {stat.icon}
                </div>
                <div>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{stat.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '22px', fontWeight: '800' }}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
            {/* Bar Chart */}
            <div style={{
              background: 'white', borderRadius: '16px', padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: '12px' }}>Total Patients</p>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '28px', fontWeight: '800' }}>
                {kpis?.total_patients ?? '134'}
              </p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={tendances}>
                  <Bar dataKey="patients" fill="#E3F2FD" radius={[4,4,0,0]} />
                  <Line type="monotone" dataKey="consultations" stroke="#1565C0" strokeWidth={2} dot={false} />
                  <XAxis dataKey="mois" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Line Chart */}
            <div style={{
              background: 'white', borderRadius: '16px', padding: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Statistiques Patients</p>
                <span style={{
                  background: '#EEF2FF', color: '#1565C0', fontSize: '11px',
                  padding: '4px 10px', borderRadius: '20px', fontWeight: '600'
                }}>2024</span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={tendances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="consultations" stroke="#1565C0" strokeWidth={2.5} dot={{ fill: '#1565C0', r: 4 }} name="Consultations" />
                  <Line type="monotone" dataKey="patients" stroke="#42A5F5" strokeWidth={2} dot={false} name="Patients" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Doctor Profile */}
          <div style={{
            background: 'white', borderRadius: '20px', padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px'
              }}>👨‍⚕️</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Dr. {userName}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>Médecin</p>
              </div>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#4ADE80', boxShadow: '0 0 0 3px rgba(74,222,128,0.2)'
              }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              {[
                { label: 'Opér.', value: '103' },
                { label: 'Hôpital', value: '3' },
                { label: 'Âge', value: '35' },
                { label: 'Grade', value: 'Senior' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '9px' }}>{s.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '12px', fontWeight: '700' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div style={{
            background: 'white', borderRadius: '20px', padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
          }}>
            <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
              Calendrier
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {weekDays.map((d) => (
                <div key={d.day} style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#9CA3AF' }}>{d.day}</p>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: d.active ? '#1565C0' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: d.active ? '700' : '400', color: d.active ? 'white' : '#374151' }}>
                      {d.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Appointment */}
          <div style={{
            background: 'linear-gradient(135deg, #1565C0, #1976D2)',
            borderRadius: '16px', padding: '16px',
            boxShadow: '0 4px 16px rgba(21,101,192,0.3)'
          }}>
            <p style={{ margin: '0 0 2px', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Prochain RDV</p>
            <p style={{ margin: '0 0 4px', color: 'white', fontWeight: '700', fontSize: '14px' }}>
              {appointments[0].name}
            </p>
            <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
              {appointments[0].type}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>
                {appointments[0].time}
              </span>
              <span style={{
                background: 'rgba(255,255,255,0.2)', color: 'white',
                fontSize: '11px', padding: '3px 10px', borderRadius: '20px'
              }}>Détails →</span>
            </div>
          </div>

          {/* Appointments List */}
          <div style={{
            background: 'white', borderRadius: '20px', padding: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1
          }}>
            <p style={{ margin: '0 0 14px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
              Rendez-vous
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {appointments.slice(1).map((apt, i) => (
                <div key={i} style={{
                  background: '#F9FAFB', borderRadius: '12px', padding: '12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '10px',
                      background: '#EEF2FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#1565C0">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                        <path d="M13 7h-2v3H8v2h3v3h2v-3h3v-2h-3z"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1a1a2e' }}>{apt.type}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#6B7280' }}>{apt.name}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>{apt.time}</p>
                    <span style={{ color: '#1565C0', fontSize: '10px', cursor: 'pointer' }}>Détails →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}