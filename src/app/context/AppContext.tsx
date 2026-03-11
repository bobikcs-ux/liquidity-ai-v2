/**
 * APP CONTEXT — Aurelius Intelligence OS Data Layer
 * 
 * Centralized state management for all market, macro, energy, geopolitical,
 * and on-chain data.
 * 
 * ARCHITECTURE (v105):
 * - UI reads ONLY from Supabase tables (no direct API calls)
 * - Edge Function (market-refresh) is the SOLE collector for FRED, FMP, etc.
 * - This eliminates CORS errors and 429 rate limits
 * 
 * Data freshness:
 * - LIVE: data < 15 minutes old
 * - STALE: data 15min - 1hr old (show warning)
 * - OFFLINE: data > 1hr old or missing
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TerminalState, DataSourceStatus, OverallStatus } from '../types/terminal';
import { TERMINAL_STATE_DEFAULTS } from '../types/terminal';

// Supabase-only data service (NO direct API calls)
import { fetchAllFromSupabase, triggerMarketRefresh, type DataFreshness } from '../services/supabaseDataService';
import { supabase, checkSupabaseHealth } from '../lib/supabase';

// Supplementary services (these use Vercel proxies, not direct APIs)
import { fetchFearGreed } from '../services/coingeckoService';
import { fetchOnChainMetrics } from '../services/alchemyService';
import { fetchGeopoliticsMetrics } from '../services/newsAggregator';
import { fetchStablecoins } from '../services/energyFinanceService';

// ============================================================================
// CONTEXT SHAPE
// ============================================================================

interface AppContextValue {
  state: TerminalState;
  isInitialized: boolean;
  isSyncing: boolean;
  syncNow: (sources?: string[]) => Promise<void>;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

const AUTO_SYNC_INTERVAL_MS = 60_000; // Sync all data every 60 seconds
const SUPABASE_FALLBACK_STALE_MS = 15 * 60_000; // 15 minutes stale threshold

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TerminalState>(TERMINAL_STATE_DEFAULTS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgressRef = useRef(false);

  // ==========================================================================
  // SYNC LOGIC — Fetch all data from SUPABASE ONLY (no direct API calls)
  // ==========================================================================

  const syncNow = useCallback(async (sources?: string[]) => {
    if (syncInProgressRef.current) {
      console.log('[AppContext] Sync already in progress, skipping');
      return;
    }

    syncInProgressRef.current = true;
    setIsSyncing(true);

    console.log('[AppContext] Starting Supabase-only sync...');

    try {
      const startMs = Date.now();

      // PRIMARY: Fetch all data from Supabase (populated by Edge Function)
      const supabaseResult = await fetchAllFromSupabase();
      console.log(`[AppContext] Supabase returned ${supabaseResult.metricsFound} metrics, freshness: ${supabaseResult.freshness}`);

      // If data is stale, trigger background refresh (non-blocking)
      if (supabaseResult.freshness === 'STALE' || supabaseResult.freshness === 'OFFLINE') {
        console.log('[AppContext] Data is stale, triggering background refresh...');
        triggerMarketRefresh().catch(err => console.warn('[AppContext] Background refresh failed:', err));
      }

      // SUPPLEMENTARY: Fetch real-time data that changes frequently (via Vercel proxies)
      const [fearGreedResult, onChainResult, geopoliticsResult, liquidityResult] = await Promise.allSettled([
        fetchFearGreed(),
        fetchOnChainMetrics(),
        fetchGeopoliticsMetrics(),
        fetchStablecoins(),
      ]);

      const fearGreedData = fearGreedResult.status === 'fulfilled' ? fearGreedResult.value : null;
      const onChainData = onChainResult.status === 'fulfilled' ? onChainResult.value : null;
      const geopoliticsData = geopoliticsResult.status === 'fulfilled' ? geopoliticsResult.value : null;
      const liquidityData = liquidityResult.status === 'fulfilled' ? liquidityResult.value : null;

      // Map freshness to status
      const freshnessToStatus = (f: DataFreshness): DataSourceStatus => {
        if (f === 'LIVE') return 'LIVE';
        if (f === 'STALE') return 'STALE';
        return 'OFFLINE';
      };

      // Assemble new state from Supabase data + supplementary
      const sbData = supabaseResult.data;
      const newState: TerminalState = {
        prices: sbData.prices ?? TERMINAL_STATE_DEFAULTS.prices,
        sentiment: {
          ...(sbData.sentiment ?? TERMINAL_STATE_DEFAULTS.sentiment),
          fearGreedIndex: fearGreedData?.value ?? sbData.sentiment?.fearGreedIndex ?? TERMINAL_STATE_DEFAULTS.sentiment.fearGreedIndex,
          fearGreedLabel: fearGreedData?.label ?? sbData.sentiment?.fearGreedLabel ?? TERMINAL_STATE_DEFAULTS.sentiment.fearGreedLabel,
        },
        macro: sbData.macro ?? TERMINAL_STATE_DEFAULTS.macro,
        energy: sbData.energy ?? TERMINAL_STATE_DEFAULTS.energy,
        geopolitics: geopoliticsData ?? TERMINAL_STATE_DEFAULTS.geopolitics,
        onChain: onChainData ?? TERMINAL_STATE_DEFAULTS.onChain,
        fx: sbData.fx ?? TERMINAL_STATE_DEFAULTS.fx,
        liquidity: liquidityData ?? TERMINAL_STATE_DEFAULTS.liquidity,
        sources: {
          supabase: { status: freshnessToStatus(supabaseResult.freshness), lastFetchMs: Date.now() },
          fred: { status: sbData.macro ? freshnessToStatus(supabaseResult.freshness) : 'OFFLINE', lastFetchMs: Date.now() },
          coingecko: { status: sbData.prices?.btc ? freshnessToStatus(supabaseResult.freshness) : 'OFFLINE', lastFetchMs: Date.now() },
          finnhub: { status: sbData.prices?.oil ? freshnessToStatus(supabaseResult.freshness) : 'OFFLINE', lastFetchMs: Date.now() },
          eia: { status: sbData.energy ? freshnessToStatus(supabaseResult.freshness) : 'FALLBACK', lastFetchMs: Date.now() },
          alchemy: { status: onChainData ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
          news: { status: geopoliticsData ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
          acled: { status: (geopoliticsData?.acledEventCount ?? 0) > 0 ? 'LIVE' : 'CACHED', lastFetchMs: Date.now() },
          fearGreed: { status: fearGreedData?.source === 'LIVE' ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
        },
        overallStatus: 'LIVE',
        lastSyncMs: Date.now(),
        isInitialized: true,
        isSyncing: false,
      };

      // Perform real Supabase connectivity check
      const supabaseHealthy = await checkSupabaseHealth();
      if (!supabaseHealthy) {
        newState.sources.supabase.status = 'OFFLINE';
      }

      // Compute overall status
      const statuses = Object.values(newState.sources).map(s => s.status);
      const liveCount = statuses.filter(s => s === 'LIVE').length;
      const staleCount = statuses.filter(s => s === 'STALE').length;
      const offlineCount = statuses.filter(s => s === 'OFFLINE').length;
      const totalSources = statuses.length;

      // Determine overall status
      let overallStatus: OverallStatus = 'LIVE';
      if (offlineCount === totalSources) {
        overallStatus = 'OFFLINE';
      } else if (staleCount > 0 || supabaseResult.freshness === 'STALE') {
        overallStatus = 'STALE';
      } else if (liveCount < totalSources / 2) {
        overallStatus = 'DEGRADED';
      }
      newState.overallStatus = overallStatus;

      setState(newState);
      setIsInitialized(true);

      const elapsed = Date.now() - startMs;
      console.log(`[AppContext] Sync complete in ${elapsed}ms | Status: ${newState.overallStatus} | Freshness: ${supabaseResult.freshness}`);

    } catch (err) {
      console.error('[AppContext] Sync error:', err);
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  // Initial sync on mount
  useEffect(() => {
    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[AppContext] Auto-refresh triggered');
      syncNow();
    }, AUTO_SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [syncNow]);

  // Reset function (for manual refresh/debug)
  const reset = useCallback(() => {
    setState(TERMINAL_STATE_DEFAULTS);
    setIsInitialized(false);
    syncNow();
  }, [syncNow]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const value: AppContextValue = {
    state,
    isInitialized,
    isSyncing,
    syncNow,
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return ctx;
}
