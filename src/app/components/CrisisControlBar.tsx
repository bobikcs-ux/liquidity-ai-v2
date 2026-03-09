'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface CrisisControlBarProps {
  riskLevel: number; // 0-100
  isSystemic: boolean;
  systemicRiskLabel: string;
}

export function CrisisControlBar({ riskLevel, isSystemic, systemicRiskLabel }: CrisisControlBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);

  if (!isVisible || riskLevel < 60) {
    return null;
  }

  // Determine risk level coloring
  const getRiskColor = () => {
    if (riskLevel >= 85) return '#ff3b5c'; // Crisis
    if (riskLevel >= 70) return '#ffb020'; // Warning
    if (riskLevel >= 60) return '#ff6b4a'; // Elevated
    return '#2ecc71'; // Safe
  };

  const getRiskLabel = () => {
    if (riskLevel >= 85) return 'SYSTEMIC CRISIS';
    if (riskLevel >= 70) return 'HIGH RISK';
    if (riskLevel >= 60) return 'ELEVATED RISK';
    return 'NORMAL';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[#0b0b0f] border-b border-[#d4af37]/20">
      {/* Animated Risk Bar */}
      <div
        className="h-1 w-full transition-all duration-500"
        style={{
          background: `linear-gradient(90deg, #2ecc71 0%, #ffb020 60%, ${getRiskColor()} 100%)`,
          boxShadow: `0 0 15px ${getRiskColor()}`,
        }}
      />

      {/* Crisis Control Panel */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Alert Info */}
        <div className="flex items-center gap-3">
          <AlertTriangle
            className="w-5 h-5 flex-shrink-0 animate-pulse"
            style={{ color: getRiskColor() }}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#d4af37' }}>
              {getRiskLabel()}
            </span>
            <span className="text-xs" style={{ color: '#a1a1aa' }}>
              SRI: {riskLevel}% • {systemicRiskLabel}
            </span>
          </div>
        </div>

        {/* Center: Mode Indicator */}
        {isAnalysisMode && (
          <div className="text-xs font-semibold" style={{ color: '#d4af37' }}>
            ANALYSIS MODE ACTIVE
          </div>
        )}

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVisible(false)}
            className="px-3 py-1.5 text-xs font-semibold rounded border border-[#d4af37]/40 hover:bg-[#d4af37]/10 transition-colors"
            style={{ color: '#d4af37' }}
            title="Acknowledge alert"
          >
            ACKNOWLEDGE
          </button>

          <button
            onClick={() => setIsVisible(false)}
            className="px-3 py-1.5 text-xs font-semibold rounded border border-[#a1a1aa]/40 hover:bg-[#a1a1aa]/10 transition-colors"
            style={{ color: '#a1a1aa' }}
            title="Suppress this warning"
          >
            SUPPRESS
          </button>

          <button
            onClick={() => {
              setIsAnalysisMode(!isAnalysisMode);
            }}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-[#d4af37]/20 border border-[#d4af37]/60 hover:bg-[#d4af37]/30 transition-colors"
            style={{ color: '#d4af37' }}
            title="Enter deep analysis mode"
          >
            ANALYZE
          </button>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 hover:bg-[#d4af37]/10 rounded transition-colors"
            title="Close alert bar"
          >
            <X className="w-4 h-4" style={{ color: '#a1a1aa' }} />
          </button>
        </div>
      </div>

      {/* Subtle red pulse animation when systemic */}
      {isSystemic && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 59, 92, 0.1) 0%, transparent 70%)',
            animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      )}
    </div>
  );
}

export default CrisisControlBar;
