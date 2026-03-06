/**
 * Europe Sovereign Layer Service
 * Fetches data from Eurostat API and calculates sovereign risk indices
 */

import type {
  EurostatApiResponse,
  EuroCountryCode,
  EuroCountryData,
  EurozoneMacroData,
  DebtStressSignal,
  EuropeSovereignIndex,
} from '../types/europe-australia';

// Eurostat API base URL
const EUROSTAT_BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

// Dataset codes
const DATASETS = {
  GDP_GROWTH: 'namq_10_gdp', // GDP growth rate
  INFLATION: 'prc_hicp_manr', // HICP inflation
  UNEMPLOYMENT: 'une_rt_m', // Unemployment rate
  DEBT_TO_GDP: 'gov_10dd_edpt1', // Government debt
  INDUSTRIAL_PROD: 'sts_inpr_m', // Industrial production
  TRADE_BALANCE: 'bop_c6_m', // Trade balance
};

// Euro area country codes
const EURO_COUNTRIES: { code: EuroCountryCode; name: string }[] = [
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'IE', name: 'Ireland' },
];

// PIIGS countries for stress monitoring
const PIIGS_COUNTRIES: EuroCountryCode[] = ['PT', 'IT', 'IE', 'GR', 'ES'];

// German Bund yield (baseline for spread calculation)
const BUND_YIELD_BASELINE = 2.5; // Approximate current 10Y Bund yield

// Cache for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch data from Eurostat API with caching
 */
async function fetchEurostatData(
  dataset: string,
  params: Record<string, string>
): Promise<EurostatApiResponse | null> {
  const cacheKey = `${dataset}-${JSON.stringify(params)}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as EurostatApiResponse;
  }

  try {
    const queryParams = new URLSearchParams({
      format: 'JSON',
      lang: 'EN',
      ...params,
    });

    const response = await fetch(`${EUROSTAT_BASE}/${dataset}?${queryParams}`);
    
    if (!response.ok) {
      console.error(`[Eurostat] Failed to fetch ${dataset}:`, response.status);
      return null;
    }

    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(`[Eurostat] Error fetching ${dataset}:`, error);
    return null;
  }
}

/**
 * Extract latest value for a country from Eurostat response
 */
function extractLatestValue(
  response: EurostatApiResponse | null,
  countryCode: string
): number | null {
  if (!response || !response.value) return null;

  const geoIndex = response.dimension?.geo?.category?.index;
  const timeIndex = response.dimension?.time?.category?.index;
  
  if (!geoIndex || !timeIndex) return null;

  const countryIdx = geoIndex[countryCode];
  if (countryIdx === undefined) return null;

  // Get latest time period
  const timePeriods = Object.keys(timeIndex);
  const latestTime = timePeriods[timePeriods.length - 1];
  const timeIdx = timeIndex[latestTime];

  // Calculate value index (assuming 2D: geo x time)
  const numTimes = Object.keys(timeIndex).length;
  const valueIdx = countryIdx * numTimes + timeIdx;

  return response.value[valueIdx] ?? null;
}

/**
 * Fetch comprehensive Eurozone macro data
 */
export async function fetchEurozoneMacroData(): Promise<EurozoneMacroData> {
  const timestamp = new Date().toISOString();
  
  // Fetch all datasets in parallel
  const [gdpData, inflationData, unemploymentData] = await Promise.all([
    fetchEurostatData(DATASETS.GDP_GROWTH, {
      geo: EURO_COUNTRIES.map(c => c.code).join(','),
      unit: 'CLV_PCH_PRE',
      s_adj: 'SCA',
      na_item: 'B1GQ',
    }),
    fetchEurostatData(DATASETS.INFLATION, {
      geo: EURO_COUNTRIES.map(c => c.code).join(','),
      coicop: 'CP00',
    }),
    fetchEurostatData(DATASETS.UNEMPLOYMENT, {
      geo: EURO_COUNTRIES.map(c => c.code).join(','),
      s_adj: 'SA',
      age: 'TOTAL',
      sex: 'T',
      unit: 'PC_ACT',
    }),
  ]);

  // Build country data
  const countries: EuroCountryData[] = EURO_COUNTRIES.map(({ code, name }) => ({
    code,
    name,
    gdp_growth: extractLatestValue(gdpData, code),
    inflation_rate: extractLatestValue(inflationData, code),
    unemployment_rate: extractLatestValue(unemploymentData, code),
    debt_to_gdp: getSimulatedDebtToGDP(code),
    bond_yield_10y: getSimulatedBondYield(code),
    trade_balance: null,
    industrial_production: null,
    consumer_confidence: null,
  }));

  // Calculate aggregates
  const validGDP = countries.filter(c => c.gdp_growth !== null);
  const validInflation = countries.filter(c => c.inflation_rate !== null);
  const validUnemployment = countries.filter(c => c.unemployment_rate !== null);

  const aggregates = {
    avg_gdp_growth: validGDP.length > 0
      ? validGDP.reduce((sum, c) => sum + c.gdp_growth!, 0) / validGDP.length
      : 0,
    avg_inflation: validInflation.length > 0
      ? validInflation.reduce((sum, c) => sum + c.inflation_rate!, 0) / validInflation.length
      : 0,
    avg_unemployment: validUnemployment.length > 0
      ? validUnemployment.reduce((sum, c) => sum + c.unemployment_rate!, 0) / validUnemployment.length
      : 0,
    total_trade_balance: 0,
  };

  return {
    timestamp,
    countries,
    aggregates,
    ecb_rate: 4.0, // Current ECB rate
    euro_usd: 1.08, // Approximate EUR/USD
  };
}

/**
 * Simulated debt-to-GDP ratios (would come from Eurostat in production)
 */
function getSimulatedDebtToGDP(code: EuroCountryCode): number {
  const debtRatios: Record<EuroCountryCode, number> = {
    DE: 64.8,
    FR: 111.6,
    IT: 137.3,
    ES: 107.7,
    NL: 46.5,
    BE: 105.2,
    AT: 77.8,
    PT: 112.4,
    GR: 161.9,
    IE: 44.7,
  };
  return debtRatios[code] ?? 80;
}

/**
 * Simulated 10Y bond yields (would come from ECB/market data in production)
 */
function getSimulatedBondYield(code: EuroCountryCode): number {
  const yields: Record<EuroCountryCode, number> = {
    DE: 2.45,  // Bund (baseline)
    FR: 3.05,
    IT: 3.85,
    ES: 3.35,
    NL: 2.75,
    BE: 3.15,
    AT: 2.95,
    PT: 3.25,
    GR: 3.65,
    IE: 2.85,
  };
  return yields[code] ?? 3.0;
}

/**
 * Calculate debt stress signals for PIIGS countries
 */
export function calculateDebtStressSignals(data: EurozoneMacroData): DebtStressSignal[] {
  const bundYield = data.countries.find(c => c.code === 'DE')?.bond_yield_10y ?? BUND_YIELD_BASELINE;
  
  return data.countries
    .filter(c => PIIGS_COUNTRIES.includes(c.code))
    .map(country => {
      const spread = (country.bond_yield_10y ?? 3.0) - bundYield;
      const debtToGDP = country.debt_to_gdp ?? 100;
      
      // Calculate stress level based on spread and debt
      let stress_level: DebtStressSignal['stress_level'] = 'LOW';
      if (spread > 3.0 || debtToGDP > 150) {
        stress_level = 'CRITICAL';
      } else if (spread > 2.0 || debtToGDP > 130) {
        stress_level = 'HIGH';
      } else if (spread > 1.0 || debtToGDP > 110) {
        stress_level = 'ELEVATED';
      }

      // Generate signal message
      let signal_message = `${country.name}: Spread ${spread.toFixed(0)}bps vs Bund`;
      if (stress_level === 'CRITICAL') {
        signal_message = `ALERT: ${country.name} debt crisis risk - Spread ${(spread * 100).toFixed(0)}bps, Debt ${debtToGDP.toFixed(1)}% GDP`;
      } else if (stress_level === 'HIGH') {
        signal_message = `WARNING: ${country.name} elevated stress - Monitor closely`;
      }

      return {
        country_code: country.code,
        country_name: country.name,
        spread_vs_bund: spread * 100, // Convert to basis points
        debt_to_gdp: debtToGDP,
        stress_level,
        signal_message,
        timestamp: data.timestamp,
      };
    })
    .sort((a, b) => {
      const severityOrder = { CRITICAL: 0, HIGH: 1, ELEVATED: 2, LOW: 3 };
      return severityOrder[a.stress_level] - severityOrder[b.stress_level];
    });
}

/**
 * Calculate Europe Sovereign Index
 * Combines debt stress, growth momentum, inflation pressure, and ECB policy
 */
export function calculateEuropeSovereignIndex(
  data: EurozoneMacroData,
  debtSignals: DebtStressSignal[]
): EuropeSovereignIndex {
  // Component 1: Debt Stress (0-100, lower is better)
  const avgSpread = debtSignals.reduce((sum, s) => sum + s.spread_vs_bund, 0) / debtSignals.length;
  const debtStress = Math.min(100, Math.max(0, avgSpread / 3)); // Normalize to 0-100

  // Component 2: Growth Momentum (0-100, higher is better)
  const gdpGrowth = data.aggregates.avg_gdp_growth;
  const growthMomentum = Math.min(100, Math.max(0, (gdpGrowth + 2) * 20)); // -2% to 3% range

  // Component 3: Inflation Pressure (0-100, lower is better)
  const inflation = data.aggregates.avg_inflation;
  const inflationPressure = Math.min(100, Math.max(0, (inflation - 2) * 15)); // 2% target

  // Component 4: ECB Policy (0-100)
  const ecbRate = data.ecb_rate ?? 4.0;
  const ecbPolicy = Math.min(100, Math.max(0, ecbRate * 15)); // Higher rate = tighter policy

  // Overall index (weighted average, inverted so higher = more risk)
  const overallRisk = (debtStress * 0.35) + ((100 - growthMomentum) * 0.25) + 
                      (inflationPressure * 0.25) + (ecbPolicy * 0.15);

  // Check for PIIGS alert
  const piigs_alert = debtSignals.some(s => 
    s.stress_level === 'CRITICAL' || s.stress_level === 'HIGH'
  );

  // Determine trend
  let trend: EuropeSovereignIndex['trend'] = 'STABLE';
  if (gdpGrowth > 1 && inflation < 3) trend = 'IMPROVING';
  if (gdpGrowth < 0 || avgSpread > 200) trend = 'DETERIORATING';

  return {
    value: Math.round(overallRisk),
    trend,
    components: {
      debt_stress: Math.round(debtStress),
      growth_momentum: Math.round(growthMomentum),
      inflation_pressure: Math.round(inflationPressure),
      ecb_policy: Math.round(ecbPolicy),
    },
    piigs_alert,
    timestamp: data.timestamp,
  };
}

/**
 * Get country flag emoji
 */
export function getCountryFlag(code: EuroCountryCode): string {
  const flags: Record<EuroCountryCode, string> = {
    DE: '🇩🇪',
    FR: '🇫🇷',
    IT: '🇮🇹',
    ES: '🇪🇸',
    NL: '🇳🇱',
    BE: '🇧🇪',
    AT: '🇦🇹',
    PT: '🇵🇹',
    GR: '🇬🇷',
    IE: '🇮🇪',
  };
  return flags[code] ?? '🇪🇺';
}

/**
 * Get stress level color class
 */
export function getStressLevelColor(level: DebtStressSignal['stress_level']): string {
  switch (level) {
    case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/30';
    case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    case 'ELEVATED': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    case 'LOW': return 'text-green-400 bg-green-400/10 border-green-400/30';
  }
}
