import React, { useState } from 'react';
import { TrendingUp, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

interface NarrativeMetric {
  name: string;
  value: number;
  trend: 'accelerating' | 'elevated' | 'stable' | 'declining';
  impact: string;
}

interface TransmissionStage {
  stage: string;
  probability: number;
  status: 'active' | 'monitoring' | 'stable';
}

export function NarrativeShockModel() {
  const { uiTheme } = useAdaptiveTheme();
  const [showDetails, setShowDetails] = useState(false);
  
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  // Core Systemic Metrics
  const narrativeShockIndex = 64; // Narrative Shock Index 0-100
  const velocityScore = 71;
  const positioningImbalance = 68;
  const liquidityWithdrawalRisk = 'HIGH';
  
  // Transmission Model Stages
  const transmissionStages: TransmissionStage[] = [
    { stage: 'High Velocity Narratives', probability: 71, status: 'active' },
    { stage: 'Positioning Imbalance', probability: 68, status: 'active' },
    { stage: 'Volatility Spike', probability: 64, status: 'active' },
    { stage: 'Liquidity Withdrawal', probability: 58, status: 'monitoring' },
  ];
  
  // Narrative Metrics
  const narrativeVelocityMetrics: NarrativeMetric[] = [
    { name: 'Narrative Acceleration Rate', value: 71, trend: 'accelerating', impact: 'Information velocity extreme' },
    { name: 'Consensus Formation Speed', value: 68, trend: 'elevated', impact: 'Herd behavior risk rising' },
    { name: 'Sentiment Reversal Probability', value: 62, trend: 'elevated', impact: 'Positioning fragility elevated' },
  ];
  
  const positioningMetrics: NarrativeMetric[] = [
    { name: 'Crowded Trade Intensity', value: 74, trend: 'accelerating', impact: 'Exit risk concentration' },
    { name: 'Leverage Imbalance', value: 66, trend: 'elevated', impact: 'Forced liquidation risk' },
    { name: 'Option Positioning Skew', value: 69, trend: 'elevated', impact: 'Gamma exposure asymmetry' },
  ];
  
  const volatilityMetrics: NarrativeMetric[] = [
    { name: 'Volatility Convexity Risk', value: 64, trend: 'elevated', impact: 'Non-linear expansion potential' },
    { name: 'Correlation Breakdown Probability', value: 59, trend: 'elevated', impact: 'Diversification failure risk' },
    { name: 'Vol Surface Stress', value: 61, trend: 'elevated', impact: 'Implied vol dislocation' },
  ];
  
  const liquidityMetrics: NarrativeMetric[] = [
    { name: 'Market Depth Deterioration', value: 58, trend: 'elevated', impact: 'Execution risk rising' },
    { name: 'Bid-Ask Spread Widening', value: 54, trend: 'elevated', impact: 'Transaction cost stress' },
    { name: 'Liquidity Provider Withdrawal', value: 63, trend: 'elevated', impact: 'Market making capacity declining' },
  ];
  
  // Risk Level Determination
  const getRiskLevel = (value: number): 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL' => {
    if (value >= 75) return 'CRITICAL';
    if (value >= 60) return 'HIGH';
    if (value >= 40) return 'ELEVATED';
    return 'LOW';
  };
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'ELEVATED': return 'text-amber-500';
      default: return 'text-green-500';
    }
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'accelerating': return '↑↑';
      case 'elevated': return '↑';
      case 'stable': return '→';
      case 'declining': return '↓';
      default: return '→';
    }
  };
  
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'accelerating': return 'text-red-400';
      case 'elevated': return 'text-amber-400';
      case 'stable': return 'text-gray-400';
      case 'declining': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };
  
  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-500';
      case 'monitoring': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };
  
  return (
    <div className={`rounded-lg border p-6 ${
      isDark || isHybrid 
        ? 'bg-[#0a1628] border-blue-900/50' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isDark || isHybrid ? 'bg-cyan-950/50' : 'bg-cyan-50'
          }`}>
            <TrendingUp className={`w-5 h-5 ${
              isDark || isHybrid ? 'text-cyan-400' : 'text-cyan-600'
            }`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Narrative Shock Transmission
            </h3>
            <p className={`text-xs ${
              isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Reflexivity and positioning intelligence
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`p-2 rounded-lg transition-colors ${
            isDark || isHybrid 
              ? 'hover:bg-gray-800 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Narrative Shock Index - Primary Metric */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            NARRATIVE SHOCK INDEX
          </div>
          <div className={`text-4xl font-bold mb-1 ${getRiskColor(getRiskLevel(narrativeShockIndex))}`}>
            {narrativeShockIndex}
          </div>
          <div className={`text-xs font-semibold ${getRiskColor(getRiskLevel(narrativeShockIndex))}`}>
            {getRiskLevel(narrativeShockIndex)}
          </div>
        </div>
        
        {/* Velocity Score */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            NARRATIVE VELOCITY
          </div>
          <div className={`text-4xl font-bold mb-1 ${getRiskColor(getRiskLevel(velocityScore))}`}>
            {velocityScore}
          </div>
          <div className={`text-xs font-semibold ${getRiskColor(getRiskLevel(velocityScore))}`}>
            {getRiskLevel(velocityScore)}
          </div>
        </div>
        
        {/* Positioning Imbalance */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            POSITIONING IMBALANCE
          </div>
          <div className={`text-4xl font-bold mb-1 ${getRiskColor(getRiskLevel(positioningImbalance))}`}>
            {positioningImbalance}
          </div>
          <div className={`text-xs font-semibold ${getRiskColor(getRiskLevel(positioningImbalance))}`}>
            {getRiskLevel(positioningImbalance)}
          </div>
        </div>
        
        {/* Liquidity Withdrawal Risk */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            LIQUIDITY WITHDRAWAL RISK
          </div>
          <div className={`text-2xl font-bold mb-1 ${getRiskColor(liquidityWithdrawalRisk)}`}>
            {liquidityWithdrawalRisk}
          </div>
          <div className={`text-xs ${isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'}`}>
            Market depth deteriorating
          </div>
        </div>
      </div>
      
      {/* Reflexivity Impact Explanation - Mobile Visible */}
      <div className={`rounded-lg p-4 mb-6 ${
        isDark || isHybrid 
          ? 'bg-cyan-950/20 border border-cyan-900/50' 
          : 'bg-cyan-50 border border-cyan-200'
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            isDark || isHybrid ? 'text-cyan-400' : 'text-cyan-600'
          }`} />
          <div>
            <div className={`text-sm font-semibold mb-1 ${
              isDark || isHybrid ? 'text-cyan-200' : 'text-cyan-900'
            }`}>
              Reflexivity Transmission Impact
            </div>
            <p className={`text-xs leading-relaxed ${
              isDark || isHybrid ? 'text-cyan-300/80' : 'text-cyan-800'
            }`}>
              High velocity narrative transmission creating crowded positioning. 
              Volatility convexity risk elevated due to gamma exposure asymmetry. 
              Liquidity provider withdrawal probability rising, increasing execution risk and forced liquidation potential.
            </p>
          </div>
        </div>
      </div>
      
      {/* Transmission Model Flow - Mobile Visible */}
      <div className={`rounded-lg p-4 mb-6 ${
        isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className={`text-xs font-semibold mb-4 ${
          isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
        }`}>
          TRANSMISSION MODEL STAGES
        </div>
        <div className="space-y-3">
          {transmissionStages.map((stage, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${getStageStatusColor(stage.status)}`}></div>
              <div className="flex-1">
                <div className={`text-xs font-medium ${
                  isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  {stage.stage}
                </div>
              </div>
              <div className={`text-sm font-bold ${getRiskColor(getRiskLevel(stage.probability))}`}>
                {stage.probability}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Detailed Analytics - Collapsible on Mobile */}
      {showDetails && (
        <div className="space-y-4 pt-4 border-t border-gray-800">
          {/* Narrative Velocity Metrics */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              NARRATIVE VELOCITY
            </div>
            <div className="space-y-2">
              {narrativeVelocityMetrics.map((item, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark || isHybrid ? 'bg-gray-900/30' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <div className={`text-xs font-medium mb-0.5 ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </div>
                    <div className={`text-xs ${
                      isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {item.impact}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                    </span>
                    <span className={`text-lg font-bold ${getRiskColor(getRiskLevel(item.value))}`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Positioning Metrics */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              POSITIONING IMBALANCE
            </div>
            <div className="space-y-2">
              {positioningMetrics.map((item, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark || isHybrid ? 'bg-gray-900/30' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <div className={`text-xs font-medium mb-0.5 ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </div>
                    <div className={`text-xs ${
                      isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {item.impact}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                    </span>
                    <span className={`text-lg font-bold ${getRiskColor(getRiskLevel(item.value))}`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Volatility Metrics */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              VOLATILITY SPIKE RISK
            </div>
            <div className="space-y-2">
              {volatilityMetrics.map((item, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark || isHybrid ? 'bg-gray-900/30' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <div className={`text-xs font-medium mb-0.5 ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </div>
                    <div className={`text-xs ${
                      isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {item.impact}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                    </span>
                    <span className={`text-lg font-bold ${getRiskColor(getRiskLevel(item.value))}`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Liquidity Metrics */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              LIQUIDITY WITHDRAWAL
            </div>
            <div className="space-y-2">
              {liquidityMetrics.map((item, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark || isHybrid ? 'bg-gray-900/30' : 'bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <div className={`text-xs font-medium mb-0.5 ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </div>
                    <div className={`text-xs ${
                      isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {item.impact}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                    </span>
                    <span className={`text-lg font-bold ${getRiskColor(getRiskLevel(item.value))}`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* AI System Integration Notice */}
          <div className={`p-4 rounded-lg border ${
            isDark || isHybrid 
              ? 'bg-blue-950/20 border-blue-900/50' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className={`text-xs font-semibold mb-2 ${
              isDark || isHybrid ? 'text-blue-300' : 'text-blue-900'
            }`}>
              SYSTEMIC INTEGRATION ACTIVE
            </div>
            <div className={`text-xs leading-relaxed space-y-1 ${
              isDark || isHybrid ? 'text-blue-400/80' : 'text-blue-800'
            }`}>
              <div>→ Regime AI: Volatility expansion probability elevated due to positioning imbalance</div>
              <div>→ Black Swan: Reflexivity risk increasing tail event probability via liquidity withdrawal</div>
              <div>→ Survival Engine: Crowded trade exposure and gamma sensitivity calculated</div>
              <div>→ Defense AI: Position sizing reduction and volatility hedging strategies prioritized</div>
            </div>
          </div>
        </div>
      )}
      
      {/* System Status */}
      <div className={`flex items-center justify-between text-xs mt-4 pt-4 border-t ${
        isDark || isHybrid ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-600'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span>Reflexivity Model Active</span>
        </div>
        <span>Last Update: 15m ago</span>
      </div>
    </div>
  );
}
