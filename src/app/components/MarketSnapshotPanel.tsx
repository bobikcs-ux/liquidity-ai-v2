'use client';

import React from 'react';
import { AlertCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import {
  useMarketSnapshot,
  useFormattedMarketData,
  GLOBAL_FEAR_GREED_VALUE,
  GLOBAL_FEAR_GREED_LABEL,
} from '../hooks/useMarketSnapshot';

export function MarketSnapshotPanel() {
  const { latest, loading, error, dataStatus, refresh } = useMarketSnapshot();
  const formatted = useFormattedMarketData();

  const handleRefresh = async () => {
    await refresh();
  };

  if (loading && !latest) {
    return (
      <div className="rounded-lg border p-6 text-center" style={{ borderColor: 'rgba(163,147,123,0.2)', background: 'rgba(163,147,123,0.04)' }}>
        <div className="text-sm font-mono" style={{ color: '#A3937B' }}>
          Loading market snapshot...
        </div>
      </div>
    );
  }

  if (error && !latest) {
    return (
      <div className="rounded-lg border p-6" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
          <span className="text-sm font-mono font-bold" style={{ color: '#ef4444' }}>
            DATA UNAVAILABLE
          </span>
        </div>
        <p className="text-xs font-mono" style={{ color: '#8b8b8b' }}>
          {error}
        </p>
      </div>
    );
  }

  // Color indicators
  const getStatusColor = (value: number | null) => {
    if (value === null) return '#8b8b8b';
    if (value >= 0.6) return '#ef4444'; // Red = High risk
    if (value >= 0.3) return '#f59e0b'; // Amber = Medium risk
    return '#22c55e'; // Green = Low risk
  };

  const getRegimeColor = (regime: string | null) => {
    switch (regime) {
      case 'crisis':
        return '#ef4444';
      case 'stress':
        return '#f59e0b';
      case 'normal':
      default:
        return '#22c55e';
    }
  };

  const lastUpdateTime = latest?.created_at
    ? new Date(latest.created_at).toLocaleTimeString()
    : 'Never';

  const statusColorMap = {
    GREEN: '#22c55e',
    YELLOW: '#f59e0b',
    RED: '#ef4444',
  };

  const currentStatusColor = statusColorMap[dataStatus?.status || 'RED'];

  return (
    <div className="space-y-4">
      {/* Header with status and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: currentStatusColor }}
          />
          <span className="text-xs font-mono font-bold tracking-widest" style={{ color: '#A3937B' }}>
            MARKET SNAPSHOT
          </span>
          <span className="text-[10px] font-mono" style={{ color: '#8b8b8b' }}>
            {lastUpdateTime}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 rounded hover:opacity-70 transition-opacity disabled:opacity-50"
          style={{ color: '#A3937B' }}
          title="Refresh market data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {/* Yield Curve Spread */}
        <div
          className="rounded-lg p-3 border"
          style={{ borderColor: 'rgba(163,147,123,0.15)', background: 'rgba(163,147,123,0.04)' }}
        >
          <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#8b8b8b' }}>
            YIELD SPREAD
          </div>
          <div className="text-lg font-bold font-mono" style={{ color: '#A3937B' }}>
            {formatted.yieldCurve}
          </div>
          <div className="text-[9px] font-mono mt-1" style={{ color: '#8b8b8b' }}>
            {latest?.yield_spread !== null && latest?.yield_spread < 0 ? '📉 Inverted' : '📈 Steep'}
          </div>
        </div>

        {/* BTC Price */}
        <div
          className="rounded-lg p-3 border"
          style={{ borderColor: 'rgba(163,147,123,0.15)', background: 'rgba(163,147,123,0.04)' }}
        >
          <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#8b8b8b' }}>
            BTC PRICE
          </div>
          <div className="text-lg font-bold font-mono" style={{ color: '#A3937B' }}>
            {formatted.btcPrice}
          </div>
          <div className="text-[9px] font-mono mt-1" style={{ color: '#8b8b8b' }}>
            {latest?.btc_dominance?.toFixed(1)}% DOM
          </div>
        </div>

        {/* Survival Probability */}
        <div
          className="rounded-lg p-3 border"
          style={{
            borderColor: 'rgba(163,147,123,0.15)',
            background: 'rgba(163,147,123,0.04)',
          }}
        >
          <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#8b8b8b' }}>
            SURVIVAL PROB
          </div>
          <div className="text-lg font-bold font-mono" style={{ color: '#22c55e' }}>
            {formatted.survivalProbability}
          </div>
          <div className="text-[9px] font-mono mt-1" style={{ color: '#8b8b8b' }}>
            {latest?.survival_probability !== null && latest.survival_probability > 0.95
              ? '✅ Healthy'
              : '⚠️ Watch'}
          </div>
        </div>

        {/* Systemic Risk */}
        <div
          className="rounded-lg p-3 border"
          style={{
            borderColor: 'rgba(163,147,123,0.15)',
            background: 'rgba(163,147,123,0.04)',
          }}
        >
          <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#8b8b8b' }}>
            SYSTEMIC RISK
          </div>
          <div className="text-lg font-bold font-mono" style={{ color: getStatusColor(latest?.systemic_risk) }}>
            {formatted.systemicRisk}
          </div>
          <div className="text-[9px] font-mono mt-1" style={{ color: '#8b8b8b' }}>
            {latest?.regime ? latest.regime.toUpperCase() : 'UNKNOWN'}
          </div>
        </div>

        {/* VaR 95 */}
        <div
          className="rounded-lg p-3 border"
          style={{ borderColor: 'rgba(163,147,123,0.15)', background: 'rgba(163,147,123,0.04)' }}
        >
          <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#8b8b8b' }}>
            VAR @ 95%
          </div>
          <div className="text-lg font-bold font-mono" style={{ color: '#A3937B' }}>
            {formatted.var95}
          </div>
          <div className="text-[9px] font-mono mt-1" style={{ color: '#8b8b8b' }}>
            Drawdown risk
          </div>
        </div>

        {/* Fear & Greed */}
        <div
          className="rounded-lg p-3 border"
          style={{ borderColor: 'rgba(163,147,123,0.15)', background: 'rgba(163,147,123,0.04)' }}
        >
          <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#8b8b8b' }}>
            FEAR & GREED
          </div>
          <div className="text-lg font-bold font-mono" style={{ color: '#A3937B' }}>
            {GLOBAL_FEAR_GREED_VALUE}
          </div>
          <div className="text-[9px] font-mono mt-1" style={{ color: '#8b8b8b' }}>
            {GLOBAL_FEAR_GREED_LABEL}
          </div>
        </div>

        {/* Rate Shock */}
        <div
          className="rounded-lg p-3 border"
          style={{ borderColor: 'rgba(163,147,123,0.15)', background: 'rgba(163,147,123,0.04)' }}
        >
          <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: '#8b8b8b' }}>
            RATE SHOCK
          </div>
          <div className="text-lg font-bold font-mono" style={{ color: '#A3937B' }}>
            {latest?.rate_shock !== null ? `${(latest.rate_shock * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div className="text-[9px] font-mono mt-1" style={{ color: '#8b8b8b' }}>
            Fed risk
          </div>
        </div>
      </div>

      {/* Data quality indicator */}
      {dataStatus && (
        <div
          className="text-[10px] font-mono flex items-center gap-2"
          style={{ color: '#8b8b8b' }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStatusColor }} />
          {dataStatus.status === 'GREEN' && 'Fresh data (< 15 min)'}
          {dataStatus.status === 'YELLOW' && 'Data is stale (15-60 min)'}
          {dataStatus.status === 'RED' && 'Data offline (> 60 min)'}
          <span>• {dataStatus.snapshots_24h || 0} snapshots in 24h</span>
        </div>
      )}
    </div>
  );
}
