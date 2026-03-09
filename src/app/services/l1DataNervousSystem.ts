/**
 * L1 DATA NERVOUS SYSTEM
 * 
 * Core infrastructure for real-time market data with:
 * - Retry logic for all external APIs
 * - Supabase fallback for cached values
 * - "RECONNECTING..." status for null/0 values
 * - 60-second refresh cycle
 */

import { supabase } from '../lib/supabase';
import { fetchMacroData, syncFearGreedToMacroCache } from './macroDataService';

// ============================================================================
// TYPES
// ============================================================================

export interface L1DataState {
  // Core metrics
  btcDominance: number | null;
  yieldCurve: number | null;
  btcPrice: number | null;
  btcChange24h: number | null;
  fearGreedIndex: number | null;
  
  // Systemic risk metrics (from macro worker)
  systemicRisk: number | null;
  survivalProbability: number | null;
  regime: 'normal' | 'stress' | 'crisis' | null;
  
  // Connection status
  status: 'LIVE' | 'RECONNECTING' | 'DEGRADED' | 'OFFLINE';
  lastUpdate: Date | null;
  
  // Individual feed status
  feedStatus: {
    fred: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
    coingecko: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
    fearGreed: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
    supabase: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
    macroWorker: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
  };
  
  // Error tracking
  errors: string[];
}

export interface L1CachedValue {
  value: number;
  timestamp: Date;
  source: 'api' | 'supabase' | 'fallback';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_YIELD_CURVE = -0.23; // Default fallback per spec
const DEFAULT_BTC_DOMINANCE = 54.3; // Default fallback for BTC dominance
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds

// Heartbeat state
let heartbeatActive = false;
let lastHeartbeat: Date | null = null;
let heartbeatPingMs: number | null = null;

// Consecutive failure tracking for SYSTEM_RECONNECT_SEQUENCE
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
let systemReconnectMode = false;
let lastSuccessfulFetch: Date | null = null;

// Stale data tracking
const STALE_DATA_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function isDataStale(): boolean {
  if (!lastSuccessfulFetch) return true;
  return (Date.now() - lastSuccessfulFetch.getTime()) > STALE_DATA_THRESHOLD_MS;
}

export function getLastSuccessfulFetch(): Date | null {
  return lastSuccessfulFetch;
}

export function isInReconnectMode(): boolean {
  return systemReconnectMode;
}

export function getConsecutiveFailures(): number {
  return consecutiveFailures;
}

// In-memory cache for last known good values
const valueCache: {
  btcDominance: L1CachedValue | null;
  yieldCurve: L1CachedValue | null;
  btcPrice: L1CachedValue | null;
  fearGreed: L1CachedValue | null;
} = {
  btcDominance: null,
  yieldCurve: null,
  btcPrice: null,
  fearGreed: null,
};

// ============================================================================
// HEARTBEAT SYSTEM
// ============================================================================

export async function pingHeartbeat(): Promise<{ alive: boolean; pingMs: number }> {
  const startTime = performance.now();
  try {
    // Quick ping to CoinGecko status endpoint
    const response = await fetch('https://api.coingecko.com/api/v3/ping', {
      signal: AbortSignal.timeout(5000),
    });
    const endTime = performance.now();
    const pingMs = Math.round(endTime - startTime);
    
    if (response.ok) {
      heartbeatActive = true;
      lastHeartbeat = new Date();
      heartbeatPingMs = pingMs;
      return { alive: true, pingMs };
    }
    
    heartbeatActive = false;
    return { alive: false, pingMs };
  } catch {
    heartbeatActive = false;
    return { alive: false, pingMs: 0 };
  }
}

export function getHeartbeatStatus(): { 
  active: boolean; 
  lastPing: Date | null; 
  latencyMs: number | null;
} {
  return {
    active: heartbeatActive,
    lastPing: lastHeartbeat,
    latencyMs: heartbeatPingMs,
  };
}

// ============================================================================
// FORCE REFRESH
// ============================================================================

let forceRefreshFlag = false;

export function triggerForceRefresh(): void {
  forceRefreshFlag = true;
  // Clear all caches to force fresh fetch
  valueCache.btcDominance = null;
  valueCache.yieldCurve = null;
  valueCache.btcPrice = null;
  valueCache.fearGreed = null;
  console.log('[L1] Force refresh triggered - all caches cleared');
}

export function consumeForceRefresh(): boolean {
  const flag = forceRefreshFlag;
  forceRefreshFlag = false;
  return flag;
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

// API call logging for diagnostics
function logApiCall(endpoint: string, success: boolean, responseCode?: number, error?: string) {
  const timestamp = new Date().toISOString();
  const status = success ? '200 OK' : `FAILED${responseCode ? ` (${responseCode})` : ''}`;
  console.log(`[L1] ${timestamp} | ${endpoint} | ${status}${error ? ` | ${error}` : ''}`);
  
  if (!success) {
    consecutiveFailures++;
    console.warn(`[L1] Consecutive failures: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}`);
    
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && !systemReconnectMode) {
      console.error('[L1] SYSTEM_RECONNECT_SEQUENCE TRIGGERED - 3 consecutive failures detected');
      systemReconnectMode = true;
      triggerForceRefresh();
    }
  } else {
    if (consecutiveFailures > 0) {
      console.log(`[L1] Connection restored after ${consecutiveFailures} failures`);
    }
    consecutiveFailures = 0;
    systemReconnectMode = false;
  }
}

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  endpointName: string,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS
): Promise<T | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fetchFn();
      logApiCall(endpointName, true, 200);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[L1] ${endpointName} attempt ${attempt}/${retries} failed:`, errorMsg);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      } else {
        logApiCall(endpointName, false, undefined, errorMsg);
      }
    }
  }
  return null;
}

// ============================================================================
// FRED YIELD CURVE FETCH
// ============================================================================

async function fetchYieldCurveFromFRED(): Promise<{ value: number | null; isStale: boolean }> {
  const FRED_KEY = import.meta.env.VITE_FRED_API_KEY || 
    (typeof process !== 'undefined' && process.env.VITE_FRED_API_KEY);
  
  if (!FRED_KEY) {
    console.warn('[L1] FRED API key not configured - using fallback');
    logApiCall('FRED_T10Y2Y', false, undefined, 'API key not configured');
    return { value: null, isStale: true };
  }

  const result = await fetchWithRetry(async () => {
    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=T10Y2Y&api_key=${FRED_KEY}&file_type=json&limit=1&sort_order=desc`,
      { signal: AbortSignal.timeout(10000) }
    );
    
    if (!response.ok) {
      throw new Error(`FRED API returned ${response.status}`);
    }
    
    const data = await response.json();
    const value = data.observations?.[0]?.value;
    
    if (value && value !== '.' && value !== 'N/A') {
      return parseFloat(value);
    }
    throw new Error('Invalid FRED response - value is N/A or missing');
  }, 'FRED_T10Y2Y');

  return { value: result, isStale: result === null };
}

// ============================================================================
// COINGECKO BTC DATA FETCH
// ============================================================================

interface CoinGeckoData {
  btcPrice: number | null;
  btcChange24h: number | null;
  btcDominance: number | null;
  btcMarketCap: number | null;
  totalMarketCap: number | null;
}

async function fetchBTCDataFromCoinGecko(): Promise<CoinGeckoData> {
  const COINGECKO_KEY = import.meta.env.VITE_COINGECKO_API_KEY;
  
  const headers: HeadersInit = { 'Accept': 'application/json' };
  if (COINGECKO_KEY) {
    headers['x-cg-demo-api-key'] = COINGECKO_KEY;
  }

  // Fetch price and global data in parallel
  const [priceResult, globalResult] = await Promise.all([
    fetchWithRetry(async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
        { headers, signal: AbortSignal.timeout(10000) }
      );
      if (!response.ok) throw new Error(`CoinGecko price API returned ${response.status}`);
      return response.json();
    }, 'COINGECKO_PRICE'),
    fetchWithRetry(async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/global',
        { headers, signal: AbortSignal.timeout(10000) }
      );
      if (!response.ok) throw new Error(`CoinGecko global API returned ${response.status}`);
      return response.json();
    }, 'COINGECKO_GLOBAL')
  ]);

  // Extract market cap data for fallback calculation
  const btcMarketCap = globalResult?.data?.total_market_cap?.btc ?? null;
  const totalMarketCap = globalResult?.data?.total_market_cap?.usd ?? null;
  
  // CRITICAL: Correctly access market_cap_percentage.btc
  let btcDominance = globalResult?.data?.market_cap_percentage?.btc ?? null;
  
  // FALLBACK: If btcDominance is 0 or null, calculate from market caps
  if ((btcDominance === null || btcDominance === 0) && btcMarketCap && totalMarketCap && totalMarketCap > 0) {
    // Calculate: BTC Market Cap (in USD) / Total Market Cap (in USD) * 100
    const btcPriceForCalc = priceResult?.bitcoin?.usd ?? 0;
    if (btcPriceForCalc > 0 && btcMarketCap > 0) {
      btcDominance = ((btcMarketCap * btcPriceForCalc) / totalMarketCap) * 100;
      console.log('[L1] BTC Dominance calculated from market caps:', btcDominance);
    }
  }

  return {
    btcPrice: priceResult?.bitcoin?.usd ?? null,
    btcChange24h: priceResult?.bitcoin?.usd_24h_change ?? null,
    btcDominance,
    btcMarketCap,
    totalMarketCap,
  };
}

// ============================================================================
// FEAR & GREED INDEX FETCH
// ============================================================================

async function fetchFearGreedIndex(): Promise<number | null> {
  const result = await fetchWithRetry(async () => {
    const response = await fetch(
      'https://api.alternative.me/fng/',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error(`Fear & Greed API returned ${response.status}`);
    const data = await response.json();
    const value = data.data?.[0]?.value;
    if (value) return parseInt(value, 10);
    throw new Error('Invalid Fear & Greed response');
  }, 'FEAR_GREED_INDEX');

  return result;
}

// ============================================================================
// SUPABASE FALLBACK FETCH
// ============================================================================

interface SupabaseSnapshot {
  btc_dominance: number | null;
  yield_spread: number | null;
  btc_price: number | null;
  created_at: string;
}

async function fetchLastValidFromSupabase(): Promise<SupabaseSnapshot | null> {
  if (!supabase) {
    console.warn('[L1] Supabase not configured');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('market_snapshots')
      .select('btc_dominance, yield_spread, btc_price, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('[L1] Supabase fallback query failed:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.warn('[L1] Supabase fallback error:', err);
    return null;
  }
}

// ============================================================================
// MACRO WORKER SNAPSHOT FETCH
// ============================================================================

async function fetchMacroWorkerSnapshot() {
  try {
    const res = await fetch('/api/macro/worker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      console.warn(`[L1] Macro worker returned ${res.status}, using fallback`);
      return null;
    }

    const { snapshot, error } = await res.json();
    if (error || !snapshot) {
      console.warn('[L1] Macro worker error:', error);
      return null;
    }

    return snapshot;
  } catch (err: any) {
    console.warn('[L1] Macro worker fetch failed:', err.message);
    return null;
  }
}

// ============================================================================
// MAIN L1 DATA FETCH
// ============================================================================

export interface L1DataStateExtended extends L1DataState {
  isStaleData: boolean;
  staleFeeds: string[];
  consecutiveFailures: number;
  inReconnectMode: boolean;
}

export async function fetchL1Data(): Promise<L1DataStateExtended> {
  console.log('[L1] Starting data fetch cycle...');
  const fetchStartTime = Date.now();
  
  const errors: string[] = [];
  const staleFeeds: string[] = [];
  const feedStatus: L1DataState['feedStatus'] = {
    fred: 'RECONNECTING',
    coingecko: 'RECONNECTING',
    fearGreed: 'RECONNECTING',
    supabase: 'RECONNECTING',
    macroWorker: 'RECONNECTING',
  };

  // Fetch from all sources in parallel
  // macroData handles DGS10 + WM2NS with its own FRED->Supabase->memory->seed chain
  const [macroData, coinGeckoData, fearGreed, supabaseSnapshot, macroWorkerSnapshot] = await Promise.all([
    fetchMacroData(),
    fetchBTCDataFromCoinGecko(),
    fetchFearGreedIndex(),
    fetchLastValidFromSupabase(),
    fetchMacroWorkerSnapshot(),
  ]);

  // Sync Fear/Greed into macro cache after fetching it
  if (fearGreed !== null) {
    syncFearGreedToMacroCache(fearGreed);
  }

  // Derive yieldCurve from macroData.dgs10 (T10Y2Y fallback to DGS10)
  const yieldCurve = macroData.dgs10.value;
  const yieldCurveResult = {
    value: macroData.dgs10.status !== 'FALLBACK' ? yieldCurve : null,
    isStale: macroData.dgs10.isStale || macroData.dgs10.status === 'FALLBACK',
  };

  // Track FRED feed status from macroData
  if (macroData.dgs10.status === 'LIVE') {
    feedStatus.fred = 'LIVE';
  } else if (macroData.dgs10.status === 'CACHED') {
    feedStatus.fred = 'RECONNECTING';
  } else {
    feedStatus.fred = 'OFFLINE';
  }
  
  // Process Yield Curve with STALE_DATA tracking — uses macroData.dgs10 already resolved above
  let finalYieldCurve: number | null = null;
  let yieldCurveIsStale = false;
  
  if (yieldCurveResult.value !== null) {
    finalYieldCurve = yieldCurveResult.value;
    valueCache.yieldCurve = { value: yieldCurveResult.value, timestamp: new Date(), source: 'api' };
  } else if (supabaseSnapshot?.yield_spread !== null && supabaseSnapshot?.yield_spread !== undefined) {
    finalYieldCurve = supabaseSnapshot.yield_spread;
    feedStatus.fred = 'RECONNECTING';
    yieldCurveIsStale = true;
    errors.push('FRED: STALE_DATA - Using Supabase cached value');
    staleFeeds.push('FRED_SUPABASE_CACHE');
  } else if (valueCache.yieldCurve && (Date.now() - valueCache.yieldCurve.timestamp.getTime()) < CACHE_EXPIRY_MS) {
    finalYieldCurve = valueCache.yieldCurve.value;
    feedStatus.fred = 'RECONNECTING';
    yieldCurveIsStale = true;
    errors.push('FRED: STALE_DATA - Using memory cached value');
    staleFeeds.push('FRED_MEMORY_CACHE');
  } else {
    // Use hardcoded fallback per spec: -0.23 (last major economic print)
    finalYieldCurve = DEFAULT_YIELD_CURVE;
    feedStatus.fred = 'OFFLINE';
    yieldCurveIsStale = true;
    errors.push(`FRED: STALE_DATA - Using hardcoded fallback (${DEFAULT_YIELD_CURVE}%)`);
    staleFeeds.push('FRED_FALLBACK');
  }

  // Process BTC Dominance with enhanced fallback chain
  let finalBtcDominance: number | null = null;
  if (coinGeckoData.btcDominance !== null && coinGeckoData.btcDominance > 0) {
    // Primary: Direct from market_cap_percentage.btc
    finalBtcDominance = coinGeckoData.btcDominance;
    feedStatus.coingecko = 'LIVE';
    valueCache.btcDominance = { value: coinGeckoData.btcDominance, timestamp: new Date(), source: 'api' };
  } else if (supabaseSnapshot?.btc_dominance !== null && supabaseSnapshot?.btc_dominance !== undefined && supabaseSnapshot.btc_dominance > 0) {
    // Fallback 1: Supabase cached value
    finalBtcDominance = supabaseSnapshot.btc_dominance;
    feedStatus.coingecko = 'RECONNECTING';
    errors.push('BTC Dominance: Using Supabase cached value');
  } else if (valueCache.btcDominance && (Date.now() - valueCache.btcDominance.timestamp.getTime()) < CACHE_EXPIRY_MS) {
    // Fallback 2: Memory cache
    finalBtcDominance = valueCache.btcDominance.value;
    feedStatus.coingecko = 'RECONNECTING';
    errors.push('BTC Dominance: Using memory cached value');
  } else {
    // Fallback 3: Default value - NEVER return 0 or null to AGI Engine
    finalBtcDominance = DEFAULT_BTC_DOMINANCE;
    feedStatus.coingecko = 'OFFLINE';
    errors.push(`BTC Dominance: Using default fallback (${DEFAULT_BTC_DOMINANCE}%)`);
  }

  // Process BTC Price
  let finalBtcPrice: number | null = null;
  if (coinGeckoData.btcPrice !== null && coinGeckoData.btcPrice > 0) {
    finalBtcPrice = coinGeckoData.btcPrice;
    valueCache.btcPrice = { value: coinGeckoData.btcPrice, timestamp: new Date(), source: 'api' };
  } else if (supabaseSnapshot?.btc_price !== null && supabaseSnapshot?.btc_price !== undefined && supabaseSnapshot.btc_price > 0) {
    finalBtcPrice = supabaseSnapshot.btc_price;
    errors.push('BTC Price: Using Supabase cached value');
  } else if (valueCache.btcPrice && (Date.now() - valueCache.btcPrice.timestamp.getTime()) < CACHE_EXPIRY_MS) {
    finalBtcPrice = valueCache.btcPrice.value;
    errors.push('BTC Price: Using memory cached value');
  }

  // Process Fear & Greed
  let finalFearGreed: number | null = null;
  if (fearGreed !== null) {
    finalFearGreed = fearGreed;
    feedStatus.fearGreed = 'LIVE';
    valueCache.fearGreed = { value: fearGreed, timestamp: new Date(), source: 'api' };
  } else if (valueCache.fearGreed && (Date.now() - valueCache.fearGreed.timestamp.getTime()) < CACHE_EXPIRY_MS) {
    finalFearGreed = valueCache.fearGreed.value;
    feedStatus.fearGreed = 'DEGRADED' as any;
    errors.push('Fear & Greed: Using cached value');
  } else {
    feedStatus.fearGreed = 'OFFLINE';
  }

  // Supabase status
  feedStatus.supabase = supabaseSnapshot ? 'LIVE' : 'OFFLINE';

  // Calculate overall status
  let overallStatus: L1DataState['status'] = 'LIVE';
  const feedStatuses = Object.values(feedStatus);
  const offlineCount = feedStatuses.filter(s => s === 'OFFLINE').length;
  const reconnectingCount = feedStatuses.filter(s => s === 'RECONNECTING').length;

  if (offlineCount >= 3) {
    overallStatus = 'OFFLINE';
  } else if (offlineCount >= 1 || reconnectingCount >= 2) {
    overallStatus = 'DEGRADED';
  } else if (reconnectingCount >= 1) {
    overallStatus = 'RECONNECTING';
  }

  // If any critical value is null or 0, set to RECONNECTING
  if (
    finalYieldCurve === null || 
    finalBtcDominance === null || 
    finalBtcPrice === null ||
    finalBtcPrice === 0 ||
    finalBtcDominance === 0
  ) {
    overallStatus = overallStatus === 'OFFLINE' ? 'OFFLINE' : 'RECONNECTING';
  }

  // CRITICAL: Only update lastSuccessfulFetch on actual successful API responses
  const feedStatusValues = Object.values(feedStatus ?? {});
  const anyLiveFeed = feedStatusValues.length > 0 && feedStatusValues.some(s => s === 'LIVE');
  if (anyLiveFeed) {
    lastSuccessfulFetch = new Date();
    console.log(`[L1] Fetch cycle complete in ${Date.now() - fetchStartTime}ms - Status: ${overallStatus}`);
  } else {
    console.warn(`[L1] Fetch cycle complete but NO live feeds - Status: ${overallStatus}`);
  }

  const isStaleData = staleFeeds.length > 0 || isDataStale();

  // Process macro worker snapshot for systemic risk
  let systemicRisk: number | null = null;
  let survivalProbability: number | null = null;
  let regime: 'normal' | 'stress' | 'crisis' | null = null;
  
  if (macroWorkerSnapshot) {
    systemicRisk = macroWorkerSnapshot.systemic_risk;
    survivalProbability = macroWorkerSnapshot.survival_probability;
    regime = macroWorkerSnapshot.regime;
    feedStatus.macroWorker = 'LIVE';
    console.log('[L1] Macro worker snapshot loaded:', { systemicRisk, survivalProbability, regime });
  } else {
    feedStatus.macroWorker = 'OFFLINE';
    errors.push('Macro worker: Systemic risk metrics unavailable');
  }

  return {
    btcDominance: finalBtcDominance,
    yieldCurve: finalYieldCurve,
    btcPrice: finalBtcPrice,
    btcChange24h: coinGeckoData.btcChange24h,
    fearGreedIndex: finalFearGreed,
    systemicRisk,
    survivalProbability,
    regime,
    status: overallStatus,
    lastUpdate: anyLiveFeed ? new Date() : lastSuccessfulFetch,
    feedStatus,
    errors,
    isStaleData,
    staleFeeds,
    consecutiveFailures,
    inReconnectMode: systemReconnectMode,
  };
}

// ============================================================================
// AGI ENGINE VALIDATION GUARD
// ============================================================================

/**
 * Validates L1 data before passing to AGI Engine
 * NEVER passes 0.0%, null, or N/A to the AGI Engine
 * Uses stale-while-revalidate pattern with guaranteed fallbacks
 */
export function validateForAGI(data: L1DataState): {
  valid: boolean;
  yieldCurve: number;
  btcDominance: number;
  btcPrice: number;
  fearGreedIndex: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Yield Curve - guaranteed non-null
  let yieldCurve = data.yieldCurve;
  if (yieldCurve === null || yieldCurve === 0) {
    yieldCurve = valueCache.yieldCurve?.value ?? DEFAULT_YIELD_CURVE;
    warnings.push(`Yield curve using fallback: ${yieldCurve}%`);
  }
  
  // BTC Dominance - guaranteed non-null and non-zero
  let btcDominance = data.btcDominance;
  if (btcDominance === null || btcDominance === 0 || btcDominance < 1) {
    btcDominance = valueCache.btcDominance?.value ?? DEFAULT_BTC_DOMINANCE;
    warnings.push(`BTC dominance using fallback: ${btcDominance}%`);
  }
  
  // BTC Price - guaranteed positive
  let btcPrice = data.btcPrice;
  if (btcPrice === null || btcPrice === 0 || btcPrice < 100) {
    btcPrice = valueCache.btcPrice?.value ?? 67500; // Reasonable fallback
    warnings.push(`BTC price using fallback: $${btcPrice}`);
  }
  
  // Fear & Greed Index - guaranteed in range
  let fearGreedIndex = data.fearGreedIndex;
  if (fearGreedIndex === null || fearGreedIndex < 0 || fearGreedIndex > 100) {
    fearGreedIndex = valueCache.fearGreed?.value ?? 50; // Neutral fallback
    warnings.push(`Fear/Greed using fallback: ${fearGreedIndex}`);
  }
  
  const valid = warnings.length === 0;
  
  return {
    valid,
    yieldCurve,
    btcDominance,
    btcPrice,
    fearGreedIndex,
    warnings,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export type DisplayMode = 'value' | 'loading' | 'syncing' | 'stale';

export function getDisplayMode(value: number | null, isLoading: boolean, isStale: boolean): DisplayMode {
  if (isLoading && (value === null || value === 0)) return 'loading';
  if (value === null || value === 0) return 'syncing';
  if (isStale) return 'stale';
  return 'value';
}

export function formatL1Value(
  value: number | null,
  type: 'percent' | 'currency' | 'index',
  decimals: number = 2,
  isLoading: boolean = false,
  isStale: boolean = false
): string {
  // Show Loading... skeleton until first valid data
  if (isLoading && (value === null || value === 0)) {
    return 'Loading...';
  }
  
  // Show Syncing... pulse for null/0 after initial load
  if (value === null || value === 0) {
    return 'Syncing...';
  }

  // Format with optional stale indicator
  let formatted: string;
  switch (type) {
    case 'percent':
      formatted = `${value.toFixed(decimals)}%`;
      break;
    case 'currency':
      formatted = `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
      break;
    case 'index':
      formatted = `${Math.round(value)}/100`;
      break;
    default:
      formatted = String(value);
  }
  
  return formatted;
}

export function getStatusColor(status: L1DataState['status']): string {
  switch (status) {
    case 'LIVE':
      return 'text-green-500';
    case 'RECONNECTING':
      return 'text-amber-500';
    case 'DEGRADED':
      return 'text-orange-500';
    case 'OFFLINE':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export function getFeedStatusIcon(status: 'LIVE' | 'RECONNECTING' | 'OFFLINE'): string {
  switch (status) {
    case 'LIVE':
      return '●'; // Green dot
    case 'RECONNECTING':
      return '◐'; // Half circle
    case 'OFFLINE':
      return '○'; // Empty circle
    default:
      return '?';
  }
}
