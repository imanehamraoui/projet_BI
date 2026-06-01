import { AxiosError } from 'axios';
import keycloak from './keycloak';

export function getChercheurApiError(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string }>;
  const status = axiosErr.response?.status;
  const detail = axiosErr.response?.data?.detail;
  if (status === 403) {
    return detail || 'Accès refusé. Utilisez le compte chercheur (prof.rhanem).';
  }
  if (status === 401) {
    return 'Session expirée. Reconnectez-vous.';
  }
  return 'Impossible de charger les données anonymisées.';
}

export function isChercheurAccount(): boolean {
  return (keycloak.realmAccess?.roles || []).includes('chercheur');
}
