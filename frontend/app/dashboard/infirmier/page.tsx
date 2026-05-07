'use client';

import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';

interface Patient {
  nom: string;
  prenom: string;
  service: string;
  soin_du_jour: string;
}

export default function DashboardInfirmier() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (!authenticated) {
        window.location.href = '/login';
        return;
      }
      setUserName(keycloak.tokenParsed?.preferred_username || '');
      api.get('/api/patients')
        .then((res) => setPatients(res.data.slice(0, 10)))
        .catch(() => setPatients([]))
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-teal-900">
      <div className="text-white text-xl">Chargement...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-teal-800 text-white px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🏥 Hôpital Ibn Sina</h1>
          <p className="text-teal-200 text-sm">Dashboard Infirmier — Soins du jour</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-teal-200">{userName}</span>
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

        {/* Info accès */}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">💉</span>
          <p className="text-teal-800 text-sm">
            <strong>Accès limité :</strong> Vous voyez uniquement les soins du jour.
            Les antécédents médicaux et données financières ne sont pas accessibles.
          </p>
        </div>

        {/* Tableau soins du jour */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            🗓️ Patients — Soins du jour
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-teal-50 text-teal-800">
                  <th className="p-3 text-left rounded-tl-lg">Nom</th>
                  <th className="p-3 text-left">Prénom</th>
                  <th className="p-3 text-left">Service</th>
                  <th className="p-3 text-left rounded-tr-lg">Soin du jour</th>
                </tr>
              </thead>
              <tbody>
                {patients.length > 0 ? patients.map((p, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{p.nom}</td>
                    <td className="p-3">{p.prenom}</td>
                    <td className="p-3">{p.service}</td>
                    <td className="p-3">
                      <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs">
                        {p.soin_du_jour || 'Soins standards'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400">
                      Données en attente de connexion API
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Accès refusés */}
        <div className="bg-white rounded-2xl p-6 shadow mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">🔒 Accès refusés</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['Antécédents médicaux', 'Diagnostic complet', 'Finances', 'Médicaments', 'Historique consultations'].map((item) => (
              <div key={item} className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <span className="text-red-500 font-medium text-xs">🔒 {item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}