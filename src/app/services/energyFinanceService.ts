// =============================================================================
// Energy-Finance Data Service
// WTI + Brent: Financial Modeling Prep (FMP)
// Stablecoins: DefiLlama
// Natural Gas / EIA: EIA API
// =============================================================================

import type {
  StablecoinsResponse,
  LiquidityData,
  EnergyData,
  EnergyCategory,
  CorrelationResult,
  MarketFlowSignal,
  EIASeriesData,
} from '../types/energy-finance';

// API Base URLs
const DEFILLAMA_STABLECOINS_API = 'https://stablecoins.llama.fi';
const EIA_API_BASE = 'https://api.eia.gov/v2';
const FMP_API_BASE = 'https://financialmodelingprep.com/api/v3';

// API keys — read once at module level
const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY as string | undefined;
// EIA key: falls back to DEMO_KEY but DEMO_KEY has strict rate limits (5 req/s, 1000 req/day)
const EIA_API_KEY = (import.meta.env.VITE_EIA_API_KEY as string | undefined) || 'DEMO_KEY';

// Cache — 5 min TTL matching global refresh cycle
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// =============================================================================
// FMP — Real-Time WTI & Brent Spot Prices
// =============================================================================

export interface OilSpotPrices {
  wtiPrice: number;
  wtiChange: number;
  wtiChangePct: number;
  brentPrice: number;
  brentChange: number;
  brentChangePct: number;
  lastUpdated: Date;
  source: 'FMP' | 'FALLBACK';
}

export async function fetchOilSpotPrices(): Promise<OilSpotPrices> {
  const cacheKey = 'oil-spot-fmp';
  const cached = getCached<OilSpotPrices>(cacheKey);
  if (cached) return cached;

  if (!FMP_API_KEY) {
    return getOilFallback('FALLBACK');
  }

  try {
    // FMP quote endpoint — CLUSD = WTI Crude, COLUSD = Brent
    const [wtiRes, brentRes] = await Promise.all([
      fetch(`${FMP_API_BASE}/quote/CLUSD?apikey=${FMP_API_KEY}`),
      fetch(`${FMP_API_BASE}/quote/COLUSD?apikey=${FMP_API_KEY}`),
    ]);

    if (!wtiRes.ok || !brentRes.ok) throw new Error('FMP oil quote failed');

    const [wtiData, brentData] = await Promise.all([
      wtiRes.json() as Promise<FMPQuote[]>,
      brentRes.json() as Promise<FMPQuote[]>,
    ]);

    const wti = wtiData[0];
    const brent = brentData[0];

    if (!wti || !brent) throw new Error('FMP returned empty quotes');

    const result: OilSpotPrices = {
      wtiPrice: wti.price,
      wtiChange: wti.change,
      wtiChangePct: wti.changesPercentage,
      brentPrice: brent.price,
      brentChange: brent.change,
      brentChangePct: brent.changesPercentage,
      lastUpdated: new Date(),
      source: 'FMP',
    };

    setCache(cacheKey, result);
    return result;
  } catch {
    return getOilFallback('FALLBACK');
  }
}

function getOilFallback(source: 'FMP' | 'FALLBACK'): OilSpotPrices {
  return {
    wtiPrice: 78.42,
    wtiChange: 0.85,
    wtiChangePct: 1.09,
    brentPrice: 82.15,
    brentChange: 0.92,
    brentChangePct: 1.13,
    lastUpdated: new Date(),
    source,
  };
}

// =============================================================================
// FMP — Live FX Pairs (USD/JPY, USD/EUR, USD/CNY, USD/CHF)
// =============================================================================

export interface FXPair {
  symbol: string;        // e.g. "USDJPY"
  label: string;         // e.g. "USD/JPY"
  rate: number;
  change: number;
  changePct: number;
  trend: 'up' | 'down' | 'flat';
}

export interface LiveFXData {
  pairs: FXPair[];
  dollarStrengthIndex: number; // 0–100 composite
  lastUpdated: Date;
  source: 'FMP' | 'FALLBACK';
}

const FX_SYMBOLS = [
  { symbol: 'USDJPY', label: 'USD/JPY' },
  { symbol: 'EURUSD', label: 'USD/EUR', invert: true },
  { symbol: 'USDCNY', label: 'USD/CNY' },
  { symbol: 'USDCHF', label: 'USD/CHF' },
];

export async function fetchLiveFXData(): Promise<LiveFXData> {
  const cacheKey = 'fx-pairs-fmp';
  const cached = getCached<LiveFXData>(cacheKey);
  if (cached) return cached;

  if (!FMP_API_KEY) {
    return getFXFallback('FALLBACK');
  }

  try {
    const symbols = FX_SYMBOLS.map(f => f.symbol).join(',');
    const res = await fetch(`${FMP_API_BASE}/quote/${symbols}?apikey=${FMP_API_KEY}`);
    if (!res.ok) throw new Error('FMP FX quote failed');

    const quotes: FMPQuote[] = await res.json();
    if (!quotes || quotes.length === 0) throw new Error('FMP FX empty response');

    const pairs: FXPair[] = FX_SYMBOLS.map(def => {
      const q = quotes.find(q => q.symbol === def.symbol);
      const rate = q ? (def.invert ? +(1 / q.price).toFixed(5) : q.price) : 0;
      const change = q ? q.change : 0;
      const changePct = q ? q.changesPercentage : 0;

      return {
        symbol: def.symbol,
        label: def.label,
        rate,
        change,
        changePct,
        trend: changePct > 0.05 ? 'up' : changePct < -0.05 ? 'down' : 'flat',
      };
    });

    // Dollar strength: average of (USD vs others) — higher = stronger USD
    const avgChangePct = pairs
      .filter(p => !p.label.startsWith('USD/EUR'))
      .reduce((sum, p) => sum + p.changePct, 0) / (pairs.length - 1);
    const dollarStrengthIndex = Math.min(100, Math.max(0, 50 + avgChangePct * 5));

    const result: LiveFXData = { pairs, dollarStrengthIndex, lastUpdated: new Date(), source: 'FMP' };
    setCache(cacheKey, result);
    return result;
  } catch {
    return getFXFallback('FALLBACK');
  }
}

function getFXFallback(source: 'FMP' | 'FALLBACK'): LiveFXData {
  return {
    pairs: [
      { symbol: 'USDJPY', label: 'USD/JPY', rate: 149.82, change: 0.34, changePct: 0.23, trend: 'up' },
      { symbol: 'EURUSD', label: 'USD/EUR', rate: 0.9231, change: -0.002, changePct: -0.22, trend: 'down' },
      { symbol: 'USDCNY', label: 'USD/CNY', rate: 7.2415, change: 0.012, changePct: 0.17, trend: 'up' },
      { symbol: 'USDCHF', label: 'USD/CHF', rate: 0.8941, change: -0.001, changePct: -0.11, trend: 'flat' },
    ],
    dollarStrengthIndex: 54.2,
    lastUpdated: new Date(),
    source,
  };
}

// Internal type for FMP quotes
interface FMPQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
}

// =============================================================================
// DefiLlama Stablecoins API
// =============================================================================

export async function fetchStablecoins(): Promise<LiquidityData> {
  const cacheKey = 'stablecoins';
  const cached = getCached<LiquidityData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${DEFILLAMA_STABLECOINS_API}/stablecoins?includePrices=true`);
    if (!response.ok) throw new Error('Failed to fetch stablecoins');

    const data: StablecoinsResponse = await response.json();
    const totalMcap = data.peggedAssets.reduce((sum, coin) => sum + (coin.circulating?.peggedUSD || 0), 0);
    const sorted = [...data.peggedAssets]
      .sort((a, b) => (b.circulating?.peggedUSD || 0) - (a.circulating?.peggedUSD || 0))
      .slice(0, 5);

    const topStablecoins = sorted.map(coin => ({
      name: coin.name,
      symbol: coin.symbol,
      mcap: coin.circulating?.peggedUSD || 0,
      dominance: totalMcap > 0 ? ((coin.circulating?.peggedUSD || 0) / totalMcap) * 100 : 0,
    }));

    const histResponse = await fetch(`${DEFILLAMA_STABLECOINS_API}/stablecoincharts/all`);
    const histData = await histResponse.json();

    let change24h = 0;
    let change7d = 0;
    const historicalData: { date: Date; value: number }[] = [];

    if (Array.isArray(histData) && histData.length > 0) {
      const recentData = histData.slice(-30);
      historicalData.push(...recentData.map((d: { date: number; totalCirculating?: { peggedUSD: number } }) => ({
        date: new Date(d.date * 1000),
        value: d.totalCirculating?.peggedUSD || 0,
      })));
      const latest = histData[histData.length - 1]?.totalCirculating?.peggedUSD || totalMcap;
      const day1Ago = histData[histData.length - 2]?.totalCirculating?.peggedUSD || latest;
      const day7Ago = histData[histData.length - 8]?.totalCirculating?.peggedUSD || latest;
      change24h = day1Ago > 0 ? ((latest - day1Ago) / day1Ago) * 100 : 0;
      change7d = day7Ago > 0 ? ((latest - day7Ago) / day7Ago) * 100 : 0;
    }

    const result: LiquidityData = {
      totalStablecoinMcap: totalMcap,
      change24h,
      change7d,
      topStablecoins,
      historicalData,
    };
    setCache(cacheKey, result);
    return result;
  } catch {
    return {
      totalStablecoinMcap: 168500000000,
      change24h: -0.42,
      change7d: 1.23,
      topStablecoins: [
        { name: 'Tether', symbol: 'USDT', mcap: 119000000000, dominance: 70.6 },
        { name: 'USD Coin', symbol: 'USDC', mcap: 32000000000, dominance: 19.0 },
        { name: 'Dai', symbol: 'DAI', mcap: 5300000000, dominance: 3.1 },
        { name: 'First Digital USD', symbol: 'FDUSD', mcap: 2800000000, dominance: 1.7 },
        { name: 'USDD', symbol: 'USDD', mcap: 725000000, dominance: 0.4 },
      ],
      historicalData: generateMockHistoricalData(30, 168500000000),
    };
  }
}

// =============================================================================
// EIA Energy Data API
// =============================================================================

export async function fetchEnergyData(category: EnergyCategory, apiKey?: string): Promise<EnergyData> {
  // For crude-oil, use FMP live prices instead of EIA
  if (category === 'crude-oil') {
    const oil = await fetchOilSpotPrices();
    const result: EnergyData = {
      category: 'crude-oil',
      title: `Crude Oil WTI — ${oil.source === 'FMP' ? 'Live FMP' : 'Fallback'}`,
      latestValue: oil.wtiPrice,
      units: '$/bbl',
      change: oil.wtiChange,
      changePercent: oil.wtiChangePct,
      historicalData: generateMockHistoricalData(52, oil.wtiPrice),
      lastUpdated: oil.lastUpdated,
    };
    return result;
  }

  const cacheKey = `energy-${category}`;
  const cached = getCached<EnergyData>(cacheKey);
  if (cached) return cached;

  // Use caller-provided key, then module-level env key, then DEMO_KEY
  const resolvedKey = apiKey || EIA_API_KEY;
  if (!resolvedKey || resolvedKey === 'DEMO_KEY') {
    // Only use mock data if we truly have no key
    return getMockEnergyData(category);
  }

  try {
    const endpoint = getEIAEndpoint(category);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout for EIA
    const response = await fetch(
      `${EIA_API_BASE}${endpoint}?api_key=${resolvedKey}&frequency=weekly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=52`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`EIA ${category} failed: ${response.status}`);

    const data = await response.json();
    const series: EIASeriesData[] = data.response?.data || [];
    if (series.length === 0) return getMockEnergyData(category);

    const latestValue = series[0]?.value || 0;
    const previousValue = series[1]?.value || latestValue;
    const change = latestValue - previousValue;
    const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

    const result: EnergyData = {
      category,
      title: getEnergyTitle(category),
      latestValue,
      units: series[0]?.units || getDefaultUnits(category),
      change,
      changePercent,
      historicalData: series
        .filter(d => d.value !== null)
        .map(d => ({ date: new Date(d.period), value: d.value as number }))
        .reverse(),
      lastUpdated: new Date(),
    };
    setCache(cacheKey, result);
    return result;
  } catch {
    return getMockEnergyData(category);
  }
}

function getEIAEndpoint(category: EnergyCategory): string {
  switch (category) {
    case 'crude-oil':  return '/petroleum/pri/spt/data/';
    case 'natural-gas': return '/natural-gas/stor/wkly/data/';
    case 'coal':        return '/coal/shipments/by-mine-type/data/';
    case 'electricity': return '/electricity/electric_power_operational_data/data/';
    default:            return '/petroleum/pri/spt/data/';
  }
}

function getEnergyTitle(category: EnergyCategory): string {
  switch (category) {
    case 'crude-oil':   return 'Crude Oil (WTI Spot Price)';
    case 'natural-gas': return 'Natural Gas Storage';
    case 'coal':        return 'Coal Production';
    case 'electricity': return 'Electricity Generation';
    default:            return 'Energy Data';
  }
}

function getDefaultUnits(category: EnergyCategory): string {
  switch (category) {
    case 'crude-oil':   return '$/bbl';
    case 'natural-gas': return 'Bcf';
    case 'coal':        return 'thousand short tons';
    case 'electricity': return 'MWh';
    default:            return 'units';
  }
}

function getMockEnergyData(category: EnergyCategory): EnergyData {
  const mockData: Record<EnergyCategory, Omit<EnergyData, 'historicalData' | 'lastUpdated'>> = {
    'crude-oil':  { category: 'crude-oil', title: 'Crude Oil (WTI Spot Price)', latestValue: 78.42, units: '$/bbl', change: 2.15, changePercent: 2.82 },
    'natural-gas':{ category: 'natural-gas', title: 'Natural Gas Storage', latestValue: 2847, units: 'Bcf', change: -38, changePercent: -1.32 },
    'coal':       { category: 'coal', title: 'Coal Production', latestValue: 12450, units: 'thousand short tons', change: -230, changePercent: -1.81 },
    'electricity':{ category: 'electricity', title: 'Electricity Generation', latestValue: 4125000, units: 'MWh', change: 45000, changePercent: 1.10 },
  };
  const base = mockData[category];
  return { ...base, historicalData: generateMockHistoricalData(52, base.latestValue), lastUpdated: new Date() };
}

function generateMockHistoricalData(points: number, latestValue: number): { date: Date; value: number }[] {
  const data: { date: Date; value: number }[] = [];
  const now = new Date();
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const variation = (Math.random() - 0.5) * 0.1 * latestValue;
    data.push({ date, value: Math.max(0, latestValue + variation - i * latestValue * 0.001) });
  }
  return data;
}

// =============================================================================
// Correlation & Intelligence Functions
// =============================================================================

export function calculateOilLiquidityCorrelation(oilData: EnergyData, liquidityData: LiquidityData): CorrelationResult {
  const oilPriceChange = oilData.changePercent;
  const liquidityChange = liquidityData.change7d;
  const correlation = oilPriceChange * liquidityChange > 0 ? 1 : -1;

  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let warning: string | null = null;

  if (oilPriceChange > 1 && liquidityChange < -0.5) {
    signal = 'bearish';
    warning = 'INFLOW TO COMMODITIES / OUTFLOW FROM RISK ASSETS';
  } else if (oilPriceChange < -1 && liquidityChange > 0.5) {
    signal = 'bullish';
    warning = 'CAPITAL ROTATION INTO RISK ASSETS';
  }

  return { oilPriceChange, liquidityChange, correlation, signal, warning, timestamp: new Date() };
}

export function generateMarketFlowSignal(correlationResult: CorrelationResult): MarketFlowSignal {
  const { oilPriceChange, liquidityChange, warning } = correlationResult;

  const oilTrend: 'rising' | 'falling' | 'stable' =
    oilPriceChange > 1 ? 'rising' : oilPriceChange < -1 ? 'falling' : 'stable';
  const liquidityTrend: 'rising' | 'falling' | 'stable' =
    liquidityChange > 0.5 ? 'rising' : liquidityChange < -0.5 ? 'falling' : 'stable';

  let type: MarketFlowSignal['type'] = 'neutral';
  let severity: MarketFlowSignal['severity'] = 'low';
  let message = 'Markets in equilibrium. No significant capital flow detected.';

  if (oilTrend === 'rising' && liquidityTrend === 'falling') {
    type = 'inflow_commodities';
    severity = oilPriceChange > 3 ? 'critical' : oilPriceChange > 2 ? 'high' : 'medium';
    message = warning || 'Capital flowing from risk assets to commodities.';
  } else if (oilTrend === 'falling' && liquidityTrend === 'rising') {
    type = 'outflow_risk';
    severity = liquidityChange > 2 ? 'high' : 'medium';
    message = 'Capital returning to risk assets from commodities.';
  }

  return { type, severity, message, oilTrend, liquidityTrend };
}

// =============================================================================
// Utility Functions
// =============================================================================

export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9)  return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6)  return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3)  return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export function formatPercentChange(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}
