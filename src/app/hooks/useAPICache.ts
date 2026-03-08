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
 * Utility: Batch fetch multiple endpoints (non-hook, use in effects/callbacks)
 * Fetches all endpoints in parallel, returns results map
 */
export async function fetchMultipleAPIs(
  requests: Record<string, { url: string; source: 'fred' | 'fmp' | 'coingecko' }>
): Promise<Record<string, { data: unknown; error: Error | null }>> {
  const entries = Object.entries(requests);
  const promises = entries.map(async ([key, { url, source }]) => {
    try {
      let fetcher;
      if (source === 'fred') fetcher = fredFetcher;
      else if (source === 'fmp') fetcher = fmpFetcher;
      else fetcher = coinGeckoFetcher;

      const data = await fetcher(url);
      return [key, { data, error: null }] as const;
    } catch (err) {
      return [key, { data: null, error: err as Error }] as const;
    }
  });

  const results = await Promise.all(promises);
  return Object.fromEntries(results);
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
  fetchMultipleAPIs,
  shouldRefreshCache,
};
