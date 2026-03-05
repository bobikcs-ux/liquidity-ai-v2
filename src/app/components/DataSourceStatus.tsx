'use client';

import React from 'react';
import { useDataStatus } from '../hooks/useMarketSnapshot';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

/**
 * DATA SOURCES STATUS INDICATOR
 * 
 * Green = last market snapshot < 15 minutes
 * Amber = 15–60 minutes  
 * Red = > 60 minutes
 */
export function DataSourceStatus() {
  const { status, loading } = useDataStatus();
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className={`text-xs font-mono ${isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'}`}>
          CHECKING...
        </span>
      </div>
    );
  }

  const statusConfig = {
    GREEN: {
      color: '#22c55e',
      label: 'LIVE',
      description: 'Data fresh (< 15 min)',
    },
    YELLOW: {
      color: '#f59e0b',
      label: 'STALE',
      description: 'Data aging (15-60 min)',
    },
    RED: {
      color: '#ef4444',
      label: 'OFFLINE',
      description: 'Data old (> 60 min)',
    },
  };

  const currentStatus = status?.status || 'RED';
  const config = statusConfig[currentStatus];

  // Format last update time
  const lastUpdate = status?.last_update 
    ? new Date(status.last_update).toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : 'Never';

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
      isDark ? 'bg-gray-900/50 border-gray-700' : 
      isHybrid ? 'bg-gray-800/50 border-gray-600' : 
      'bg-gray-50 border-gray-200'
    }`}>
      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <div 
          className="w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: config.color }}
        />
        <span 
          className="text-xs font-mono font-semibold tracking-wider"
          style={{ color: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* Divider */}
      <div className={`w-px h-4 ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-300'}`} />

      {/* Details */}
      <div className="flex flex-col">
        <span className={`text-[10px] font-mono uppercase tracking-wider ${
          isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'
        }`}>
          DATA SOURCES
        </span>
        <span className={`text-xs font-mono ${
          isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Last: {lastUpdate}
        </span>
      </div>
    </div>
  );
}

/**
 * Compact version for header/footer use
 */
export function DataSourceStatusCompact() {
  const { status, loading } = useDataStatus();
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  if (loading) {
    return (
      <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" title="Checking data source..." />
    );
  }

  const statusColors = {
    GREEN: '#22c55e',
    YELLOW: '#f59e0b',
    RED: '#ef4444',
  };

  const statusLabels = {
    GREEN: 'Data fresh (< 15 min)',
    YELLOW: 'Data aging (15-60 min)',
    RED: 'Data old (> 60 min)',
  };

  const currentStatus = status?.status || 'RED';

  return (
    <div 
      className="w-2.5 h-2.5 rounded-full animate-pulse cursor-help"
      style={{ backgroundColor: statusColors[currentStatus] }}
      title={`Data Source Status: ${statusLabels[currentStatus]}`}
    />
  );
}

export default DataSourceStatus;
