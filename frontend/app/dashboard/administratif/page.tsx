'use client';

import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';

interface KPI {
  total_consultations: number;
  total_patients: number;
  revenus_total?: number;
}

export default function DashboardAdministratif() {
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (!authenticated) {
        window.location.href = '/login';
        return;
      }
      setUserName(keycloak.tokenParsed?.preferred_username || '');
      api.get('/api/dashboard/kpis?annee=2024')
        .then((res) => setKpis(res.data))
        .catch(() => setKpis(null))
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-green-900">
      <div className="text-white text-xl">Chargement...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-900 text-white px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🏥 Hôpital Ibn Sina</h1>
          <p className="text-green-200 text-sm">Dashboard Administratif</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-green-200">{userName}</span>
          <button
            onClick={() => keycloak.logout()}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-6">
          Gestion Administrative — 2024
        </h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow text-center border-l-4 border-green-600">
            <p className="text-gray-500 text-sm">Total Patients</p>
            <p className="text-4xl font-bold text-green-700 mt-2">
              {kpis?.total_patients ?? '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm">Total Consultations</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">
              {kpis?.total_consultations ?? '—'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center border-l-4 border-yellow-500">
            <p className="text-gray-500 text-sm">Revenus Total</p>
            <p className="text-4xl font-bold text-yellow-600 mt-2">
              {kpis?.revenus_total ? `${kpis.revenus_total} MAD` : '—'}
            </p>
          </div>
        </div>

        {/* Accès autorisés */}
        <div className="bg-white rounded-2xl p-6 shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            ✅ Vos accès autorisés
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['Nom patient', 'Finances', 'Données administratives'].map((item) => (
              <div key={item} className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <span className="text-green-700 font-medium text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {['Diagnostic médical', 'Médicaments'].map((item) => (
              <div key={item} className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <span className="text-red-500 font-medium text-sm">🔒 {item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}