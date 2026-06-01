'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { getApiErrorMessage, isInfirmierAccount } from '@/lib/infirmier-utils';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

interface Patient {
  nom: string;
  prenom: string;
  service: string;
  soin_du_jour: string;
  id?: number;
}

interface ChartItem {
  service: string;
  soins: number;
}

interface Kpis {
  patients_jour: number;
  soins_termines: number;
  soins_restants: number;
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function DashboardInfirmier() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [chart, setChart] = useState<ChartItem[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  const weekDays = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        day: DAY_LABELS[d.getDay()],
        date: String(d.getDate()).padStart(2, '0'),
        active: d.toDateString() === today.toDateString(),
      };
    });
  }, []);

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      setError('');
      const res = await api.get('/api/infirmier/dashboard');
      const data = res.data;
      if (data.patients) setPatients(data.patients);
      if (data.chart) setChart(data.chart);
      if (data.kpis) setKpis(data.kpis);
      if (data.username) setUserName(data.username);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) {
        setUserName(keycloak.tokenParsed?.preferred_username || 'Infirmier');
        fetchData();
      }
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 30);

  const kpiCards = [
    { label: 'Patients du jour', value: kpis ? String(kpis.patients_jour) : '—', icon: '👥', change: "Aujourd'hui" },
    { label: 'Soins effectués', value: kpis ? String(kpis.soins_termines) : '—', icon: '✅', change: 'En cours' },
    { label: 'Soins restants', value: kpis ? String(kpis.soins_restants) : '—', icon: '⏳', change: 'À faire' },
  ];

  return (
    <div style={{ background: '#E0F2FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="infirmier" activeItem="Dashboard" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
              padding: '12px 16px', marginBottom: '16px', color: '#B91C1C', fontSize: '13px'
            }}>{error}</div>
          )}
          {!isInfirmierAccount() && !error && kpis && (
            <div style={{
              background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px',
              padding: '12px 16px', marginBottom: '16px', color: '#92400E', fontSize: '13px'
            }}>
              Mode consultation — connectez-vous avec <strong>sophie.inf</strong> pour les actions infirmier.
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Soins Infirmiers</h1>
              <p suppressHydrationWarning style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RefreshButton onRefresh={fetchData} color="#0369A1" />
              <div style={{
                background: '#E0F2FE', borderRadius: '12px', padding: '8px 16px',
                border: '1px solid #BAE6FD', fontSize: '13px', color: '#0369A1', fontWeight: '600'
              }}>
                💉 Service Actif
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #0369A1 0%, #0EA5E9 60%, #38BDF8 100%)',
            borderRadius: '20px', padding: '24px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px', boxShadow: '0 8px 32px rgba(3,105,161,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, {userName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Vous avez <strong>{kpis?.patients_jour ?? 0} patients</strong> à prendre en charge.<br />
                Soins du jour en cours — Hôpital Ibn Sina.
              </p>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', padding: '4px 12px' }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>💉 Accès soins du jour uniquement</span>
              </div>
            </div>
            <div style={{
              width: '100px', height: '100px', background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px'
            }}>👩‍⚕️</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {kpiCards.map((kpi) => (
              <div key={kpi.label} style={{
                background: 'white', borderRadius: '16px', padding: '18px',
                display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', background: '#E0F2FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0
                }}>{kpi.icon}</div>
                <div>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '28px', fontWeight: '800' }}>{kpi.value}</p>
                  <p style={{ margin: 0, color: '#0369A1', fontSize: '10px', fontWeight: '600' }}>{kpi.change}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Soins par service</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="service" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="soins" fill="#0EA5E9" radius={[4, 4, 0, 0]} name="Soins" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Patients — Soins du jour</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {patients.map((p) => (
                  <div key={p.id ?? `${p.nom}-${p.prenom}`} style={{
                    background: '#F0F9FF', borderRadius: '10px', padding: '10px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0369A1, #0EA5E9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '12px'
                      }}>{p.nom?.charAt(0) || 'P'}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1a1a2e' }}>{p.nom} {p.prenom}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#6B7280' }}>{p.service}</p>
                      </div>
                    </div>
                    <span style={{
                      background: '#E0F2FE', color: '#0369A1',
                      fontSize: '10px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px'
                    }}>{p.soin_du_jour || 'Soins standards'}</span>
                  </div>
                ))}
                {patients.length === 0 && (
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                    Aucun patient prévu aujourd&apos;hui.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

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
                { label: 'Service', value: chart[0]?.service ?? '—' },
                { label: 'Patients', value: kpis ? String(kpis.patients_jour) : '—' },
                { label: 'Soins/jour', value: kpis ? String(kpis.soins_termines + kpis.soins_restants) : '—' },
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
                <div key={d.day + d.date} style={{ textAlign: 'center' }}>
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
