'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TrendingDown, TrendingUp, Globe, PiggyBank, DollarSign, AlertTriangle, RefreshCw, Minus } from 'lucide-react';
import { fetchLiveFXData, type LiveFXData } from '../services/energyFinanceService';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface GlobalCapitalFlightDetectorProps {
  onFlightDetected?: (severity: 'low' | 'medium' | 'high' | 'critical') => void;
}

export function GlobalCapitalFlightDetector({ onFlightDetected }: GlobalCapitalFlightDetectorProps) {
  const [fxData, setFxData] = useState<LiveFXData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLiveFXData();
      setFxData(data);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [load]);

  // Derive capital flight severity from USD strength + FX moves
  const velocityIndex = fxData
    ? Math.min(100, Math.max(0, fxData.dollarStrengthIndex))
    : 54;

  const flightSeverity: 'low' | 'medium' | 'high' | 'critical' =
    velocityIndex > 85 ? 'critical'
    : velocityIndex > 70 ? 'high'
    : velocityIndex > 50 ? 'medium'
    : 'low';

  useEffect(() => {
    onFlightDetected?.(flightSeverity);
  }, [flightSeverity, onFlightDetected]);

  const severityColor =
    flightSeverity === 'critical' ? '#ff3b5c'
    : flightSeverity === 'high' ? '#ffb020'
    : flightSeverity === 'medium' ? '#ffa500'
    : '#2ecc71';

  const severityLabel =
    flightSeverity === 'critical' ? 'CRITICAL CAPITAL FLIGHT'
    : flightSeverity === 'high' ? 'HIGH CAPITAL FLIGHT'
    : flightSeverity === 'medium' ? 'MODERATE OUTFLOW PRESSURE'
    : 'STABLE CAPITAL POSITION';

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) =>
    trend === 'up' ? <TrendingUp className="w-3 h-3" />
    : trend === 'down' ? <TrendingDown className="w-3 h-3" />
    : <Minus className="w-3 h-3" />;

  const trendColor = (trend: 'up' | 'down' | 'flat', symbol: string) => {
    // For USD/JPY, USD/CNY, USD/CHF — up = USD strengthening = capital flight risk
    // For USD/EUR (inverted) — up = EUR weakening = risk off
    const riskUp = !symbol.startsWith('EUR');
    if (trend === 'flat') return '#a1a1aa';
    return trend === 'up'
      ? (riskUp ? '#ffb020' : '#2ecc71')
      : (riskUp ? '#2ecc71' : '#ffb020');
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
              Live FX pairs via Financial Modeling Prep
              {lastRefresh && (
                <span className="ml-2 opacity-60">— {lastRefresh.toLocaleTimeString()}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs border transition-opacity"
            style={{ borderColor: '#d4af37', color: '#d4af37', opacity: loading ? 0.4 : 1 }}
            title="Refresh FX data"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            REFRESH
          </button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" style={{ color: severityColor }} />
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: severityColor }}>
              {severityLabel}
            </span>
          </div>
        </div>
      </div>

      {/* FX Pairs Grid — live from FMP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {(fxData?.pairs ?? [
          { symbol: 'USDJPY', label: 'USD/JPY', rate: 149.82, changePct: 0.23, trend: 'up' as const },
          { symbol: 'EURUSD', label: 'USD/EUR', rate: 0.9231, changePct: -0.22, trend: 'down' as const },
          { symbol: 'USDCNY', label: 'USD/CNY', rate: 7.2415, changePct: 0.17, trend: 'up' as const },
          { symbol: 'USDCHF', label: 'USD/CHF', rate: 0.8941, changePct: -0.11, trend: 'flat' as const },
        ]).map(pair => (
          <div
            key={pair.symbol}
            className="bg-[#121218] border border-[#d4af37]/10 rounded p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold" style={{ color: '#d4af37' }}>
                {pair.label}
              </span>
              {fxData?.source === 'FMP' && (
                <span className="text-[10px] px-1 rounded" style={{ background: '#2ecc7120', color: '#2ecc71' }}>LIVE</span>
              )}
            </div>
            <div className="text-lg font-bold tabular-nums" style={{ color: '#f5f5f5' }}>
              {pair.rate != null ? pair.rate.toFixed(4) : '--'}
            </div>
            <div
              className="flex items-center gap-1 text-xs font-mono mt-1"
              style={{ color: trendColor(pair.trend, pair.symbol) }}
            >
              <TrendIcon trend={pair.trend} />
              {pair.changePct != null ? `${pair.changePct > 0 ? '+' : ''}${pair.changePct.toFixed(3)}%` : '--'}
            </div>
          </div>
        ))}
      </div>

      {/* Static reserve metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-[#121218] border border-[#d4af37]/10 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" style={{ color: '#d4af37' }} />
            <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>FX RESERVES</span>
          </div>
          <div className="text-lg font-bold" style={{ color: '#f5f5f5' }}>$3,250.5B</div>
          <div className="text-xs font-mono mt-1 text-red-400">-2.3%</div>
        </div>
        <div className="bg-[#121218] border border-[#d4af37]/10 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <PiggyBank className="w-4 h-4" style={{ color: '#d4af37' }} />
            <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>GOLD RESERVES</span>
          </div>
          <div className="text-lg font-bold" style={{ color: '#f5f5f5' }}>198.8k T</div>
          <div className="text-xs font-mono mt-1 text-green-400">+0.8%</div>
        </div>
        <div className="bg-[#121218] border border-[#d4af37]/10 rounded p-4 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4" style={{ color: '#d4af37' }} />
            <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>USD EXPOSURE</span>
          </div>
          <div className="text-lg font-bold" style={{ color: '#f5f5f5' }}>58.2%</div>
          <div className="text-xs font-mono mt-1" style={{ color: '#ffb020' }}>HIGH DEPENDENCY</div>
        </div>
      </div>

      {/* Dollar Strength + Velocity Index */}
      <div className="bg-[#121218] border border-[#d4af37]/10 rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-mono uppercase" style={{ color: '#d4af37' }}>
              Capital Flight Velocity Index
            </span>
            <span className="text-xs ml-2" style={{ color: '#a1a1aa' }}>
              (derived from USD strength composite)
            </span>
          </div>
          <span className="text-sm font-bold" style={{ color: severityColor }}>
            {velocityIndex.toFixed(1)}
          </span>
        </div>
        <div className="w-full h-2 bg-[#0b0b0f] rounded overflow-hidden">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${velocityIndex}%`,
              background: `linear-gradient(90deg, #2ecc71 0%, #ffb020 55%, ${severityColor} 100%)`,
              boxShadow: `0 0 8px ${severityColor}60`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: '#a1a1aa' }}>
            {velocityIndex < 30 ? 'Stable capital position'
              : velocityIndex < 60 ? 'Elevated outflow pressure'
              : velocityIndex < 85 ? 'High capital flight risk'
              : 'Critical mass exodus detected'}
          </span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ background: `${severityColor}18`, color: severityColor }}
          >
            {fxData?.source ?? 'FALLBACK'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default GlobalCapitalFlightDetector;
