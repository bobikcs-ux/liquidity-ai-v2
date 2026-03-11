/**
 * SUPABASE DATA SERVICE — Build v104
 *
 * The ONLY data fetcher for AppContext.
 * Reads all market data from Supabase tables (populated by Edge Function).
 * NEVER calls external APIs directly - no CORS, no 429 rate limits.
 *
 * Data freshness:
 * - LIVE: data updated within last 15 minutes
 * - STALE: data updated within last 1 hour
 * - OFFLINE: data older than 1 hour or missing
 */

import { supabase } from '../lib/supabase';
import { TERMINAL_STATE_DEFAULTS } from '../types/terminal';
import type { TerminalState } from '../types/terminal';

const FRESH_THRESHOLD_MS = 15 * 60 * 1000;  // 15 minutes = LIVE
const STALE_THRESHOLD_MS = 60 * 60 * 1000;  // 1 hour = STALE
const OFFLINE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour = OFFLINE

export type DataFreshness = 'LIVE' | 'STALE' | 'OFFLINE';

export interface SupabaseDataResult {
  data: Partial<TerminalState>;
  freshness: DataFreshness;
  oldestDataAge: number; // ms
  metricsFound: number;
  errors: string[];
}

interface MarketDataRow {
  metric_name: string;
  value: number;
  source: string;
  updated_at: string;
}

// Metric name mappings
const METRIC_KEYS = {
  // FRED
  DGS10: 'yield10Y',
  DGS2: 'yield2Y',
  WM2NS: 'm2Supply',
  FEDFUNDS: 'fedRate',
  ECBDFR: 'ecbRate',
  IRSTCI01JPM156N: 'bojRate',
  
  // Crypto
  BTC_USD: 'btcPrice',
  ETH_USD: 'ethPrice',
  BTC_DOMINANCE: 'btcDominance',
  
  // Oil
  WTI_CRUDE: 'wtiPrice',
  BRENT_CRUDE: 'brentPrice',
  
  // FX
  EURUSD: 'eurUsd',
  GBPUSD: 'gbpUsd',
  USDJPY: 'usdJpy',
  USDCHF: 'usdChf',
  AUDUSD: 'audUsd',
};

/**
 * Fetch all market data from Supabase tables.
 * This is the ONLY function AppContext should use for data.
 */
export async function fetchAllFromSupabase(): Promise<SupabaseDataResult> {
  const errors: string[] = [];
  const metrics: Record<string, { value: number; updatedAt: Date; source: string }> = {};
  
  if (!supabase) {
    return {
      data: {},
      freshness: 'OFFLINE',
      oldestDataAge: Infinity,
      metricsFound: 0,
      errors: ['Supabase client not initialized'],
    };
  }

  try {
    // Fetch from market_data_live table
    const { data: liveData, error: liveError } = await supabase
      .from('market_data_live')
      .select('metric_name, value, source, updated_at');

    if (liveError) {
      errors.push(`market_data_live: ${liveError.message}`);
    } else if (liveData) {
      for (const row of liveData as MarketDataRow[]) {
        metrics[row.metric_name] = {
          value: row.value,
          updatedAt: new Date(row.updated_at),
          source: row.source,
        };
      }
    }

    // Also fetch from market_snapshots for computed values
    const { data: snapshotData, error: snapshotError } = await supabase
      .from('market_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (snapshotError && snapshotError.code !== 'PGRST116') {
      errors.push(`market_snapshots: ${snapshotError.message}`);
    }

    // Calculate data freshness
    const now = Date.now();
    let oldestAge = 0;
    
    for (const metric of Object.values(metrics)) {
      const age = now - metric.updatedAt.getTime();
      if (age > oldestAge) oldestAge = age;
    }

    let freshness: DataFreshness = 'LIVE';
    if (oldestAge > OFFLINE_THRESHOLD_MS) {
      freshness = 'OFFLINE';
    } else if (oldestAge > FRESH_THRESHOLD_MS) {
      freshness = 'STALE';
    }

    // Build partial TerminalState
    const data: Partial<TerminalState> = {};

    // Prices
    const btcPrice = metrics['BTC_USD']?.value;
    const ethPrice = metrics['ETH_USD']?.value;
    const btcDominance = metrics['BTC_DOMINANCE']?.value;
    const wtiPrice = metrics['WTI_CRUDE']?.value;
    const brentPrice = metrics['BRENT_CRUDE']?.value;

    if (btcPrice || ethPrice || wtiPrice) {
      data.prices = {
        btc: {
          value: btcPrice ?? TERMINAL_STATE_DEFAULTS.prices.btc.value,
          change24h: 0,
          changePct24h: 0,
          source: metrics['BTC_USD']?.source || 'supabase',
        },
        eth: {
          value: ethPrice ?? TERMINAL_STATE_DEFAULTS.prices.eth.value,
          change24h: 0,
          changePct24h: 0,
          source: metrics['ETH_USD']?.source || 'supabase',
        },
        gold: TERMINAL_STATE_DEFAULTS.prices.gold,
        oil: {
          wti: {
            value: wtiPrice ?? TERMINAL_STATE_DEFAULTS.prices.oil.wti.value,
            change24h: 0,
            changePct24h: 0,
            source: metrics['WTI_CRUDE']?.source || 'supabase',
          },
          brent: {
            value: brentPrice ?? TERMINAL_STATE_DEFAULTS.prices.oil.brent.value,
            change24h: 0,
            changePct24h: 0,
            source: metrics['BRENT_CRUDE']?.source || 'supabase',
          },
        },
        btcDominance: btcDominance ?? TERMINAL_STATE_DEFAULTS.prices.btcDominance,
      };
    }

    // Macro
    const yield10Y = metrics['DGS10']?.value;
    const yield2Y = metrics['DGS2']?.value;
    const m2Supply = metrics['WM2NS']?.value;
    const fedRate = metrics['FEDFUNDS']?.value;
    const ecbRate = metrics['ECBDFR']?.value;
    const bojRate = metrics['IRSTCI01JPM156N']?.value;

    if (yield10Y || yield2Y || m2Supply) {
      data.macro = {
        yield10Y: yield10Y ?? TERMINAL_STATE_DEFAULTS.macro.yield10Y,
        yield2Y: yield2Y ?? TERMINAL_STATE_DEFAULTS.macro.yield2Y,
        yieldSpread: (yield10Y ?? 4.25) - (yield2Y ?? 4.15),
        m2Supply: m2Supply ?? TERMINAL_STATE_DEFAULTS.macro.m2Supply,
        ecbRate: ecbRate ?? TERMINAL_STATE_DEFAULTS.macro.ecbRate,
        bojRate: bojRate ?? TERMINAL_STATE_DEFAULTS.macro.bojRate,
        oecdLI: TERMINAL_STATE_DEFAULTS.macro.oecdLI,
        cpiInflation: TERMINAL_STATE_DEFAULTS.macro.cpiInflation,
        fedRate: fedRate ?? TERMINAL_STATE_DEFAULTS.macro.fedRate,
      };
    }

    // FX pairs
    const eurUsd = metrics['EURUSD']?.value;
    const gbpUsd = metrics['GBPUSD']?.value;
    const usdJpy = metrics['USDJPY']?.value;
    const usdChf = metrics['USDCHF']?.value;
    const audUsd = metrics['AUDUSD']?.value;

    if (eurUsd || gbpUsd) {
      data.fx = {
        pairs: [
          { symbol: 'EURUSD', label: 'EUR/USD', rate: eurUsd ?? 1.08, changePct: 0, trend: 'flat' as const },
          { symbol: 'GBPUSD', label: 'GBP/USD', rate: gbpUsd ?? 1.26, changePct: 0, trend: 'flat' as const },
          { symbol: 'USDJPY', label: 'USD/JPY', rate: usdJpy ?? 150.5, changePct: 0, trend: 'flat' as const },
          { symbol: 'USDCHF', label: 'USD/CHF', rate: usdChf ?? 0.88, changePct: 0, trend: 'flat' as const },
          { symbol: 'AUDUSD', label: 'AUD/USD', rate: audUsd ?? 0.65, changePct: 0, trend: 'flat' as const },
        ],
        dollarStrengthIndex: 50 + (usdJpy ? (usdJpy - 150) * 0.2 : 0),
      };
    }

    // Energy
    if (wtiPrice || brentPrice) {
      data.energy = {
        wtiPrice: wtiPrice ?? TERMINAL_STATE_DEFAULTS.energy.wtiPrice,
        brentPrice: brentPrice ?? TERMINAL_STATE_DEFAULTS.energy.brentPrice,
        naturalGasStorage: TERMINAL_STATE_DEFAULTS.energy.naturalGasStorage,
        crudeOilStocks: TERMINAL_STATE_DEFAULTS.energy.crudeOilStocks,
        electricityGeneration: TERMINAL_STATE_DEFAULTS.energy.electricityGeneration,
      };
    }

    // Sentiment from snapshot
    if (snapshotData) {
      data.sentiment = {
        fearGreedIndex: snapshotData.fear_greed_index ?? TERMINAL_STATE_DEFAULTS.sentiment.fearGreedIndex,
        fearGreedLabel: snapshotData.fear_greed_label ?? TERMINAL_STATE_DEFAULTS.sentiment.fearGreedLabel,
        systemicRisk: snapshotData.systemic_risk != null
          ? (snapshotData.systemic_risk > 1 ? snapshotData.systemic_risk : Math.round(snapshotData.systemic_risk * 100))
          : TERMINAL_STATE_DEFAULTS.sentiment.systemicRisk,
        survivalProbability: snapshotData.survival_probability != null
          ? (snapshotData.survival_probability > 1 ? snapshotData.survival_probability : Math.round(snapshotData.survival_probability * 100))
          : TERMINAL_STATE_DEFAULTS.sentiment.survivalProbability,
        regime: snapshotData.regime ?? TERMINAL_STATE_DEFAULTS.sentiment.regime,
        var95: snapshotData.var_95 ?? TERMINAL_STATE_DEFAULTS.sentiment.var95,
        yieldSpread: snapshotData.yield_spread ?? TERMINAL_STATE_DEFAULTS.sentiment.yieldSpread,
        rateShock: snapshotData.rate_shock != null
          ? (snapshotData.rate_shock > 1 ? snapshotData.rate_shock : Math.round(snapshotData.rate_shock * 100))
          : TERMINAL_STATE_DEFAULTS.sentiment.rateShock,
        balanceSheetDelta: snapshotData.balance_sheet_delta ?? TERMINAL_STATE_DEFAULTS.sentiment.balanceSheetDelta,
        btcVolatility: snapshotData.btc_volatility != null
          ? (snapshotData.btc_volatility > 1 ? snapshotData.btc_volatility : Math.round(snapshotData.btc_volatility * 100))
          : TERMINAL_STATE_DEFAULTS.sentiment.btcVolatility,
      };
    }

    return {
      data,
      freshness,
      oldestDataAge: oldestAge,
      metricsFound: Object.keys(metrics).length,
      errors,
    };

  } catch (err) {
    return {
      data: {},
      freshness: 'OFFLINE',
      oldestDataAge: Infinity,
      metricsFound: 0,
      errors: [err instanceof Error ? err.message : 'Unknown error'],
    };
  }
}

/**
 * Trigger the Edge Function to refresh data.
 * Call this when data is stale or user requests manual refresh.
 */
export async function triggerMarketRefresh(): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.functions.invoke('market-refresh');
    if (error) {
      console.error('[triggerMarketRefresh] Edge function error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[triggerMarketRefresh] Error:', err);
    return false;
  }
}
