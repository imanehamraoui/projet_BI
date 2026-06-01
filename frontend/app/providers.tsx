'use client';

import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from '@/lib/keycloak';

const initOptions = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: typeof window !== 'undefined' ? `${window.location.origin}/silent-check-sso.html` : '',
  pkceMethod: 'S256',
  flow: 'standard',
};

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReactKeycloakProvider 
      authClient={keycloak} 
      initOptions={initOptions}
      onTokens={(tokens) => {
        // Optional: Log token for debugging
        console.log('Keycloak tokens received');
      }}
      onError={(error) => {
        console.error('Keycloak error:', error);
      }}
    >
      {children}
    </ReactKeycloakProvider>
  );
}
