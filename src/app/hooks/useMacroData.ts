'use client';

/**
 * useMacroData Hook
 * Exposes live global macro data from macroDataService
 * DGS10, DGS2, WM2NS, ECB Rate, BoJ Rate, OECD, Fear/Greed
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchMacroData, type MacroDataResult, type MacroMetric } from '../services/macroDataService';

const REFRESH_INTERVAL_MS = 60 * 1000; // 60 seconds

export interface UseMacroDataReturn {
  data: MacroDataResult | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  
  // Formatted display values with status indicators
  display: {
    dgs10: string;
    dgs2: string;
    yieldSpread: string;
    wm2ns: string;
    ecbRate: string;
    bojRate: string;
    oecd: string;
    fearGreed: string;
  };
  
  // Raw values for calculations
  values: {
    dgs10: number;
    dgs2: number;
    wm2ns: number;
    ecbRate: number;
    bojRate: number;
    oecd: number;
    fearGreed: number;
  } | null;
  
  // Status
  overallStatus: 'LIVE' | 'DEGRADED' | 'OFFLINE';
  lastSync: Date | null;
  
  // Config error flag — true if VITE_FRED_API_KEY is missing
  configError: boolean;
  
  // Per-metric status
  metricStatus: {
    dgs10: MacroMetric['status'];
    dgs2: MacroMetric['status'];
    wm2ns: MacroMetric['status'];
    ecbRate: MacroMetric['status'];
    bojRate: MacroMetric['status'];
    oecd: MacroMetric['status'];
    fearGreed: MacroMetric['status'];
  } | null;
}

function formatMetric(metric: MacroMetric | null, suffix: string = '', decimals: number = 2): string {
  if (!metric) return 'SYSTEM_SYNC...';
  if (metric.isStale) return `${metric.value.toFixed(decimals)}${suffix} (stale)`;
  if (metric.status === 'FALLBACK') return `${metric.value.toFixed(decimals)}${suffix} (cached)`;
  return `${metric.value.toFixed(decimals)}${suffix}`;
}

export function useMacroData(): UseMacroDataReturn {
  const [data, setData] = useState<MacroDataResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const isMounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      setError(null);
      const result = await fetchMacroData();
      
      if (isMounted.current) {
        setData(result);
        setLastSync(new Date());
      }
    } catch (err) {
      if (isMounted.current) {
        const errorMsg = err instanceof Error ? err.message : 'Macro data fetch failed';
        setError(errorMsg);
        console.error('[useMacroData] Error:', err);
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

  // Compute display values
  const display = {
    dgs10: data ? formatMetric(data.dgs10, '%') : 'Loading...',
    dgs2: data ? formatMetric(data.dgs2, '%') : 'Loading...',
    yieldSpread: data 
      ? `${(data.dgs10.value - data.dgs2.value).toFixed(2)}%` 
      : 'Loading...',
    wm2ns: data ? formatMetric(data.wm2ns, 'B', 0) : 'Loading...',
    ecbRate: data ? formatMetric(data.ecbRate, '%') : 'Loading...',
    bojRate: data ? formatMetric(data.bojRate, '%') : 'Loading...',
    oecd: data ? formatMetric(data.oecd, '', 1) : 'Loading...',
    fearGreed: data ? formatMetric(data.fearGreed, '', 0) : 'Loading...',
  };

  // Raw values
  const values = data ? {
    dgs10: data.dgs10.value,
    dgs2: data.dgs2.value,
    wm2ns: data.wm2ns.value,
    ecbRate: data.ecbRate.value,
    bojRate: data.bojRate.value,
    oecd: data.oecd.value,
    fearGreed: data.fearGreed.value,
  } : null;

  // Per-metric status
  const metricStatus = data ? {
    dgs10: data.dgs10.status,
    dgs2: data.dgs2.status,
    wm2ns: data.wm2ns.status,
    ecbRate: data.ecbRate.status,
    bojRate: data.bojRate.status,
    oecd: data.oecd.status,
    fearGreed: data.fearGreed.status,
  } : null;

  // Check if FRED API key is configured
  const configError = typeof import.meta.env.VITE_FRED_API_KEY !== 'string' || 
                      import.meta.env.VITE_FRED_API_KEY.trim() === '';

  return {
    data,
    isLoading,
    error,
    refresh,
    display,
    values,
    overallStatus: data?.overallStatus ?? 'OFFLINE',
    lastSync,
    configError,
    metricStatus,
  };
}

export default useMacroData;
