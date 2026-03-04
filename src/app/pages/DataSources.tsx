import React from 'react';
import { Database, TrendingUp, Globe, Lock, Activity, AlertCircle } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

export function DataSources() {
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
          Data Sources
        </h1>
        <p className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
          Transparency & trust in our intelligence infrastructure
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Data Sources</div>
          <div className="text-2xl font-bold text-gray-900">47</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Daily Updates</div>
          <div className="text-2xl font-bold text-[#2563EB]">1.2M</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Model Accuracy</div>
          <div className="text-2xl font-bold text-green-600">89.4%</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Uptime</div>
          <div className="text-2xl font-bold text-gray-900">99.97%</div>
        </div>
      </div>

      {/* Macro Data Sources */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#2563EB]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Macro Data Sources</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Federal Reserve (FRED)', type: 'Central Bank', frequency: 'Daily', lag: '1 day' },
            { name: 'European Central Bank', type: 'Central Bank', frequency: 'Daily', lag: '1 day' },
            { name: 'Bank of Japan', type: 'Central Bank', frequency: 'Daily', lag: '2 days' },
            { name: 'US Treasury', type: 'Government', frequency: 'Daily', lag: 'Real-time' },
            { name: 'OECD Statistics', type: 'International Org', frequency: 'Monthly', lag: '1 week' },
            { name: 'Bloomberg Economics', type: 'Financial Data', frequency: 'Daily', lag: 'Real-time' },
          ].map((source, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="font-semibold text-gray-900 mb-2">{source.name}</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 block mb-1">Type</span>
                  <span className="text-gray-900">{source.type}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Frequency</span>
                  <span className="text-gray-900">{source.frequency}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Lag</span>
                  <span className="text-gray-900">{source.lag}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Data Sources */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#F0FDF4] rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Market Data Sources</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'NYSE / NASDAQ', coverage: 'US Equities', latency: '<100ms', resolution: 'Tick' },
            { name: 'CME Group', coverage: 'Futures & Options', latency: '<50ms', resolution: 'Tick' },
            { name: 'ICE Data Services', coverage: 'Fixed Income', latency: '<200ms', resolution: '1-min' },
            { name: 'Refinitiv', coverage: 'FX & Commodities', latency: '<100ms', resolution: 'Tick' },
          ].map((source, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="font-semibold text-gray-900 mb-2">{source.name}</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 block mb-1">Coverage</span>
                  <span className="text-gray-900">{source.coverage}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Latency</span>
                  <span className="text-gray-900">{source.latency}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Resolution</span>
                  <span className="text-gray-900">{source.resolution}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* On-Chain Data */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#FEF3C7] rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">On-Chain Data</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'Bitcoin Network', metrics: 'Hash rate, UTXO, Fees', update: '10 min' },
            { name: 'Ethereum Network', metrics: 'Gas, TVL, MEV', update: '12 sec' },
            { name: 'Stablecoin Supplies', metrics: 'USDT, USDC, DAI flows', update: 'Real-time' },
            { name: 'DeFi Protocols', metrics: 'Liquidity, Volume, TVL', update: '1 min' },
          ].map((source, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="font-semibold text-gray-900 mb-2">{source.name}</div>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Metrics</span>
                  <span className="text-gray-900">{source.metrics}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Update</span>
                  <span className="text-gray-900">{source.update}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Training Windows */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#F3E8FF] rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Model Training Windows</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">Regime Classification Model</span>
              <span className="text-sm text-[#2563EB] font-medium">Active</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Training Period</span>
                <span className="text-gray-900">1990-2024</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Retrain Cycle</span>
                <span className="text-gray-900">Quarterly</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Last Update</span>
                <span className="text-gray-900">Jan 2026</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Accuracy</span>
                <span className="text-green-600 font-semibold">94.1%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">Volatility Forecasting Model</span>
              <span className="text-sm text-[#2563EB] font-medium">Active</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Training Period</span>
                <span className="text-gray-900">2000-2024</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Retrain Cycle</span>
                <span className="text-gray-900">Monthly</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Last Update</span>
                <span className="text-gray-900">Feb 2026</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Accuracy</span>
                <span className="text-green-600 font-semibold">89.3%</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">Crash Detection Model</span>
              <span className="text-sm text-[#2563EB] font-medium">Active</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">Training Period</span>
                <span className="text-gray-900">1987-2024</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Retrain Cycle</span>
                <span className="text-gray-900">Quarterly</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Last Update</span>
                <span className="text-gray-900">Jan 2026</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Accuracy</span>
                <span className="text-green-600 font-semibold">91.7%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Limitations Disclosure */}
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-3">Limitations Disclosure</h3>
            <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
              <p>
                • Models are trained on historical data and may not predict unprecedented events
              </p>
              <p>
                • Regime classifications have inherent uncertainty during transition periods
              </p>
              <p>
                • On-chain data may have blockchain-specific latency and reorganization risks
              </p>
              <p>
                • Third-party data sources may experience outages or reporting delays
              </p>
              <p>
                • Past performance is not indicative of future results
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Compliance */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#2563EB]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Security & Compliance</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Data Security</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>End-to-end encryption (TLS 1.3)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>SOC 2 Type II certified infrastructure</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>ISO 27001 compliance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Regular third-party security audits</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Compliance</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>GDPR compliant data handling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>CCPA privacy standards</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Not registered as investment advisor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>For informational purposes only</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}