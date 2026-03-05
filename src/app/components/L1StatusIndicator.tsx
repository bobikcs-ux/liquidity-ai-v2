/**
 * L1 Status Indicator
 * 
 * Visual indicator for the L1 Data Nervous System
 * Shows connection status and individual feed health
 */

'use client';

import React from 'react';
import { Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useL1Data } from '../hooks/useL1Data';
import { getStatusColor, getFeedStatusIcon } from '../services/l1DataNervousSystem';

interface L1StatusIndicatorProps {
  compact?: boolean;
  showFeeds?: boolean;
  showHeartbeat?: boolean;
  className?: string;
}

export function L1StatusIndicator({ 
  compact = false, 
  showFeeds = true,
  showHeartbeat = true,
  className = '' 
}: L1StatusIndicatorProps) {
  const { status, feedStatus, lastUpdate, isLoading, refresh, forceRefresh, heartbeat } = useL1Data();

  const statusColor = getStatusColor(status);
  const isReconnecting = status === 'RECONNECTING' || status === 'DEGRADED';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-900/50 border border-gray-700`}>
          {isReconnecting ? (
            <RefreshCw className={`w-3 h-3 animate-spin ${statusColor}`} />
          ) : status === 'LIVE' ? (
            <Wifi className={`w-3 h-3 ${statusColor}`} />
          ) : (
            <WifiOff className={`w-3 h-3 ${statusColor}`} />
          )}
          <span className={`text-xs font-mono font-bold ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-700 bg-gray-900/50 p-3 ${className}`}>
      {/* Header with Heartbeat */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">
            L1 Nervous System
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Heartbeat Indicator */}
          {showHeartbeat && (
            <div className="flex items-center gap-1.5" title={heartbeat.alive ? `Latency: ${heartbeat.latencyMs}ms` : 'No heartbeat'}>
              <div className={`w-2 h-2 rounded-full ${
                heartbeat.alive 
                  ? 'bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]' 
                  : 'bg-red-500'
              }`} />
              <span className="text-xs font-mono text-gray-500">
                {heartbeat.alive ? `${heartbeat.latencyMs}ms` : 'OFFLINE'}
              </span>
            </div>
          )}
          {isReconnecting && (
            <RefreshCw className={`w-3 h-3 animate-spin ${statusColor}`} />
          )}
          <span className={`text-xs font-mono font-bold ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Feed Status Grid */}
      {showFeeds && feedStatus && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <FeedStatusItem 
            label="FRED" 
            status={feedStatus.fred} 
          />
          <FeedStatusItem 
            label="CoinGecko" 
            status={feedStatus.coingecko} 
          />
          <FeedStatusItem 
            label="Fear/Greed" 
            status={feedStatus.fearGreed} 
          />
          <FeedStatusItem 
            label="Supabase" 
            status={feedStatus.supabase} 
          />
        </div>
      )}

      {/* Last Update & Controls */}
      <div className="flex items-center justify-between text-xs gap-2">
        <span className="text-gray-500 font-mono">Last sync:</span>
        <span className="text-gray-400 font-mono tabular-nums flex-1">
          {lastUpdate 
            ? `${Math.round((Date.now() - lastUpdate.getTime()) / 1000)}s ago`
            : 'Never'
          }
        </span>
        <button 
          onClick={refresh}
          disabled={isLoading}
          className="p-1 rounded hover:bg-gray-700/50 transition-colors disabled:opacity-50"
          aria-label="Refresh L1 data"
          title="Soft refresh"
        >
          <RefreshCw className={`w-3 h-3 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button 
          onClick={forceRefresh}
          disabled={isLoading}
          className="px-2 py-1 rounded text-xs font-mono bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition-colors disabled:opacity-50"
          aria-label="Force refresh all data"
          title="Force refresh (clears all caches)"
        >
          FORCE
        </button>
      </div>
    </div>
  );
}

function FeedStatusItem({ 
  label, 
  status 
}: { 
  label: string; 
  status: 'LIVE' | 'RECONNECTING' | 'OFFLINE';
}) {
  const icon = getFeedStatusIcon(status);
  const color = status === 'LIVE' 
    ? 'text-green-500' 
    : status === 'RECONNECTING' 
      ? 'text-amber-500' 
      : 'text-red-500';

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800/50">
      <span className={`text-xs ${color}`}>{icon}</span>
      <span className="text-xs font-mono text-gray-400 truncate">{label}</span>
    </div>
  );
}

// Inline status badge for headers
export function L1StatusBadge({ className = '' }: { className?: string }) {
  const { status, isLoading } = useL1Data();
  const statusColor = getStatusColor(status);
  const isReconnecting = status === 'RECONNECTING' || status === 'DEGRADED';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isReconnecting || isLoading ? (
        <RefreshCw className={`w-2.5 h-2.5 animate-spin ${statusColor}`} />
      ) : (
        <div className={`w-2 h-2 rounded-full ${
          status === 'LIVE' ? 'bg-green-500' : 
          status === 'OFFLINE' ? 'bg-red-500' : 'bg-amber-500'
        } ${status === 'LIVE' ? 'animate-pulse' : ''}`} />
      )}
      <span className={`text-xs font-mono ${statusColor}`}>{status}</span>
    </div>
  );
}

export default L1StatusIndicator;
