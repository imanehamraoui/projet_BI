import { useEffect, useCallback } from 'react';

export function useAutoRefresh(
  fetchFn: () => void,
  intervalSeconds: number = 30
) {
  const stableFetch = useCallback(fetchFn, []);

  useEffect(() => {
    stableFetch(); // chargement initial
    const interval = setInterval(stableFetch, intervalSeconds * 1000);
    return () => clearInterval(interval); // nettoyage
  }, [stableFetch, intervalSeconds]);
}