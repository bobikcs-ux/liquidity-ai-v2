/**
 * Japan Macro Layer + India Fiscal Layer Types
 * Sovereign Intelligence Terminal - Asian Expansion
 */

// ============================================
// JAPAN MACRO LAYER (e-Stat API)
// ============================================

// e-Stat API Response Structure
export interface EStatApiResponse {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: number;
      ERROR_MSG?: string;
    };
    STATISTICAL_DATA: {
      TABLE_INF: {
        STAT_NAME: string;
        TITLE: string;
      };
      DATA_INF: {
        VALUE: EStatDataValue[];
      };
    };
  };
}

export interface EStatDataValue {
  $: string; // The actual value
  '@tab': string;
  '@cat01'?: string;
  '@time': string;
  '@unit'?: string;
}

// Parsed Japan Macro Data
export interface JapanMacroData {
  id?: string;
  indicator: 'cpi' | 'industrial_production' | 'trade_balance' | 'unemployment' | 'gdp_growth';
  value: number;
  yoy_change: number;
  mom_change: number;
  period: string;
  source: 'e-stat';
  fetched_at: string;
}

// Yen Carry Trade Monitor
export interface YenCarryTradeData {
  usd_jpy_rate: number;
  jpy_overnight_rate: number;
  usd_overnight_rate: number;
  carry_spread: number; // USD rate - JPY rate
  carry_trade_pressure: 'UNWINDING' | 'STABLE' | 'BUILDING';
  risk_level: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
}

// Japan Macro Dashboard State
export interface JapanMacroState {
  cpi: JapanMacroData | null;
  industrialProduction: JapanMacroData | null;
  tradeBalance: JapanMacroData | null;
  unemployment: JapanMacroData | null;
  gdpGrowth: JapanMacroData | null;
  yenCarry: YenCarryTradeData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Japan Alert Signals
export interface JapanAlertSignal {
  id: string;
  type: 'YEN_CARRY_UNWIND' | 'BOJ_INTERVENTION' | 'DEFLATION_RISK' | 'TRADE_SHOCK' | 'PRODUCTION_COLLAPSE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

// ============================================
// INDIA FISCAL LAYER (GST API)
// ============================================

// GST Portal API Response
export interface GSTApiResponse {
  success: boolean;
  data: {
    month: string;
    year: number;
    total_collection: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    compensation_cess: number;
  }[];
}

// Parsed India Fiscal Data
export interface IndiaFiscalData {
  id?: string;
  indicator: 'gst_collection' | 'cgst' | 'sgst' | 'igst' | 'fiscal_deficit';
  value: number;
  yoy_change: number;
  mom_change: number;
  period: string;
  source: 'gst-portal' | 'rbi';
  fetched_at: string;
}

// India Economic Pulse
export interface IndiaEconomicPulse {
  gstCollection: {
    total: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    yoyGrowth: number;
    trend: 'ACCELERATING' | 'STABLE' | 'DECELERATING';
  };
  fiscalHealth: {
    deficitToGDP: number;
    revenueGrowth: number;
    status: 'HEALTHY' | 'CAUTION' | 'STRESS';
  };
}

// India Fiscal State
export interface IndiaFiscalState {
  gstData: IndiaFiscalData | null;
  economicPulse: IndiaEconomicPulse | null;
  historicalGST: IndiaFiscalData[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// India Alert Signals
export interface IndiaAlertSignal {
  id: string;
  type: 'GST_SHORTFALL' | 'FISCAL_STRESS' | 'GROWTH_SURGE' | 'RUPEE_PRESSURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
}

// ============================================
// ASIAN SUPPLY CHAIN COMPOSITE
// ============================================

export interface AsianSupplyChainIndex {
  japan: {
    industrialProduction: number;
    tradeBalance: number;
    weight: 0.4;
  };
  india: {
    gstMomentum: number;
    manufacturingPMI: number;
    weight: 0.35;
  };
  china: {
    pmi: number;
    exports: number;
    weight: 0.25;
  };
  compositeIndex: number; // 0-100
  trend: 'EXPANDING' | 'STABLE' | 'CONTRACTING';
  riskToGlobalSupply: 'LOW' | 'ELEVATED' | 'HIGH';
}

// ============================================
// SRI TRIGGER EXTENSIONS
// ============================================

export interface SRIAsianTriggers {
  yenCarryUnwind: {
    active: boolean;
    impact: number; // -100 to +100 on SRI
    description: string;
  };
  asianSupplyChainStress: {
    active: boolean;
    impact: number;
    description: string;
  };
  indiaFiscalShock: {
    active: boolean;
    impact: number;
    description: string;
  };
}

// ============================================
// COMBINED ASIAN INTELLIGENCE
// ============================================

export interface AsianIntelligenceState {
  japan: JapanMacroState;
  india: IndiaFiscalState;
  supplyChain: AsianSupplyChainIndex | null;
  sriTriggers: SRIAsianTriggers;
  alerts: (JapanAlertSignal | IndiaAlertSignal)[];
}
