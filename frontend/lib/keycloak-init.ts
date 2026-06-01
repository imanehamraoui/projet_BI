import keycloak from './keycloak';

let initPromise: Promise<boolean> | null = null;

export function ensureKeycloakSession(): Promise<boolean> {
  if (keycloak.authenticated) {
    return Promise.resolve(true);
  }
  if (!initPromise) {
    initPromise = keycloak
      .init({ onLoad: 'check-sso', pkceMethod: 'S256' })
      .catch(() => false);
  }
  return initPromise;
}
