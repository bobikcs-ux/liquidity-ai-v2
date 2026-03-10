'use client';

import React from 'react';
import { GitBranch, Target, BarChart3, Network, Droplets, Gauge, Activity, RefreshCcw, Play, Zap } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { useWorkerData, WorkerLog } from '../hooks/useWorkerData';
import { IntelligenceCopilot } from '../components/IntelligenceCopilot';
import { MarketCharts } from '../components/MarketCharts';
import { LiveAlphaTicker } from '../components/LiveAlphaTicker';
import { CentralIntelligenceTerminal } from '../components/CentralIntelligenceTerminal';
import ErrorBoundary from '../components/ErrorBoundary';

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricRow({ label, value, unit = '', highlight = false }: { label: string; value: number | undefined | null; unit?: string; highlight?: boolean }) {
  if (value == null) return null;
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
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-2" style={{ background: 'rgba(16,16,22,0.8)', borderColor: 'rgba(212,175,55,0.15)' }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5 text-[#d4af37]" />
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#d4af37]">{title}</span>
        {loading && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />}
      </div>
      {loading && !children
        ? <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-5 rounded animate-pulse" style={{ background: 'rgba(212,175,55,0.06)' }} />)}</div>
        : children}
    </div>
  );
}

const LOG_STATUS_STYLE: Record<string, string> = {
  OK:    'text-green-400 bg-green-900/20',
  ERROR: 'text-red-400 bg-red-900/30',
};

function WorkerLogsPanel({ logs = [], loading, running, onRun }: { logs?: WorkerLog[]; loading: boolean; running: boolean; onRun: () => void }) {
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
              {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour12: false }) : '—'}
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

// ── Main Component ─────────────────────────────────────────────────────────────

export function Intelligence() {
  const { uiTheme } = useAdaptiveTheme();
  const { latest: snapshot } = useMarketSnapshot();
  const { macroUS = {}, macroEU = {}, crypto = {}, energy = {}, logs = [], loading = false, running = false, lastRun, triggerRun, refresh } = useWorkerData();

  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  // Safe derived values
  const survivalProb = snapshot?.survival_probability != null
    ? Math.round(Math.min(snapshot.survival_probability * 100, 100))
    : null;
  const systemicRisk = snapshot?.systemic_risk != null
    ? Math.round(Math.min(snapshot.systemic_risk * 100, 100))
    : null;
  const btcVolatility = snapshot?.btc_volatility != null
    ? Math.round(Math.min(snapshot.btc_volatility, 100))
    : null;
  const regime = snapshot?.regime || 'normal';

  const regimeTransitions = regime === 'crisis'
    ? { toNeutral: 12, toStress: 15, maintain: 73 }
    : regime === 'stress'
    ? { toNeutral: 23, toStress: 8, maintain: 69 }
    : { toNeutral: 45, toStress: 5, maintain: 50 };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          Intelligence Terminal
        </h1>
        <p className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-600'} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          Deep analytics layer
        </p>
      </div>

      {/* LIVE INTELLIGENCE LAYER */}
      <div className="rounded-xl p-6 space-y-5 border" style={{ background: 'rgba(11,11,15,0.6)', borderColor: 'rgba(212,175,55,0.18)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#d4af37]">Live Intelligence Feed</span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded tracking-widest" style={{ background: 'rgba(212,175,55,0.1)', color: '#a1a1aa' }}>
              {loading ? 'LOADING' : 'ONLINE'}
            </span>
            {lastRun && <span className="text-[9px] font-mono text-[#a1a1aa]">Last run: {lastRun.replace('run_', '')}</span>}
          </div>
          <button onClick={refresh} disabled={loading} className="p-1.5 rounded hover:opacity-70 transition-opacity disabled:opacity-40" style={{ color: '#d4af37' }} aria-label="Refresh">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Data Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DataPanel title="Macro — US" icon={Network} loading={loading}>
            <MetricRow label="DGS10" value={macroUS?.DGS10 ?? 0} unit="%" highlight />
            <MetricRow label="DGS2" value={macroUS?.DGS2 ?? 0} unit="%" />
            <MetricRow label="Spread" value={macroUS?.SPREAD ?? 0} unit="%" highlight />
            <MetricRow label="WALCL ($B)" value={macroUS?.WALCL ?? 0} />
            <MetricRow label="Rate Shock" value={macroUS?.RATE_SHOCK ?? 0} />
          </DataPanel>

          <DataPanel title="Macro — EU" icon={Network} loading={loading}>
            <MetricRow label="ECB Rate" value={macroEU?.ECB_RATE ?? 0} unit="%" highlight />
            <MetricRow label="HICP" value={macroEU?.HICP ?? 0} unit="%" />
            <MetricRow label="M3 Growth" value={macroEU?.M3_GROWTH ?? 0} unit="%" />
            <MetricRow label="Spread" value={macroEU?.SPREAD ?? 0} unit="%" highlight />
            <MetricRow label="Rate Shock" value={macroEU?.RATE_SHOCK ?? 0} />
          </DataPanel>

          <DataPanel title="Crypto" icon={Zap} loading={loading}>
            <MetricRow label="BTC Price" value={crypto?.BTC_PRICE ?? 0} unit=" $" highlight />
            <MetricRow label="24h Change" value={crypto?.BTC_CHANGE_24H ?? 0} unit="%" />
            <MetricRow label="Dominance" value={crypto?.BTC_DOMINANCE ?? 0} unit="%" />
            <MetricRow label="Vol (ann.)" value={crypto?.BTC_VOL ?? 0} highlight />
            <MetricRow label="Fear/Greed" value={crypto?.FEAR_GREED ?? 0} />
            <MetricRow label="ETH Price" value={crypto?.ETH_PRICE ?? 0} unit=" $" />
            <MetricRow label="VaR 95%" value={crypto?.VAR_95 ?? 0} />
          </DataPanel>

          <DataPanel title="Energy & Commodities" icon={Droplets} loading={loading}>
            <MetricRow label="WTI Crude" value={energy?.WTI_CRUDE ?? 0} unit=" $" highlight />
            <MetricRow label="Brent" value={energy?.BRENT_CRUDE ?? 0} unit=" $" />
            <MetricRow label="Natural Gas" value={energy?.NATURAL_GAS ?? 0} unit=" $" />
            <MetricRow label="Uranium" value={energy?.URANIUM ?? 0} unit=" $" />
            <MetricRow label="Gold (XAU)" value={energy?.GOLD_XAU ?? 0} unit=" $" highlight />
            <MetricRow label="Silver (XAG)" value={energy?.SILVER_XAG ?? 0} unit=" $" />
            <MetricRow label="Copper" value={energy?.COPPER ?? 0} unit=" $" />
          </DataPanel>
        </div>

        {/* Worker Logs */}
        <WorkerLogsPanel logs={logs} loading={loading} running={running} onRun={triggerRun} />
      </div>

      {/* Other components wrapped in ErrorBoundary */}
      <ErrorBoundary componentName="LiveAlphaTicker"><LiveAlphaTicker /></ErrorBoundary>
      <ErrorBoundary componentName="CentralIntelligenceTerminal"><CentralIntelligenceTerminal /></ErrorBoundary>
      <ErrorBoundary componentName="MarketCharts"><MarketCharts className="mb-6" /></ErrorBoundary>
      <ErrorBoundary componentName="IntelligenceCopilot"><IntelligenceCopilot /></ErrorBoundary>
    </div>
  );
}