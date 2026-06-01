'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

interface OverviewKpis {
  nouveaux_patients: number;
  nouveaux_patients_change: string;
  total_consultations: number;
  total_consultations_change: string;
  diagnostics_count: number;
  diagnostics_change: string;
}

interface Tendance {
  mois: string;
  consultations: number;
  patients: number;
}

interface AgendaItem {
  agenda_id?: number;
  patient: string;
  type_rdv?: string;
  heure: string;
  service?: string;
  statut: string;
}

interface Appointment {
  name: string;
  type: string;
  time: string;
  agenda_id?: number;
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function DashboardMedecin() {
  const router = useRouter();
  const [annee] = useState(2024);
  const [userName, setUserName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [kpis, setKpis] = useState<OverviewKpis | null>(null);
  const [tendances, setTendances] = useState<Tendance[]>([]);
  const [recentPatients, setRecentPatients] = useState<AgendaItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientsTodayCount, setPatientsTodayCount] = useState(0);
  const [satisfaction, setSatisfaction] = useState({ score: 0, reviews_count: 0 });
  const [quarterlyPct, setQuarterlyPct] = useState(0);
  const [profile, setProfile] = useState({ operations: 0, services_count: 0, grade: '—', specialite: 'Médecin' });

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

  const quarterlyData = useMemo(
    () => tendances.filter((_, i) => i % 3 === 0),
    [tendances]
  );

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      const res = await api.get(`/api/dashboard/overview?annee=${annee}`);
      const data = res.data;

      if (data.kpis) setKpis(data.kpis);
      if (data.tendances) setTendances(data.tendances);
      if (data.satisfaction) setSatisfaction(data.satisfaction);
      if (data.patients_today_count != null) setPatientsTodayCount(data.patients_today_count);
      if (data.quarterly_pct != null) setQuarterlyPct(data.quarterly_pct);
      if (data.profile) setProfile(data.profile);

      if (data.agenda) {
        const agenda: AgendaItem[] = data.agenda.map((a: Record<string, unknown>) => ({
          agenda_id: a.agenda_id as number,
          patient: String(a.patient || ''),
          type_rdv: String(a.type_rdv || 'Consultation'),
          heure: String(a.heure || '').slice(0, 5),
          service: String(a.service || ''),
          statut: String(a.statut || 'En attente'),
        }));
        setRecentPatients(agenda.slice(0, 4));
        setAppointments(
          agenda.slice(0, 3).map((a) => ({
            name: a.patient,
            type: a.type_rdv || 'Consultation',
            time: a.heure,
            agenda_id: a.agenda_id,
          }))
        );
      }
    } catch {}
  }, [annee]);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) {
        setUserName(keycloak.tokenParsed?.preferred_username || 'Médecin');
        fetchData();
      }
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 30);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/medecin/patients?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const kpiCards = [
    {
      label: 'Nouveaux Patients',
      value: kpis ? String(kpis.nouveaux_patients) : '—',
      change: kpis?.nouveaux_patients_change ?? '—',
    },
    {
      label: 'Consultations',
      value: kpis ? kpis.total_consultations.toLocaleString('fr-FR') : '—',
      change: kpis?.total_consultations_change ?? '—',
    },
    {
      label: 'Diagnostics',
      value: kpis ? kpis.diagnostics_count.toLocaleString('fr-FR') : '—',
      change: kpis?.diagnostics_change ?? '—',
    },
  ];

  const nextAppointment = appointments[0];

  return (
    <div style={{ background: '#E8F0FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="medecin" activeItem="Dashboard" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Medical Dashboard</h1>
              <p suppressHydrationWarning style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} —{' '}
                {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RefreshButton onRefresh={fetchData} color="#1565C0" />
              <form onSubmit={handleSearch} style={{
                background: 'white', borderRadius: '12px', padding: '10px 20px',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #E5E7EB'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#374151', width: '160px' }}
                />
              </form>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 60%, #42A5F5 100%)',
            borderRadius: '20px', padding: '24px 28px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '20px', boxShadow: '0 8px 32px rgba(21,101,192,0.3)'
          }}>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 6px', fontSize: '20px', fontWeight: '700' }}>
                Bonjour, Dr. {userName}!
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', margin: '0 0 12px', fontSize: '13px' }}>
                Vous avez <strong>{patientsTodayCount} patients</strong> aujourd&apos;hui.<br />
                N&apos;oubliez pas de compléter les dossiers.
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 12px'
              }}>
                <span style={{ color: '#4ADE80', fontSize: '14px' }}>★</span>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
                  {satisfaction.score}/5 ({satisfaction.reviews_count} avis)
                </span>
              </div>
            </div>
            <div style={{
              width: '120px', height: '120px', background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px'
            }}>👨‍⚕️</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
            {kpiCards.map((kpi) => (
              <div key={kpi.label} style={{
                background: 'white', borderRadius: '16px', padding: '18px',
                display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '11px' }}>{kpi.label}</p>
                  <p style={{ margin: 0, color: '#1a1a2e', fontSize: '24px', fontWeight: '800' }}>{kpi.value}</p>
                </div>
                <span style={{ background: '#dcfce7', color: '#16a34a', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: '600' }}>
                  ↑ {kpi.change}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Évolution mensuelle</p>
                <span style={{ background: '#EEF2FF', color: '#1565C0', fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>{annee}</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tendances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="consultations" stroke="#1565C0" strokeWidth={2.5} fill="#1565C0" fillOpacity={0.1} name="Consultations" />
                  <Area type="monotone" dataKey="patients" stroke="#42A5F5" strokeWidth={2} fill="none" name="Patients" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #1565C0, #1976D2)',
              borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(21,101,192,0.3)'
            }}>
              <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Consultations / Trimestre</p>
              <p style={{ margin: '0 0 16px', color: 'white', fontSize: '32px', fontWeight: '800' }}>{quarterlyPct}%</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={quarterlyData}>
                  <Bar dataKey="consultations" fill="rgba(255,255,255,0.4)" radius={[6, 6, 0, 0]} />
                  <XAxis dataKey="mois" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(21,101,192,0.9)', border: 'none', borderRadius: '12px', color: 'white' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <p style={{ margin: 0, color: '#1a1a2e', fontSize: '15px', fontWeight: '700' }}>Patients du jour</p>
              <span
                onClick={() => router.push('/dashboard/medecin/agenda')}
                style={{ color: '#1565C0', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}
              >
                Voir tout →
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentPatients.map((p) => (
                <div key={p.agenda_id ?? p.patient} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: '12px', background: '#F9FAFB'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '700', fontSize: '14px'
                    }}>{p.patient.charAt(0)}</div>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>{p.patient}</p>
                      <p style={{ margin: 0, color: '#9CA3AF', fontSize: '11px' }}>{p.service}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>{p.heure}</p>
                    <span style={{
                      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                      background: p.statut === 'Confirmé' ? '#dcfce7' : p.statut === 'En attente' ? '#fef9c3' : '#ede9fe',
                      color: p.statut === 'Confirmé' ? '#16a34a' : p.statut === 'En attente' ? '#ca8a04' : '#7c3aed'
                    }}>{p.statut}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #1565C0, #42A5F5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
              }}>👨‍⚕️</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Dr. {userName}</p>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>{profile.specialite}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
              {[
                { label: 'Opér.', value: String(profile.operations) },
                { label: 'Services', value: String(profile.services_count) },
                { label: 'Grade', value: profile.grade },
                { label: 'Année', value: String(annee) },
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
                    background: d.active ? '#1565C0' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: d.active ? '700' : '400', color: d.active ? 'white' : '#374151' }}>{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {nextAppointment && (
            <div style={{
              background: 'linear-gradient(135deg, #1565C0, #1976D2)',
              borderRadius: '16px', padding: '16px', boxShadow: '0 4px 16px rgba(21,101,192,0.3)'
            }}>
              <p style={{ margin: '0 0 2px', color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Prochain RDV</p>
              <p style={{ margin: '0 0 4px', color: 'white', fontWeight: '700', fontSize: '14px' }}>{nextAppointment.name}</p>
              <p style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{nextAppointment.type}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{nextAppointment.time}</span>
                <span
                  onClick={() => router.push('/dashboard/medecin/agenda')}
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '11px', padding: '3px 10px', borderRadius: '20px', cursor: 'pointer' }}
                >
                  Détails →
                </span>
              </div>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: 1 }}>
            <p style={{ margin: '0 0 14px', fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Rendez-vous</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {appointments.slice(1).map((apt) => (
                <div key={apt.agenda_id ?? apt.name} style={{ background: '#F9FAFB', borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#1a1a2e' }}>{apt.type}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#6B7280' }}>{apt.name}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#1a1a2e' }}>{apt.time}</p>
                    <span
                      onClick={() => router.push('/dashboard/medecin/agenda')}
                      style={{ color: '#1565C0', fontSize: '10px', cursor: 'pointer' }}
                    >
                      Détails →
                    </span>
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
