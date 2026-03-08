/**
 * Snapshot-First Architecture
 * Reads from: energy_data (series JSONB), macro_data (region + series JSONB),
 *             geopolitics_data (series JSONB), macro_metrics (symbol rows)
 *
 * ALL data served from Supabase — target <100ms latency.
 * External APIs are synced server-side by /api/cron/sync-all — NOT the frontend.
 */

import { supabase } from '../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface SnapshotMetric {
  key: string;
  value: number;
  status: 'LIVE' | 'STALE' | 'SEED';
  fetchedAt: Date;
}

export interface EnergySnapshot {
  wti: SnapshotMetric;
  brent: SnapshotMetric;
  natgas: SnapshotMetric;
  gasoline: SnapshotMetric;
  heatingOil: SnapshotMetric;
  status: 'LIVE' | 'STALE' | 'SEED';
  latencyMs: number;
}

export interface MacroSnapshot {
  // global (from macro_data region='global')
  dgs10: SnapshotMetric;
  dgs2: SnapshotMetric;
  spread: SnapshotMetric;
  wm2ns: SnapshotMetric;
  fearGreed: SnapshotMetric;
  // eu
  ecbRate: SnapshotMetric;
  euCpi: SnapshotMetric;
  // uk
  boeRate: SnapshotMetric;
  // asia
  bojRate: SnapshotMetric;
  jpyUsd: SnapshotMetric;
  // india
  rbiRate: SnapshotMetric;
  indiaGdp: SnapshotMetric;
  // brics
  deDollarizationIndex: SnapshotMetric;
  status: 'LIVE' | 'STALE' | 'SEED';
  latencyMs: number;
}

export interface GeopoliticsSnapshot {
  conflictIndex: SnapshotMetric;
  escalationRisk: SnapshotMetric;
  hotspotCount: SnapshotMetric;
  nuclearThreat: SnapshotMetric;
  cyberThreat: SnapshotMetric;
  status: 'LIVE' | 'STALE' | 'SEED';
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
// HELPERS
// ============================================================================

const STALE_MS = 20 * 60 * 1000; // 20 minutes

function rowStatus(fetchedAt: Date): 'LIVE' | 'STALE' {
  return Date.now() - fetchedAt.getTime() < STALE_MS ? 'LIVE' : 'STALE';
}

function makeMetric(key: string, jsonb: Record<string, unknown>, jsonKey: string, fallback: number, fetchedAt: Date): SnapshotMetric {
  const raw = jsonb[jsonKey];
  const value = raw !== undefined && raw !== null ? Number(raw) : null;
  if (value === null || isNaN(value)) {
    return { key, value: fallback, status: 'SEED', fetchedAt };
  }
  return { key, value, status: rowStatus(fetchedAt), fetchedAt };
}

function seedMetric(key: string, value: number): SnapshotMetric {
  return { key, value, status: 'SEED', fetchedAt: new Date(0) };
}

// ============================================================================
// ENERGY SNAPSHOT — reads energy_data (series JSONB, fetched_at)
// ============================================================================

export async function fetchEnergySnapshot(): Promise<EnergySnapshot> {
  const start = Date.now();

  const SEEDS = { wti: 78.50, brent: 82.30, natgas: 2.85, gasoline: 2.45, heating_oil: 2.62 };

  try {
    const { data, error } = await supabase
      .from('energy_data')
      .select('series, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    const latencyMs = Date.now() - start;

    if (error || !data) {
      return {
        wti: seedMetric('wti', SEEDS.wti),
        brent: seedMetric('brent', SEEDS.brent),
        natgas: seedMetric('natgas', SEEDS.natgas),
        gasoline: seedMetric('gasoline', SEEDS.gasoline),
        heatingOil: seedMetric('heating_oil', SEEDS.heating_oil),
        status: 'SEED',
        latencyMs,
      };
    }

    const s = data.series as Record<string, unknown>;
    const at = new Date(data.fetched_at);

    const wti = makeMetric('wti', s, 'wti', SEEDS.wti, at);
    const brent = makeMetric('brent', s, 'brent', SEEDS.brent, at);
    const natgas = makeMetric('natgas', s, 'natgas', SEEDS.natgas, at);
    const gasoline = makeMetric('gasoline', s, 'gasoline', SEEDS.gasoline, at);
    const heatingOil = makeMetric('heating_oil', s, 'heating_oil', SEEDS.heating_oil, at);

    const liveCount = [wti, brent, natgas, gasoline].filter(m => m.status === 'LIVE').length;
    const status = liveCount >= 3 ? 'LIVE' : liveCount >= 1 ? 'STALE' : 'SEED';

    return { wti, brent, natgas, gasoline, heatingOil, status, latencyMs };
  } catch {
    return {
      wti: seedMetric('wti', SEEDS.wti),
      brent: seedMetric('brent', SEEDS.brent),
      natgas: seedMetric('natgas', SEEDS.natgas),
      gasoline: seedMetric('gasoline', SEEDS.gasoline),
      heatingOil: seedMetric('heating_oil', SEEDS.heating_oil),
      status: 'SEED',
      latencyMs: Date.now() - start,
    };
  }
}

// ============================================================================
// MACRO SNAPSHOT — reads macro_data (region TEXT, series JSONB, fetched_at)
//                  and macro_metrics for FEAR_GREED (symbol-row fallback)
// ============================================================================

export async function fetchMacroSnapshot(): Promise<MacroSnapshot> {
  const start = Date.now();

  try {
    // Fetch all regions in one query (region IN list), plus Fear/Greed from macro_metrics
    const [{ data: macroRows, error: macroErr }, { data: fgRow }] = await Promise.all([
      supabase
        .from('macro_data')
        .select('region, series, fetched_at')
        .in('region', ['global', 'eu', 'uk', 'asia', 'india', 'brics'])
        .order('fetched_at', { ascending: false }),
      supabase
        .from('macro_metrics')
        .select('symbol, value, fetched_at')
        .eq('symbol', 'FEAR_GREED')
        .single(),
    ]);

    const latencyMs = Date.now() - start;

    // Index by region — take latest row per region
    const byRegion = new Map<string, { series: Record<string, unknown>; at: Date }>();
    if (macroRows && !macroErr) {
      for (const row of macroRows) {
        if (!byRegion.has(row.region)) {
          byRegion.set(row.region, { series: row.series as Record<string, unknown>, at: new Date(row.fetched_at) });
        }
      }
    }

    const g = byRegion.get('global') ?? { series: {}, at: new Date(0) };
    const eu = byRegion.get('eu') ?? { series: {}, at: new Date(0) };
    const uk = byRegion.get('uk') ?? { series: {}, at: new Date(0) };
    const asia = byRegion.get('asia') ?? { series: {}, at: new Date(0) };
    const india = byRegion.get('india') ?? { series: {}, at: new Date(0) };
    const brics = byRegion.get('brics') ?? { series: {}, at: new Date(0) };

    // Fear/Greed — prefer macro_metrics row, fall back to global series
    const fgValue = fgRow ? Number(fgRow.value) : Number(g.series['fear_greed'] ?? 52);
    const fgAt = fgRow ? new Date(fgRow.fetched_at) : g.at;
    const fearGreed: SnapshotMetric = { key: 'fear_greed', value: isNaN(fgValue) ? 52 : fgValue, status: rowStatus(fgAt), fetchedAt: fgAt };

    const dgs10 = makeMetric('dgs10', g.series, 'dgs10', 4.28, g.at);
    const dgs2 = makeMetric('dgs2', g.series, 'dgs2', 4.12, g.at);
    const spread = makeMetric('spread', g.series, 'spread', 0.16, g.at);
    const wm2ns = makeMetric('wm2ns', g.series, 'wm2ns', 21200, g.at);

    const ecbRate = makeMetric('ecb_rate', eu.series, 'ecb_rate', 3.75, eu.at);
    const euCpi = makeMetric('cpi', eu.series, 'cpi', 2.4, eu.at);
    const boeRate = makeMetric('boe_rate', uk.series, 'boe_rate', 5.25, uk.at);
    const bojRate = makeMetric('boj_rate', asia.series, 'boj_rate', -0.10, asia.at);
    const jpyUsd = makeMetric('jpy_usd', asia.series, 'jpy_usd', 149.5, asia.at);
    const rbiRate = makeMetric('rbi_rate', india.series, 'rbi_rate', 6.5, india.at);
    const indiaGdp = makeMetric('gdp_growth', india.series, 'gdp_growth', 7.2, india.at);
    const deDollarizationIndex = makeMetric('de_dollarization_index', brics.series, 'de_dollarization_index', 38, brics.at);

    const coreMetrics = [dgs10, dgs2, ecbRate, bojRate];
    const liveCount = coreMetrics.filter(m => m.status === 'LIVE').length;
    const status = liveCount >= 3 ? 'LIVE' : liveCount >= 1 ? 'STALE' : 'SEED';

    return {
      dgs10, dgs2, spread, wm2ns, fearGreed,
      ecbRate, euCpi,
      boeRate,
      bojRate, jpyUsd,
      rbiRate, indiaGdp,
      deDollarizationIndex,
      status,
      latencyMs,
    };
  } catch {
    const latencyMs = Date.now() - start;
    return {
      dgs10: seedMetric('dgs10', 4.28),
      dgs2: seedMetric('dgs2', 4.12),
      spread: seedMetric('spread', 0.16),
      wm2ns: seedMetric('wm2ns', 21200),
      fearGreed: seedMetric('fear_greed', 52),
      ecbRate: seedMetric('ecb_rate', 3.75),
      euCpi: seedMetric('cpi', 2.4),
      boeRate: seedMetric('boe_rate', 5.25),
      bojRate: seedMetric('boj_rate', -0.10),
      jpyUsd: seedMetric('jpy_usd', 149.5),
      rbiRate: seedMetric('rbi_rate', 6.5),
      indiaGdp: seedMetric('gdp_growth', 7.2),
      deDollarizationIndex: seedMetric('de_dollarization_index', 38),
      status: 'SEED',
      latencyMs,
    };
  }
}

// ============================================================================
// GEOPOLITICS SNAPSHOT — reads geopolitics_data (series JSONB, fetched_at)
// ============================================================================

export async function fetchGeopoliticsSnapshot(): Promise<GeopoliticsSnapshot> {
  const start = Date.now();

  try {
    const { data, error } = await supabase
      .from('geopolitics_data')
      .select('series, fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    const latencyMs = Date.now() - start;

    if (error || !data) {
      return {
        conflictIndex: seedMetric('conflict_index', 35),
        escalationRisk: seedMetric('escalation_risk', 0.25),
        hotspotCount: seedMetric('hotspot_count', 12),
        nuclearThreat: seedMetric('nuclear_threat_level', 2),
        cyberThreat: seedMetric('cyber_threat_level', 3),
        status: 'SEED',
        latencyMs,
      };
    }

    const s = data.series as Record<string, unknown>;
    const at = new Date(data.fetched_at);

    const conflictIndex = makeMetric('conflict_index', s, 'conflict_index', 35, at);
    const escalationRisk = makeMetric('escalation_risk', s, 'escalation_risk', 0.25, at);
    const hotspotCount = makeMetric('hotspot_count', s, 'hotspot_count', 12, at);
    const nuclearThreat = makeMetric('nuclear_threat_level', s, 'nuclear_threat_level', 2, at);
    const cyberThreat = makeMetric('cyber_threat_level', s, 'cyber_threat_level', 3, at);

    const liveCount = [conflictIndex, escalationRisk, hotspotCount].filter(m => m.status === 'LIVE').length;
    const status = liveCount >= 2 ? 'LIVE' : liveCount >= 1 ? 'STALE' : 'SEED';

    return { conflictIndex, escalationRisk, hotspotCount, nuclearThreat, cyberThreat, status, latencyMs };
  } catch {
    return {
      conflictIndex: seedMetric('conflict_index', 35),
      escalationRisk: seedMetric('escalation_risk', 0.25),
      hotspotCount: seedMetric('hotspot_count', 12),
      nuclearThreat: seedMetric('nuclear_threat_level', 2),
      cyberThreat: seedMetric('cyber_threat_level', 3),
      status: 'SEED',
      latencyMs: Date.now() - start,
    };
  }
}

// ============================================================================
// GLOBAL SNAPSHOT — all three tables in parallel
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
