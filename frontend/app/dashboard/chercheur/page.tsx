'use client';

import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';
import api from '@/lib/api';

interface Patient {
  token_anonyme: string;
  age: number;
  sexe: string;
  region: string;
  diagnostic_code: string;
}

export default function DashboardChercheur() {
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
    <div className="min-h-screen flex items-center justify-center bg-purple-900">
      <div className="text-white text-xl">Chargement...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-900 text-white px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🏥 Hôpital Ibn Sina</h1>
          <p className="text-purple-200 text-sm">Dashboard Chercheur — Données Anonymisées</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-purple-200">Prof. {userName}</span>
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

        {/* Avertissement anonymisation */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🔬</span>
          <p className="text-purple-800 text-sm">
            <strong>Données anonymisées :</strong> Toutes les données identifiantes sont masquées.
            Vous accédez uniquement aux données statistiques conformes au RGPD.
          </p>
        </div>

        {/* Tableau données anonymisées */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            📊 Données patients anonymisées
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 text-purple-800">
                  <th className="p-3 text-left rounded-tl-lg">Token Anonyme</th>
                  <th className="p-3 text-left">Âge</th>
                  <th className="p-3 text-left">Sexe</th>
                  <th className="p-3 text-left">Région</th>
                  <th className="p-3 text-left rounded-tr-lg">Code Diagnostic</th>
                </tr>
              </thead>
              <tbody>
                {patients.length > 0 ? patients.map((p, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-500">{p.token_anonyme}</td>
                    <td className="p-3">{p.age} ans</td>
                    <td className="p-3">{p.sexe}</td>
                    <td className="p-3">{p.region}</td>
                    <td className="p-3 font-mono">{p.diagnostic_code}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Nom réel', 'Prénom', 'CIN', 'Téléphone', 'Adresse', 'N° Sécurité Sociale', 'Finances', 'Médicaments'].map((item) => (
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