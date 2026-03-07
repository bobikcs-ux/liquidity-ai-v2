import React from 'react';
import { ShieldAlert, AlertTriangle, TrendingDown } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

export function RiskDefenseAI() {
  const { currentRegime } = useAdaptiveTheme();
  const riskLevel = currentRegime.riskLevel;

  const getRiskColor = () => {
    if (riskLevel >= 80) return 'text-red-500';
    if (riskLevel >= 60) return 'text-amber-500';
    return 'text-yellow-500';
  };

  const getRiskLabel = () => {
    if (riskLevel >= 80) return 'CRITICAL';
    if (riskLevel >= 60) return 'ELEVATED';
    return 'MODERATE';
  };

  return (
    <div className="bg-gradient-to-r from-red-950/40 to-amber-950/20 rounded-xl p-6 border border-red-500/20">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30 animate-pulse">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-lg font-black uppercase tracking-wider text-white">
                Risk Defense AI
              </h2>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                riskLevel >= 80 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {getRiskLabel()}
              </span>
            </div>
            <p className="text-xs font-mono text-gray-400">
              Autonomous threat detection and mitigation protocol active
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[9px] font-mono text-gray-500 uppercase mb-1">
            Systemic Risk Index
          </div>
          <div className={`text-4xl font-black font-mono ${getRiskColor()}`}>
            {riskLevel}%
          </div>
        </div>
      </div>

      {/* Risk Indicators */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-mono text-gray-400 uppercase">Volatility Spike</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {currentRegime.volatilityIndex}
          </div>
          <div className="text-[9px] text-gray-500 font-mono mt-1">
            VIX Terminal Reading
          </div>
        </div>

        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-[10px] font-mono text-gray-400 uppercase">Drawdown Risk</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {Math.round(riskLevel * 0.6)}%
          </div>
          <div className="text-[9px] text-gray-500 font-mono mt-1">
            30-Day Probability
          </div>
        </div>

        <div className="bg-black/30 rounded-lg p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-mono text-gray-400 uppercase">Defense Status</span>
          </div>
          <div className="text-xl font-bold text-green-500 font-mono uppercase">
            Active
          </div>
          <div className="text-[9px] text-gray-500 font-mono mt-1">
            Hedges Deployed
          </div>
        </div>
      </div>

      {/* Warning Message */}
      {riskLevel >= 70 && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-xs font-mono text-red-400">
            <span className="font-bold">WARNING:</span> High-risk conditions detected. 
            Consider reducing exposure and increasing defensive positions. 
            Monitor liquidity conditions closely.
          </p>
        </div>
      )}
    </div>
  );
}
