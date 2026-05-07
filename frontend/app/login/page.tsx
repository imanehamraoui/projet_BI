'use client';

import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';

export default function LoginPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required' })
      .then((authenticated) => {
        if (authenticated) {
          const role = keycloak.realmAccess?.roles?.find((r) =>
            ['medecin', 'administratif', 'chercheur', 'infirmier', 'directeur'].includes(r)
          );
          if (role) {
            window.location.href = `/dashboard/${role}`;
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-950">
        <div className="text-white text-xl">Connexion en cours...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-950">
      <div className="bg-white rounded-2xl p-10 shadow-2xl text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">🏥 Hôpital Ibn Sina</h1>
        <p className="text-gray-500 mb-6">Système de gestion hospitalière sécurisé</p>
        <button
          onClick={() => keycloak.login()}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl transition"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
}