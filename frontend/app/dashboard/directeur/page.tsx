'use client';

import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';

interface KPI {
  total_consultations: number;
  total_patients: number;
  diagnostics_count: number;
  revenus_total?: number;
}

interface AuditLog {
  user: string;
  action: string;
  timestamp: string;
  resource: string;
}

export default function DashboardDirecteur() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (!authenticated) {
        window.location.href = '/login';
        return;
      }
      setUserName(keycloak.tokenParsed?.preferred_username || '');
      Promise.all([
        api.get('/api/dashboard/kpis?annee=2024'),
        api.get('/api/audit'),
      ])
        .then(([kpiRes, auditRes]) => {
          setKpis(kpiRes.data);
          setAuditLogs(auditRes.data.slice(0, 8));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-white text-xl">Chargement...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🏥 Hôpital Ibn Sina</h1>
          <p className="text-gray-300 text-sm">Dashboard Directeur — Accès complet</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
            DIRECTEUR
          </span>
          <span className="text-gray-300">{userName}</span>
          <button
            onClick={() => keycloak.logout()}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="p-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow text-center border-l-4 border-blue-600">
            <p className="text-gray-500 text-sm">Consultations</p>
            <p className="text-4xl font-bold text-blue-700 mt-2">
              {kpis?.total_consultations ?? '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center border-l-4 border-green-500">
            <p className="text-gray-500 text-sm">Patients</p>
            <p className="text-4xl font-bold text-green-600 mt-2">
              {kpis?.total_patients ?? '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center border-l-4 border-purple-500">
            <p className="text-gray-500 text-sm">Diagnostics</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">
              {kpis?.diagnostics_count ?? '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Revenus</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {kpis?.revenus_total ? `${kpis.revenus_total} MAD` : '—'}
            </p>
          </div>
        </div>

        {/* Accès complet + Audit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Accès complet */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              ✅ Accès complet autorisé
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {['Nom patient', 'Diagnostic', 'Médicaments', 'Finances', 'Audit trail', 'Tous les services', 'Statistiques', 'Rapports'].map((item) => (
                <div key={item} className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <span className="text-green-700 font-medium text-xs">✅ {item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Journal d'audit */}
          <div className="bg-white rounded-2xl p-6 shadow">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              📋 Journal d'audit récent
            </h3>
            <div className="space-y-3">
              {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{log.user}</p>
                    <p className="text-xs text-gray-400">{log.action} — {log.resource}</p>
                  </div>
                  <span className="text-xs text-gray-400">{log.timestamp}</span>
                </div>
              )) : (
                <div className="text-center text-gray-400 py-4">
                  Journal en attente de connexion API
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}