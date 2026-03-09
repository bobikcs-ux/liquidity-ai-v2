/**
 * Global Region Service — reads from unified macro_data table (region + series JSONB)
 * Consolidated architecture: EU, UK, ASIA, INDIA, BRICS all live in macro_data.
 * NO separate per-region tables.
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
    cpi: number | null;
    ecb_rate: number | null;
    unemployment: number | null;
  };
}

export interface AsiaSnapshot extends RegionSnapshot {
  region: 'ASIA';
  metrics: {
    boj_rate: number | null;
    jpy_usd: number | null;
    asx_yield: number | null;
    au_cpi: number | null;
  };
}

export interface IndiaSnapshot extends RegionSnapshot {
  region: 'INDIA';
  metrics: {
    rbi_rate: number | null;
    gdp_growth: number | null;
    cpi: number | null;
    gstin_collections: number | null;
  };
}

export interface BRICSSnapshot extends RegionSnapshot {
  region: 'BRICS';
  metrics: {
    de_dollarization_index: number | null;
    trade_in_local_currency_pct: number | null;
    gold_reserves_change: number | null;
  };
}

export interface UKSnapshot extends RegionSnapshot {
  region: 'UK';
  metrics: {
    boe_rate: number | null;
    cpi: number | null;
    gdp_growth: number | null;
    unemployment: number | null;
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

const STALE_MS = 20 * 60 * 1000; // 20 min — matches snapshotFirstService

function rowToSnapshot<T extends RegionSnapshot>(
  region: T['region'],
  series: Record<string, unknown>,
  fetchedAt: Date
): T {
  const ageMs = Date.now() - fetchedAt.getTime();
  const status: RegionSnapshot['status'] = ageMs < STALE_MS ? 'LIVE' : 'STALE';
  return {
    id: `${region}-${fetchedAt.toISOString()}`,
    region,
    status,
    lastSync: fetchedAt,
    metrics: Object.fromEntries(
      Object.entries(series).map(([k, v]) => [k, v !== null && v !== undefined ? Number(v) : null])
    ),
  } as T;
}

// Fetch all 5 regional rows in a single Supabase query
export async function fetchGlobalRegionData(): Promise<GlobalRegionData> {
  const start = Date.now();

  try {
    const { data, error } = await supabase
      .from('macro_data')
      .select('region, series, fetched_at')
      .in('region', ['eu', 'uk', 'asia', 'india', 'brics'])
      .order('fetched_at', { ascending: false });

    if (error || !data) {
      return { eu: null, asia: null, india: null, brics: null, uk: null, overallStatus: 'OFFLINE', lastSync: new Date() };
    }

    // Index by region — take the most recent row per region
    const byRegion = new Map<string, { series: Record<string, unknown>; at: Date }>();
    for (const row of data) {
      if (!byRegion.has(row.region)) {
        byRegion.set(row.region, { series: row.series as Record<string, unknown>, at: new Date(row.fetched_at) });
      }
    }

    const get = (r: string) => byRegion.get(r);

    const eu = get('eu') ? rowToSnapshot<EUSnapshot>('EU', get('eu')!.series, get('eu')!.at) : null;
    const asia = get('asia') ? rowToSnapshot<AsiaSnapshot>('ASIA', get('asia')!.series, get('asia')!.at) : null;
    const india = get('india') ? rowToSnapshot<IndiaSnapshot>('INDIA', get('india')!.series, get('india')!.at) : null;
    const brics = get('brics') ? rowToSnapshot<BRICSSnapshot>('BRICS', get('brics')!.series, get('brics')!.at) : null;
    const uk = get('uk') ? rowToSnapshot<UKSnapshot>('UK', get('uk')!.series, get('uk')!.at) : null;

    const snapshots = [eu, asia, india, brics, uk];
    const liveCount = snapshots.filter(s => s?.status === 'LIVE').length;
    const nullCount = snapshots.filter(s => s === null).length;

    const overallStatus: GlobalRegionData['overallStatus'] =
      nullCount >= 4 ? 'OFFLINE' : liveCount < 3 ? 'DEGRADED' : 'LIVE';

    return { eu, asia, india, brics, uk, overallStatus, lastSync: new Date() };
  } catch (err) {
    console.warn('[GlobalRegion] fetchGlobalRegionData error:', err);
    return { eu: null, asia: null, india: null, brics: null, uk: null, overallStatus: 'OFFLINE', lastSync: new Date() };
  }
}

// Get region display color based on status
export function getRegionStatusColor(status: RegionSnapshot['status'] | null): string {
  if (status === 'LIVE') return '#2ecc71';
  if (status === 'STALE') return '#f39c12';
  return '#e74c3c';
}

// Get region flag
export function getRegionFlag(region: string): string {
  const flags: Record<string, string> = { EU: '🇪🇺', ASIA: '🌏', INDIA: '🇮🇳', BRICS: '🌍', UK: '🇬🇧', US: '🇺🇸' };
  return flags[region] || '🌐';
}

// Format metric value for display
export function formatRegionMetric(value: number | string | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) return '--';
  if (typeof value === 'string') return value;
  return `${value.toFixed(2)}${suffix}`;
}
