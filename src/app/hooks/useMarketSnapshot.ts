/**
 * useMarketSnapshot — Backward-compatible hook that delegates to AppContext.
 * 
 * Legacy interface preserved so existing components continue working without
 * changes. Internally all data now comes from the centralized AppContext
 * rather than direct Supabase queries.
 * 
 * MIGRATION NOTE: New components should use useAppContext() directly.
 */

import { useMemo, useCallback } from 'react';
import { useAppContext } from './useAppContext';

export interface MarketSnapshot {
  id: string;
  created_at: string;
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
}

export interface DataStatus {
  status: 'GREEN' | 'YELLOW' | 'RED';
  last_update: string | null;
  snapshots_24h: number;
}

interface UseMarketSnapshotReturn {
  latest: MarketSnapshot | null;
  history: MarketSnapshot[];
  dataStatus: DataStatus | null;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Global Fear & Greed exports — kept for backward compatibility with
// masterIntelligence.ts which imports these module-level vars.
// ---------------------------------------------------------------------------
export let GLOBAL_FEAR_GREED_VALUE: number | null = null;
export let GLOBAL_FEAR_GREED_LABEL = 'Loading...';

export function useMarketSnapshot(): UseMarketSnapshotReturn {
  const { state, isInitialized, isSyncing, syncNow } = useAppContext();

  // Map AppContext TerminalState → legacy MarketSnapshot shape
  const latest = useMemo<MarketSnapshot | null>(() => {
    if (!isInitialized) return null;
    const { prices, sentiment } = state;
    // Keep global vars in sync for legacy consumers
    GLOBAL_FEAR_GREED_VALUE = sentiment.fearGreedIndex;
    GLOBAL_FEAR_GREED_LABEL = sentiment.fearGreedLabel;
    return {
      id: `ctx-${state.lastSyncMs}`,
      created_at: new Date(state.lastSyncMs).toISOString(),
      yield_spread: sentiment.yieldSpread,
      rate_shock: sentiment.rateShock,
      balance_sheet_delta: sentiment.balanceSheetDelta,
      btc_price: prices.btc.value,
      btc_volatility: sentiment.btcVolatility,
      btc_dominance: prices.btcDominance,
      systemic_risk: sentiment.systemicRisk / 100, // stored as decimal
      survival_probability: sentiment.survivalProbability / 100, // stored as decimal
      var_95: sentiment.var95,
      regime: sentiment.regime,
      data_sources_ok: state.overallStatus === 'LIVE',
    };
  }, [state, isInitialized]);

  const dataStatus = useMemo<DataStatus>(() => {
    if (!isInitialized || state.lastSyncMs === 0) {
      return { status: 'RED', last_update: null, snapshots_24h: 0 };
    }
    const ageMs = Date.now() - state.lastSyncMs;
    const statusStr: 'GREEN' | 'YELLOW' | 'RED' =
      ageMs < 15 * 60_000 ? 'GREEN' : ageMs < 60 * 60_000 ? 'YELLOW' : 'RED';
    return {
      status: statusStr,
      last_update: new Date(state.lastSyncMs).toISOString(),
      snapshots_24h: 1, // AppContext doesn't track historical count
    };
  }, [state.lastSyncMs, isInitialized]);

  const refresh = useCallback(async () => {
    await syncNow();
  }, [syncNow]);

  return {
    latest,
    history: latest ? [latest] : [],
    dataStatus,
    loading: !isInitialized || isSyncing,
    isLoading: !isInitialized || isSyncing,
    error: null,
    refresh,
  };
}

// Helper hook for just the latest data (lighter weight)
export function useLatestSnapshot(): {
  snapshot: MarketSnapshot | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const { latest, loading, refresh } = useMarketSnapshot();
  return { snapshot: latest, loading, refresh };
}

// Helper hook for data status
export function useDataStatus(): {
  status: DataStatus | null;
  loading: boolean;
} {
  const { dataStatus, loading } = useMarketSnapshot();
  return { status: dataStatus, loading };
}

// Helper hook for history data (for charts)
export function useMarketHistory(): {
  history: MarketSnapshot[];
  loading: boolean;
} {
  const { history, loading } = useMarketSnapshot();
  return { history, loading };
}

// Helper hook for formatted market data display
export interface FormattedMarketData {
  yieldCurve: string;
  btcPrice: string;
  survivalProbability: string;
  riskLevel: string;
  systemicRisk: string;
  var95: string;
  isLoading: boolean;
}

export function useFormattedMarketData(): FormattedMarketData {
  const { latest, loading } = useMarketSnapshot();

  if (loading || !latest) {
    return {
      yieldCurve: 'Loading...',
      btcPrice: 'Loading...',
      survivalProbability: 'Loading...',
      riskLevel: 'Loading...',
      systemicRisk: 'Loading...',
      var95: 'Loading...',
      isLoading: true,
    };
  }

  return {
    yieldCurve: latest.yield_spread != null ? `${latest.yield_spread.toFixed(2)}%` : 'Loading...',
    btcPrice: latest.btc_price != null ? `$${latest.btc_price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'Loading...',
    survivalProbability: latest.survival_probability != null ? `${Math.round(latest.survival_probability * 100)}%` : 'Loading...',
    riskLevel: latest.regime || 'Loading...',
    systemicRisk: latest.systemic_risk != null ? `${Math.round(latest.systemic_risk * 100)}%` : 'Loading...',
    var95: latest.var_95 != null ? `${(latest.var_95 * 100).toFixed(1)}%` : 'Loading...',
    isLoading: false,
  };
}
