'use client';

/**
 * Global Risk Meter
 * Sovereign Risk Index gauge for the Home Page
 * Range: 0-25 SAFE | 25-50 ELEVATED | 50-75 HIGH | 75-100 SYSTEMIC
 */

import React, { memo, useMemo } from 'react';
import { Shield, TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';

// Design tokens - Sovereign Tint palette
const DESIGN = {
  bg: {
    primary: '#0b0b0f',
    panel: '#121218',
    card: '#16161d',
  },
  accent: {
    gold: '#A3937B',
    goldMuted: 'rgba(163, 147, 123, 0.10)',
  },
  status: {
    safe: '#2ecc71',
    elevated: '#B8A892',
    high: '#ff6b4a',
    systemic: '#ff3b5c',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#a0a0a0',
    muted: '#6b6b6b',
  },
  border: {
    default: 'rgba(163, 147, 123, 0.06)',
    active: 'rgba(163, 147, 123, 0.15)',
  },
};

type RiskLevel = 'SAFE' | 'ELEVATED' | 'HIGH' | 'SYSTEMIC';

function getRiskLevel(score: number): RiskLevel {
  if (score < 25) return 'SAFE';
  if (score < 50) return 'ELEVATED';
  if (score < 75) return 'HIGH';
  return 'SYSTEMIC';
}

function getRiskColor(score: number): string {
  if (score < 25) return DESIGN.status.safe;
  if (score < 50) return DESIGN.status.elevated;
  if (score < 75) return DESIGN.status.high;
  return DESIGN.status.systemic;
}

function getRiskDescription(level: RiskLevel): string {
  switch (level) {
    case 'SAFE': return 'Markets stable. Low systemic risk detected.';
    case 'ELEVATED': return 'Increased volatility. Monitor positions closely.';
    case 'HIGH': return 'Significant stress indicators. Consider risk reduction.';
    case 'SYSTEMIC': return 'Critical risk levels. Immediate action recommended.';
  }
}

export const GlobalRiskMeter = memo(function GlobalRiskMeter() {
  const { latest: snapshot, loading, error } = useMarketSnapshot();

  const riskScore = useMemo(() => {
    if (!snapshot?.systemic_risk) return 0;
    return snapshot.systemic_risk > 1 ? snapshot.systemic_risk : snapshot.systemic_risk * 100;
  }, [snapshot?.systemic_risk]);

  const riskLevel = getRiskLevel(riskScore);
  const riskColor = getRiskColor(riskScore);
  const riskDescription = getRiskDescription(riskLevel);

  // Calculate gauge arc
  const gaugeAngle = (riskScore / 100) * 180; // Semi-circle gauge
  const circumference = Math.PI * 120; // radius = 60
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  // Risk components breakdown (mock data - would come from actual calculations)
  const components = [
    { name: 'Liquidity Stress', value: Math.min(100, riskScore * 1.1), change: 2.3 },
    { name: 'Credit Risk', value: Math.min(100, riskScore * 0.9), change: -1.2 },
    { name: 'Volatility', value: Math.min(100, riskScore * 1.05), change: 5.8 },
    { name: 'Geopolitical', value: Math.min(100, riskScore * 0.85), change: 0.5 },
  ];

  if (loading) {
    return (
      <div 
        className="p-6 animate-pulse"
        style={{ background: DESIGN.bg.panel, border: `1px solid ${DESIGN.border.default}` }}
      >
        <div className="h-48 ios-skeleton" style={{ background: DESIGN.bg.card }} />
      </div>
    );
  }

  return (
    <div style={{ background: DESIGN.bg.panel, border: `1px solid ${DESIGN.border.default}` }}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${DESIGN.border.default}` }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 flex items-center justify-center"
            style={{ background: DESIGN.accent.goldMuted }}
          >
            <Shield className="w-4 h-4" style={{ color: DESIGN.accent.gold }} />
          </div>
          <div>
            <h3 
              className="text-xs font-mono font-semibold uppercase tracking-wider"
              style={{ color: DESIGN.accent.gold }}
            >
              Sovereign Risk Index
            </h3>
            <p className="text-[10px] font-mono" style={{ color: DESIGN.text.muted }}>
              Global Systemic Risk Assessment
            </p>
          </div>
        </div>
        {riskLevel === 'SYSTEMIC' && (
          <div 
            className="flex items-center gap-2 px-3 py-1 animate-pulse"
            style={{ 
              background: `${DESIGN.status.systemic}15`,
              border: `1px solid ${DESIGN.status.systemic}30`
            }}
          >
            <AlertTriangle className="w-3 h-3" style={{ color: DESIGN.status.systemic }} />
            <span className="text-[9px] font-mono font-bold uppercase" style={{ color: DESIGN.status.systemic }}>
              ALERT
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-8">
          {/* Gauge */}
          <div className="relative flex-shrink-0 global-risk-meter">
            <svg width="200" height="120" viewBox="0 0 200 120">
              {/* Background arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={DESIGN.bg.card}
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Colored segments */}
              <path
                d="M 20 100 A 80 80 0 0 1 60 35"
                fill="none"
                stroke={DESIGN.status.safe}
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.3"
              />
              <path
                d="M 60 35 A 80 80 0 0 1 100 20"
                fill="none"
                stroke={DESIGN.status.elevated}
                strokeWidth="16"
                opacity="0.3"
              />
              <path
                d="M 100 20 A 80 80 0 0 1 140 35"
                fill="none"
                stroke={DESIGN.status.high}
                strokeWidth="16"
                opacity="0.3"
              />
              <path
                d="M 140 35 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={DESIGN.status.systemic}
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.3"
              />
              {/* Active arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={riskColor}
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(riskScore / 100) * 251.2} 251.2`}
                style={{ 
                  filter: `drop-shadow(0 0 8px ${riskColor}50)`,
                  transition: 'stroke-dasharray 0.5s ease'
                }}
              />
              {/* Needle */}
              <line
                x1="100"
                y1="100"
                x2={100 + 60 * Math.cos((Math.PI * (180 - gaugeAngle)) / 180)}
                y2={100 - 60 * Math.sin((Math.PI * (180 - gaugeAngle)) / 180)}
                stroke={DESIGN.text.primary}
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transition: 'all 0.5s ease' }}
              />
              <circle cx="100" cy="100" r="6" fill={DESIGN.bg.panel} stroke={riskColor} strokeWidth="2" />
            </svg>

            {/* Score Display */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center">
              <span 
                className="text-4xl font-mono font-bold tabular-nums"
                style={{ color: riskColor }}
              >
                {Math.round(riskScore)}
              </span>
              <div className="text-[9px] font-mono uppercase" style={{ color: DESIGN.text.muted }}>
                /100
              </div>
            </div>
          </div>

          {/* Level & Description */}
          <div className="flex-1 pt-4">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-4"
              style={{ 
                background: `${riskColor}15`,
                border: `1px solid ${riskColor}30`
              }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ 
                  background: riskColor,
                  boxShadow: riskLevel === 'SYSTEMIC' ? `0 0 8px ${riskColor}` : undefined
                }}
              />
              <span 
                className="text-sm font-mono font-bold uppercase tracking-wider"
                style={{ color: riskColor }}
              >
                {riskLevel}
              </span>
            </div>
            
            <p className="text-sm font-mono leading-relaxed mb-4" style={{ color: DESIGN.text.secondary }}>
              {riskDescription}
            </p>

            {/* Level Scale */}
            <div className="flex items-center gap-1">
              {['SAFE', 'ELEVATED', 'HIGH', 'SYSTEMIC'].map((level) => (
                <div key={level} className="flex-1">
                  <div 
                    className="h-1 w-full"
                    style={{ 
                      background: level === 'SAFE' ? DESIGN.status.safe :
                                  level === 'ELEVATED' ? DESIGN.status.elevated :
                                  level === 'HIGH' ? DESIGN.status.high : DESIGN.status.systemic,
                      opacity: riskLevel === level ? 1 : 0.3
                    }}
                  />
                  <span 
                    className="text-[8px] font-mono mt-1 block"
                    style={{ 
                      color: riskLevel === level ? DESIGN.text.primary : DESIGN.text.muted 
                    }}
                  >
                    {level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Components Breakdown */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6"
          style={{ borderTop: `1px solid ${DESIGN.border.default}` }}
        >
          {components.map((comp) => {
            const compColor = getRiskColor(comp.value);
            const isPositive = comp.change > 0;
            return (
              <div 
                key={comp.name}
                className="p-3"
                style={{ background: DESIGN.bg.card, border: `1px solid ${DESIGN.border.default}` }}
              >
                <div className="text-[9px] font-mono uppercase tracking-wider mb-2" style={{ color: DESIGN.text.muted }}>
                  {comp.name}
                </div>
                <div className="flex items-end justify-between">
                  <span 
                    className="text-lg font-mono font-bold tabular-nums"
                    style={{ color: compColor }}
                  >
                    {Math.round(comp.value)}
                  </span>
                  <div 
                    className="flex items-center gap-0.5 text-[10px] font-mono"
                    style={{ color: isPositive ? DESIGN.status.high : DESIGN.status.safe }}
                  >
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{comp.change.toFixed(1)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default GlobalRiskMeter;
