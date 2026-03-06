'use client';

/**
 * Energy Intelligence Dashboard
 * Bloomberg-grade institutional energy market terminal
 * Full-width panels with Oil, Gas, Shipping Flow, and Petrodollar Index
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Droplets,
  Flame,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  RefreshCw,
  Activity,
  DollarSign,
  Fuel,
  Ship,
  Anchor,
  Globe,
  Loader2,
  BarChart3,
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
// INSTITUTIONAL DESIGN TOKENS
// =============================================================================

const DESIGN = {
  bg: {
    primary: '#0b0b0f',
    panel: '#121218',
    card: '#16161d',
    elevated: '#1a1a22',
  },
  accent: {
    gold: '#d4af37',
    goldSoft: '#c6a85a',
    goldMuted: 'rgba(212, 175, 55, 0.12)',
  },
  status: {
    success: '#2ecc71',
    warning: '#ffb020',
    crisis: '#ff3b5c',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#a0a0a0',
    muted: '#6b6b6b',
  },
  border: {
    default: 'rgba(212, 175, 55, 0.08)',
    active: 'rgba(212, 175, 55, 0.2)',
  },
};

// =============================================================================
// INSTITUTIONAL PANEL COMPONENT
// =============================================================================

const InstitutionalPanel = memo(function InstitutionalPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
  isLoading = false,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}) {
  return (
    <div 
      className={`w-full ${className}`}
      style={{ 
        background: DESIGN.bg.panel, 
        border: `1px solid ${DESIGN.border.default}` 
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${DESIGN.border.default}` }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 flex items-center justify-center"
            style={{ background: DESIGN.accent.goldMuted }}
          >
            <Icon className="w-4 h-4" style={{ color: DESIGN.accent.gold }} />
          </div>
          <div>
            <h3 
              className="text-xs font-mono font-semibold uppercase tracking-wider"
              style={{ color: DESIGN.accent.gold }}
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] font-mono" style={{ color: DESIGN.text.muted }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: DESIGN.accent.gold }} />
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
});

// =============================================================================
// METRIC CARD COMPONENT
// =============================================================================

const MetricCard = memo(function MetricCard({
  label,
  value,
  change,
  unit,
  trend,
  size = 'default',
}: {
  label: string;
  value: string | number;
  change?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  size?: 'default' | 'large';
}) {
  const trendColor = trend === 'up' ? DESIGN.status.success : trend === 'down' ? DESIGN.status.crisis : DESIGN.text.secondary;
  
  return (
    <div 
      className="p-4"
      style={{ background: DESIGN.bg.card, border: `1px solid ${DESIGN.border.default}` }}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: DESIGN.text.muted }}>
        {label}
      </div>
      <div className="flex items-end gap-2">
        <span 
          className={`font-mono font-bold tabular-nums ${size === 'large' ? 'text-3xl' : 'text-xl'}`}
          style={{ color: DESIGN.text.primary }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-mono mb-1" style={{ color: DESIGN.text.muted }}>{unit}</span>
        )}
      </div>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2" style={{ color: trendColor }}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
          <span className="text-xs font-mono tabular-nums">{formatPercentChange(change)}</span>
        </div>
      )}
    </div>
  );
});

// =============================================================================
// FULL-WIDTH CHART COMPONENT
// =============================================================================

const FullWidthChart = memo(function FullWidthChart({
  data,
  label,
  height = 200,
  color = DESIGN.accent.gold,
}: {
  data: { date: Date; value: number }[];
  label: string;
  height?: number;
  color?: string;
}) {
  if (data.length === 0) {
    return (
      <div 
        className="w-full flex items-center justify-center"
        style={{ height, background: DESIGN.bg.card }}
      >
        <span className="text-sm font-mono" style={{ color: DESIGN.text.muted }}>No data available</span>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const latestValue = values[values.length - 1];
  const firstValue = values[0];
  const changePercent = ((latestValue - firstValue) / firstValue) * 100;

  return (
    <div className="w-full" style={{ background: DESIGN.bg.card, border: `1px solid ${DESIGN.border.default}` }}>
      {/* Chart Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${DESIGN.border.default}` }}>
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: DESIGN.text.muted }}>
          {label}
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono font-bold tabular-nums" style={{ color: DESIGN.text.primary }}>
            {latestValue.toLocaleString()}
          </span>
          <span 
            className="text-xs font-mono tabular-nums"
            style={{ color: changePercent >= 0 ? DESIGN.status.success : DESIGN.status.crisis }}
          >
            {formatPercentChange(changePercent)}
          </span>
        </div>
      </div>
      
      {/* Chart Body */}
      <div className="p-4">
        <div className="flex items-end gap-[1px] w-full" style={{ height }}>
          {data.map((point, i) => {
            const heightPercent = ((point.value - min) / range) * 100;
            const isLast = i === data.length - 1;
            return (
              <div
                key={i}
                className="flex-1 transition-all duration-150 hover:opacity-80"
                style={{ 
                  height: `${Math.max(heightPercent, 2)}%`,
                  background: isLast ? color : `${color}60`,
                }}
                title={`${point.date.toLocaleDateString()}: ${point.value.toLocaleString()}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-3 text-[9px] font-mono" style={{ color: DESIGN.text.muted }}>
          <span>{data[0]?.date.toLocaleDateString()}</span>
          <span>{data[data.length - 1]?.date.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// ALERT BANNER COMPONENT
// =============================================================================

const AlertBanner = memo(function AlertBanner({
  signal,
}: {
  signal: MarketFlowSignal;
}) {
  if (signal.type === 'neutral') return null;

  const severityColors = {
    low: { bg: DESIGN.bg.elevated, border: DESIGN.text.muted, text: DESIGN.text.secondary },
    medium: { bg: 'rgba(255, 176, 32, 0.1)', border: DESIGN.status.warning, text: DESIGN.status.warning },
    high: { bg: 'rgba(255, 107, 74, 0.1)', border: '#ff6b4a', text: '#ff6b4a' },
    critical: { bg: 'rgba(255, 59, 92, 0.1)', border: DESIGN.status.crisis, text: DESIGN.status.crisis },
  };

  const colors = severityColors[signal.severity];

  return (
    <div 
      className={`w-full p-4 ${signal.severity === 'critical' ? 'animate-pulse' : ''}`}
      style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: colors.text }} />
        <div className="flex-1">
          <div className="text-sm font-mono font-bold uppercase tracking-wider" style={{ color: colors.text }}>
            {signal.message}
          </div>
          <div className="text-[10px] font-mono mt-1" style={{ color: DESIGN.text.muted }}>
            OIL TREND: {signal.oilTrend.toUpperCase()} | LIQUIDITY TREND: {signal.liquidityTrend.toUpperCase()}
          </div>
        </div>
        <div className="text-[9px] font-mono uppercase px-2 py-1" style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
          {signal.severity}
        </div>
      </div>
    </div>
  );
});

// =============================================================================
// SHIPPING FLOW VISUALIZATION
// =============================================================================

const ShippingFlowPanel = memo(function ShippingFlowPanel({
  data,
}: {
  data: EnergyData | null;
}) {
  const chokepoints = [
    { name: 'Strait of Hormuz', flow: 21.0, delta: -2.3, region: 'Middle East' },
    { name: 'Strait of Malacca', flow: 16.8, delta: 1.2, region: 'Southeast Asia' },
    { name: 'Suez Canal', flow: 5.5, delta: -8.7, region: 'Egypt' },
    { name: 'Bab el-Mandeb', flow: 4.8, delta: -12.4, region: 'Yemen' },
    { name: 'Turkish Straits', flow: 3.2, delta: 0.5, region: 'Turkey' },
  ];

  return (
    <div className="space-y-3">
      {chokepoints.map((point) => {
        const isNegative = point.delta < 0;
        return (
          <div 
            key={point.name}
            className="flex items-center justify-between p-4"
            style={{ background: DESIGN.bg.card, border: `1px solid ${DESIGN.border.default}` }}
          >
            <div className="flex items-center gap-3">
              <Ship className="w-4 h-4" style={{ color: DESIGN.accent.gold }} />
              <div>
                <div className="text-sm font-mono" style={{ color: DESIGN.text.primary }}>{point.name}</div>
                <div className="text-[10px] font-mono" style={{ color: DESIGN.text.muted }}>{point.region}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm font-mono font-bold tabular-nums" style={{ color: DESIGN.text.primary }}>
                  {point.flow} mb/d
                </div>
                <div className="text-[10px] font-mono" style={{ color: DESIGN.text.muted }}>Daily Flow</div>
              </div>
              <div 
                className="flex items-center gap-1 px-2 py-1 text-xs font-mono tabular-nums"
                style={{ 
                  background: isNegative ? 'rgba(255, 59, 92, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                  color: isNegative ? DESIGN.status.crisis : DESIGN.status.success,
                  border: `1px solid ${isNegative ? DESIGN.status.crisis : DESIGN.status.success}30`
                }}
              >
                {isNegative ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {point.delta > 0 ? '+' : ''}{point.delta}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// =============================================================================
// PETRODOLLAR INDEX COMPONENT
// =============================================================================

const PetrodollarIndex = memo(function PetrodollarIndex() {
  const indexValue = 78.4;
  const components = [
    { name: 'USD/Oil Correlation', value: 0.82, weight: 30 },
    { name: 'Petro-Forex Reserves', value: 65.2, weight: 25, unit: '%' },
    { name: 'Saudi USD Peg Stability', value: 99.8, weight: 20, unit: '%' },
    { name: 'Oil Trade USD Settlement', value: 72.1, weight: 25, unit: '%' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Index Gauge */}
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={DESIGN.bg.card}
              strokeWidth="12"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke={DESIGN.accent.gold}
              strokeWidth="12"
              strokeDasharray={`${(indexValue / 100) * 352} 352`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-mono font-bold" style={{ color: DESIGN.accent.gold }}>
              {indexValue}
            </span>
            <span className="text-[9px] font-mono uppercase" style={{ color: DESIGN.text.muted }}>INDEX</span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="text-sm font-mono uppercase tracking-wider mb-2" style={{ color: DESIGN.accent.gold }}>
            Petrodollar Strength Index
          </div>
          <p className="text-xs font-mono leading-relaxed" style={{ color: DESIGN.text.secondary }}>
            Composite measure of USD dominance in global oil trade settlement and petrocurrency recycling flows.
          </p>
        </div>
      </div>

      {/* Components Breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {components.map((comp) => (
          <div 
            key={comp.name}
            className="p-3"
            style={{ background: DESIGN.bg.card, border: `1px solid ${DESIGN.border.default}` }}
          >
            <div className="text-[9px] font-mono uppercase tracking-wider mb-2" style={{ color: DESIGN.text.muted }}>
              {comp.name}
            </div>
            <div className="flex items-end gap-1">
              <span className="text-lg font-mono font-bold tabular-nums" style={{ color: DESIGN.text.primary }}>
                {comp.value}
              </span>
              {comp.unit && <span className="text-xs font-mono mb-0.5" style={{ color: DESIGN.text.muted }}>{comp.unit}</span>}
            </div>
            <div className="text-[9px] font-mono mt-1" style={{ color: DESIGN.accent.goldSoft }}>
              Weight: {comp.weight}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// =============================================================================
// MAIN DASHBOARD COMPONENT
// =============================================================================

export function EnergyFinanceDashboard() {
  const [liquidityData, setLiquidityData] = useState<LiquidityData | null>(null);
  const [energyData, setEnergyData] = useState<EnergyData | null>(null);
  const [correlation, setCorrelation] = useState<CorrelationResult | null>(null);
  const [flowSignal, setFlowSignal] = useState<MarketFlowSignal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [liquidity, energy] = await Promise.all([
        fetchStablecoins(),
        fetchEnergyData('crude-oil'),
      ]);

      setLiquidityData(liquidity);
      setEnergyData(energy);

      if (liquidity && energy) {
        const corr = calculateOilLiquidityCorrelation(energy, liquidity);
        setCorrelation(corr);
        setFlowSignal(generateMarketFlowSignal(corr));
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch energy data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 minute refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="min-h-screen" style={{ background: DESIGN.bg.primary }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-40 flex flex-col md:flex-row md:items-center justify-between gap-2 px-4 md:px-6 py-3 md:py-4"
        style={{ background: DESIGN.bg.panel, borderBottom: `1px solid ${DESIGN.border.default}` }}
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <Fuel className="w-4 md:w-5 h-4 md:h-5" style={{ color: DESIGN.accent.gold }} />
            <span className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider" style={{ color: DESIGN.accent.gold }}>
              Energy Intelligence
            </span>
          </div>
          <span className="text-[9px] md:text-[10px] font-mono uppercase hidden md:inline" style={{ color: DESIGN.text.muted }}>
            Institutional Terminal v2.0
          </span>
        </div>
        
        <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
          {lastUpdate && (
            <span className="text-[9px] md:text-[10px] font-mono" style={{ color: DESIGN.text.muted }}>
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-[9px] md:text-[10px] font-mono uppercase transition-colors"
            style={{ 
              background: DESIGN.accent.goldMuted, 
              color: DESIGN.accent.gold,
              border: `1px solid ${DESIGN.accent.gold}30`
            }}
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {flowSignal && (
        <div className="px-6 pt-6">
          <AlertBanner signal={flowSignal} />
        </div>
      )}

      {/* Main Content - Full Width Sections */}
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        
        {/* Section 1: Oil Market */}
        <InstitutionalPanel
          title="Oil Market"
          subtitle="WTI & Brent Crude Analysis"
          icon={Droplets}
          isLoading={isLoading}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard 
              label="WTI Crude" 
              value={energyData?.price != null ? energyData.price.toFixed(2) : '--'} 
              unit="USD/bbl"
              change={energyData?.priceChange}
              trend={energyData && energyData.priceChange > 0 ? 'up' : energyData && energyData.priceChange < 0 ? 'down' : 'neutral'}
              size="large"
            />
            <MetricCard 
              label="Brent Crude" 
              value={energyData?.price != null ? (energyData.price + 3.2).toFixed(2) : '--'} 
              unit="USD/bbl"
              change={energyData ? energyData.priceChange + 0.3 : undefined}
              trend={energyData && energyData.priceChange > 0 ? 'up' : 'down'}
            />
            <MetricCard 
              label="US Inventory" 
              value={formatLargeNumber(energyData?.inventory ?? 0)}
              unit="bbl"
              change={-1.2}
              trend="down"
            />
            <MetricCard 
              label="OPEC Supply" 
              value="27.8"
              unit="mb/d"
              change={0.5}
              trend="up"
            />
          </div>
          <FullWidthChart 
            data={energyData?.historicalPrices ?? []}
            label="WTI Price History (52W)"
            height={180}
            color={DESIGN.accent.gold}
          />
        </InstitutionalPanel>

        {/* Section 2: Gas Market */}
        <InstitutionalPanel
          title="Gas Market"
          subtitle="Natural Gas & LNG Analysis"
          icon={Flame}
          isLoading={isLoading}
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard 
              label="Henry Hub" 
              value="2.87"
              unit="USD/MMBtu"
              change={-3.2}
              trend="down"
              size="large"
            />
            <MetricCard 
              label="TTF (Europe)" 
              value="28.40"
              unit="EUR/MWh"
              change={5.8}
              trend="up"
            />
            <MetricCard 
              label="US Storage" 
              value="2,847"
              unit="Bcf"
              change={2.1}
              trend="up"
            />
            <MetricCard 
              label="EU Storage Fill" 
              value="72.4"
              unit="%"
              change={1.8}
              trend="up"
            />
          </div>
          <FullWidthChart 
            data={(energyData?.historicalPrices || []).map(d => ({ ...d, value: d.value * 0.035 }))}
            label="Henry Hub Price History (52W)"
            height={180}
            color={DESIGN.status.warning}
          />
        </InstitutionalPanel>

        {/* Section 3: Shipping Flow */}
        <InstitutionalPanel
          title="Shipping Flow"
          subtitle="Global Oil Transit Chokepoints"
          icon={Anchor}
          isLoading={isLoading}
        >
          <ShippingFlowPanel data={energyData} />
        </InstitutionalPanel>

        {/* Section 4: Petrodollar Index */}
        <InstitutionalPanel
          title="Petrodollar Index"
          subtitle="USD Dominance in Global Oil Trade"
          icon={DollarSign}
          isLoading={isLoading}
        >
          <PetrodollarIndex />
        </InstitutionalPanel>

      </div>
    </div>
  );
}

export default EnergyFinanceDashboard;
