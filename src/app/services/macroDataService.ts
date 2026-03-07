/**
 * MACRO DATA SERVICE — Build v102
 *
 * Fetches DGS10 (10Y Treasury yield) and WM2NS (M2 Money Supply) from FRED.
 * Writes results to Supabase macro_metrics for persistence across sessions.
 * Falls back to Supabase cache, then in-memory cache, then hardcoded seeds.
 *
 * Fetch chain per metric:
 *   1. FRED API (live)
 *   2. Supabase macro_metrics cache
 *   3. In-memory module-level cache
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

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn(`[MacroData] FRED ${seriesId} API returned ${res.status}:`, errorData);
      return null;
    }

    const json = await res.json();
    
    if (json.status !== 'LIVE' || typeof json.value !== 'number') {
      console.warn(`[MacroData] FRED ${seriesId} returned non-LIVE status:`, json);
      return null;
    }

    return json.value;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[MacroData] FRED ${seriesId} fetch error: ${msg}`);
    return null;
  }
}

// ============================================================================
// SUPABASE READ
// ============================================================================

async function readFromSupabase(symbol: string): Promise<{ value: number; fetchedAt: Date } | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('macro_metrics')
      .select('value, fetched_at')
      .eq('symbol', symbol)
      .single();

    if (error || !data) return null;

    return {
      value: Number(data.value),
      fetchedAt: new Date(data.fetched_at),
    };
  } catch {
    return null;
  }
}

// ============================================================================
// SUPABASE WRITE (upsert)
// ============================================================================

async function writeToSupabase(symbol: string, value: number, source: string): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('macro_metrics')
      .upsert(
        { symbol, value, status: 'LIVE', source, fetched_at: new Date().toISOString() },
        { onConflict: 'symbol' }
      );

    if (error) {
      console.warn(`[MacroData] Supabase upsert failed for ${symbol}:`, error.message);
    }
  } catch (err) {
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
