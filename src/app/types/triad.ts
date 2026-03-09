/**
 * Triad Intelligence Dashboard Types
 * Predictive geopolitical-financial intelligence system
 */

// ============================================
// LIQUIDITY STRESS ENGINE TYPES
// ============================================

export interface FREDData {
  walcl: number; // Fed Balance Sheet
  walcl_30d_change: number;
  dxy: number; // Dollar Index
  eurusd: number;
  eurusd_deviation_200dma: number;
  usdjpy: number;
  usdjpy_volatility_7d: number;
}

export interface BOJData {
  monetaryBase: number;
  monetaryBase_90d_change: number;
}

export interface ECBData {
  balanceSheet: number;
  mainRefinancingRate: number;
}

export interface LiquidityStressData {
  fred: FREDData;
  boj: BOJData;
  ecb: ECBData;
  stressIndex: number;
  stressLevel: 'NORMAL' | 'ELEVATED' | 'WARNING' | 'CRITICAL';
  currencyVolatility: CurrencyVolatilityCell[];
  timeSeries: LiquidityTimeSeriesPoint[];
  lastUpdated: string;
  isStale: boolean;
}

export interface CurrencyVolatilityCell {
  pair: string;
  volatility: number;
  change24h: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export interface LiquidityTimeSeriesPoint {
  date: string;
  stressIndex: number;
  threshold_yellow: number;
  threshold_red: number;
}

// ============================================
// GLOBAL CONFLICT RADAR TYPES
// ============================================

export type ConflictRegion = 
  | 'UKRAINE' 
  | 'TAIWAN_STRAIT' 
  | 'RED_SEA' 
  | 'ISRAEL_LEBANON' 
  | 'MYANMAR' 
  | 'SAHEL' 
  | 'HAITI';

export interface ACLEDEvent {
  eventType: 'AIRSTRIKE' | 'ARTILLERY' | 'MISSILE' | 'DRONE' | 'PROTEST' | 'BATTLE' | 'VIOLENCE';
  weight: number;
  count: number;
  date: string;
  region: ConflictRegion;
}

export interface ConflictHotspot {
  region: ConflictRegion;
  displayName: string;
  latitude: number;
  longitude: number;
  escalationIndex24h: number;
  escalationIndex7d: number;
  escalationIndex30d: number;
  intensityScore: number;
  recentEvents: ACLEDEvent[];
  alertLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface ConflictRadarData {
  hotspots: ConflictHotspot[];
  globalEscalationCurve: EscalationPoint[];
  maxEscalation24h: number;
  maxEscalation72h: number;
  alertTriggered: boolean;
  alertMessage: string | null;
  lastUpdated: string;
  isStale: boolean;
}

export interface EscalationPoint {
  date: string;
  escalationIndex: number;
  region: ConflictRegion;
}

// Event weights for ACLED data
export const EVENT_WEIGHTS: Record<ACLEDEvent['eventType'], number> = {
  AIRSTRIKE: 5,
  MISSILE: 4,
  ARTILLERY: 3,
  DRONE: 2,
  BATTLE: 2,
  VIOLENCE: 1.5,
  PROTEST: 0.8,
};

// ============================================
// CHOKEPOINT MONITOR TYPES
// ============================================

export type Chokepoint = 
  | 'HORMUZ' 
  | 'BAB_EL_MANDEB' 
  | 'SUEZ' 
  | 'MALACCA' 
  | 'PANAMA';

export interface ChokepointData {
  id: Chokepoint;
  displayName: string;
  latitude: number;
  longitude: number;
  tankerFlow7d: number;
  tankerFlow30dAvg: number;
  flowDelta: number; // (7d - 30d avg) / 30d avg
  freightRateCurrent: number;
  freightRate90dMedian: number;
  freightSpike: number; // current / 90d median
  congestionLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  riskScore: number;
}

export interface FreightRateData {
  vesselType: 'VLCC' | 'SUEZMAX' | 'AFRAMAX';
  currentRate: number;
  rate90dMedian: number;
  spike: number;
}

export interface ChokepointMonitorData {
  chokepoints: ChokepointData[];
  freightRates: FreightRateData[];
  maxCongestion: number;
  maxFreightSpike: number;
  alertTriggered: boolean;
  lastUpdated: string;
  isStale: boolean;
}

// ============================================
// CROSS CORRELATION ENGINE TYPES
// ============================================

export interface CorrelationState {
  liquidityStressIndex: number;
  maxConflictEscalation24h: number;
  chokepointCongestion: number;
  tankerFreightSpike: number;
}

export interface SystemicRiskAssessment {
  isSystemicCollapse: boolean;
  riskLevel: 'STABLE' | 'ELEVATED' | 'HIGH' | 'SYSTEMIC_COLLAPSE';
  riskScore: number; // 0-100
  triggers: {
    liquidityStress: boolean;
    conflictEscalation: boolean;
    chokepointCongestion: boolean;
    freightSpike: boolean;
  };
  aiAssessment: string;
  timestamp: string;
}

// Thresholds for systemic collapse detection
export const SYSTEMIC_THRESHOLDS = {
  LIQUIDITY_STRESS: 1.4, // > 1.4σ
  CONFLICT_ESCALATION_24H: 30, // > 30%
  CHOKEPOINT_CONGESTION: 25, // > 25%
  FREIGHT_SPIKE: 40, // > 40%
};

// ============================================
// DASHBOARD STATE TYPES
// ============================================

export interface TriadDashboardState {
  liquidity: LiquidityStressData | null;
  conflict: ConflictRadarData | null;
  chokepoints: ChokepointMonitorData | null;
  systemicRisk: SystemicRiskAssessment | null;
  isLoading: boolean;
  error: string | null;
  lastFullUpdate: string;
  aiMode: 'PASSIVE' | 'ACTIVE' | 'ALERT';
  systemStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  dataSyncStatus: 'SYNCED' | 'SYNCING' | 'STALE';
}

export interface TopStatusBarData {
  systemStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  dataSyncIndicator: 'SYNCED' | 'SYNCING' | 'STALE';
  aiMode: 'PASSIVE' | 'ACTIVE' | 'ALERT';
  lastUpdate: string;
  alertLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
}

// ============================================
// EXPORT SNAPSHOT TYPES
// ============================================

export interface ExportSnapshot {
  timestamp: string;
  version: string;
  liquidity: {
    stressIndex: number;
    stressLevel: string;
    walcl: number;
    dxy: number;
    eurusd: number;
    usdjpy: number;
  };
  conflict: {
    maxEscalation24h: number;
    maxEscalation72h: number;
    hotspots: Array<{
      region: string;
      intensityScore: number;
      alertLevel: string;
    }>;
  };
  shipping: {
    maxCongestion: number;
    maxFreightSpike: number;
    chokepoints: Array<{
      name: string;
      flowDelta: number;
      freightSpike: number;
    }>;
  };
  systemicRisk: {
    isSystemicCollapse: boolean;
    riskLevel: string;
    riskScore: number;
  };
  aiAssessment: string;
}
