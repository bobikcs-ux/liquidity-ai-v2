'use client';

import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, Wifi, WifiOff } from 'lucide-react';

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
