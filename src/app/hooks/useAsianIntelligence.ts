/**
 * Asian Intelligence Hook
 * Combines Japan Macro + India Fiscal data
 * Calculates Asian Supply Chain Index and SRI triggers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchJapanMacroData, generateJapanAlerts, calculateJapanSRIImpact } from '../services/japanMacroService';
import { fetchIndiaFiscalData, generateIndiaAlerts, calculateIndiaSRIImpact } from '../services/indiaFiscalService';
import type {
  AsianIntelligenceState,
  AsianSupplyChainIndex,
  SRIAsianTriggers,
  JapanMacroState,
  IndiaFiscalState,
  JapanAlertSignal,
  IndiaAlertSignal,
} from '../types/japan-india';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate Asian Supply Chain Composite Index
 */
function calculateSupplyChainIndex(
  japan: JapanMacroState,
  india: IndiaFiscalState
): AsianSupplyChainIndex {
  // Japan component (40% weight)
  const japanIP = japan.industrialProduction?.yoy_change ?? 0;
  const japanTrade = japan.tradeBalance?.value ?? 0;
  const japanScore = Math.max(0, Math.min(100, 50 + japanIP * 2 + (japanTrade > 0 ? 10 : -5)));
  
  // India component (35% weight)
  const indiaGST = india.gstData?.yoy_change ?? 0;
  const indiaScore = Math.max(0, Math.min(100, 50 + indiaGST * 2));
  
  // China placeholder (25% weight) - would integrate real China PMI data
  const chinaScore = 50 + (Math.random() - 0.5) * 10;
  
  // Weighted composite
  const composite = japanScore * 0.4 + indiaScore * 0.35 + chinaScore * 0.25;
  
  // Determine trend
  let trend: 'EXPANDING' | 'STABLE' | 'CONTRACTING';
  if (composite > 55) trend = 'EXPANDING';
  else if (composite > 45) trend = 'STABLE';
  else trend = 'CONTRACTING';
  
  // Risk level
  let risk: 'LOW' | 'ELEVATED' | 'HIGH';
  if (composite > 55) risk = 'LOW';
  else if (composite > 40) risk = 'ELEVATED';
  else risk = 'HIGH';
  
  return {
    japan: {
      industrialProduction: japanIP,
      tradeBalance: japanTrade,
      weight: 0.4,
    },
    india: {
      gstMomentum: indiaGST,
      manufacturingPMI: 52 + (Math.random() - 0.5) * 4, // Placeholder
      weight: 0.35,
    },
    china: {
      pmi: 49 + (Math.random() - 0.5) * 3,
      exports: -2 + (Math.random() - 0.5) * 4,
      weight: 0.25,
    },
    compositeIndex: parseFloat(composite.toFixed(1)),
    trend,
    riskToGlobalSupply: risk,
  };
}

/**
 * Calculate SRI Asian Triggers
 */
function calculateSRITriggers(
  japan: JapanMacroState,
  india: IndiaFiscalState,
  supplyChain: AsianSupplyChainIndex
): SRIAsianTriggers {
  // Yen Carry Unwind Trigger
  const yenCarryActive = japan.yenCarry?.carry_trade_pressure === 'UNWINDING';
  const yenCarryImpact = yenCarryActive
    ? (japan.yenCarry?.risk_level === 'CRITICAL' ? 15 : 10)
    : 0;
  
  // Asian Supply Chain Stress Trigger
  const supplyChainStress = supplyChain.compositeIndex < 45;
  const supplyChainImpact = supplyChainStress
    ? Math.round((45 - supplyChain.compositeIndex) * 0.5)
    : 0;
  
  // India Fiscal Shock Trigger
  const indiaShock = india.economicPulse?.fiscalHealth.status === 'STRESS';
  const indiaImpact = indiaShock ? 5 : 0;
  
  return {
    yenCarryUnwind: {
      active: yenCarryActive,
      impact: yenCarryImpact,
      description: yenCarryActive
        ? `Yen carry trade unwinding. USD/JPY at ${japan.yenCarry?.usd_jpy_rate}. Global deleveraging risk.`
        : 'Yen carry trade stable.',
    },
    asianSupplyChainStress: {
      active: supplyChainStress,
      impact: supplyChainImpact,
      description: supplyChainStress
        ? `Asian supply chain index at ${supplyChain.compositeIndex}. Manufacturing stress detected.`
        : 'Asian supply chain operating normally.',
    },
    indiaFiscalShock: {
      active: indiaShock,
      impact: indiaImpact,
      description: indiaShock
        ? `India fiscal deficit elevated at ${india.economicPulse?.fiscalHealth.deficitToGDP}% of GDP.`
        : 'India fiscal position stable.',
    },
  };
}

/**
 * Main Asian Intelligence Hook
 */
export function useAsianIntelligence() {
  const [state, setState] = useState<AsianIntelligenceState>({
    japan: {
      cpi: null,
      industrialProduction: null,
      tradeBalance: null,
      unemployment: null,
      gdpGrowth: null,
      yenCarry: null,
      loading: true,
      error: null,
      lastUpdated: null,
    },
    india: {
      gstData: null,
      economicPulse: null,
      historicalGST: [],
      loading: true,
      error: null,
      lastUpdated: null,
    },
    supplyChain: null,
    sriTriggers: {
      yenCarryUnwind: { active: false, impact: 0, description: '' },
      asianSupplyChainStress: { active: false, impact: 0, description: '' },
      indiaFiscalShock: { active: false, impact: 0, description: '' },
    },
    alerts: [],
  });
  
  const isMounted = useRef(true);
  
  const fetchData = useCallback(async () => {
    try {
      const [japan, india] = await Promise.all([
        fetchJapanMacroData(),
        fetchIndiaFiscalData(),
      ]);
      
      if (!isMounted.current) return;
      
      // Calculate derived data
      const supplyChain = calculateSupplyChainIndex(japan, india);
      const sriTriggers = calculateSRITriggers(japan, india, supplyChain);
      const alerts = [
        ...generateJapanAlerts(japan),
        ...generateIndiaAlerts(india),
      ];
      
      setState({
        japan,
        india,
        supplyChain,
        sriTriggers,
        alerts,
      });
    } catch (error) {
      console.error('[useAsianIntelligence] Error:', error);
    }
  }, []);
  
  useEffect(() => {
    isMounted.current = true;
    fetchData();
    
    const interval = setInterval(fetchData, POLL_INTERVAL);
    
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchData]);
  
  // Calculate total SRI impact from Asian signals
  const totalSRIImpact = useCallback(() => {
    return (
      state.sriTriggers.yenCarryUnwind.impact +
      state.sriTriggers.asianSupplyChainStress.impact +
      state.sriTriggers.indiaFiscalShock.impact
    );
  }, [state.sriTriggers]);
  
  return {
    ...state,
    totalSRIImpact: totalSRIImpact(),
    refresh: fetchData,
  };
}

/**
 * Color utilities for Asian indicators
 */
export function getYenCarryColor(pressure: string): string {
  switch (pressure) {
    case 'UNWINDING': return 'text-red-500';
    case 'BUILDING': return 'text-amber-500';
    default: return 'text-green-500';
  }
}

export function getSupplyChainColor(trend: string): string {
  switch (trend) {
    case 'EXPANDING': return 'text-green-500';
    case 'STABLE': return 'text-amber-500';
    case 'CONTRACTING': return 'text-red-500';
    default: return 'text-gray-500';
  }
}

export function getFiscalStatusColor(status: string): string {
  switch (status) {
    case 'HEALTHY': return 'text-green-500';
    case 'CAUTION': return 'text-amber-500';
    case 'STRESS': return 'text-red-500';
    default: return 'text-gray-500';
  }
}
