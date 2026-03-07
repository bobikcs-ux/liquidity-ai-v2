'use client';

import React from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { useIntelligenceLogs } from '../hooks/useIntelligenceLogs';

export function LiveAlphaTicker() {
  const { logs, isLoading } = useIntelligenceLogs();

  // Get the most recent 5 signals for the ticker
  const tickerSignals = logs.slice(0, 5);

  const impactColor = (impact: string) => {
    switch (impact) {
      case 'CRITICAL': return '#ff3b5c';
      case 'HIGH': return '#ffb020';
      case 'MEDIUM': return '#ffa500';
      default: return '#2ecc71';
    }
  };

  const confidenceBar = (conf: number) => {
    return Math.min(100, Math.max(0, conf));
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5" style={{ color: '#d4af37' }} />
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#d4af37' }}>
          Live Alpha Ticker
        </h3>
        <span className="text-xs ml-auto" style={{ color: '#a1a1aa' }}>
          {isLoading ? 'Loading...' : `${tickerSignals.length} signals`}
        </span>
      </div>

      {/* Ticker Signals */}
      <div className="space-y-3">
        {tickerSignals.length === 0 ? (
          <div style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
            No intelligence signals available
          </div>
        ) : (
          tickerSignals.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded"
              style={{
                background: 'rgba(18, 18, 24, 0.6)',
                border: `1px solid ${impactColor(log.impact)}20`,
              }}
            >
              {/* Impact Badge */}
              <div
                className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center mt-0.5"
                style={{
                  background: `${impactColor(log.impact)}20`,
                  color: impactColor(log.impact),
                }}
              >
                <TrendingUp className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold uppercase"
                    style={{ color: impactColor(log.impact) }}
                  >
                    {log.impact}
                  </span>
                  <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                    {log.source}
                  </span>
                  {log.region && (
                    <span
                      style={{
                        color: '#d4af37',
                        fontSize: '0.75rem',
                        background: 'rgba(212, 175, 55, 0.1)',
                        padding: '0 4px',
                        borderRadius: '3px',
                      }}
                    >
                      {log.region}
                    </span>
                  )}
                </div>
                <p style={{ color: '#f5f5f5', fontSize: '0.875rem' }} className="mb-2">
                  {log.signal}
                </p>
                {log.details && (
                  <p style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                    {log.details}
                  </p>
                )}

                {/* Confidence Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Confidence</span>
                    <span style={{ color: '#d4af37', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {log.confidence.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(212, 175, 55, 0.1)' }}
                  >
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${confidenceBar(log.confidence)}%`,
                        background: `linear-gradient(90deg, #d4af37, #c6a85a)`,
                        boxShadow: '0 0 8px rgba(212, 175, 55, 0.4)',
                      }}
                    />
                  </div>
                </div>

                {/* Timestamp */}
                <div style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  {new Date(log.timestamp).toLocaleString()}
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
