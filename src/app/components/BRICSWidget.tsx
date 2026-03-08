'use client';

/**
 * BRICS Intelligence Widget
 * Sovereign Theme: Black background, gold accents, rounded-none
 * Displays BRICS Momentum and Geoeconomic Power Shift indicators
 */

import React, { memo, useMemo } from 'react';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ChevronRight,
  BarChart3,
  Scale,
} from 'lucide-react';
import { useBRICSIntelligence } from '../hooks/useBRICSIntelligence';
import type { BRICSCountryData } from '../types/brics';

// Country flag emojis (using ISO codes)
const COUNTRY_FLAGS: Record<string, string> = {
  BRA: '🇧🇷',
  RUS: '🇷🇺',
  IND: '🇮🇳',
  CHN: '🇨🇳',
  ZAF: '🇿🇦',
  USA: '🇺🇸',
};

// Format large numbers
function formatGDP(value: number | null): string {
  if (value === null) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  return `$${value.toLocaleString()}`;
}

// Format percentage
function formatPercent(value: number | null, showSign = true): string {
  if (value === null) return 'N/A';
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// Momentum Gauge Component
const MomentumGauge = memo(function MomentumGauge({
  momentum,
  usGrowth,
  delta,
}: {
  momentum: number;
  usGrowth: number;
  delta: number;
}) {
  // Color based on delta
  const deltaColor = delta > 0 ? 'text-[#B8A892]' : delta < 0 ? 'text-red-400' : 'text-gray-400';
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : ArrowRight;

  return (
    <div className="bg-black border border-[#A3937B]/30 rounded-none p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold tracking-widest text-[#B8A892] uppercase">
          BRICS Momentum
        </h3>
        <span className="text-xs font-mono text-gray-500">
          (BRA + RUS + IND) / 3
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* BRICS Momentum */}
        <div className="text-center">
          <div className="text-4xl font-black text-[#B8A892] tabular-nums">
            {formatPercent(momentum)}
          </div>
          <div className="text-xs text-gray-500 mt-1">BRICS Momentum</div>
        </div>

        {/* US Growth */}
        <div className="text-center">
          <div className="text-4xl font-black text-gray-400 tabular-nums">
            {formatPercent(usGrowth)}
          </div>
          <div className="text-xs text-gray-500 mt-1">US GDP Growth</div>
        </div>
      </div>

      {/* Delta Indicator */}
      <div className="mt-6 pt-4 border-t border-[#A3937B]/20">
        <div className="flex items-center justify-center gap-3">
          <DeltaIcon className={`w-5 h-5 ${deltaColor}`} />
          <span className={`text-2xl font-bold tabular-nums ${deltaColor}`}>
            {formatPercent(delta)}
          </span>
          <span className="text-xs text-gray-500">
            {delta > 0 ? 'BRICS LEADING' : delta < 0 ? 'US LEADING' : 'EQUILIBRIUM'}
          </span>
        </div>
      </div>
    </div>
  );
});

// Power Shift Gauge Component
const PowerShiftGauge = memo(function PowerShiftGauge({
  ratio,
  trend,
  velocity,
}: {
  ratio: number;
  trend: 'EAST_RISING' | 'WEST_HOLDING' | 'EQUILIBRIUM';
  velocity: number;
}) {
  const trendColor =
    trend === 'EAST_RISING'
      ? 'text-[#B8A892]'
      : trend === 'WEST_HOLDING'
      ? 'text-blue-400'
      : 'text-gray-400';

  const trendLabel =
    trend === 'EAST_RISING'
      ? 'POWER SHIFTING EAST'
      : trend === 'WEST_HOLDING'
      ? 'WEST MAINTAINING'
      : 'EQUILIBRIUM';

  return (
    <div className="bg-black border border-[#A3937B]/30 rounded-none p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold tracking-widest text-[#B8A892] uppercase">
          Geoeconomic Power Shift
        </h3>
        <span className="text-xs font-mono text-gray-500">BRICS / US GDP</span>
      </div>

      {/* Main Ratio Display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-black text-white tabular-nums">
          {ratio.toFixed(2)}x
        </div>
        <div className="text-xs text-gray-500 mt-2">
          BRICS GDP is {ratio.toFixed(2)}x US GDP
        </div>
      </div>

      {/* Visual Ratio Bar */}
      <div className="relative h-4 bg-gray-900 rounded-none overflow-hidden mb-4">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-600 to-[#B8A892] transition-all duration-500"
          style={{ width: `${Math.min(ratio / 2, 1) * 100}%` }}
        />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-500/30" />
      </div>

      {/* Trend Indicator */}
      <div className="flex items-center justify-between pt-4 border-t border-[#A3937B]/20">
        <div className={`flex items-center gap-2 ${trendColor}`}>
          <Globe className="w-4 h-4" />
          <span className="text-xs font-bold">{trendLabel}</span>
        </div>
        <div className="text-xs text-gray-500">
          Velocity: {formatPercent(velocity * 100)}/yr
        </div>
      </div>
    </div>
  );
});

// Country Breakdown Component
const CountryBreakdown = memo(function CountryBreakdown({
  countries,
  usGDP,
}: {
  countries: BRICSCountryData[];
  usGDP: number | null;
}) {
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => (b.gdpCurrentUSD ?? 0) - (a.gdpCurrentUSD ?? 0)),
    [countries]
  );

  const maxGDP = Math.max(...countries.map((c) => c.gdpCurrentUSD ?? 0), usGDP ?? 0);

  return (
    <div className="bg-black border border-[#A3937B]/30 rounded-none p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold tracking-widest text-[#B8A892] uppercase">
          BRICS Breakdown
        </h3>
        <BarChart3 className="w-4 h-4 text-[#B8A892]" />
      </div>

      <div className="space-y-3">
        {/* US Reference */}
        <div className="flex items-center gap-3">
          <span className="text-lg">{COUNTRY_FLAGS.USA}</span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-400">United States</span>
              <span className="text-xs font-mono text-gray-500">{formatGDP(usGDP)}</span>
            </div>
            <div className="h-2 bg-gray-900 rounded-none overflow-hidden">
              <div
                className="h-full bg-blue-500/50"
                style={{ width: `${((usGDP ?? 0) / maxGDP) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#A3937B]/10 my-2" />

        {/* BRICS Countries */}
        {sortedCountries.map((country) => (
          <div key={country.country} className="flex items-center gap-3">
            <span className="text-lg">{COUNTRY_FLAGS[country.country]}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white">{country.countryName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500">
                    {formatGDP(country.gdpCurrentUSD)}
                  </span>
                  <span
                    className={`text-xs font-mono ${
                      (country.gdpGrowth ?? 0) > 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {formatPercent(country.gdpGrowth)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-900 rounded-none overflow-hidden">
                <div
                  className="h-full bg-[#A3937B]"
                  style={{ width: `${((country.gdpCurrentUSD ?? 0) / maxGDP) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Historical Chart Component
const PowerShiftChart = memo(function PowerShiftChart({
  history,
}: {
  history: { year: string; ratio: number }[];
}) {
  const maxRatio = Math.max(...history.map((h) => h.ratio), 1.5);
  const minRatio = Math.min(...history.map((h) => h.ratio), 0.5);
  const range = maxRatio - minRatio;

  return (
    <div className="bg-black border border-[#A3937B]/30 rounded-none p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold tracking-widest text-[#B8A892] uppercase">
          Power Shift Timeline
        </h3>
        <span className="text-xs font-mono text-gray-500">BRICS/US Ratio</span>
      </div>

      {/* Simple line chart */}
      <div className="relative h-32">
        <svg className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#374151" strokeWidth="1" strokeDasharray="4" />
          
          {/* Data line */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            points={history
              .map((h, i) => {
                const x = (i / (history.length - 1)) * 100;
                const y = 100 - ((h.ratio - minRatio) / range) * 100;
                return `${x}%,${y}%`;
              })
              .join(' ')}
          />

          {/* Data points */}
          {history.map((h, i) => {
            const x = (i / (history.length - 1)) * 100;
            const y = 100 - ((h.ratio - minRatio) / range) * 100;
            return (
              <circle
                key={h.year}
                cx={`${x}%`}
                cy={`${y}%`}
                r="3"
                fill="#f59e0b"
              />
            );
          })}
        </svg>
      </div>

      {/* Year labels */}
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500">{history[0]?.year}</span>
        <span className="text-xs text-gray-500">{history[history.length - 1]?.year}</span>
      </div>
    </div>
  );
});

// Signals Panel Component
const SignalsPanel = memo(function SignalsPanel({
  signals,
}: {
  signals: { type: string; severity: string; title: string; description: string }[];
}) {
  if (signals.length === 0) return null;

  return (
    <div className="bg-black border border-red-500/50 rounded-none p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h3 className="text-xs font-bold tracking-widest text-red-400 uppercase">
          Active Signals
        </h3>
      </div>

      <div className="space-y-2">
        {signals.map((signal, i) => (
          <div
            key={i}
            className={`p-3 rounded-none border-l-2 ${
              signal.severity === 'CRITICAL'
                ? 'border-red-500 bg-red-500/10'
                : signal.severity === 'HIGH'
                ? 'border-[#A3937B] bg-[#A3937B]/10'
                : 'border-gray-500 bg-gray-500/10'
            }`}
          >
            <div className="text-xs font-bold text-white">{signal.title}</div>
            <div className="text-xs text-gray-400 mt-1">{signal.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Main Widget Component
export const BRICSWidget = memo(function BRICSWidget() {
  const { data, loading, error, selectedView, setSelectedView, refresh } = useBRICSIntelligence();

  if (loading && !data) {
    return (
      <div className="bg-black border border-[#A3937B]/30 rounded-none p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#B8A892] animate-spin" />
        <span className="ml-3 text-sm text-gray-400">Loading BRICS Intelligence...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-black border border-red-500/50 rounded-none p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <div className="text-sm text-red-400">{error}</div>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-400 text-xs font-bold rounded-none hover:bg-red-500/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-[#B8A892]" />
          <h2 className="text-sm font-black tracking-widest text-[#B8A892] uppercase">
            BRICS Intelligence Layer
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">
            Data: {data.aggregate.year}
          </span>
          <button
            onClick={refresh}
            className="p-1.5 hover:bg-[#A3937B]/10 rounded-none transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 text-[#B8A892] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1 p-1 bg-gray-900 rounded-none">
        {(['momentum', 'powershift', 'breakdown'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`flex-1 px-3 py-2 text-xs font-bold uppercase tracking-wide rounded-none transition-colors ${
              selectedView === view
                ? 'bg-[#A3937B] text-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {view === 'momentum' ? 'Momentum' : view === 'powershift' ? 'Power Shift' : 'Breakdown'}
          </button>
        ))}
      </div>

      {/* Signals */}
      {data.signals.length > 0 && <SignalsPanel signals={data.signals} />}

      {/* Content based on selected view */}
      {selectedView === 'momentum' && (
        <div className="space-y-4">
          <MomentumGauge
            momentum={data.momentum.momentum}
            usGrowth={data.momentum.usGrowth}
            delta={data.momentum.momentumDelta}
          />
          
          {/* Individual Growth Rates */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { code: 'BRA', growth: data.momentum.braGrowth },
              { code: 'RUS', growth: data.momentum.rusGrowth },
              { code: 'IND', growth: data.momentum.indGrowth },
            ].map((c) => (
              <div
                key={c.code}
                className="bg-black border border-[#A3937B]/20 rounded-none p-3 text-center"
              >
                <span className="text-lg">{COUNTRY_FLAGS[c.code]}</span>
                <div className={`text-lg font-bold tabular-nums ${c.growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(c.growth)}
                </div>
                <div className="text-xs text-gray-500">{c.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedView === 'powershift' && (
        <div className="space-y-4">
          <PowerShiftGauge
            ratio={data.powerShift.bricsToUSRatio}
            trend={data.powerShift.trend}
            velocity={data.powerShift.velocity}
          />
          <PowerShiftChart history={data.powerShift.history} />
        </div>
      )}

      {selectedView === 'breakdown' && (
        <CountryBreakdown
          countries={data.aggregate.countries}
          usGDP={data.usData.gdpCurrentUSD}
        />
      )}

      {/* Footer */}
      <div className="text-xs text-gray-600 text-center border-t border-[#A3937B]/10 pt-3">
        Source: World Bank API • Last updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
});

export default BRICSWidget;
