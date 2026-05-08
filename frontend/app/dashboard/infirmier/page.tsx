'use client';

import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

interface Patient {
  nom: string;
  prenom: string;
  service: string;
  soin_du_jour: string;
}

const soinsData = [
  { service: 'Cardio', soins: 12 },
  { service: 'Neuro', soins: 8 },
  { service: 'Pédiat.', soins: 15 },
  { service: 'Ortho', soins: 6 },
  { service: 'Urgences', soins: 20 },
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

const patientsSimules = [
  { nom: 'El Idrissi', prenom: 'Youssef', service: 'Cardiologie', soin_du_jour: 'Prise de sang' },
  { nom: 'Benali', prenom: 'Fatima', service: 'Neurologie', soin_du_jour: 'Injection IV' },
  { nom: 'Alaoui', prenom: 'Mohamed', service: 'Pédiatrie', soin_du_jour: 'Soins plaie' },
  { nom: 'Chraibi', prenom: 'Sara', service: 'Orthopédie', soin_du_jour: 'Pansement' },
  { nom: 'Tazi', prenom: 'Ahmed', service: 'Urgences', soin_du_jour: 'Monitoring' },
];

export default function DashboardInfirmier() {
  const [patients, setPatients] = useState<Patient[]>(patientsSimules);
  const [userName, setUserName] = useState('Sophie');

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (authenticated) {
        setUserName(keycloak.tokenParsed?.preferred_username || 'Sophie');
        api.get('/api/patients')
          .then((res) => { if (res.data?.length > 0) setPatients(res.data.slice(0, 5)); })
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  return (
    <div style={{
      background: '#E0F2FE',
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      {/* SIDEBAR */}
      <div style={{
        width: '90px', background: 'white',
        borderRadius: '0 24px 24px 0',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '28px 0', gap: '28px',
        boxShadow: '4px 0 20px rgba(6,182,212,0.08)',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, #0369A1, #0EA5E9)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 6px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
            </svg>
          </div>
          <p style={{ fontSize: '10px', color: '#0369A1', fontWeight: '700', margin: 0 }}>Infirmier</p>
        </div>

        {[
          { label: 'Dashboard', active: true, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="#0369A1"/><rect x="14" y="3" width="7" height="7" rx="1" fill="#0369A1" opacity="0.4"/><rect x="3" y="14" width="7" height="7" rx="1" fill="#0369A1" opacity="0.4"/><rect x="14" y="14" width="7" height="7" rx="1" fill="#0369A1" opacity="0.4"/></svg> },
          { label: 'Patients', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
          { label: 'Soins', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg> },
          { label: 'Planning', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg> },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: item.active ? '#E0F2FE' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: item.active ? '3px solid #0369A1' : '3px solid transparent'
            }}>
              {item.svg}
            </div>
            <span style={{ fontSize: '9px', color: item.active ? '#0369A1' : '#9CA3AF', fontWeight: item.active ? '700' : '400' }}>
              {item.label}
            </span>
          </div>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            onClick={() => keycloak.logout()}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="#EF4444"/>
              </svg>
            </div>
            <span style={{ fontSize: '9px', color: '#EF4444', fontWeight: '600' }}>Logout</span>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
                Soins Infirmiers
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div style={{
              background: '#E0F2FE', borderRadius: '12px', padding: '8px 16px',
              border: '1px solid #BAE6FD', fontSize: '13px', color: '#0369A1', fontWeight: '600'
            }}>
              💉 Service Actif
            </div>
          </div>

          {/* Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 60%, #38BDF8 100%)',
            borderRadius: '20px', padding: '24px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(3,105,161,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, {userName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Vous avez <strong>5 patients</strong> à prendre en charge.<br/>
                Soins du jour en cours — Hôpital Ibn Sina.
              </p>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px', padding: '4px 12px'
              }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
                  💉 Accès soins du jour uniquement
                </span>
              </div>
            </div>
            <div style={{
              width: '100px', height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '50px'
            }}>👩‍⚕️</div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Patients du jour', value: '5', icon: '👥', change: 'Aujourd\'hui' },
              { label: 'Soins effectués', value: '3', icon: '✅', change: 'En cours' },
              { label: 'Soins restants', value: '2', icon: '⏳', change: 'À faire' },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                background: 'white', borderRadius: '16px', padding: '18px',
                display: 'flex', alignItems: 'center', gap: '14px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: '#E0F2FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', flexShrink: 0
                }}>
                  {kpi.icon}
                </div>
                <div>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '28px', fontWeight: '800' }}>{kpi.value}</p>
                  <p style={{ margin: 0, color: '#0369A1', fontSize: '10px', fontWeight: '600' }}>{kpi.change}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Soins par service</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={soinsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="service" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="soins" fill="#0EA5E9" radius={[4,4,0,0]} name="Soins" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Patients — Soins du jour</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {patients.map((p, i) => (
                  <div key={i} style={{
                    background: '#F0F9FF', borderRadius: '10px', padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0369A1, #0EA5E9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '12px'
                      }}>
                        {p.nom?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1a1a2e' }}>{p.nom} {p.prenom}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#6B7280' }}>{p.service}</p>
                      </div>
                    </div>
                    <span style={{
                      background: '#E0F2FE', color: '#0369A1',
                      fontSize: '10px', fontWeight: '600',
                      padding: '3px 10px', borderRadius: '20px'
                    }}>
                      {p.soin_du_jour || 'Soins standards'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #0369A1, #38BDF8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
              }}>👩‍⚕️</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{userName}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>Infirmier(e)</p>
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ADE80' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              {[
                { label: 'Service', value: 'Général' },
                { label: 'Patients', value: '5' },
                { label: 'Soins/jour', value: '12' },
                { label: 'Grade', value: 'Senior' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '9px' }}>{s.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '12px', fontWeight: '700' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Calendrier</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {weekDays.map((d) => (
                <div key={d.day} style={{ textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#9CA3AF' }}>{d.day}</p>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    background: d.active ? '#0369A1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: d.active ? '700' : '400', color: d.active ? 'white' : '#374151' }}>{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1 }}>
            <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>🔒 Accès refusés</p>
            {['Antécédents médicaux', 'Diagnostic complet', 'Finances', 'Médicaments', 'Historique'].map((item) => (
              <div key={item} style={{
                background: '#FFF1F2', border: '1px solid #FECDD3',
                borderRadius: '8px', padding: '8px 12px', marginBottom: '6px',
                display: 'flex', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '12px', color: '#374151' }}>{item}</span>
                <span>🔒</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}