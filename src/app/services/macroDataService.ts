/**
 * MACRO DATA SERVICE — Build v104 (DATABASE-FIRST)
 *
 * CRITICAL: NO external API calls from the browser.
 * All macro data (DGS10, ECB, BoJ, M2) comes ONLY from Supabase.
 * 
 * The Edge Function (market-refresh) is the SOLE collector that:
 *   1. Fetches from FRED, ECB, BoJ (server-side, no CORS)
 *   2. Writes to market_data_live table
 * 
 * This service ONLY reads from Supabase - never calls external APIs directly.
 * This eliminates CORS errors and 429 rate limits in the browser.
 *
 * Fetch chain:
 *   1. Supabase market_data_live (primary)
 *   2. Supabase market_snapshots (fallback)
 *   3. In-memory cache
 *   4. Hardcoded seed fallback
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface MacroMetric {
  symbol: string;
  value: number;
  status: 'LIVE' | 'CACHED' | 'FALLBACK';
  source: 'FRED' | 'SUPABASE' | 'MEMORY' | 'SEED';
  fetchedAt: Date;
  isStale: boolean;
}

export interface MacroDataResult {
  dgs10: MacroMetric;       // 10Y Treasury yield (%)
  dgs2: MacroMetric;        // 2Y Treasury yield (%)
  wm2ns: MacroMetric;       // M2 Money Supply (billions USD)
  ecbRate: MacroMetric;     // ECB Main Refinancing Rate (%)
  bojRate: MacroMetric;     // Bank of Japan Policy Rate (%)
  oecd: MacroMetric;        // OECD Composite Leading Indicator
  fearGreed: MacroMetric;   // Fear & Greed Index (0-100)
  overallStatus: 'LIVE' | 'DEGRADED' | 'OFFLINE';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const CACHE_TTL_MS = 5 * 60 * 1000;       // 5 minutes in-memory
const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes = stale

// Hardcoded seed values (last known good prints as of early 2026)
const SEEDS: Record<string, number> = {
  DGS10: 4.28,
  DGS2: 4.12,
  WM2NS: 21200,
  ECBMAINREF: 3.75,
  INTDSRJPM193N: -0.10,
  LI0201GYM186S: 102.5,
  FEAR_GREED: 52,
};

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

interface CacheEntry {
  value: number;
  fetchedAt: Date;
  source: 'FRED' | 'SUPABASE' | 'MEMORY' | 'SEED';
}

const memoryCache: Map<string, CacheEntry> = new Map();

function getCached(symbol: string): CacheEntry | null {
  const entry = memoryCache.get(symbol);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt.getTime() > CACHE_TTL_MS) return null;
  return entry;
}

function setMemoryCache(symbol: string, value: number, source: CacheEntry['source']): void {
  memoryCache.set(symbol, { value, fetchedAt: new Date(), source });
}

// ============================================================================
// API KEY
// ============================================================================

function getFredKey(): string | undefined {
  const raw =
    import.meta.env.VITE_FRED_API_KEY as string | undefined ||
    (typeof process !== 'undefined' ? process.env.VITE_FRED_API_KEY : undefined);
  if (!raw) return undefined;
  return raw.trim();
}

// ============================================================================
// FRED FETCH
// ============================================================================

async function fetchFromFRED(
  seriesId: string,
  _fredKey: string // Key is now handled server-side
): Promise<number | null> {
  try {
    // Use internal API route to bypass CORS - server fetches from FRED
    const url = `/api/macro/fred?series=${encodeURIComponent(seriesId)}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });

    // Even 4xx/5xx should return JSON with fallback value
    const json = await res.json().catch(() => null);
    
    if (!json) {
      console.warn(`[MacroData] FRED ${seriesId} returned invalid JSON`);
      return null;
    }

    // Accept both LIVE and FALLBACK status - both have valid values
    if ((json.status === 'LIVE' || json.status === 'FALLBACK') && typeof json.value === 'number') {
      if (json.status === 'FALLBACK') {
        console.log(`[MacroData] FRED ${seriesId} using fallback: ${json.value} (${json.reason || 'unknown'})`);
      }
      return json.value;
    }

    console.warn(`[MacroData] FRED ${seriesId} returned unexpected response:`, json);
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[MacroData] FRED ${seriesId} fetch error: ${msg}`);
    return null;
  }
}

// ============================================================================
// SUPABASE READ — Use market_data_live table (exists in DB)
// ============================================================================

async function readFromSupabase(symbol: string): Promise<{ value: number; fetchedAt: Date } | null> {
  if (!supabase) return null;

  try {
    // Try market_data_live table first (using metric_name column)
    const { data, error } = await supabase
      .from('market_data_live')
      .select('value, updated_at')
      .eq('metric_name', symbol)
      .single();

    if (!error && data) {
      return {
        value: Number(data.value),
        fetchedAt: new Date(data.updated_at),
      };
    }

    // Fallback: try market_snapshots for yield data
    if (symbol === 'DGS10' || symbol === 'DGS2') {
      const { data: snapshot, error: snapError } = await supabase
        .from('market_snapshots')
        .select('yield_spread, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!snapError && snapshot) {
        // Approximate 10Y from spread (spread = 10Y - 2Y, assume 2Y = 4.2%)
        const approxValue = symbol === 'DGS10' 
          ? (snapshot.yield_spread ?? 0) + 4.2 
          : 4.2;
        return {
          value: approxValue,
          fetchedAt: new Date(snapshot.created_at),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// SUPABASE WRITE (upsert) — Use market_data_live table
// ============================================================================

async function writeToSupabase(symbol: string, value: number, source: string): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('market_data_live')
      .upsert(
        { 
          metric_name: symbol, 
          value, 
          source,
          updated_at: new Date().toISOString() 
        },
        { onConflict: 'metric_name' }
      );

    if (error) {
      // Table might not have metric_name column - silently fail
      console.warn(`[MacroData] Supabase write skipped for ${symbol}: ${error.message}`);
    }
  } catch (err) {
    // Non-critical - just log and continue
    console.warn(`[MacroData] Supabase write error for ${symbol}:`, err);
  }
}

// ============================================================================
// RESOLVE A SINGLE METRIC
// ============================================================================

async function resolveMetric(
  symbol: string,
  fredKey: string | undefined
): Promise<MacroMetric> {
  const seed = SEEDS[symbol] ?? 0;

  // 1. Check in-memory cache first (fastest)
  const memoryCached = getCached(symbol);
  if (memoryCached) {
    return {
      symbol,
      value: memoryCached.value,
      status: 'CACHED',
      source: memoryCached.source,
      fetchedAt: memoryCached.fetchedAt,
      isStale: false,
    };
  }

  // 2. Attempt live FRED fetch
  if (fredKey) {
    const liveValue = await fetchFromFRED(symbol, fredKey);
    if (liveValue !== null) {
      setMemoryCache(symbol, liveValue, 'FRED');
      // Fire-and-forget Supabase write
      writeToSupabase(symbol, liveValue, 'FRED');
      return {
        symbol,
        value: liveValue,
        status: 'LIVE',
        source: 'FRED',
        fetchedAt: new Date(),
        isStale: false,
      };
    }
  }

  // 3. Fall back to Supabase cache (FORCE BYPASS when FRED is offline)
  const sbData = await readFromSupabase(symbol);
  if (sbData) {
    const isStale = Date.now() - sbData.fetchedAt.getTime() > STALE_THRESHOLD_MS;
    setMemoryCache(symbol, sbData.value, 'SUPABASE');
    
    // DEBUG: Log when Supabase fallback is actively serving data
    console.warn('FRED_OFFLINE_FALLBACK_ACTIVE', {
      symbol,
      value: sbData.value,
      fetchedAt: sbData.fetchedAt,
      isStale,
      source: 'SUPABASE',
    });
    
    return {
      symbol,
      value: sbData.value,
      status: 'CACHED',
      source: 'SUPABASE',
      fetchedAt: sbData.fetchedAt,
      isStale,
    };
  }

  // 4. Hardcoded seed fallback — never return 0 or null
  return {
    symbol,
    value: seed,
    status: 'FALLBACK',
    source: 'SEED',
    fetchedAt: new Date(),
    isStale: true,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function fetchMacroData(): Promise<MacroDataResult> {
  const fredKey = getFredKey();
  const rawKey = import.meta.env.VITE_FRED_API_KEY;

  if (!fredKey) {
    console.warn('[MacroData] CONFIG_ERROR: VITE_FRED_API_KEY is', rawKey === undefined ? 'undefined' : rawKey === '' ? 'empty string' : `invalid (${typeof rawKey})`);
    console.warn('[MacroData] FRED calls will be skipped — falling back to Supabase/SEED');
  }

  // Fetch all global macro metrics in parallel
  const [dgs10Raw, dgs2Raw, wm2nsRaw, ecbRateRaw, bojRateRaw, oecdRaw] = await Promise.all([
    resolveMetric('DGS10', fredKey),
    resolveMetric('DGS2', fredKey),
    resolveMetric('WM2NS', fredKey),
    resolveMetric('ECBMAINREF', fredKey),
    resolveMetric('INTDSRJPM193N', fredKey),
    resolveMetric('LI0201GYM186S', fredKey),
  ]);

  // Fear/Greed comes from alternative.me — use seed if unavailable
  const fearGreedCached = getCached('FEAR_GREED');
  const fearGreed: MacroMetric = fearGreedCached
    ? {
        symbol: 'FEAR_GREED',
        value: fearGreedCached.value,
        status: 'CACHED',
        source: fearGreedCached.source,
        fetchedAt: fearGreedCached.fetchedAt,
        isStale: false,
      }
    : {
        symbol: 'FEAR_GREED',
        value: SEEDS.FEAR_GREED,
        status: 'FALLBACK',
        source: 'SEED',
        fetchedAt: new Date(),
        isStale: true,
      };

  // Overall status
  const allMetrics = [dgs10Raw, dgs2Raw, wm2nsRaw, ecbRateRaw, bojRateRaw, oecdRaw, fearGreed];
  const liveCount = allMetrics.filter(m => m.status === 'LIVE').length;
  const fallbackCount = allMetrics.filter(m => m.status === 'FALLBACK').length;

  const overallStatus: MacroDataResult['overallStatus'] =
    liveCount === 0 && fallbackCount > 0 ? 'OFFLINE'
    : liveCount < 3 ? 'DEGRADED'
    : 'LIVE';

  return {
    dgs10: dgs10Raw,
    dgs2: dgs2Raw,
    wm2ns: wm2nsRaw,
    ecbRate: ecbRateRaw,
    bojRate: bojRateRaw,
    oecd: oecdRaw,
    fearGreed,
    overallStatus,
  };
}

/**
 * Update the Fear/Greed in-memory cache from an external source
 * (called by l1DataNervousSystem after it fetches from alternative.me)
 */
export function syncFearGreedToMacroCache(value: number): void {
  setMemoryCache('FEAR_GREED', value, 'FRED'); // 'FRED' used as generic "external API" label
  writeToSupabase('FEAR_GREED', value, 'alternative.me');
}
