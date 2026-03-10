import React, { useMemo } from 'react';
import { Globe, Shield, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { computeAGISystemState } from '../services/agiBrainEngine';

// Защитен рендеринг за числа
const formatNum = (val: number | undefined | null, decimals: number = 1): string => {
  if (val === null || val === undefined || isNaN(val)) return '--';
  return val.toFixed(decimals);
};

export function SovereignIntelligenceNode() {
  const { uiTheme } = useAdaptiveTheme();
  const { latest: snapshot, loading, error } = useMarketSnapshot();
  const isDark = uiTheme === 'terminal' || uiTheme === 'hybrid';

  // 1. Safe computation with fallbacks - handles null/undefined gracefully
  const agiState = useMemo(() => {
    return computeAGISystemState({
      survivalProbability: snapshot?.survival_probability ?? null,
      systemicRisk: snapshot?.systemic_risk ?? null,
      yieldSpread: snapshot?.yield_spread ?? null,
      btcVolatility: snapshot?.btc_volatility ?? null,
      balanceSheetDelta: snapshot?.balance_sheet_delta ?? null,
      rateShock: snapshot?.rate_shock ?? null
    });
  }, [snapshot]);

  // Show loading skeleton while fetching data
  if (loading) {
    return (
      <div className={`rounded-xl border p-4 md:p-6 ${isDark ? 'bg-[#0b0f17] border-[#1f2937]' : 'bg-white border-gray-200'}`}>
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg" />
            <div className="space-y-2">
              <div className="h-4 w-48 bg-gray-700/50 rounded" />
              <div className="h-3 w-32 bg-gray-700/30 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 bg-gray-700/30 rounded" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-32 bg-gray-700/20 rounded" />
            <div className="h-32 bg-gray-700/20 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Деструктуриране с гарантирани default стойности (Safety Net)
  const sovereign = agiState?.sovereign ?? {
    reserveCurrencyShare: 0,
    tradeSettlementVolume: 0,
    capitalControlStrength: 0,
    sovereignPowerIndex: 0
  };

  const civilization = agiState?.civilization ?? {
    civilizationScore: 0,
    demographicHealth: 0,
    economicSustainability: 0,
    technologicalAdaptation: 0,
    geopoliticalStability: 0
  };

  // 3. Динамични данни за валутните блокове
  const currencyBlocks = useMemo(() => [
    { label: 'USD', value: sovereign.reserveCurrencyShare || 58, trend: 'down', color: 'bg-blue-500' },
    { label: 'EUR', value: 20, trend: 'stable', color: 'bg-cyan-500' },
    { label: 'CNY', value: 12, trend: 'up', color: 'bg-red-500' },
    { label: 'JPY', value: 5.5, trend: 'down', color: 'bg-amber-500' },
  ], [sovereign.reserveCurrencyShare]);

  return (
    <div className={`rounded-xl border p-4 md:p-6 transition-all duration-500 ${
      isDark ? 'bg-[#0b0f17] border-[#1f2937]' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      
      {/* Header със статус индикатор */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <Globe className="w-5 h-5 text-cyan-500" />
          </div>
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-tighter ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sovereign Intelligence Node
            </h3>
            <p className="text-[10px] font-mono text-cyan-500/70">CORE SYSTEM // L10 CIVILIZATION STATE</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-black/20 rounded border border-white/5">
          <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-cyan-500'}`} />
          <span className="text-[10px] font-mono text-gray-500">{loading ? 'SYNCING' : 'LIVE'}</span>
        </div>
      </div>

      {/* Gauges Grid - Използваме формат функцията за безопасност */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricGauge label="SOV POWER" value={sovereign.sovereignPowerIndex} color="cyan" />
        <MetricGauge label="RESERVE DOM" value={sovereign.reserveCurrencyShare} color="blue" decay="-1.2%" />
        <MetricGauge label="TRADE VOL" value={sovereign.tradeSettlementVolume} color="green" />
        <MetricGauge label="STABILITY" value={civilization.civilizationScore} color="amber" />
      </div>

      {/* Civilization Radar / Stats Panel */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3 bg-black/20 p-4 border border-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-mono font-bold text-gray-400">STRUCTURAL METRICS</span>
          </div>
          <StatBar label="Demographics" value={civilization.demographicHealth} />
          <StatBar label="Economic Sustainability" value={civilization.economicSustainability} />
          <StatBar label="Tech Adaptation" value={civilization.technologicalAdaptation} />
        </div>

        <div className="space-y-3 bg-black/20 p-4 border border-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-mono font-bold text-gray-400">CURRENCY HEGEMONY</span>
          </div>
          {currencyBlocks.map(block => (
            <div key={block.label} className="flex items-center gap-3">
              <span className="text-[10px] font-mono w-8 text-gray-500">{block.label}</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${block.color}`} style={{ width: `${block.value}%` }} />
              </div>
              <span className="text-[10px] font-mono text-white">{block.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Помощни малки компоненти (Sub-components) за по-добър синтаксис
function MetricGauge({ label, value, color, decay }: { label: string, value: number, color: string, decay?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[28px] font-black font-mono tracking-tighter text-white">
        {formatNum(value)}
      </div>
      <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1">
        {label} {decay && <span className="text-red-500">{decay}</span>}
      </div>
    </div>
  );
}

function StatBar({ label, value }: { label: string, value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono uppercase">
        <span className="text-gray-500">{label}</span>
        <span className="text-white">{formatNum(value)}%</span>
      </div>
      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-500/50" style={{ width: `${value || 0}%` }} />
      </div>
    </div>
  );
}
