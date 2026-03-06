import React from 'react';
import { Shield, AlertTriangle, TrendingDown, Zap, Activity, Target } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { IntelligenceGuard } from './IntelligenceGuard';
import { useSubscription } from '../context/SubscriptionContext';

interface DefenseAction {
  priority: 'critical' | 'high' | 'medium';
  action: string;
  rationale: string;
  impact: string;
}

// Core component (internal)
function RiskDefenseAICore() {
  const { currentRegime, uiTheme } = useAdaptiveTheme();
  
  // Only show in high-risk regimes
  if (currentRegime.riskLevel < 60) {
    return null;
  }
  
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  const actions: DefenseAction[] = [
    {
      priority: 'critical',
      action: 'Add 15-20% Put Protection',
      rationale: `Market in ${currentRegime.regime} regime with ${currentRegime.riskLevel}% risk level`,
      impact: 'Protect against -30% drawdown scenario',
    },
    {
      priority: 'high',
      action: 'Reduce Leverage Exposure',
      rationale: `Volatility index at ${currentRegime.volatilityIndex}%`,
      impact: 'Lower portfolio beta to 0.6-0.7',
    },
    {
      priority: 'high',
      action: 'Increase Cash Allocation',
      rationale: `Liquidity score deteriorating: ${currentRegime.liquidityScore}/100`,
      impact: 'Target 20-25% cash for defensive positioning',
    },
  ];
  
  if (currentRegime.regime === 'stress') {
    actions.unshift({
      priority: 'critical',
      action: 'ACTIVATE CRISIS PROTOCOL',
      rationale: 'Market in systemic stress phase',
      impact: 'Full defensive mode: hedges + deleveraging',
    });
  }
  
  return (
    <div
      className={`rounded-lg shadow-sm border transition-colors duration-500 ${
        isDark 
          ? 'bg-[#1a2332] border-red-900/50' 
          : isHybrid 
          ? 'bg-[#242b3d] border-red-800/50'
          : 'bg-white border-red-200'
      }`}
    >
      {/* Header - Command Center Style */}
      <div className={`border-b p-6 ${
        isDark ? 'border-red-900/50 bg-red-950/20' : 
        isHybrid ? 'border-red-800/50 bg-red-950/10' : 
        'border-red-100 bg-red-50/50'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-md flex items-center justify-center ${
              isDark || isHybrid ? 'bg-red-900/50' : 'bg-red-100'
            }`}>
              <Shield className={`w-6 h-6 ${
                isDark || isHybrid ? 'text-red-400' : 'text-red-500'
              }`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold mb-1 ${
                isDark || isHybrid ? 'text-red-400' : 'text-red-900'
              }`}>
                Autonomous Risk Defense AI
              </h3>
              <p className={`text-sm ${
                isDark || isHybrid ? 'text-red-300/80' : 'text-red-700'
              }`}>
                Active protection recommendations
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
            isDark || isHybrid ? 'bg-red-900/50' : 'bg-red-200'
          }`}>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className={`text-xs font-semibold tracking-wider ${
              isDark || isHybrid ? 'text-red-300' : 'text-red-900'
            }`}>
              ALERT ACTIVE
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Threat Assessment - 3 Module Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* 1. Threat Detection */}
          <div className={`p-4 rounded-md border ${
            isDark ? 'bg-gray-900/50 border-gray-800' : 
            isHybrid ? 'bg-gray-800/50 border-gray-700' : 
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className={`w-4 h-4 ${
                isDark || isHybrid ? 'text-red-400' : 'text-red-500'
              }`} />
              <span className={`text-xs font-semibold tracking-wide ${
                isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
              }`}>
                THREAT DETECTION
              </span>
            </div>
            
            <div className="space-y-2 text-center">
              <div className={`text-3xl font-bold ${
                isDark || isHybrid ? 'text-red-400' : 'text-red-500'
              }`}>
                {currentRegime.riskLevel}%
              </div>
              <div className={`text-xs ${
                isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Risk Level
              </div>
              
              <div className={`pt-2 mt-2 border-t text-xs ${
                isDark || isHybrid ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
              }`}>
                Liquidity stress probability: {currentRegime.riskLevel + 10}%
              </div>
            </div>
          </div>
          
          {/* 2. Portfolio Vulnerability */}
          <div className={`p-4 rounded-md border ${
            isDark ? 'bg-gray-900/50 border-gray-800' : 
            isHybrid ? 'bg-gray-800/50 border-gray-700' : 
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Target className={`w-4 h-4 ${
                isDark || isHybrid ? 'text-amber-400' : 'text-amber-600'
              }`} />
              <span className={`text-xs font-semibold tracking-wide ${
                isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
              }`}>
                VULNERABILITY MAP
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                    High Beta Exposure
                  </span>
                  <span className={`font-semibold ${
                    isDark || isHybrid ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    High
                  </span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${
                  isDark || isHybrid ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <div className="h-full bg-amber-500" style={{ width: '73%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                    Leverage Risk
                  </span>
                  <span className={`font-semibold ${
                    isDark || isHybrid ? 'text-red-400' : 'text-red-500'
                  }`}>
                    Critical
                  </span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${
                  isDark || isHybrid ? 'bg-gray-800' : 'bg-gray-200'
                }`}>
                  <div className="h-full bg-red-500" style={{ width: '86%' }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 3. Market Conditions */}
          <div className={`p-4 rounded-md border ${
            isDark ? 'bg-gray-900/50 border-gray-800' : 
            isHybrid ? 'bg-gray-800/50 border-gray-700' : 
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className={`w-4 h-4 ${
                isDark || isHybrid ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className={`text-xs font-semibold tracking-wide ${
                isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
              }`}>
                MARKET CONDITIONS
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                  Vol Expansion
                </span>
                <span className={`font-semibold ${
                  isDark || isHybrid ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentRegime.volatilityIndex}%
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                  Liquidity Score
                </span>
                <span className={`font-semibold ${
                  currentRegime.liquidityScore < 40 ? 'text-red-500' : 
                  currentRegime.liquidityScore < 70 ? 'text-amber-500' : 'text-green-500'
                }`}>
                  {currentRegime.liquidityScore}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                  Regime Confidence
                </span>
                <span className={`font-semibold ${
                  isDark || isHybrid ? 'text-white' : 'text-gray-900'
                }`}>
                  {currentRegime.confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Defense Recommendations */}
        <div>
          <h4 className={`text-sm font-semibold tracking-wide mb-4 ${
            isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
          }`}>
            DEFENSE RECOMMENDATIONS
          </h4>
          
          <div className="space-y-3">
            {actions.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-md border ${
                  item.priority === 'critical'
                    ? isDark || isHybrid
                      ? 'border-red-800 bg-red-950/30'
                      : 'border-red-200 bg-red-50'
                    : isDark || isHybrid
                    ? 'border-amber-800/50 bg-amber-950/20'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                    item.priority === 'critical'
                      ? 'bg-red-600'
                      : 'bg-amber-600'
                  }`}>
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-bold text-sm ${
                        isDark || isHybrid ? 'text-white' : 'text-gray-900'
                      }`}>
                        {item.action}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold tracking-wide ${
                        item.priority === 'critical'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className={`text-xs mb-2 ${
                      isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {item.rationale}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <TrendingDown className={`w-3 h-3 ${
                        isDark || isHybrid ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <span className={`text-xs font-medium ${
                        isDark || isHybrid ? 'text-green-400' : 'text-green-700'
                      }`}>
                        Impact: {item.impact}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button className={`flex-1 py-3 px-4 rounded-md font-semibold text-sm transition-colors ${
            isDark || isHybrid
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}>
            Deploy Protection Strategies
          </button>
          
          <button className={`px-6 py-3 rounded-md font-semibold text-sm transition-colors ${
            isDark || isHybrid
              ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
              : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
          }`}>
            Full Analysis
          </button>
        </div>
        
        {/* Disclaimer */}
        <div className={`mt-4 p-3 rounded-md text-xs leading-relaxed ${
          isDark || isHybrid 
            ? 'bg-gray-900/50 text-gray-500 border border-gray-800' 
            : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          ⚡ AI-generated recommendations based on real-time regime analysis. Review with risk management team before execution. Not financial advice.
        </div>
      </div>
    </div>
  );
}

// Guarded version with paywall
export function RiskDefenseAI() {
  const { subscription } = useSubscription();
  
  // If not paid, show the guarded (blurred) version with paywall
  if (!subscription.isPaid) {
    return (
      <IntelligenceGuard feature="deepRisk">
        <RiskDefenseAICore />
      </IntelligenceGuard>
    );
  }
  
  // Paid users get direct access
  return <RiskDefenseAICore />;
}
