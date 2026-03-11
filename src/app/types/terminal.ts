/**
 * TERMINAL STATE — Canonical type definitions for AppContext
 * All market, macro, energy, geopolitical, and on-chain data flows through here.
 */

// ============================================================================
// DATA SOURCE STATUS
// ============================================================================

export type DataSourceStatus = 'LIVE' | 'STALE' | 'CACHED' | 'FALLBACK' | 'ERROR' | 'OFFLINE';
export type OverallStatus = 'LIVE' | 'STALE' | 'DEGRADED' | 'OFFLINE';

export interface DataSource {
  status: DataSourceStatus;
  lastFetchMs: number; // Unix timestamp ms
  errorMsg?: string;
}

// ============================================================================
// MARKET / PRICES
// ============================================================================

export interface PriceMetric {
  value: number;
  change24h: number;         // absolute change
  changePct24h: number;      // percentage change
  source: string;
}

export interface MarketPrices {
  btc: PriceMetric;
  eth: PriceMetric;
  gold: PriceMetric;
  oil: {
    wti: PriceMetric;
    brent: PriceMetric;
  };
  btcDominance: number;      // 0–100 (%)
}

// ============================================================================
// SENTIMENT
// ============================================================================

export interface SentimentMetrics {
  fearGreedIndex: number;       // 0–100
  fearGreedLabel: string;       // 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed'
  systemicRisk: number;         // 0–100 (%)
  survivalProbability: number;  // 0–100 (%)
  regime: 'normal' | 'stress' | 'crisis';
  btcVolatility: number;        // 0–100 (%)
  rateShock: number;            // 0–100 (%)
  balanceSheetDelta: number;    // signed, percentage points
  var95: number;                // 0–1 decimal
  yieldSpread: number;          // 10Y-2Y in %
}

// ============================================================================
// MACRO
// ============================================================================

export interface MacroMetrics {
  yield10Y: number;    // DGS10 (%)
  yield2Y: number;     // DGS2 (%)
  yieldSpread: number; // 10Y-2Y
  m2Supply: number;    // WM2NS (billions USD)
  ecbRate: number;     // ECB Main Refinancing Rate (%)
  bojRate: number;     // Bank of Japan Policy Rate (%)
  oecdLI: number;      // OECD Composite Leading Indicator
  cpiInflation: number;
  fedRate: number;
}

// ============================================================================
// ENERGY
// ============================================================================

export interface EnergyMetrics {
  wtiPrice: number;             // $/bbl
  brentPrice: number;           // $/bbl
  naturalGasStorage: number;    // Bcf
  crudeOilStocks: number;       // Mbbl
  electricityGeneration: number; // MWh
}

// ============================================================================
// GEOPOLITICS / NEWS
// ============================================================================

export interface GeopoliticsAlert {
  id: string;
  headline: string;
  region: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  publishedAt: string; // ISO date string
}

export interface GeopoliticsMetrics {
  militaryConflictIndex: number;  // 0–100
  newsVolumeIndex: number;        // 0–100
  acledEventCount: number;
  alerts: GeopoliticsAlert[];
}

// ============================================================================
// ON-CHAIN
// ============================================================================

export interface OnChainMetrics {
  ethGasGwei: number;
  networkActivityScore: number; // 0–100
  whaleMovementScore: number;   // 0–100
  btcHashRate: number;          // TH/s
}

// ============================================================================
// FX
// ============================================================================

export interface FXPairMetric {
  symbol: string;
  label: string;
  rate: number;
  changePct: number;
  trend: 'up' | 'down' | 'flat';
}

export interface FXMetrics {
  pairs: FXPairMetric[];
  dollarStrengthIndex: number; // 0–100
}

// ============================================================================
// STABLECOIN LIQUIDITY
// ============================================================================

export interface StablecoinEntry {
  name: string;
  symbol: string;
  mcap: number;
  dominance: number;
}

export interface LiquidityMetrics {
  totalStablecoinMcap: number;
  change24h: number;
  change7d: number;
  topStablecoins: StablecoinEntry[];
}

// ============================================================================
// TERMINAL STATE — top-level shape managed by AppContext
// ============================================================================

export interface TerminalState {
  // Core data domains
  prices: MarketPrices;
  sentiment: SentimentMetrics;
  macro: MacroMetrics;
  energy: EnergyMetrics;
  geopolitics: GeopoliticsMetrics;
  onChain: OnChainMetrics;
  fx: FXMetrics;
  liquidity: LiquidityMetrics;

  // Per-API data source status
  sources: {
    coingecko: DataSource;
    finnhub: DataSource;
    fred: DataSource;
    eia: DataSource;
    alchemy: DataSource;
    news: DataSource;
    acled: DataSource;
    fearGreed: DataSource;
    supabase: DataSource;
  };

  // Aggregate status
  overallStatus: OverallStatus;

  // Timestamps
  lastSyncMs: number; // Unix ms of most recent sync
  isInitialized: boolean;
  isSyncing: boolean;
}

// ============================================================================
// SEED / DEFAULT VALUES
// Guaranteed non-null fallbacks so UI never crashes waiting for data
// ============================================================================

export const TERMINAL_STATE_DEFAULTS: TerminalState = {
  prices: {
    btc: { value: 84200, change24h: 1250, changePct24h: 1.51, source: 'SEED' },
    eth: { value: 3150, change24h: 42, changePct24h: 1.35, source: 'SEED' },
    gold: { value: 2348, change24h: 8, changePct24h: 0.34, source: 'SEED' },
    oil: {
      wti: { value: 78.42, change24h: 0.85, changePct24h: 1.09, source: 'SEED' },
      brent: { value: 82.15, change24h: 0.92, changePct24h: 1.13, source: 'SEED' },
    },
    btcDominance: 54.3,
  },
  sentiment: {
    fearGreedIndex: 52,
    fearGreedLabel: 'Neutral',
    systemicRisk: 35,
    survivalProbability: 78,
    regime: 'normal',
    btcVolatility: 45,
    rateShock: 15,
    balanceSheetDelta: -2.3,
    var95: 0.08,
    yieldSpread: -0.23,
  },
  macro: {
    yield10Y: 4.28,
    yield2Y: 4.12,
    yieldSpread: 0.16,
    m2Supply: 21200,
    ecbRate: 3.75,
    bojRate: -0.10,
    oecdLI: 102.5,
    cpiInflation: 3.1,
    fedRate: 5.25,
  },
  energy: {
    wtiPrice: 78.42,
    brentPrice: 82.15,
    naturalGasStorage: 2847,
    crudeOilStocks: 432000,
    electricityGeneration: 4125000,
  },
  geopolitics: {
    militaryConflictIndex: 42,
    newsVolumeIndex: 55,
    acledEventCount: 0,
    alerts: [],
  },
  onChain: {
    ethGasGwei: 22,
    networkActivityScore: 61,
    whaleMovementScore: 38,
    btcHashRate: 620,
  },
  fx: {
    pairs: [
      { symbol: 'USDJPY', label: 'USD/JPY', rate: 149.82, changePct: 0.23, trend: 'up' },
      { symbol: 'EURUSD', label: 'USD/EUR', rate: 0.9231, changePct: -0.22, trend: 'down' },
      { symbol: 'USDCNY', label: 'USD/CNY', rate: 7.2415, changePct: 0.17, trend: 'up' },
      { symbol: 'USDCHF', label: 'USD/CHF', rate: 0.8941, changePct: -0.11, trend: 'flat' },
    ],
    dollarStrengthIndex: 54.2,
  },
  liquidity: {
    totalStablecoinMcap: 168500000000,
    change24h: -0.42,
    change7d: 1.23,
    topStablecoins: [
      { name: 'Tether', symbol: 'USDT', mcap: 119000000000, dominance: 70.6 },
      { name: 'USD Coin', symbol: 'USDC', mcap: 32000000000, dominance: 19.0 },
      { name: 'Dai', symbol: 'DAI', mcap: 5300000000, dominance: 3.1 },
    ],
  },
  sources: {
    coingecko: { status: 'OFFLINE', lastFetchMs: 0 },
    finnhub: { status: 'OFFLINE', lastFetchMs: 0 },
    fred: { status: 'OFFLINE', lastFetchMs: 0 },
    eia: { status: 'OFFLINE', lastFetchMs: 0 },
    alchemy: { status: 'OFFLINE', lastFetchMs: 0 },
    news: { status: 'OFFLINE', lastFetchMs: 0 },
    acled: { status: 'OFFLINE', lastFetchMs: 0 },
    fearGreed: { status: 'OFFLINE', lastFetchMs: 0 },
    supabase: { status: 'OFFLINE', lastFetchMs: 0 },
  },
  overallStatus: 'OFFLINE',
  lastSyncMs: 0,
  isInitialized: false,
  isSyncing: false,
};
