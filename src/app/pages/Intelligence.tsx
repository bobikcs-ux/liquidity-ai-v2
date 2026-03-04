import React from 'react';
import { GitBranch, Target, BarChart3, Network, Droplets, Gauge } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { IntelligenceCopilot } from '../components/IntelligenceCopilot';
import { MarketCharts } from '../components/MarketCharts';
import ErrorBoundary from '../components/ErrorBoundary';

export function Intelligence() {
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${
          isDark || isHybrid ? 'text-white' : 'text-gray-900'
        }`}>
          Intelligence Terminal
        </h1>
        <p className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
          Deep analytics layer
        </p>
      </div>

      {/* Market Charts with Error Boundary */}
      <ErrorBoundary componentName="MarketCharts">
        <MarketCharts className="mb-6" />
      </ErrorBoundary>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regime Transition Probabilities */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Regime Transitions</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Expansionary → Neutral</span>
                <span className="text-sm font-semibold text-gray-900">23%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '23%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Expansionary → Stress</span>
                <span className="text-sm font-semibold text-gray-900">8%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: '8%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Maintain Current</span>
                <span className="text-sm font-semibold text-gray-900">69%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '69%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-500">30-day forecast window</div>
          </div>
        </div>

        {/* Crash Similarity Engine */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#FEF2F2] rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Crash Similarity</h2>
          </div>

          <div className="space-y-4">
            {[
              { event: 'March 2020 (COVID)', similarity: 12, color: 'green' },
              { event: '2008 GFC', similarity: 8, color: 'green' },
              { event: 'Dot-com Bubble', similarity: 15, color: 'amber' },
              { event: 'Black Monday 1987', similarity: 5, color: 'green' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-gray-900 mb-1">{item.event}</div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.color === 'red' ? 'bg-red-500' :
                        item.color === 'amber' ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${item.similarity * 4}%` }}
                    ></div>
                  </div>
                </div>
                <span className="ml-4 text-sm font-semibold text-gray-900">{item.similarity}%</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-500">Pattern matching across 50+ historical events</div>
          </div>
        </div>

        {/* Volatility Expansion */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#FEF3C7] rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Volatility Expansion</h2>
          </div>

          <div className="text-center py-8">
            <div className="text-5xl font-bold text-amber-600 mb-2">38%</div>
            <p className="text-sm text-gray-600">Next 14 days</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current VIX</span>
              <span className="font-semibold text-gray-900">15.7</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Projected VIX</span>
              <span className="font-semibold text-gray-900">22.3</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Confidence</span>
              <span className="font-semibold text-gray-900">71%</span>
            </div>
          </div>
        </div>

        {/* Cross-Asset Correlation */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#F0FDF4] rounded-xl flex items-center justify-center">
              <Network className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Cross-Asset Correlation</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">SPX / BTC</span>
                <span className="text-sm font-semibold text-gray-900">0.73</span>
              </div>
              <div className="text-xs text-gray-500">20-day rolling</div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Bonds / Equities</span>
                <span className="text-sm font-semibold text-gray-900">-0.42</span>
              </div>
              <div className="text-xs text-gray-500">Normal diversification</div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Gold / USD</span>
                <span className="text-sm font-semibold text-gray-900">-0.68</span>
              </div>
              <div className="text-xs text-gray-500">Inverse relationship intact</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-500">Updated daily at market close</div>
          </div>
        </div>

        {/* Liquidity Flow Breakdown */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
              <Droplets className="w-5 h-5 text-[#2563EB]" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Liquidity Flow</h2>
          </div>

          <div className="space-y-4">
            {[
              { source: 'Central Bank QE', amount: '+$127B', trend: 'up' },
              { source: 'Corporate Buybacks', amount: '+$89B', trend: 'up' },
              { source: 'Retail Flows', amount: '+$34B', trend: 'up' },
              { source: 'Institutional Deleveraging', amount: '-$52B', trend: 'down' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-900 mb-0.5">{item.source}</div>
                  <div className="text-xs text-gray-500">7-day average</div>
                </div>
                <div className={`text-lg font-semibold ${
                  item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.amount}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">Net Flow</span>
              <span className="text-xl font-bold text-green-600">+$198B</span>
            </div>
          </div>
        </div>

        {/* Model Confidence Diagnostics */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#F3E8FF] rounded-xl flex items-center justify-center">
              <Gauge className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Model Diagnostics</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Regime Model</span>
                <span className="text-sm font-semibold text-green-600">94%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '94%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Volatility Model</span>
                <span className="text-sm font-semibold text-green-600">89%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '89%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Correlation Model</span>
                <span className="text-sm font-semibold text-amber-600">76%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '76%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Crash Detection</span>
                <span className="text-sm font-semibold text-green-600">91%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '91%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-500">Out-of-sample performance metrics</div>
          </div>
        </div>
      </div>
      {/* AI Intelligence Copilot */}
      <ErrorBoundary componentName="IntelligenceCopilot">
        <IntelligenceCopilot />
      </ErrorBoundary>
    </div>
  );
}
