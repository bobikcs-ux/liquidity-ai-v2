'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { Activity, Shield, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { DataSourceStatusBar } from './DataSourceStatusBar';

// Design tokens - Sovereign Tint palette
const DESIGN = {
  bg: '#0b0b0f',
  panel: '#121218',
  gold: '#A3937B',
  goldMuted: 'rgba(163, 147, 123, 0.10)',
  success: '#2ecc71',
  warning: '#B8A892',
  crisis: '#ff3b5c',
  textPrimary: '#f5f5f5',
  textMuted: '#a1a1aa',
  border: 'rgba(163, 147, 123, 0.06)',
};

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
    case 'EXPANSION': return DESIGN.success;
    case 'STRESS': return DESIGN.warning;
    case 'LIQUIDITY CRISIS': return DESIGN.crisis;
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
  
  // Data verification status
  const isDataVerified = dataStatus?.status === 'GREEN' || dataStatus?.status === 'YELLOW';
  
  return (
    <div className={className} style={{ background: DESIGN.bg }}>
      {/* Main Status Row */}
      <div 
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: `1px solid ${DESIGN.border}` }}
      >
        <div className="flex items-center gap-6 text-xs font-mono overflow-x-auto">
          {/* Version */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Shield className="w-3.5 h-3.5" style={{ color: DESIGN.gold }} />
            <span className="font-bold" style={{ color: DESIGN.gold }}>LIQUIDITY</span>
            <span style={{ color: DESIGN.textMuted }}>v2.0</span>
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 hidden sm:block" style={{ background: DESIGN.border }} />
          
          {/* Regime */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span style={{ color: DESIGN.textMuted }}>REGIME:</span>
            <span 
              className="font-bold px-2 py-0.5"
              style={{ 
                background: `${regimeColor}15`,
                color: regimeColor,
                border: `1px solid ${regimeColor}30`
              }}
            >
              {loading ? 'LOADING...' : regime}
            </span>
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 hidden sm:block" style={{ background: DESIGN.border }} />
          
          {/* Risk Index */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span style={{ color: DESIGN.textMuted }}>RISK:</span>
            <span 
              className="font-bold tabular-nums"
              style={{ 
                color: systemicRisk >= 60 ? DESIGN.crisis : systemicRisk >= 30 ? DESIGN.warning : DESIGN.success 
              }}
            >
              {loading ? '--' : Math.round(systemicRisk)}
            </span>
          </div>
          
          {/* Separator */}
          <div className="w-px h-4 hidden md:block" style={{ background: DESIGN.border }} />
          
          {/* Data Status */}
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span style={{ color: DESIGN.textMuted }}>DATA:</span>
            {isDataVerified ? (
              <span className="flex items-center gap-1" style={{ color: DESIGN.success }}>
                <CheckCircle className="w-3 h-3" />
                <span className="font-bold">VERIFIED</span>
              </span>
            ) : (
              <span className="flex items-center gap-1" style={{ color: DESIGN.warning }}>
                <AlertTriangle className="w-3 h-3" />
                <span className="font-bold">PENDING</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div 
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: DESIGN.success, boxShadow: `0 0 6px ${DESIGN.success}` }}
          />
          <span className="text-xs font-mono font-bold" style={{ color: DESIGN.success }}>LIVE</span>
        </div>
      </div>
      
      {/* Data Source Status Row */}
      <DataSourceStatusBar variant="compact" />
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
