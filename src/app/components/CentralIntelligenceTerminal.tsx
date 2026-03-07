'use client';

import React, { useState } from 'react';
import { Brain, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useIntelligenceLogs } from '../hooks/useIntelligenceLogs';

export function CentralIntelligenceTerminal() {
  const { logs, isLoading, refresh } = useIntelligenceLogs();
  const [selectedImpact, setSelectedImpact] = useState<string | null>(null);

  // Maps intel_feed.severity → display color
  const severityColor = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'CRITICAL': return '#ff3b5c';
      case 'HIGH':     return '#ffb020';
      case 'MEDIUM':   return '#ffa500';
      default:         return '#2ecc71';
    }
  };

  // Statistics derived from intel_feed.severity
  const criticalCount = logs.filter(l => l.severity?.toUpperCase() === 'CRITICAL').length;
  const highCount     = logs.filter(l => l.severity?.toUpperCase() === 'HIGH').length;
  const avgConfidence = logs.length > 0
    ? logs.reduce((sum, l) => sum + (l.confidence ?? 0), 0) / logs.length
    : 0;

  const filteredLogs = selectedImpact
    ? logs.filter(l => l.severity?.toUpperCase() === selectedImpact)
    : logs;

  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(11, 11, 15, 0.9), rgba(18, 18, 24, 0.9))',
        border: '1px solid rgba(212, 175, 55, 0.15)',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {/* Header with stats */}
      <div
        className="p-6 border-b"
        style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6" style={{ color: '#d4af37' }} />
            <h2 className="text-lg font-bold uppercase tracking-wider" style={{ color: '#d4af37' }}>
              Central Intelligence Terminal
            </h2>
          </div>
          <button
            onClick={() => refresh()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold uppercase transition-opacity"
            style={{
              color: '#d4af37',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              background: 'rgba(212, 175, 55, 0.05)',
              opacity: isLoading ? 0.4 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            title="Manual refresh"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Critical Alerts */}
          <div
            className="p-3 rounded"
            style={{
              background: 'rgba(255, 59, 92, 0.08)',
              border: '1px solid rgba(255, 59, 92, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" style={{ color: '#ff3b5c' }} />
              <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Critical</span>
            </div>
            <div style={{ color: '#ff3b5c', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {criticalCount}
            </div>
          </div>

          {/* High Alerts */}
          <div
            className="p-3 rounded"
            style={{
              background: 'rgba(255, 176, 32, 0.08)',
              border: '1px solid rgba(255, 176, 32, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" style={{ color: '#ffb020' }} />
              <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>High</span>
            </div>
            <div style={{ color: '#ffb020', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {highCount}
            </div>
          </div>

          {/* Avg Confidence */}
          <div
            className="p-3 rounded"
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4" style={{ color: '#d4af37' }} />
              <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Avg Confidence</span>
            </div>
            <div style={{ color: '#d4af37', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {avgConfidence.toFixed(0)}%
            </div>
          </div>

          {/* Total Signals */}
          <div
            className="p-3 rounded"
            style={{
              background: 'rgba(46, 204, 113, 0.08)',
              border: '1px solid rgba(46, 204, 113, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" style={{ color: '#2ecc71' }} />
              <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Total</span>
            </div>
            <div style={{ color: '#2ecc71', fontSize: '1.5rem', fontWeight: 'bold' }}>
              {logs.length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons — keyed on severity */}
      <div className="flex flex-wrap gap-2 p-4 border-b" style={{ borderColor: 'rgba(212, 175, 55, 0.1)' }}>
        {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => {
          const count = logs.filter(l => l.severity?.toUpperCase() === sev).length;
          const isSelected = selectedImpact === sev;
          return (
            <button
              key={sev}
              onClick={() => setSelectedImpact(isSelected ? null : sev)}
              className="px-3 py-1.5 rounded text-xs font-semibold uppercase transition-all"
              style={{
                color:      isSelected ? '#0b0b0f' : severityColor(sev),
                background: isSelected ? severityColor(sev) : `${severityColor(sev)}15`,
                border:     `1px solid ${isSelected ? severityColor(sev) : severityColor(sev)}40`,
              }}
            >
              {sev} ({count})
            </button>
          );
        })}
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.1)' }}>
              <th
                className="p-4 text-left font-semibold"
                style={{ color: '#d4af37' }}
              >
                Signal
              </th>
              <th
                className="p-4 text-left font-semibold"
                style={{ color: '#d4af37' }}
              >
                Impact
              </th>
              <th
                className="p-4 text-left font-semibold"
                style={{ color: '#d4af37' }}
              >
                Confidence
              </th>
              <th
                className="p-4 text-left font-semibold"
                style={{ color: '#d4af37' }}
              >
                Source
              </th>
              <th
                className="p-4 text-left font-semibold"
                style={{ color: '#d4af37' }}
              >
                Timestamp
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center"
                  style={{ color: '#a1a1aa' }}
                >
                  No signals available
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid rgba(212, 175, 55, 0.05)',
                    background: idx % 2 === 0 ? 'rgba(212, 175, 55, 0.02)' : 'transparent',
                  }}
                >
                  {/* Signal title — intel_feed.title */}
                  <td className="p-4" style={{ color: '#f5f5f5' }}>
                    <div className="font-semibold">{log.title}</div>
                    {log.content && (
                      <div className="line-clamp-2" style={{ color: '#a1a1aa', marginTop: '0.25rem', fontSize: '0.7rem' }}>
                        {log.content}
                      </div>
                    )}
                  </td>
                  {/* Severity — intel_feed.severity */}
                  <td className="p-4">
                    <span
                      className="px-2 py-1 rounded text-[11px] font-bold uppercase"
                      style={{
                        color: '#0b0b0f',
                        background: severityColor(log.severity),
                      }}
                    >
                      {log.severity ?? 'INFO'}
                    </span>
                  </td>
                  {/* Confidence — derived client-side */}
                  <td className="p-4" style={{ color: '#d4af37', fontWeight: 'bold' }}>
                    {(log.confidence ?? 0)}%
                  </td>
                  {/* Source — derived client-side */}
                  <td className="p-4" style={{ color: '#a1a1aa' }}>
                    {log.source ?? 'AURELIUS AI CORE'}
                  </td>
                  {/* Timestamp — intel_feed.created_at — 24h */}
                  <td className="p-4" style={{ color: '#a1a1aa' }}>
                    {new Date(log.created_at).toLocaleString('en-GB', { hour12: false })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CentralIntelligenceTerminal;
