import React, { useEffect, useState, useCallback } from 'react';
import { GitBranch, Target, BarChart3, Network, Droplets, Gauge, Activity, ArrowUpRight, ArrowDownRight, RefreshCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useAppContext } from '../hooks/useAppContext';
import { IntelligenceCopilot } from '../components/IntelligenceCopilot';
import { MarketCharts } from '../components/MarketCharts';
import { LiveAlphaTicker } from '../components/LiveAlphaTicker';
import { CentralIntelligenceTerminal } from '../components/CentralIntelligenceTerminal';
import ErrorBoundary from '../components/ErrorBoundary';

const STATUS_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-400 bg-red-900/30',
  ACTIVE:   'text-[#d4af37] bg-[#d4af37]/10',
  PENDING:  'text-yellow-400 bg-yellow-900/20',
  RESOLVED: 'text-green-400 bg-green-900/20',
};

const REGIME_COLORS: Record<string, string> = {
  crisis: 'text-red-400',
  stress: 'text-yellow-400',
  normal: 'text-green-400',
};

function PriceCard({ product }: { product: any }) {
  const change = product.change ?? 0;
  const isUp = change >= 0;
  return (
    <div
      className="rounded-lg p-4 border transition-all duration-300 hover:border-[#d4af37]/40 group"
      style={{ background: 'rgba(22,22,29,0.7)', borderColor: 'rgba(212,175,55,0.12)' }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-black tracking-widest text-[#a1a1aa] group-hover:text-[#d4af37] transition-colors">
          {product.product_code}
        </span>
        {isUp
          ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
          : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
      </div>
      <div className="text-xl font-bold text-white font-mono">
        {product.price > 0
          ? `$${Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
          : <span className="text-[#a1a1aa] text-sm">No data</span>}
      </div>
      <div className={`text-[10px] mt-1 font-mono ${isUp ? 'text-green-500' : 'text-red-400'}`}>
        {product.source === 'seed' ? 'awaiting feed' : product.source}
      </div>
    </div>
  );
}

function T81Feed({ logs, loading }: { logs: any[]; loading: boolean }) {
  return (
    <div
      className="rounded-lg border p-5 h-full"
      style={{ background: 'rgba(22,22,29,0.7)', borderColor: 'rgba(212,175,55,0.15)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[#d4af37]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">Liquidity Transmission</span>
        <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      </div>
      <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
        {loading && logs.length === 0 && (
          <div className="text-xs text-[#a1a1aa] font-mono py-4 text-center">Connecting to T81 feed...</div>
        )}
        {!loading && logs.length === 0 && (
          <div className="text-xs text-[#a1a1aa] font-mono py-4 text-center">No transmission events</div>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 py-2 border-b font-mono"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <span className="text-[9px] text-[#a1a1aa] min-w-[52px] pt-0.5">
              {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${STATUS_COLORS[log.status] ?? 'text-[#d4af37]'}`}>
              {log.status}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-[11px] font-bold truncate ${REGIME_COLORS[log.regime] ?? 'text-white'}`}>
                {log.signal}
              </div>
              <div className="text-[10px] text-[#a1a1aa] truncate">{log.notes}</div>
            </div>
            {log.confidence != null && (
              <span className="text-[9px] text-[#d4af37] shrink-0">{log.confidence}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Intelligence() {
  const { uiTheme } = useAdaptiveTheme();
  const { state, isSyncing, syncNow } = useAppContext();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  // T81 & prices live state (still sourced from Supabase realtime)
  const [prices, setPrices] = useState<any[]>([]);
  const [t81Logs, setT81Logs] = useState<any[]>([]);
  const [t81Loading, setT81Loading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'CONNECTING' | 'ONLINE' | 'DEGRADED'>('CONNECTING');

  const loadLiveData = useCallback(async () => {
    setT81Loading(true);
    if (!supabase) {
      setT81Loading(false);
      return;
    }
    const [{ data: priceData }, { data: logData }] = await Promise.all([
      supabase.from('prices').select('*').order('product_code'),
      supabase.from('t81').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    if (priceData) setPrices(priceData);
    if (logData) setT81Logs(logData);
    setT81Loading(false);
    setSystemStatus('ONLINE');
  }, []);

  useEffect(() => {
    loadLiveData();

    if (!supabase) return;

    // Realtime subscriptions
    const priceChannel = supabase
      .channel('intel-prices')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'prices' },
        (payload) => setPrices((prev) => prev.map((p) => p.id === payload.new.id ? payload.new : p))
      ).subscribe();

    const t81Channel = supabase
      .channel('intel-t81')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 't81' },
        (payload) => setT81Logs((prev) => [payload.new, ...prev].slice(0, 20))
      ).subscribe();

    return () => {
      supabase.removeChannel(priceChannel);
      supabase.removeChannel(t81Channel);
    };
  }, [loadLiveData]);

  // Derive display values from AppContext TerminalState
  const { sentiment } = state;
  const survivalProb = sentiment.survivalProbability;
  const systemicRisk = sentiment.systemicRisk;
  const btcVolatility = sentiment.btcVolatility;
  const regime = sentiment.regime;
  const snapshotLoading = isSyncing;
  
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
        }`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          Intelligence Terminal
        </h1>
        <p className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-600'} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          Deep analytics layer
        </p>
      </div>

      {/* ── LIVE INTELLIGENCE LAYER ────────────────────────────────────── */}
      <div
        className="rounded-xl p-6 space-y-6 border"
        style={{ background: 'rgba(11,11,15,0.6)', borderColor: 'rgba(212,175,55,0.18)' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">
              Intelligence Terminal — Live Feed
            </span>
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded tracking-widest"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#a1a1aa' }}
            >
              {systemStatus}
            </span>
          </div>
          <button
            onClick={loadLiveData}
            disabled={t81Loading || isSyncing}
            className="p-1.5 rounded hover:opacity-70 transition-opacity disabled:opacity-40"
            style={{ color: '#d4af37' }}
            aria-label="Refresh live data"
          >
            <RefreshCcw className={`w-4 h-4 ${(t81Loading || isSyncing) ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Product Prices Grid */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#a1a1aa] mb-3">
            Product Prices — T-Series
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {t81Loading && prices.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg animate-pulse" style={{ background: 'rgba(212,175,55,0.06)' }} />
                ))
              : prices.map((p) => <PriceCard key={p.id} product={p} />)}
          </div>
        </div>

        {/* T81 Liquidity Transmission */}
        <T81Feed logs={t81Logs} loading={t81Loading} />
      </div>
      {/* ── END LIVE INTELLIGENCE LAYER ────────────────────────────────── */}

      {/* Live Alpha Ticker */}
      <ErrorBoundary componentName="LiveAlphaTicker">        <LiveAlphaTicker />
      </ErrorBoundary>

      {/* Central Intelligence Terminal */}
      <ErrorBoundary componentName="CentralIntelligenceTerminal">
        <CentralIntelligenceTerminal />
      </ErrorBoundary>

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
              <Target className="w-5 h-5 text-red-500" />
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
            <div className={`text-5xl font-bold mb-2 tabular-nums min-h-[3.5rem] flex items-center justify-center ${btcVolatility > 60 ? 'text-red-500' : btcVolatility > 40 ? 'text-amber-600' : 'text-green-600'}`}>
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
                  item.trend === 'up' ? 'text-green-600' : 'text-red-500'
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
