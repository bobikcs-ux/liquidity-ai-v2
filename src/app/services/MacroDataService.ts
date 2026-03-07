import { supabase } from '../lib/supabase';

/**
 * V104 Architecture - Materialized View Interfaces
 * Data is populated by ingest_all_sources() via pg_cron every 10 mins
 */

export interface MacroSnapshotData {
  US?: {
    yieldCurve?: number;
    fredValue?: number;
    realYield?: number;
    m2Momentum?: number;
    timestamp?: string;
    status: 'ONLINE' | 'DELAYED' | 'FALLBACK';
  };
}

export interface LiquiditySnapshotData {
  btcPrice?: number;
  btcChange?: number;
  btcDominance?: number;
  fearGreedValue?: number;
  fearGreedLabel?: string;
  timestamp?: string;
  status: 'ONLINE' | 'DELAYED' | 'FALLBACK';
}

export interface EnergySnapshotData {
  oilPrice?: number;
  gasPrice?: number;
  timestamp?: string;
  status: 'ONLINE' | 'DELAYED' | 'FALLBACK';
}

export interface FREDResponse {
  value: number;
  timestamp: string;
  status: 'ONLINE' | 'FALLBACK' | 'DELAYED';
}

/**
 * Fetches FRED data from macro_snapshot materialized view
 * V104: Uses `created` column for timestamps
 * Pipeline: Populated by ingest_all_sources() every 10 mins
 */
export async function fetchFREDFromSupabase(): Promise<FREDResponse> {
  if (!supabase) {
    console.warn('Supabase not configured. Returning fallback FRED data.');
    return { value: 0, timestamp: new Date().toISOString(), status: 'FALLBACK' };
  }

  try {
    // Query macro_snapshot materialized view for FRED data
    const { data, error } = await supabase
      .from('macro_snapshot')
      .select('fred_value, created')
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[MacroDataService] macro_snapshot query error:', error);
      return { value: 0, timestamp: new Date().toISOString(), status: 'FALLBACK' };
    }

    if (!data || data.fred_value === null || data.fred_value === undefined) {
      console.warn('[MacroDataService] No FRED data in macro_snapshot');
      return { value: 0, timestamp: data?.created || new Date().toISOString(), status: 'FALLBACK' };
    }

    return {
      value: data.fred_value,
      timestamp: data.created || new Date().toISOString(),
      status: 'ONLINE'
    };
  } catch (err) {
    console.error('[MacroDataService] Error fetching FRED:', err);
    return { value: 0, timestamp: new Date().toISOString(), status: 'FALLBACK' };
  }
}

export interface FREDResponse {
  value: number;
  timestamp: string;
  status: 'ONLINE' | 'DELAYED' | 'FALLBACK';
}

/**
 * Fetches FRED data directly from the net._http_response table
 * Parses: (content->'observations'->0->>'value')::numeric
 * Uses: created column for timestamp (NOT created_at)
 */
export async function fetchFREDFromSupabase(): Promise<FREDResponse> {
  if (!supabase) {
    console.warn('Supabase not configured. Returning fallback FRED data.');
    return {
      value: 0,
      timestamp: new Date().toISOString(),
      status: 'FALLBACK'
    };
  }

  try {
    // Query the net._http_response table for FRED API responses
    const { data, error } = await supabase
      .from('net._http_response')
      .select('content, created')
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[v0] FRED Supabase query error:', error);
      return {
        value: 0,
        timestamp: new Date().toISOString(),
        status: 'FALLBACK'
      };
    }

    if (!data || !data.content) {
      console.warn('[v0] No FRED data found in net._http_response');
      return {
        value: 0,
        timestamp: new Date().toISOString(),
        status: 'FALLBACK'
      };
    }

    // Extract value from JSONB: (content->'observations'->0->>'value')::numeric
    const observations = data.content?.observations;
    if (!observations || !Array.isArray(observations) || observations.length === 0) {
      console.warn('[v0] No observations found in FRED response');
      return {
        value: 0,
        timestamp: data.created || new Date().toISOString(),
        status: 'FALLBACK'
      };
    }

    const fredValue = parseFloat(observations[0]?.value || '0');
    
    console.log('[v0] FRED data fetched successfully from Supabase:', {
      value: fredValue,
      timestamp: data.created,
      status: 'ONLINE'
    });

    return {
      value: fredValue,
      timestamp: data.created || new Date().toISOString(),
      status: 'ONLINE'
    };
  } catch (err) {
    console.error('[v0] Error fetching FRED from Supabase:', err);
    return {
      value: 0,
      timestamp: new Date().toISOString(),
      status: 'FALLBACK'
    };
  }
}

/**
 * Fetches full macro snapshot from macro_snapshot materialized view
 * V104: Uses `created` column, populated by ingest_all_sources()
 */
export async function fetchMacroSnapshot(): Promise<MacroSnapshotData> {
  if (!supabase) {
    return { US: { status: 'FALLBACK', timestamp: new Date().toISOString() } };
  }

  try {
    const { data, error } = await supabase
      .from('macro_snapshot')
      .select('fred_value, yield_curve, real_yield, m2_momentum, created')
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('[MacroDataService] macro_snapshot error:', error);
      return { US: { status: 'FALLBACK', timestamp: new Date().toISOString() } };
    }

    return {
      US: {
        fredValue: data.fred_value,
        yieldCurve: data.yield_curve,
        realYield: data.real_yield,
        m2Momentum: data.m2_momentum,
        timestamp: data.created,
        status: 'ONLINE'
      }
    };
  } catch (err) {
    console.error('[MacroDataService] Error:', err);
    return { US: { status: 'FALLBACK', timestamp: new Date().toISOString() } };
  }
}

/**
 * Fetches liquidity data from liquidity_snapshot materialized view
 * V104: Uses `created` column, populated by ingest_all_sources()
 */
export async function fetchLiquiditySnapshot(): Promise<LiquiditySnapshotData> {
  if (!supabase) {
    return { status: 'FALLBACK', timestamp: new Date().toISOString() };
  }

  try {
    const { data, error } = await supabase
      .from('liquidity_snapshot')
      .select('btc_price, btc_change, btc_dominance, fear_greed_value, fear_greed_label, created')
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('[MacroDataService] liquidity_snapshot error:', error);
      return { status: 'FALLBACK', timestamp: new Date().toISOString() };
    }

    return {
      btcPrice: data.btc_price,
      btcChange: data.btc_change,
      btcDominance: data.btc_dominance,
      fearGreedValue: data.fear_greed_value,
      fearGreedLabel: data.fear_greed_label,
      timestamp: data.created,
      status: 'ONLINE'
    };
  } catch (err) {
    console.error('[MacroDataService] Error:', err);
    return { status: 'FALLBACK', timestamp: new Date().toISOString() };
  }
}

/**
 * Fetches energy data from energy_snapshot materialized view
 * V104: Uses `created` column, populated by ingest_all_sources()
 */
export async function fetchEnergySnapshot(): Promise<EnergySnapshotData> {
  if (!supabase) {
    return { status: 'FALLBACK', timestamp: new Date().toISOString() };
  }

  try {
    const { data, error } = await supabase
      .from('energy_snapshot')
      .select('oil_price, gas_price, created')
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('[MacroDataService] energy_snapshot error:', error);
      return { status: 'FALLBACK', timestamp: new Date().toISOString() };
    }

    return {
      oilPrice: data.oil_price,
      gasPrice: data.gas_price,
      timestamp: data.created,
      status: 'ONLINE'
    };
  } catch (err) {
    console.error('[MacroDataService] Error:', err);
    return { status: 'FALLBACK', timestamp: new Date().toISOString() };
  }
}

/**
 * V104: Combined dashboard sync from all materialized views
 * Queries: macro_snapshot, liquidity_snapshot, energy_snapshot
 * Uses: `created` column for all timestamps
 */
export interface DashboardSync {
  macro: MacroSnapshotData;
  liquidity: LiquiditySnapshotData;
  energy: EnergySnapshotData;
  syncedAt: string;
}

export async function resyncMacroDashboard(): Promise<DashboardSync> {
  const [macro, liquidity, energy] = await Promise.all([
    fetchMacroSnapshot(),
    fetchLiquiditySnapshot(),
    fetchEnergySnapshot()
  ]);

  return {
    macro,
    liquidity,
    energy,
    syncedAt: new Date().toISOString()
  };
}
