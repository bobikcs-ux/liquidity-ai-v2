import React, { useState } from 'react';
import { runMasterScan, MarketContext } from '../services/masterIntelligence';
import { Cpu, RefreshCw, AlertTriangle, TrendingUp, Shield } from 'lucide-react';

export function AICopilot() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [context, setContext] = useState<MarketContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await runMasterScan();
      setContext(result.context);
      setAnalysis(result.analysis);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to run scan. Please try again.');
      console.error('[v104] AICopilot scan error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-[#0a0f1a] border border-blue-900/40 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">
              AI Copilot
            </h2>
            <p className="text-[9px] font-mono text-blue-400/60 uppercase">
              v104 Supabase Pipeline
            </p>
          </div>
        </div>
        <button
          onClick={runScan}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-xs font-bold uppercase rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : 'Run Scan'}
        </button>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-[9px] font-mono text-gray-500 mb-4">
          Last scan: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {/* Context Summary */}
      {context && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="text-[9px] text-gray-500 uppercase font-mono">BTC Price</div>
            <div className="text-lg font-bold text-white font-mono">
              ${context.btcPrice.toLocaleString()}
            </div>
            <div className={`text-xs font-mono ${context.btcChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {context.btcChange >= 0 ? '+' : ''}{context.btcChange.toFixed(2)}%
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="text-[9px] text-gray-500 uppercase font-mono">Fear & Greed</div>
            <div className="text-lg font-bold text-white font-mono">{context.fearGreedValue}</div>
            <div className="text-xs font-mono text-blue-400">{context.fearGreedLabel}</div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="text-[9px] text-gray-500 uppercase font-mono">Yield Curve</div>
            <div className="text-lg font-bold text-white font-mono">{context.yieldCurve}</div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg">
            <div className="text-[9px] text-gray-500 uppercase font-mono">VIX</div>
            <div className="text-lg font-bold text-white font-mono">{context.vix ?? 'N/A'}</div>
          </div>
        </div>
      )}

      {/* Analysis Output */}
      <div className="flex-1 bg-slate-950/50 border border-white/5 rounded-lg p-4 overflow-y-auto custom-scrollbar">
        {analysis ? (
          <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
            {analysis}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Shield className="w-8 h-8 text-blue-500/30 mb-3" />
            <p className="text-xs text-gray-500 font-mono uppercase">
              Click "Run Scan" to analyze market data
            </p>
            <p className="text-[9px] text-gray-600 font-mono mt-1">
              Data sourced from Supabase materialized views
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
