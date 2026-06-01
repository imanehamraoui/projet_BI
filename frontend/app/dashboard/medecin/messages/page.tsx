'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import keycloak from '@/lib/keycloak';
import { ensureKeycloakSession } from '@/lib/keycloak-init';
import Sidebar from '@/components/Sidebar';
import { useAutoRefresh } from '@/components/useAutoRefresh';

interface Message {
  message_id?: number;
  id?: number;
  parent_message_id?: number | null;
  expediteur: string;
  role_expediteur: string;
  avatar: string;
  sujet: string;
  contenu: string;
  heure: string;
  lu: boolean;
}

interface Thread {
  key: string;
  subject: string;
  messages: Message[];
  lastHeure: string;
  unread: boolean;
  counterpart: string;
  avatar: string;
}

function messageId(msg: Message): number {
  return msg.message_id ?? msg.id ?? 0;
}

function normalizeSubject(sujet: string): string {
  let s = (sujet || '').trim();
  while (/^re:\s*/i.test(s)) {
    s = s.replace(/^re:\s*/i, '').trim();
  }
  return s || 'Sans objet';
}

function isOwnMessage(msg: Message): boolean {
  const username = (keycloak.tokenParsed?.preferred_username || '').toLowerCase();
  const familyName = (keycloak.tokenParsed?.family_name || '').toLowerCase();
  const exp = (msg.expediteur || '').toLowerCase();
  if (familyName && exp.includes(familyName)) return true;
  if (username) {
    const short = username.replace(/^(dr\.|prof\.)/, '');
    if (short && exp.includes(short)) return true;
  }
  return false;
}

function buildThreads(messages: Message[]): Thread[] {
  const sorted = [...messages].sort((a, b) => messageId(a) - messageId(b));
  const byId = new Map<number, Message>();
  for (const msg of sorted) {
    byId.set(messageId(msg), msg);
  }

  const rootId = (msg: Message): number => {
    let current = msg;
    const seen = new Set<number>();
    while (current.parent_message_id && !seen.has(current.parent_message_id)) {
      seen.add(messageId(current));
      const parent = byId.get(current.parent_message_id);
      if (!parent) break;
      current = parent;
    }
    return messageId(current) || messageId(msg);
  };

  const groups = new Map<number, Message[]>();
  for (const msg of sorted) {
    const rid = rootId(msg);
    if (!groups.has(rid)) groups.set(rid, []);
    groups.get(rid)!.push(msg);
  }

  const threads: Thread[] = [];
  for (const [, msgs] of groups) {
    const ordered = [...msgs].sort((a, b) => messageId(a) - messageId(b));
    const root = ordered[0];
    const subject = normalizeSubject(root.sujet);
    const lastIncoming = [...ordered].reverse().find((m) => !isOwnMessage(m)) ?? root;
    threads.push({
      key: String(rootId(root)),
      subject,
      messages: ordered,
      lastHeure: ordered[ordered.length - 1].heure,
      unread: ordered.some((m) => !m.lu && !isOwnMessage(m)),
      counterpart: lastIncoming.expediteur,
      avatar: lastIncoming.avatar || root.avatar,
    });
  }

  // Fusionner les fils legacy ayant le même sujet (sans parent_message_id)
  const merged = new Map<string, Thread>();
  for (const thread of threads) {
    const subjectKey = thread.subject.toLowerCase();
    const existing = merged.get(subjectKey);
    if (!existing) {
      merged.set(subjectKey, thread);
      continue;
    }
    const combined = [...existing.messages, ...thread.messages].sort(
      (a, b) => messageId(a) - messageId(b)
    );
    const deduped = combined.filter(
      (msg, idx, arr) => arr.findIndex((m) => messageId(m) === messageId(msg)) === idx
    );
    const lastIncoming = [...deduped].reverse().find((m) => !isOwnMessage(m)) ?? deduped[0];
    merged.set(subjectKey, {
      key: existing.key,
      subject: thread.subject,
      messages: deduped,
      lastHeure: deduped[deduped.length - 1].heure,
      unread: deduped.some((m) => !m.lu && !isOwnMessage(m)),
      counterpart: lastIncoming.expediteur,
      avatar: lastIncoming.avatar || deduped[0].avatar,
    });
  }

  return Array.from(merged.values()).sort(
    (a, b) => messageId(b.messages[b.messages.length - 1]) - messageId(a.messages[a.messages.length - 1])
  );
}

export default function MedecinMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const threads = useMemo(() => buildThreads(messages), [messages]);
  const selectedThread = useMemo(
    () => threads.find((t) => t.key === selectedThreadKey) ?? threads[0] ?? null,
    [threads, selectedThreadKey]
  );

  const fetchData = useCallback(async () => {
    const authenticated = await ensureKeycloakSession();
    if (!authenticated) return;

    try {
      const res = await api.get('/api/messages');
      if (res.data?.data) {
        setMessages(res.data.data);
      }
    } catch {}
  }, []);

  useAutoRefresh(fetchData, 30);

  useEffect(() => {
    ensureKeycloakSession().then((authenticated) => {
      if (authenticated) fetchData();
    });
  }, [fetchData]);

  useEffect(() => {
    if (threads.length > 0 && !selectedThreadKey) {
      setSelectedThreadKey(threads[0].key);
    }
  }, [threads, selectedThreadKey]);

  const unread = threads.filter((t) => t.unread).length;

  const handleSelectThread = (thread: Thread) => {
    setSelectedThreadKey(thread.key);
    const ids = new Set(thread.messages.map((m) => messageId(m)));
    setMessages((prev) =>
      prev.map((m) => (ids.has(messageId(m)) ? { ...m, lu: true } : m))
    );
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedThread || sending) return;

    const authenticated = await ensureKeycloakSession();
    if (!authenticated) {
      keycloak.login();
      return;
    }

    const root = selectedThread.messages[0];
    const lastIncoming = [...selectedThread.messages]
      .reverse()
      .find((m) => !isOwnMessage(m));

    setSending(true);
    try {
      const res = await api.post('/api/messages', {
        destinataire: lastIncoming?.expediteur ?? root.expediteur,
        sujet: selectedThread.subject,
        contenu: newMessage.trim(),
        parent_message_id: messageId(root) || undefined,
      });

      const created = res.data?.data as Message | undefined;
      if (created) {
        setMessages((prev) => [...prev, created]);
      } else {
        await fetchData();
      }
      setNewMessage('');
    } catch {
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: '#E8F0FE', minHeight: '100vh', display: 'flex', fontFamily: "'Segoe UI', sans-serif" }}>
      <Sidebar role="medecin" activeItem="Messages" />

      <div style={{ marginLeft: '90px', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>Messages</h1>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>
            {unread} discussion{unread > 1 ? 's' : ''} non lue{unread > 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
          <div style={{
            width: '320px', background: 'white', borderRadius: '20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #F3F4F6' }}>
              <p style={{ margin: 0, fontWeight: '700', color: '#1a1a2e', fontSize: '14px' }}>Boîte de réception</p>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {threads.length === 0 ? (
                <p style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>Aucun message</p>
              ) : threads.map((thread) => {
                const active = selectedThread?.key === thread.key;
                const preview = thread.messages[thread.messages.length - 1];
                return (
                  <div
                    key={thread.key}
                    onClick={() => handleSelectThread(thread)}
                    style={{
                      padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #F9FAFB',
                      background: active ? '#EEF2FF' : thread.unread ? '#F0F9FF' : 'white',
                      borderLeft: active ? '3px solid #1565C0' : '3px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #1565C0, #1976D2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '14px', flexShrink: 0
                      }}>
                        {thread.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <p style={{ margin: 0, fontWeight: thread.unread ? '700' : '500', color: '#1a1a2e', fontSize: '12px' }}>
                            {thread.counterpart}
                          </p>
                          <span style={{ fontSize: '10px', color: '#9CA3AF', flexShrink: 0 }}>{thread.lastHeure}</span>
                        </div>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: '600', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {thread.subject}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {preview.contenu}
                        </p>
                        {thread.messages.length > 1 && (
                          <span style={{ fontSize: '10px', color: '#1565C0', fontWeight: '600' }}>
                            {thread.messages.length} messages
                          </span>
                        )}
                      </div>
                      {thread.unread && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1565C0', flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedThread && (
            <div style={{
              flex: 1, background: 'white', borderRadius: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '24px',
              display: 'flex', flexDirection: 'column', minHeight: '480px'
            }}>
              <div style={{ borderBottom: '1px solid #F3F4F6', paddingBottom: '16px', marginBottom: '16px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>
                  {selectedThread.subject}
                </h2>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>
                  Conversation avec {selectedThread.counterpart}
                </p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {selectedThread.messages.map((msg) => {
                  const mine = isOwnMessage(msg);
                  return (
                    <div
                      key={messageId(msg)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: mine ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        alignSelf: mine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{
                        background: mine ? 'linear-gradient(135deg, #1565C0, #1976D2)' : '#F3F4F6',
                        color: mine ? 'white' : '#374151',
                        borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        padding: '10px 14px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                      }}>
                        {msg.contenu}
                      </div>
                      <span style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>
                        {msg.expediteur} — {msg.heure}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: '600', color: '#1a1a2e', fontSize: '13px' }}>
                  Répondre dans cette discussion
                </p>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Écrivez votre réponse..."
                  style={{
                    width: '100%', height: '80px', borderRadius: '12px',
                    border: '1px solid #E5E7EB', padding: '12px',
                    fontSize: '13px', resize: 'none', outline: 'none',
                    fontFamily: "'Segoe UI', sans-serif", boxSizing: 'border-box'
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  style={{
                    marginTop: '8px',
                    background: sending ? '#9CA3AF' : 'linear-gradient(135deg, #1565C0, #1976D2)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    padding: '10px 24px', fontSize: '13px',
                    cursor: sending ? 'not-allowed' : 'pointer', fontWeight: '600'
                  }}
                >
                  {sending ? 'Envoi...' : 'Envoyer ✉️'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
