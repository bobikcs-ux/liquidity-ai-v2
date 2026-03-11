/**
 * APP CONTEXT — Aurelius Intelligence OS Data Layer
 * 
 * Centralized state management for all market, macro, energy, geopolitical,
 * and on-chain data. All external API calls flow through here.
 * 
 * Responsibilities:
 * - Unified sync logic with rate limiting per API
 * - Graceful fallback chain: LIVE API → Supabase cache → In-memory cache → Seed
 * - Per-source status tracking
 * - Auto-refresh on configurable interval
 * - Exposes single global TerminalState consumed by all pages/components
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { TerminalState, DataSourceStatus } from '../types/terminal';
import { TERMINAL_STATE_DEFAULTS } from '../types/terminal';

// Services
import { fetchCryptoMarket, fetchFearGreed } from '../services/coingeckoService';
import { fetchGoldPrice, fetchOilPrices } from '../services/finnhubService';
import { fetchOnChainMetrics } from '../services/alchemyService';
import { fetchMacroData } from '../services/macroDataService';
import { fetchEnergyData } from '../services/energyFinanceService';
import { fetchGeopoliticsMetrics } from '../services/newsAggregator';
import { fetchLiveFXData, fetchStablecoins } from '../services/energyFinanceService';
import { supabase, checkSupabaseHealth } from '../lib/supabase';

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
  // SUPABASE FALLBACK — Read cached snapshots when external APIs fail
  // ==========================================================================

  const fetchFromSupabase = useCallback(async (): Promise<Partial<TerminalState> | null> => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('market_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;

      const age = Date.now() - new Date(data.created_at).getTime();
      if (age > SUPABASE_FALLBACK_STALE_MS) return null; // Too stale

      // Map Supabase snapshot → TerminalState shape
      return {
        prices: {
          ...TERMINAL_STATE_DEFAULTS.prices,
          btc: {
            value: data.btc_price ?? TERMINAL_STATE_DEFAULTS.prices.btc.value,
            change24h: 0,
            changePct24h: 0,
            source: 'supabase',
          },
          btcDominance: data.btc_dominance ?? TERMINAL_STATE_DEFAULTS.prices.btcDominance,
        },
        sentiment: {
          ...TERMINAL_STATE_DEFAULTS.sentiment,
          systemicRisk: data.systemic_risk != null
            ? (data.systemic_risk > 1 ? data.systemic_risk : Math.round(data.systemic_risk * 100))
            : TERMINAL_STATE_DEFAULTS.sentiment.systemicRisk,
          survivalProbability: data.survival_probability != null
            ? (data.survival_probability > 1 ? data.survival_probability : Math.round(data.survival_probability * 100))
            : TERMINAL_STATE_DEFAULTS.sentiment.survivalProbability,
          regime: data.regime ?? TERMINAL_STATE_DEFAULTS.sentiment.regime,
          var95: data.var_95 ?? TERMINAL_STATE_DEFAULTS.sentiment.var95,
          yieldSpread: data.yield_spread ?? TERMINAL_STATE_DEFAULTS.sentiment.yieldSpread,
          rateShock: data.rate_shock != null
            ? (data.rate_shock > 1 ? data.rate_shock : Math.round(data.rate_shock * 100))
            : TERMINAL_STATE_DEFAULTS.sentiment.rateShock,
          balanceSheetDelta: data.balance_sheet_delta ?? TERMINAL_STATE_DEFAULTS.sentiment.balanceSheetDelta,
          btcVolatility: data.btc_volatility != null
            ? (data.btc_volatility > 1 ? data.btc_volatility : Math.round(data.btc_volatility * 100))
            : TERMINAL_STATE_DEFAULTS.sentiment.btcVolatility,
        },
      };
    } catch (err) {
      console.error('[AppContext] Supabase fallback error:', err);
      return null;
    }
  }, []);

  // ==========================================================================
  // SYNC LOGIC — Fetch all data from external APIs
  // ==========================================================================

  const syncNow = useCallback(async (sources?: string[]) => {
    if (syncInProgressRef.current) {
      console.log('[AppContext] Sync already in progress, skipping duplicate request');
      return;
    }

    syncInProgressRef.current = true;
    setIsSyncing(true);

    console.log('[AppContext] Starting sync...', sources ?? 'all sources');

    try {
      const startMs = Date.now();

      // Parallel fetch all data sources (with individual error handling)
      const results = await Promise.allSettled([
        fetchCryptoMarket(),       // CoinGecko: BTC/ETH prices + dominance
        fetchFearGreed(),          // alternative.me: Fear & Greed Index
        fetchGoldPrice(),          // Finnhub: Gold spot price
        fetchOilPrices(),          // Finnhub: WTI/Brent
        fetchMacroData(),          // FRED: 10Y/2Y yields, M2, ECB, BoJ, OECD
        fetchEnergyData('crude-oil'), // EIA: oil stocks
        fetchEnergyData('natural-gas'), // EIA: natural gas
        fetchOnChainMetrics(),     // Alchemy + mempool.space: gas + hashrate
        fetchGeopoliticsMetrics(), // NewsAPI + ACLED: geopolitical alerts
        fetchLiveFXData(),         // FMP: FX pairs
        fetchStablecoins(),        // DefiLlama: stablecoin liquidity
      ]);

      // Unpack results with fallback to SEED
      const cryptoData = results[0].status === 'fulfilled' ? results[0].value : null;
      const fearGreedData = results[1].status === 'fulfilled' ? results[1].value : null;
      const goldData = results[2].status === 'fulfilled' ? results[2].value : null;
      const oilData = results[3].status === 'fulfilled' ? results[3].value : null;
      const macroData = results[4].status === 'fulfilled' ? results[4].value : null;
      const crudeData = results[5].status === 'fulfilled' ? results[5].value : null;
      const natGasData = results[6].status === 'fulfilled' ? results[6].value : null;
      const onChainData = results[7].status === 'fulfilled' ? results[7].value : null;
      const geopoliticsData = results[8].status === 'fulfilled' ? results[8].value : null;
      const fxData = results[9].status === 'fulfilled' ? results[9].value : null;
      const liquidityData = results[10].status === 'fulfilled' ? results[10].value : null;

      // Fallback to Supabase if all external APIs failed
      let supabaseFallback: Partial<TerminalState> | null = null;
      if (!cryptoData && !macroData) {
        supabaseFallback = await fetchFromSupabase();
      }

      // Assemble new state
      const newState: TerminalState = {
        prices: {
          btc: supabaseFallback?.prices?.btc ?? cryptoData?.prices.btc ?? TERMINAL_STATE_DEFAULTS.prices.btc,
          eth: cryptoData?.prices.eth ?? TERMINAL_STATE_DEFAULTS.prices.eth,
          gold: goldData ?? TERMINAL_STATE_DEFAULTS.prices.gold,
          oil: oilData ?? TERMINAL_STATE_DEFAULTS.prices.oil,
          btcDominance: supabaseFallback?.prices?.btcDominance ?? cryptoData?.prices.btcDominance ?? TERMINAL_STATE_DEFAULTS.prices.btcDominance,
        },
        sentiment: {
          ...TERMINAL_STATE_DEFAULTS.sentiment,
          ...(supabaseFallback?.sentiment ?? {}),
          fearGreedIndex: fearGreedData?.value ?? TERMINAL_STATE_DEFAULTS.sentiment.fearGreedIndex,
          fearGreedLabel: fearGreedData?.label ?? TERMINAL_STATE_DEFAULTS.sentiment.fearGreedLabel,
        },
        macro: {
          yield10Y: macroData?.dgs10.value ?? TERMINAL_STATE_DEFAULTS.macro.yield10Y,
          yield2Y: macroData?.dgs2.value ?? TERMINAL_STATE_DEFAULTS.macro.yield2Y,
          yieldSpread: macroData ? macroData.dgs10.value - macroData.dgs2.value : TERMINAL_STATE_DEFAULTS.macro.yieldSpread,
          m2Supply: macroData?.wm2ns.value ?? TERMINAL_STATE_DEFAULTS.macro.m2Supply,
          ecbRate: macroData?.ecbRate.value ?? TERMINAL_STATE_DEFAULTS.macro.ecbRate,
          bojRate: macroData?.bojRate.value ?? TERMINAL_STATE_DEFAULTS.macro.bojRate,
          oecdLI: macroData?.oecd.value ?? TERMINAL_STATE_DEFAULTS.macro.oecdLI,
          cpiInflation: TERMINAL_STATE_DEFAULTS.macro.cpiInflation,
          fedRate: TERMINAL_STATE_DEFAULTS.macro.fedRate,
        },
        energy: {
          wtiPrice: oilData?.wti.value ?? TERMINAL_STATE_DEFAULTS.energy.wtiPrice,
          brentPrice: oilData?.brent.value ?? TERMINAL_STATE_DEFAULTS.energy.brentPrice,
          naturalGasStorage: natGasData?.latestValue ?? TERMINAL_STATE_DEFAULTS.energy.naturalGasStorage,
          crudeOilStocks: crudeData?.latestValue ?? TERMINAL_STATE_DEFAULTS.energy.crudeOilStocks,
          electricityGeneration: TERMINAL_STATE_DEFAULTS.energy.electricityGeneration,
        },
        geopolitics: geopoliticsData ?? TERMINAL_STATE_DEFAULTS.geopolitics,
        onChain: onChainData ?? TERMINAL_STATE_DEFAULTS.onChain,
        fx: fxData
          ? {
              pairs: fxData.pairs.map((p) => ({
                symbol: p.symbol,
                label: p.label,
                rate: p.rate,
                changePct: p.changePct,
                trend: p.trend,
              })),
              dollarStrengthIndex: fxData.dollarStrengthIndex,
            }
          : TERMINAL_STATE_DEFAULTS.fx,
        liquidity: liquidityData
          ? {
              totalStablecoinMcap: liquidityData.totalStablecoinMcap,
              change24h: liquidityData.change24h,
              change7d: liquidityData.change7d,
              topStablecoins: liquidityData.topStablecoins,
            }
          : TERMINAL_STATE_DEFAULTS.liquidity,
        sources: {
          coingecko: { status: cryptoData ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
          finnhub: { status: goldData || oilData ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
          fred: { status: macroData?.overallStatus === 'LIVE' ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
          eia: { status: crudeData || natGasData ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
          alchemy: { status: onChainData ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
          news: { status: geopoliticsData ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
          acled: { status: (geopoliticsData?.acledEventCount ?? 0) > 0 ? 'LIVE' : 'OFFLINE', lastFetchMs: Date.now() },
          fearGreed: { status: fearGreedData?.source === 'LIVE' ? 'LIVE' : 'FALLBACK', lastFetchMs: Date.now() },
          supabase: { status: 'CHECKING', lastFetchMs: Date.now() }, // Will be updated by health check
        },
        overallStatus: 'LIVE', // Compute based on source statuses
        lastSyncMs: Date.now(),
        isInitialized: true,
        isSyncing: false,
      };

      // Perform real Supabase health check
      const supabaseHealthy = await checkSupabaseHealth();
      newState.sources.supabase = {
        status: supabaseHealthy ? 'LIVE' : 'OFFLINE',
        lastFetchMs: Date.now(),
      };
      console.info('[AppContext] Supabase health check:', supabaseHealthy ? 'ONLINE' : 'OFFLINE');

      // Compute overall status
      const liveCount = Object.values(newState.sources).filter((s) => s.status === 'LIVE').length;
      const totalSources = Object.keys(newState.sources).length;
      newState.overallStatus = liveCount === 0 ? 'OFFLINE' : liveCount < totalSources / 2 ? 'DEGRADED' : 'LIVE';

      setState(newState);
      setIsInitialized(true);

      console.log('[AppContext] Sync complete in', Date.now() - startMs, 'ms | Status:', newState.overallStatus);
    } catch (err) {
      console.error('[AppContext] Sync error:', err);
    } finally {
      syncInProgressRef.current = false;
      setIsSyncing(false);
    }
  }, [fetchFromSupabase]);

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
