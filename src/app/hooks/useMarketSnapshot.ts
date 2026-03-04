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

// Mock data for when Supabase is not connected
const mockLatest: MarketSnapshot = {
  id: 'mock-1',
  created_at: new Date().toISOString(),
  yield_spread: -0.42,
  rate_shock: 0.15,
  balance_sheet_delta: -2.3,
  btc_price: 67500,
  btc_volatility: 0.65,
  systemic_risk: 0.35,
  survival_probability: 0.78,
  var_95: 0.12,
  regime: 'stress',
  data_sources_ok: true,
};

const generateMockHistory = (): MarketSnapshot[] => {
  const history: MarketSnapshot[] = [];
  const now = Date.now();
  
  for (let i = 0; i < 100; i++) {
    const timestamp = now - i * 5 * 60 * 1000; // 5 min intervals
    const noise = Math.random() * 0.1 - 0.05;
    
    history.push({
      id: `mock-${i}`,
      created_at: new Date(timestamp).toISOString(),
      yield_spread: -0.42 + noise * 2,
      rate_shock: 0.15 + noise,
      balance_sheet_delta: -2.3 + noise * 5,
      btc_price: 67500 + (Math.random() - 0.5) * 2000,
      btc_volatility: 0.65 + noise,
      systemic_risk: Math.max(0, Math.min(1, 0.35 + noise)),
      survival_probability: Math.max(0, Math.min(1, 0.78 + noise)),
      var_95: 0.12 + noise * 0.5,
      regime: Math.random() > 0.7 ? 'stress' : 'normal',
      data_sources_ok: true,
    });
  }
  
  return history;
};

const mockDataStatus: DataStatus = {
  status: 'YELLOW',
  last_update: new Date().toISOString(),
  snapshots_24h: 288,
};

export function useMarketSnapshot(): UseMarketSnapshotReturn {
  const [latest, setLatest] = useState<MarketSnapshot | null>(null);
  const [history, setHistory] = useState<MarketSnapshot[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!supabase) {
      console.log('[v0] Supabase not configured, using mock data');
      // Use mock data when Supabase is not configured
      setLatest(mockLatest);
      setHistory(generateMockHistory());
      setDataStatus(mockDataStatus);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('[v0] Fetching market data from Supabase...');

      // Fetch latest snapshot from market_snapshots table directly
      const { data: latestData, error: latestError } = await supabase
        .from('market_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error('[v0] Supabase latestData error:', latestError.message, latestError.code, latestError.details);
        if (latestError.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw latestError;
        }
      } else {
        console.log('[v0] Latest snapshot fetched:', {
          id: latestData?.id,
          btc_price: latestData?.btc_price,
          yield_spread: latestData?.yield_spread,
          survival_probability: latestData?.survival_probability,
          regime: latestData?.regime,
        });
      }

      // Fetch history (last 100 records)
      const { data: historyData, error: historyError } = await supabase
        .from('market_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (historyError) {
        console.error('[v0] Supabase historyData error:', historyError.message, historyError.code);
        throw historyError;
      }
      console.log('[v0] History fetched, count:', historyData?.length || 0);

      // Calculate data status based on latest record
      let calculatedStatus: DataStatus = mockDataStatus;
      if (latestData?.created_at) {
        const lastUpdate = new Date(latestData.created_at);
        const now = new Date();
        const minutesAgo = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
        
        calculatedStatus = {
          status: minutesAgo < 10 && latestData.data_sources_ok ? 'GREEN' : minutesAgo < 30 ? 'YELLOW' : 'RED',
          last_update: latestData.created_at,
          snapshots_24h: historyData?.length || 0,
        };
      }

      setLatest(latestData || null);
      setHistory(historyData || []);
      setDataStatus(calculatedStatus);
    } catch (err) {
      console.error('[v0] Error fetching market snapshot:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      // Fall back to mock data on error
      setLatest(mockLatest);
      setHistory(generateMockHistory());
      setDataStatus(mockDataStatus);
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
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000);
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
