'use client';

import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface Patient {
  token_anonyme: string;
  age: number;
  sexe: string;
  region: string;
  diagnostic_code: string;
}

const dataAge = [
  { tranche: '0-18', count: 320 },
  { tranche: '19-35', count: 580 },
  { tranche: '36-50', count: 750 },
  { tranche: '51-65', count: 620 },
  { tranche: '65+', count: 430 },
];

const dataSexe = [
  { name: 'Hommes', value: 52 },
  { name: 'Femmes', value: 48 },
];

const dataRegion = [
  { region: 'Rabat', count: 1250 },
  { region: 'Casablanca', count: 980 },
  { region: 'Fès', count: 720 },
  { region: 'Marrakech', count: 650 },
  { region: 'Tanger', count: 480 },
];

const COLORS = ['#1565C0', '#7C3AED'];

const weekDays = [
  { day: 'Lun', date: '07' },
  { day: 'Mar', date: '08', active: true },
  { day: 'Mer', date: '09' },
  { day: 'Jeu', date: '10' },
  { day: 'Ven', date: '11' },
  { day: 'Sam', date: '12' },
  { day: 'Dim', date: '13' },
];

export default function DashboardChercheur() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [userName, setUserName] = useState('Rhanem');

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (authenticated) {
        setUserName(keycloak.tokenParsed?.preferred_username || 'Rhanem');
        api.get('/api/patients')
          .then((res) => setPatients(res.data.slice(0, 8)))
          .catch(() => {});
      }
    }).catch(() => {});
  }, []);

  return (
    <div style={{
      background: '#EDE9FE',
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
        boxShadow: '4px 0 20px rgba(124,58,237,0.08)',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 100
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, #5B21B6, #7C3AED)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 6px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
            </svg>
          </div>
          <p style={{ fontSize: '10px', color: '#5B21B6', fontWeight: '700', margin: 0 }}>Chercheur</p>
        </div>

        {[
          { label: 'Dashboard', active: true, svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" fill="#5B21B6"/><rect x="14" y="3" width="7" height="7" rx="1" fill="#5B21B6" opacity="0.4"/><rect x="3" y="14" width="7" height="7" rx="1" fill="#5B21B6" opacity="0.4"/><rect x="14" y="14" width="7" height="7" rx="1" fill="#5B21B6" opacity="0.4"/></svg> },
          { label: 'Données', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> },
          { label: 'Analyses', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg> },
          { label: 'Rapports', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="#9CA3AF"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg> },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: item.active ? '#EDE9FE' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: item.active ? '3px solid #5B21B6' : '3px solid transparent'
            }}>
              {item.svg}
            </div>
            <span style={{ fontSize: '9px', color: item.active ? '#5B21B6' : '#9CA3AF', fontWeight: item.active ? '700' : '400' }}>
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
                Recherche Médicale
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                Données anonymisées — RGPD conforme
              </p>
            </div>
            <div style={{
              background: '#EDE9FE', borderRadius: '12px', padding: '8px 16px',
              border: '1px solid #DDD6FE', fontSize: '13px', color: '#5B21B6', fontWeight: '600'
            }}>
              🔬 Mode Recherche
            </div>
          </div>

          {/* Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 60%, #A78BFA 100%)',
            borderRadius: '20px', padding: '24px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(91,33,182,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, Prof. {userName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Accès aux données anonymisées uniquement.<br/>
                Toutes les données identifiantes sont masquées.
              </p>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px', padding: '4px 12px'
              }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
                  🔒 Données anonymisées RGPD
                </span>
              </div>
            </div>
            <div style={{
              width: '100px', height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '50px'
            }}>🔬</div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Distribution par âge</p>
                <span style={{ background: '#EDE9FE', color: '#5B21B6', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>2024</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dataAge}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="tranche" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#7C3AED" radius={[4,4,0,0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Répartition Sexe</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={dataSexe} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value">
                    {dataSexe.map((_, index) => (
                      <Cell key={index} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                {dataSexe.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[i] }} />
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>{item.name} {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tableau données anonymisées */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Données patients anonymisées</p>
              <span style={{ background: '#FEF3C7', color: '#D97706', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                🔒 Anonymisé
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F5F3FF' }}>
                  {['Token Anonyme', 'Âge', 'Sexe', 'Région', 'Code Diagnostic'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#5B21B6', fontWeight: '700' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.length > 0 ? patients.map((p, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>{p.token_anonyme}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>{p.age} ans</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>{p.sexe}</td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>{p.region}</td>
                    <td style={{ padding: '10px 12px', fontSize: '11px', fontFamily: 'monospace', color: '#7C3AED' }}>{p.diagnostic_code}</td>
                  </tr>
                )) : (
                  [1,2,3,4].map((i) => (
                    <tr key={i} style={{ borderTop: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '10px 12px', fontSize: '11px', color: '#6B7280', fontFamily: 'monospace' }}>TK-{Math.random().toString(36).substr(2,8).toUpperCase()}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>{Math.floor(Math.random()*60)+20} ans</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>{i % 2 === 0 ? 'M' : 'F'}</td>
                      <td style={{ padding: '10px 12px', fontSize: '12px', color: '#374151' }}>Rabat</td>
                      <td style={{ padding: '10px 12px', fontSize: '11px', fontFamily: 'monospace', color: '#7C3AED' }}>J{Math.floor(Math.random()*99)+10}.{Math.floor(Math.random()*9)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #5B21B6, #A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
              }}>🔬</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Prof. {userName}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>Chercheur</p>
              </div>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ADE80' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              {[
                { label: 'Publications', value: '24' },
                { label: 'Études', value: '8' },
                { label: 'Datasets', value: '12' },
                { label: 'Grade', value: 'Prof.' },
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
                    background: d.active ? '#5B21B6' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: d.active ? '700' : '400', color: d.active ? 'white' : '#374151' }}>{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #5B21B6, #7C3AED)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(91,33,182,0.3)' }}>
            <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Distribution régionale</p>
            {dataRegion.map((r) => (
              <div key={r.region} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: 'white', fontSize: '11px' }}>{r.region}</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{r.count}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '4px', height: '4px' }}>
                  <div style={{
                    background: 'white', borderRadius: '4px', height: '4px',
                    width: `${(r.count / 1250) * 100}%`
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: '0 0 12px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>🔒 Accès refusés</p>
            {['Nom réel', 'Prénom', 'CIN', 'Téléphone', 'Finances'].map((item) => (
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