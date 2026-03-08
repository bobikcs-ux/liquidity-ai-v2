import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

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
  DEGRADED: '#f59e0b',    // Yellow
  OFFLINE: '#ef4444',     // Red
  FALLBACK: '#8b8b8b',    // Grey
};

export function SystemStatusPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/health');
      if (res.ok) {
        const data: HealthResponse = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error('[SystemStatus] Health check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!health) return null;

  const statusColorMap: Record<string, string> = {
    HEALTHY: '#22c55e',
    DEGRADED: '#f59e0b',
    CRITICAL: '#ef4444',
  };

  return (
    <div
      className="rounded-lg p-3 border transition-all"
      style={{
        background: 'rgba(163,147,123,0.04)',
        borderColor: 'rgba(163,147,123,0.15)',
      }}
    >
      {/* Collapsed View */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: statusColorMap[health.status] }}
          />
          <span className="text-xs font-mono font-bold tracking-widest" style={{ color: '#A3937B' }}>
            SYSTEM: {health.status}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4" style={{ color: '#A3937B' }} />
        ) : (
          <ChevronDown className="w-4 h-4" style={{ color: '#A3937B' }} />
        )}
      </button>

      {/* Expanded View */}
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
          <div className="mt-2 text-[10px]" style={{ color: '#8b8b8b' }}>
            Last checked: {new Date(health.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
