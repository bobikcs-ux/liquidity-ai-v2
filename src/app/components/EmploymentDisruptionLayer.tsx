import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

interface DisruptionMetric {
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

export function EmploymentDisruptionLayer() {
  const { uiTheme } = useAdaptiveTheme();
  const [showDetails, setShowDetails] = useState(false);
  
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  // Core Systemic Metrics
  const structuralDemandShockProb = 61; // Structural Demand Shock Probability 0-100
  const laborMarketStress = 54;
  const consumptionRisk = 68;
  const creditRepricingRisk = 'ELEVATED';
  
  // Transmission Model Stages
  const transmissionStages: TransmissionStage[] = [
    { stage: 'AI Automation Acceleration', probability: 72, status: 'active' },
    { stage: 'Labor Market Stress', probability: 54, status: 'monitoring' },
    { stage: 'Consumption Risk', probability: 68, status: 'active' },
    { stage: 'Earnings Compression', probability: 63, status: 'active' },
    { stage: 'Credit Repricing', probability: 58, status: 'monitoring' },
  ];
  
  // Disruption Metrics
  const automationMetrics: DisruptionMetric[] = [
    { name: 'AI Adoption Velocity', value: 72, trend: 'accelerating', impact: 'Labor displacement acceleration' },
    { name: 'Job Automation Probability', value: 64, trend: 'elevated', impact: 'White-collar exposure rising' },
    { name: 'Wage Growth Pressure', value: 48, trend: 'declining', impact: 'Income compression risk' },
  ];
  
  const laborMetrics: DisruptionMetric[] = [
    { name: 'Structural Unemployment Risk', value: 54, trend: 'elevated', impact: 'Skill mismatch expanding' },
    { name: 'Labor Force Participation Trend', value: 51, trend: 'stable', impact: 'Productivity transition stress' },
    { name: 'Employment Quality Deterioration', value: 59, trend: 'elevated', impact: 'Earnings stability declining' },
  ];
  
  const consumptionMetrics: DisruptionMetric[] = [
    { name: 'Consumer Confidence Fragility', value: 68, trend: 'elevated', impact: 'Spending pullback risk' },
    { name: 'Discretionary Spending Stress', value: 62, trend: 'elevated', impact: 'Demand contraction pressure' },
    { name: 'Savings Rate Acceleration', value: 56, trend: 'elevated', impact: 'Precautionary behavior rising' },
  ];
  
  const creditMetrics: DisruptionMetric[] = [
    { name: 'Consumer Credit Stress', value: 58, trend: 'elevated', impact: 'Default risk rising' },
    { name: 'Corporate Earnings Risk', value: 63, trend: 'elevated', impact: 'Revenue compression threat' },
    { name: 'Credit Spread Repricing', value: 55, trend: 'elevated', impact: 'Risk premium adjustment' },
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
            isDark || isHybrid ? 'bg-purple-950/50' : 'bg-purple-50'
          }`}>
            <Users className={`w-5 h-5 ${
              isDark || isHybrid ? 'text-purple-400' : 'text-purple-600'
            }`} />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Structural Employment Disruption
            </h3>
            <p className={`text-xs ${
              isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Labor market transmission intelligence
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
        {/* Structural Demand Shock Probability - Primary Metric */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            STRUCTURAL DEMAND SHOCK PROBABILITY
          </div>
          <div className={`text-4xl font-bold mb-1 ${getRiskColor(getRiskLevel(structuralDemandShockProb))}`}>
            {structuralDemandShockProb}%
          </div>
          <div className={`text-xs font-semibold ${getRiskColor(getRiskLevel(structuralDemandShockProb))}`}>
            {getRiskLevel(structuralDemandShockProb)}
          </div>
        </div>
        
        {/* Labor Market Stress */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            LABOR MARKET STRESS
          </div>
          <div className={`text-4xl font-bold mb-1 ${getRiskColor(getRiskLevel(laborMarketStress))}`}>
            {laborMarketStress}
          </div>
          <div className={`text-xs font-semibold ${getRiskColor(getRiskLevel(laborMarketStress))}`}>
            {getRiskLevel(laborMarketStress)}
          </div>
        </div>
        
        {/* Consumption Risk */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            CONSUMPTION RISK
          </div>
          <div className={`text-4xl font-bold mb-1 ${getRiskColor(getRiskLevel(consumptionRisk))}`}>
            {consumptionRisk}
          </div>
          <div className={`text-xs font-semibold ${getRiskColor(getRiskLevel(consumptionRisk))}`}>
            {getRiskLevel(consumptionRisk)}
          </div>
        </div>
        
        {/* Credit Repricing Risk */}
        <div className={`rounded-lg p-4 ${
          isDark || isHybrid ? 'bg-gray-900/50 border border-gray-800' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'
          }`}>
            CREDIT REPRICING RISK
          </div>
          <div className={`text-2xl font-bold mb-1 ${getRiskColor(creditRepricingRisk)}`}>
            {creditRepricingRisk}
          </div>
          <div className={`text-xs ${isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'}`}>
            Earnings compression active
          </div>
        </div>
      </div>
      
      {/* Liquidity Impact Explanation - Mobile Visible */}
      <div className={`rounded-lg p-4 mb-6 ${
        isDark || isHybrid 
          ? 'bg-purple-950/20 border border-purple-900/50' 
          : 'bg-purple-50 border border-purple-200'
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
            isDark || isHybrid ? 'text-purple-400' : 'text-purple-600'
          }`} />
          <div>
            <div className={`text-sm font-semibold mb-1 ${
              isDark || isHybrid ? 'text-purple-200' : 'text-purple-900'
            }`}>
              Structural Demand Transmission Impact
            </div>
            <p className={`text-xs leading-relaxed ${
              isDark || isHybrid ? 'text-purple-300/80' : 'text-purple-800'
            }`}>
              AI automation acceleration creating structural labor market stress. 
              Consumption risk elevated due to earnings compression. 
              Credit repricing probability rising as corporate revenue models face disruption risk.
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
          {/* Automation Metrics */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              AUTOMATION ACCELERATION
            </div>
            <div className="space-y-2">
              {automationMetrics.map((item, index) => (
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
          
          {/* Labor Market Metrics */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              LABOR MARKET STRESS
            </div>
            <div className="space-y-2">
              {laborMetrics.map((item, index) => (
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
          
          {/* Consumption Metrics */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              CONSUMPTION RISK
            </div>
            <div className="space-y-2">
              {consumptionMetrics.map((item, index) => (
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
          
          {/* Credit Metrics */}
          <div>
            <div className={`text-xs font-semibold mb-3 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-700'
            }`}>
              CREDIT REPRICING
            </div>
            <div className="space-y-2">
              {creditMetrics.map((item, index) => (
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
              <div>→ Regime AI: Demand shock probability weighting adjusted for consumption risk</div>
              <div>→ Black Swan: Structural disruption increasing tail risk in credit repricing scenarios</div>
              <div>→ Survival Engine: Sector exposure to labor market disruption calculated</div>
              <div>→ Defense AI: Quality bias and defensive sector positioning prioritized</div>
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
          <span>Disruption Model Active</span>
        </div>
        <span>Last Update: 1h ago</span>
      </div>
    </div>
  );
}
