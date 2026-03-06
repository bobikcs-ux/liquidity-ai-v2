// =============================================================================
// Energy-Finance Data Service
// Fetches data from DefiLlama (Stablecoins) and EIA (Energy)
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

// Cache for API responses (30 second TTL)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000;

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// =============================================================================
// DefiLlama Stablecoins API - Dollar Liquidity Tracking
// =============================================================================

export async function fetchStablecoins(): Promise<LiquidityData> {
  const cacheKey = 'stablecoins';
  const cached = getCached<LiquidityData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${DEFILLAMA_STABLECOINS_API}/stablecoins?includePrices=true`);
    if (!response.ok) throw new Error('Failed to fetch stablecoins');
    
    const data: StablecoinsResponse = await response.json();
    
    // Calculate total stablecoin market cap
    const totalMcap = data.peggedAssets.reduce((sum, coin) => {
      return sum + (coin.circulating?.peggedUSD || 0);
    }, 0);

    // Get top 5 stablecoins by market cap
    const sorted = [...data.peggedAssets]
      .sort((a, b) => (b.circulating?.peggedUSD || 0) - (a.circulating?.peggedUSD || 0))
      .slice(0, 5);

    const topStablecoins = sorted.map(coin => ({
      name: coin.name,
      symbol: coin.symbol,
      mcap: coin.circulating?.peggedUSD || 0,
      dominance: totalMcap > 0 ? ((coin.circulating?.peggedUSD || 0) / totalMcap) * 100 : 0,
    }));

    // Fetch historical data for change calculations
    const histResponse = await fetch(`${DEFILLAMA_STABLECOINS_API}/stablecoincharts/all`);
    const histData = await histResponse.json();
    
    let change24h = 0;
    let change7d = 0;
    const historicalData: { date: Date; value: number }[] = [];

    if (Array.isArray(histData) && histData.length > 0) {
      // Process historical data
      const recentData = histData.slice(-30); // Last 30 days
      historicalData.push(...recentData.map((d: { date: number; totalCirculating?: { peggedUSD: number } }) => ({
        date: new Date(d.date * 1000),
        value: d.totalCirculating?.peggedUSD || 0,
      })));

      // Calculate changes
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
  } catch (error) {
    console.error('[energyFinanceService] Error fetching stablecoins:', error);
    // Return mock data on error
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

export async function fetchEnergyData(
  category: EnergyCategory,
  apiKey?: string
): Promise<EnergyData> {
  const cacheKey = `energy-${category}`;
  const cached = getCached<EnergyData>(cacheKey);
  if (cached) return cached;

  // EIA API requires an API key - use mock data if not provided
  if (!apiKey) {
    return getMockEnergyData(category);
  }

  try {
    const endpoint = getEIAEndpoint(category);
    const response = await fetch(`${EIA_API_BASE}${endpoint}?api_key=${apiKey}&frequency=weekly&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=52`);
    
    if (!response.ok) throw new Error(`Failed to fetch ${category} data`);
    
    const data = await response.json();
    const series: EIASeriesData[] = data.response?.data || [];
    
    if (series.length === 0) {
      return getMockEnergyData(category);
    }

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
        .map(d => ({
          date: new Date(d.period),
          value: d.value as number,
        }))
        .reverse(),
      lastUpdated: new Date(),
    };

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[energyFinanceService] Error fetching ${category} data:`, error);
    return getMockEnergyData(category);
  }
}

function getEIAEndpoint(category: EnergyCategory): string {
  switch (category) {
    case 'crude-oil':
      return '/petroleum/pri/spt/data/';
    case 'natural-gas':
      return '/natural-gas/stor/wkly/data/';
    case 'coal':
      return '/coal/shipments/by-mine-type/data/';
    case 'electricity':
      return '/electricity/electric_power_operational_data/data/';
    default:
      return '/petroleum/pri/spt/data/';
  }
}

function getEnergyTitle(category: EnergyCategory): string {
  switch (category) {
    case 'crude-oil':
      return 'Crude Oil (WTI Spot Price)';
    case 'natural-gas':
      return 'Natural Gas Storage';
    case 'coal':
      return 'Coal Production';
    case 'electricity':
      return 'Electricity Generation';
    default:
      return 'Energy Data';
  }
}

function getDefaultUnits(category: EnergyCategory): string {
  switch (category) {
    case 'crude-oil':
      return '$/bbl';
    case 'natural-gas':
      return 'Bcf';
    case 'coal':
      return 'thousand short tons';
    case 'electricity':
      return 'MWh';
    default:
      return 'units';
  }
}

function getMockEnergyData(category: EnergyCategory): EnergyData {
  const mockData: Record<EnergyCategory, Omit<EnergyData, 'historicalData' | 'lastUpdated'>> = {
    'crude-oil': {
      category: 'crude-oil',
      title: 'Crude Oil (WTI Spot Price)',
      latestValue: 78.42,
      units: '$/bbl',
      change: 2.15,
      changePercent: 2.82,
    },
    'natural-gas': {
      category: 'natural-gas',
      title: 'Natural Gas Storage',
      latestValue: 2847,
      units: 'Bcf',
      change: -38,
      changePercent: -1.32,
    },
    'coal': {
      category: 'coal',
      title: 'Coal Production',
      latestValue: 12450,
      units: 'thousand short tons',
      change: -230,
      changePercent: -1.81,
    },
    'electricity': {
      category: 'electricity',
      title: 'Electricity Generation',
      latestValue: 4125000,
      units: 'MWh',
      change: 45000,
      changePercent: 1.10,
    },
  };

  const base = mockData[category];
  return {
    ...base,
    historicalData: generateMockHistoricalData(52, base.latestValue),
    lastUpdated: new Date(),
  };
}

function generateMockHistoricalData(points: number, latestValue: number): { date: Date; value: number }[] {
  const data: { date: Date; value: number }[] = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    
    // Add some random variation
    const variation = (Math.random() - 0.5) * 0.1 * latestValue;
    const value = latestValue + variation - (i * latestValue * 0.001);
    
    data.push({ date, value: Math.max(0, value) });
  }
  
  return data;
}

// =============================================================================
// Correlation & Intelligence Functions
// =============================================================================

/**
 * Calculates correlation between Oil Price changes and Liquidity Momentum
 * Returns a signal when oil is rising and liquidity is falling
 */
export function calculateOilLiquidityCorrelation(
  oilData: EnergyData,
  liquidityData: LiquidityData
): CorrelationResult {
  // Get percentage changes
  const oilPriceChange = oilData.changePercent;
  const liquidityChange = liquidityData.change7d;

  // Calculate simple correlation indicator
  // Negative correlation = oil up, liquidity down (or vice versa)
  const correlation = oilPriceChange * liquidityChange > 0 ? 1 : -1;

  // Determine signal
  let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let warning: string | null = null;

  if (oilPriceChange > 1 && liquidityChange < -0.5) {
    // Oil rising significantly, liquidity falling
    signal = 'bearish';
    warning = 'INFLOW TO COMMODITIES / OUTFLOW FROM RISK ASSETS';
  } else if (oilPriceChange < -1 && liquidityChange > 0.5) {
    // Oil falling, liquidity rising
    signal = 'bullish';
    warning = 'CAPITAL ROTATION INTO RISK ASSETS';
  }

  return {
    oilPriceChange,
    liquidityChange,
    correlation,
    signal,
    warning,
    timestamp: new Date(),
  };
}

/**
 * Generates a market flow signal based on oil and liquidity trends
 */
export function generateMarketFlowSignal(
  correlationResult: CorrelationResult
): MarketFlowSignal {
  const { oilPriceChange, liquidityChange, warning } = correlationResult;

  // Determine trends
  const oilTrend: 'rising' | 'falling' | 'stable' = 
    oilPriceChange > 1 ? 'rising' : oilPriceChange < -1 ? 'falling' : 'stable';
  
  const liquidityTrend: 'rising' | 'falling' | 'stable' = 
    liquidityChange > 0.5 ? 'rising' : liquidityChange < -0.5 ? 'falling' : 'stable';

  // Generate signal
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

  return {
    type,
    severity,
    message,
    oilTrend,
    liquidityTrend,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export function formatPercentChange(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}
