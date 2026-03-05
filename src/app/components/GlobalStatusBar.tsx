'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { Activity, Shield, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';

// Liquidity Regime Engine Logic:
// if systemic_risk < 30 → EXPANSION
// if systemic_risk 30-60 → STRESS
// if systemic_risk > 60 → LIQUIDITY CRISIS
type LiquidityRegime = 'EXPANSION' | 'STRESS' | 'LIQUIDITY CRISIS';

function getLiquidityRegime(systemicRisk: number): LiquidityRegime {
  if (systemicRisk < 30) return 'EXPANSION';
  if (systemicRisk <= 60) return 'STRESS';
  return 'LIQUIDITY CRISIS';
}

function getRegimeColor(regime: LiquidityRegime): string {
  switch (regime) {
    case 'EXPANSION': return 'text-green-400';
    case 'STRESS': return 'text-amber-400';
    case 'LIQUIDITY CRISIS': return 'text-red-400';
  }
}

function getRegimeBgColor(regime: LiquidityRegime): string {
  switch (regime) {
    case 'EXPANSION': return 'bg-green-500/20';
    case 'STRESS': return 'bg-amber-500/20';
    case 'LIQUIDITY CRISIS': return 'bg-red-500/20';
  }
}

interface GlobalStatusBarProps {
  className?: string;
}

export const GlobalStatusBar = memo(function GlobalStatusBar({ className = '' }: GlobalStatusBarProps) {
  const { latest: snapshot, loading, dataStatus } = useMarketSnapshot();
  
  // Calculate regime from systemic risk
  const systemicRisk = useMemo(() => {
    if (!snapshot?.systemic_risk) return 0;
    return snapshot.systemic_risk > 1 ? snapshot.systemic_risk : snapshot.systemic_risk * 100;
  }, [snapshot?.systemic_risk]);
  
  const regime = useMemo(() => getLiquidityRegime(systemicRisk), [systemicRisk]);
  const regimeColor = getRegimeColor(regime);
  const regimeBgColor = getRegimeBgColor(regime);
  
  // Data verification status
  const isDataVerified = dataStatus?.status === 'GREEN' || dataStatus?.status === 'YELLOW';
  
  return (
    <div className={`bg-[#0a0e14] border-b border-blue-900/50 ${className}`}>
      <div className="max-w-full mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4 text-xs font-mono overflow-x-auto">
          {/* Version */}
          <div className="flex items-center gap-2 text-gray-400 whitespace-nowrap">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-bold text-blue-400">LIQUIDITY</span>
            <span className="text-gray-500">v1.0</span>
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 bg-gray-700 hidden sm:block" />
          
          {/* Regime */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-500">REGIME:</span>
            <span className={`font-bold px-2 py-0.5 rounded ${regimeBgColor} ${regimeColor}`}>
              {loading ? 'LOADING...' : regime}
            </span>
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 bg-gray-700 hidden sm:block" />
          
          {/* Risk Index */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-500">RISK INDEX:</span>
            <span className={`font-bold tabular-nums ${
              systemicRisk >= 60 ? 'text-red-400' : systemicRisk >= 30 ? 'text-amber-400' : 'text-green-400'
            }`}>
              {loading ? '--' : Math.round(systemicRisk)}
            </span>
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 bg-gray-700 hidden md:block" />
          
          {/* Data Status */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-gray-500">DATA:</span>
            {isDataVerified ? (
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle className="w-3 h-3" />
                <span className="font-bold">VERIFIED</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                <span className="font-bold">PENDING</span>
              </span>
            )}
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 bg-gray-700 hidden lg:block" />
          
          {/* Live indicator */}
          <div className="flex items-center gap-2 whitespace-nowrap hidden lg:flex">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-bold">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Compact version for embedding in other components
export const GlobalStatusBarCompact = memo(function GlobalStatusBarCompact() {
  const { latest: snapshot, loading } = useMarketSnapshot();
  
  const systemicRisk = useMemo(() => {
    if (!snapshot?.systemic_risk) return 0;
    return snapshot.systemic_risk > 1 ? snapshot.systemic_risk : snapshot.systemic_risk * 100;
  }, [snapshot?.systemic_risk]);
  
  const regime = useMemo(() => getLiquidityRegime(systemicRisk), [systemicRisk]);
  const regimeColor = getRegimeColor(regime);
  
  return (
    <div className="flex items-center gap-3 text-xs font-mono">
      <span className={`font-bold ${regimeColor}`}>{regime}</span>
      <span className="text-gray-500">|</span>
      <span className={`tabular-nums ${systemicRisk >= 60 ? 'text-red-400' : 'text-gray-300'}`}>
        RI: {loading ? '--' : Math.round(systemicRisk)}
      </span>
    </div>
  );
});

export default GlobalStatusBar;
