// =============================================================================
// Energy-Finance Dashboard Types
// =============================================================================

// -----------------------------------------------------------------------------
// DefiLlama Stablecoins API Types (Dollar Liquidity in Crypto)
// -----------------------------------------------------------------------------

export interface StablecoinCirculating {
  peggedUSD: number;
}

export interface StablecoinChainCirculating {
  current: StablecoinCirculating;
}

export interface Stablecoin {
  id: string;
  name: string;
  symbol: string;
  pegType: string;
  pegMechanism: string;
  circulating: StablecoinCirculating;
  chains: string[];
  chainCirculating: Record<string, StablecoinChainCirculating>;
  price?: number;
}

export interface StablecoinsResponse {
  peggedAssets: Stablecoin[];
}

export interface StablecoinChartData {
  date: number; // Unix timestamp
  totalCirculating: {
    peggedUSD: number;
  };
}

export interface LiquidityData {
  totalStablecoinMcap: number;
  change24h: number;
  change7d: number;
  topStablecoins: {
    name: string;
    symbol: string;
    mcap: number;
    dominance: number;
  }[];
  historicalData: {
    date: Date;
    value: number;
  }[];
}

// -----------------------------------------------------------------------------
// EIA Open Data API Types (Energy Data)
// -----------------------------------------------------------------------------

export type EnergyCategory = 'coal' | 'crude-oil' | 'electricity' | 'natural-gas';

export interface EIASeriesData {
  period: string;
  value: number | null;
  units: string;
}

export interface EIAResponse {
  response: {
    data: EIASeriesData[];
  };
}

// Crude Oil Imports
export interface CrudeOilImport {
  period: string;
  value: number;
  units: string;
  source?: string;
}

// Natural Gas Storage
export interface NaturalGasStorage {
  period: string;
  value: number;
  units: string;
  region?: string;
}

// Coal Production
export interface CoalProduction {
  period: string;
  value: number;
  units: string;
  mineType?: string;
}

// Electricity
export interface ElectricityGeneration {
  period: string;
  value: number;
  units: string;
  source?: string;
}

export interface EnergyData {
  category: EnergyCategory;
  title: string;
  latestValue: number;
  units: string;
  change: number;
  changePercent: number;
  historicalData: {
    date: Date;
    value: number;
  }[];
  lastUpdated: Date;
}

// -----------------------------------------------------------------------------
// EIA API Routes Structure
// -----------------------------------------------------------------------------

export const EIA_ROUTES = {
  'crude-oil': {
    imports: '/petroleum/move/imp2/data/',
    prices: '/petroleum/pri/spt/data/',
    stocks: '/petroleum/stoc/wstk/data/',
  },
  'natural-gas': {
    storage: '/natural-gas/stor/wkly/data/',
    prices: '/natural-gas/pri/sum/data/',
    production: '/natural-gas/prod/sum/data/',
  },
  'coal': {
    production: '/coal/production/data/',
    consumption: '/coal/consumption/data/',
    exports: '/coal/exports/data/',
  },
  'electricity': {
    generation: '/electricity/electric_power_operational_data/data/',
    retail_sales: '/electricity/retail_sales/data/',
  },
} as const;

// -----------------------------------------------------------------------------
// Correlation & Intelligence Types
// -----------------------------------------------------------------------------

export interface CorrelationResult {
  oilPriceChange: number;
  liquidityChange: number;
  correlation: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  warning: string | null;
  timestamp: Date;
}

export interface MarketFlowSignal {
  type: 'inflow_commodities' | 'outflow_risk' | 'neutral';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  oilTrend: 'rising' | 'falling' | 'stable';
  liquidityTrend: 'rising' | 'falling' | 'stable';
}

// -----------------------------------------------------------------------------
// Dashboard State Types
// -----------------------------------------------------------------------------

export type DashboardView = 'liquidity' | 'energy';

export interface EnergyFinanceState {
  view: DashboardView;
  energyCategory: EnergyCategory;
  liquidityData: LiquidityData | null;
  energyData: EnergyData | null;
  correlationResult: CorrelationResult | null;
  loading: boolean;
  error: string | null;
}
