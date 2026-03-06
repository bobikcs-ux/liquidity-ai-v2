/**
 * Sovereign Intelligence Terminal - Type Definitions
 * Database-backed types for realtime intelligence streaming
 */

// ============================================================================
// DATABASE TABLE TYPES
// ============================================================================

/**
 * sovereign_intelligence_stream table
 * Stores incoming intelligence from all data sources
 */
export interface SovereignIntelligenceStream {
  id: string;
  created_at: string;
  source: 'FRED' | 'EIA' | 'DEFILLAMA' | 'WORLDBANK' | 'MANUAL';
  data_type: 'LIQUIDITY' | 'ENERGY' | 'MACRO' | 'CRYPTO' | 'GEOPOLITICAL';
  raw_payload: Record<string, unknown>;
  processed: boolean;
  sri_contribution: number | null; // Sovereign Risk Index contribution
}

/**
 * sovereign_market_pulse table
 * Aggregated market state updated every 5 minutes
 */
export interface SovereignMarketPulse {
  id: string;
  timestamp: string;
  sri_score: number; // 0-100 Sovereign Risk Index
  liquidity_momentum: number; // -100 to +100
  energy_pressure: number; // 0-100
  crypto_stress: number; // 0-100
  macro_tension: number; // 0-100
  regime: 'EXPANSION' | 'CONTRACTION' | 'STRESS' | 'CRISIS';
  alert_level: 'GREEN' | 'AMBER' | 'RED' | 'BLACK';
}

/**
 * sovereign_risk_signals table
 * High-priority signals that require attention
 */
export interface SovereignRiskSignal {
  id: string;
  created_at: string;
  signal_type: 'CORRELATION_BREAK' | 'THRESHOLD_BREACH' | 'REGIME_SHIFT' | 'ANOMALY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  data_sources: string[];
  acknowledged: boolean;
  expires_at: string | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface FREDSeriesData {
  series_id: string;
  title: string;
  observations: Array<{
    date: string;
    value: string;
  }>;
}

export interface EIASeriesData {
  series_id: string;
  name: string;
  data: Array<[string, number]>; // [date, value]
}

export interface DefiLlamaStablecoinData {
  peggedAssets: Array<{
    id: string;
    name: string;
    symbol: string;
    circulating: {
      peggedUSD: number;
    };
    circulatingPrevDay: {
      peggedUSD: number;
    };
    circulatingPrevWeek: {
      peggedUSD: number;
    };
    circulatingPrevMonth: {
      peggedUSD: number;
    };
  }>;
  totalCirculating: {
    peggedUSD: number;
  };
  totalCirculatingPrevDay: {
    peggedUSD: number;
  };
  totalCirculatingPrevWeek: {
    peggedUSD: number;
  };
  totalCirculatingPrevMonth: {
    peggedUSD: number;
  };
}

// ============================================================================
// SOVEREIGN RISK INDEX (SRI) CALCULATION TYPES
// ============================================================================

export interface SRIInputs {
  // Liquidity Metrics (from DefiLlama + FRED)
  stablecoinMcap: number;
  stablecoinMcapChange7d: number; // percentage
  fedBalanceSheet: number;
  m2MoneySupply: number;
  
  // Energy Metrics (from EIA)
  crudeOilPrice: number;
  crudeOilPriceChange: number; // percentage
  naturalGasPrice: number;
  naturalGasPriceChange: number;
  
  // Market Metrics (from existing market_snapshots)
  btcVolatility: number;
  systemicRisk: number;
  yieldSpread: number;
}

export interface SRIResult {
  score: number; // 0-100
  components: {
    liquidityScore: number;
    energyScore: number;
    cryptoScore: number;
    macroScore: number;
  };
  regime: 'EXPANSION' | 'CONTRACTION' | 'STRESS' | 'CRISIS';
  alertLevel: 'GREEN' | 'AMBER' | 'RED' | 'BLACK';
  signals: string[];
}

// ============================================================================
// CORRELATION ANALYSIS TYPES
// ============================================================================

export interface CorrelationMatrix {
  oilVsLiquidity: number; // Oil price vs Stablecoin liquidity
  gasVsCrypto: number; // Natural gas vs BTC volatility
  yieldVsEnergy: number; // Yield spread vs energy prices
  timestamp: string;
}

export interface FlowSignal {
  type: 'INFLOW_COMMODITIES' | 'OUTFLOW_RISK' | 'FLIGHT_TO_SAFETY' | 'RISK_ON';
  confidence: number; // 0-100
  description: string;
  triggers: string[];
}

// ============================================================================
// REALTIME SUBSCRIPTION TYPES
// ============================================================================

export interface RealtimeUpdate {
  table: 'sovereign_intelligence_stream' | 'sovereign_market_pulse' | 'sovereign_risk_signals';
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: SovereignIntelligenceStream | SovereignMarketPulse | SovereignRiskSignal;
  timestamp: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface SovereignTerminalState {
  currentPulse: SovereignMarketPulse | null;
  recentSignals: SovereignRiskSignal[];
  intelligenceStream: SovereignIntelligenceStream[];
  correlationMatrix: CorrelationMatrix | null;
  flowSignal: FlowSignal | null;
  isConnected: boolean;
  lastUpdate: string | null;
  error: string | null;
}

export type SovereignView = 'overview' | 'liquidity' | 'energy' | 'signals' | 'intelligence';
