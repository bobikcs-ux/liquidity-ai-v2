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
      {/* Header: Terminal Title */}
      <div className="flex items-center justify-between border-b" style={{ borderColor: 'rgba(101, 162, 158, 0.3)', paddingBottom: '12px' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: currentStatusColor }}
            />
            <span className="text-sm font-mono font-bold tracking-widest" style={{ color: '#66fcf1' }}>
              INTELLIGENCE TERMINAL
            </span>
            <span className="text-[11px] font-mono tracking-widest px-2 py-1 rounded" 
              style={{ background: 'rgba(101, 162, 158, 0.15)', color: '#45a29e' }}>
              LIVE MARKET SNAPSHOTS
            </span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 rounded hover:opacity-70 transition-opacity disabled:opacity-50"
          style={{ color: '#66fcf1' }}
          title="Refresh market data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main metrics in terminal style */}
      <div className="space-y-3 p-4 rounded-lg" style={{ background: 'rgba(11, 12, 16, 0.5)', border: '1px solid rgba(101, 162, 158, 0.2)' }}>
        {/* Yield Spread Row */}
        <div className="flex justify-between items-center text-sm font-mono">
          <span style={{ color: '#45a29e' }}>Region:</span>
          <span style={{ color: '#f1c40f' }}>{latest?.region || 'GLOBAL'}</span>
        </div>

        {/* DGS10 & DGS2 Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>DGS10:</span>
            <span style={{ color: '#f1c40f' }}>{latest?.dgs10?.toFixed(2) || '--'}%</span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>DGS2:</span>
            <span style={{ color: '#f1c40f' }}>{latest?.dgs2?.toFixed(2) || '--'}%</span>
          </div>
        </div>

        {/* Yield Spread & VIX */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>Yield Spread:</span>
            <span style={{ color: '#f1c40f' }}>{formatted.yieldCurve}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>VIX:</span>
            <span style={{ color: '#f1c40f' }}>{latest?.vix?.toFixed(2) || '--'}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(101, 162, 158, 0.2)', margin: '12px 0' }} />

        {/* BTC Price & Dominance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>BTC Price:</span>
            <span style={{ color: '#f1c40f' }}>${latest?.btc_price?.toLocaleString() || '--'}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>BTC Dominance:</span>
            <span style={{ color: '#f1c40f' }}>{latest?.btc_dominance?.toFixed(1) || '--'}%</span>
          </div>
        </div>

        {/* Volatility & Fear/Greed */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>Volatility:</span>
            <span style={{ color: '#f1c40f' }}>{latest?.btc_volatility?.toFixed(3) || '--'}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>Fear/Greed:</span>
            <span style={{ color: '#f1c40f' }}>{latest?.fear_greed || '--'}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(101, 162, 158, 0.2)', margin: '12px 0' }} />

        {/* Systemic Risk Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>Systemic Risk:</span>
            <span style={{ color: getStatusColor(latest?.systemic_risk) }}>
              {formatted.systemicRisk}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>Regime:</span>
            <span style={{ color: getRegimeColor(latest?.regime) }}>
              {latest?.regime?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
        </div>

        {/* Survival Probability & VaR */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>Survival Prob:</span>
            <span style={{ color: '#22c55e' }}>
              {formatted.survivalProbability}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm font-mono">
            <span style={{ color: '#45a29e' }}>VaR @ 95%:</span>
            <span style={{ color: '#f1c40f' }}>{formatted.var95}</span>
          </div>
        </div>

        {/* Rate Shock */}
        <div className="flex justify-between items-center text-sm font-mono">
          <span style={{ color: '#45a29e' }}>Rate Shock:</span>
          <span style={{ color: '#f1c40f' }}>
            {latest?.rate_shock !== null ? `${(latest.rate_shock * 100).toFixed(1)}%` : 'N/A'}
          </span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(101, 162, 158, 0.2)', margin: '12px 0' }} />

        {/* Footer: Timestamp & Data Quality */}
        <div className="flex justify-between items-center text-xs font-mono">
          <div style={{ color: '#8b8b8b' }}>
            Fetched At: <span style={{ color: '#f1c40f' }}>{lastUpdateTime}</span>
          </div>
          <div style={{ color: '#8b8b8b' }}>
            {dataStatus?.status === 'GREEN' && <span style={{ color: '#22c55e' }}>✓ LIVE</span>}
            {dataStatus?.status === 'YELLOW' && <span style={{ color: '#f59e0b' }}>⚠ STALE</span>}
            {dataStatus?.status === 'RED' && <span style={{ color: '#ef4444' }}>✗ OFFLINE</span>}
          </div>
        </div>
      </div>

      {/* Data quality indicator */}
      {dataStatus && (
        <div
          className="text-[11px] font-mono flex items-center gap-2 p-2 rounded"
          style={{ background: 'rgba(101, 162, 158, 0.08)', color: '#8b8b8b' }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStatusColor }} />
          {dataStatus.status === 'GREEN' && '24h snapshots: ' + (dataStatus.snapshots_24h || 0)}
          {dataStatus.status === 'YELLOW' && 'Stale data detected'}
          {dataStatus.status === 'RED' && 'Data offline'}
        </div>
      )}
    </div>
  );
}
