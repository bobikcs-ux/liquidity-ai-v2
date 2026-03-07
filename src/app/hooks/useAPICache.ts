'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

interface CacheConfig {
  dedupingInterval?: number;      // 1 min
  revalidateOnFocus?: boolean;    // false
  revalidateOnReconnect?: boolean; // true
  focusThrottleInterval?: number; // 10 min
  errorRetryCount?: number;       // 2
  errorRetryInterval?: number;    // 5s
}

const defaultConfig: CacheConfig = {
  dedupingInterval: 60000,        // 1 min — prevent duplicate requests
  revalidateOnFocus: false,       // don't refresh on window focus
  revalidateOnReconnect: true,    // refresh on reconnect
  focusThrottleInterval: 600000,  // 10 min throttle
  errorRetryCount: 2,
  errorRetryInterval: 5000,
};

/**
 * Fetcher factory for API endpoints with proper error handling
 */
function createFetcher(baseURL: string, apiKey?: string) {
  return async (endpoint: string) => {
    const url = new URL(endpoint, baseURL);
    if (apiKey) {
      url.searchParams.set('apikey', apiKey);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const res = await fetch(url.toString(), { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
        (error as any).status = res.status;
        throw error;
      }

      return res.json();
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  };
}

// Create fetchers for each API
const fredFetcher = createFetcher('https://api.stlouisfed.org/fred');
const fmpFetcher = createFetcher('https://financialmodelingprep.com/api/v3', import.meta.env.VITE_FMP_API_KEY as string);
const coinGeckoFetcher = createFetcher('https://api.coingecko.com/api/v3');

/**
 * Hook: Fetch FRED economic data with SWR caching
 * Example: useFREDData('/series/GDP/observations')
 */
export function useFREDData<T = any>(seriesPath: string, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    enabled ? `fred:${seriesPath}` : null,
    () => fredFetcher(seriesPath),
    defaultConfig
  );

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  };
}

/**
 * Hook: Fetch FMP financial data with SWR caching
 * Example: useFMPData('/quote/CLUSD')
 */
export function useFMPData<T = any>(endpoint: string, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    enabled ? `fmp:${endpoint}` : null,
    () => fmpFetcher(endpoint),
    defaultConfig
  );

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  };
}

/**
 * Hook: Fetch CoinGecko market data with SWR caching
 * Example: useCoinGeckoData('/simple/price?ids=bitcoin&vs_currencies=usd')
 */
export function useCoinGeckoData<T = any>(endpoint: string, enabled = true) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    enabled ? `coingecko:${endpoint}` : null,
    () => coinGeckoFetcher(endpoint),
    {
      ...defaultConfig,
      focusThrottleInterval: 300000, // 5 min throttle for crypto (faster updates)
    }
  );

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  };
}

/**
 * Hook: Multi-endpoint batch fetch with SWR
 * Fetches all endpoints in parallel, caches individually
 */
export function useMultipleAPICalls<T extends Record<string, any>>(
  requests: Record<string, { url: string; source: 'fred' | 'fmp' | 'coingecko' }>
) {
  const results: T = {} as T;
  const isLoading = false;
  let hasError = false;

  for (const [key, { url, source }] of Object.entries(requests)) {
    let result;
    if (source === 'fred') {
      result = useFREDData(url);
    } else if (source === 'fmp') {
      result = useFMPData(url);
    } else {
      result = useCoinGeckoData(url);
    }

    (results as any)[key] = result;
    if (result.isLoading) (isLoading as any) = true;
    if (result.error) hasError = true;
  }

  return {
    results,
    isLoading,
    hasError,
  };
}

/**
 * Helper: Get current timestamp for cache validation
 */
export function getLastRefreshTime() {
  return new Date().toISOString();
}

/**
 * Helper: Check if cache should be refreshed based on TTL
 */
export function shouldRefreshCache(lastRefresh: string | null, ttlMinutes: number = 5): boolean {
  if (!lastRefresh) return true;
  
  const lastRefreshTime = new Date(lastRefresh).getTime();
  const now = Date.now();
  const ttlMs = ttlMinutes * 60 * 1000;
  
  return (now - lastRefreshTime) > ttlMs;
}

export default {
  useFREDData,
  useFMPData,
  useCoinGeckoData,
  useMultipleAPICalls,
  shouldRefreshCache,
};
