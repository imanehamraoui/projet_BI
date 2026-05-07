'use client';

import { useEffect } from 'react';
import keycloak from '@/lib/keycloak';

export default function DashboardPage() {
  useEffect(() => {
    keycloak.init({ onLoad: 'check-sso' }).then((authenticated) => {
      if (!authenticated) {
        window.location.href = '/login';
        return;
      }
      const role = keycloak.realmAccess?.roles?.find((r) =>
        ['medecin', 'administratif', 'chercheur', 'infirmier', 'directeur'].includes(r)
      );
      if (role) {
        window.location.href = `/dashboard/${role}`;
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-950">
      <div className="text-white text-xl">Chargement du dashboard...</div>
    </div>
  );
}