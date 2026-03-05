import React, { useState, useCallback } from 'react';
import { FlaskConical, TrendingDown, Clock, Target, Lock, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useUserRole } from '../context/UserRoleContext';
import { useMarketSnapshot, MarketSnapshot } from '../hooks/useMarketSnapshot';

interface SimulationResult {
  survival: number;
  drawdown: number;
  recovery: number;
  confidence: number;
  regime: string;
  warningMessage?: string;
  var95?: number;
}

type ScenarioType = 'liquidity' | 'volatility' | 'correlation' | 'custom';

export function StressLab() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('liquidity');
  const [customShock, setCustomShock] = useState(25);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showStressEffect, setShowStressEffect] = useState(false);
  const [correlationWarning, setCorrelationWarning] = useState(false);
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  const { isPro, openProModal } = useUserRole();
  const { latest: snapshot, loading: snapshotLoading, refresh: refreshSnapshot } = useMarketSnapshot();
  
  const scenarios = [
    { id: 'liquidity' as const, label: 'Liquidity Shock', description: '-30% market depth' },
    { id: 'volatility' as const, label: 'Volatility Spike', description: 'VIX → 60' },
    { id: 'correlation' as const, label: 'Correlation Breakdown', description: 'All assets → +0.9' },
    { id: 'custom' as const, label: 'Custom Shock', description: 'User-defined parameters' },
  ];

  // Run real simulation using latest snapshot data
  const runSimulation = useCallback(async () => {
    if (!snapshot) return;
    
    setIsSimulating(true);
    setSimulationResult(null);
    setCorrelationWarning(false);
    setShowStressEffect(false);
    
    // Simulate processing delay (2 seconds as specified)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get base values from latest snapshot
    const baseSystemicRisk = snapshot.systemic_risk > 1 ? snapshot.systemic_risk : snapshot.systemic_risk * 100;
    const baseBtcVolatility = snapshot.btc_volatility > 1 ? snapshot.btc_volatility : snapshot.btc_volatility * 100;
    const baseSurvivalProb = snapshot.survival_probability > 1 ? snapshot.survival_probability : snapshot.survival_probability * 100;
    const baseVar95 = snapshot.var_95 > 1 ? snapshot.var_95 : snapshot.var_95 * 100;
    
    let result: SimulationResult;
    
    switch (selectedScenario) {
      case 'liquidity': {
        // Liquidity Shock: systemic_risk × 1.35, btc_volatility × 1.5, survival -35%
        const stressedSystemicRisk = Math.min(100, baseSystemicRisk * 1.35);
        const stressedVolatility = Math.min(100, baseBtcVolatility * 1.5);
        const stressedSurvival = Math.max(5, baseSurvivalProb - 35);
        const newRegime = stressedSystemicRisk > 70 ? 'crisis' : snapshot.regime;
        
        result = {
          survival: Math.round(stressedSurvival),
          drawdown: Math.round(35 + (100 - stressedSurvival) * 0.3),
          recovery: Math.round(60 + stressedSystemicRisk * 0.8),
          confidence: Math.round(85 - (stressedSystemicRisk - baseSystemicRisk) * 0.3),
          regime: newRegime,
          var95: Math.round(baseVar95 * 1.4),
        };
        
        // Trigger stress visual effect
        setShowStressEffect(true);
        setTimeout(() => setShowStressEffect(false), 500);
        break;
      }
      
      case 'volatility': {
        // Volatility Spike: btc_volatility × 2.2, var_95 = btc_volatility × 1.65
        const spikedVolatility = Math.min(100, baseBtcVolatility * 2.2);
        const newVar95 = spikedVolatility * 1.65;
        
        result = {
          survival: Math.round(baseSurvivalProb - spikedVolatility * 0.2),
          drawdown: Math.round(spikedVolatility * 0.45),
          recovery: Math.round(45 + spikedVolatility * 0.6),
          confidence: Math.round(75 - spikedVolatility * 0.1),
          regime: spikedVolatility > 80 ? 'stress' : snapshot.regime,
          var95: Math.round(newVar95),
        };
        
        setShowStressEffect(true);
        setTimeout(() => setShowStressEffect(false), 500);
        break;
      }
      
      case 'correlation': {
        // Correlation Breakdown: show warning, amber border on charts
        result = {
          survival: Math.round(baseSurvivalProb - 25),
          drawdown: Math.round(45 + baseSystemicRisk * 0.3),
          recovery: Math.round(90 + baseSystemicRisk * 0.5),
          confidence: Math.round(65),
          regime: 'stress',
          warningMessage: 'SYSTEMIC COUPLING DETECTED — DIVERSIFICATION FAILED',
        };
        
        setCorrelationWarning(true);
        setShowStressEffect(true);
        setTimeout(() => setShowStressEffect(false), 500);
        break;
      }
      
      case 'custom': {
        // Custom shock based on slider value
        const shockMultiplier = 1 + (customShock / 100);
        const stressedSurvival = Math.max(5, baseSurvivalProb * (1 - customShock / 100));
        
        result = {
          survival: Math.round(stressedSurvival),
          drawdown: Math.round(customShock + 5),
          recovery: Math.round(customShock * 2 + 30),
          confidence: Math.round(85 - customShock * 0.3),
          regime: customShock > 40 ? 'crisis' : customShock > 25 ? 'stress' : snapshot.regime,
        };
        
        if (customShock > 30) {
          setShowStressEffect(true);
          setTimeout(() => setShowStressEffect(false), 500);
        }
        break;
      }
    }
    
    setSimulationResult(result);
    setIsSimulating(false);
  }, [snapshot, selectedScenario, customShock]);

  // Reset to real market state
  const resetMarketState = useCallback(async () => {
    setSimulationResult(null);
    setCorrelationWarning(false);
    setShowStressEffect(false);
    await refreshSnapshot();
  }, [refreshSnapshot]);

  // Get display values (simulation result or real snapshot)
  const displayResults = simulationResult || (snapshot ? {
    survival: Math.round(snapshot.survival_probability > 1 ? snapshot.survival_probability : snapshot.survival_probability * 100),
    drawdown: 15,
    recovery: 45,
    confidence: 80,
    regime: snapshot.regime,
  } : {
    survival: 0,
    drawdown: 0,
    recovery: 0,
    confidence: 0,
    regime: 'normal',
  });

  // Full page locked overlay for FREE users
  if (!isPro) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            isDark || isHybrid ? 'text-white' : 'text-gray-900'
          }`}>
            Stress Lab
          </h1>
          <p className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-600'}>
            Scenario simulation and stress testing
          </p>
        </div>

        {/* Locked Overlay */}
        <div 
          className={`relative rounded-3xl p-12 text-center cursor-pointer ${
            isDark || isHybrid 
              ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-amber-500/30' 
              : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
          }`}
          onClick={() => openProModal('Stress Lab')}
          style={{
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Blurred Background Preview */}
          <div className="absolute inset-0 opacity-20 overflow-hidden rounded-3xl">
            <div className="grid grid-cols-3 gap-4 p-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`h-32 rounded-xl ${
                  isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-200'
                }`} />
              ))}
            </div>
          </div>

          {/* Lock Content */}
          <div className="relative z-10">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6">
              <Lock className="w-10 h-10 text-white" />
            </div>
            
            <h2 className={`text-2xl font-bold mb-3 ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Stress Lab is a PRO Feature
            </h2>
            
            <p className={`text-lg mb-6 max-w-md mx-auto ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Run Monte Carlo simulations, test custom shock scenarios, and analyze portfolio survival probabilities.
            </p>

            <button
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              Upgrade to PRO
            </button>

            <p className={`text-sm mt-4 ${
              isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'
            }`}>
              Starting at $49/month
            </p>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Liquidity Shock', desc: 'Test -30% market depth scenarios' },
            { title: 'Volatility Spike', desc: 'Simulate VIX expansion to 60+' },
            { title: 'Correlation Breakdown', desc: 'All assets correlation to +0.9' },
          ].map((feature, index) => (
            <div 
              key={index}
              className={`p-6 rounded-2xl opacity-50 ${
                isDark || isHybrid 
                  ? 'bg-gray-800/50 border border-gray-700' 
                  : 'bg-gray-100 border border-gray-200'
              }`}
            >
              <h3 className={`font-semibold mb-2 ${
                isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {feature.title}
              </h3>
              <p className={`text-sm ${
                isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 px-4 py-4 md:py-8">
      {/* Red flash overlay for stress effect */}
      {showStressEffect && (
        <div 
          className="fixed inset-0 z-50 pointer-events-none animate-pulse"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
        />
      )}
      
      {/* Page Header */}
      <div className="mb-4 md:mb-8">
        <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
          isDark || isHybrid ? 'text-white' : 'text-gray-900'
        }`}>
          Stress Lab
        </h1>
        <p className={`text-sm md:text-base ${isDark || isHybrid ? 'text-gray-200' : 'text-gray-600'}`}>
          Scenario simulation and stress testing
        </p>
      </div>

      {/* Correlation Warning Banner */}
      {correlationWarning && simulationResult?.warningMessage && (
        <div className={`p-4 rounded-xl border-2 border-amber-500 bg-amber-500/10 flex items-center gap-3 animate-pulse`}>
          <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <span className="text-amber-400 font-bold text-sm md:text-base">
            {simulationResult.warningMessage}
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        {/* Scenario Selector */}
        <div className={`lg:col-span-2 rounded-xl shadow-sm border p-4 md:p-6 ${
          isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
              isDark || isHybrid ? 'bg-blue-600/20' : 'bg-[#EFF6FF]'
            }`}>
              <FlaskConical className={`w-4 h-4 md:w-5 md:h-5 ${isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'}`} />
            </div>
            <h2 className={`text-base md:text-lg font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Scenario Selector</h2>
          </div>

          <div className="space-y-2 md:space-y-3">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => {
                  setSelectedScenario(scenario.id);
                  setSimulationResult(null);
                  setCorrelationWarning(false);
                }}
                disabled={isSimulating}
                className={`w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all ${
                  selectedScenario === scenario.id
                    ? isDark || isHybrid ? 'border-blue-500 bg-blue-500/10' : 'border-[#2563EB] bg-[#EFF6FF]'
                    : isDark || isHybrid ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                } ${isSimulating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`font-semibold text-sm md:text-base mb-1 ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>{scenario.label}</div>
                <div className={`text-xs md:text-sm ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>{scenario.description}</div>
              </button>
            ))}
          </div>

          {/* Custom Shock Slider */}
          {selectedScenario === 'custom' && (
            <div className={`mt-4 md:mt-6 pt-4 md:pt-6 border-t ${isDark || isHybrid ? 'border-gray-700' : 'border-gray-200'}`}>
              <label className={`text-sm font-medium mb-3 block ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                Custom Shock Magnitude
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={customShock}
                onChange={(e) => setCustomShock(Number(e.target.value))}
                disabled={isSimulating}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#2563EB] ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-200'}`}
              />
              <div className="flex justify-between items-center mt-2">
                <span className={`text-xs font-medium ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>10%</span>
                <span className={`text-base md:text-lg font-bold tabular-nums min-w-[3ch] ${isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'}`}>{customShock}%</span>
                <span className={`text-xs font-medium ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>50%</span>
              </div>
            </div>
          )}

          {/* Run Simulation Button */}
          <button 
            onClick={runSimulation}
            disabled={isSimulating || snapshotLoading || !snapshot}
            className={`w-full mt-4 md:mt-6 py-2.5 md:py-3 rounded-xl font-semibold transition-colors text-sm md:text-base flex items-center justify-center gap-2 ${
              isSimulating || snapshotLoading || !snapshot
                ? 'bg-gray-600 cursor-not-allowed'
                : isDark || isHybrid ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white'
            }`}
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing Simulation...
              </>
            ) : snapshotLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Market Data...
              </>
            ) : (
              'Run Simulation'
            )}
          </button>

          {/* Reset Button - Only shows after simulation */}
          {simulationResult && (
            <button 
              onClick={resetMarketState}
              disabled={isSimulating}
              className={`w-full mt-3 py-2.5 md:py-3 rounded-xl font-semibold transition-colors text-sm md:text-base flex items-center justify-center gap-2 ${
                isDark || isHybrid 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Reset Market State
            </button>
          )}
        </div>

        {/* Results Panel */}
        <div className={`lg:col-span-3 space-y-4 md:space-y-6 ${correlationWarning ? 'ring-2 ring-amber-500/50 rounded-xl' : ''}`}>
          {/* Survival Probability - Large Display */}
          <div className={`rounded-xl md:rounded-3xl shadow-sm border p-4 md:p-8 text-center relative overflow-hidden ${
            isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          } ${correlationWarning ? 'border-amber-500' : ''}`}>
            {/* Scanning animation for correlation breakdown */}
            {correlationWarning && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-scan" />
              </div>
            )}
            
            <div className={`text-sm font-medium mb-3 md:mb-4 ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
              Portfolio Survival Probability
              {simulationResult && <span className="ml-2 text-amber-500">(Simulated)</span>}
            </div>
            <div className={`text-5xl md:text-8xl font-bold mb-3 md:mb-4 tabular-nums font-mono ${
              displayResults.survival >= 75 ? 'text-green-500' :
              displayResults.survival >= 50 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {snapshotLoading ? (
                <Loader2 className="w-12 h-12 mx-auto animate-spin text-gray-500" />
              ) : (
                `${displayResults.survival}%`
              )}
            </div>
            <p className={`text-sm ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
              30-day stress scenario
              {simulationResult?.regime && simulationResult.regime !== snapshot?.regime && (
                <span className="ml-2 text-red-500 font-semibold">
                  REGIME: {simulationResult.regime.toUpperCase()}
                </span>
              )}
            </p>
            
            {/* Visual Indicator */}
            <div className={`mt-4 md:mt-8 h-2 md:h-3 rounded-full overflow-hidden ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className={`h-full transition-all duration-500 ${
                  displayResults.survival >= 75 ? 'bg-green-500' :
                  displayResults.survival >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${displayResults.survival}%` }}
              ></div>
            </div>
          </div>

          {/* Detailed Metrics Grid */}
          <div className={`grid grid-cols-3 gap-2 md:gap-4 ${correlationWarning ? 'ring-2 ring-amber-500/50 rounded-xl' : ''}`}>
            {/* Drawdown Estimate */}
            <div className={`rounded-xl md:rounded-3xl shadow-sm border p-3 md:p-6 ${
              isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } ${correlationWarning ? 'border-amber-500' : ''}`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${isDark || isHybrid ? 'bg-red-500/20' : 'bg-[#FEF2F2]'}`}>
                  <TrendingDown className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isDark || isHybrid ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-xs md:text-base font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Drawdown</h3>
              </div>
              <div className="text-2xl md:text-4xl font-bold text-red-500 mb-1 md:mb-2 tabular-nums font-mono">-{displayResults.drawdown}%</div>
              <p className={`text-[10px] md:text-sm truncate ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Peak decline</p>
            </div>

            {/* Recovery Time */}
            <div className={`rounded-xl md:rounded-3xl shadow-sm border p-3 md:p-6 ${
              isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } ${correlationWarning ? 'border-amber-500' : ''}`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${isDark || isHybrid ? 'bg-amber-500/20' : 'bg-[#FEF3C7]'}`}>
                  <Clock className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isDark || isHybrid ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <h3 className={`text-xs md:text-base font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Recovery</h3>
              </div>
              <div className="text-2xl md:text-4xl font-bold text-amber-500 mb-1 md:mb-2 tabular-nums font-mono">{displayResults.recovery}</div>
              <p className={`text-[10px] md:text-sm truncate ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Days to BEP</p>
            </div>

            {/* Confidence Level */}
            <div className={`rounded-xl md:rounded-3xl shadow-sm border p-3 md:p-6 ${
              isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } ${correlationWarning ? 'border-amber-500' : ''}`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${isDark || isHybrid ? 'bg-blue-500/20' : 'bg-[#EFF6FF]'}`}>
                  <Target className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'}`} />
                </div>
                <h3 className={`text-xs md:text-base font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Confidence</h3>
              </div>
              <div className={`text-2xl md:text-4xl font-bold mb-1 md:mb-2 tabular-nums font-mono ${isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'}`}>{displayResults.confidence}%</div>
              <p className={`text-[10px] md:text-sm truncate ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Model certainty</p>
            </div>
          </div>

          {/* Methodology Note */}
          <div className={`rounded-xl md:rounded-3xl border p-4 md:p-6 ${
            isDark ? 'bg-blue-900/20 border-blue-700/50' : isHybrid ? 'bg-blue-900/10 border-blue-700/30' : 'bg-blue-50 border-blue-200'
          }`}>
            <h3 className={`font-semibold mb-2 md:mb-3 text-sm md:text-base ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Simulation Methodology</h3>
            <div className={`space-y-1 md:space-y-2 text-xs md:text-sm leading-relaxed ${isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>Real-time data from Supabase market_snapshots</p>
              <p>Scenario modifiers applied to latest snapshot values</p>
              <p>Regime transitions triggered by stress thresholds</p>
              <p>VaR recalculation based on volatility multipliers</p>
            </div>
          </div>

          {/* Historical Comparisons */}
          <div className={`rounded-xl md:rounded-3xl shadow-sm border p-4 md:p-6 ${
            isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`font-semibold mb-3 md:mb-4 text-sm md:text-base ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Historical Comparisons</h3>
            <div className="space-y-2">
              {[
                { event: 'COVID-19 (Mar 2020)', survival: 71, drawdown: 34 },
                { event: 'Dec 2018 Selloff', survival: 89, drawdown: 19 },
                { event: 'Aug 2015 Crash', survival: 82, drawdown: 24 },
              ].map((item, index) => (
                <div key={index} className={`flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg overflow-hidden ${
                  isDark ? 'bg-gray-900/50' : isHybrid ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}>
                  <span className={`text-[11px] md:text-sm truncate min-w-0 flex-1 ${isDark || isHybrid ? 'text-gray-300' : 'text-gray-900'}`}>{item.event}</span>
                  <div className="flex items-center gap-2 md:gap-4 shrink-0 whitespace-nowrap font-mono">
                    <span className="text-[10px] md:text-sm">
                      <span className="font-semibold text-green-500 tabular-nums">{item.survival}%</span>
                    </span>
                    <span className="text-[10px] md:text-sm">
                      <span className="font-semibold text-red-500 tabular-nums">-{item.drawdown}%</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for scanning animation */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
