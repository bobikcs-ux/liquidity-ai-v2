/**
 * Australia Macro Layer Service
 * Fetches data from RBA API and ABS, calculates China exposure index
 */

import type {
  AustraliaMacroData,
  ChinaExposureIndex,
  AustraliaSovereignIndex,
} from '../types/europe-australia';

// RBA API endpoints
const RBA_BASE = 'https://api.rba.gov.au';
const ABS_BASE = 'https://api.abs.gov.au';

// Cache for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch RBA cash rate and economic data
 */
async function fetchRBAData(): Promise<{
  cash_rate: number;
  inflation: number | null;
}> {
  const cacheKey = 'rba-data';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as { cash_rate: number; inflation: number | null };
  }

  try {
    // RBA provides cash rate via their statistical tables
    // Using simulated data for now - would integrate with actual RBA API
    const data = {
      cash_rate: 4.35, // Current RBA cash rate
      inflation: 4.1,  // Latest CPI YoY
    };
    
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('[RBA] Error fetching data:', error);
    return { cash_rate: 4.35, inflation: null };
  }
}

/**
 * Fetch commodity prices (Iron Ore, Coal, LNG)
 */
async function fetchCommodityPrices(): Promise<{
  iron_ore: number;
  coal: number;
  lng: number;
}> {
  const cacheKey = 'commodity-prices';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as { iron_ore: number; coal: number; lng: number };
  }

  // Would integrate with commodity data provider (e.g., Quandl, Trading Economics)
  // Using representative values
  const data = {
    iron_ore: 108.5,  // USD/tonne
    coal: 135.2,      // USD/tonne
    lng: 12.8,        // USD/MMBtu
  };

  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Fetch comprehensive Australia macro data
 */
export async function fetchAustraliaMacroData(): Promise<AustraliaMacroData> {
  const timestamp = new Date().toISOString();
  
  const [rbaData, commodities] = await Promise.all([
    fetchRBAData(),
    fetchCommodityPrices(),
  ]);

  // Comprehensive macro data (would come from ABS in production)
  return {
    timestamp,
    gdp_growth: 1.5,           // YoY GDP growth
    inflation_rate: rbaData.inflation,
    unemployment_rate: 4.1,     // Latest unemployment
    rba_cash_rate: rbaData.cash_rate,
    aud_usd: 0.65,             // AUD/USD exchange rate
    iron_ore_price: commodities.iron_ore,
    coal_price: commodities.coal,
    trade_balance: 12.8,       // Billion AUD
    housing_index: 168.5,      // Housing price index
    consumer_confidence: 82.4, // Westpac-MI Consumer Sentiment
    business_confidence: 4,    // NAB Business Confidence
  };
}

/**
 * Calculate China Exposure Index
 * Measures Australia's economic dependency on China
 */
export function calculateChinaExposureIndex(
  data: AustraliaMacroData
): ChinaExposureIndex {
  // Trade dependency: China accounts for ~30-35% of Australia's exports
  const trade_dependency = 32.5; // Percentage
  
  // Iron ore reliance: ~80% of iron ore exports go to China
  const iron_ore_reliance = 82.3;
  
  // Education services: Chinese students as % of international students
  const education_services = 28.4;
  
  // Tourism exposure: Chinese tourists as % of inbound tourism spend
  const tourism_exposure = 15.2;

  // Calculate overall exposure index (0-100)
  const value = Math.round(
    (trade_dependency * 0.40) +
    (iron_ore_reliance * 0.35) +
    (education_services * 0.15) +
    (tourism_exposure * 0.10)
  );

  // Determine risk level
  let risk_level: ChinaExposureIndex['risk_level'] = 'LOW';
  if (value > 60) risk_level = 'CRITICAL';
  else if (value > 45) risk_level = 'HIGH';
  else if (value > 30) risk_level = 'MODERATE';

  // Trend based on recent trade patterns
  const trend: ChinaExposureIndex['trend'] = 'STABLE'; // Would calculate from historical data

  return {
    value,
    trend,
    components: {
      trade_dependency,
      iron_ore_reliance,
      education_services,
      tourism_exposure,
    },
    risk_level,
  };
}

/**
 * Calculate commodity shock risk
 */
function calculateCommodityShockRisk(data: AustraliaMacroData): number {
  // Risk factors:
  // 1. Iron ore price volatility
  // 2. Coal demand outlook (energy transition)
  // 3. Trade balance dependency on commodities

  const ironOreRisk = data.iron_ore_price < 100 ? 70 : data.iron_ore_price < 120 ? 40 : 20;
  const coalRisk = 60; // Energy transition risk
  const balanceRisk = data.trade_balance > 0 ? 30 : 60;

  return Math.round((ironOreRisk * 0.5) + (coalRisk * 0.3) + (balanceRisk * 0.2));
}

/**
 * Calculate housing market risk
 */
function calculateHousingRisk(data: AustraliaMacroData): number {
  // High housing prices + high rates = elevated risk
  const priceRisk = data.housing_index > 160 ? 70 : data.housing_index > 140 ? 50 : 30;
  const rateRisk = (data.rba_cash_rate ?? 4) * 12; // Higher rates = higher risk
  
  return Math.min(100, Math.round((priceRisk * 0.6) + (rateRisk * 0.4)));
}

/**
 * Calculate Australia Sovereign Index
 */
export function calculateAustraliaSovereignIndex(
  data: AustraliaMacroData,
  chinaExposure: ChinaExposureIndex
): AustraliaSovereignIndex {
  // Component 1: Commodities (0-100)
  const commoditiesRisk = calculateCommodityShockRisk(data);

  // Component 2: China Exposure (0-100)
  const chinaRisk = chinaExposure.value;

  // Component 3: Housing Risk (0-100)
  const housingRisk = calculateHousingRisk(data);

  // Component 4: RBA Policy (0-100)
  const rbaPolicy = Math.min(100, (data.rba_cash_rate ?? 4) * 18);

  // Overall index (weighted)
  const overallRisk = (commoditiesRisk * 0.30) + (chinaRisk * 0.30) + 
                      (housingRisk * 0.25) + (rbaPolicy * 0.15);

  // Alerts
  const commodity_shock_alert = commoditiesRisk > 60;
  const china_decoupling_alert = chinaExposure.risk_level === 'CRITICAL' || 
                                  chinaExposure.risk_level === 'HIGH';

  // Trend
  let trend: AustraliaSovereignIndex['trend'] = 'STABLE';
  if (data.gdp_growth > 2 && data.unemployment_rate < 4) trend = 'IMPROVING';
  if (data.gdp_growth < 0.5 || data.unemployment_rate > 5) trend = 'DETERIORATING';

  return {
    value: Math.round(overallRisk),
    trend,
    components: {
      commodities: commoditiesRisk,
      china_exposure: chinaRisk,
      housing_risk: housingRisk,
      rba_policy: rbaPolicy,
    },
    commodity_shock_alert,
    china_decoupling_alert,
    timestamp: data.timestamp,
  };
}

/**
 * Get risk level color class
 */
export function getRiskLevelColor(level: ChinaExposureIndex['risk_level']): string {
  switch (level) {
    case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/30';
    case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    case 'MODERATE': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    case 'LOW': return 'text-green-400 bg-green-400/10 border-green-400/30';
  }
}

/**
 * Format AUD value
 */
export function formatAUD(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);
}
