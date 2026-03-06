/**
 * DEFENSE EXECUTION BRAIN
 * L6: Autonomous Capital Defense Execution AI
 * 
 * Calculates DefenseScore and shows Strategic Pivot overlay when > 0.5
 * Autonomous defense actions for capital preservation
 */

import React, { useMemo, useState } from 'react';
import { Shield, AlertTriangle, Zap, ChevronRight, Target, TrendingDown, DollarSign, Activity, X, type LucideIcon } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

// Safe Icon Component - Prevents UI crash if icon is missing
interface SafeIconProps {
  icon?: LucideIcon | null;
  className?: string;
  fallback?: React.ReactNode;
}

const SafeIcon: React.FC<SafeIconProps> = ({ icon: Icon, className = '', fallback = null }) => {
  if (!Icon) return <span className={className}>{fallback}</span>;
  return <Icon className={className} />;
};
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { 
  computeAGISystemState, 
  type DefenseAction,
  type DefenseMetrics 
} from '../services/agiBrainEngine';

// Strategic Pivot Overlay Component
function StrategicPivotOverlay({ 
  actions, 
  defenseScore,
  onClose 
}: { 
  actions: DefenseAction[];
  defenseScore: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl mx-4 bg-[#0a0f1a] border-2 border-red-500/50 rounded-xl shadow-2xl shadow-red-500/20 overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] z-0" style={{ backgroundSize: '100% 4px' }} />
        
        {/* Header */}
        <div className="relative p-6 border-b border-red-500/30 bg-gradient-to-r from-red-950/50 to-transparent">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/30 rounded-xl animate-ping" />
              <div className="relative p-3 bg-red-500/20 rounded-xl border border-red-500/50">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                  STRATEGIC PIVOT REQUIRED
                </h2>
                <div className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded animate-pulse">
                  ACTIVE
                </div>
              </div>
              <p className="text-sm text-red-300/70 font-mono mt-1">
                Defense Score: {(defenseScore * 100).toFixed(1)}% // Threshold Exceeded
              </p>
            </div>
          </div>
        </div>
        
        {/* Actions Grid */}
        <div className="p-6">
          <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-4">
            AUTONOMOUS DEFENSE ACTIONS
          </div>
          
          <div className="space-y-3">
            {actions.map((action, index) => (
              <div 
                key={action.id}
                className={`p-4 rounded-lg border transition-all ${
                  action.priority === 'CRITICAL' 
                    ? 'bg-red-950/30 border-red-500/50' 
                    : action.priority === 'HIGH'
                    ? 'bg-amber-950/30 border-amber-500/50'
                    : 'bg-gray-900/50 border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      action.priority === 'CRITICAL' 
                        ? 'bg-red-500/20 text-red-400' 
                        : action.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white uppercase">
                        {action.action}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {action.impact}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {action.allocation && (
                      <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                        action.allocation.startsWith('-') 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        {action.allocation}
                      </div>
                    )}
                    <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      action.priority === 'CRITICAL' 
                        ? 'bg-red-500 text-white' 
                        : action.priority === 'HIGH'
                        ? 'bg-amber-500 text-black'
                        : 'bg-gray-600 text-white'
                    }`}>
                      {action.priority}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Warning Footer */}
          <div className="mt-6 p-3 rounded-lg bg-blue-950/30 border border-blue-500/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200/70 leading-relaxed">
                These recommendations are generated by the L6 Defense Execution Brain based on current market conditions. 
                Review and validate with your risk management framework before execution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Defense Score Gauge
function DefenseGauge({ score }: { score: number }) {
  const percentage = score * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-gray-800"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={
            score > 0.7 ? 'stroke-red-500' :
            score > 0.5 ? 'stroke-amber-500' :
            score > 0.3 ? 'stroke-yellow-500' : 'stroke-green-500'
          }
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ 
            transition: 'stroke-dashoffset 0.5s ease-in-out',
            filter: score > 0.5 ? 'drop-shadow(0 0 8px currentColor)' : 'none'
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold font-mono tabular-nums ${
          score > 0.7 ? 'text-red-400' :
          score > 0.5 ? 'text-amber-400' :
          score > 0.3 ? 'text-yellow-400' : 'text-green-400'
        }`}>
          {(score * 100).toFixed(0)}
        </span>
        <span className="text-xs font-mono text-gray-400 uppercase">DEFENSE</span>
      </div>
    </div>
  );
}

export function DefenseExecutionBrain() {
  const { uiTheme } = useAdaptiveTheme();
  const { latest: snapshot } = useMarketSnapshot();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  const [showOverlay, setShowOverlay] = useState(false);

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

  const defense = agiState?.defense ?? {
    defenseScore: 0.42,
    survivalProbability: 0.78,
    systemicRiskIndex: 0.35,
    geopoliticalRiskIndex: 0.55,
    volatilityExpansionProb: 0.65,
    autonomousActions: []
  };

  const liquidity = agiState?.liquidity ?? {
    liquidityBrainIndex: -1.2,
    contractionWarning: true,
    m2GrowthVelocity: -2,
    realYieldGrowth: 0.5,
    creditSpreadExpansion: 1.2
  };

  const regime = agiState?.regime ?? {
    regimeSpeed: 3.5,
    currentPhase: 'CONTRACTION' as const,
    liquidityVelocityDelta: -1,
    volatilityStructureDelta: 0.8,
    correlationConvergenceDelta: 0.5
  };

  const strategicPivotRequired = defense.defenseScore > 0.5;

  return (
    <>
      <div className={`rounded-xl border p-4 md:p-6 overflow-hidden ${
        isDark || isHybrid 
          ? 'bg-[#0b0f17] border-[#1f2937]' 
          : 'bg-white border-gray-200'
      } ${strategicPivotRequired ? 'border-red-500/50' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              strategicPivotRequired 
                ? 'bg-red-500/10 border border-red-500/20' 
                : isDark || isHybrid ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50'
            }`}>
              <Shield className={`w-5 h-5 ${strategicPivotRequired ? 'text-red-500' : 'text-amber-500'}`} />
            </div>
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                DEFENSE EXECUTION BRAIN
              </h3>
              <p className={`text-xs font-mono uppercase ${strategicPivotRequired ? 'text-red-400' : 'text-amber-400'}`}>
                L6 // AUTONOMOUS CAPITAL DEFENSE
              </p>
            </div>
          </div>
          
          {strategicPivotRequired && (
            <button 
              onClick={() => setShowOverlay(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors animate-pulse"
            >
              <Zap className="w-4 h-4" />
              <span>VIEW PIVOT</span>
            </button>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Defense Score Gauge */}
          <div className="flex flex-col items-center justify-center">
            <DefenseGauge score={defense.defenseScore} />
            <div className={`mt-3 px-3 py-1 rounded text-xs font-bold uppercase ${
              strategicPivotRequired 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {strategicPivotRequired ? 'PIVOT REQUIRED' : 'STABLE'}
            </div>
          </div>

          {/* Risk Components */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
              RISK COMPONENTS
            </div>
            {[
              { label: 'Survival Probability', value: defense.survivalProbability, invert: true },
              { label: 'Systemic Risk', value: defense.systemicRiskIndex, invert: false },
              { label: 'Geopolitical Risk', value: defense.geopoliticalRiskIndex, invert: false },
              { label: 'Vol Expansion', value: defense.volatilityExpansionProb, invert: false },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-gray-400 uppercase">{item.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        item.invert 
                          ? (item.value > 0.7 ? 'bg-green-500' : item.value > 0.5 ? 'bg-amber-500' : 'bg-red-500')
                          : (item.value > 0.5 ? 'bg-red-500' : item.value > 0.3 ? 'bg-amber-500' : 'bg-green-500')
                      }`}
                      style={{ width: `${item.value * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-mono font-bold tabular-nums w-10 text-right ${
                    item.invert 
                      ? (item.value > 0.7 ? 'text-green-400' : item.value > 0.5 ? 'text-amber-400' : 'text-red-400')
                      : (item.value > 0.5 ? 'text-red-400' : item.value > 0.3 ? 'text-amber-400' : 'text-green-400')
                  }`}>
                    {(item.value * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Regime & Liquidity Status */}
          <div className="space-y-4">
            {/* Liquidity Brain */}
            <div className={`p-3 rounded-lg ${
              liquidity.contractionWarning 
                ? 'bg-red-950/30 border border-red-500/30' 
                : 'bg-gray-900/50 border border-gray-700'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gray-400 uppercase">LIQUIDITY BRAIN (L5)</span>
                {liquidity.contractionWarning && (
                  <span className="text-xs font-bold text-red-400 bg-red-500/20 px-1.5 py-0.5 rounded animate-pulse">
                    WARNING
                  </span>
                )}
              </div>
              <div className={`text-2xl font-bold font-mono tabular-nums ${
                liquidity.liquidityBrainIndex < 0 ? 'text-red-400' : 'text-green-400'
              }`}>
                {liquidity.liquidityBrainIndex.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {liquidity.contractionWarning ? 'CONTRACTION MODE' : 'EXPANSION MODE'}
              </div>
            </div>

            {/* Regime Speed */}
            <div className={`p-3 rounded-lg ${isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gray-400 uppercase">REGIME SPEED (L2)</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  regime.currentPhase === 'CRISIS' ? 'bg-red-500 text-white' :
                  regime.currentPhase === 'CONTRACTION' ? 'bg-amber-500 text-black' :
                  regime.currentPhase === 'BUBBLE' ? 'bg-purple-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {regime.currentPhase}
                </span>
              </div>
              <div className={`text-2xl font-bold font-mono tabular-nums ${
                regime.regimeSpeed > 5 ? 'text-red-400' : 
                regime.regimeSpeed > 3 ? 'text-amber-400' : 'text-green-400'
              }`}>
                {regime.regimeSpeed.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {regime.regimeSpeed > 5 ? 'RAPID TRANSITION' : regime.regimeSpeed > 3 ? 'ELEVATED' : 'STABLE'}
              </div>
            </div>
          </div>
        </div>

        {/* Defense Formula Display */}
        <div className={`mt-6 p-3 rounded-lg ${isDark || isHybrid ? 'bg-gray-900/30 border border-gray-800' : 'bg-gray-50'}`}>
          <div className="text-xs font-mono text-gray-500 leading-relaxed">
            <span className="text-cyan-400">DefenseScore</span> = 
            (1 - <span className="text-green-400">SurvivalProb</span>) * 0.35 + 
            <span className="text-red-400">SystemicRisk</span> * 0.25 + 
            <span className="text-amber-400">GeoRisk</span> * 0.25 + 
            <span className="text-purple-400">VolExpansion</span> * 0.15
          </div>
        </div>
      </div>

      {/* Strategic Pivot Overlay */}
      {showOverlay && strategicPivotRequired && (
        <StrategicPivotOverlay 
          actions={defense.autonomousActions}
          defenseScore={defense.defenseScore}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </>
  );
}
