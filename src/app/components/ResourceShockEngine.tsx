import React, { useState } from 'react';
import { Zap, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

interface ResourceLayer {
  name: string;
  value: number;
  trend: 'accelerating' | 'elevated' | 'stable' | 'declining';
  impact: string;
}

export function ResourceShockEngine() {
  const { uiTheme } = useAdaptiveTheme();
  const [showDetails, setShowDetails] = useState(false);
  
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  // Core Systemic Metrics
  const grsi = 67; // Global Resource Stress Index 0-100
  const energyShockVelocity = 58;
  const policyReactionProbability = 73;
  const liquidityTransmissionRisk = 'HIGH';
  
  // Survival Impact Adjustment
  const survivalImpact = -8.4; // Percentage adjustment
  
  // Input Signal Layers
  const energyLayer: ResourceLayer[] = [
    { name: 'Oil Volatility Acceleration', value: 64, trend: 'elevated', impact: 'Increasing inflation risk' },
    { name: 'Energy Futures Term Structure', value: 52, trend: 'stable', impact: 'Contango stress moderate' },
    { name: 'Strategic Reserve Movements', value: 71, trend: 'accelerating', impact: 'Supply buffer depleting' },
  ];
  
  const supplyChainLayer: ResourceLayer[] = [
    { name: 'Shipping Route Risk', value: 48, trend: 'elevated', impact: 'Chokepoint vulnerability' },
    { name: 'Freight Cost Velocity', value: 62, trend: 'accelerating', impact: 'Cost transmission rising' },
  ];
  
  const strategicResourcesLayer: ResourceLayer[] = [
    { name: 'Rare Earth Stress', value: 59, trend: 'elevated', impact: 'Tech sector exposure' },
    { name: 'Industrial Metals Volatility', value: 55, trend: 'stable', impact: 'Manufacturing stress' },
  ];
  
  const policyTransmissionLayer: ResourceLayer[] = [
    { name: 'Inflation Expectation Acceleration', value: 76, trend: 'accelerating', impact: 'Policy tightening bias' },
    { name: 'Central Bank Tightening Bias', value: 68, trend: 'elevated', impact: 'Liquidity contraction risk' },
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
            isDark || isHybrid ? 'bg-orange-950/50' : 'bg-orange-50'
          }`}>
            <Zap className={`w-5 h-5 ${
              isDark || isHybrid ? 'text-orange-400' : 'text-orange-600'
            }`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Global Resource Transmission
            </h3>
            <p className={`text-xs ${
              isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Systemic liquidity stress layer
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
      
      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* GRSI - Primary Metric */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            GLOBAL RESOURCE STRESS INDEX
          </div>
          <div className={`text-4xl font-bold mb-1 ${getRiskColor(getRiskLevel(grsi))}`}>
            {grsi}
          </div>
          <div className={`text-xs font-semibold ${getRiskColor(getRiskLevel(grsi))}`}>
            {getRiskLevel(grsi)}
          </div>
        </div>
        
        {/* Energy Shock Velocity */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            ENERGY SHOCK VELOCITY
          </div>
          <div className={`text-4xl font-bold mb-1 ${getRiskColor(getRiskLevel(energyShockVelocity))}`}>
            {energyShockVelocity}
          </div>
          <div className={`text-xs font-semibold ${getRiskColor(getRiskLevel(energyShockVelocity))}`}>
            {getRiskLevel(energyShockVelocity)}
          </div>
        </div>
        
        {/* Policy Reaction Probability */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            POLICY REACTION PROBABILITY
          </div>
          <div className={`text-4xl font-bold mb-1 ${getRiskColor(getRiskLevel(policyReactionProbability))}`}>
            {policyReactionProbability}%
          </div>
          <div className={`text-xs font-semibold ${getRiskColor(getRiskLevel(policyReactionProbability))}`}>
            {getRiskLevel(policyReactionProbability)}
          </div>
        </div>
        
        {/* Liquidity Transmission Risk */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            LIQUIDITY TRANSMISSION RISK
          </div>
          <div className={`text-2xl font-bold mb-1 ${getRiskColor(liquidityTransmissionRisk)}`}>
            {liquidityTransmissionRisk}
          </div>
          <div className={`text-xs ${isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'}`}>
            Contraction bias elevated
          </div>
        </div>
      </div>
      
      {/* Impact on Liquidity - Mobile Visible */}
      <div className={`rounded-lg p-4 mb-6 ${
        isDark || isHybrid 
          ? 'bg-orange-950/20 border border-orange-900/50' 
          : 'bg-orange-50 border border-orange-200'
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            isDark || isHybrid ? 'text-orange-400' : 'text-orange-600'
          }`} />
          <div>
            <div className={`text-sm font-semibold mb-1 ${
              isDark || isHybrid ? 'text-orange-200' : 'text-orange-900'
            }`}>
              Impact on Liquidity Regime
            </div>
            <p className={`text-xs leading-relaxed ${
              isDark || isHybrid ? 'text-orange-300/80' : 'text-orange-800'
            }`}>
              Resource-driven inflation shock increasing liquidity contraction risk. 
              Policy reaction probability elevated. Regime AI probability weighting adjusted 
              toward contraction and volatility expansion scenarios.
            </p>
          </div>
        </div>
      </div>
      
      {/* Survival Impact Adjustment - Mobile Visible */}
      <div className={`flex items-center justify-between p-4 rounded-lg mb-6 ${
        isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div>
          <div className={`text-xs font-semibold mb-1 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            SURVIVAL IMPACT ADJUSTMENT
          </div>
          <p className={`text-xs ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
            Portfolio sensitivity to resource stress
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-red-500">{survivalImpact}%</div>
        </div>
      </div>
      
      {/* Detailed Analytics - Collapsible on Mobile */}
      {showDetails && (
        <div className="space-y-4 pt-4 border-t border-gray-800">
          {/* Energy Layer */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              ENERGY LAYER
            </div>
            <div className="space-y-2">
              {energyLayer.map((item, index) => (
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
          
          {/* Supply Chain Layer */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              SUPPLY CHAIN LAYER
            </div>
            <div className="space-y-2">
              {supplyChainLayer.map((item, index) => (
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
          
          {/* Strategic Resources Layer */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              STRATEGIC RESOURCES LAYER
            </div>
            <div className="space-y-2">
              {strategicResourcesLayer.map((item, index) => (
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
          
          {/* Policy Transmission Layer */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              POLICY TRANSMISSION LAYER
            </div>
            <div className="space-y-2">
              {policyTransmissionLayer.map((item, index) => (
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
              <div>→ Regime AI: Probability weighting adjusted toward contraction</div>
              <div>→ Black Swan: Tail risk probability elevated due to resource-credit alignment</div>
              <div>→ Survival Engine: Portfolio sensitivity to energy/inflation exposure calculated</div>
              <div>→ Defense AI: Liquidity reserve and defensive allocation strategies prioritized</div>
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
        <span>Last Update: 3m ago</span>
      </div>
    </div>
  );
}
