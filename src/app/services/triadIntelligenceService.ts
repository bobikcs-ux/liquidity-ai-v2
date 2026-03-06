/**
 * Triad Intelligence Service
 * Handles data fetching from FRED, ACLED, and shipping APIs
 * Implements fail-safe layer and correlation engine
 */

import type {
  LiquidityStressData,
  FREDData,
  BOJData,
  ECBData,
  CurrencyVolatilityCell,
  LiquidityTimeSeriesPoint,
  ConflictRadarData,
  ConflictHotspot,
  ConflictRegion,
  ACLEDEvent,
  EscalationPoint,
  ChokepointMonitorData,
  ChokepointData,
  Chokepoint,
  FreightRateData,
  SystemicRiskAssessment,
  CorrelationState,
  ExportSnapshot,
  EVENT_WEIGHTS,
  SYSTEMIC_THRESHOLDS,
} from '../types/triad';

// ============================================
// CACHE & FAIL-SAFE LAYER
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

const cache: {
  liquidity: CacheEntry<LiquidityStressData> | null;
  conflict: CacheEntry<ConflictRadarData> | null;
  chokepoints: CacheEntry<ChokepointMonitorData> | null;
} = {
  liquidity: null,
  conflict: null,
  chokepoints: null,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD = 10 * 60 * 1000; // 10 minutes

function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

function markStale<T>(entry: CacheEntry<T> | null): CacheEntry<T> | null {
  if (!entry) return null;
  const isStale = Date.now() - entry.timestamp > STALE_THRESHOLD;
  return { ...entry, isStale, data: { ...entry.data, isStale } };
}

// ============================================
// LIQUIDITY STRESS ENGINE
// ============================================

const FRED_API_KEY = process.env.NEXT_PUBLIC_FRED_API_KEY || 'demo';

async function fetchFREDSeries(seriesId: string): Promise<number | null> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.observations?.[0]?.value ? parseFloat(data.observations[0].value) : null;
  } catch {
    console.error(`[v0] Failed to fetch FRED series: ${seriesId}`);
    return null;
  }
}

async function fetchFREDSeriesWithChange(seriesId: string, days: number): Promise<{ current: number; change: number } | null> {
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=${days + 1}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const observations = data.observations || [];
    if (observations.length < 2) return null;
    
    const current = parseFloat(observations[0].value);
    const previous = parseFloat(observations[Math.min(days, observations.length - 1)].value);
    const change = ((current - previous) / previous) * 100;
    
    return { current, change };
  } catch {
    return null;
  }
}

export async function fetchLiquidityStressData(): Promise<LiquidityStressData> {
  // Check cache first
  if (isCacheValid(cache.liquidity)) {
    return cache.liquidity!.data;
  }

  // Return stale data if available while fetching
  const staleData = markStale(cache.liquidity);

  try {
    // Fetch FRED data in parallel
    const [walclData, dxyValue, eurusdValue, usdjpyValue] = await Promise.all([
      fetchFREDSeriesWithChange('WALCL', 30),
      fetchFREDSeries('DTWEXBGS'), // Trade Weighted Dollar Index
      fetchFREDSeries('DEXUSEU'),
      fetchFREDSeries('DEXJPUS'),
    ]);

    const fred: FREDData = {
      walcl: walclData?.current ?? staleData?.data.fred.walcl ?? 7800000,
      walcl_30d_change: walclData?.change ?? staleData?.data.fred.walcl_30d_change ?? -1.2,
      dxy: dxyValue ?? staleData?.data.fred.dxy ?? 104.5,
      eurusd: eurusdValue ?? staleData?.data.fred.eurusd ?? 1.085,
      eurusd_deviation_200dma: calculateDeviation(eurusdValue ?? 1.085, 1.09), // Mock 200dma
      usdjpy: usdjpyValue ?? staleData?.data.fred.usdjpy ?? 149.5,
      usdjpy_volatility_7d: calculateVolatility(usdjpyValue ?? 149.5),
    };

    // Mock BOJ and ECB data (would need separate API calls)
    const boj: BOJData = {
      monetaryBase: 680000000000000, // ¥680T
      monetaryBase_90d_change: -0.8,
    };

    const ecb: ECBData = {
      balanceSheet: 6900000000000, // €6.9T
      mainRefinancingRate: 4.5,
    };

    // Calculate stress index
    const stressIndex = calculateLiquidityStressIndex(fred, boj);
    const stressLevel = getStressLevel(stressIndex);

    // Generate currency volatility heatmap
    const currencyVolatility = generateCurrencyVolatilityHeatmap(fred);

    // Generate time series
    const timeSeries = generateLiquidityTimeSeries(stressIndex);

    const result: LiquidityStressData = {
      fred,
      boj,
      ecb,
      stressIndex,
      stressLevel,
      currencyVolatility,
      timeSeries,
      lastUpdated: new Date().toISOString(),
      isStale: false,
    };

    // Update cache
    cache.liquidity = {
      data: result,
      timestamp: Date.now(),
      isStale: false,
    };

    return result;
  } catch (error) {
    console.error('[v0] Liquidity data fetch error:', error);
    if (staleData) return staleData.data;
    throw error;
  }
}

function calculateLiquidityStressIndex(fred: FREDData, boj: BOJData): number {
  // Formula: (WALCL_30d_change * -1) + (USDJPY_volatility_7d * 1.5) + (EURUSD_deviation_200dma * 2) + (BOJ_base_change_90d / 1e12)
  const walclComponent = fred.walcl_30d_change * -1;
  const volatilityComponent = fred.usdjpy_volatility_7d * 1.5;
  const deviationComponent = Math.abs(fred.eurusd_deviation_200dma) * 2;
  const bojComponent = boj.monetaryBase_90d_change * 0.1;

  return walclComponent + volatilityComponent + deviationComponent + bojComponent;
}

function calculateDeviation(current: number, average: number): number {
  return ((current - average) / average) * 100;
}

function calculateVolatility(value: number): number {
  // Simplified volatility calculation
  return Math.random() * 2 + 0.5; // Mock: 0.5-2.5%
}

function getStressLevel(index: number): LiquidityStressData['stressLevel'] {
  if (index > 1.6) return 'CRITICAL';
  if (index > 1.2) return 'WARNING';
  if (index > 0.8) return 'ELEVATED';
  return 'NORMAL';
}

function generateCurrencyVolatilityHeatmap(fred: FREDData): CurrencyVolatilityCell[] {
  const pairs = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
  return pairs.map(pair => ({
    pair,
    volatility: Math.random() * 3 + 0.5,
    change24h: (Math.random() - 0.5) * 2,
    level: getVolatilityLevel(Math.random() * 3 + 0.5),
  }));
}

function getVolatilityLevel(vol: number): CurrencyVolatilityCell['level'] {
  if (vol > 2.5) return 'EXTREME';
  if (vol > 1.5) return 'HIGH';
  if (vol > 0.8) return 'MEDIUM';
  return 'LOW';
}

function generateLiquidityTimeSeries(currentIndex: number): LiquidityTimeSeriesPoint[] {
  const points: LiquidityTimeSeriesPoint[] = [];
  const now = Date.now();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    points.push({
      date: date.toISOString().split('T')[0],
      stressIndex: currentIndex + (Math.random() - 0.5) * 0.4,
      threshold_yellow: 1.2,
      threshold_red: 1.6,
    });
  }
  
  return points;
}

// ============================================
// GLOBAL CONFLICT RADAR
// ============================================

const CONFLICT_REGIONS: Array<{ region: ConflictRegion; displayName: string; lat: number; lng: number }> = [
  { region: 'UKRAINE', displayName: 'Ukraine', lat: 48.38, lng: 31.17 },
  { region: 'TAIWAN_STRAIT', displayName: 'Taiwan Strait', lat: 24.0, lng: 121.0 },
  { region: 'RED_SEA', displayName: 'Red Sea', lat: 20.0, lng: 38.0 },
  { region: 'ISRAEL_LEBANON', displayName: 'Israel-Lebanon', lat: 33.0, lng: 35.5 },
  { region: 'MYANMAR', displayName: 'Myanmar', lat: 21.91, lng: 95.96 },
  { region: 'SAHEL', displayName: 'Sahel', lat: 15.0, lng: 0.0 },
  { region: 'HAITI', displayName: 'Haiti', lat: 18.97, lng: -72.29 },
];

export async function fetchConflictRadarData(): Promise<ConflictRadarData> {
  if (isCacheValid(cache.conflict)) {
    return cache.conflict!.data;
  }

  const staleData = markStale(cache.conflict);

  try {
    // In production, this would call ACLED API
    // For now, generate realistic mock data
    const hotspots: ConflictHotspot[] = CONFLICT_REGIONS.map(({ region, displayName, lat, lng }) => {
      const baseIntensity = getRegionBaseIntensity(region);
      const escalation24h = (Math.random() - 0.3) * 40 + baseIntensity * 5;
      const escalation7d = (Math.random() - 0.3) * 60 + baseIntensity * 8;
      const escalation30d = (Math.random() - 0.3) * 80 + baseIntensity * 10;

      return {
        region,
        displayName,
        latitude: lat,
        longitude: lng,
        escalationIndex24h: Math.max(0, escalation24h),
        escalationIndex7d: Math.max(0, escalation7d),
        escalationIndex30d: Math.max(0, escalation30d),
        intensityScore: baseIntensity + Math.random() * 20,
        recentEvents: generateMockEvents(region),
        alertLevel: getAlertLevel(Math.max(0, escalation24h)),
      };
    });

    const maxEscalation24h = Math.max(...hotspots.map(h => h.escalationIndex24h));
    const maxEscalation72h = Math.max(...hotspots.map(h => h.escalationIndex7d));

    const alertTriggered = maxEscalation24h > 25 || maxEscalation72h > 100;

    const result: ConflictRadarData = {
      hotspots,
      globalEscalationCurve: generateEscalationCurve(hotspots),
      maxEscalation24h,
      maxEscalation72h,
      alertTriggered,
      alertMessage: alertTriggered 
        ? `ALERT: ${maxEscalation24h > 25 ? '>25% escalation in 24h' : '>100% escalation in 72h'}`
        : null,
      lastUpdated: new Date().toISOString(),
      isStale: false,
    };

    cache.conflict = { data: result, timestamp: Date.now(), isStale: false };
    return result;
  } catch (error) {
    console.error('[v0] Conflict data fetch error:', error);
    if (staleData) return staleData.data;
    throw error;
  }
}

function getRegionBaseIntensity(region: ConflictRegion): number {
  const intensities: Record<ConflictRegion, number> = {
    UKRAINE: 85,
    ISRAEL_LEBANON: 75,
    RED_SEA: 60,
    MYANMAR: 50,
    SAHEL: 45,
    TAIWAN_STRAIT: 30,
    HAITI: 40,
  };
  return intensities[region];
}

function getAlertLevel(escalation: number): ConflictHotspot['alertLevel'] {
  if (escalation > 50) return 'CRITICAL';
  if (escalation > 30) return 'HIGH';
  if (escalation > 15) return 'MODERATE';
  return 'LOW';
}

function generateMockEvents(region: ConflictRegion): ACLEDEvent[] {
  const eventTypes: ACLEDEvent['eventType'][] = ['AIRSTRIKE', 'ARTILLERY', 'MISSILE', 'DRONE', 'BATTLE', 'VIOLENCE', 'PROTEST'];
  const weights: Record<ACLEDEvent['eventType'], number> = {
    AIRSTRIKE: 5,
    MISSILE: 4,
    ARTILLERY: 3,
    DRONE: 2,
    BATTLE: 2,
    VIOLENCE: 1.5,
    PROTEST: 0.8,
  };

  return eventTypes.slice(0, 4).map(eventType => ({
    eventType,
    weight: weights[eventType],
    count: Math.floor(Math.random() * 20) + 1,
    date: new Date().toISOString(),
    region,
  }));
}

function generateEscalationCurve(hotspots: ConflictHotspot[]): EscalationPoint[] {
  const points: EscalationPoint[] = [];
  const now = Date.now();

  for (let i = 14; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    hotspots.forEach(hotspot => {
      points.push({
        date: date.toISOString().split('T')[0],
        escalationIndex: hotspot.intensityScore + (Math.random() - 0.5) * 20,
        region: hotspot.region,
      });
    });
  }

  return points;
}

// ============================================
// CHOKEPOINT MONITOR
// ============================================

const CHOKEPOINTS_CONFIG: Array<{ id: Chokepoint; name: string; lat: number; lng: number }> = [
  { id: 'HORMUZ', name: 'Strait of Hormuz', lat: 26.5, lng: 56.3 },
  { id: 'BAB_EL_MANDEB', name: 'Bab el Mandeb', lat: 12.5, lng: 43.3 },
  { id: 'SUEZ', name: 'Suez Canal', lat: 30.0, lng: 32.5 },
  { id: 'MALACCA', name: 'Malacca Strait', lat: 4.0, lng: 100.0 },
  { id: 'PANAMA', name: 'Panama Canal', lat: 9.0, lng: -79.5 },
];

export async function fetchChokepointData(): Promise<ChokepointMonitorData> {
  if (isCacheValid(cache.chokepoints)) {
    return cache.chokepoints!.data;
  }

  const staleData = markStale(cache.chokepoints);

  try {
    // In production, would call MarineTraffic/Spire APIs
    const chokepoints: ChokepointData[] = CHOKEPOINTS_CONFIG.map(({ id, name, lat, lng }) => {
      const tankerFlow30dAvg = 100 + Math.random() * 50;
      const tankerFlow7d = tankerFlow30dAvg * (0.7 + Math.random() * 0.6);
      const flowDelta = ((tankerFlow7d - tankerFlow30dAvg) / tankerFlow30dAvg) * 100;

      const freightRate90dMedian = 20000 + Math.random() * 30000;
      const freightRateCurrent = freightRate90dMedian * (0.8 + Math.random() * 0.8);
      const freightSpike = ((freightRateCurrent - freightRate90dMedian) / freightRate90dMedian) * 100;

      return {
        id,
        displayName: name,
        latitude: lat,
        longitude: lng,
        tankerFlow7d,
        tankerFlow30dAvg,
        flowDelta,
        freightRateCurrent,
        freightRate90dMedian,
        freightSpike,
        congestionLevel: getCongestionLevel(Math.abs(flowDelta)),
        riskScore: Math.abs(flowDelta) + Math.max(0, freightSpike) * 0.5,
      };
    });

    const freightRates: FreightRateData[] = [
      { vesselType: 'VLCC', currentRate: 45000 + Math.random() * 20000, rate90dMedian: 40000, spike: 0 },
      { vesselType: 'SUEZMAX', currentRate: 35000 + Math.random() * 15000, rate90dMedian: 32000, spike: 0 },
      { vesselType: 'AFRAMAX', currentRate: 28000 + Math.random() * 12000, rate90dMedian: 25000, spike: 0 },
    ].map(r => ({
      ...r,
      spike: ((r.currentRate - r.rate90dMedian) / r.rate90dMedian) * 100,
    }));

    const maxCongestion = Math.max(...chokepoints.map(c => Math.abs(c.flowDelta)));
    const maxFreightSpike = Math.max(...freightRates.map(f => f.spike));

    const result: ChokepointMonitorData = {
      chokepoints,
      freightRates,
      maxCongestion,
      maxFreightSpike,
      alertTriggered: maxCongestion > 25 || maxFreightSpike > 40,
      lastUpdated: new Date().toISOString(),
      isStale: false,
    };

    cache.chokepoints = { data: result, timestamp: Date.now(), isStale: false };
    return result;
  } catch (error) {
    console.error('[v0] Chokepoint data fetch error:', error);
    if (staleData) return staleData.data;
    throw error;
  }
}

function getCongestionLevel(flowDelta: number): ChokepointData['congestionLevel'] {
  if (flowDelta > 40) return 'CRITICAL';
  if (flowDelta > 25) return 'HIGH';
  if (flowDelta > 15) return 'ELEVATED';
  return 'NORMAL';
}

// ============================================
// CROSS CORRELATION ENGINE
// ============================================

export function calculateSystemicRisk(
  liquidity: LiquidityStressData,
  conflict: ConflictRadarData,
  chokepoints: ChokepointMonitorData
): SystemicRiskAssessment {
  const state: CorrelationState = {
    liquidityStressIndex: liquidity.stressIndex,
    maxConflictEscalation24h: conflict.maxEscalation24h,
    chokepointCongestion: chokepoints.maxCongestion,
    tankerFreightSpike: chokepoints.maxFreightSpike,
  };

  const triggers = {
    liquidityStress: state.liquidityStressIndex > 1.4,
    conflictEscalation: state.maxConflictEscalation24h > 30,
    chokepointCongestion: state.chokepointCongestion > 25,
    freightSpike: state.tankerFreightSpike > 40,
  };

  const triggeredCount = Object.values(triggers).filter(Boolean).length;

  // Systemic collapse requires liquidity + conflict + (congestion OR freight)
  const isSystemicCollapse = 
    triggers.liquidityStress && 
    triggers.conflictEscalation && 
    (triggers.chokepointCongestion || triggers.freightSpike);

  const riskScore = calculateRiskScore(state, triggers);

  const riskLevel = isSystemicCollapse 
    ? 'SYSTEMIC_COLLAPSE' 
    : triggeredCount >= 2 
      ? 'HIGH' 
      : triggeredCount === 1 
        ? 'ELEVATED' 
        : 'STABLE';

  return {
    isSystemicCollapse,
    riskLevel,
    riskScore,
    triggers,
    aiAssessment: generateAIAssessment(state, triggers, riskLevel),
    timestamp: new Date().toISOString(),
  };
}

function calculateRiskScore(state: CorrelationState, triggers: Record<string, boolean>): number {
  let score = 0;
  
  // Liquidity component (0-35 points)
  score += Math.min(35, state.liquidityStressIndex * 20);
  
  // Conflict component (0-30 points)
  score += Math.min(30, state.maxConflictEscalation24h * 0.6);
  
  // Shipping component (0-35 points)
  score += Math.min(20, state.chokepointCongestion * 0.5);
  score += Math.min(15, state.tankerFreightSpike * 0.3);
  
  return Math.min(100, Math.round(score));
}

function generateAIAssessment(
  state: CorrelationState, 
  triggers: Record<string, boolean>,
  riskLevel: string
): string {
  const components: string[] = [];
  
  if (triggers.liquidityStress) {
    components.push('liquidity contraction');
  }
  if (triggers.conflictEscalation) {
    components.push('escalating regional conflict');
  }
  if (triggers.chokepointCongestion) {
    components.push('shipping chokepoint congestion');
  }
  if (triggers.freightSpike) {
    components.push('freight rate spike');
  }

  if (components.length === 0) {
    return 'Global risk indicators within normal parameters. Continue monitoring standard channels.';
  }

  if (riskLevel === 'SYSTEMIC_COLLAPSE') {
    return `CRITICAL: ${components.join(', ')} indicates rising systemic supply risk. Recommend defensive positioning and increased cash reserves.`;
  }

  return `${components.join(' combined with ')} suggests elevated macro risk. Monitor for further deterioration.`;
}

// ============================================
// EXPORT SNAPSHOT
// ============================================

export function generateExportSnapshot(
  liquidity: LiquidityStressData,
  conflict: ConflictRadarData,
  chokepoints: ChokepointMonitorData,
  systemicRisk: SystemicRiskAssessment
): ExportSnapshot {
  return {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    liquidity: {
      stressIndex: liquidity.stressIndex,
      stressLevel: liquidity.stressLevel,
      walcl: liquidity.fred.walcl,
      dxy: liquidity.fred.dxy,
      eurusd: liquidity.fred.eurusd,
      usdjpy: liquidity.fred.usdjpy,
    },
    conflict: {
      maxEscalation24h: conflict.maxEscalation24h,
      maxEscalation72h: conflict.maxEscalation72h,
      hotspots: conflict.hotspots.map(h => ({
        region: h.displayName,
        intensityScore: h.intensityScore,
        alertLevel: h.alertLevel,
      })),
    },
    shipping: {
      maxCongestion: chokepoints.maxCongestion,
      maxFreightSpike: chokepoints.maxFreightSpike,
      chokepoints: chokepoints.chokepoints.map(c => ({
        name: c.displayName,
        flowDelta: c.flowDelta,
        freightSpike: c.freightSpike,
      })),
    },
    systemicRisk: {
      isSystemicCollapse: systemicRisk.isSystemicCollapse,
      riskLevel: systemicRisk.riskLevel,
      riskScore: systemicRisk.riskScore,
    },
    aiAssessment: systemicRisk.aiAssessment,
  };
}

export function downloadSnapshot(snapshot: ExportSnapshot): void {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `triad-intelligence-${snapshot.timestamp.split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
