'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Droplets,
  Flame,
  Zap,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  RefreshCw,
  ChevronDown,
  Activity,
  DollarSign,
  Fuel,
  Factory,
  Loader2,
} from 'lucide-react';
import type {
  DashboardView,
  EnergyCategory,
  LiquidityData,
  EnergyData,
  CorrelationResult,
  MarketFlowSignal,
} from '../types/energy-finance';
import {
  fetchStablecoins,
  fetchEnergyData,
  calculateOilLiquidityCorrelation,
  generateMarketFlowSignal,
  formatLargeNumber,
  formatPercentChange,
} from '../services/energyFinanceService';

// =============================================================================
// Sovereign Design System - Black + Gold + Sharp Corners
// =============================================================================

const SOVEREIGN = {
  bg: {
    primary: 'bg-black',
    secondary: 'bg-zinc-950',
    card: 'bg-zinc-900',
    elevated: 'bg-zinc-800',
  },
  border: {
    primary: 'border-amber-500/30',
    secondary: 'border-zinc-700',
    accent: 'border-amber-400',
    danger: 'border-red-500/50',
  },
  text: {
    primary: 'text-zinc-100',
    secondary: 'text-zinc-400',
    accent: 'text-amber-400',
    muted: 'text-zinc-500',
    danger: 'text-red-400',
    success: 'text-emerald-400',
  },
  accent: {
    gold: 'text-amber-400',
    goldBg: 'bg-amber-400',
    goldBorder: 'border-amber-400',
  },
};

// =============================================================================
// Sub-Components
// =============================================================================

// Side Navigation Component
const SideNav = memo(function SideNav({
  activeView,
  onViewChange,
}: {
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}) {
  return (
    <div className={`w-16 md:w-48 ${SOVEREIGN.bg.secondary} border-r ${SOVEREIGN.border.secondary} flex flex-col`}>
      <div className={`p-4 border-b ${SOVEREIGN.border.secondary}`}>
        <div className={`text-xs font-mono uppercase tracking-widest ${SOVEREIGN.text.accent}`}>
          <span className="hidden md:inline">SOVEREIGN</span>
          <span className="md:hidden">S</span>
        </div>
      </div>
      
      <nav className="flex-1 p-2">
        <button
          onClick={() => onViewChange('liquidity')}
          className={`w-full flex items-center gap-3 p-3 mb-2 rounded-none transition-all ${
            activeView === 'liquidity'
              ? `${SOVEREIGN.bg.card} border-l-2 ${SOVEREIGN.accent.goldBorder} ${SOVEREIGN.text.accent}`
              : `${SOVEREIGN.text.secondary} hover:${SOVEREIGN.text.primary} hover:bg-zinc-800/50`
          }`}
        >
          <DollarSign className="w-5 h-5 flex-shrink-0" />
          <span className="hidden md:inline text-sm font-medium">Liquidity</span>
        </button>
        
        <button
          onClick={() => onViewChange('energy')}
          className={`w-full flex items-center gap-3 p-3 rounded-none transition-all ${
            activeView === 'energy'
              ? `${SOVEREIGN.bg.card} border-l-2 ${SOVEREIGN.accent.goldBorder} ${SOVEREIGN.text.accent}`
              : `${SOVEREIGN.text.secondary} hover:${SOVEREIGN.text.primary} hover:bg-zinc-800/50`
          }`}
        >
          <Flame className="w-5 h-5 flex-shrink-0" />
          <span className="hidden md:inline text-sm font-medium">Energy</span>
        </button>
      </nav>
      
      <div className={`p-3 border-t ${SOVEREIGN.border.secondary}`}>
        <div className={`text-[10px] font-mono ${SOVEREIGN.text.muted} hidden md:block`}>
          EIA + DEFILLAMA
        </div>
      </div>
    </div>
  );
});

// Energy Category Dropdown
const EnergyCategoryDropdown = memo(function EnergyCategoryDropdown({
  selected,
  onSelect,
}: {
  selected: EnergyCategory;
  onSelect: (category: EnergyCategory) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const categories: { value: EnergyCategory; label: string; icon: React.ReactNode }[] = [
    { value: 'crude-oil', label: 'Crude Oil', icon: <Fuel className="w-4 h-4" /> },
    { value: 'natural-gas', label: 'Natural Gas', icon: <Flame className="w-4 h-4" /> },
    { value: 'coal', label: 'Coal', icon: <Factory className="w-4 h-4" /> },
    { value: 'electricity', label: 'Electricity', icon: <Zap className="w-4 h-4" /> },
  ];

  const selectedCategory = categories.find(c => c.value === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 ${SOVEREIGN.bg.card} border ${SOVEREIGN.border.primary} rounded-none ${SOVEREIGN.text.primary} hover:border-amber-400 transition-colors min-w-[180px]`}
      >
        {selectedCategory?.icon}
        <span className="text-sm font-medium">{selectedCategory?.label}</span>
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1 ${SOVEREIGN.bg.card} border ${SOVEREIGN.border.primary} rounded-none z-50`}>
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => {
                onSelect(cat.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                cat.value === selected
                  ? `${SOVEREIGN.text.accent} bg-amber-400/10`
                  : `${SOVEREIGN.text.secondary} hover:${SOVEREIGN.text.primary} hover:bg-zinc-800`
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// Metric Card Component
const MetricCard = memo(function MetricCard({
  title,
  value,
  change,
  changePercent,
  icon,
  isPositiveGood = true,
}: {
  title: string;
  value: string;
  change?: number;
  changePercent?: number;
  icon: React.ReactNode;
  isPositiveGood?: boolean;
}) {
  const isPositive = (changePercent ?? 0) >= 0;
  const isGood = isPositiveGood ? isPositive : !isPositive;

  return (
    <div className={`${SOVEREIGN.bg.card} border ${SOVEREIGN.border.secondary} p-4 rounded-none`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-mono uppercase tracking-wider ${SOVEREIGN.text.muted}`}>
          {title}
        </span>
        <div className={SOVEREIGN.text.accent}>{icon}</div>
      </div>
      <div className={`text-2xl font-bold ${SOVEREIGN.text.primary} mb-2 tabular-nums`}>
        {value}
      </div>
      {changePercent !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${isGood ? SOVEREIGN.text.success : SOVEREIGN.text.danger}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="tabular-nums">{formatPercentChange(changePercent)}</span>
        </div>
      )}
    </div>
  );
});

// Warning Banner Component
const WarningBanner = memo(function WarningBanner({
  signal,
}: {
  signal: MarketFlowSignal;
}) {
  if (signal.type === 'neutral') return null;

  const severityColors = {
    low: 'bg-zinc-800 border-zinc-600',
    medium: 'bg-amber-950/50 border-amber-500/50',
    high: 'bg-orange-950/50 border-orange-500/50',
    critical: 'bg-red-950/50 border-red-500/50 animate-pulse',
  };

  return (
    <div className={`${severityColors[signal.severity]} border rounded-none p-4`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
          signal.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
        }`} />
        <div className="flex-1">
          <div className={`text-sm font-bold uppercase tracking-wider ${
            signal.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
          }`}>
            {signal.message}
          </div>
          <div className={`text-xs ${SOVEREIGN.text.muted} mt-1 font-mono`}>
            OIL: {signal.oilTrend.toUpperCase()} | LIQUIDITY: {signal.liquidityTrend.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
});

// Stablecoin Table Component
const StablecoinTable = memo(function StablecoinTable({
  stablecoins,
}: {
  stablecoins: LiquidityData['topStablecoins'];
}) {
  return (
    <div className={`${SOVEREIGN.bg.card} border ${SOVEREIGN.border.secondary} rounded-none overflow-hidden`}>
      <div className={`px-4 py-3 border-b ${SOVEREIGN.border.secondary}`}>
        <h3 className={`text-xs font-mono uppercase tracking-wider ${SOVEREIGN.text.accent}`}>
          TOP STABLECOINS BY MARKET CAP
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b ${SOVEREIGN.border.secondary}`}>
              <th className={`text-left px-4 py-3 text-xs font-mono ${SOVEREIGN.text.muted}`}>ASSET</th>
              <th className={`text-right px-4 py-3 text-xs font-mono ${SOVEREIGN.text.muted}`}>MCAP</th>
              <th className={`text-right px-4 py-3 text-xs font-mono ${SOVEREIGN.text.muted}`}>DOM%</th>
            </tr>
          </thead>
          <tbody>
            {stablecoins.map((coin, i) => (
              <tr key={coin.symbol} className={`border-b ${SOVEREIGN.border.secondary} last:border-b-0`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 text-center text-xs ${SOVEREIGN.text.muted}`}>{i + 1}</span>
                    <span className={`font-medium ${SOVEREIGN.text.primary}`}>{coin.symbol}</span>
                    <span className={`text-xs ${SOVEREIGN.text.muted}`}>{coin.name}</span>
                  </div>
                </td>
                <td className={`px-4 py-3 text-right font-mono tabular-nums ${SOVEREIGN.text.primary}`}>
                  {formatLargeNumber(coin.mcap)}
                </td>
                <td className={`px-4 py-3 text-right font-mono tabular-nums ${SOVEREIGN.text.accent}`}>
                  {coin.dominance.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// Simple Chart Component (Text-based for reliability)
const SimpleChart = memo(function SimpleChart({
  data,
  height = 120,
}: {
  data: { date: Date; value: number }[];
  height?: number;
}) {
  if (data.length === 0) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <div className={`${SOVEREIGN.bg.card} border ${SOVEREIGN.border.secondary} rounded-none p-4`}>
      <div className="flex items-end gap-[2px]" style={{ height }}>
        {data.slice(-52).map((point, i) => {
          const heightPercent = ((point.value - min) / range) * 100;
          return (
            <div
              key={i}
              className="flex-1 bg-amber-400/60 hover:bg-amber-400 transition-colors"
              style={{ height: `${Math.max(heightPercent, 2)}%` }}
              title={`${point.date.toLocaleDateString()}: ${point.value.toLocaleString()}`}
            />
          );
        })}
      </div>
      <div className={`flex justify-between mt-2 text-[10px] ${SOVEREIGN.text.muted} font-mono`}>
        <span>{data[0]?.date.toLocaleDateString()}</span>
        <span>{data[data.length - 1]?.date.toLocaleDateString()}</span>
      </div>
    </div>
  );
});

// =============================================================================
// Main Dashboard Component
// =============================================================================

export function EnergyFinanceDashboard() {
  const [view, setView] = useState<DashboardView>('liquidity');
  const [energyCategory, setEnergyCategory] = useState<EnergyCategory>('crude-oil');
  const [liquidityData, setLiquidityData] = useState<LiquidityData | null>(null);
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [correlationResult, setCorrelationResult] = useState<CorrelationResult | null>(null);
  const [marketSignal, setMarketSignal] = useState<MarketFlowSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const fetchAllData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      const [liquidity, energy] = await Promise.all([
        fetchStablecoins(),
        fetchEnergyData(energyCategory),
      ]);

      setLiquidityData(liquidity);
      setEnergyData(energy);

      // Calculate correlation
      const correlation = calculateOilLiquidityCorrelation(energy, liquidity);
      setCorrelationResult(correlation);
      setMarketSignal(generateMarketFlowSignal(correlation));
    } catch (error) {
      console.error('[EnergyFinanceDashboard] Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [energyCategory]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Recalculate when energy category changes
  useEffect(() => {
    if (liquidityData && energyData) {
      const correlation = calculateOilLiquidityCorrelation(energyData, liquidityData);
      setCorrelationResult(correlation);
      setMarketSignal(generateMarketFlowSignal(correlation));
    }
  }, [energyData, liquidityData]);

  const handleRefresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (loading) {
    return (
      <div className={`h-full ${SOVEREIGN.bg.primary} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`w-8 h-8 ${SOVEREIGN.text.accent} animate-spin`} />
          <span className={`text-sm font-mono ${SOVEREIGN.text.muted}`}>LOADING SOVEREIGN TERMINAL...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${SOVEREIGN.bg.primary} flex rounded-none overflow-hidden`}>
      {/* Side Navigation */}
      <SideNav activeView={view} onViewChange={setView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`${SOVEREIGN.bg.secondary} border-b ${SOVEREIGN.border.secondary} px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-lg font-bold uppercase tracking-wider ${SOVEREIGN.text.primary}`}>
                {view === 'liquidity' ? 'DOLLAR LIQUIDITY' : 'ENERGY MARKETS'}
              </h1>
              <p className={`text-xs font-mono ${SOVEREIGN.text.muted} mt-1`}>
                {view === 'liquidity' ? 'DEFILLAMA STABLECOINS API' : 'EIA OPEN DATA API'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {view === 'energy' && (
                <EnergyCategoryDropdown selected={energyCategory} onSelect={setEnergyCategory} />
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 ${SOVEREIGN.bg.card} border ${SOVEREIGN.border.secondary} rounded-none ${SOVEREIGN.text.secondary} hover:${SOVEREIGN.text.accent} hover:border-amber-400 transition-colors disabled:opacity-50`}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Warning Banner */}
          {marketSignal && correlationResult?.warning && (
            <WarningBanner signal={marketSignal} />
          )}

          {view === 'liquidity' && liquidityData && (
            <>
              {/* Liquidity Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Total Stablecoin MCAP"
                  value={formatLargeNumber(liquidityData.totalStablecoinMcap)}
                  changePercent={liquidityData.change24h}
                  icon={<DollarSign className="w-5 h-5" />}
                />
                <MetricCard
                  title="24H Change"
                  value={formatPercentChange(liquidityData.change24h)}
                  changePercent={liquidityData.change24h}
                  icon={<Activity className="w-5 h-5" />}
                />
                <MetricCard
                  title="7D Momentum"
                  value={formatPercentChange(liquidityData.change7d)}
                  changePercent={liquidityData.change7d}
                  icon={<BarChart3 className="w-5 h-5" />}
                />
              </div>

              {/* Historical Chart */}
              <div>
                <div className={`text-xs font-mono uppercase tracking-wider ${SOVEREIGN.text.muted} mb-3`}>
                  STABLECOIN MARKET CAP (30D)
                </div>
                <SimpleChart data={liquidityData.historicalData} height={140} />
              </div>

              {/* Stablecoin Table */}
              <StablecoinTable stablecoins={liquidityData.topStablecoins} />
            </>
          )}

          {view === 'energy' && energyData && (
            <>
              {/* Energy Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title={energyData.title}
                  value={`${energyData.latestValue.toLocaleString()} ${energyData.units}`}
                  changePercent={energyData.changePercent}
                  icon={<Flame className="w-5 h-5" />}
                  isPositiveGood={energyCategory === 'crude-oil'}
                />
                <MetricCard
                  title="Weekly Change"
                  value={`${energyData.change >= 0 ? '+' : ''}${energyData.change.toLocaleString()}`}
                  changePercent={energyData.changePercent}
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <MetricCard
                  title="Last Updated"
                  value={energyData.lastUpdated.toLocaleDateString()}
                  icon={<Activity className="w-5 h-5" />}
                />
              </div>

              {/* Historical Chart */}
              <div>
                <div className={`text-xs font-mono uppercase tracking-wider ${SOVEREIGN.text.muted} mb-3`}>
                  {energyData.title.toUpperCase()} (52W)
                </div>
                <SimpleChart data={energyData.historicalData} height={140} />
              </div>

              {/* Correlation Panel */}
              {correlationResult && (
                <div className={`${SOVEREIGN.bg.card} border ${SOVEREIGN.border.secondary} rounded-none p-4`}>
                  <div className={`text-xs font-mono uppercase tracking-wider ${SOVEREIGN.text.accent} mb-4`}>
                    OIL-LIQUIDITY CORRELATION ANALYSIS
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className={`text-xs ${SOVEREIGN.text.muted} mb-1`}>Oil Price Change</div>
                      <div className={`text-lg font-mono tabular-nums ${
                        correlationResult.oilPriceChange >= 0 ? SOVEREIGN.text.success : SOVEREIGN.text.danger
                      }`}>
                        {formatPercentChange(correlationResult.oilPriceChange)}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs ${SOVEREIGN.text.muted} mb-1`}>Liquidity Change</div>
                      <div className={`text-lg font-mono tabular-nums ${
                        correlationResult.liquidityChange >= 0 ? SOVEREIGN.text.success : SOVEREIGN.text.danger
                      }`}>
                        {formatPercentChange(correlationResult.liquidityChange)}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs ${SOVEREIGN.text.muted} mb-1`}>Signal</div>
                      <div className={`text-lg font-bold uppercase ${
                        correlationResult.signal === 'bullish' ? SOVEREIGN.text.success :
                        correlationResult.signal === 'bearish' ? SOVEREIGN.text.danger :
                        SOVEREIGN.text.secondary
                      }`}>
                        {correlationResult.signal}
                      </div>
                    </div>
                    <div>
                      <div className={`text-xs ${SOVEREIGN.text.muted} mb-1`}>Correlation</div>
                      <div className={`text-lg font-mono tabular-nums ${SOVEREIGN.text.primary}`}>
                        {correlationResult.correlation > 0 ? 'POSITIVE' : 'NEGATIVE'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className={`${SOVEREIGN.bg.secondary} border-t ${SOVEREIGN.border.secondary} px-6 py-3`}>
          <div className="flex items-center justify-between">
            <div className={`text-[10px] font-mono ${SOVEREIGN.text.muted}`}>
              DATA SOURCES: DEFILLAMA STABLECOINS API • EIA OPEN DATA
            </div>
            <div className={`text-[10px] font-mono ${SOVEREIGN.text.accent}`}>
              SOVEREIGN TERMINAL v1.0
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default EnergyFinanceDashboard;
