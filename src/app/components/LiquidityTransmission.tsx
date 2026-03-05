'use client';

import React, { memo, useMemo } from 'react';
import { ArrowRight, Zap, Flame, TrendingUp, Droplets } from 'lucide-react';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  probability: number;
}

// Calculate pipeline stage probabilities from real market data
function calculatePipelineProbabilities(snapshot: {
  systemic_risk?: number;
  btc_volatility?: number;
  yield_spread?: number;
  balance_sheet_delta?: number;
  var_95?: number;
} | null): PipelineStage[] {
  if (!snapshot) {
    return [
      { id: 'conflict', label: 'CONFLICT SHOCK', icon: Zap, probability: 0 },
      { id: 'energy', label: 'ENERGY SHOCK', icon: Flame, probability: 0 },
      { id: 'inflation', label: 'INFLATION IMPACT', icon: TrendingUp, probability: 0 },
      { id: 'liquidity', label: 'LIQUIDITY CONTRACTION', icon: Droplets, probability: 0 },
    ];
  }
  
  // Normalize systemic risk
  const systemicRisk = snapshot.systemic_risk != null 
    ? (snapshot.systemic_risk > 1 ? snapshot.systemic_risk : snapshot.systemic_risk * 100)
    : 50;
  
  // Normalize btc volatility
  const btcVol = snapshot.btc_volatility != null
    ? (snapshot.btc_volatility > 1 ? snapshot.btc_volatility : snapshot.btc_volatility * 100)
    : 50;
  
  // Calculate stage probabilities based on real data
  // Each stage feeds into the next with transmission effects
  const conflictProb = Math.min(95, Math.max(5, Math.round(systemicRisk * 0.8 + Math.abs(snapshot.balance_sheet_delta ?? 0) * 2)));
  const energyProb = Math.min(95, Math.max(5, Math.round(conflictProb * 0.9 + btcVol * 0.3)));
  const inflationProb = Math.min(95, Math.max(5, Math.round(energyProb * 0.95 + Math.abs(snapshot.yield_spread ?? 0) * 8)));
  const liquidityProb = Math.min(95, Math.max(5, Math.round(systemicRisk * 0.7 + (snapshot.var_95 ?? 0) * 100)));
  
  return [
    { id: 'conflict', label: 'CONFLICT SHOCK', icon: Zap, probability: conflictProb },
    { id: 'energy', label: 'ENERGY SHOCK', icon: Flame, probability: energyProb },
    { id: 'inflation', label: 'INFLATION IMPACT', icon: TrendingUp, probability: inflationProb },
    { id: 'liquidity', label: 'LIQUIDITY CONTRACTION', icon: Droplets, probability: liquidityProb },
  ];
}

function getIntensityColor(probability: number): string {
  if (probability >= 70) return 'from-red-500 to-red-600';
  if (probability >= 50) return 'from-amber-500 to-amber-600';
  return 'from-green-500 to-green-600';
}

function getIntensityBorder(probability: number): string {
  if (probability >= 70) return 'border-red-500/50';
  if (probability >= 50) return 'border-amber-500/50';
  return 'border-green-500/50';
}

function getIntensityText(probability: number): string {
  if (probability >= 70) return 'text-red-400';
  if (probability >= 50) return 'text-amber-400';
  return 'text-green-400';
}

interface LiquidityTransmissionProps {
  compact?: boolean;
}

export const LiquidityTransmission = memo(function LiquidityTransmission({ compact = false }: LiquidityTransmissionProps) {
  const { latest: snapshot, loading } = useMarketSnapshot();
  
  const stages = useMemo(() => calculatePipelineProbabilities(snapshot), [snapshot]);
  
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div 
              className={`px-2 py-1 rounded text-xs font-mono font-bold ${getIntensityText(stage.probability)}`}
              title={`${stage.label}: ${stage.probability}%`}
            >
              {loading ? '--' : `${stage.probability}%`}
            </div>
            {index < stages.length - 1 && (
              <ArrowRight className="w-3 h-3 text-gray-600" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
  
  return (
    <div className="bg-[#0a1628] border border-blue-900/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Liquidity Transmission Pipeline
        </h3>
        <span className="text-xs text-blue-400 font-mono">REAL-TIME</span>
      </div>
      
      {/* Pipeline visualization */}
      <div className="flex flex-col md:flex-row items-stretch gap-2 md:gap-0">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const intensityColor = getIntensityColor(stage.probability);
          const intensityBorder = getIntensityBorder(stage.probability);
          const intensityText = getIntensityText(stage.probability);
          
          return (
            <React.Fragment key={stage.id}>
              {/* Stage card */}
              <div className={`flex-1 border ${intensityBorder} rounded-lg p-3 bg-gray-900/50`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded bg-gradient-to-br ${intensityColor}`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs text-gray-400 font-mono uppercase tracking-tight">
                    {stage.label}
                  </span>
                </div>
                <div className={`text-2xl font-black font-mono tabular-nums ${intensityText}`}>
                  {loading ? (
                    <span className="inline-block w-12 h-8 bg-gray-700 rounded animate-pulse" />
                  ) : (
                    `${stage.probability}%`
                  )}
                </div>
                {/* Intensity bar */}
                <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${intensityColor} transition-all duration-500`}
                    style={{ width: `${stage.probability}%` }}
                  />
                </div>
              </div>
              
              {/* Arrow connector */}
              {index < stages.length - 1 && (
                <div className="hidden md:flex items-center justify-center w-8 relative">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-gray-700" />
                  <ArrowRight className={`w-4 h-4 z-10 ${intensityText} bg-[#0a1628] p-0.5`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mt-3 text-xs font-mono text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> &lt;50%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> 50-70%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500" /> &gt;70%
        </span>
      </div>
    </div>
  );
});

export default LiquidityTransmission;
