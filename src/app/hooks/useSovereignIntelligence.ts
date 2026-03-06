/**
 * Sovereign Intelligence Hook
 * Realtime data subscriptions and SRI calculation
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchStablecoinLiquidity,
  fetchEnergyData,
  calculateSRI,
  calculateOilLiquidityCorrelation,
  buildCorrelationMatrix,
  generateMockMarketPulse,
  generateMockSignals,
} from '../services/sovereignService';
import type {
  SovereignTerminalState,
  SovereignMarketPulse,
  SovereignRiskSignal,
  SRIInputs,
  FlowSignal,
  CorrelationMatrix,
} from '../types/sovereign';
import { useMarketSnapshot } from './useMarketSnapshot';

// Cache configuration
const CACHE_DURATION = 60000; // 1 minute
let globalCache: {
  data: SovereignTerminalState | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

export function useSovereignIntelligence() {
  const { latest: marketSnapshot, loading: snapshotLoading } = useMarketSnapshot();
  const isMounted = useRef(true);
  
  const [state, setState] = useState<SovereignTerminalState>({
    currentPulse: null,
    recentSignals: [],
    intelligenceStream: [],
    correlationMatrix: null,
    flowSignal: null,
    isConnected: false,
    lastUpdate: null,
    error: null,
  });
  
  const [loading, setLoading] = useState(true);

  // Fetch and calculate SRI from all data sources
  const fetchSovereignData = useCallback(async () => {
    // Check cache
    if (globalCache.data && Date.now() - globalCache.timestamp < CACHE_DURATION) {
      if (isMounted.current) {
        setState(globalCache.data);
        setLoading(false);
      }
      return;
    }

    try {
      // Fetch data from multiple sources in parallel
      const [stablecoinData, energyData] = await Promise.all([
        fetchStablecoinLiquidity(),
        fetchEnergyData(),
      ]);

      // Build SRI inputs
      const sriInputs: SRIInputs = {
        stablecoinMcap: stablecoinData.totalMcap,
        stablecoinMcapChange7d: stablecoinData.change7d,
        fedBalanceSheet: 7200000000000, // Mock - would come from FRED
        m2MoneySupply: 20800000000000, // Mock - would come from FRED
        crudeOilPrice: energyData.crudeOil.price,
        crudeOilPriceChange: energyData.crudeOil.change,
        naturalGasPrice: energyData.naturalGas.price,
        naturalGasPriceChange: energyData.naturalGas.change,
        btcVolatility: marketSnapshot?.btc_volatility ?? 45,
        systemicRisk: marketSnapshot?.systemic_risk ?? 35,
        yieldSpread: marketSnapshot?.yield_spread ?? -0.3,
      };

      // Calculate SRI
      const sriResult = calculateSRI(sriInputs);

      // Calculate correlations
      const { correlation, signal: flowSignal } = calculateOilLiquidityCorrelation(
        energyData.crudeOil.change,
        stablecoinData.change7d
      );

      const correlationMatrix = buildCorrelationMatrix(
        energyData.crudeOil.change,
        energyData.naturalGas.change,
        stablecoinData.change7d,
        sriInputs.btcVolatility,
        sriInputs.yieldSpread
      );

      // Build market pulse
      const pulse: SovereignMarketPulse = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        sri_score: sriResult.score,
        liquidity_momentum: Math.round(stablecoinData.change7d * 10),
        energy_pressure: sriResult.components.energyScore,
        crypto_stress: sriResult.components.cryptoScore,
        macro_tension: sriResult.components.macroScore,
        regime: sriResult.regime,
        alert_level: sriResult.alertLevel,
      };

      // Generate signals based on SRI result
      const signals = generateMockSignals();
      
      // Add real signal if oil-liquidity divergence detected
      if (flowSignal && flowSignal.type === 'INFLOW_COMMODITIES') {
        signals.unshift({
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          signal_type: 'CORRELATION_BREAK',
          severity: flowSignal.confidence > 70 ? 'HIGH' : 'MEDIUM',
          title: flowSignal.description,
          description: flowSignal.triggers.join(' | '),
          data_sources: ['EIA', 'DEFILLAMA'],
          acknowledged: false,
          expires_at: null,
        });
      }

      const newState: SovereignTerminalState = {
        currentPulse: pulse,
        recentSignals: signals,
        intelligenceStream: [],
        correlationMatrix,
        flowSignal,
        isConnected: true,
        lastUpdate: new Date().toISOString(),
        error: null,
      };

      // Update cache
      globalCache = {
        data: newState,
        timestamp: Date.now(),
      };

      if (isMounted.current) {
        setState(newState);
        setLoading(false);
      }
    } catch (error) {
      console.error('[useSovereignIntelligence] Error:', error);
      
      // Fall back to mock data
      const mockPulse = generateMockMarketPulse();
      const mockSignals = generateMockSignals();
      
      if (isMounted.current) {
        setState(prev => ({
          ...prev,
          currentPulse: mockPulse,
          recentSignals: mockSignals,
          isConnected: false,
          lastUpdate: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Failed to fetch data',
        }));
        setLoading(false);
      }
    }
  }, [marketSnapshot]);

  // Set up realtime subscriptions
  useEffect(() => {
    isMounted.current = true;
    
    // Initial fetch
    fetchSovereignData();

    // Set up polling interval (every 30 seconds)
    const pollInterval = setInterval(fetchSovereignData, 30000);

    // Set up Supabase realtime subscription for signals (only if supabase is available)
    let signalsChannel: any = null;
    
    if (supabase) {
      signalsChannel = supabase
        .channel('sovereign_signals')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sovereign_risk_signals',
          },
          (payload) => {
            if (isMounted.current) {
              setState(prev => ({
                ...prev,
                recentSignals: [payload.new as SovereignRiskSignal, ...prev.recentSignals.slice(0, 9)],
                lastUpdate: new Date().toISOString(),
              }));
            }
          }
        )
        .subscribe();
    }

    return () => {
      isMounted.current = false;
      clearInterval(pollInterval);
      if (signalsChannel) {
        signalsChannel.unsubscribe();
      }
    };
  }, [fetchSovereignData]);

  // Acknowledge signal
  const acknowledgeSignal = useCallback(async (signalId: string) => {
    setState(prev => ({
      ...prev,
      recentSignals: prev.recentSignals.map(s =>
        s.id === signalId ? { ...s, acknowledged: true } : s
      ),
    }));

    // In production, this would update the database
    // await supabase.from('sovereign_risk_signals').update({ acknowledged: true }).eq('id', signalId);
  }, []);

  // Force refresh
  const refresh = useCallback(() => {
    globalCache = { data: null, timestamp: 0 };
    setLoading(true);
    fetchSovereignData();
  }, [fetchSovereignData]);

  return {
    ...state,
    loading: loading || snapshotLoading,
    acknowledgeSignal,
    refresh,
  };
}

// ============================================================================
// DERIVED METRICS
// ============================================================================

export function getSRIColor(score: number): string {
  if (score >= 75) return 'text-red-500';
  if (score >= 55) return 'text-[#A3937B]';
  if (score >= 35) return 'text-[#B8A892]';
  return 'text-green-400';
}

export function getSRIBgColor(score: number): string {
  if (score >= 75) return 'bg-red-500/20';
  if (score >= 55) return 'bg-[#A3937B]/20';
  if (score >= 35) return 'bg-[#B8A892]/20';
  return 'bg-green-500/20';
}

export function getAlertLevelColor(level: string): string {
  switch (level) {
    case 'BLACK': return 'bg-black text-red-500 border-red-500';
    case 'RED': return 'bg-red-950 text-red-400 border-red-600';
    case 'AMBER': return 'bg-[#A3937B]/20 text-[#A3937B] border-[#A3937B]';
    default: return 'bg-green-950 text-green-400 border-green-600';
  }
}

export function getRegimeColor(regime: string): string {
  switch (regime) {
    case 'CRISIS': return 'text-red-500';
    case 'STRESS': return 'text-[#A3937B]';
    case 'CONTRACTION': return 'text-[#B8A892]';
    default: return 'text-green-400';
  }
}
