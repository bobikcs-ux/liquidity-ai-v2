/**
 * BRICS Intelligence Service
 * Fetches GDP data from World Bank API and calculates geoeconomic indicators
 */

import type {
  BRICSCountry,
  BRICSCountryData,
  BRICSAggregateData,
  BRICSMomentum,
  GeoeconomicPowerShift,
  BRICSIntelligence,
  BRICSSignal,
  USEconomicData,
  WorldBankGDPDataPoint,
  BRICSChartPoint,
  BRICS_COUNTRIES,
} from '../types/brics';

const WORLD_BANK_BASE_URL = 'https://api.worldbank.org/v2';

// BRICS country codes for World Bank API
const BRICS_CODES: BRICSCountry[] = ['BRA', 'RUS', 'IND', 'CHN', 'ZAF'];

// Cache for API responses (5 minute TTL)
let dataCache: { data: BRICSIntelligence; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Fetch GDP data from World Bank API
 */
async function fetchWorldBankGDP(
  countryCodes: string[],
  indicator: string,
  startYear: number = 2000
): Promise<WorldBankGDPDataPoint[]> {
  const countries = countryCodes.join(';');
  const url = `${WORLD_BANK_BASE_URL}/country/${countries}/indicator/${indicator}?format=json&date=${startYear}:2024&per_page=500`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`World Bank API error: ${response.status}`);
    }
    
    const data = await response.json();
    // World Bank returns [metadata, data] array
    return data[1] || [];
  } catch (error) {
    console.error('[BRICS] World Bank API fetch error:', error);
    return [];
  }
}

/**
 * Parse World Bank data into BRICS country data
 */
function parseCountryData(
  gdpData: WorldBankGDPDataPoint[],
  growthData: WorldBankGDPDataPoint[],
  year: string
): BRICSCountryData[] {
  const countryNames: Record<BRICSCountry, string> = {
    BRA: 'Brazil',
    RUS: 'Russia',
    IND: 'India',
    CHN: 'China',
    ZAF: 'South Africa',
  };

  return BRICS_CODES.map((code) => {
    const gdpPoint = gdpData.find(
      (d) => d.countryiso3code === code && d.date === year
    );
    const growthPoint = growthData.find(
      (d) => d.countryiso3code === code && d.date === year
    );

    return {
      country: code,
      countryName: countryNames[code] as any,
      gdpCurrentUSD: gdpPoint?.value ?? null,
      gdpGrowth: growthPoint?.value ?? null,
      gdpPerCapita: null,
      year,
    };
  });
}

/**
 * Calculate BRICS Momentum
 * Formula: (BRA_growth + RUS_growth + IND_growth) / 3
 */
export function calculateBRICSMomentum(
  countries: BRICSCountryData[],
  usGrowth: number,
  year: string
): BRICSMomentum {
  const brazil = countries.find((c) => c.country === 'BRA');
  const russia = countries.find((c) => c.country === 'RUS');
  const india = countries.find((c) => c.country === 'IND');

  const braGrowth = brazil?.gdpGrowth ?? 0;
  const rusGrowth = russia?.gdpGrowth ?? 0;
  const indGrowth = india?.gdpGrowth ?? 0;

  // BRICS Momentum = average of BRA, RUS, IND growth rates
  const momentum = (braGrowth + rusGrowth + indGrowth) / 3;

  return {
    momentum,
    braGrowth,
    rusGrowth,
    indGrowth,
    usGrowth,
    momentumDelta: momentum - usGrowth,
    year,
  };
}

/**
 * Calculate Geoeconomic Power Shift
 * Formula: BRICS GDP / US GDP
 */
export function calculatePowerShift(
  bricsGDP: number,
  usGDP: number,
  historicalData: { year: string; bricsGDP: number; usGDP: number }[]
): GeoeconomicPowerShift {
  const ratio = usGDP > 0 ? bricsGDP / usGDP : 0;

  // Calculate historical ratios
  const history = historicalData
    .map((d) => ({
      year: d.year,
      ratio: d.usGDP > 0 ? d.bricsGDP / d.usGDP : 0,
    }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));

  // Calculate year-over-year change
  const previousYearRatio = history.length > 1 ? history[history.length - 2].ratio : ratio;
  const ratioChange = ratio - previousYearRatio;

  // Calculate velocity (5-year average change)
  let velocity = 0;
  if (history.length >= 5) {
    const recentHistory = history.slice(-5);
    const changes = recentHistory.slice(1).map((h, i) => h.ratio - recentHistory[i].ratio);
    velocity = changes.reduce((a, b) => a + b, 0) / changes.length;
  }

  // Determine trend
  let trend: 'EAST_RISING' | 'WEST_HOLDING' | 'EQUILIBRIUM' = 'EQUILIBRIUM';
  if (velocity > 0.02) {
    trend = 'EAST_RISING';
  } else if (velocity < -0.02) {
    trend = 'WEST_HOLDING';
  }

  return {
    bricsToUSRatio: ratio,
    ratioChange,
    trend,
    velocity,
    history,
    year: history.length > 0 ? history[history.length - 1].year : new Date().getFullYear().toString(),
  };
}

/**
 * Generate BRICS Intelligence Signals
 */
function generateSignals(
  momentum: BRICSMomentum,
  powerShift: GeoeconomicPowerShift
): BRICSSignal[] {
  const signals: BRICSSignal[] = [];
  const now = new Date().toISOString();

  // Momentum Divergence Signal
  if (Math.abs(momentum.momentumDelta) > 2) {
    signals.push({
      id: `momentum-${Date.now()}`,
      type: 'MOMENTUM_DIVERGENCE',
      severity: momentum.momentumDelta > 3 ? 'HIGH' : 'MEDIUM',
      title: momentum.momentumDelta > 0 ? 'BRICS Outperforming US' : 'US Outperforming BRICS',
      description: `BRICS momentum is ${Math.abs(momentum.momentumDelta).toFixed(1)}% ${
        momentum.momentumDelta > 0 ? 'above' : 'below'
      } US GDP growth`,
      value: momentum.momentumDelta,
      threshold: 2,
      timestamp: now,
    });
  }

  // Power Shift Acceleration Signal
  if (powerShift.velocity > 0.03) {
    signals.push({
      id: `powershift-${Date.now()}`,
      type: 'POWER_SHIFT_ACCELERATION',
      severity: powerShift.velocity > 0.05 ? 'CRITICAL' : 'HIGH',
      title: 'Geoeconomic Power Shift Accelerating',
      description: `BRICS/US GDP ratio growing at ${(powerShift.velocity * 100).toFixed(1)}% annually`,
      value: powerShift.velocity,
      threshold: 0.03,
      timestamp: now,
    });
  }

  // BRICS Dominance Signal
  if (powerShift.bricsToUSRatio > 1.5) {
    signals.push({
      id: `dominance-${Date.now()}`,
      type: 'DEDOLLARIZATION',
      severity: powerShift.bricsToUSRatio > 2 ? 'CRITICAL' : 'HIGH',
      title: 'BRICS Economic Dominance',
      description: `Combined BRICS GDP is ${powerShift.bricsToUSRatio.toFixed(2)}x US GDP`,
      value: powerShift.bricsToUSRatio,
      threshold: 1.5,
      timestamp: now,
    });
  }

  return signals;
}

/**
 * Fetch complete BRICS Intelligence data
 */
export async function fetchBRICSIntelligence(): Promise<BRICSIntelligence> {
  // Check cache
  if (dataCache && Date.now() - dataCache.timestamp < CACHE_TTL) {
    return dataCache.data;
  }

  try {
    // Fetch GDP and growth data for BRICS + USA
    const [bricsGDP, bricsGrowth, usGDP, usGrowth] = await Promise.all([
      fetchWorldBankGDP(BRICS_CODES, 'NY.GDP.MKTP.CD', 2000),
      fetchWorldBankGDP(BRICS_CODES, 'NY.GDP.MKTP.KD.ZG', 2000),
      fetchWorldBankGDP(['USA'], 'NY.GDP.MKTP.CD', 2000),
      fetchWorldBankGDP(['USA'], 'NY.GDP.MKTP.KD.ZG', 2000),
    ]);

    // Find most recent year with complete data
    const years = [...new Set(bricsGDP.filter(d => d.value !== null).map((d) => d.date))].sort().reverse();
    const latestYear = years[0] || '2023';

    // Parse country data
    const countries = parseCountryData(bricsGDP, bricsGrowth, latestYear);

    // Calculate aggregate BRICS GDP
    const totalGDP = countries.reduce((sum, c) => sum + (c.gdpCurrentUSD ?? 0), 0);
    const validGrowthCountries = countries.filter((c) => c.gdpGrowth !== null);
    const averageGrowth =
      validGrowthCountries.length > 0
        ? validGrowthCountries.reduce((sum, c) => sum + (c.gdpGrowth ?? 0), 0) / validGrowthCountries.length
        : 0;

    const aggregate: BRICSAggregateData = {
      totalGDP,
      averageGrowth,
      countries,
      year: latestYear,
      lastUpdated: new Date().toISOString(),
    };

    // Get US data
    const usGDPValue = usGDP.find((d) => d.date === latestYear)?.value ?? 0;
    const usGrowthValue = usGrowth.find((d) => d.date === latestYear)?.value ?? 0;

    const usData: USEconomicData = {
      gdpCurrentUSD: usGDPValue,
      gdpGrowth: usGrowthValue,
      year: latestYear,
    };

    // Calculate BRICS Momentum
    const momentum = calculateBRICSMomentum(countries, usGrowthValue, latestYear);

    // Build historical data for power shift calculation
    const historicalData = years.slice(0, 20).map((year) => {
      const yearBricsGDP = BRICS_CODES.reduce((sum, code) => {
        const point = bricsGDP.find((d) => d.countryiso3code === code && d.date === year);
        return sum + (point?.value ?? 0);
      }, 0);
      const yearUSGDP = usGDP.find((d) => d.date === year)?.value ?? 0;
      return { year, bricsGDP: yearBricsGDP, usGDP: yearUSGDP };
    });

    // Calculate Power Shift
    const powerShift = calculatePowerShift(totalGDP, usGDPValue, historicalData);

    // Generate signals
    const signals = generateSignals(momentum, powerShift);

    const intelligence: BRICSIntelligence = {
      momentum,
      powerShift,
      aggregate,
      usData,
      signals,
      lastUpdated: new Date().toISOString(),
    };

    // Update cache
    dataCache = { data: intelligence, timestamp: Date.now() };

    return intelligence;
  } catch (error) {
    console.error('[BRICS] Error fetching intelligence:', error);
    
    // Return fallback data
    return getFallbackData();
  }
}

/**
 * Get chart data for visualization
 */
export function getBRICSChartData(intelligence: BRICSIntelligence): BRICSChartPoint[] {
  return intelligence.powerShift.history.map((h) => ({
    year: h.year,
    bricsGDP: 0, // Would need to store this in history
    usGDP: 0,
    ratio: h.ratio,
    bricsMomentum: 0,
    usGrowth: 0,
  }));
}

/**
 * Fallback data when API fails
 */
function getFallbackData(): BRICSIntelligence {
  const now = new Date().toISOString();
  
  return {
    momentum: {
      momentum: 4.2,
      braGrowth: 2.9,
      rusGrowth: 3.6,
      indGrowth: 6.1,
      usGrowth: 2.5,
      momentumDelta: 1.7,
      year: '2023',
    },
    powerShift: {
      bricsToUSRatio: 1.26,
      ratioChange: 0.03,
      trend: 'EAST_RISING',
      velocity: 0.025,
      history: [
        { year: '2019', ratio: 1.15 },
        { year: '2020', ratio: 1.18 },
        { year: '2021', ratio: 1.21 },
        { year: '2022', ratio: 1.23 },
        { year: '2023', ratio: 1.26 },
      ],
      year: '2023',
    },
    aggregate: {
      totalGDP: 28500000000000,
      averageGrowth: 4.2,
      countries: [
        { country: 'BRA', countryName: 'Brazil', gdpCurrentUSD: 2100000000000, gdpGrowth: 2.9, gdpPerCapita: null, year: '2023' },
        { country: 'RUS', countryName: 'Russia', gdpCurrentUSD: 1900000000000, gdpGrowth: 3.6, gdpPerCapita: null, year: '2023' },
        { country: 'IND', countryName: 'India', gdpCurrentUSD: 3700000000000, gdpGrowth: 6.1, gdpPerCapita: null, year: '2023' },
        { country: 'CHN', countryName: 'China', gdpCurrentUSD: 18000000000000, gdpGrowth: 5.2, gdpPerCapita: null, year: '2023' },
        { country: 'ZAF', countryName: 'South Africa', gdpCurrentUSD: 400000000000, gdpGrowth: 0.9, gdpPerCapita: null, year: '2023' },
      ],
      year: '2023',
      lastUpdated: now,
    },
    usData: {
      gdpCurrentUSD: 25500000000000,
      gdpGrowth: 2.5,
      year: '2023',
    },
    signals: [],
    lastUpdated: now,
  };
}
