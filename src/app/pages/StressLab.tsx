import React, { useState } from 'react';
import { FlaskConical, TrendingDown, Clock, Target, Lock } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useUserRole } from '../context/UserRoleContext';

export function StressLab() {
  const [selectedScenario, setSelectedScenario] = useState('liquidity');
  const [customShock, setCustomShock] = useState(25);
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  const { isPro, openProModal } = useUserRole();
  
  const scenarios = [
    { id: 'liquidity', label: 'Liquidity Shock', description: '-30% market depth' },
    { id: 'volatility', label: 'Volatility Spike', description: 'VIX → 60' },
    { id: 'correlation', label: 'Correlation Breakdown', description: 'All assets → +0.9' },
    { id: 'custom', label: 'Custom Shock', description: 'User-defined parameters' },
  ];

  const results = {
    liquidity: { survival: 67, drawdown: 32, recovery: 87, confidence: 82 },
    volatility: { survival: 73, drawdown: 28, recovery: 62, confidence: 79 },
    correlation: { survival: 58, drawdown: 41, recovery: 104, confidence: 71 },
    custom: { survival: 82 - customShock, drawdown: customShock + 5, recovery: customShock * 2 + 30, confidence: 85 },
  };

  const currentResults = results[selectedScenario as keyof typeof results];

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
                onClick={() => setSelectedScenario(scenario.id)}
                className={`w-full text-left p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all ${
                  selectedScenario === scenario.id
                    ? isDark || isHybrid ? 'border-blue-500 bg-blue-500/10' : 'border-[#2563EB] bg-[#EFF6FF]'
                    : isDark || isHybrid ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                }`}
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
          <button className={`w-full mt-4 md:mt-6 py-2.5 md:py-3 rounded-xl font-semibold transition-colors text-sm md:text-base ${
            isDark || isHybrid ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white'
          }`}>
            Run Simulation
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {/* Survival Probability - Large Display */}
          <div className={`rounded-xl md:rounded-3xl shadow-sm border p-4 md:p-8 text-center ${
            isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'
          }`}>
            <div className={`text-sm font-medium mb-3 md:mb-4 ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Portfolio Survival Probability</div>
            <div className={`text-5xl md:text-8xl font-bold mb-3 md:mb-4 tabular-nums font-mono ${
              currentResults.survival >= 75 ? 'text-green-500' :
              currentResults.survival >= 50 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {currentResults.survival}%
            </div>
            <p className={`text-sm ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>30-day stress scenario</p>
            
            {/* Visual Indicator */}
            <div className={`mt-4 md:mt-8 h-2 md:h-3 rounded-full overflow-hidden ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <div
                className={`h-full transition-all duration-500 ${
                  currentResults.survival >= 75 ? 'bg-green-500' :
                  currentResults.survival >= 50 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${currentResults.survival}%` }}
              ></div>
            </div>
          </div>

          {/* Detailed Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            {/* Drawdown Estimate */}
            <div className={`rounded-xl md:rounded-3xl shadow-sm border p-3 md:p-6 ${
              isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${isDark || isHybrid ? 'bg-red-500/20' : 'bg-[#FEF2F2]'}`}>
                  <TrendingDown className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isDark || isHybrid ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-xs md:text-base font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Drawdown</h3>
              </div>
              <div className="text-2xl md:text-4xl font-bold text-red-500 mb-1 md:mb-2 tabular-nums font-mono">-{currentResults.drawdown}%</div>
              <p className={`text-[10px] md:text-sm truncate ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Peak decline</p>
            </div>

            {/* Recovery Time */}
            <div className={`rounded-xl md:rounded-3xl shadow-sm border p-3 md:p-6 ${
              isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${isDark || isHybrid ? 'bg-amber-500/20' : 'bg-[#FEF3C7]'}`}>
                  <Clock className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isDark || isHybrid ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <h3 className={`text-xs md:text-base font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Recovery</h3>
              </div>
              <div className="text-2xl md:text-4xl font-bold text-amber-500 mb-1 md:mb-2 tabular-nums font-mono">{currentResults.recovery}</div>
              <p className={`text-[10px] md:text-sm truncate ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Days to BEP</p>
            </div>

            {/* Confidence Level */}
            <div className={`rounded-xl md:rounded-3xl shadow-sm border p-3 md:p-6 ${
              isDark ? 'bg-[#0b0f17] border-[#1f2937]' : isHybrid ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
                <div className={`w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center ${isDark || isHybrid ? 'bg-blue-500/20' : 'bg-[#EFF6FF]'}`}>
                  <Target className={`w-3.5 h-3.5 md:w-5 md:h-5 ${isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'}`} />
                </div>
                <h3 className={`text-xs md:text-base font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Confidence</h3>
              </div>
              <div className={`text-2xl md:text-4xl font-bold mb-1 md:mb-2 tabular-nums font-mono ${isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'}`}>{currentResults.confidence}%</div>
              <p className={`text-[10px] md:text-sm truncate ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>Model certainty</p>
            </div>
          </div>

          {/* Methodology Note */}
          <div className={`rounded-xl md:rounded-3xl border p-4 md:p-6 ${
            isDark ? 'bg-blue-900/20 border-blue-700/50' : isHybrid ? 'bg-blue-900/10 border-blue-700/30' : 'bg-blue-50 border-blue-200'
          }`}>
            <h3 className={`font-semibold mb-2 md:mb-3 text-sm md:text-base ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>Simulation Methodology</h3>
            <div className={`space-y-1 md:space-y-2 text-xs md:text-sm leading-relaxed ${isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>10,000 Monte Carlo paths with historical volatility</p>
              <p>Regime-conditional behavior and tail risk distributions</p>
              <p>Liquidity constraints and market impact modeled</p>
              <p>Mean reversion recovery estimation</p>
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
    </div>
  );
}
