'use client';

import React from 'react';
import { Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { useIntelligenceLogs } from '../hooks/useIntelligenceLogs';

export function LiveAlphaTicker() {
  const { logs, isLoading } = useIntelligenceLogs();

  // Separate SYSTEM_ALERT / REALITY DIVERGENCE from regular signals
  const systemAlerts = logs.filter(l => l.type === 'SYSTEM_ALERT');
  const regularSignals = logs.filter(l => l.type !== 'SYSTEM_ALERT').slice(0, 5);
  const latestAlert = systemAlerts[0] ?? null;

  // Maps intel_feed.severity → display color
  const severityColor = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'CRITICAL': return '#ff3b5c';
      case 'HIGH':     return '#ffb020';
      case 'MEDIUM':   return '#ffa500';
      default:         return '#2ecc71';
    }
  };

  return (
    <div
      className="w-full border rounded-lg p-4 mb-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05), rgba(212, 175, 55, 0.02))',
        borderColor: 'rgba(212, 175, 55, 0.2)',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {/* REALITY DIVERGENCE Banner — pinned above ticker when present */}
      {latestAlert && (
        <div
          className="flex items-start gap-3 p-3 rounded mb-4 animate-pulse"
          style={{
            background: 'rgba(255, 59, 92, 0.08)',
            border: '1px solid rgba(255, 59, 92, 0.5)',
            boxShadow: '0 0 12px rgba(255, 59, 92, 0.15)',
          }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#ff3b5c' }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#ff3b5c' }}>
                {latestAlert.title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded uppercase" style={{ background: 'rgba(255,59,92,0.15)', color: '#ff3b5c' }}>
                SYSTEM ALERT
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: '#ccc' }}>
              {latestAlert.content}
            </p>
            <div className="text-[10px] mt-1.5" style={{ color: '#666' }}>
              {new Date(latestAlert.created_at).toLocaleString('en-GB', { hour12: false })}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5" style={{ color: '#d4af37' }} />
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#d4af37' }}>
          Live Alpha Ticker
        </h3>
        <span className="text-xs ml-auto" style={{ color: '#a1a1aa' }}>
          {isLoading ? 'Syncing...' : `${regularSignals.length} signals`}
        </span>
      </div>

      {/* Ticker Signals */}
      <div className="space-y-3">
        {regularSignals.length === 0 ? (
          <div style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
            No intelligence signals available
          </div>
        ) : (
          regularSignals.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded"
              style={{
                background: 'rgba(18, 18, 24, 0.6)',
                border: `1px solid ${severityColor(log.severity)}20`,
              }}
            >
              {/* Severity Badge */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center mt-0.5"
                style={{
                  background: `${severityColor(log.severity)}20`,
                  color: severityColor(log.severity),
                }}
              >
                <TrendingUp className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase" style={{ color: severityColor(log.severity) }}>
                    {log.severity ?? 'INFO'}
                  </span>
                  <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                    {log.source ?? 'AURELIUS AI CORE'}
                  </span>
                  <span
                    className="text-[10px] px-1 rounded"
                    style={{ background: 'rgba(212,175,55,0.12)', color: '#d4af37' }}
                  >
                    {log.type}
                  </span>
                </div>

                {/* Title (intel_feed.title) */}
                <p className="font-semibold mb-1" style={{ color: '#f5f5f5', fontSize: '0.875rem' }}>
                  {log.title}
                </p>

                {/* Content preview */}
                {log.content && (
                  <p className="line-clamp-2" style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                    {log.content}
                  </p>
                )}

                {/* Confidence Bar */}
                {log.confidence != null && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Confidence</span>
                      <span style={{ color: '#d4af37', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {log.confidence}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(212, 175, 55, 0.1)' }}>
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, log.confidence)}%`,
                          background: 'linear-gradient(90deg, #d4af37, #c6a85a)',
                          boxShadow: '0 0 8px rgba(212, 175, 55, 0.4)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Timestamp — 24h format */}
                <div style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  {new Date(log.created_at).toLocaleString('en-GB', { hour12: false })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LiveAlphaTicker;
