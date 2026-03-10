import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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
  isLoading: boolean; // alias for loading
  error: string | null;
  refresh: () => Promise<void>;
}

// =============================================================================
// NO MOCK DATA - Production system uses REAL Supabase data only
// If no data exists, show "Waiting for first market snapshot..."
// =============================================================================

// Fear & Greed Index - fetched from Supabase macro_metrics table
// Default to null until data is available
export let GLOBAL_FEAR_GREED_VALUE: number | null = null;
export let GLOBAL_FEAR_GREED_LABEL = 'Loading...';

function getFearGreedLabel(value: number | null): string {
  if (value === null) return 'Loading...';
  if (value < 10) return 'Extreme Fear';
  if (value < 25) return 'Very Fear';
  if (value < 45) return 'Fear';
  if (value < 55) return 'Neutral';
  if (value < 75) return 'Greed';
  if (value < 90) return 'Very Greed';
  return 'Extreme Greed';
}

export function useMarketSnapshot(): UseMarketSnapshotReturn {
  const [latest, setLatest] = useState<MarketSnapshot | null>(null);
  const [history, setHistory] = useState<MarketSnapshot[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase) {
      console.log('[v0] Supabase not configured - waiting for connection');
      setError('Supabase not configured. Waiting for first market snapshot...');
      setLatest(null);
      setHistory([]);
      setDataStatus({ status: 'RED', last_update: null, snapshots_24h: 0 });
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch latest snapshot from market_snapshots table
      // Query: SELECT created_at, btc_price, systemic_risk, yield_spread FROM market_snapshots ORDER BY created_at ASC LIMIT 200
      const { data: latestData, error: latestError } = await supabase
        .from('market_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        if (latestError.code === 'PGRST116') {
          // No rows returned - waiting for first snapshot
          setError('Waiting for first market snapshot...');
          setLatest(null);
          setHistory([]);
          setDataStatus({ status: 'RED', last_update: null, snapshots_24h: 0 });
          setLoading(false);
          return;
        }
        throw latestError;
      }

      // Fetch history (last 200 records for charts)
      const { data: historyData, error: historyError } = await supabase
        .from('market_snapshots')
        .select('created_at, btc_price, systemic_risk, yield_spread')
        .order('created_at', { ascending: true })
        .limit(200);

      if (historyError) {
        throw historyError;
      }

      // Calculate data status based on freshness
      // GREEN = < 15 minutes, AMBER = 15-60 minutes, RED = > 60 minutes
      let calculatedStatus: DataStatus = { status: 'RED', last_update: null, snapshots_24h: 0 };
      if (latestData?.created_at) {
        const lastUpdate = new Date(latestData.created_at);
        const now = new Date();
        const minutesAgo = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
        
        let status: 'GREEN' | 'YELLOW' | 'RED' = 'RED';
        if (minutesAgo < 15) {
          status = 'GREEN';
        } else if (minutesAgo < 60) {
          status = 'YELLOW';
        }
        
        calculatedStatus = {
          status,
          last_update: latestData.created_at,
          snapshots_24h: historyData?.length || 0,
        };
      }

      // Fetch Fear & Greed Index from macro_metrics
      const { data: fearGreedData, error: fearGreedError } = await supabase
        .from('macro_metrics')
        .select('value')
        .eq('symbol', 'FEAR_GREED')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      if (!fearGreedError && fearGreedData?.value) {
        GLOBAL_FEAR_GREED_VALUE = fearGreedData.value;
        GLOBAL_FEAR_GREED_LABEL = getFearGreedLabel(fearGreedData.value);
      }

      setLatest(latestData || null);
      setHistory(historyData || []);
      setDataStatus(calculatedStatus);
    } catch (err) {
      console.error('[v0] Error fetching market snapshot:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      // Do NOT fall back to mock data - show error state
      setLatest(null);
      setHistory([]);
      setDataStatus({ status: 'RED', last_update: null, snapshots_24h: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('market_snapshots_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_snapshots',
        },
        (payload) => {
          const newSnapshot = payload.new as MarketSnapshot;
          setLatest(newSnapshot);
          setHistory((prev) => [newSnapshot, ...prev.slice(0, 99)]);
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Auto-refresh every 60 seconds (production requirement)
  useEffect(() => {
    const interval = setInterval(fetchData, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    latest,
    history,
    dataStatus,
    loading,
    isLoading: loading,
    error,
    refresh: fetchData,
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
