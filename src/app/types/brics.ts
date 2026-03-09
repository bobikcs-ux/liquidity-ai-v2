/**
 * BRICS Intelligence Layer - Type Definitions
 * Geoeconomic Power Shift Indicators
 */

// World Bank API Response Types
export interface WorldBankGDPResponse {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  sourceid: string;
  lastupdated: string;
}

export interface WorldBankGDPDataPoint {
  indicator: {
    id: string;
    value: string;
  };
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

// BRICS Country Codes
export type BRICSCountry = 'BRA' | 'RUS' | 'IND' | 'CHN' | 'ZAF';
export type BRICSCountryName = 'Brazil' | 'Russia' | 'India' | 'China' | 'South Africa';

export const BRICS_COUNTRIES: Record<BRICSCountry, BRICSCountryName> = {
  BRA: 'Brazil',
  RUS: 'Russia',
  IND: 'India',
  CHN: 'China',
  ZAF: 'South Africa',
};

// World Bank Indicator IDs
export const WB_INDICATORS = {
  GDP_CURRENT_USD: 'NY.GDP.MKTP.CD',
  GDP_GROWTH: 'NY.GDP.MKTP.KD.ZG',
  GDP_PER_CAPITA: 'NY.GDP.PCAP.CD',
  INFLATION: 'FP.CPI.TOTL.ZG',
  TRADE_BALANCE: 'NE.RSB.GNFS.CD',
} as const;

// Parsed BRICS Data
export interface BRICSCountryData {
  country: BRICSCountry;
  countryName: BRICSCountryName;
  gdpCurrentUSD: number | null;
  gdpGrowth: number | null;
  gdpPerCapita: number | null;
  year: string;
}

export interface BRICSAggregateData {
  totalGDP: number;
  averageGrowth: number;
  countries: BRICSCountryData[];
  year: string;
  lastUpdated: string;
}

// US Data for comparison
export interface USEconomicData {
  gdpCurrentUSD: number | null;
  gdpGrowth: number | null;
  year: string;
}

// BRICS Momentum Calculation
export interface BRICSMomentum {
  // (BRA_growth + RUS_growth + IND_growth) / 3
  momentum: number;
  // Individual growth rates
  braGrowth: number;
  rusGrowth: number;
  indGrowth: number;
  // Comparison with US
  usGrowth: number;
  // Delta: BRICS momentum - US growth
  momentumDelta: number;
  year: string;
}

// Geoeconomic Power Shift Indicator
export interface GeoeconomicPowerShift {
  // BRICS GDP / US GDP ratio
  bricsToUSRatio: number;
  // Year-over-year change in ratio
  ratioChange: number;
  // Trend direction
  trend: 'EAST_RISING' | 'WEST_HOLDING' | 'EQUILIBRIUM';
  // Power shift velocity (rate of change)
  velocity: number;
  // Historical data points
  history: {
    year: string;
    ratio: number;
  }[];
  year: string;
}

// Combined BRICS Intelligence
export interface BRICSIntelligence {
  momentum: BRICSMomentum;
  powerShift: GeoeconomicPowerShift;
  aggregate: BRICSAggregateData;
  usData: USEconomicData;
  signals: BRICSSignal[];
  lastUpdated: string;
}

// BRICS Alert Signals
export interface BRICSSignal {
  id: string;
  type: 'MOMENTUM_DIVERGENCE' | 'POWER_SHIFT_ACCELERATION' | 'GROWTH_REVERSAL' | 'DEDOLLARIZATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  value: number;
  threshold: number;
  timestamp: string;
}

// Database Schema (for Supabase)
export interface GlobalEastIntelligenceRow {
  id: string;
  country_code: BRICSCountry | 'USA';
  indicator: string;
  value: number;
  year: string;
  source: 'WORLDBANK' | 'FRED' | 'IMF';
  fetched_at: string;
  created_at: string;
}

// UI State
export interface BRICSWidgetState {
  data: BRICSIntelligence | null;
  loading: boolean;
  error: string | null;
  selectedView: 'momentum' | 'powershift' | 'breakdown';
  timeRange: '5Y' | '10Y' | '20Y';
}

// Chart Data
export interface BRICSChartPoint {
  year: string;
  bricsGDP: number;
  usGDP: number;
  ratio: number;
  bricsMomentum: number;
  usGrowth: number;
}
