import { useEffect, useState, useCallback, useRef } from 'react';

interface MacroSnapshot {
  id: string;
  yield_spread: number;
  rate_shock: number;
  balance_sheet_delta: number;
  btc_price: number;
  btc_volatility: number;
  btc_dominance: number;
  systemic_risk: number;
  survival_probability: number;
  var_95: number;
  regime: 'normal' | 'stress' | 'crisis';
  data_sources_ok: boolean;
  created_at?: string;
}

export interface MacroWorkerState {
  snapshot: MacroSnapshot | null;
  loading: boolean;
  lastFetch: Date | null;
  error: string | null;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // Poll every 5 minutes

/**
 * useMacroWorker — Orchestrates FRED, BTC, and balance sheet data collection
 * 
 * Calls POST /api/macro/worker to fetch yield curve, BTC data, and systemic risk metrics.
 * Polls every 5 minutes or can be triggered manually.
 */
export function useMacroWorker(): MacroWorkerState & { trigger: () => Promise<void> } {
  const [state, setState] = useState<MacroWorkerState>({
    snapshot: null,
    loading: false,
    lastFetch: null,
    error: null,
  });

  const isMounted = useRef(true);

  const trigger = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch('/api/macro/worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const { success, snapshot, error } = await res.json();

      if (!isMounted.current) return;

      if (success && snapshot) {
        setState({
          snapshot,
          loading: false,
          lastFetch: new Date(),
          error: null,
        });
        console.log('[useMacroWorker] Snapshot fetched:', snapshot);
      } else {
        throw new Error(error || 'Failed to fetch macro snapshot');
      }
    } catch (err: any) {
      if (!isMounted.current) return;

      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
      console.error('[useMacroWorker] Error:', errorMsg);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // Initial fetch immediately
    trigger();

    // Poll every 5 minutes
    const pollInterval = setInterval(trigger, POLL_INTERVAL_MS);

    return () => {
      isMounted.current = false;
      clearInterval(pollInterval);
    };
  }, [trigger]);

  return { ...state, trigger };
}
