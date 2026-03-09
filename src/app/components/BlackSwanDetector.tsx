'use client';

import React, { memo, useMemo, startTransition, useCallback, useState, useEffect } from 'react';
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';

interface BlackSwanDetectorProps {
  compact?: boolean;
}

// Calculate Black Swan Risk Score using the formula:
// BlackSwanScore = abs(yield_spread) * 15 + btc_volatility * 8 + abs(balance_sheet_delta) * 4 + var_95 * 3
// Clamp result: 0 — 100
function calculateBlackSwanScore(
  yieldSpread: number,
  btcVolatility: number,
  balanceSheetDelta: number,
  var95: number
): number {
  const score = 
    Math.abs(yieldSpread) * 15 +
    btcVolatility * 8 +
    Math.abs(balanceSheetDelta) * 4 +
    var95 * 3;
  
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Get risk level based on score
type RiskLevel = 'STABLE' | 'WATCH' | 'CRITICAL';

function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'CRITICAL';
  if (score >= 40) return 'WATCH';
  return 'STABLE';
}

function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'CRITICAL': return 'text-red-500';
    case 'WATCH': return 'text-amber-500';
    case 'STABLE': return 'text-green-500';
  }
}

function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'CRITICAL': return 'bg-red-500/10 border-red-500/30';
    case 'WATCH': return 'bg-amber-500/10 border-amber-500/30';
    case 'STABLE': return 'bg-green-500/10 border-green-500/30';
  }
}

// Animated counter for smooth transitions
function AnimatedScore({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const startValue = displayValue;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * easeOut);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return <span className="tabular-nums">{displayValue}</span>;
}

export const BlackSwanDetector = memo(function BlackSwanDetector({ compact = false }: BlackSwanDetectorProps) {
  const { latest: snapshot, loading } = useMarketSnapshot();
  const [score, setScore] = useState(0);
  
  // Memoize the calculation
  const calculatedScore = useMemo(() => {
    if (!snapshot) return 0;
    
    // Normalize values (some may be stored as decimals 0-1, others as percentages)
    const yieldSpread = snapshot.yield_spread ?? 0;
    const btcVolatility = snapshot.btc_volatility != null 
      ? (snapshot.btc_volatility > 1 ? snapshot.btc_volatility / 100 : snapshot.btc_volatility)
      : 0;
    const balanceSheetDelta = snapshot.balance_sheet_delta ?? 0;
    const var95 = snapshot.var_95 ?? 0;
    
    return calculateBlackSwanScore(yieldSpread, btcVolatility, balanceSheetDelta, var95);
  }, [snapshot]);
  
  // Use startTransition for score updates to avoid blocking UI
  useEffect(() => {
    startTransition(() => {
      setScore(calculatedScore);
    });
  }, [calculatedScore]);
  
  const riskLevel = getRiskLevel(score);
  const riskColor = getRiskColor(riskLevel);
  const riskBgColor = getRiskBgColor(riskLevel);
  
  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${riskBgColor}`}>
        <AlertTriangle className={`w-4 h-4 ${riskColor}`} />
        <span className="text-xs font-mono text-gray-300">BSI</span>
        <span className={`text-sm font-bold font-mono ${riskColor}`}>
          {loading ? '--' : <AnimatedScore value={score} />}
        </span>
      </div>
    );
  }
  
  return (
    <div className={`rounded-xl border p-4 ${riskBgColor} ${score >= 70 ? 'animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${score >= 70 ? 'bg-red-500/20' : score >= 40 ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
            <AlertTriangle className={`w-5 h-5 ${riskColor}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Black Swan Early Warning
            </h3>
            <p className="text-xs text-gray-400 font-mono">Real-time systemic risk detection</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold ${riskBgColor} ${riskColor}`}>
          {riskLevel}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-gray-400 font-mono mb-1">RISK SCORE</div>
          <div className={`text-4xl font-black font-mono ${riskColor}`}>
            {loading ? (
              <span className="inline-block w-16 h-10 bg-gray-700 rounded animate-pulse" />
            ) : (
              <AnimatedScore value={score} />
            )}
          </div>
        </div>
        
        {/* Risk breakdown */}
        <div className="text-right space-y-1">
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-400">Yield</span>
            <span className="text-xs font-mono text-white">{snapshot?.yield_spread?.toFixed(2) ?? '--'}%</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-400">Vol</span>
            <span className="text-xs font-mono text-white">
              {snapshot?.btc_volatility != null 
                ? (snapshot.btc_volatility > 1 ? snapshot.btc_volatility.toFixed(1) : (snapshot.btc_volatility * 100).toFixed(1))
                : '--'}%
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-400">VaR</span>
            <span className="text-xs font-mono text-white">
              {snapshot?.var_95 != null ? (snapshot.var_95 * 100).toFixed(1) : '--'}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${
            score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-green-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-1 font-mono">
        <span>0 STABLE</span>
        <span>40 WATCH</span>
        <span>70 CRITICAL</span>
        <span>100</span>
      </div>
    </div>
  );
});

export default BlackSwanDetector;
