'use client';

/**
 * Data Source Status Bar
 * Shows real-time status of all data providers
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import { Database, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

// Design tokens - Sovereign Tint palette
const DESIGN = {
  bg: {
    primary: '#0b0b0f',
    panel: '#121218',
  },
  accent: {
    gold: '#A3937B',
    goldMuted: 'rgba(163, 147, 123, 0.10)',
  },
  status: {
    online: '#2ecc71',
    delayed: '#B8A892',
    offline: '#ff3b5c',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#a0a0a0',
    muted: '#6b6b6b',
  },
  border: {
    default: 'rgba(163, 147, 123, 0.06)',
  },
};

type DataSourceStatus = 'ONLINE' | 'DELAYED' | 'OFFLINE';

interface DataSource {
  id: string;
  name: string;
  shortName: string;
  status: DataSourceStatus;
  lastUpdate: Date | null;
  latencyMs: number | null;
}

// Simulated data source health checks
const checkDataSourceHealth = async (sourceId: string): Promise<{
  status: DataSourceStatus;
  latencyMs: number | null;
}> => {
  // In production, these would be actual health check endpoints
  const healthEndpoints: Record<string, string> = {
    fred: 'https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=demo',
    coingecko: 'https://api.coingecko.com/api/v3/ping',
    acled: 'https://api.acleddata.com/health',
    dbnomics: 'https://api.db.nomics.world/v22/series',
    eia: 'https://api.eia.gov/ping',
  };

  try {
    const start = Date.now();
    // Simulated response for demo - in production, actually fetch
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    const latency = Date.now() - start;
    
    // Simulate occasional delays/failures
    const rand = Math.random();
    if (rand < 0.85) {
      return { status: 'ONLINE', latencyMs: latency };
    } else if (rand < 0.95) {
      return { status: 'DELAYED', latencyMs: latency + 2000 };
    } else {
      return { status: 'OFFLINE', latencyMs: null };
    }
  } catch {
    return { status: 'OFFLINE', latencyMs: null };
  }
};

const StatusDot = memo(function StatusDot({ status }: { status: DataSourceStatus }) {
  const colors = {
    ONLINE: DESIGN.status.online,
    DELAYED: DESIGN.status.delayed,
    OFFLINE: DESIGN.status.offline,
  };

  return (
    <div 
      className={`w-1.5 h-1.5 rounded-full ${status === 'DELAYED' ? 'animate-pulse' : ''}`}
      style={{ 
        backgroundColor: colors[status],
        boxShadow: status === 'ONLINE' ? `0 0 6px ${colors[status]}` : undefined
      }}
    />
  );
});

const DataSourceItem = memo(function DataSourceItem({ 
  source,
  compact = false,
}: { 
  source: DataSource;
  compact?: boolean;
}) {
  const statusColors = {
    ONLINE: DESIGN.status.online,
    DELAYED: DESIGN.status.delayed,
    OFFLINE: DESIGN.status.offline,
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <StatusDot status={source.status} />
        <span 
          className="text-[9px] font-mono uppercase tracking-wider"
          style={{ color: statusColors[source.status] }}
        >
          {source.shortName}
        </span>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-3 px-3 py-2"
      style={{ 
        background: DESIGN.bg.panel,
        border: `1px solid ${DESIGN.border.default}`
      }}
    >
      <StatusDot status={source.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span 
            className="text-[10px] font-mono font-semibold uppercase"
            style={{ color: DESIGN.text.primary }}
          >
            {source.shortName}
          </span>
          <span 
            className="text-[8px] font-mono px-1.5 py-0.5"
            style={{ 
              background: `${statusColors[source.status]}15`,
              color: statusColors[source.status],
              border: `1px solid ${statusColors[source.status]}30`
            }}
          >
            {source.status}
          </span>
        </div>
        {source.latencyMs !== null && source.status !== 'OFFLINE' && (
          <div className="text-[8px] font-mono" style={{ color: DESIGN.text.muted }}>
            {source.latencyMs}ms
          </div>
        )}
      </div>
    </div>
  );
});

export const DataSourceStatusBar = memo(function DataSourceStatusBar({
  variant = 'compact',
}: {
  variant?: 'compact' | 'expanded';
}) {
  const [sources, setSources] = useState<DataSource[]>([
    { id: 'fred', name: 'Federal Reserve Economic Data', shortName: 'FRED', status: 'ONLINE', lastUpdate: new Date(), latencyMs: 120 },
    { id: 'coingecko', name: 'CoinGecko', shortName: 'GECKO', status: 'ONLINE', lastUpdate: new Date(), latencyMs: 85 },
    { id: 'acled', name: 'Armed Conflict Location & Event Data', shortName: 'ACLED', status: 'ONLINE', lastUpdate: new Date(), latencyMs: 230 },
    { id: 'dbnomics', name: 'DBnomics', shortName: 'DBNOM', status: 'ONLINE', lastUpdate: new Date(), latencyMs: 180 },
    { id: 'eia', name: 'Energy Information Administration', shortName: 'EIA', status: 'ONLINE', lastUpdate: new Date(), latencyMs: 150 },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatuses = useCallback(async () => {
    setIsRefreshing(true);
    const updatedSources = await Promise.all(
      sources.map(async (source) => {
        const health = await checkDataSourceHealth(source.id);
        return {
          ...source,
          status: health.status,
          latencyMs: health.latencyMs,
          lastUpdate: health.status !== 'OFFLINE' ? new Date() : source.lastUpdate,
        };
      })
    );
    setSources(updatedSources);
    setIsRefreshing(false);
  }, [sources]);

  useEffect(() => {
    // Initial check
    refreshStatuses();
    // Check every 60 seconds
    const interval = setInterval(refreshStatuses, 60000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = sources.filter(s => s.status === 'ONLINE').length;
  const totalCount = sources.length;
  const allOnline = onlineCount === totalCount;

  if (variant === 'compact') {
    return (
      <div 
        className="flex flex-wrap items-center gap-2 md:gap-4 px-3 md:px-4 py-2 overflow-x-auto"
        style={{ 
          background: DESIGN.bg.primary,
          borderBottom: `1px solid ${DESIGN.border.default}`
        }}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          <Database className="w-3.5 h-3.5" style={{ color: DESIGN.accent.gold }} />
          <span className="text-[9px] font-mono uppercase tracking-wider hidden md:inline" style={{ color: DESIGN.text.muted }}>
            Data Sources
          </span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          {sources.map((source) => (
            <DataSourceItem key={source.id} source={source} compact />
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-3 flex-shrink-0">
          <span 
            className="text-[8px] md:text-[9px] font-mono whitespace-nowrap"
            style={{ color: allOnline ? DESIGN.status.online : DESIGN.status.delayed }}
          >
            {onlineCount}/{totalCount}
          </span>
          <button
            onClick={refreshStatuses}
            disabled={isRefreshing}
            className="p-1 transition-colors hover:opacity-80"
            style={{ color: DESIGN.accent.gold }}
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  // Expanded variant
  return (
    <div 
      className="p-4"
      style={{ background: DESIGN.bg.panel, border: `1px solid ${DESIGN.border.default}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: DESIGN.accent.gold }} />
          <span 
            className="text-xs font-mono font-semibold uppercase tracking-wider"
            style={{ color: DESIGN.accent.gold }}
          >
            Data Source Status
          </span>
        </div>
        <button
          onClick={refreshStatuses}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2 py-1 text-[9px] font-mono uppercase transition-colors"
          style={{ 
            background: DESIGN.accent.goldMuted,
            color: DESIGN.accent.gold,
            border: `1px solid ${DESIGN.accent.gold}30`
          }}
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {sources.map((source) => (
          <DataSourceItem key={source.id} source={source} />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[9px] font-mono" style={{ color: DESIGN.text.muted }}>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: DESIGN.status.online }} />
            ONLINE
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: DESIGN.status.delayed }} />
            DELAYED
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: DESIGN.status.offline }} />
            OFFLINE
          </div>
        </div>
        <span className="text-[9px] font-mono" style={{ color: DESIGN.text.muted }}>
          Last check: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
});

export default DataSourceStatusBar;
