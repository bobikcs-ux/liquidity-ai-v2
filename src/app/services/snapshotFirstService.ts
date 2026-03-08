/**
 * Snapshot-First Architecture
 * ALL data is read from Supabase snapshots — target <100ms latency
 * External APIs are synced by background Edge Functions, NOT the frontend
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SnapshotMetric {
  symbol: string;
  value: number;
  status: 'LIVE' | 'STALE' | 'OFFLINE';
  source: string;
  fetchedAt: Date;
  latencyMs: number;
}

export interface EnergySnapshot {
  wti: SnapshotMetric;
  brent: SnapshotMetric;
  natgas: SnapshotMetric;
  gasoline: SnapshotMetric;
  status: 'LIVE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
}

export interface MacroSnapshot {
  dgs10: SnapshotMetric;
  dgs2: SnapshotMetric;
  ecbRate: SnapshotMetric;
  bojRate: SnapshotMetric;
  wm2ns: SnapshotMetric;
  fearGreed: SnapshotMetric;
  status: 'LIVE' | 'DEGRADED' | 'OFFLINE';
  latencyMs: number;
}

export interface GeopoliticsSnapshot {
  conflictIndex: SnapshotMetric;
  escalationRisk: SnapshotMetric;
  hotspotCount: SnapshotMetric;
  status: 'LIVE' | 'STALE' | 'OFFLINE';
  latencyMs: number;
}

export interface GlobalSnapshot {
  energy: EnergySnapshot;
  macro: MacroSnapshot;
  geopolitics: GeopoliticsSnapshot;
  totalLatencyMs: number;
  fetchedAt: Date;
}

// ============================================================================
// ENERGY SNAPSHOT (from energy_snapshot table)
// ============================================================================

const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

function getStatus(fetchedAt: Date): 'LIVE' | 'STALE' | 'OFFLINE' {
  const age = Date.now() - fetchedAt.getTime();
  if (age < STALE_THRESHOLD_MS) return 'LIVE';
  if (age < STALE_THRESHOLD_MS * 2) return 'STALE';
  return 'OFFLINE';
}

export async function fetchEnergySnapshot(): Promise<EnergySnapshot> {
  const start = Date.now();
  
  if (!supabase) {
    return {
      wti: { symbol: 'WTI', value: 78.50, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: 0 },
      brent: { symbol: 'BRENT', value: 82.30, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: 0 },
      natgas: { symbol: 'NATGAS', value: 2.85, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: 0 },
      gasoline: { symbol: 'GASOLINE', value: 2.45, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: 0 },
      status: 'OFFLINE',
      latencyMs: Date.now() - start,
    };
  }

  try {
    const { data, error } = await supabase
      .from('energy_snapshot')
      .select('symbol, value, source, fetched_at')
      .in('symbol', ['WTI', 'BRENT', 'NATGAS', 'GASOLINE']);

    const latencyMs = Date.now() - start;

    if (error || !data || data.length === 0) {
      return {
        wti: { symbol: 'WTI', value: 78.50, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
        brent: { symbol: 'BRENT', value: 82.30, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
        natgas: { symbol: 'NATGAS', value: 2.85, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
        gasoline: { symbol: 'GASOLINE', value: 2.45, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
        status: 'OFFLINE',
        latencyMs,
      };
    }

    const map = new Map(data.map(r => [r.symbol, r]));
    
    const makeMetric = (symbol: string, fallback: number): SnapshotMetric => {
      const row = map.get(symbol);
      if (!row) return { symbol, value: fallback, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs };
      const fetchedAt = new Date(row.fetched_at);
      return {
        symbol,
        value: Number(row.value),
        status: getStatus(fetchedAt),
        source: row.source || 'SUPABASE',
        fetchedAt,
        latencyMs,
      };
    };

    const wti = makeMetric('WTI', 78.50);
    const brent = makeMetric('BRENT', 82.30);
    const natgas = makeMetric('NATGAS', 2.85);
    const gasoline = makeMetric('GASOLINE', 2.45);

    const metrics = [wti, brent, natgas, gasoline];
    const liveCount = metrics.filter(m => m.status === 'LIVE').length;
    const status = liveCount >= 3 ? 'LIVE' : liveCount >= 1 ? 'DEGRADED' : 'OFFLINE';

    return { wti, brent, natgas, gasoline, status, latencyMs };
  } catch {
    return {
      wti: { symbol: 'WTI', value: 78.50, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: Date.now() - start },
      brent: { symbol: 'BRENT', value: 82.30, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: Date.now() - start },
      natgas: { symbol: 'NATGAS', value: 2.85, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: Date.now() - start },
      gasoline: { symbol: 'GASOLINE', value: 2.45, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: Date.now() - start },
      status: 'OFFLINE',
      latencyMs: Date.now() - start,
    };
  }
}

// ============================================================================
// MACRO SNAPSHOT (from macro_metrics table)
// ============================================================================

export async function fetchMacroSnapshot(): Promise<MacroSnapshot> {
  const start = Date.now();
  
  if (!supabase) {
    const seedMetric = (symbol: string, value: number): SnapshotMetric => ({
      symbol, value, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: 0,
    });
    return {
      dgs10: seedMetric('DGS10', 4.28),
      dgs2: seedMetric('DGS2', 4.12),
      ecbRate: seedMetric('ECBMAINREF', 3.75),
      bojRate: seedMetric('INTDSRJPM193N', -0.10),
      wm2ns: seedMetric('WM2NS', 21200),
      fearGreed: seedMetric('FEAR_GREED', 52),
      status: 'OFFLINE',
      latencyMs: 0,
    };
  }

  try {
    const { data, error } = await supabase
      .from('macro_metrics')
      .select('symbol, value, status, source, fetched_at')
      .in('symbol', ['DGS10', 'DGS2', 'ECBMAINREF', 'INTDSRJPM193N', 'WM2NS', 'FEAR_GREED']);

    const latencyMs = Date.now() - start;

    if (error || !data || data.length === 0) {
      const seedMetric = (symbol: string, value: number): SnapshotMetric => ({
        symbol, value, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs,
      });
      return {
        dgs10: seedMetric('DGS10', 4.28),
        dgs2: seedMetric('DGS2', 4.12),
        ecbRate: seedMetric('ECBMAINREF', 3.75),
        bojRate: seedMetric('INTDSRJPM193N', -0.10),
        wm2ns: seedMetric('WM2NS', 21200),
        fearGreed: seedMetric('FEAR_GREED', 52),
        status: 'OFFLINE',
        latencyMs,
      };
    }

    const map = new Map(data.map(r => [r.symbol, r]));

    const makeMetric = (symbol: string, fallback: number): SnapshotMetric => {
      const row = map.get(symbol);
      if (!row) return { symbol, value: fallback, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs };
      const fetchedAt = new Date(row.fetched_at);
      return {
        symbol,
        value: Number(row.value),
        status: getStatus(fetchedAt),
        source: row.source || 'SUPABASE',
        fetchedAt,
        latencyMs,
      };
    };

    const dgs10 = makeMetric('DGS10', 4.28);
    const dgs2 = makeMetric('DGS2', 4.12);
    const ecbRate = makeMetric('ECBMAINREF', 3.75);
    const bojRate = makeMetric('INTDSRJPM193N', -0.10);
    const wm2ns = makeMetric('WM2NS', 21200);
    const fearGreed = makeMetric('FEAR_GREED', 52);

    const metrics = [dgs10, dgs2, ecbRate, bojRate, wm2ns, fearGreed];
    const liveCount = metrics.filter(m => m.status === 'LIVE').length;
    const status = liveCount >= 4 ? 'LIVE' : liveCount >= 2 ? 'DEGRADED' : 'OFFLINE';

    return { dgs10, dgs2, ecbRate, bojRate, wm2ns, fearGreed, status, latencyMs };
  } catch {
    const latencyMs = Date.now() - start;
    const seedMetric = (symbol: string, value: number): SnapshotMetric => ({
      symbol, value, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs,
    });
    return {
      dgs10: seedMetric('DGS10', 4.28),
      dgs2: seedMetric('DGS2', 4.12),
      ecbRate: seedMetric('ECBMAINREF', 3.75),
      bojRate: seedMetric('INTDSRJPM193N', -0.10),
      wm2ns: seedMetric('WM2NS', 21200),
      fearGreed: seedMetric('FEAR_GREED', 52),
      status: 'OFFLINE',
      latencyMs,
    };
  }
}

// ============================================================================
// GEOPOLITICS SNAPSHOT (from geopolitics_snapshot table)
// ============================================================================

export async function fetchGeopoliticsSnapshot(): Promise<GeopoliticsSnapshot> {
  const start = Date.now();
  
  if (!supabase) {
    return {
      conflictIndex: { symbol: 'CONFLICT_INDEX', value: 35, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: 0 },
      escalationRisk: { symbol: 'ESCALATION_RISK', value: 0.25, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: 0 },
      hotspotCount: { symbol: 'HOTSPOT_COUNT', value: 12, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs: 0 },
      status: 'OFFLINE',
      latencyMs: 0,
    };
  }

  try {
    const { data, error } = await supabase
      .from('geopolitics_snapshot')
      .select('symbol, value, source, fetched_at')
      .in('symbol', ['CONFLICT_INDEX', 'ESCALATION_RISK', 'HOTSPOT_COUNT']);

    const latencyMs = Date.now() - start;

    if (error || !data || data.length === 0) {
      return {
        conflictIndex: { symbol: 'CONFLICT_INDEX', value: 35, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
        escalationRisk: { symbol: 'ESCALATION_RISK', value: 0.25, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
        hotspotCount: { symbol: 'HOTSPOT_COUNT', value: 12, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
        status: 'OFFLINE',
        latencyMs,
      };
    }

    const map = new Map(data.map(r => [r.symbol, r]));

    const makeMetric = (symbol: string, fallback: number): SnapshotMetric => {
      const row = map.get(symbol);
      if (!row) return { symbol, value: fallback, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs };
      const fetchedAt = new Date(row.fetched_at);
      return {
        symbol,
        value: Number(row.value),
        status: getStatus(fetchedAt),
        source: row.source || 'ACLED',
        fetchedAt,
        latencyMs,
      };
    };

    const conflictIndex = makeMetric('CONFLICT_INDEX', 35);
    const escalationRisk = makeMetric('ESCALATION_RISK', 0.25);
    const hotspotCount = makeMetric('HOTSPOT_COUNT', 12);

    const metrics = [conflictIndex, escalationRisk, hotspotCount];
    const liveCount = metrics.filter(m => m.status === 'LIVE').length;
    const status = liveCount >= 2 ? 'LIVE' : liveCount >= 1 ? 'STALE' : 'OFFLINE';

    return { conflictIndex, escalationRisk, hotspotCount, status, latencyMs };
  } catch {
    const latencyMs = Date.now() - start;
    return {
      conflictIndex: { symbol: 'CONFLICT_INDEX', value: 35, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
      escalationRisk: { symbol: 'ESCALATION_RISK', value: 0.25, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
      hotspotCount: { symbol: 'HOTSPOT_COUNT', value: 12, status: 'OFFLINE', source: 'SEED', fetchedAt: new Date(), latencyMs },
      status: 'OFFLINE',
      latencyMs,
    };
  }
}

// ============================================================================
// GLOBAL SNAPSHOT — ALL DATA IN PARALLEL
// ============================================================================

export async function fetchGlobalSnapshot(): Promise<GlobalSnapshot> {
  const start = Date.now();

  const [energy, macro, geopolitics] = await Promise.all([
    fetchEnergySnapshot(),
    fetchMacroSnapshot(),
    fetchGeopoliticsSnapshot(),
  ]);

  return {
    energy,
    macro,
    geopolitics,
    totalLatencyMs: Date.now() - start,
    fetchedAt: new Date(),
  };
}
