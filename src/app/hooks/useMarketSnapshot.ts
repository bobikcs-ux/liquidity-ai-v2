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
      // Use mock data when Supabase is not configured
      setLatest(mockLatest);
      setHistory(generateMockHistory());
      setDataStatus(mockDataStatus);
      setLoading(false);
      return;
    }

    try {
      setError(null);

      // Fetch latest snapshot
      const { data: latestData, error: latestError } = await supabase
        .from('vw_market_latest')
        .select('*')
        .single();

      if (latestError && latestError.code !== 'PGRST116') {
        throw latestError;
      }

      // Fetch history
      const { data: historyData, error: historyError } = await supabase
        .from('vw_market_history')
        .select('*');

      if (historyError) {
        throw historyError;
      }

      // Fetch data status
      const { data: statusData, error: statusError } = await supabase
        .from('vw_data_status')
        .select('*')
        .single();

      if (statusError && statusError.code !== 'PGRST116') {
        throw statusError;
      }

      setLatest(latestData || mockLatest);
      setHistory(historyData?.length ? historyData : generateMockHistory());
      setDataStatus(statusData || mockDataStatus);
    } catch (err) {
      console.error('Error fetching market snapshot:', err);
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

// Helper hook for history data (for charts)
export function useMarketHistory(): {
  history: MarketSnapshot[];
  loading: boolean;
} {
  const { history, loading } = useMarketSnapshot();
  return { history, loading };
}
