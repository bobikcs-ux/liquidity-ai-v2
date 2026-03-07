import { supabase } from '../lib/supabase';

export interface MacroSnapshot {
  US?: {
    GDP?: number;
    unemployment?: number;
    inflation?: number;
    yieldCurve?: number;
    fredValue?: number;
    timestamp?: string;
    status: 'ONLINE' | 'DELAYED' | 'FALLBACK';
  };
  EU?: Record<string, any>;
  China?: Record<string, any>;
  Japan?: Record<string, any>;
  India?: Record<string, any>;
  BRICS?: Record<string, any>;
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
 * Fetches macro snapshot from Supabase materialized view
 * Returns US macro data with FRED as ONLINE status
 */
export async function fetchMacroSnapshot(): Promise<MacroSnapshot> {
  if (!supabase) {
    console.warn('Supabase not configured. Returning fallback macro data.');
    return {
      US: {
        status: 'FALLBACK',
        timestamp: new Date().toISOString()
      }
    };
  }

  try {
    // Get FRED data
    const fredData = await fetchFREDFromSupabase();

    // Fetch macro_snapshot materialized view for US region
    const { data, error } = await supabase
      .from('macro_snapshot')
      .select('*')
      .eq('region', 'US')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('[v0] Macro snapshot query error:', error);
      return {
        US: {
          fredValue: fredData.value,
          status: fredData.status,
          timestamp: fredData.timestamp
        }
      };
    }

    if (!data) {
      console.warn('[v0] No macro snapshot data found');
      return {
        US: {
          fredValue: fredData.value,
          status: fredData.status,
          timestamp: fredData.timestamp
        }
      };
    }

    // Parse JSONB data from snapshot
    const snapshotData = data.snapshot_data || {};
    
    console.log('[v0] Macro snapshot fetched:', {
      region: 'US',
      fredStatus: fredData.status,
      fetched_at: data.fetched_at
    });

    return {
      US: {
        GDP: snapshotData.GDP,
        unemployment: snapshotData.unemployment,
        inflation: snapshotData.inflation,
        yieldCurve: snapshotData.yieldCurve,
        fredValue: fredData.value,
        timestamp: fredData.timestamp,
        status: fredData.status
      }
    };
  } catch (err) {
    console.error('[v0] Error fetching macro snapshot:', err);
    return {
      US: {
        status: 'FALLBACK',
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Re-syncs all macro data with dashboard
 * Returns combined macro snapshot with live FRED data
 */
export async function resyncMacroDashboard(): Promise<MacroSnapshot> {
  console.log('[v0] RE-SYNCING DASHBOARD: Fetching fresh macro data...');
  
  try {
    const macroSnapshot = await fetchMacroSnapshot();
    
    console.log('[v0] Dashboard re-sync complete:', {
      fredStatus: macroSnapshot.US?.status,
      fredValue: macroSnapshot.US?.fredValue,
      timestamp: macroSnapshot.US?.timestamp
    });

    return macroSnapshot;
  } catch (err) {
    console.error('[v0] Dashboard re-sync failed:', err);
    return {
      US: {
        status: 'FALLBACK',
        timestamp: new Date().toISOString()
      }
    };
  }
}
