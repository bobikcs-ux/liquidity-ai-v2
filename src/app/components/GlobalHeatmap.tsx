'use client';

import React, { memo } from 'react';
import { Globe, Activity, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useGlobalRegions } from '../hooks/useGlobalRegions';
import { useMacroData } from '../hooks/useMacroData';
import { useSnapshotFirst } from '../hooks/useSnapshotFirst';
import { getRegionStatusColor, formatRegionMetric } from '../services/globalRegionService';

// Design tokens
const DESIGN = {
  bg: '#0a0a0f',
  panel: '#111116',
  border: 'rgba(163, 147, 123, 0.08)',
  gold: '#A3937B',
  success: '#2ecc71',
  warning: '#f39c12',
  danger: '#e74c3c',
  textPrimary: '#f5f5f5',
  textMuted: '#71717a',
};

interface RegionCardProps {
  name: string;
  flag: string;
  status: 'LIVE' | 'STALE' | 'OFFLINE';
  metrics: { label: string; value: string; trend?: 'up' | 'down' | 'flat' }[];
  lastSync?: Date;
}

const RegionCard = memo(function RegionCard({ name, flag, status, metrics, lastSync }: RegionCardProps) {
  const statusColor = getRegionStatusColor(status);
  
  return (
    <div 
      className="p-4 border transition-all hover:border-opacity-30"
      style={{ 
        background: DESIGN.panel, 
        borderColor: DESIGN.border,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flag}</span>
          <span className="font-bold text-sm" style={{ color: DESIGN.textPrimary }}>{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
          />
          <span className="text-xs font-mono" style={{ color: statusColor }}>{status}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center justify-between text-xs font-mono">
            <span style={{ color: DESIGN.textMuted }}>{m.label}</span>
            <div className="flex items-center gap-1">
              {m.trend === 'up' && <TrendingUp className="w-3 h-3" style={{ color: DESIGN.success }} />}
              {m.trend === 'down' && <TrendingDown className="w-3 h-3" style={{ color: DESIGN.danger }} />}
              <span style={{ color: DESIGN.textPrimary }}>{m.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {lastSync && (
        <div className="mt-3 pt-2 text-xs font-mono" style={{ borderTop: `1px solid ${DESIGN.border}`, color: DESIGN.textMuted }}>
          Sync: {lastSync.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
});

export const GlobalHeatmap = memo(function GlobalHeatmap() {
  const { data, isLoading, refresh, regionStatuses } = useGlobalRegions();
  const { values: macroValues, metricStatus } = useMacroData();
  const { data: snapshot, latencyMs } = useSnapshotFirst();

  // Derive status from snapshot (uses 20-min STALE threshold from snapshotFirstService)
  const deriveStatus = (snapshotStatus?: 'LIVE' | 'STALE' | 'SEED', fallbackStatus?: string): 'LIVE' | 'STALE' | 'OFFLINE' => {
    if (snapshotStatus === 'LIVE') return 'LIVE';
    if (snapshotStatus === 'STALE') return 'STALE';
    if (fallbackStatus === 'LIVE') return 'LIVE';
    if (fallbackStatus === 'CACHED') return 'STALE';
    return 'OFFLINE';
  };

  const usStatus = deriveStatus(snapshot?.macro?.dgs10?.status, metricStatus?.dgs10);
  const euStatus = deriveStatus(snapshot?.macro?.ecbRate?.status, regionStatuses.eu);
  const asiaStatus = deriveStatus(snapshot?.macro?.bojRate?.status, regionStatuses.asia);
  const indiaStatus = deriveStatus(snapshot?.macro?.rbiRate?.status, regionStatuses.india);
  const bricsStatus = deriveStatus(snapshot?.macro?.deDollarizationIndex?.status, regionStatuses.brics);
  const ukStatus = deriveStatus(snapshot?.macro?.boeRate?.status, regionStatuses.uk);

  // Build region cards from data
  const regions: RegionCardProps[] = [
    {
      name: 'UNITED STATES',
      flag: '🇺🇸',
      status: usStatus,
      metrics: [
        { label: '10Y Yield', value: formatRegionMetric(macroValues?.dgs10, '%') },
        { label: '2Y Yield', value: formatRegionMetric(macroValues?.dgs2, '%') },
        { label: 'Spread', value: macroValues?.dgs10 && macroValues?.dgs2 ? `${(macroValues.dgs10 - macroValues.dgs2).toFixed(2)}%` : '--' },
        { label: 'M2 Supply', value: macroValues?.wm2ns ? `$${(macroValues.wm2ns / 1000).toFixed(1)}T` : '--' },
      ],
    },
    {
      name: 'EUROZONE',
      flag: '🇪🇺',
      status: euStatus,
      metrics: [
        { label: 'ECB Rate', value: formatRegionMetric(macroValues?.ecbRate ?? data?.eu?.metrics?.ecb_rate, '%') },
        { label: 'GDP Growth', value: formatRegionMetric(data?.eu?.metrics?.gdp_growth, '%') },
        { label: 'Inflation', value: formatRegionMetric(data?.eu?.metrics?.inflation_rate, '%') },
        { label: 'PMI', value: formatRegionMetric(data?.eu?.metrics?.pmi_composite) },
      ],
      lastSync: data?.eu?.lastSync,
    },
    {
      name: 'ASIA-PACIFIC',
      flag: '🌏',
      status: asiaStatus,
      metrics: [
        { label: 'BoJ Rate', value: formatRegionMetric(macroValues?.bojRate ?? data?.asia?.metrics?.boj_rate, '%') },
        { label: 'JPY 10Y', value: formatRegionMetric(data?.asia?.metrics?.jpy_10y_yield, '%') },
        { label: 'RBA Rate', value: formatRegionMetric(data?.asia?.metrics?.rba_rate, '%') },
        { label: 'Nikkei', value: formatRegionMetric(data?.asia?.metrics?.nikkei_change, '%'), trend: (data?.asia?.metrics?.nikkei_change ?? 0) > 0 ? 'up' : 'down' },
      ],
      lastSync: data?.asia?.lastSync,
    },
    {
      name: 'INDIA',
      flag: '🇮🇳',
      status: indiaStatus,
      metrics: [
        { label: 'RBI Rate', value: formatRegionMetric(data?.india?.metrics?.rbi_rate, '%') },
        { label: 'GDP Growth', value: formatRegionMetric(data?.india?.metrics?.gdp_growth, '%') },
        { label: 'CPI', value: formatRegionMetric(data?.india?.metrics?.inflation_cpi, '%') },
        { label: 'USD/INR', value: formatRegionMetric(data?.india?.metrics?.rupee_usd) },
      ],
      lastSync: data?.india?.lastSync,
    },
    {
      name: 'BRICS+',
      flag: '🌍',
      status: bricsStatus,
      metrics: [
        { label: 'Trade Index', value: formatRegionMetric(data?.brics?.metrics?.trade_flow_index) },
        { label: 'De-Dollar', value: formatRegionMetric(data?.brics?.metrics?.dedollarization_index) },
        { label: 'Gold Δ', value: formatRegionMetric(data?.brics?.metrics?.gold_reserves_change, '%') },
        { label: 'Yuan Share', value: formatRegionMetric(data?.brics?.metrics?.yuan_trade_share, '%') },
      ],
      lastSync: data?.brics?.lastSync,
    },
    {
      name: 'UNITED KINGDOM',
      flag: '🇬🇧',
      status: ukStatus,
      metrics: [
        { label: 'BoE Rate', value: formatRegionMetric(data?.uk?.metrics?.boe_rate, '%') },
        { label: 'Inflation', value: formatRegionMetric(data?.uk?.metrics?.inflation_rate, '%') },
        { label: 'Gilt 10Y', value: formatRegionMetric(data?.uk?.metrics?.gilt_10y_yield, '%') },
        { label: 'FTSE', value: formatRegionMetric(data?.uk?.metrics?.ftse_change, '%'), trend: (data?.uk?.metrics?.ftse_change ?? 0) > 0 ? 'up' : 'down' },
      ],
      lastSync: data?.uk?.lastSync,
    },
  ];

  // Count live regions
  const liveCount = regions.filter(r => r.status === 'LIVE').length;
  const totalCount = regions.length;

  return (
    <div className="border" style={{ background: DESIGN.bg, borderColor: DESIGN.border }}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${DESIGN.border}` }}
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5" style={{ color: DESIGN.gold }} />
          <div>
            <h2 className="font-bold text-sm" style={{ color: DESIGN.textPrimary }}>GLOBAL MACRO HEATMAP</h2>
            <p className="text-xs font-mono" style={{ color: DESIGN.textMuted }}>
              {liveCount}/{totalCount} Regions Live • FRED / Supabase Sync
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-2 transition-colors hover:bg-white/5 disabled:opacity-50"
          title="Refresh all regions"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} style={{ color: DESIGN.gold }} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px" style={{ background: DESIGN.border }}>
        {regions.map((region) => (
          <RegionCard key={region.name} {...region} />
        ))}
      </div>

      {/* Footer Status Bar — Split latency display */}
      <div 
        className="flex items-center justify-between px-4 py-2 text-xs font-mono"
        style={{ borderTop: `1px solid ${DESIGN.border}`, color: DESIGN.textMuted }}
      >
        <div className="flex items-center gap-4">
          <span>Status: <span style={{ color: snapshot?.macro?.status === 'LIVE' ? DESIGN.success : snapshot?.macro?.status === 'STALE' ? DESIGN.warning : DESIGN.danger }}>{snapshot?.macro?.status ?? data?.overallStatus ?? 'LOADING'}</span></span>
          <span>F&G: <span style={{ color: DESIGN.textPrimary }}>{snapshot?.macro?.fearGreed?.value ?? macroValues?.fearGreed ?? '--'}</span></span>
          {/* Local Read = Supabase query latency (should be <100ms) */}
          <span title="Local DB Read (Supabase)">
            Local: <span style={{ color: latencyMs && latencyMs < 100 ? DESIGN.success : latencyMs && latencyMs < 300 ? DESIGN.warning : DESIGN.danger }}>{latencyMs ? `${latencyMs}ms` : '--'}</span>
          </span>
          {/* Cloud Sync = background worker status (separate from UI) */}
          <span title="Background sync to external APIs (FRED, EIA, FMP)" style={{ opacity: 0.7 }}>
            Cloud: <span style={{ color: DESIGN.success }}>async</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {latencyMs && latencyMs < 100 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ background: DESIGN.success + '20', color: DESIGN.success }}>FAST</span>
          )}
          <span>Sync: {snapshot?.fetchedAt?.toLocaleTimeString() ?? data?.lastSync?.toLocaleTimeString() ?? '--:--'}</span>
        </div>
      </div>
    </div>
  );
});

export default GlobalHeatmap;
