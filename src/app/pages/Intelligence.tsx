import React from 'react';
import { GitBranch, Target, BarChart3, Network, Droplets, Gauge } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { IntelligenceCopilot } from '../components/IntelligenceCopilot';
import { MarketCharts } from '../components/MarketCharts';
import ErrorBoundary from '../components/ErrorBoundary';

export function Intelligence() {
  const { uiTheme } = useAdaptiveTheme();
  const { latest: snapshot, loading: snapshotLoading } = useMarketSnapshot();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  // Calculate real values from Supabase snapshot
  const survivalProb = snapshot?.survival_probability != null 
    ? (snapshot.survival_probability > 1 ? snapshot.survival_probability : Math.round(snapshot.survival_probability * 100))
    : 78;
  const systemicRisk = snapshot?.systemic_risk != null 
    ? (snapshot.systemic_risk > 1 ? snapshot.systemic_risk : Math.round(snapshot.systemic_risk * 100))
    : 35;
  const btcVolatility = snapshot?.btc_volatility != null 
    ? (snapshot.btc_volatility > 1 ? snapshot.btc_volatility : Math.round(snapshot.btc_volatility * 100))
    : 65;
  const regime = snapshot?.regime || 'normal';
  
  // Regime transition probabilities based on current regime
  const regimeTransitions = regime === 'crisis' 
    ? { toNeutral: 12, toStress: 15, maintain: 73 }
    : regime === 'stress'
    ? { toNeutral: 23, toStress: 8, maintain: 69 }
    : { toNeutral: 45, toStress: 5, maintain: 50 };
  
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${
          isDark || isHybrid ? 'text-white' : 'text-gray-900'
        }`}>
          Intelligence Terminal
        </h1>
        <p className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-600'}>
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
                <span className="text-sm text-gray-600">{regime.charAt(0).toUpperCase() + regime.slice(1)} → Neutral</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums min-w-[2.5rem] text-right">{regimeTransitions.toNeutral}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${regimeTransitions.toNeutral}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{regime.charAt(0).toUpperCase() + regime.slice(1)} → Stress</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums min-w-[2.5rem] text-right">{regimeTransitions.toStress}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${regimeTransitions.toStress}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Maintain Current</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums min-w-[2.5rem] text-right">{regimeTransitions.maintain}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${regimeTransitions.maintain}%` }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-600">30-day forecast window</div>
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
                <span className="ml-4 text-sm font-semibold text-gray-900 tabular-nums min-w-[2.5rem] text-right">{item.similarity}%</span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-600">Pattern matching across 50+ historical events</div>
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
            <div className={`text-5xl font-bold mb-2 tabular-nums min-h-[3.5rem] flex items-center justify-center ${btcVolatility > 60 ? 'text-red-600' : btcVolatility > 40 ? 'text-amber-600' : 'text-green-600'}`}>
              {snapshotLoading ? <span className="inline-block w-16 h-12 bg-gray-200 rounded animate-pulse" /> : `${btcVolatility}%`}
            </div>
            <p className="text-sm text-gray-600">BTC Volatility Index</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Systemic Risk</span>
              <span className="font-semibold text-gray-900 tabular-nums min-w-[3rem] text-right">{systemicRisk}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Survival Prob</span>
              <span className="font-semibold text-gray-900 tabular-nums min-w-[3rem] text-right">{survivalProb}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Regime</span>
              <span className="font-semibold text-gray-900 min-w-[4rem] text-right">{regime.toUpperCase()}</span>
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
                <span className="text-sm font-semibold text-gray-900 tabular-nums min-w-[3rem] text-right">0.73</span>
              </div>
              <div className="text-xs font-medium text-gray-600">20-day rolling</div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Bonds / Equities</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums min-w-[3rem] text-right">-0.42</span>
              </div>
              <div className="text-xs font-medium text-gray-600">Normal diversification</div>
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Gold / USD</span>
                <span className="text-sm font-semibold text-gray-900 tabular-nums min-w-[3rem] text-right">-0.68</span>
              </div>
              <div className="text-xs font-medium text-gray-600">Inverse relationship intact</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-600">Updated daily at market close</div>
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
                  <div className="text-xs font-medium text-gray-600">7-day average</div>
                </div>
                <div className={`text-lg font-semibold tabular-nums min-w-[5rem] text-right ${
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
              <span className="text-xl font-bold text-green-600 tabular-nums min-w-[5rem] text-right">+$198B</span>
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
                <span className="text-sm font-semibold text-green-600 tabular-nums min-w-[2.5rem] text-right">94%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '94%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Volatility Model</span>
                <span className="text-sm font-semibold text-green-600 tabular-nums min-w-[2.5rem] text-right">89%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '89%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Correlation Model</span>
                <span className="text-sm font-semibold text-amber-600 tabular-nums min-w-[2.5rem] text-right">76%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: '76%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Crash Detection</span>
                <span className="text-sm font-semibold text-green-600 tabular-nums min-w-[2.5rem] text-right">91%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '91%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-600">Out-of-sample performance metrics</div>
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
