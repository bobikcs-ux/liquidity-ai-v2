import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface ServiceStatus {
  service: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'FALLBACK';
  latency_ms: number;
  last_check: string;
}

interface HealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: string;
  services: ServiceStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: '#22c55e',      // Green
  DEGRADED: '#f59e0b',    // Yellow/Amber
  OFFLINE: '#ef4444',     // Red
  FALLBACK: '#8b8b8b',    // Grey
};

export function SystemStatusPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastRetry, setLastRetry] = useState<Date | null>(null);
  const [nextRetryIn, setNextRetryIn] = useState(0);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/health');
      if (res.ok) {
        const data: HealthResponse = await res.json();
        setHealth(data);
      } else {
        console.warn('[SystemStatus] Health check returned status:', res.status);
      }
    } catch (err: any) {
      console.error('[SystemStatus] Health check failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLastRetry(new Date());
    setNextRetryIn(30);
    fetchHealth();
  };

  // Auto-poll every 20-30 seconds
  useEffect(() => {
    fetchHealth();
    const pollInterval = setInterval(fetchHealth, 25_000);
    return () => clearInterval(pollInterval);
  }, []);

  // Countdown timer for next retry
  useEffect(() => {
    if (nextRetryIn <= 0) return;
    const timer = setInterval(() => {
      setNextRetryIn((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [nextRetryIn]);

  if (!health) {
    return (
      <div
        className="rounded-lg p-3 border"
        style={{
          background: 'rgba(163,147,123,0.04)',
          borderColor: 'rgba(163,147,123,0.15)',
        }}
      >
        <div className="text-xs font-mono" style={{ color: '#A3937B' }}>
          Loading system status...
        </div>
      </div>
    );
  }

  const statusColorMap: Record<string, string> = {
    HEALTHY: '#22c55e',
    DEGRADED: '#f59e0b',
    CRITICAL: '#ef4444',
  };

  const hasFailedServices = health.services.some((s) => s.status === 'OFFLINE');

  return (
    <div
      className="rounded-lg p-3 border transition-all"
      style={{
        background: 'rgba(163,147,123,0.04)',
        borderColor: 'rgba(163,147,123,0.15)',
      }}
    >
      {/* Collapsed View - Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: statusColorMap[health.status] }}
          />
          <span className="text-xs font-mono font-bold tracking-widest" style={{ color: '#A3937B' }}>
            SYSTEM HEALTH: {health.status}
          </span>
          {hasFailedServices && (
            <AlertCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: '#A3937B' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: '#A3937B' }} />
        )}
      </button>

      {/* Expanded View - Service List */}
      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: 'rgba(163,147,123,0.15)' }}>
          {health.services.map((svc) => (
            <div key={svc.service} className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[svc.status] }}
                />
                <span style={{ color: '#A3937B' }}>{svc.service}</span>
              </div>
              <div className="text-right">
                <span style={{ color: STATUS_COLORS[svc.status] }}>{svc.status}</span>
                {svc.latency_ms > 0 && (
                  <span style={{ color: '#8b8b8b' }}> ({svc.latency_ms}ms)</span>
                )}
              </div>
            </div>
          ))}

          {/* Footer Controls */}
          <div className="mt-3 pt-2 border-t flex items-center justify-between" style={{ borderColor: 'rgba(163,147,123,0.15)' }}>
            <div className="text-[10px]" style={{ color: '#8b8b8b' }}>
              Last checked: {new Date(health.timestamp).toLocaleTimeString()}
            </div>
            <button
              onClick={handleRetry}
              disabled={loading || nextRetryIn > 0}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold tracking-widest transition-all hover:opacity-80 disabled:opacity-50"
              style={{
                background: 'rgba(163,147,123,0.12)',
                color: '#A3937B',
                border: '1px solid rgba(163,147,123,0.2)',
              }}
              title={nextRetryIn > 0 ? `Next retry in ${nextRetryIn}s` : 'Retry health check'}
            >
              <RotateCcw className="w-3 h-3" />
              {loading ? 'CHECKING' : nextRetryIn > 0 ? `${nextRetryIn}s` : 'RETRY'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
