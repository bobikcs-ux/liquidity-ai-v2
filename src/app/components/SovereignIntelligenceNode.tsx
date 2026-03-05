/**
 * SOVEREIGN INTELLIGENCE NODE
 * L10-L8: Civilization & Sovereign Brain
 * 
 * Military-style flight instrument gauges for:
 * - Reserve Currency Dominance
 * - Trade Settlement Volume
 * - Capital Control Strength
 * - Sovereign Power Index
 */

import React, { useMemo } from 'react';
import { Globe, Shield, TrendingDown, AlertTriangle, Zap, Target } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { 
  computeAGISystemState, 
  type SovereignPowerMetrics,
  type CivilizationMetrics 
} from '../services/agiBrainEngine';

// Military-style circular gauge component
function TacticalGauge({ 
  value, 
  maxValue = 100, 
  label, 
  sublabel,
  size = 'md',
  color = 'blue',
  showDecay = false,
  decayValue = 0
}: {
  value: number;
  maxValue?: number;
  label: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'amber' | 'red' | 'green' | 'cyan';
  showDecay?: boolean;
  decayValue?: number;
}) {
  const percentage = Math.min(100, (value / maxValue) * 100);
  const angle = (percentage / 100) * 270 - 135; // -135 to 135 degrees
  
  const sizeClasses = {
    sm: { container: 'w-20 h-20', text: 'text-lg', label: 'text-xs' },
    md: { container: 'w-28 h-28', text: 'text-2xl', label: 'text-xs' },
    lg: { container: 'w-36 h-36', text: 'text-3xl', label: 'text-xs' }
  };
  
  const colorClasses = {
    blue: { stroke: 'stroke-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/30' },
    amber: { stroke: 'stroke-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/30' },
    red: { stroke: 'stroke-red-500', text: 'text-red-400', glow: 'shadow-red-500/30' },
    green: { stroke: 'stroke-green-500', text: 'text-green-400', glow: 'shadow-green-500/30' },
    cyan: { stroke: 'stroke-cyan-500', text: 'text-cyan-400', glow: 'shadow-cyan-500/30' }
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size].container} relative`}>
        {/* Outer ring - tactical border */}
        <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 100 100">
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-800"
            strokeDasharray="198"
            strokeDashoffset="66"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="4"
            className={colorClasses[color].stroke}
            strokeDasharray="198"
            strokeDashoffset={198 - (percentage / 100) * 132}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px var(--tw-shadow-color))` }}
          />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick, i) => (
            <line
              key={tick}
              x1="50"
              y1="12"
              x2="50"
              y2="16"
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-600"
              transform={`rotate(${(tick / 100) * 270} 50 50)`}
            />
          ))}
        </svg>
        
        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${sizeClasses[size].text} font-bold font-mono tabular-nums ${colorClasses[color].text}`}>
            {value.toFixed(1)}
          </span>
          {showDecay && decayValue !== 0 && (
            <span className={`text-xs font-mono ${decayValue < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {decayValue > 0 ? '+' : ''}{decayValue.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <div className="text-center mt-2">
        <div className={`${sizeClasses[size].label} font-mono font-bold text-gray-400 uppercase tracking-wider`}>
          {label}
        </div>
        {sublabel && (
          <div className="text-xs font-mono text-gray-400 uppercase">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

// Power block comparison bar
function PowerBlock({ 
  label, 
  value, 
  trend,
  color 
}: { 
  label: string; 
  value: number; 
  trend: 'up' | 'down' | 'stable';
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-xs font-mono text-gray-400 uppercase truncate">{label}</div>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="w-12 text-right">
        <span className="text-xs font-mono font-bold text-white tabular-nums">{value.toFixed(0)}%</span>
      </div>
      <div className="w-4">
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
        {trend === 'up' && <TrendingDown className="w-3 h-3 text-green-400 rotate-180" />}
        {trend === 'stable' && <div className="w-3 h-0.5 bg-gray-500" />}
      </div>
    </div>
  );
}

export function SovereignIntelligenceNode() {
  const { uiTheme } = useAdaptiveTheme();
  const { latest: snapshot } = useMarketSnapshot();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  // Compute AGI system state from market data
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

  const sovereign = agiState?.sovereign ?? {
    reserveCurrencyShare: 58,
    tradeSettlementVolume: 62,
    capitalControlStrength: 45,
    digitalCurrencyAdoption: 23,
    sovereignPowerIndex: 54
  };

  const civilization = agiState?.civilization ?? {
    demographicHealth: 62,
    economicSustainability: 55,
    technologicalAdaptation: 78,
    geopoliticalStability: 45,
    civilizationScore: 60
  };

  // Currency power blocks data
  const currencyBlocks = [
    { label: 'USD', value: sovereign.reserveCurrencyShare, trend: 'down' as const, color: 'bg-blue-500' },
    { label: 'EUR', value: 20, trend: 'stable' as const, color: 'bg-cyan-500' },
    { label: 'CNY', value: 12, trend: 'up' as const, color: 'bg-red-500' },
    { label: 'JPY', value: 5.5, trend: 'down' as const, color: 'bg-amber-500' },
    { label: 'OTHER', value: 4.5, trend: 'up' as const, color: 'bg-gray-500' },
  ];

  return (
    <div className={`rounded-xl border p-4 md:p-6 overflow-hidden ${
      isDark || isHybrid 
        ? 'bg-[#0b0f17] border-[#1f2937]' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header - Tactical Style */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark || isHybrid ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-cyan-50'}`}>
            <Globe className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              SOVEREIGN INTELLIGENCE NODE
            </h3>
            <p className="text-xs font-mono text-cyan-400 uppercase">L10-L8 // CIVILIZATION & MONETARY POWER</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-xs font-mono text-gray-400">LIVE</span>
        </div>
      </div>

      {/* Main Gauges Grid - Flight Instrument Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <TacticalGauge 
          value={sovereign.sovereignPowerIndex} 
          label="SOVEREIGN PWR" 
          sublabel="Index"
          color="cyan"
          size="md"
        />
        <TacticalGauge 
          value={sovereign.reserveCurrencyShare} 
          label="RESERVE DOM" 
          sublabel="USD Share"
          color="blue"
          size="md"
          showDecay
          decayValue={-2.3}
        />
        <TacticalGauge 
          value={sovereign.tradeSettlementVolume} 
          label="TRADE VOL" 
          sublabel="Settlement"
          color="green"
          size="md"
        />
        <TacticalGauge 
          value={sovereign.capitalControlStrength} 
          label="CAP CONTROL" 
          sublabel="Strength"
          color="amber"
          size="md"
          showDecay
          decayValue={+5.2}
        />
      </div>

      {/* Currency Power Blocks - Reserve Currency Decay */}
      <div className={`rounded-lg p-4 mb-6 ${isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
            RESERVE CURRENCY DOMINANCE MATRIX
          </span>
        </div>
        <div className="space-y-2">
          {currencyBlocks.map((block, i) => (
            <PowerBlock key={i} {...block} />
          ))}
        </div>
      </div>

      {/* Civilization Score Panel */}
      <div className={`rounded-lg p-4 ${isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
              CIVILIZATION STABILITY INDEX (L10)
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${
            civilization.civilizationScore >= 70 ? 'text-green-400' :
            civilization.civilizationScore >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {civilization.civilizationScore.toFixed(1)}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'DEMOGRAPHIC', value: civilization.demographicHealth, icon: '01' },
            { label: 'ECONOMIC', value: civilization.economicSustainability, icon: '02' },
            { label: 'TECH ADAPT', value: civilization.technologicalAdaptation, icon: '03' },
            { label: 'GEOPOLITICAL', value: civilization.geopoliticalStability, icon: '04' },
          ].map((metric, i) => (
            <div key={i} className={`p-3 rounded-lg ${isDark || isHybrid ? 'bg-black/30' : 'bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gray-400">{metric.icon}</span>
                <span className={`text-lg font-bold font-mono tabular-nums ${
                  metric.value >= 70 ? 'text-green-400' :
                  metric.value >= 50 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {metric.value.toFixed(0)}
                </span>
              </div>
              <div className="text-xs font-mono text-gray-400 uppercase">{metric.label}</div>
              <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    metric.value >= 70 ? 'bg-green-500' :
                    metric.value >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning Banner - if civilization score is low */}
      {civilization.civilizationScore < 50 && (
        <div className="mt-4 p-3 rounded-lg bg-red-950/30 border border-red-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-red-400 uppercase">STRUCTURAL INSTABILITY DETECTED</div>
            <div className="text-xs text-red-300/70">Long-term civilization risk factors exceeding thresholds</div>
          </div>
        </div>
      )}
    </div>
  );
}
