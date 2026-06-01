'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

interface Message {
  id: number;
  from: string;
  role: string;
  subject: string;
  content: string;
  time: string;
  read: boolean;
  avatar: string;
}

const messagesData: Message[] = [
  { id: 1, from: 'Dr. Alaoui', role: 'Médecin', subject: 'Patient El Idrissi — Résultats analyses', content: 'Bonjour, les résultats des analyses du patient El Idrissi sont arrivés. Les valeurs cardiaques sont préoccupantes. Je vous recommande une consultation urgente.', time: '09:15', read: false, avatar: 'A' },
  { id: 2, from: 'Marie Admin', role: 'Administratif', subject: 'Rappel RDV demain 14h', content: 'Bonjour Docteur, je vous rappelle que vous avez une réunion du service cardiologie demain à 14h en salle de conférence B.', time: '08:45', read: false, avatar: 'M' },
  { id: 3, from: 'Prof. Rhanem', role: 'Chercheur', subject: 'Collaboration étude diabète', content: 'Bonjour, dans le cadre de notre étude sur le diabète de type 2, nous aurions besoin de votre expertise. Seriez-vous disponible pour une réunion cette semaine ?', time: 'Hier', read: true, avatar: 'R' },
  { id: 4, from: 'Sophie Inf.', role: 'Infirmier', subject: 'Patient chambre 12 — Tension élevée', content: 'Docteur, la tension du patient en chambre 12 est à 18/11. Il se plaint de maux de tête. Faut-il lui administrer un médicament d\'urgence ?', time: 'Hier', read: true, avatar: 'S' },
  { id: 5, from: 'Directeur CHU', role: 'Directeur', subject: 'Réunion mensuelle — Jeudi 10h', content: 'Bonjour à tous, je vous convie à la réunion mensuelle du corps médical jeudi prochain à 10h. Ordre du jour : bilan des consultations et protocoles.', time: 'Lun', read: true, avatar: 'D' },
];

export default function MedecinMessages() {
  const [messages, setMessages] = useState(messagesData);
  const [selected, setSelected] = useState<Message | null>(messagesData[0]);
  const [newMessage, setNewMessage] = useState('');

  const unread = messages.filter(m => !m.read).length;

  const handleSelect = (msg: Message) => {
    setSelected(msg);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
  };

  return (
    <div style={{ background: '#E8F0FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="medecin" activeItem="Messages" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>
            Messages
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
            {unread} message{unread > 1 ? 's' : ''} non lu{unread > 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
          {/* Liste messages */}
          <div style={{
            width: '320px', background: 'white', borderRadius: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #F3F4F6' }}>
              <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>
                Boîte de réception
              </p>
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => handleSelect(msg)}
                style={{
                  padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #F9FAFB',
                  background: selected?.id === msg.id ? '#EEF2FF' : msg.read ? 'white' : '#F0F9FF',
                  borderLeft: selected?.id === msg.id ? '3px solid #1565C0' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0
                  }}>
                    {msg.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <p style={{ margin: 0, fontWeight: msg.read ? '500' : '700', color: '#1a1a2e', fontSize: '12px' }}>
                        {msg.from}
                      </p>
                      <span style={{ fontSize: '10px', color: '#9CA3AF' }}>{msg.time}</span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.subject}
                    </p>
                  </div>
                  {!msg.read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1565C0', flexShrink: 0 }} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Contenu message */}
          {selected && (
            <div style={{
              flex: 1, background: 'white', borderRadius: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '24px',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '16px', marginBottom: '16px' }}>
                <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>
                  {selected.subject}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '700'
                  }}>
                    {selected.avatar}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', color: '#1a1a2e', fontSize: '14px' }}>{selected.from}</p>
                    <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>{selected.role} — {selected.time}</p>
                  </div>
                </div>
              </div>

              <p style={{ color: '#374151', fontSize: '14px', lineHeight: '1.6', flex: 1 }}>
                {selected.content}
              </p>

              {/* Répondre */}
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px', marginTop: '16px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>
                  Répondre à {selected.from}
                </p>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  style={{
                    width: '100%', height: '100px', borderRadius: '12px',
                    border: '1px solid #E5E7EB', padding: '12px',
                    fontSize: '13px', resize: 'none', outline: 'none',
                    fontFamily: "'Segoe UI', sans-serif", boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={() => setNewMessage('')}
                  style={{
                    marginTop: '8px',
                    background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    padding: '10px 24px', fontSize: '13px', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Envoyer ✉️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}