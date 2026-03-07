import { useEffect, useRef, useCallback } from 'react';

const GLOBAL_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * useAutoRefresh
 * Calls `onRefresh` immediately on mount, then every `interval` ms (default 5 min).
 * Returns a manual `refresh` trigger.
 */
export function useAutoRefresh(
  onRefresh: () => void | Promise<void>,
  interval: number = GLOBAL_REFRESH_INTERVAL
) {
  const cbRef = useRef(onRefresh);

  // Keep ref current so interval never needs to be recreated
  useEffect(() => {
    cbRef.current = onRefresh;
  }, [onRefresh]);

  const refresh = useCallback(() => {
    void cbRef.current();
  }, []);

  useEffect(() => {
    void cbRef.current(); // immediate first call
    const id = setInterval(() => void cbRef.current(), interval);
    return () => clearInterval(id);
  }, [interval]);

  return { refresh };
}

export const REFRESH_INTERVAL_MS = GLOBAL_REFRESH_INTERVAL;
