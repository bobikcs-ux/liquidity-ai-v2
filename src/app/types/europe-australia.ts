/**
 * Europe Sovereign Layer & Australia Macro Layer Types
 * Global Citadel Architecture - Complete Type Definitions
 */

// ============================================================
// EUROSTAT API RESPONSE TYPES
// ============================================================

export interface EurostatApiResponse {
  version: string;
  label: string;
  href: string;
  source: string;
  updated: string;
  status: Record<string, string>;
  dimension: {
    geo: {
      label: string;
      category: {
        index: Record<string, number>;
        label: Record<string, string>;
      };
    };
    time: {
      label: string;
      category: {
        index: Record<string, number>;
        label: Record<string, string>;
      };
    };
  };
  id: string[];
  size: number[];
  value: Record<string, number>;
}

// ============================================================
// EUROPE SOVEREIGN TYPES
// ============================================================

export type EuroCountryCode = 'DE' | 'FR' | 'IT' | 'ES' | 'NL' | 'BE' | 'AT' | 'PT' | 'GR' | 'IE';

export interface EuroCountryData {
  code: EuroCountryCode;
  name: string;
  gdp_growth: number | null;
  inflation_rate: number | null;
  unemployment_rate: number | null;
  debt_to_gdp: number | null;
  bond_yield_10y: number | null;
  trade_balance: number | null;
  industrial_production: number | null;
  consumer_confidence: number | null;
}

export interface EurozoneMacroData {
  timestamp: string;
  countries: EuroCountryData[];
  aggregates: {
    avg_gdp_growth: number;
    avg_inflation: number;
    avg_unemployment: number;
    total_trade_balance: number;
  };
  ecb_rate: number | null;
  euro_usd: number | null;
}

export interface DebtStressSignal {
  country_code: EuroCountryCode;
  country_name: string;
  spread_vs_bund: number;
  debt_to_gdp: number;
  stress_level: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  signal_message: string;
  timestamp: string;
}

export interface EuropeSovereignIndex {
  value: number; // 0-100
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  components: {
    debt_stress: number;      // 0-100
    growth_momentum: number;  // 0-100
    inflation_pressure: number; // 0-100
    ecb_policy: number;       // 0-100
  };
  piigs_alert: boolean; // Portugal, Italy, Ireland, Greece, Spain stress
  timestamp: string;
}

// ============================================================
// AUSTRALIA MACRO TYPES (RBA + ABS)
// ============================================================

export interface ABSApiResponse {
  header: {
    id: string;
    prepared: string;
    sender: { id: string };
    receiver: { id: string };
  };
  dataSets: Array<{
    action: string;
    observations: Record<string, number[]>;
  }>;
  structure: {
    dimensions: {
      observation: Array<{
        id: string;
        name: string;
        values: Array<{ id: string; name: string }>;
      }>;
    };
  };
}

export interface AustraliaMacroData {
  timestamp: string;
  gdp_growth: number | null;
  inflation_rate: number | null;
  unemployment_rate: number | null;
  rba_cash_rate: number | null;
  aud_usd: number | null;
  iron_ore_price: number | null;
  coal_price: number | null;
  trade_balance: number | null;
  housing_index: number | null;
  consumer_confidence: number | null;
  business_confidence: number | null;
}

export interface ChinaExposureIndex {
  value: number; // 0-100
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  components: {
    trade_dependency: number;      // China trade as % of total
    iron_ore_reliance: number;     // Iron ore exports to China
    education_services: number;    // Chinese students
    tourism_exposure: number;      // Chinese tourists
  };
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export interface AustraliaSovereignIndex {
  value: number; // 0-100
  trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
  components: {
    commodities: number;     // 0-100 (iron ore, coal, LNG)
    china_exposure: number;  // 0-100
    housing_risk: number;    // 0-100
    rba_policy: number;      // 0-100
  };
  commodity_shock_alert: boolean;
  china_decoupling_alert: boolean;
  timestamp: string;
}

// ============================================================
// GLOBAL CITADEL COMBINED TYPES
// ============================================================

export type RegionCode = 'US' | 'EU' | 'JP' | 'CN' | 'IN' | 'AU' | 'BRICS';

export interface GlobalMacroSnapshot {
  id: string;
  region: RegionCode;
  timestamp: string;
  gdp_growth: number | null;
  inflation: number | null;
  unemployment: number | null;
  policy_rate: number | null;
  currency_vs_usd: number | null;
  sovereign_index: number | null;
  risk_signals: string[];
}

export interface GlobalCitadelState {
  europe: EuropeSovereignIndex | null;
  australia: AustraliaSovereignIndex | null;
  global_risk_score: number;
  correlation_matrix: RegionCorrelation[];
  active_alerts: GlobalAlert[];
  last_updated: string;
}

export interface RegionCorrelation {
  region_a: RegionCode;
  region_b: RegionCode;
  correlation: number; // -1 to 1
  trend: 'CONVERGING' | 'STABLE' | 'DIVERGING';
}

export interface GlobalAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  region: RegionCode | 'GLOBAL';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

// ============================================================
// UI STATE TYPES
// ============================================================

export type EuropeView = 'OVERVIEW' | 'DEBT_STRESS' | 'COUNTRY_DETAIL';
export type AustraliaView = 'OVERVIEW' | 'CHINA_EXPOSURE' | 'COMMODITIES';

export interface EuropeWidgetState {
  view: EuropeView;
  selectedCountry: EuroCountryCode | null;
  loading: boolean;
  error: string | null;
  data: EurozoneMacroData | null;
  sovereignIndex: EuropeSovereignIndex | null;
  debtSignals: DebtStressSignal[];
}

export interface AustraliaWidgetState {
  view: AustraliaView;
  loading: boolean;
  error: string | null;
  data: AustraliaMacroData | null;
  sovereignIndex: AustraliaSovereignIndex | null;
  chinaExposure: ChinaExposureIndex | null;
}
