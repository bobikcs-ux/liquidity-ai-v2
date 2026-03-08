/**
 * Global Region Service — Fetches macro snapshots from 5 regional Supabase tables
 * Tables: macro_eu_snapshot, macro_asia_snapshot, macro_india_snapshot, macro_brics_snapshot, macro_uk_snapshot
 */

import { supabase } from '../lib/supabase';

// Region snapshot interfaces
export interface RegionSnapshot {
  id: string;
  region: string;
  status: 'LIVE' | 'STALE' | 'OFFLINE';
  lastSync: Date;
  metrics: Record<string, number | string | null>;
}

export interface EUSnapshot extends RegionSnapshot {
  region: 'EU';
  metrics: {
    gdp_growth: number | null;
    inflation_rate: number | null;
    ecb_rate: number | null;
    unemployment: number | null;
    pmi_composite: number | null;
  };
}

export interface AsiaSnapshot extends RegionSnapshot {
  region: 'ASIA';
  metrics: {
    jpy_10y_yield: number | null;
    aud_10y_yield: number | null;
    boj_rate: number | null;
    rba_rate: number | null;
    nikkei_change: number | null;
  };
}

export interface IndiaSnapshot extends RegionSnapshot {
  region: 'INDIA';
  metrics: {
    gdp_growth: number | null;
    inflation_cpi: number | null;
    rbi_rate: number | null;
    rupee_usd: number | null;
    sensex_change: number | null;
  };
}

export interface BRICSSnapshot extends RegionSnapshot {
  region: 'BRICS';
  metrics: {
    trade_flow_index: number | null;
    dedollarization_index: number | null;
    gold_reserves_change: number | null;
    yuan_trade_share: number | null;
    brics_gdp_growth: number | null;
  };
}

export interface UKSnapshot extends RegionSnapshot {
  region: 'UK';
  metrics: {
    boe_rate: number | null;
    inflation_rate: number | null;
    gdp_growth: number | null;
    gilt_10y_yield: number | null;
    ftse_change: number | null;
  };
}

export interface GlobalRegionData {
  eu: EUSnapshot | null;
  asia: AsiaSnapshot | null;
  india: IndiaSnapshot | null;
  brics: BRICSSnapshot | null;
  uk: UKSnapshot | null;
  overallStatus: 'LIVE' | 'DEGRADED' | 'OFFLINE';
  lastSync: Date;
}

// Fetch single region snapshot from Supabase
async function fetchRegionSnapshot<T extends RegionSnapshot>(
  tableName: string,
  region: T['region']
): Promise<T | null> {
  if (!supabase) {
    console.warn(`[GlobalRegion] Supabase not configured for ${region}`);
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn(`[GlobalRegion] ${region} fetch error:`, error.message);
      return null;
    }

    if (!data) return null;

    // Determine status based on data freshness (stale if > 30 min old)
    const createdAt = new Date(data.created_at || Date.now());
    const ageMs = Date.now() - createdAt.getTime();
    const isStale = ageMs > 30 * 60 * 1000;

    return {
      id: data.id,
      region,
      status: isStale ? 'STALE' : 'LIVE',
      lastSync: createdAt,
      metrics: {
        ...data,
        id: undefined,
        created_at: undefined,
        updated_at: undefined,
      },
    } as T;
  } catch (err) {
    console.warn(`[GlobalRegion] ${region} exception:`, err);
    return null;
  }
}

// Fetch all 5 regional snapshots in parallel
export async function fetchGlobalRegionData(): Promise<GlobalRegionData> {
  const startTime = Date.now();

  const [eu, asia, india, brics, uk] = await Promise.all([
    fetchRegionSnapshot<EUSnapshot>('macro_eu_snapshot', 'EU'),
    fetchRegionSnapshot<AsiaSnapshot>('macro_asia_snapshot', 'ASIA'),
    fetchRegionSnapshot<IndiaSnapshot>('macro_india_snapshot', 'INDIA'),
    fetchRegionSnapshot<BRICSSnapshot>('macro_brics_snapshot', 'BRICS'),
    fetchRegionSnapshot<UKSnapshot>('macro_uk_snapshot', 'UK'),
  ]);

  // Calculate overall status
  const snapshots = [eu, asia, india, brics, uk];
  const liveCount = snapshots.filter(s => s?.status === 'LIVE').length;
  const offlineCount = snapshots.filter(s => s === null).length;

  let overallStatus: GlobalRegionData['overallStatus'] = 'LIVE';
  if (offlineCount >= 3) {
    overallStatus = 'OFFLINE';
  } else if (liveCount < 3 || offlineCount > 0) {
    overallStatus = 'DEGRADED';
  }

  console.log(`[GlobalRegion] Fetched 5 regions in ${Date.now() - startTime}ms. Status: ${overallStatus}`);

  return {
    eu,
    asia,
    india,
    brics,
    uk,
    overallStatus,
    lastSync: new Date(),
  };
}

// Get region display color based on status
export function getRegionStatusColor(status: RegionSnapshot['status'] | null): string {
  if (status === 'LIVE') return '#2ecc71';
  if (status === 'STALE') return '#f39c12';
  return '#e74c3c';
}

// Get region flag emoji
export function getRegionFlag(region: string): string {
  const flags: Record<string, string> = {
    EU: '🇪🇺',
    ASIA: '🌏',
    INDIA: '🇮🇳',
    BRICS: '🌍',
    UK: '🇬🇧',
    US: '🇺🇸',
  };
  return flags[region] || '🌐';
}

// Format metric value for display
export function formatRegionMetric(value: number | string | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'string') return value;
  return `${value.toFixed(2)}${suffix}`;
}
