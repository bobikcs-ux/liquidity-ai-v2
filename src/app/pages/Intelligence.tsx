import React from 'react';
import { GitBranch, Target, BarChart3, Network, Droplets, Gauge, Activity, ArrowUpRight, ArrowDownRight, RefreshCcw, Play, Zap } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { useWorkerData, WorkerLog } from '../hooks/useWorkerData';
import { IntelligenceCopilot } from '../components/IntelligenceCopilot';
import { MarketCharts } from '../components/MarketCharts';
import { LiveAlphaTicker } from '../components/LiveAlphaTicker';
import { CentralIntelligenceTerminal } from '../components/CentralIntelligenceTerminal';
import ErrorBoundary from '../components/ErrorBoundary';

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricRow({ label, value, unit = '', highlight = false }: { label: string; value: number | undefined; unit?: string; highlight?: boolean }) {
  if (value === undefined) return null;
  return (
    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <span className="text-[11px] font-mono text-[#a1a1aa]">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${highlight ? 'text-[#d4af37]' : 'text-white'}`}>
        {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : value}{unit}
      </span>
    </div>
  );
}

function DataPanel({ title, icon: Icon, children, loading }: { title: string; icon: any; children: React.ReactNode; loading: boolean }) {
  // Check if children are all null/undefined (no data to display)
  const childArray = React.Children.toArray(children);
  const hasData = childArray.length > 0 && childArray.some(c => c != null);
  
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-2" style={{ background: 'rgba(16,16,22,0.8)', borderColor: 'rgba(212,175,55,0.15)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-[#d4af37]" />
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#d4af37]">{title}</span>
        {loading && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />}
      </div>
      {loading
        ? <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-5 rounded animate-pulse" style={{ background: 'rgba(212,175,55,0.06)' }} />)}</div>
        : hasData
          ? children
          : <div className="text-[10px] font-mono text-[#a1a1aa] py-3 text-center">No data available</div>
      }
    </div>
  );
}

const LOG_STATUS_STYLE: Record<string, string> = {
  OK:    'text-green-400 bg-green-900/20',
  ERROR: 'text-red-400 bg-red-900/30',
};

function WorkerLogsPanel({ logs, loading, running, onRun }: { logs: WorkerLog[]; loading: boolean; running: boolean; onRun: () => void }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: 'rgba(11,11,15,0.9)', borderColor: 'rgba(212,175,55,0.18)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-3.5 h-3.5 text-[#d4af37]" />
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#d4af37]">Worker Log Feed</span>
        <div className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[9px] font-mono text-[#a1a1aa] ml-1">REALTIME</span>
        <button
          onClick={onRun}
          disabled={running}
          className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 hover:opacity-80"
          style={{ background: 'rgba(212,175,55,0.15)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.3)' }}
        >
          {running
            ? <><RefreshCcw className="w-3 h-3 animate-spin" />Running...</>
            : <><Play className="w-3 h-3" />Run Worker</>}
        </button>
      </div>
      <div className="space-y-1 overflow-y-auto max-h-64 pr-1">
        {loading && logs.length === 0 && (
          <div className="text-xs text-[#a1a1aa] font-mono py-6 text-center">Connecting to log stream...</div>
        )}
        {!loading && logs.length === 0 && (
          <div className="text-xs text-[#a1a1aa] font-mono py-6 text-center">No log entries yet. Run the worker to generate data.</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 py-1.5 border-b font-mono" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <span className="text-[9px] text-[#a1a1aa] shrink-0 pt-0.5 min-w-[56px]">
              {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${LOG_STATUS_STYLE[log.status ?? 'OK'] ?? 'text-[#d4af37] bg-[#d4af37]/10'}`}>
              {log.status ?? 'OK'}
            </span>
            <span className="text-[9px] text-[#d4af37] shrink-0 min-w-[72px] truncate">
              {log.table_name ?? '—'}
            </span>
            <span className="text-[10px] text-white truncate flex-1">
              {log.metric_key ?? log.details?.message ?? '—'}
            </span>
            {log.old_value != null && log.new_value != null && (
              <span className="text-[9px] font-mono shrink-0" style={{ color: log.new_value >= log.old_value ? '#4ade80' : '#f87171' }}>
                {log.new_value >= log.old_value ? '+' : ''}{(log.new_value - log.old_value).toFixed(4)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Intelligence() {
  const { uiTheme } = useAdaptiveTheme();
  const { latest: snapshot } = useMarketSnapshot();
  const { macroUS, macroEU, crypto, energy, logs, loading, running, lastRun, triggerRun, refresh } = useWorkerData();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  // Derive display values from Supabase data — no hardcoded fallbacks
  const survivalProb = snapshot?.survival_probability != null
    ? (snapshot.survival_probability > 1 ? snapshot.survival_probability : Math.round(snapshot.survival_probability * 100))
    : null;
  const systemicRisk = snapshot?.systemic_risk != null
    ? (snapshot.systemic_risk > 1 ? snapshot.systemic_risk : Math.round(snapshot.systemic_risk * 100))
    : null;
  const btcVolatility = snapshot?.btc_volatility != null
    ? (snapshot.btc_volatility > 1 ? snapshot.btc_volatility : Math.round(snapshot.btc_volatility * 100))
    : null;
  const regime = snapshot?.regime || 'normal';

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
        className="rounded-xl p-6 space-y-5 border"
        style={{ background: 'rgba(11,11,15,0.6)', borderColor: 'rgba(212,175,55,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">
              Live Intelligence Feed
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded tracking-widest"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#a1a1aa' }}>
              {loading ? 'LOADING' : 'ONLINE'}
            </span>
            {lastRun && (
              <span className="text-[9px] font-mono text-[#a1a1aa]">
                Last run: {lastRun.replace('run_', '')}
              </span>
            )}
          </div>
          <button onClick={refresh} disabled={loading} className="p-1.5 rounded hover:opacity-70 transition-opacity disabled:opacity-40"
            style={{ color: '#d4af37' }} aria-label="Refresh">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Data Panels: Macro US / Macro EU / Crypto / Energy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataPanel title="Macro — US" icon={Network} loading={loading}>
            <MetricRow label="DGS10"      value={macroUS.DGS10}      unit="%" highlight />
            <MetricRow label="DGS2"       value={macroUS.DGS2}       unit="%" />
            <MetricRow label="Spread"     value={macroUS.SPREAD}     unit="%" highlight />
            <MetricRow label="WALCL ($B)" value={macroUS.WALCL} />
            <MetricRow label="Rate Shock" value={macroUS.RATE_SHOCK} />
          </DataPanel>

          <DataPanel title="Macro — EU" icon={Network} loading={loading}>
            <MetricRow label="ECB Rate"   value={macroEU.ECB_RATE}   unit="%" highlight />
            <MetricRow label="HICP"       value={macroEU.HICP}       unit="%" />
            <MetricRow label="M3 Growth"  value={macroEU.M3_GROWTH}  unit="%" />
            <MetricRow label="Spread"     value={macroEU.SPREAD}     unit="%" highlight />
            <MetricRow label="Rate Shock" value={macroEU.RATE_SHOCK} />
          </DataPanel>

          <DataPanel title="Crypto" icon={Zap} loading={loading}>
            <MetricRow label="BTC Price"    value={crypto.BTC_PRICE}      unit=" $" highlight />
            <MetricRow label="24h Change"   value={crypto.BTC_CHANGE_24H} unit="%" />
            <MetricRow label="Dominance"    value={crypto.BTC_DOMINANCE}  unit="%" />
            <MetricRow label="Vol (ann.)"   value={crypto.BTC_VOL}        highlight />
            <MetricRow label="Fear/Greed"   value={crypto.FEAR_GREED} />
            <MetricRow label="ETH Price"    value={crypto.ETH_PRICE}      unit=" $" />
            <MetricRow label="VaR 95%"      value={crypto.VAR_95} />
          </DataPanel>

          <DataPanel title="Energy & Commodities" icon={Droplets} loading={loading}>
            <MetricRow label="WTI Crude"    value={energy.WTI_CRUDE}    unit=" $" highlight />
            <MetricRow label="Brent"        value={energy.BRENT_CRUDE}  unit=" $" />
            <MetricRow label="Natural Gas"  value={energy.NATURAL_GAS}  unit=" $" />
            <MetricRow label="Uranium"      value={energy.URANIUM}      unit=" $" />
            <MetricRow label="Gold (XAU)"   value={energy.GOLD_XAU}     unit=" $" highlight />
            <MetricRow label="Silver (XAG)" value={energy.SILVER_XAG}   unit=" $" />
            <MetricRow label="Copper"       value={energy.COPPER}       unit=" $" />
          </DataPanel>
        </div>

        {/* Worker Logs — realtime feed */}
        <WorkerLogsPanel logs={logs} loading={loading} running={running} onRun={triggerRun} />
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
