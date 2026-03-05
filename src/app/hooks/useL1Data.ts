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
  type L1DataState 
} from '../services/l1DataNervousSystem';

const REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds per spec

export interface UseL1DataReturn {
  data: L1DataState | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  
  // Formatted display values with RECONNECTING... fallback
  displayValues: {
    yieldCurve: string;
    btcDominance: string;
    btcPrice: string;
    btcChange: string;
    fearGreed: string;
  };
  
  // Status indicators
  status: L1DataState['status'];
  feedStatus: L1DataState['feedStatus'] | null;
  lastUpdate: Date | null;
}

export function useL1Data(): UseL1DataReturn {
  const [data, setData] = useState<L1DataState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      setError(null);
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

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    refresh();
    
    return () => {
      isMounted.current = false;
    };
  }, [refresh]);

  // 60-second refresh cycle
  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  // Compute display values with RECONNECTING... fallback
  const displayValues = {
    yieldCurve: data ? formatL1Value(data.yieldCurve, 'percent', 2) : 'RECONNECTING...',
    btcDominance: data ? formatL1Value(data.btcDominance, 'percent', 1) : 'RECONNECTING...',
    btcPrice: data ? formatL1Value(data.btcPrice, 'currency') : 'RECONNECTING...',
    btcChange: data?.btcChange24h !== null && data?.btcChange24h !== undefined
      ? `${data.btcChange24h >= 0 ? '+' : ''}${data.btcChange24h.toFixed(2)}%`
      : 'RECONNECTING...',
    fearGreed: data ? formatL1Value(data.fearGreedIndex, 'index') : 'RECONNECTING...',
  };

  return {
    data,
    isLoading,
    error,
    refresh,
    displayValues,
    status: data?.status ?? 'RECONNECTING',
    feedStatus: data?.feedStatus ?? null,
    lastUpdate: data?.lastUpdate ?? null,
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
