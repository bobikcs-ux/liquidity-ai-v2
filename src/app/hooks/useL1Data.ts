/**
 * useL1Data Hook
 * 
 * React hook for the L1 Data Nervous System
 * - 60-second refresh cycle
 * - Automatic reconnection
 * - "RECONNECTING..." display for null/0 values
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchL1Data, 
  formatL1Value, 
  validateForAGI,
  pingHeartbeat,
  triggerForceRefresh,
  consumeForceRefresh,
  isDataStale,
  isInReconnectMode,
  type L1DataState,
  type L1DataStateExtended 
} from '../services/l1DataNervousSystem';

const REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds per spec
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds
const STALE_CHECK_INTERVAL_MS = 30 * 1000; // Check for stale data every 30s

export interface HeartbeatStatus {
  alive: boolean;
  lastPing: Date | null;
  latencyMs: number | null;
}

export interface UseL1DataReturn {
  data: L1DataStateExtended | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  
  // Formatted display values with RECONNECTING... fallback
  displayValues: {
    yieldCurve: string;
    btcDominance: string;
    btcPrice: string;
    btcChange: string;
    fearGreed: string;
  };
  
  // AGI-validated values (never null/0)
  agiValues: {
    yieldCurve: number;
    btcDominance: number;
    btcPrice: number;
    fearGreedIndex: number;
    valid: boolean;
  } | null;
  
  // Status indicators
  status: L1DataState['status'];
  feedStatus: L1DataState['feedStatus'] | null;
  lastUpdate: Date | null;
  
  // Heartbeat
  heartbeat: HeartbeatStatus;
  
  // Stale data tracking
  isStaleData: boolean;
  staleFeeds: string[];
  inReconnectMode: boolean;
}

export function useL1Data(): UseL1DataReturn {
  const [data, setData] = useState<L1DataStateExtended | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heartbeat, setHeartbeat] = useState<HeartbeatStatus>({
    alive: false,
    lastPing: null,
    latencyMs: null,
  });
  const isMounted = useRef(true);
  const lastFetchTime = useRef<number>(0);

  const refresh = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      setError(null);
      
      // Check if force refresh was triggered
      const wasForced = consumeForceRefresh();
      if (wasForced) {
        console.log('[L1] Force refresh executed');
      }
      
      const l1Data = await fetchL1Data();
      
      if (isMounted.current) {
        setData(l1Data);
        
        // Log any errors from the L1 system
        if (l1Data.errors.length > 0) {
          console.warn('[L1] Data warnings:', l1Data.errors);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        const errorMsg = err instanceof Error ? err.message : 'L1 Data fetch failed';
        setError(errorMsg);
        console.error('[L1] Critical error:', err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    console.log('[L1] Triggering force refresh...');
    triggerForceRefresh();
    setIsLoading(true);
    await refresh();
  }, [refresh]);

  // Heartbeat ping
  const checkHeartbeat = useCallback(async () => {
    if (!isMounted.current) return;
    
    const result = await pingHeartbeat();
    if (isMounted.current) {
      setHeartbeat({
        alive: result.alive,
        lastPing: new Date(),
        latencyMs: result.pingMs,
      });
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    refresh();
    checkHeartbeat(); // Initial heartbeat
    
    return () => {
      isMounted.current = false;
    };
  }, [refresh, checkHeartbeat]);

  // 60-second refresh cycle
  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // 15-second heartbeat cycle
  useEffect(() => {
    const interval = setInterval(checkHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkHeartbeat]);

  // Auto-refresh when data is stale (> 5 minutes old)
  useEffect(() => {
    const checkStaleData = () => {
      if (isDataStale() || isInReconnectMode()) {
        console.log('[L1] Auto-refresh triggered - data is stale or in reconnect mode');
        refresh();
      }
    };
    
    const interval = setInterval(checkStaleData, STALE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Compute display values with Loading.../Syncing... states
  const isStale = data?.isStaleData ?? false;
  const displayValues = {
    yieldCurve: formatL1Value(data?.yieldCurve ?? null, 'percent', 2, isLoading, isStale),
    btcDominance: formatL1Value(data?.btcDominance ?? null, 'percent', 1, isLoading, isStale),
    btcPrice: formatL1Value(data?.btcPrice ?? null, 'currency', 0, isLoading, isStale),
    btcChange: data?.btcChange24h !== null && data?.btcChange24h !== undefined
      ? `${data.btcChange24h >= 0 ? '+' : ''}${data.btcChange24h.toFixed(2)}%`
      : isLoading ? 'Loading...' : 'Syncing...',
    fearGreed: formatL1Value(data?.fearGreedIndex ?? null, 'index', 0, isLoading, isStale),
  };

  // AGI-validated values - guaranteed non-null/non-zero
  const agiValues = data ? validateForAGI(data) : null;

  return {
    data,
    isLoading,
    error,
    refresh,
    forceRefresh,
    displayValues,
    agiValues,
    status: data?.status ?? 'RECONNECTING',
    feedStatus: data?.feedStatus ?? null,
    lastUpdate: data?.lastUpdate ?? null,
    heartbeat,
    isStaleData: data?.isStaleData ?? true,
    staleFeeds: data?.staleFeeds ?? [],
    inReconnectMode: data?.inReconnectMode ?? false,
  };
}

// Hook for just the status (lightweight)
export function useL1Status(): {
  status: L1DataState['status'];
  feedStatus: L1DataState['feedStatus'] | null;
  isReconnecting: boolean;
} {
  const { status, feedStatus } = useL1Data();
  
  return {
    status,
    feedStatus,
    isReconnecting: status === 'RECONNECTING' || status === 'DEGRADED',
  };
}
