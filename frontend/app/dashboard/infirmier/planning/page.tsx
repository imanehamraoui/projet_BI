'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';
import { getApiErrorMessage } from '@/lib/infirmier-utils';

interface Shift {
  id: number;
  day: number;
  time: number;
  duration: number;
  service: string;
  type: string;
  color: string;
  date: string;
  heure: string;
}

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TIMES = [6, 8, 10, 12, 14, 16, 18, 20, 22];

function getWeekStart(): Date {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
}

export default function InfirmierPlanning() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [nextGuard, setNextGuard] = useState<Shift | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [error, setError] = useState('');

  const weekStart = useMemo(() => getWeekStart(), []);
  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return end;
  }, [weekStart]);

  const dates = useMemo(() => {
    return DAY_NAMES.map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    });
  }, [weekStart]);

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      setError('');
      const res = await api.get('/api/infirmier/planning');
      if (res.data?.shifts) setShifts(res.data.shifts);
      if (res.data?.total_hours != null) setTotalHours(res.data.total_hours);
      if (res.data?.next_guard) setNextGuard(res.data.next_guard);
    } catch (e) {
      setError(getApiErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) fetchData();
    });
  }, [fetchData]);

  useAutoRefresh(fetchData, 60);

  const getShiftForCell = (dayIdx: number, hour: number) => {
    return shifts.find((s) => s.day === dayIdx && s.time <= hour && s.time + s.duration > hour);
  };

  const weekLabel = `Semaine du ${weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} au ${weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return (
    <div style={{ background: '#E0F2FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="infirmier" activeItem="Planning" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
            padding: '12px 16px', marginBottom: '16px', color: '#B91C1C', fontSize: '13px'
          }}>{error}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Planning Hebdomadaire</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Vos gardes et rotations pour la semaine</p>
          </div>
          <RefreshButton onRefresh={fetchData} color="#0369A1" />
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ flex: 3 }}>
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>{weekLabel}</h3>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px', padding: '12px', borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }} />
                      {DAY_NAMES.map((day, i) => (
                        <th key={day} style={{ padding: '12px', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0', background: '#F8FAFC', textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{day}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{dates[i]}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIMES.slice(0, -1).map((time) => (
                      <tr key={time}>
                        <td style={{ padding: '8px', fontSize: '11px', color: '#64748b', textAlign: 'right', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                          {time}h00
                        </td>
                        {DAY_NAMES.map((_, dayIdx) => {
                          const shift = getShiftForCell(dayIdx, time);
                          const isStartOfShift = shift && shift.time === time;
                          return (
                            <td key={dayIdx} style={{
                              padding: '2px', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0',
                              height: '40px', background: shift ? `${shift.color}15` : 'white', position: 'relative'
                            }}>
                              {isStartOfShift && (
                                <div
                                  onClick={() => setSelectedShift(shift)}
                                  style={{
                                    position: 'absolute', top: '2px', left: '2px', right: '2px',
                                    background: shift.color, color: 'white', borderRadius: '6px',
                                    padding: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                                    height: `calc(${(shift.duration / 2) * 100}% - 4px)`, zIndex: 10,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  {shift.service}<br />
                                  <span style={{ fontWeight: '400', fontSize: '10px' }}>{shift.type}</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginTop: '16px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#0EA5E9', borderRadius: '3px' }} /> <span style={{ fontSize: '12px', color: '#64748b' }}>Matin (6h-14h)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#8B5CF6', borderRadius: '3px' }} /> <span style={{ fontSize: '12px', color: '#64748b' }}>Après-midi (14h-22h)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#EF4444', borderRadius: '3px' }} /> <span style={{ fontSize: '12px', color: '#64748b' }}>Garde Nuit (22h-6h)</span></div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>Résumé de la semaine</h3>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}>Heures programmées</p>
                <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0369A1' }}>{totalHours}<span style={{ fontSize: '16px', fontWeight: '600' }}>h</span></p>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>{shifts.length} rotations</p>
                </div>
              </div>

              {nextGuard && (
                <div style={{ background: '#FEF2F2', padding: '12px', borderRadius: '12px', border: '1px solid #FECACA' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ color: '#dc2626' }}>🌙</span>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>Prochaine garde</p>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#b91c1c' }}>
                    {DAY_NAMES[nextGuard.day]}, {String(nextGuard.heure).slice(0, 5)}
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#dc2626', fontWeight: '600', marginTop: '4px' }}>{nextGuard.service}</p>
                </div>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>Rotations cette semaine</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {shifts.slice(0, 5).map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', background: `${s.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: s.color, fontWeight: '700', fontSize: '12px'
                    }}>{String(s.heure).slice(0, 2)}</div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#334155' }}>{s.service}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{DAY_NAMES[s.day]} — {s.type}</p>
                    </div>
                  </div>
                ))}
                {shifts.length === 0 && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Aucune rotation cette semaine.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedShift && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '400px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: selectedShift.color, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Rotation : {selectedShift.type}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>{dates[selectedShift.day]} ({DAY_NAMES[selectedShift.day]})</p>
              </div>
              <button onClick={() => setSelectedShift(null)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>Service affecté</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>🏥 {selectedShift.service}</p>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>Horaires</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                  ⏱ {String(selectedShift.heure).slice(0, 5)} — {selectedShift.time + selectedShift.duration}h00
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Durée : {selectedShift.duration} heures</p>
              </div>
              <button onClick={() => setSelectedShift(null)} style={{
                width: '100%', background: '#F1F5F9', color: '#334155', border: 'none',
                borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
              }}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
