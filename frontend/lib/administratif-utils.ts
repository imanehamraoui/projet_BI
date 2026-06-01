import { AxiosError } from 'axios';
import keycloak from './keycloak';

export function getAdministratifApiError(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string }>;
  const status = axiosErr.response?.status;
  const detail = axiosErr.response?.data?.detail;
  if (status === 403) {
    return detail || 'Accès refusé. Utilisez le compte administratif (marie.admin).';
  }
  if (status === 401) {
    return 'Session expirée. Reconnectez-vous.';
  }
  return 'Impossible de charger les données administratives.';
}

export function isAdministratifAccount(): boolean {
  return (keycloak.realmAccess?.roles || []).includes('administratif');
}
