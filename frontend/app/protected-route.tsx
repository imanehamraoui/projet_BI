'use client';

import { useKeycloak } from '@react-keycloak/web';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
}) {
  const { keycloak, initialized } = useKeycloak();
  const router = useRouter();

  useEffect(() => {
    if (initialized) {
      if (!keycloak?.authenticated) {
        router.push('/login');
      } else if (requiredRoles && requiredRoles.length > 0) {
        const userRoles = keycloak.realmAccess?.roles || [];
        const hasRole = requiredRoles.some((role) => userRoles.includes(role));
        if (!hasRole) {
          router.push('/');
        }
      }
    }
  }, [initialized, keycloak, router, requiredRoles]);

  if (!initialized || !keycloak?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-950">
        <div className="text-white text-xl">Vérification des permissions...</div>
      </div>
    );
  }

  return children;
}
