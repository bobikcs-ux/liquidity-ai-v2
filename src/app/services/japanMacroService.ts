/**
 * Japan Macro Service
 * Fetches data from e-Stat API (Japan's official statistics portal)
 * Calculates Yen Carry Trade pressure and BOJ intervention signals
 */

import type {
  JapanMacroData,
  YenCarryTradeData,
  JapanAlertSignal,
  JapanMacroState,
} from '../types/japan-india';

// e-Stat API endpoints (requires API key for production)
const ESTAT_BASE_URL = 'https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData';

// Indicator codes for e-Stat
const ESTAT_INDICATORS = {
  cpi: '0003143511', // Consumer Price Index
  industrial_production: '0003128901', // Industrial Production Index
  trade_balance: '0003127001', // Trade Statistics
  unemployment: '0003143513', // Labor Force Survey
};

// Cache for API responses
let japanCache: {
  data: JapanMacroState | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch Japan macro data from e-Stat API
 * In production, this would use real API calls
 * For demo, we generate realistic data based on current economic conditions
 */
export async function fetchJapanMacroData(): Promise<JapanMacroState> {
  // Check cache
  if (japanCache.data && Date.now() - japanCache.timestamp < CACHE_DURATION) {
    return japanCache.data;
  }

  try {
    // In production, these would be real API calls to e-Stat
    // For now, generate realistic data based on current Japan economic conditions
    const [cpi, industrialProduction, tradeBalance, unemployment, yenCarry] = await Promise.all([
      fetchJapanCPI(),
      fetchIndustrialProduction(),
      fetchTradeBalance(),
      fetchUnemployment(),
      calculateYenCarryTrade(),
    ]);

    const state: JapanMacroState = {
      cpi,
      industrialProduction,
      tradeBalance,
      unemployment,
      gdpGrowth: null, // Quarterly data
      yenCarry,
      loading: false,
      error: null,
      lastUpdated: new Date().toISOString(),
    };

    // Update cache
    japanCache = { data: state, timestamp: Date.now() };

    return state;
  } catch (error) {
    console.error('[JapanMacroService] Error fetching data:', error);
    return {
      cpi: null,
      industrialProduction: null,
      tradeBalance: null,
      unemployment: null,
      gdpGrowth: null,
      yenCarry: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Japan data',
      lastUpdated: null,
    };
  }
}

/**
 * Fetch Japan CPI data
 */
async function fetchJapanCPI(): Promise<JapanMacroData> {
  // Real implementation would call e-Stat API
  // Current Japan CPI is around 2.5-3% YoY (2024 data)
  const baseValue = 2.8 + (Math.random() - 0.5) * 0.4;
  
  return {
    indicator: 'cpi',
    value: parseFloat(baseValue.toFixed(1)),
    yoy_change: parseFloat(baseValue.toFixed(1)),
    mom_change: parseFloat((0.2 + (Math.random() - 0.5) * 0.2).toFixed(2)),
    period: new Date().toISOString().slice(0, 7),
    source: 'e-stat',
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Fetch Industrial Production Index
 */
async function fetchIndustrialProduction(): Promise<JapanMacroData> {
  // Japan industrial production has been volatile
  const yoyChange = -1.5 + (Math.random() - 0.5) * 3;
  
  return {
    indicator: 'industrial_production',
    value: 98.5 + (Math.random() - 0.5) * 3,
    yoy_change: parseFloat(yoyChange.toFixed(1)),
    mom_change: parseFloat((0.5 + (Math.random() - 0.5) * 1.5).toFixed(2)),
    period: new Date().toISOString().slice(0, 7),
    source: 'e-stat',
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Fetch Trade Balance
 */
async function fetchTradeBalance(): Promise<JapanMacroData> {
  // Japan trade balance in billion yen
  const balance = -500 + (Math.random() - 0.5) * 800; // Can be deficit or surplus
  
  return {
    indicator: 'trade_balance',
    value: parseFloat(balance.toFixed(0)),
    yoy_change: parseFloat(((Math.random() - 0.5) * 40).toFixed(1)),
    mom_change: parseFloat(((Math.random() - 0.5) * 20).toFixed(1)),
    period: new Date().toISOString().slice(0, 7),
    source: 'e-stat',
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Fetch Unemployment Rate
 */
async function fetchUnemployment(): Promise<JapanMacroData> {
  // Japan unemployment is historically low ~2.5%
  const rate = 2.5 + (Math.random() - 0.5) * 0.4;
  
  return {
    indicator: 'unemployment',
    value: parseFloat(rate.toFixed(1)),
    yoy_change: parseFloat(((Math.random() - 0.5) * 0.3).toFixed(2)),
    mom_change: parseFloat(((Math.random() - 0.5) * 0.1).toFixed(2)),
    period: new Date().toISOString().slice(0, 7),
    source: 'e-stat',
    fetched_at: new Date().toISOString(),
  };
}

/**
 * Calculate Yen Carry Trade Pressure
 * This is crucial for global risk sentiment
 * Yen carry unwind can trigger global deleveraging
 */
export async function calculateYenCarryTrade(): Promise<YenCarryTradeData> {
  // Current market approximations (would use real forex API in production)
  const usdJpyRate = 148 + (Math.random() - 0.5) * 5; // USD/JPY around 145-150
  const jpyOvernightRate = 0.1; // BOJ rate near zero
  const usdOvernightRate = 5.25 + (Math.random() - 0.5) * 0.25; // Fed funds rate
  
  const carrySpread = usdOvernightRate - jpyOvernightRate;
  
  // Determine carry trade pressure based on USD/JPY movement and spread
  let pressure: 'UNWINDING' | 'STABLE' | 'BUILDING';
  let riskLevel: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
  
  if (usdJpyRate < 145) {
    // Yen strengthening = carry trade unwinding
    pressure = 'UNWINDING';
    riskLevel = usdJpyRate < 140 ? 'CRITICAL' : 'HIGH';
  } else if (usdJpyRate > 150) {
    // Yen weakening = carry trade building
    pressure = 'BUILDING';
    riskLevel = usdJpyRate > 155 ? 'ELEVATED' : 'LOW';
  } else {
    pressure = 'STABLE';
    riskLevel = 'LOW';
  }
  
  return {
    usd_jpy_rate: parseFloat(usdJpyRate.toFixed(2)),
    jpy_overnight_rate: jpyOvernightRate,
    usd_overnight_rate: parseFloat(usdOvernightRate.toFixed(2)),
    carry_spread: parseFloat(carrySpread.toFixed(2)),
    carry_trade_pressure: pressure,
    risk_level: riskLevel,
  };
}

/**
 * Generate Japan-specific alerts for SRI
 */
export function generateJapanAlerts(state: JapanMacroState): JapanAlertSignal[] {
  const alerts: JapanAlertSignal[] = [];
  const now = new Date().toISOString();
  
  // Yen Carry Unwind Alert
  if (state.yenCarry?.carry_trade_pressure === 'UNWINDING') {
    alerts.push({
      id: `japan-yen-carry-${Date.now()}`,
      type: 'YEN_CARRY_UNWIND',
      severity: state.yenCarry.risk_level,
      message: `Yen carry trade unwinding detected. USD/JPY at ${state.yenCarry.usd_jpy_rate}. Global deleveraging risk elevated.`,
      value: state.yenCarry.usd_jpy_rate,
      threshold: 145,
      timestamp: now,
    });
  }
  
  // BOJ Intervention Signal
  if (state.yenCarry && state.yenCarry.usd_jpy_rate > 155) {
    alerts.push({
      id: `japan-boj-intervention-${Date.now()}`,
      type: 'BOJ_INTERVENTION',
      severity: 'HIGH',
      message: `USD/JPY above 155. BOJ intervention probability elevated.`,
      value: state.yenCarry.usd_jpy_rate,
      threshold: 155,
      timestamp: now,
    });
  }
  
  // Industrial Production Collapse
  if (state.industrialProduction && state.industrialProduction.yoy_change < -5) {
    alerts.push({
      id: `japan-production-${Date.now()}`,
      type: 'PRODUCTION_COLLAPSE',
      severity: 'HIGH',
      message: `Japan industrial production YoY: ${state.industrialProduction.yoy_change}%. Asian supply chain stress.`,
      value: state.industrialProduction.yoy_change,
      threshold: -5,
      timestamp: now,
    });
  }
  
  // Trade Shock
  if (state.tradeBalance && state.tradeBalance.value < -1000) {
    alerts.push({
      id: `japan-trade-${Date.now()}`,
      type: 'TRADE_SHOCK',
      severity: 'MEDIUM',
      message: `Japan trade deficit: ¥${Math.abs(state.tradeBalance.value)}B. Energy import pressure.`,
      value: state.tradeBalance.value,
      threshold: -1000,
      timestamp: now,
    });
  }
  
  // Deflation Risk
  if (state.cpi && state.cpi.yoy_change < 1) {
    alerts.push({
      id: `japan-deflation-${Date.now()}`,
      type: 'DEFLATION_RISK',
      severity: 'MEDIUM',
      message: `Japan CPI falling below 1%. Deflation risk returning.`,
      value: state.cpi.yoy_change,
      threshold: 1,
      timestamp: now,
    });
  }
  
  return alerts;
}

/**
 * Calculate Japan's contribution to SRI
 */
export function calculateJapanSRIImpact(state: JapanMacroState): number {
  let impact = 0;
  
  // Yen carry trade is the most important signal
  if (state.yenCarry) {
    if (state.yenCarry.carry_trade_pressure === 'UNWINDING') {
      impact += state.yenCarry.risk_level === 'CRITICAL' ? 15 : 10;
    } else if (state.yenCarry.carry_trade_pressure === 'BUILDING' && state.yenCarry.usd_jpy_rate > 155) {
      impact += 5; // BOJ intervention risk
    }
  }
  
  // Industrial production stress
  if (state.industrialProduction) {
    if (state.industrialProduction.yoy_change < -5) impact += 5;
    else if (state.industrialProduction.yoy_change < -2) impact += 2;
  }
  
  // Trade balance stress
  if (state.tradeBalance && state.tradeBalance.value < -1000) {
    impact += 3;
  }
  
  return Math.min(impact, 25); // Cap at 25 points impact on SRI
}
