'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import { getAdministratifApiError, isAdministratifAccount } from '@/lib/administratif-utils';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';

interface KPI {
  total_patients: number;
  total_consultations: number;
  revenus_total: number;
  depenses_total?: number;
  benefice?: number;
}

interface Tendance { mois: string; revenus: number; depenses: number }
interface RecentOp { label: string; montant: string; statut: string; color: string }

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function DashboardAdministratif() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [profile, setProfile] = useState<{ nom?: string; prenom?: string } | null>(null);
  const [finances, setFinances] = useState<Tendance[]>([]);
  const [recentOperations, setRecentOperations] = useState<RecentOp[]>([]);
  const [stats, setStats] = useState({ services: 0, personnel: 0 });
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

  const userName = profile?.prenom
    ? `${profile.prenom} ${profile.nom || ''}`.trim()
    : profile?.nom || 'Admin';

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      setError('');
      const res = await api.get('/api/administratif/dashboard?annee=2024');
      const d = res.data;
      if (d.kpis) setKpis(d.kpis);
      if (d.profile) setProfile(d.profile);
      if (d.tendances) setFinances(d.tendances);
      if (d.recent_ops) setRecentOperations(d.recent_ops);
      if (d.stats) setStats(d.stats);
    } catch (e) {
      setError(getAdministratifApiError(e));
    }
  }, []);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) fetchData();
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 30);

  const revenusDisplay = kpis?.revenus_total
    ? `${kpis.revenus_total.toLocaleString('fr-FR')} MAD`
    : '—';

  return (
    <div style={{
      background: '#E8F5E9',
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Segoe UI', sans-serif"
    }}>
      <Sidebar role="administratif" activeItem="Dashboard" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
              padding: '12px 16px', marginBottom: '16px', color: '#B91C1C', fontSize: '13px'
            }}>{error}</div>
          )}
          {!isAdministratifAccount() && !error && (
            <div style={{
              background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px',
              padding: '12px 16px', marginBottom: '16px', color: '#92400E', fontSize: '13px'
            }}>
              Mode consultation — connectez-vous avec <strong>marie.admin</strong> pour le compte administratif.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
                Gestion Administrative
              </h1>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RefreshButton onRefresh={fetchData} color="#166534" />
              <div style={{ background: 'white', borderRadius: '12px', padding: '10px 20px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#6b7280' }}>
                📅 Hôpital Ibn Sina
              </div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #166534 0%, #16a34a 60%, #4ade80 100%)',
            borderRadius: '20px', padding: '24px 28px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(22,101,52,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, {userName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Gestion financière et administrative<br/>
                Hôpital Ibn Sina — Rabat, Maroc
              </p>
            </div>
            <div style={{
              width: '100px', height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '50px'
            }}>👔</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
            {[
              { label: 'Total Patients', value: kpis ? kpis.total_patients.toLocaleString('fr-FR') : '—' },
              { label: 'Consultations 2024', value: kpis ? kpis.total_consultations.toLocaleString('fr-FR') : '—' },
              { label: 'Revenus Total', value: revenusDisplay },
            ].map((kpi) => (
              <div key={kpi.label} style={{
                background: 'white', borderRadius: '16px', padding: '18px',
                display: 'flex', alignItems: 'center', gap: '14px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #166534, #16a34a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  color: 'white', fontSize: '18px'
                }}>📊</div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '20px', fontWeight: '800' }}>{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Revenus vs Dépenses</p>
                <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>2024</span>
              </div>
              {finances.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={finances}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v) => `${Number(v).toLocaleString('fr-FR')} MAD`} />
                    <Bar dataKey="revenus" fill="#16a34a" radius={[4,4,0,0]} name="Revenus" />
                    <Bar dataKey="depenses" fill="#86efac" radius={[4,4,0,0]} name="Dépenses" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>Aucune donnée disponible</p>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: '12px' }}>Évolution Revenus</p>
              <p style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '26px', fontWeight: '800' }}>{revenusDisplay}</p>
              {finances.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={finances}>
                    <Line type="monotone" dataKey="revenus" stroke="#16a34a" strokeWidth={2.5} dot={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v) => `${Number(v).toLocaleString('fr-FR')} MAD`} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>—</p>
              )}
            </div>
          </div>
        </div>

        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #166534, #4ade80)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
              }}>👔</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>{userName}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>Administratif</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              {[
                { label: 'Services', value: String(stats.services || '—') },
                { label: 'Personnel', value: String(stats.personnel || '—') },
                { label: 'Consultations', value: kpis ? String(kpis.total_consultations) : '—' },
                { label: 'Bénéfice', value: kpis?.benefice != null ? `${Math.round(kpis.benefice).toLocaleString('fr-FR')}` : '—' },
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
                    background: d.active ? '#166534' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: d.active ? '700' : '400', color: d.active ? 'white' : '#374151' }}>{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1 }}>
            <p style={{ margin: '0 0 14px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Opérations récentes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentOperations.length > 0 ? recentOperations.map((op, i) => (
                <div key={i} style={{
                  background: '#F9FAFB', borderRadius: '12px', padding: '12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1a1a2e' }}>{op.label}</p>
                    <span style={{
                      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                      background: op.statut === 'Reçu' ? '#dbeafe' : '#fef9c3',
                      color: op.statut === 'Reçu' ? '#1565C0' : '#ca8a04'
                    }}>{op.statut}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>{op.montant}</p>
                </div>
              )) : (
                <p style={{ color: '#9CA3AF', fontSize: '12px', textAlign: 'center' }}>Aucune opération</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
