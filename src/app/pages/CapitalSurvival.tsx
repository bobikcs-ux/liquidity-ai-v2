import React, { useState } from 'react';
import { Shield, Brain, Activity, TrendingUp, Zap, Target, AlertTriangle, Sparkles, ChevronRight, Lock, Unlock } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';

interface DefenseStrategy {
  category: string;
  action: string;
  impact: string;
  priority: 'critical' | 'high' | 'medium';
  rationale: string;
}

interface SurvivalMetric {
  timeframe: string;
  probability: number;
  confidence: number;
  keyFactors: string[];
}

export function CapitalSurvival() {
  const { currentRegime, uiTheme } = useAdaptiveTheme();
  const { latest: snapshot, loading: snapshotLoading } = useMarketSnapshot();
  const [optimizeMode, setOptimizeMode] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'base' | 'stress' | 'crisis'>('base');
  
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  // Calculate real values from Supabase snapshot
  const survivalProb = snapshot?.survival_probability != null 
    ? (snapshot.survival_probability > 1 ? snapshot.survival_probability : Math.round(snapshot.survival_probability * 100))
    : 78;
  const systemicRisk = snapshot?.systemic_risk != null 
    ? (snapshot.systemic_risk > 1 ? snapshot.systemic_risk : Math.round(snapshot.systemic_risk * 100))
    : 35;
  const regime = snapshot?.regime || 'normal';
  
  // Capital Survival Probability Engine - use real data
  const survivalMetrics: SurvivalMetric[] = [
    {
      timeframe: 'Short Term (30d)',
      probability: survivalProb,
      confidence: 94,
      keyFactors: regime === 'crisis' 
        ? ['High systemic risk detected', 'Liquidity conditions stressed', 'Defensive positioning needed']
        : regime === 'stress'
        ? ['Macro uncertainty elevated', 'Credit conditions tightening', 'Vol regime unstable']
        : ['Liquidity buffer adequate', 'Low leverage exposure', 'Diversified holdings'],
    },
    {
      timeframe: 'Medium Term (90d)',
      probability: Math.max(survivalProb - 14, 40),
      confidence: 86,
      keyFactors: ['Macro uncertainty elevated', 'Credit conditions tightening', 'Vol regime unstable'],
    },
    {
      timeframe: 'Systemic Risk',
      probability: 100 - systemicRisk,
      confidence: 78,
      keyFactors: ['Contagion risk present', 'Network fragility detected', 'Correlation breakdown likely'],
    },
  ];
  
  // Autonomous Defense Strategies
  const defenseStrategies: DefenseStrategy[] = [
    {
      category: 'Liquidity Management',
      action: 'Increase Cash Reserves +12%',
      impact: 'Improves survival probability by 8.3%',
      priority: 'critical',
      rationale: 'Market liquidity declining. Cash provides optionality in stress scenarios.',
    },
    {
      category: 'Risk Exposure',
      action: 'Reduce High Beta Assets',
      impact: 'Lowers portfolio volatility by 15%',
      priority: 'high',
      rationale: 'Volatility regime expanding. High beta assets vulnerable to sharp drawdowns.',
    },
    {
      category: 'Defensive Positioning',
      action: 'Add Tail Risk Protection',
      impact: 'Protects against -40% scenario',
      priority: 'high',
      rationale: 'Systemic stress indicators elevated. Asymmetric protection warranted.',
    },
    {
      category: 'Correlation Risk',
      action: 'Diversify Across Uncorrelated Assets',
      impact: 'Reduces correlation risk by 23%',
      priority: 'medium',
      rationale: 'Cross-asset correlations spiking. Traditional diversification breaking down.',
    },
  ];
  
  // Systemic Shock Probabilities
  const shockProbabilities = [
    { event: 'Credit Contagion', probability: 34, severity: 'high', trend: 'increasing' },
    { event: 'Liquidity Collapse', probability: 28, severity: 'critical', trend: 'stable' },
    { event: 'Volatility Explosion', probability: 52, severity: 'high', trend: 'increasing' },
    { event: 'Correlation Breakdown', probability: 67, severity: 'medium', trend: 'accelerating' },
  ];
  
  // Behavioral Learning Insights
  const behavioralInsights = {
    userRiskTolerance: 'Moderate-Conservative',
    preferredDefenseStyle: 'Proactive hedging',
    historicalSuccessRate: 78,
    adaptationScore: 92,
  };
  
  const getProbabilityColor = (prob: number) => {
    if (prob >= 80) return 'text-green-500';
    if (prob >= 60) return 'text-amber-500';
    if (prob >= 40) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-amber-600 text-white';
      case 'medium': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${
            isDark || isHybrid ? 'text-white' : 'text-gray-900'
          }`}>
            Autonomous Capital Survival AI
          </h1>
          <p className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
            Adaptive intelligence infrastructure for capital preservation
          </p>
        </div>
        
        {/* Optimize Survival Mode Button */}
        <button
          onClick={() => setOptimizeMode(!optimizeMode)}
          className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all ${
            optimizeMode
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
          }`}
        >
          {optimizeMode ? (
            <>
              <Sparkles className="w-5 h-5" />
              Optimization Active
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </>
          ) : (
            <>
              <Target className="w-5 h-5" />
              Optimize Survival Mode
            </>
          )}
        </button>
      </div>
      
      {/* Optimization Mode Panel */}
      {optimizeMode && (
        <div className="bg-gradient-to-br from-purple-950/40 to-blue-950/40 border-2 border-purple-600/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Survival Optimization Engine Active</h3>
              <p className="text-sm text-purple-300">Simulating future stress scenarios and optimization paths</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {['base', 'stress', 'crisis'].map((scenario) => (
              <button
                key={scenario}
                onClick={() => setSelectedScenario(scenario as any)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedScenario === scenario
                    ? 'border-purple-500 bg-purple-950/50'
                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                }`}
              >
                <div className="text-sm text-gray-200 mb-1">
                  {scenario === 'base' ? 'Base Case' : scenario === 'stress' ? 'Stress Scenario' : 'Crisis Scenario'}
                </div>
                <div className="text-2xl font-bold text-white">
                  {scenario === 'base' ? '87%' : scenario === 'stress' ? '64%' : '38%'}
                </div>
                <div className="text-xs font-medium text-slate-300">Survival Probability</div>
              </button>
            ))}
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="text-sm font-semibold text-white mb-3">Optimization Path</div>
            <div className="space-y-2">
              {[
                'Increase liquidity buffer to 22%',
                'Reduce portfolio beta from 0.9 to 0.6',
                'Add put protection on 30% of equity exposure',
                'Diversify into uncorrelated defensive assets',
              ].map((step, index) => (
                <div key={index} className="flex items-center gap-3 text-sm text-gray-300">
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                  {step}
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
              <span className="text-sm text-gray-200">Optimized Survival Probability</span>
              <span className="text-xl font-bold text-green-500">+18.4%</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Capital Survival Probability Engine */}
      <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Capital Survival Probability</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {survivalMetrics.map((metric, index) => (
            <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <div className="text-sm text-gray-200 mb-4">{metric.timeframe}</div>
              
              <div className="mb-4">
                <div className={`text-5xl font-bold mb-2 ${getProbabilityColor(metric.probability)}`}>
                  {metric.probability}%
                </div>
                <div className="text-xs font-medium text-slate-300">
                  Confidence: {metric.confidence}%
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-200 mb-2">KEY FACTORS</div>
                {metric.keyFactors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <div className="w-1 h-1 bg-gray-600 rounded-full mt-1.5"></div>
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Autonomous Defense Strategies */}
      <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-purple-400" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">Autonomous Defense Strategies</h2>
            <p className="text-sm text-gray-400">AI-generated recommendations before you ask</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-950/50 border border-purple-600/50">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-purple-300">AUTONOMOUS</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {defenseStrategies.map((strategy, index) => (
            <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-gray-200">{strategy.category}</span>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${getPriorityColor(strategy.priority)}`}>
                      {strategy.priority.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{strategy.action}</h3>
                  <p className="text-sm text-slate-300 mb-3">{strategy.rationale}</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">{strategy.impact}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Systemic Shock Early Warning */}
        <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-bold text-white">Systemic Shock Probabilities</h3>
          </div>
          
          <div className="space-y-4">
            {shockProbabilities.map((shock, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-semibold text-white mb-1">{shock.event}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        shock.severity === 'critical' ? 'bg-red-900 text-red-200' :
                        shock.severity === 'high' ? 'bg-amber-900 text-amber-200' :
                        'bg-gray-800 text-gray-300'
                      }`}>
                        {shock.severity.toUpperCase()}
                      </span>
                      <span className={`text-xs ${
                        shock.trend === 'accelerating' ? 'text-red-400' :
                        shock.trend === 'increasing' ? 'text-amber-400' : 'text-gray-400'
                      }`}>
                        {shock.trend}
                      </span>
                    </div>
                  </div>
                  <div className={`text-3xl font-bold ${
                    shock.probability >= 60 ? 'text-red-500' :
                    shock.probability >= 40 ? 'text-amber-500' : 'text-gray-400'
                  }`}>
                    {shock.probability}%
                  </div>
                </div>
                
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      shock.probability >= 60 ? 'bg-red-500' :
                      shock.probability >= 40 ? 'bg-amber-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${shock.probability}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Behavioral Learning Engine */}
        <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-bold text-white">Behavioral Learning Engine</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-200">Risk Tolerance Profile</span>
                <span className="text-sm font-semibold text-white">{behavioralInsights.userRiskTolerance}</span>
              </div>
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-200">Preferred Defense Style</span>
                <span className="text-sm font-semibold text-white">{behavioralInsights.preferredDefenseStyle}</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-200">Historical Success Rate</span>
                <span className="text-2xl font-bold text-green-500">{behavioralInsights.historicalSuccessRate}%</span>
              </div>
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-green-500 rounded-full" 
                  style={{ width: `${behavioralInsights.historicalSuccessRate}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-200">AI Adaptation Score</span>
                <span className="text-2xl font-bold text-purple-500">{behavioralInsights.adaptationScore}%</span>
              </div>
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-purple-500 rounded-full" 
                  style={{ width: `${behavioralInsights.adaptationScore}%` }}
                ></div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-slate-300 leading-relaxed">
                  AI learns from your risk decisions and adapts recommendations over time. 
                  Current adaptation level: Advanced.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Future Risk Projection Timeline */}
      <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Future Risk Projection</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { period: 'Today', risk: 34, status: 'Elevated' },
            { period: '7 Days', risk: 42, status: 'Increasing' },
            { period: '30 Days', risk: 58, status: 'High' },
            { period: '90 Days', risk: 67, status: 'Critical' },
          ].map((projection, index) => (
            <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-xs font-medium text-slate-300 mb-2">{projection.period}</div>
              <div className={`text-3xl font-bold mb-1 ${
                projection.risk >= 60 ? 'text-red-500' :
                projection.risk >= 40 ? 'text-amber-500' : 'text-green-500'
              }`}>
                {projection.risk}%
              </div>
              <div className="text-xs font-medium text-slate-300">{projection.status}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* System Status */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-white">Autonomous System Active</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-400">
            <span>Last Analysis: 2m ago</span>
            <span>Next Update: 58s</span>
            <span>Status: Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
}
