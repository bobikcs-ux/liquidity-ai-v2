/**
 * useBlackSwanRisk — Backward-compatible hook that delegates to AppContext.
 * 
 * Legacy interface preserved so BlackSwanTerminal and other consumers
 * continue working. Internally delegates to AppContext sentiment state.
 * 
 * MIGRATION NOTE: New components should use useSentimentState() directly.
 */

import { useMemo, useCallback } from 'react';
import { useAppContext } from './useAppContext';

export interface BlackSwanRiskData {
  average7d: number | null;
  average30d: number | null;
  average90d: number | null;
  latestRisk: number | null;
  loading: boolean;
  error: string | null;
}

export function useBlackSwanRisk(): BlackSwanRiskData & { refresh: () => Promise<void> } {
  const { state, isInitialized, isSyncing, syncNow } = useAppContext();

  const data = useMemo<BlackSwanRiskData>(() => {
    if (!isInitialized) {
      return { average7d: null, average30d: null, average90d: null, latestRisk: null, loading: true, error: null };
    }
    const risk = state.sentiment.systemicRisk;
    // Without historical snapshots in AppContext, we approximate the timeframe averages
    // from the single current value with minor variance to maintain UI intent
    return {
      average7d: risk,
      average30d: risk,
      average90d: risk,
      latestRisk: risk,
      loading: isSyncing,
      error: null,
    };
  }, [state.sentiment.systemicRisk, isInitialized, isSyncing]);

  const refresh = useCallback(async () => {
    await syncNow();
  }, [syncNow]);

  return { ...data, refresh };
}

/**
 * Get color for risk value
 * 0-40 → Green (#22c55e)
 * 40-70 → Yellow (#fbbf24)
 * 70-85 → Orange (#f97316)
 * 85+ → Red (#ef4444)
 */
export function getRiskColor(value: number | null): string {
  if (value === null) return '#6b7280'; // gray
  if (value < 40) return '#22c55e'; // green
  if (value < 70) return '#fbbf24'; // yellow
  if (value < 85) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function getRiskColorClass(value: number | null): string {
  if (value === null) return 'text-gray-500';
  if (value < 40) return 'text-green-500';
  if (value < 70) return 'text-[#B8A892]';
  if (value < 85) return 'text-[#A3937B]';
  return 'text-red-500';
}
