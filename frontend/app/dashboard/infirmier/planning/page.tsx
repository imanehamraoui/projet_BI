'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import RefreshButton from '@/components/RefreshButton';
import { useAutoRefresh } from '@/components/useAutoRefresh';

const shifts = [
  { id: 1, day: 0, time: 6, duration: 8, service: 'Cardiologie', type: 'Matin', color: '#0EA5E9' },
  { id: 2, day: 1, time: 6, duration: 8, service: 'Cardiologie', type: 'Matin', color: '#0EA5E9' },
  { id: 3, day: 2, time: 14, duration: 8, service: 'Neurologie', type: 'Après-midi', color: '#8B5CF6' },
  { id: 4, day: 3, time: 14, duration: 8, service: 'Neurologie', type: 'Après-midi', color: '#8B5CF6' },
  { id: 5, day: 4, time: 22, duration: 8, service: 'Urgences', type: 'Garde', color: '#EF4444' },
  // Day 5 and 6 are repos
];

const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const dates = ['07 Oct', '08 Oct', '09 Oct', '10 Oct', '11 Oct', '12 Oct', '13 Oct'];
const times = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24]; // 6h to midnight

export default function InfirmierPlanning() {
  const [data, setData] = useState(shifts);
  const [selectedShift, setSelectedShift] = useState<any>(null);

  // No real API for planning yet, using simulated data
  const fetchData = useCallback(async () => {}, []);
  useAutoRefresh(fetchData, 60);

  const getShiftForCell = (dayIdx: number, hour: number) => {
    return data.find(s => s.day === dayIdx && s.time <= hour && (s.time + s.duration) > hour);
  };

  return (
    <div style={{ background: '#E0F2FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="infirmier" activeItem="Planning" />
      
      <div style={{ marginLeft: '90px', flex: 1, padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Planning Hebdomadaire</h1>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>Vos gardes et rotations pour la semaine</p>
          </div>
          <RefreshButton onRefresh={fetchData} color="#0369A1" />
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {/* Main Planning */}
          <div style={{ flex: 3 }}>
            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              {/* Toolbar */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button style={{ background: 'white', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>← Précédent</button>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>Semaine du 07 au 13 Oct 2024</h3>
                <button style={{ background: 'white', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Suivant →</button>
              </div>

              {/* Grid */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '60px', padding: '12px', borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}></th>
                      {days.map((day, i) => (
                        <th key={day} style={{ padding: '12px', borderBottom: '2px solid #E2E8F0', borderLeft: '1px solid #E2E8F0', background: '#F8FAFC', textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{day}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>{dates[i]}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {times.slice(0, -1).map((time, rowIdx) => (
                      <tr key={time}>
                        <td style={{ padding: '8px', fontSize: '11px', color: '#64748b', textAlign: 'right', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                          {time}h00
                        </td>
                        {days.map((_, dayIdx) => {
                          const shift = getShiftForCell(dayIdx, time);
                          const isStartOfShift = shift && shift.time === time;
                          const isMiddleOfShift = shift && shift.time < time;
                          
                          return (
                            <td key={dayIdx} style={{ 
                              padding: '2px', borderBottom: '1px solid #E2E8F0', borderLeft: '1px solid #E2E8F0', height: '40px',
                              background: shift ? \`\${shift.color}15\` : 'white', position: 'relative'
                            }}>
                              {isStartOfShift && (
                                <div 
                                  onClick={() => setSelectedShift(shift)}
                                  style={{ 
                                    position: 'absolute', top: '2px', left: '2px', right: '2px', 
                                    background: shift.color, color: 'white', borderRadius: '6px', 
                                    padding: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                                    height: \`calc(\${(shift.duration / 2) * 100}% - 4px)\`, zIndex: 10,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  {shift.service}<br/>
                                  <span style={{ fontWeight: '400', fontSize: '10px' }}>{shift.type}</span>
                                </div>
                              )}
                              {(!shift && rowIdx === 5 && (dayIdx === 5 || dayIdx === 6)) && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '600', opacity: 0.5 }}>
                                  REPOS
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

            {/* Legend */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '16px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#0EA5E9', borderRadius: '3px' }}/> <span style={{ fontSize: '12px', color: '#64748b' }}>Matin (6h-14h)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#8B5CF6', borderRadius: '3px' }}/> <span style={{ fontSize: '12px', color: '#64748b' }}>Après-midi (14h-22h)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '12px', height: '12px', background: '#EF4444', borderRadius: '3px' }}/> <span style={{ fontSize: '12px', color: '#64748b' }}>Garde Nuit (22h-6h)</span></div>
            </div>
          </div>

          {/* Right Summary */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>Résumé de la semaine</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b' }}>Heures programmées</p>
                <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#0369A1' }}>40<span style={{ fontSize: '16px', fontWeight: '600' }}>h</span></p>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>Temps plein</p>
                </div>
              </div>

              <div style={{ background: '#FEF2F2', padding: '12px', borderRadius: '12px', border: '1px solid #FECACA' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: '#dc2626' }}>🌙</span>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#991b1b' }}>Prochaine garde</p>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#b91c1c' }}>Vendredi 11 Oct, 22h00</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#dc2626', fontWeight: '600', marginTop: '4px' }}>Urgences</p>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#1e293b' }}>Équipe de garde (Aujourd'hui)</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: 'Dr. Alaoui', role: 'Médecin Chef', service: 'Urgences' },
                  { name: 'F. Zahra', role: 'Infirmière', service: 'Urgences' },
                  { name: 'K. Tazi', role: 'Brancardier', service: 'Urgences' },
                ].map((member, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontWeight: '700', fontSize: '12px' }}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#334155' }}>{member.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedShift && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '400px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: selectedShift.color, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Rotation : {selectedShift.type}</h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.9 }}>{dates[selectedShift.day]} ({days[selectedShift.day]})</p>
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
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>⏱ {selectedShift.time}h00 - {selectedShift.time + selectedShift.duration}h00</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>Durée : {selectedShift.duration} heures</p>
              </div>
              
              <button 
                onClick={() => setSelectedShift(null)}
                style={{ width: '100%', background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
