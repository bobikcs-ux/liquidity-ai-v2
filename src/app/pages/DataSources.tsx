import React, { useState } from 'react';
import { Database, TrendingUp, Lock, Activity, AlertCircle, Info, Plus, X, Loader2, CheckCircle } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { sendStructuredEmail, EMAIL_REGEX } from '../components/ProModal';

// Tooltip component
function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap max-w-xs">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// Live indicator component
function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      LIVE
    </span>
  );
}

// Request Data Source Modal
function RequestDataSourceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!dataSource.trim()) {
      setError('Please describe the data source you need');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await sendStructuredEmail({
        type: 'data_source_request',
        email,
        name: name || undefined,
        message: `Data Source Request: ${dataSource}\n\nAdditional Details: ${message}`,
        context: {
          requestedAt: new Date().toISOString(),
          source: 'Data Sources Page',
        },
      });
      
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setEmail('');
        setName('');
        setDataSource('');
        setMessage('');
      }, 2000);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-md mx-4 rounded-3xl p-8 shadow-2xl ${
        isDark || isHybrid 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30' 
          : 'bg-white border border-gray-200'
      }`}>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isDark || isHybrid 
              ? 'hover:bg-gray-700 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Database className="w-8 h-8 text-white" />
          </div>
        </div>

        {submitted ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className={`text-2xl font-bold text-center mb-2 ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Request Received!
            </h2>
            <p className={`text-center ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Our team will review your data source request and get back to you soon.
            </p>
          </>
        ) : (
          <>
            <h2 className={`text-2xl font-bold text-center mb-2 ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Request a Data Source
            </h2>

            <p className={`text-center mb-6 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Need specific data for your analysis? Let us know.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark || isHybrid 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } outline-none`}
              />
              
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Your email *"
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  error && !EMAIL_REGEX.test(email)
                    ? 'border-red-500' 
                    : isDark || isHybrid 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } outline-none`}
              />
              
              <input
                type="text"
                value={dataSource}
                onChange={(e) => {
                  setDataSource(e.target.value);
                  setError('');
                }}
                placeholder="Data source name / type *"
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  error && !dataSource.trim()
                    ? 'border-red-500' 
                    : isDark || isHybrid 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } outline-none`}
              />
              
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Additional details (optional)"
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border transition-colors resize-none ${
                  isDark || isHybrid 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } outline-none`}
              />
              
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </form>

            <p className={`text-xs text-center mt-4 ${
              isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'
            }`}>
              We typically respond within 24-48 hours.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function DataSources() {
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  return (
    <>
    <RequestDataSourceModal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} />
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${
            isDark || isHybrid ? 'text-white' : 'text-gray-900'
          }`}>
            Data Sources
          </h1>
          <p className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
            Transparency & trust in our intelligence infrastructure
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Request Data Source
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Data Sources</div>
          <div className="text-2xl font-bold text-gray-900 tabular-nums">47</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Daily Updates</div>
          <div className="text-2xl font-bold text-[#2563EB] tabular-nums">1.2M</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Data Confidence</div>
          <div className="text-2xl font-bold text-green-600 tabular-nums min-w-[4ch]">99.4%</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Uptime</div>
          <div className="text-2xl font-bold text-gray-900 tabular-nums min-w-[5ch]">99.97%</div>
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
            { name: 'Federal Reserve (FRED)', type: 'Central Bank', frequency: 'Daily', lag: '1 day', api: 'FRED API v3 - Federal Reserve Economic Data', isLive: true },
            { name: 'European Central Bank', type: 'Central Bank', frequency: 'Daily', lag: '1 day', api: 'ECB Statistical Data Warehouse API', isLive: false },
            { name: 'Bank of Japan', type: 'Central Bank', frequency: 'Daily', lag: '2 days', api: 'BOJ Time-Series Data API', isLive: false },
            { name: 'US Treasury', type: 'Government', frequency: 'Daily', lag: 'Real-time', api: 'TreasuryDirect API v2', isLive: false },
            { name: 'OECD Statistics', type: 'International Org', frequency: 'Monthly', lag: '1 week', api: 'OECD.Stat JSON API', isLive: false },
            { name: 'Bloomberg Economics', type: 'Financial Data', frequency: 'Daily', lag: 'Real-time', api: 'Bloomberg B-PIPE Terminal Feed', isLive: false },
          ].map((source, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{source.name}</span>
                  <Tooltip content={source.api}>
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                {source.isLive && <LiveIndicator />}
              </div>
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
            { name: 'NYSE / NASDAQ', coverage: 'US Equities', latency: '<100ms', resolution: 'Tick', api: 'NYSE Market Data Feed (UTP SIP)', isLive: true },
            { name: 'CME Group', coverage: 'Futures & Options', latency: '<50ms', resolution: 'Tick', api: 'CME Smart Stream Real-time', isLive: false },
            { name: 'ICE Data Services', coverage: 'Fixed Income', latency: '<200ms', resolution: '1-min', api: 'ICE Consolidated Feed API', isLive: false },
            { name: 'Refinitiv', coverage: 'FX & Commodities', latency: '<100ms', resolution: 'Tick', api: 'Refinitiv Elektron Real-Time', isLive: false },
          ].map((source, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{source.name}</span>
                  <Tooltip content={source.api}>
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                {source.isLive && <LiveIndicator />}
              </div>
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
            { name: 'Bitcoin Network', metrics: 'Hash rate, UTXO, Fees', update: '10 min', api: 'Blockchain.com & Mempool.space API', isLive: true },
            { name: 'Ethereum Network', metrics: 'Gas, TVL, MEV', update: '12 sec', api: 'Etherscan Pro API & Infura', isLive: false },
            { name: 'Stablecoin Supplies', metrics: 'USDT, USDC, DAI flows', update: 'Real-time', api: 'CoinGecko Pro Endpoint', isLive: true },
            { name: 'DeFi Protocols', metrics: 'Liquidity, Volume, TVL', update: '1 min', api: 'DefiLlama API v2', isLive: false },
          ].map((source, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{source.name}</span>
                  <Tooltip content={source.api}>
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                {source.isLive && <LiveIndicator />}
              </div>
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
                <span className="text-gray-900">March 2026</span>
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
                <span className="text-gray-900">2000-2026</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Retrain Cycle</span>
                <span className="text-gray-900">Monthly</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Last Update</span>
                <span className="text-gray-900">March 2026</span>
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
                <span className="text-gray-900">1987-2026</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Retrain Cycle</span>
                <span className="text-gray-900">Quarterly</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Last Update</span>
                <span className="text-gray-900">March 2026</span>
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
    </>
  );
}
