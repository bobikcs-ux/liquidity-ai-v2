'use client';

import React, { useEffect, useState } from 'react';
import { TrendingDown, Globe, PiggyBank, DollarSign, AlertTriangle } from 'lucide-react';

interface CapitalFlightMetrics {
  fxReserves: number; // billions USD
  fxReservesChange: number; // %
  goldReserves: number; // tonnes
  goldReservesChange: number; // %
  usdExposure: number; // % of reserves
  capitalFlightEstimate: number; // billions USD
  velocityIndex: number; // 0-100
}

interface GlobalCapitalFlightDetectorProps {
  onFlightDetected?: (severity: 'low' | 'medium' | 'high' | 'critical') => void;
}

export function GlobalCapitalFlightDetector({ onFlightDetected }: GlobalCapitalFlightDetectorProps) {
  const [metrics, setMetrics] = useState<CapitalFlightMetrics>({
    fxReserves: 3250.5,
    fxReservesChange: -2.3,
    goldReserves: 198765,
    goldReservesChange: 0.8,
    usdExposure: 58.2,
    capitalFlightEstimate: 47.8, // billions
    velocityIndex: 67,
  });

  const [flightSeverity, setFlightSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  useEffect(() => {
    // Calculate flight severity
    if (metrics.capitalFlightEstimate > 100 || metrics.velocityIndex > 85) {
      setFlightSeverity('critical');
    } else if (metrics.capitalFlightEstimate > 50 || metrics.velocityIndex > 70) {
      setFlightSeverity('high');
    } else if (metrics.capitalFlightEstimate > 20 || metrics.velocityIndex > 50) {
      setFlightSeverity('medium');
    } else {
      setFlightSeverity('low');
    }

    onFlightDetected?.(flightSeverity);
  }, [metrics, onFlightDetected, flightSeverity]);

  const getSeverityColor = () => {
    switch (flightSeverity) {
      case 'critical':
        return '#ff3b5c';
      case 'high':
        return '#ffb020';
      case 'medium':
        return '#ffa500';
      case 'low':
        return '#2ecc71';
    }
  };

  const getSeverityLabel = () => {
    switch (flightSeverity) {
      case 'critical':
        return 'CRITICAL CAPITAL FLIGHT';
      case 'high':
        return 'HIGH CAPITAL FLIGHT';
      case 'medium':
        return 'MEDIUM CAPITAL FLIGHT';
      case 'low':
        return 'LOW CAPITAL FLIGHT';
    }
  };

  return (
    <div className="w-full bg-[#0b0b0f] border border-[#d4af37]/20 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#d4af37]/10">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6" style={{ color: '#d4af37' }} />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#d4af37' }}>
              Global Capital Flight Detector
            </h3>
            <p className="text-xs" style={{ color: '#a1a1aa' }}>
              Real-time international capital movement monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" style={{ color: getSeverityColor() }} />
          <span className="text-xs font-bold uppercase" style={{ color: getSeverityColor() }}>
            {getSeverityLabel()}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* FX Reserves */}
        <div className="bg-[#121218] border border-[#d4af37]/10 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" style={{ color: '#d4af37' }} />
            <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>FX RESERVES</span>
          </div>
          <div className="text-lg font-bold" style={{ color: '#f5f5f5' }}>
            ${metrics.fxReserves.toFixed(1)}B
          </div>
          <div className={`text-xs font-mono mt-1 ${metrics.fxReservesChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
            {metrics.fxReservesChange > 0 ? '+' : ''}{metrics.fxReservesChange}%
          </div>
        </div>

        {/* Gold Reserves */}
        <div className="bg-[#121218] border border-[#d4af37]/10 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4" style={{ color: '#d4af37' }} />
            <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>GOLD RESERVES</span>
          </div>
          <div className="text-lg font-bold" style={{ color: '#f5f5f5' }}>
            {(metrics.goldReserves / 1000).toFixed(1)}k T
          </div>
          <div className={`text-xs font-mono mt-1 ${metrics.goldReservesChange < 0 ? 'text-red-400' : 'text-green-400'}`}>
            {metrics.goldReservesChange > 0 ? '+' : ''}{metrics.goldReservesChange}%
          </div>
        </div>

        {/* USD Exposure */}
        <div className="bg-[#121218] border border-[#d4af37]/10 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" style={{ color: '#d4af37' }} />
            <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>USD EXPOSURE</span>
          </div>
          <div className="text-lg font-bold" style={{ color: '#f5f5f5' }}>
            {metrics.usdExposure.toFixed(1)}%
          </div>
          <div className="text-xs font-mono mt-1" style={{ color: '#ffb020' }}>
            HIGH DEPENDENCY
          </div>
        </div>

        {/* Capital Flight Estimate */}
        <div className="bg-[#121218] border border-[#d4af37]/10 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4" style={{ color: getSeverityColor() }} />
            <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>FLIGHT ESTIMATE</span>
          </div>
          <div className="text-lg font-bold" style={{ color: getSeverityColor() }}>
            ${metrics.capitalFlightEstimate.toFixed(1)}B
          </div>
          <div className="text-xs font-mono mt-1" style={{ color: getSeverityColor() }}>
            {flightSeverity.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Velocity Index Progress Bar */}
      <div className="bg-[#121218] border border-[#d4af37]/10 rounded p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase" style={{ color: '#d4af37' }}>Capital Flight Velocity Index</span>
          <span className="text-sm font-bold" style={{ color: getSeverityColor() }}>
            {metrics.velocityIndex}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#0b0b0f] rounded overflow-hidden">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${metrics.velocityIndex}%`,
              background: `linear-gradient(90deg, #2ecc71 0%, #ffb020 50%, ${getSeverityColor()} 100%)`,
              boxShadow: `0 0 10px ${getSeverityColor()}`,
            }}
          />
        </div>
        <div className="text-xs mt-2" style={{ color: '#a1a1aa' }}>
          {metrics.velocityIndex < 30
            ? 'Stable capital position'
            : metrics.velocityIndex < 60
              ? 'Elevated outflow pressure'
              : metrics.velocityIndex < 85
                ? 'High capital flight risk'
                : 'Critical mass exodus detected'}
        </div>
      </div>
    </div>
  );
}

export default GlobalCapitalFlightDetector;
