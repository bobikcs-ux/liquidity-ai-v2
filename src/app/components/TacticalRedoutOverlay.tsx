/**
 * TACTICAL RED-OUT OVERLAY
 * Black Swan AGI War Engine Emergency Mode
 * 
 * Activated when BlackSwanRisk > 0.8
 * All secondary UI disappears - focus on survival metrics only
 */

import React, { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, X, Activity, TrendingDown, Zap, Shield, Radio } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { computeAGISystemState } from '../services/agiBrainEngine';

interface TacticalRedoutProps {
  onDismiss?: () => void;
  forcedMode?: boolean; // For testing
}

export function TacticalRedoutOverlay({ onDismiss, forcedMode = false }: TacticalRedoutProps) {
  const { latest: snapshot } = useMarketSnapshot();
  const [pulsePhase, setPulsePhase] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Compute AGI system state
  const agiState = useMemo(() => {
    if (!snapshot) return null;
    
    return computeAGISystemState({
      survivalProbability: snapshot.survival_probability ?? 0.78,
      systemicRisk: snapshot.systemic_risk ?? 0.35,
      yieldSpread: snapshot.yield_spread ?? -0.23,
      btcVolatility: snapshot.btc_volatility ?? 65,
      balanceSheetDelta: snapshot.balance_sheet_delta ?? -2.3,
      rateShock: snapshot.rate_shock ?? 15
    });
  }, [snapshot]);

  const blackSwan = agiState?.blackSwan ?? {
    volatilityShockRate: 0.45,
    correlationCollapseSpeed: 0.55,
    liquidityDrainVelocity: 0.65,
    blackSwanRisk: 0.55,
    emergencyMode: false
  };

  // Pulse animation for red background
  useEffect(() => {
    if (!blackSwan.emergencyMode && !forcedMode) return;
    
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 1) % 100);
    }, 50);
    
    return () => clearInterval(interval);
  }, [blackSwan.emergencyMode, forcedMode]);

  // Check if emergency mode should be active
  const isEmergencyActive = blackSwan.emergencyMode || forcedMode;

  if (!isEmergencyActive || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Calculate pulse intensity
  const pulseIntensity = Math.sin(pulsePhase * 0.1) * 0.3 + 0.7;

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-auto"
      style={{
        background: `radial-gradient(ellipse at center, rgba(127, 29, 29, ${pulseIntensity * 0.3}) 0%, rgba(0, 0, 0, 0.95) 70%)`,
      }}
    >
      {/* Scanline effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-[101]" 
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)',
          animation: 'scanlines 8s linear infinite'
        }}
      />
      
      {/* Red pulse border */}
      <div 
        className="fixed inset-0 pointer-events-none z-[102] border-4 border-red-500"
        style={{ 
          opacity: pulseIntensity,
          boxShadow: `inset 0 0 100px rgba(239, 68, 68, ${pulseIntensity * 0.5})`
        }}
      />

      {/* Main Content */}
      <div className="relative z-[103] min-h-screen flex flex-col p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-xl animate-ping opacity-50" />
              <div className="relative p-4 bg-red-500/30 rounded-xl border-2 border-red-500">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-red-500 uppercase tracking-wider animate-pulse">
                TACTICAL RED-OUT
              </h1>
              <p className="text-lg text-red-300/70 font-mono uppercase tracking-widest mt-1">
                GLOBAL DEFENSE EMERGENCY MODE ACTIVATED
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleDismiss}
            className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Black Swan Risk Display */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-12">
            <div className="text-sm font-mono text-red-400/70 uppercase tracking-[0.3em] mb-4">
              BLACK SWAN RISK INDEX
            </div>
            <div 
              className="text-[12rem] md:text-[16rem] font-black text-red-500 leading-none tabular-nums font-mono"
              style={{ 
                textShadow: `0 0 100px rgba(239, 68, 68, ${pulseIntensity})`,
                opacity: pulseIntensity
              }}
            >
              {(blackSwan.blackSwanRisk * 100).toFixed(0)}
            </div>
            <div className="text-2xl font-bold text-red-400/70 uppercase tracking-widest mt-4">
              IMMINENT TAIL EVENT
            </div>
          </div>

          {/* Critical Metrics Grid */}
          <div className="w-full max-w-4xl">
            <div className="text-xs font-mono text-red-400/50 uppercase tracking-widest mb-4 text-center">
              SURVIVAL METRICS ONLY
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {/* Liquidity Drain Velocity */}
              <div className="bg-black/50 border-2 border-red-500/50 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <span className="text-xs font-mono text-red-400/70 uppercase">LIQUIDITY DRAIN</span>
                </div>
                <div className="text-5xl font-black text-red-500 tabular-nums font-mono">
                  {(blackSwan.liquidityDrainVelocity * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-red-400/50 mt-2 uppercase">VELOCITY</div>
              </div>

              {/* Correlation Collapse */}
              <div className="bg-black/50 border-2 border-red-500/50 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-red-400" />
                  <span className="text-xs font-mono text-red-400/70 uppercase">CORRELATION</span>
                </div>
                <div className="text-5xl font-black text-red-500 tabular-nums font-mono">
                  {(blackSwan.correlationCollapseSpeed * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-red-400/50 mt-2 uppercase">COLLAPSE SPEED</div>
              </div>

              {/* Volatility Shock */}
              <div className="bg-black/50 border-2 border-red-500/50 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-red-400" />
                  <span className="text-xs font-mono text-red-400/70 uppercase">VOLATILITY</span>
                </div>
                <div className="text-5xl font-black text-red-500 tabular-nums font-mono">
                  {(blackSwan.volatilityShockRate * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-red-400/50 mt-2 uppercase">SHOCK RATE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Actions */}
        <div className="mt-8 max-w-4xl mx-auto w-full">
          <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-red-400" />
              <span className="text-sm font-bold text-red-400 uppercase tracking-wider">
                IMMEDIATE DEFENSE PROTOCOL
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { action: 'LIQUIDATE HIGH-BETA POSITIONS', priority: 'CRITICAL' },
                { action: 'MAXIMIZE CASH RESERVES', priority: 'CRITICAL' },
                { action: 'ACTIVATE PUT PROTECTION', priority: 'HIGH' },
                { action: 'HALT ALL NEW ENTRIES', priority: 'HIGH' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-red-500/20">
                  <div className="w-6 h-6 rounded bg-red-500/20 flex items-center justify-center text-xs font-bold text-red-400">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <span className="text-sm font-bold text-red-300 uppercase flex-1">{item.action}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    item.priority === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Formula Display */}
        <div className="mt-6 text-center">
          <div className="text-xs font-mono text-red-400/30 leading-relaxed">
            BlackSwanRisk = (VolatilityShockRate * 0.25) + (CorrelationCollapseSpeed * 0.25) + (LiquidityDrainVelocity * 0.50)
          </div>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Radio className="w-3 h-3 text-red-400 animate-pulse" />
            <span className="text-xs font-mono text-red-400/50 uppercase tracking-widest">
              L1 NERVOUS SYSTEM // 60-SECOND REFRESH
            </span>
          </div>
        </div>
      </div>

      {/* CSS for scanlines animation */}
      <style>{`
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}

// Hook to check if tactical redout should be active
export function useTacticalRedout() {
  const { latest: snapshot } = useMarketSnapshot();
  
  const agiState = useMemo(() => {
    if (!snapshot) return null;
    
    return computeAGISystemState({
      survivalProbability: snapshot.survival_probability ?? 0.78,
      systemicRisk: snapshot.systemic_risk ?? 0.35,
      yieldSpread: snapshot.yield_spread ?? -0.23,
      btcVolatility: snapshot.btc_volatility ?? 65,
      balanceSheetDelta: snapshot.balance_sheet_delta ?? -2.3,
      rateShock: snapshot.rate_shock ?? 15
    });
  }, [snapshot]);

  return {
    isEmergencyMode: agiState?.blackSwan.emergencyMode ?? false,
    blackSwanRisk: agiState?.blackSwan.blackSwanRisk ?? 0,
    agiState
  };
}
