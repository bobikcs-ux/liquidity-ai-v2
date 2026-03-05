import React, { useState } from 'react';
import { Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

interface TransmissionLayer {
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

export function ConflictTransmissionModel() {
  const { uiTheme } = useAdaptiveTheme();
  const [showDetails, setShowDetails] = useState(false);
  
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  // Core Systemic Metrics
  const ctri = 58; // Conflict Transmission Risk Index 0-100
  const liquidityImpactProbability = 64;
  const policyShockProbability = 52;
  const creditContagionRisk = 'ELEVATED';
  
  // Transmission Model Stages
  const transmissionStages: TransmissionStage[] = [
    { stage: 'Conflict Shock', probability: 58, status: 'active' },
    { stage: 'Resource & Trade Disruption', probability: 64, status: 'active' },
    { stage: 'Inflation Acceleration Risk', probability: 71, status: 'active' },
    { stage: 'Central Bank Reaction', probability: 68, status: 'active' },
    { stage: 'Liquidity Contraction', probability: 52, status: 'monitoring' },
    { stage: 'Systemic Risk Expansion', probability: 44, status: 'monitoring' },
  ];
  
  // Input Signal Layers
  const militaryEscalationLayer: TransmissionLayer[] = [
    { name: 'Conflict Intensity Index', value: 62, trend: 'elevated', impact: 'Regional instability elevated' },
    { name: 'Strategic Chokepoint Risk', value: 68, trend: 'accelerating', impact: 'Trade route vulnerability' },
    { name: 'Regional Instability Probability', value: 55, trend: 'stable', impact: 'Monitoring thresholds' },
  ];
  
  const resourceDisruptionLayer: TransmissionLayer[] = [
    { name: 'Energy Supply Shock Probability', value: 71, trend: 'accelerating', impact: 'Price transmission risk' },
    { name: 'Critical Resource Export Restrictions', value: 59, trend: 'elevated', impact: 'Supply chain stress' },
    { name: 'Shipping Route Stress', value: 64, trend: 'elevated', impact: 'Freight cost acceleration' },
  ];
  
  const financialMarketReactionLayer: TransmissionLayer[] = [
    { name: 'Safe Haven Flow Intensity', value: 73, trend: 'accelerating', impact: 'Risk-off acceleration' },
    { name: 'Volatility Spike Acceleration', value: 66, trend: 'elevated', impact: 'Vol expansion risk' },
    { name: 'Risk Asset Correlation Shifts', value: 58, trend: 'elevated', impact: 'Diversification breakdown' },
  ];
  
  const creditFundingLayer: TransmissionLayer[] = [
    { name: 'Sovereign Spread Widening', value: 54, trend: 'elevated', impact: 'EM credit stress' },
    { name: 'Emerging Market Funding Stress', value: 61, trend: 'elevated', impact: 'Capital flow reversal' },
    { name: 'USD Funding Pressure', value: 48, trend: 'stable', impact: 'Funding markets stable' },
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
    <div className={`rounded-xl border p-4 md:p-6 min-h-[260px] w-full flex flex-col overflow-hidden ${
      isDark || isHybrid 
        ? 'bg-[#0b0f17] border-[#1f2937]' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isDark || isHybrid ? 'bg-red-950/50' : 'bg-red-50'
          }`}>
            <Shield className={`w-5 h-5 ${
              isDark || isHybrid ? 'text-red-400' : 'text-red-600'
            }`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Global Conflict Transmission
            </h3>
            <p className={`text-xs ${
              isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Financial transmission intelligence layer
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          aria-label={showDetails ? 'Collapse details' : 'Expand details'}
          className={`p-2 rounded-lg transition-colors ${
            isDark || isHybrid 
              ? 'hover:bg-gray-800 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Core Metrics Grid - Responsive 2x2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {/* CTRI - Primary Metric */}
        <div className={`rounded-lg p-3 md:p-4 overflow-hidden ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 truncate ${
            isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
          }`}>
            CTRI
          </div>
          <div className={`text-2xl md:text-4xl font-bold mb-1 tabular-nums ${getRiskColor(getRiskLevel(ctri))}`}>
            {ctri}
          </div>
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap ${
            getRiskLevel(ctri) === 'CRITICAL' || getRiskLevel(ctri) === 'HIGH' 
              ? 'bg-red-500/20 text-red-400' 
              : getRiskLevel(ctri) === 'ELEVATED' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-green-500/20 text-green-400'
          }`}>
            {getRiskLevel(ctri)}
          </span>
        </div>
        
        {/* Liquidity Impact Probability */}
        <div className={`rounded-lg p-3 md:p-4 overflow-hidden ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 truncate ${
            isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
          }`}>
            LIQUIDITY IMPACT
          </div>
          <div className={`text-2xl md:text-4xl font-bold mb-1 tabular-nums ${getRiskColor(getRiskLevel(liquidityImpactProbability))}`}>
            {liquidityImpactProbability}%
          </div>
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap ${
            getRiskLevel(liquidityImpactProbability) === 'CRITICAL' || getRiskLevel(liquidityImpactProbability) === 'HIGH' 
              ? 'bg-red-500/20 text-red-400' 
              : getRiskLevel(liquidityImpactProbability) === 'ELEVATED' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-green-500/20 text-green-400'
          }`}>
            {getRiskLevel(liquidityImpactProbability)}
          </span>
        </div>
        
        {/* Policy Shock Probability */}
        <div className={`rounded-lg p-3 md:p-4 overflow-hidden ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 truncate ${
            isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
          }`}>
            POLICY SHOCK
          </div>
          <div className={`text-2xl md:text-4xl font-bold mb-1 tabular-nums ${getRiskColor(getRiskLevel(policyShockProbability))}`}>
            {policyShockProbability}%
          </div>
          <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded whitespace-nowrap ${
            getRiskLevel(policyShockProbability) === 'CRITICAL' || getRiskLevel(policyShockProbability) === 'HIGH' 
              ? 'bg-red-500/20 text-red-400' 
              : getRiskLevel(policyShockProbability) === 'ELEVATED' 
                ? 'bg-amber-500/20 text-amber-400' 
                : 'bg-green-500/20 text-green-400'
          }`}>
            {getRiskLevel(policyShockProbability)}
          </span>
        </div>
        
        {/* Credit Contagion Risk */}
        <div className={`rounded-lg p-3 md:p-4 overflow-hidden ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 truncate ${
            isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
          }`}>
            CREDIT CONTAGION
          </div>
          <div className={`text-xl md:text-2xl font-bold mb-1 ${getRiskColor(creditContagionRisk)}`}>
            {creditContagionRisk}
          </div>
          <div className={`text-xs truncate ${isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'}`}>
            EM funding stress
          </div>
        </div>
      </div>
      
      {/* Liquidity Impact Explanation - Mobile Visible */}
      <div className={`rounded-lg p-4 mb-6 ${
        isDark || isHybrid 
          ? 'bg-red-950/20 border border-red-900/50' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            isDark || isHybrid ? 'text-red-400' : 'text-red-600'
          }`} />
          <div>
            <div className={`text-sm font-semibold mb-1 ${
              isDark || isHybrid ? 'text-red-200' : 'text-red-900'
            }`}>
              Financial Transmission Impact
            </div>
            <p className={`text-xs leading-relaxed ${
              isDark || isHybrid ? 'text-red-300/80' : 'text-red-800'
            }`}>
              Regional conflict stress propagating through energy markets and trade routes. 
              Safe haven flows accelerating, volatility expansion risk elevated. 
              Regime AI contraction probability weighting adjusted for liquidity transmission risk.
            </p>
          </div>
        </div>
      </div>
      
      {/* Transmission Model Flow - Mobile Visible */}
      <div className={`rounded-lg p-3 md:p-4 mb-4 md:mb-6 ${
        isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className={`text-xs font-semibold mb-3 md:mb-4 ${
          isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
        }`}>
          TRANSMISSION MODEL STAGES
        </div>
        <div className="space-y-2">
          {transmissionStages.map((stage, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStageStatusColor(stage.status)}`}></div>
                <div className={`text-xs font-medium truncate ${
                  isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                }`}>
                  {stage.stage}
                </div>
              </div>
              <div className={`text-sm font-bold tabular-nums min-w-[48px] text-right ${getRiskColor(getRiskLevel(stage.probability))}`}>
                {stage.probability}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Detailed Analytics - Collapsible on Mobile */}
      {showDetails && (
        <div className="space-y-4 pt-4 border-t border-gray-800">
          {/* Military Escalation Layer */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              MILITARY ESCALATION INDICATORS
            </div>
            <div className="space-y-2">
              {militaryEscalationLayer.map((item, index) => (
                <div key={index} className={`flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg overflow-hidden ${
                  isDark || isHybrid ? 'bg-gray-900/30' : 'bg-gray-50'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium mb-0.5 truncate ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </div>
                    <div className={`text-xs truncate ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {item.impact}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                    </span>
                    <span className={`text-base md:text-lg font-bold tabular-nums min-w-[2.5rem] text-right ${getRiskColor(getRiskLevel(item.value))}`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Resource Disruption Layer */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              RESOURCE DISRUPTION SIGNALS
            </div>
            <div className="space-y-2">
              {resourceDisruptionLayer.map((item, index) => (
                <div key={index} className={`flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg overflow-hidden ${
                  isDark || isHybrid ? 'bg-gray-900/30' : 'bg-gray-50'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium mb-0.5 truncate ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </div>
                    <div className={`text-xs truncate ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {item.impact}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                    </span>
                    <span className={`text-base md:text-lg font-bold tabular-nums min-w-[2.5rem] text-right ${getRiskColor(getRiskLevel(item.value))}`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Financial Market Reaction Layer */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              FINANCIAL MARKET REACTION LAYER
            </div>
            <div className="space-y-2">
              {financialMarketReactionLayer.map((item, index) => (
                <div key={index} className={`flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg overflow-hidden ${
                  isDark || isHybrid ? 'bg-gray-900/30' : 'bg-gray-50'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium mb-0.5 truncate ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </div>
                    <div className={`text-xs truncate ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {item.impact}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                    </span>
                    <span className={`text-base md:text-lg font-bold tabular-nums min-w-[2.5rem] text-right ${getRiskColor(getRiskLevel(item.value))}`}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Credit & Funding Layer */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              CREDIT & FUNDING LAYER
            </div>
            <div className="space-y-2">
              {creditFundingLayer.map((item, index) => (
                <div key={index} className={`flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg overflow-hidden ${
                  isDark || isHybrid ? 'bg-gray-900/30' : 'bg-gray-50'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium mb-0.5 truncate ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {item.name}
                    </div>
                    <div className={`text-xs truncate ${
                      isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {item.impact}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold ${getTrendColor(item.trend)}`}>
                      {getTrendIcon(item.trend)}
                    </span>
                    <span className={`text-base md:text-lg font-bold tabular-nums min-w-[2.5rem] text-right ${getRiskColor(getRiskLevel(item.value))}`}>
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
              <div>→ Regime AI: Probability weighting adjusted for conflict transmission risk</div>
              <div>→ Black Swan: Tail risk elevated due to safe haven acceleration + vol expansion</div>
              <div>→ Survival Engine: Exposure to energy/EM credit calculated in downside scenarios</div>
              <div>→ Defense AI: Liquidity reserve prioritization and risk-off positioning strategies active</div>
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
          <span>Transmission Model Active</span>
        </div>
        <span>Last Update: 5m ago</span>
      </div>
    </div>
  );
}
