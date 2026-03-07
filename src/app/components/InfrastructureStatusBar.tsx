'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Activity, AlertCircle, WifiOff, Wifi } from 'lucide-react';

interface DataSourceStatus {
  id: string;
  name: string;
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE';
  latencyMs?: number;
  lastChecked: Date;
}

interface InfrastructureStatusBarProps {
  refreshInterval?: number;
}

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY as string | undefined;
const FMP_API_BASE = 'https://financialmodelingprep.com/api/v3';

async function probeSource(id: string): Promise<{ status: 'ONLINE' | 'DELAYED' | 'OFFLINE'; latencyMs: number }> {
  const start = Date.now();
  try {
    let url = '';
    switch (id) {
      case 'FMP':
        url = `${FMP_API_BASE}/quote/CLUSD?apikey=${FMP_API_KEY}`;
        break;
      case 'DefiLlama':
        url = 'https://stablecoins.llama.fi/stablecoins?includePrices=false';
        break;
      case 'EIA':
        url = 'https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=DEMO_KEY&length=1';
        break;
      case 'ACLED':
        // ACLED requires auth — probe base domain only
        url = 'https://acleddata.com/';
        break;
      case 'DBnomics':
        url = 'https://api.db.nomics.world/v22/providers?limit=1';
        break;
      default:
        return { status: 'OFFLINE', latencyMs: 0 };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal, mode: 'cors' });
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    const status = res.ok
      ? latencyMs > 3000 ? 'DELAYED' : 'ONLINE'
      : 'OFFLINE';
    return { status, latencyMs };
  } catch {
    return { status: 'OFFLINE', latencyMs: Date.now() - start };
  }
}

const SOURCES: { id: string; name: string }[] = [
  { id: 'FMP', name: 'FMP' },
  { id: 'DefiLlama', name: 'DefiLlama' },
  { id: 'EIA', name: 'EIA' },
  { id: 'ACLED', name: 'ACLED' },
  { id: 'DBnomics', name: 'DBnomics' },
];

export function InfrastructureStatusBar({ refreshInterval = 5 * 60 * 1000 }: InfrastructureStatusBarProps) {
  const [sources, setSources] = useState<DataSourceStatus[]>(
    SOURCES.map(s => ({ ...s, status: 'ONLINE', lastChecked: new Date() }))
  );
  const [checking, setChecking] = useState(false);

  const checkAll = useCallback(async () => {
    setChecking(true);
    const results = await Promise.allSettled(SOURCES.map(s => probeSource(s.id)));
    setSources(SOURCES.map((s, i) => {
      const r = results[i];
      const resolved = r.status === 'fulfilled' ? r.value : { status: 'OFFLINE' as const, latencyMs: 0 };
      return { ...s, status: resolved.status, latencyMs: resolved.latencyMs, lastChecked: new Date() };
    }));
    setChecking(false);
  }, []);

  useEffect(() => {
    checkAll();
    const iv = setInterval(checkAll, refreshInterval);
    return () => clearInterval(iv);
  }, [checkAll, refreshInterval]);

  const offlineCount = sources.filter(s => s.status === 'OFFLINE').length;
  const delayedCount = sources.filter(s => s.status === 'DELAYED').length;
  const systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' =
    offlineCount >= 2 ? 'CRITICAL'
    : offlineCount > 0 || delayedCount >= 2 ? 'DEGRADED'
    : 'HEALTHY';

  const healthColor =
    systemHealth === 'HEALTHY' ? '#2ecc71'
    : systemHealth === 'DEGRADED' ? '#ffb020'
    : '#ff3b5c';

  const statusColor = (s: 'ONLINE' | 'DELAYED' | 'OFFLINE') =>
    s === 'ONLINE' ? '#2ecc71' : s === 'DELAYED' ? '#ffb020' : '#ff3b5c';

  const StatusIcon = ({ s }: { s: 'ONLINE' | 'DELAYED' | 'OFFLINE' }) =>
    s === 'ONLINE' ? <Activity className="w-3 h-3" />
    : s === 'DELAYED' ? <AlertCircle className="w-3 h-3" />
    : <WifiOff className="w-3 h-3" />;

  return (
    <div
      className="w-full border-b px-4 py-2"
      style={{ background: '#09090b', borderColor: 'rgba(212,175,55,0.08)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* System Health */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Wifi className="w-3.5 h-3.5" style={{ color: healthColor }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: healthColor }}>
            {systemHealth}
          </span>
          {checking && (
            <span className="text-[10px]" style={{ color: '#a1a1aa' }}>checking…</span>
          )}
        </div>

        <span className="text-[#d4af37]/20 hidden sm:block">|</span>

        {/* Per-source badges */}
        <div className="flex flex-wrap items-center gap-2">
          {sources.map(ds => (
            <div
              key={ds.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
              style={{
                border: `1px solid ${statusColor(ds.status)}35`,
                background: `${statusColor(ds.status)}0d`,
                color: statusColor(ds.status),
              }}
              title={`${ds.name}: ${ds.status}${ds.latencyMs ? ` (${ds.latencyMs}ms)` : ''} — checked ${ds.lastChecked.toLocaleTimeString()}`}
            >
              <StatusIcon s={ds.status} />
              <span>{ds.name}</span>
              <span style={{ opacity: 0.6 }}>{ds.status}</span>
              {ds.latencyMs !== undefined && ds.latencyMs > 0 && (
                <span style={{ opacity: 0.45 }}>{ds.latencyMs}ms</span>
              )}
            </div>
          ))}
        </div>

        {/* Refresh interval note */}
        <span className="ml-auto text-[10px] shrink-0 hidden md:block" style={{ color: '#a1a1aa' }}>
          Auto-refresh: 5 min
        </span>
      </div>
    </div>
  );
}

export default InfrastructureStatusBar;


interface DataSourceStatus {
  name: string;
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE';
  lastUpdate?: Date;
}

interface InfrastructureStatusBarProps {
  refreshInterval?: number; // ms
}

export function InfrastructureStatusBar({ refreshInterval = 30000 }: InfrastructureStatusBarProps) {
  const [dataSources, setDataSources] = useState<DataSourceStatus[]>([
    { name: 'FRED', status: 'ONLINE', lastUpdate: new Date() },
    { name: 'CoinGecko', status: 'ONLINE', lastUpdate: new Date() },
    { name: 'ACLED', status: 'ONLINE', lastUpdate: new Date() },
    { name: 'DBnomics', status: 'DELAYED', lastUpdate: new Date(Date.now() - 60000) },
    { name: 'EIA', status: 'ONLINE', lastUpdate: new Date() },
  ]);

  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');

  useEffect(() => {
    const offlineCount = dataSources.filter(ds => ds.status === 'OFFLINE').length;
    const delayedCount = dataSources.filter(ds => ds.status === 'DELAYED').length;

    if (offlineCount >= 3) {
      setSystemHealth('critical');
    } else if (offlineCount > 0 || delayedCount >= 2) {
      setSystemHealth('degraded');
    } else {
      setSystemHealth('healthy');
    }
  }, [dataSources]);

  useEffect(() => {
    // Simulate periodic health checks
    const interval = setInterval(() => {
      setDataSources(prev =>
        prev.map(ds => ({
          ...ds,
          lastUpdate: new Date(),
        }))
      );
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const getStatusColor = (status: 'ONLINE' | 'DELAYED' | 'OFFLINE') => {
    switch (status) {
      case 'ONLINE':
        return '#2ecc71';
      case 'DELAYED':
        return '#ffb020';
      case 'OFFLINE':
        return '#ff3b5c';
    }
  };

  const getStatusIcon = (status: 'ONLINE' | 'DELAYED' | 'OFFLINE') => {
    switch (status) {
      case 'ONLINE':
        return <Activity className="w-3 h-3" />;
      case 'DELAYED':
        return <AlertCircle className="w-3 h-3" />;
      case 'OFFLINE':
        return <WifiOff className="w-3 h-3" />;
    }
  };

  return (
    <div className="w-full bg-[#0b0b0f] border-b border-[#d4af37]/10 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* System Health Badge */}
        <div className="flex items-center gap-2">
          <Wifi
            className="w-4 h-4"
            style={{
              color:
                systemHealth === 'healthy'
                  ? '#2ecc71'
                  : systemHealth === 'degraded'
                    ? '#ffb020'
                    : '#ff3b5c',
            }}
          />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#d4af37' }}>
            {systemHealth === 'healthy' ? 'All Systems' : 'Systems'} {systemHealth.toUpperCase()}
          </span>
        </div>

        {/* Data Source Status Indicators */}
        <div className="flex items-center gap-3 overflow-x-auto">
          {dataSources.map(ds => (
            <div
              key={ds.name}
              className="flex items-center gap-1 px-2 py-1 rounded border text-xs font-mono"
              style={{
                borderColor: `${getStatusColor(ds.status)}40`,
                backgroundColor: `${getStatusColor(ds.status)}10`,
                color: getStatusColor(ds.status),
              }}
              title={`${ds.name}: ${ds.status}${ds.lastUpdate ? ` (${ds.lastUpdate.toLocaleTimeString()})` : ''}`}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: getStatusColor(ds.status) }}
              />
              <span>{ds.name}</span>
              <span className="opacity-60">{ds.status}</span>
            </div>
          ))}
        </div>

        {/* Last Refresh Time */}
        <div className="text-xs" style={{ color: '#a1a1aa' }}>
          Refresh: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

export default InfrastructureStatusBar;
