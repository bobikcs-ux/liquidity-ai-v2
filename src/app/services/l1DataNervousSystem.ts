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
  
  // Connection status
  status: 'LIVE' | 'RECONNECTING' | 'DEGRADED' | 'OFFLINE';
  lastUpdate: Date | null;
  
  // Individual feed status
  feedStatus: {
    fred: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
    coingecko: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
    fearGreed: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
    supabase: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
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
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

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
// RETRY LOGIC
// ============================================================================

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS
): Promise<T | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      console.warn(`[L1] Fetch attempt ${attempt}/${retries} failed:`, error);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  return null;
}

// ============================================================================
// FRED YIELD CURVE FETCH
// ============================================================================

async function fetchYieldCurveFromFRED(): Promise<number | null> {
  const FRED_KEY = import.meta.env.VITE_FRED_API_KEY || 
    (typeof process !== 'undefined' && process.env.VITE_FRED_API_KEY);
  
  if (!FRED_KEY) {
    console.warn('[L1] FRED API key not configured');
    return null;
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
    throw new Error('Invalid FRED response');
  });

  return result;
}

// ============================================================================
// COINGECKO BTC DATA FETCH
// ============================================================================

interface CoinGeckoData {
  btcPrice: number | null;
  btcChange24h: number | null;
  btcDominance: number | null;
}

async function fetchBTCDataFromCoinGecko(): Promise<CoinGeckoData> {
  const COINGECKO_KEY = import.meta.env.NEXT_PUBLIC_COINGECKO_API_KEY || 
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_COINGECKO_API_KEY);
  
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
    }),
    fetchWithRetry(async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/global',
        { headers, signal: AbortSignal.timeout(10000) }
      );
      if (!response.ok) throw new Error(`CoinGecko global API returned ${response.status}`);
      return response.json();
    })
  ]);

  return {
    btcPrice: priceResult?.bitcoin?.usd ?? null,
    btcChange24h: priceResult?.bitcoin?.usd_24h_change ?? null,
    // CRITICAL: Correctly access market_cap_percentage.btc
    btcDominance: globalResult?.data?.market_cap_percentage?.btc ?? null,
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
  });

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
// MAIN L1 DATA FETCH
// ============================================================================

export async function fetchL1Data(): Promise<L1DataState> {
  const errors: string[] = [];
  const feedStatus: L1DataState['feedStatus'] = {
    fred: 'RECONNECTING',
    coingecko: 'RECONNECTING',
    fearGreed: 'RECONNECTING',
    supabase: 'RECONNECTING',
  };

  // Fetch from all sources in parallel
  const [yieldCurve, coinGeckoData, fearGreed, supabaseSnapshot] = await Promise.all([
    fetchYieldCurveFromFRED(),
    fetchBTCDataFromCoinGecko(),
    fetchFearGreedIndex(),
    fetchLastValidFromSupabase(),
  ]);

  // Process Yield Curve
  let finalYieldCurve: number | null = null;
  if (yieldCurve !== null) {
    finalYieldCurve = yieldCurve;
    feedStatus.fred = 'LIVE';
    valueCache.yieldCurve = { value: yieldCurve, timestamp: new Date(), source: 'api' };
  } else if (supabaseSnapshot?.yield_spread !== null && supabaseSnapshot?.yield_spread !== undefined) {
    finalYieldCurve = supabaseSnapshot.yield_spread;
    feedStatus.fred = 'DEGRADED' as any;
    errors.push('FRED: Using Supabase cached value');
  } else if (valueCache.yieldCurve && (Date.now() - valueCache.yieldCurve.timestamp.getTime()) < CACHE_EXPIRY_MS) {
    finalYieldCurve = valueCache.yieldCurve.value;
    feedStatus.fred = 'DEGRADED' as any;
    errors.push('FRED: Using memory cached value');
  } else {
    // Use default fallback
    finalYieldCurve = DEFAULT_YIELD_CURVE;
    feedStatus.fred = 'OFFLINE';
    errors.push(`FRED: Using default fallback (${DEFAULT_YIELD_CURVE}%)`);
  }

  // Process BTC Dominance
  let finalBtcDominance: number | null = null;
  if (coinGeckoData.btcDominance !== null && coinGeckoData.btcDominance > 0) {
    finalBtcDominance = coinGeckoData.btcDominance;
    feedStatus.coingecko = 'LIVE';
    valueCache.btcDominance = { value: coinGeckoData.btcDominance, timestamp: new Date(), source: 'api' };
  } else if (supabaseSnapshot?.btc_dominance !== null && supabaseSnapshot?.btc_dominance !== undefined && supabaseSnapshot.btc_dominance > 0) {
    finalBtcDominance = supabaseSnapshot.btc_dominance;
    errors.push('BTC Dominance: Using Supabase cached value');
  } else if (valueCache.btcDominance && (Date.now() - valueCache.btcDominance.timestamp.getTime()) < CACHE_EXPIRY_MS) {
    finalBtcDominance = valueCache.btcDominance.value;
    errors.push('BTC Dominance: Using memory cached value');
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

  return {
    btcDominance: finalBtcDominance,
    yieldCurve: finalYieldCurve,
    btcPrice: finalBtcPrice,
    btcChange24h: coinGeckoData.btcChange24h,
    fearGreedIndex: finalFearGreed,
    status: overallStatus,
    lastUpdate: new Date(),
    feedStatus,
    errors,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export function formatL1Value(
  value: number | null,
  type: 'percent' | 'currency' | 'index',
  decimals: number = 2
): string {
  if (value === null || value === 0) {
    return 'RECONNECTING...';
  }

  switch (type) {
    case 'percent':
      return `${value.toFixed(decimals)}%`;
    case 'currency':
      return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    case 'index':
      return `${Math.round(value)}/100`;
    default:
      return String(value);
  }
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
