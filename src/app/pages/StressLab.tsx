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

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Scenario Selector */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Scenario Selector</h2>
          </div>

          <div className="space-y-3">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  selectedScenario === scenario.id
                    ? 'border-[#2563EB] bg-[#EFF6FF]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900 mb-1">{scenario.label}</div>
                <div className="text-sm text-gray-600">{scenario.description}</div>
              </button>
            ))}
          </div>

          {/* Custom Shock Slider */}
          {selectedScenario === 'custom' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-900 mb-3 block">
                Custom Shock Magnitude
              </label>
              <input
                type="range"
                min="10"
                max="50"
                value={customShock}
                onChange={(e) => setCustomShock(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-medium text-gray-600">10%</span>
                <span className="text-lg font-bold text-[#2563EB] tabular-nums min-w-[3ch]">{customShock}%</span>
                <span className="text-xs font-medium text-gray-600">50%</span>
              </div>
            </div>
          )}

          {/* Run Simulation Button */}
          <button className="w-full mt-6 bg-[#2563EB] text-white py-3 rounded-xl font-semibold hover:bg-[#1d4ed8] transition-colors">
            Run Simulation
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-6">
          {/* Survival Probability - Large Display */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-sm font-medium text-gray-600 mb-4">Portfolio Survival Probability</div>
            <div className={`text-8xl font-bold mb-4 tabular-nums min-w-[4ch] ${
              currentResults.survival >= 75 ? 'text-green-600' :
              currentResults.survival >= 50 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {currentResults.survival}%
            </div>
            <p className="text-gray-600">30-day stress scenario</p>
            
            {/* Visual Indicator */}
            <div className="mt-8 h-3 bg-gray-200 rounded-full overflow-hidden">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Drawdown Estimate */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#FEF2F2] rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Drawdown</h3>
              </div>
              <div className="text-4xl font-bold text-red-600 mb-2 tabular-nums min-w-[4ch]">-{currentResults.drawdown}%</div>
              <p className="text-sm text-gray-600">Peak portfolio decline</p>
            </div>

            {/* Recovery Time */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Recovery</h3>
              </div>
              <div className="text-4xl font-bold text-amber-600 mb-2 tabular-nums min-w-[3ch]">{currentResults.recovery}</div>
              <p className="text-sm text-gray-600">Days to break-even</p>
            </div>

            {/* Confidence Level */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#2563EB]" />
                </div>
                <h3 className="font-semibold text-gray-900">Confidence</h3>
              </div>
              <div className="text-4xl font-bold text-[#2563EB] mb-2 tabular-nums min-w-[3ch]">{currentResults.confidence}%</div>
              <p className="text-sm text-gray-600">Model certainty</p>
            </div>
          </div>

          {/* Methodology Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Simulation Methodology</h3>
            <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
              <p>
                • Based on 10,000 Monte Carlo paths using historical volatility and correlation structures
              </p>
              <p>
                • Incorporates regime-conditional behavior and tail risk distributions
              </p>
              <p>
                • Accounts for liquidity constraints and market impact during stress events
              </p>
              <p>
                • Recovery estimates assume mean reversion to long-term equilibrium
              </p>
            </div>
          </div>

          {/* Historical Comparisons */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Historical Stress Comparisons</h3>
            <div className="space-y-3">
              {[
                { event: 'COVID-19 Crash (Mar 2020)', survival: 71, drawdown: 34 },
                { event: 'Dec 2018 Selloff', survival: 89, drawdown: 19 },
                { event: 'Aug 2015 Flash Crash', survival: 82, drawdown: 24 },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-900">{item.event}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      <span className="text-gray-600">Survival:</span>{' '}
                      <span className="font-semibold text-green-600 tabular-nums">{item.survival}%</span>
                    </span>
                    <span className="text-sm">
                      <span className="text-gray-600">DD:</span>{' '}
                      <span className="font-semibold text-red-600 tabular-nums">-{item.drawdown}%</span>
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
