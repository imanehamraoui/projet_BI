import { AxiosError } from 'axios';
import keycloak from './keycloak';

export function getApiErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ detail?: string }>;
  const status = axiosErr.response?.status;
  const detail = axiosErr.response?.data?.detail;
  if (status === 403) {
    return detail || 'Accès refusé. Utilisez le compte infirmier (sophie.inf).';
  }
  if (status === 401) {
    return 'Session expirée. Reconnectez-vous.';
  }
  return 'Impossible de charger les données.';
}

export function getUserRoles(): string[] {
  return keycloak.realmAccess?.roles || [];
}

export function isInfirmierAccount(): boolean {
  return getUserRoles().includes('infirmier');
}

export function canEditSoins(): boolean {
  return isInfirmierAccount();
}
