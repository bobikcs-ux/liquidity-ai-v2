'use client';

/**
 * Global Capital Flight Detector
 * Detects early capital movement during crisis
 * 
 * Data Sources:
 * - USD Index (DXY)
 * - Gold price
 * - BTC flows
 * - EM ETF flows
 * - Treasury yields
 * 
 * Logic: If DXY rising + Gold rising + EM ETF outflows + Treasury yields falling → Capital Flight
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Coins,
  Bitcoin,
  Globe2,
  BarChart3,
  RefreshCw,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';

// Safe Icon Component - Prevents UI crash if icon is missing
interface SafeIconProps {
  icon?: LucideIcon | null;
  className?: string;
  fallback?: React.ReactNode;
}

const SafeIcon: React.FC<SafeIconProps> = ({ icon: Icon, className = '', fallback = null }) => {
  if (!Icon) return <span className={className}>{fallback}</span>;
  return <Icon className={className} />;
};

// ============================================
// TYPES
// ============================================

interface CapitalFlightIndicator {
  name: string;
  value: number;
  change24h: number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  weight: number;
  description: string;
}

interface CapitalFlightState {
  flightIndex: number; // 0-100
  flightLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'EXTREME';
  indicators: CapitalFlightIndicator[];
  signals: {
    dxyRising: boolean;
    goldRising: boolean;
    emOutflows: boolean;
    yieldsDropping: boolean;
  };
  isFlightDetected: boolean;
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

async function fetchCapitalFlightData(): Promise<Omit<CapitalFlightState, 'isLoading' | 'error'>> {
  // In production, these would be real API calls to FRED, CoinGecko, ETF data providers
  // Simulating with realistic mock data
  
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  const dxy = 104.2 + (Math.random() - 0.4) * 3;
  const dxyChange = (Math.random() - 0.3) * 2;
  
  const gold = 2350 + (Math.random() - 0.5) * 100;
  const goldChange = (Math.random() - 0.3) * 3;
  
  const btcFlow = (Math.random() - 0.5) * 2000; // millions
  const btcFlowChange = btcFlow > 0 ? 1 : -1;
  
  const emEtfFlow = (Math.random() - 0.6) * 5000; // millions, biased negative
  const emEtfChange = emEtfFlow / 100;
  
  const treasury10y = 4.3 + (Math.random() - 0.5) * 0.5;
  const treasuryChange = (Math.random() - 0.6) * 0.2; // biased down

  const indicators: CapitalFlightIndicator[] = [
    {
      name: 'USD Index (DXY)',
      value: dxy,
      change24h: dxyChange,
      signal: dxyChange > 0.3 ? 'BULLISH' : dxyChange < -0.3 ? 'BEARISH' : 'NEUTRAL',
      weight: 25,
      description: 'Dollar strength indicates safe-haven demand',
    },
    {
      name: 'Gold (XAU/USD)',
      value: gold,
      change24h: goldChange,
      signal: goldChange > 0.5 ? 'BULLISH' : goldChange < -0.5 ? 'BEARISH' : 'NEUTRAL',
      weight: 25,
      description: 'Gold rising signals flight to hard assets',
    },
    {
      name: 'BTC Net Flow',
      value: btcFlow,
      change24h: btcFlowChange,
      signal: btcFlow > 500 ? 'BULLISH' : btcFlow < -500 ? 'BEARISH' : 'NEUTRAL',
      weight: 15,
      description: 'Crypto flows indicate risk appetite',
    },
    {
      name: 'EM ETF Flow',
      value: emEtfFlow,
      change24h: emEtfChange,
      signal: emEtfFlow > 1000 ? 'BULLISH' : emEtfFlow < -1000 ? 'BEARISH' : 'NEUTRAL',
      weight: 20,
      description: 'EM outflows signal capital repatriation',
    },
    {
      name: '10Y Treasury',
      value: treasury10y,
      change24h: treasuryChange,
      signal: treasuryChange < -0.05 ? 'BULLISH' : treasuryChange > 0.05 ? 'BEARISH' : 'NEUTRAL',
      weight: 15,
      description: 'Falling yields = flight to safety',
    },
  ];

  const signals = {
    dxyRising: dxyChange > 0.2,
    goldRising: goldChange > 0.3,
    emOutflows: emEtfFlow < -500,
    yieldsDropping: treasuryChange < -0.03,
  };

  // Calculate flight index
  let flightScore = 0;
  if (signals.dxyRising) flightScore += 25;
  if (signals.goldRising) flightScore += 25;
  if (signals.emOutflows) flightScore += 25;
  if (signals.yieldsDropping) flightScore += 25;

  // Add partial scores based on magnitude
  flightScore += Math.min(10, Math.max(0, dxyChange * 5));
  flightScore += Math.min(10, Math.max(0, goldChange * 3));
  flightScore += Math.min(10, Math.max(0, -emEtfFlow / 500));
  flightScore += Math.min(10, Math.max(0, -treasuryChange * 50));

  const flightIndex = Math.min(100, Math.max(0, flightScore));

  const getFlightLevel = (index: number): CapitalFlightState['flightLevel'] => {
    if (index >= 80) return 'EXTREME';
    if (index >= 60) return 'HIGH';
    if (index >= 40) return 'ELEVATED';
    if (index >= 20) return 'MODERATE';
    return 'LOW';
  };

  // Capital flight detected if 3+ signals active
  const activeSignals = Object.values(signals).filter(Boolean).length;
  const isFlightDetected = activeSignals >= 3;

  return {
    flightIndex,
    flightLevel: getFlightLevel(flightIndex),
    indicators,
    signals,
    isFlightDetected,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================
// HOOK
// ============================================

function useCapitalFlight() {
  const [state, setState] = useState<CapitalFlightState>({
    flightIndex: 0,
    flightLevel: 'LOW',
    indicators: [],
    signals: {
      dxyRising: false,
      goldRising: false,
      emOutflows: false,
      yieldsDropping: false,
    },
    isFlightDetected: false,
    lastUpdated: '',
    isLoading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await fetchCapitalFlightData();
      setState(prev => ({
        ...prev,
        ...data,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data',
      }));
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [refresh]);

  return { ...state, refresh };
}

// ============================================
// COMPONENTS
// ============================================

const FlightGauge = memo(function FlightGauge({
  value,
  level,
}: {
  value: number;
  level: string;
}) {
  const levelColors = {
    LOW: '#00d68f',
    MODERATE: '#7a8a99',
    ELEVATED: '#A3937B',
    HIGH: '#ff9f43',
    EXTREME: '#ff3b3b',
  };

  const color = levelColors[level as keyof typeof levelColors] || '#7a8a99';

  // SVG arc calculations
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * Math.PI; // Half circle
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg
        height={radius + 20}
        width={radius * 2}
        className="transform"
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius}`}
          fill="none"
          stroke="#1a1c1e"
          strokeWidth={strokeWidth}
        />
        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${radius} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${radius * 2 - strokeWidth / 2} ${radius}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
        />
        
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = (tick / 100) * Math.PI;
          const x1 = radius + (normalizedRadius - 20) * Math.cos(Math.PI - angle);
          const y1 = radius - (normalizedRadius - 20) * Math.sin(Math.PI - angle);
          const x2 = radius + (normalizedRadius - 10) * Math.cos(Math.PI - angle);
          const y2 = radius - (normalizedRadius - 10) * Math.sin(Math.PI - angle);
          
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#3a3a3a"
              strokeWidth={2}
            />
          );
        })}
      </svg>
      
      {/* Center value */}
      <div className="absolute bottom-0 flex flex-col items-center">
        <span 
          className="text-4xl font-mono font-bold"
          style={{ color }}
        >
          {value.toFixed(0)}
        </span>
        <span className="text-[10px] font-mono text-[#6b6b6b] uppercase tracking-wider">
          FLIGHT INDEX
        </span>
      </div>
    </div>
  );
});

const SignalIndicator = memo(function SignalIndicator({
  label,
  active,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 border ${
      active 
        ? 'bg-[rgba(255,59,59,0.1)] border-[rgba(255,59,59,0.3)]' 
        : 'bg-[rgba(255,255,255,0.02)] border-transparent'
    }`}>
      <Icon className={`w-4 h-4 ${active ? 'text-[#ff3b3b]' : 'text-[#6b6b6b]'}`} />
      <span className={`text-xs font-mono uppercase ${active ? 'text-[#ff3b3b]' : 'text-[#6b6b6b]'}`}>
        {label}
      </span>
      <div className={`w-2 h-2 rounded-full ml-auto ${active ? 'bg-[#ff3b3b] animate-pulse' : 'bg-[#2a2a2a]'}`} />
    </div>
  );
});

const IndicatorRow = memo(function IndicatorRow({
  indicator,
}: {
  indicator: CapitalFlightIndicator;
}) {
  const signalColors = {
    BULLISH: 'text-[#ff9f43]',
    BEARISH: 'text-[#00d68f]',
    NEUTRAL: 'text-[#7a8a99]',
  };

  const formatValue = (name: string, value: number) => {
    if (name.includes('USD') || name.includes('DXY')) return value.toFixed(2);
    if (name.includes('Gold')) return `$${value.toFixed(0)}`;
    if (name.includes('Treasury')) return `${value.toFixed(2)}%`;
    if (name.includes('Flow')) return `${value >= 0 ? '+' : ''}${(value / 1000).toFixed(1)}B`;
    return value.toFixed(2);
  };

  return (
    <div className="flex items-center gap-4 py-2 px-3 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-colors">
      <div className="flex-1">
        <div className="text-xs font-mono text-white">{indicator.name}</div>
        <div className="text-[9px] font-mono text-[#6b6b6b]">{indicator.description}</div>
      </div>
      
      <div className="text-right">
        <div className="text-sm font-mono font-bold text-white">
          {formatValue(indicator.name, indicator.value)}
        </div>
        <div className={`flex items-center gap-1 justify-end ${indicator.change24h >= 0 ? 'text-[#00d68f]' : 'text-[#ff3b3b]'}`}>
          {indicator.change24h >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span className="text-[10px] font-mono">
            {indicator.change24h >= 0 ? '+' : ''}{indicator.change24h.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className={`text-[9px] font-mono uppercase px-2 py-1 ${signalColors[indicator.signal]} bg-[rgba(255,255,255,0.05)]`}>
        {indicator.signal}
      </div>
    </div>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

export const CapitalFlightDetector = memo(function CapitalFlightDetector() {
  const {
    flightIndex,
    flightLevel,
    indicators,
    signals,
    isFlightDetected,
    lastUpdated,
    isLoading,
    error,
    refresh,
  } = useCapitalFlight();

  const levelColors = {
    LOW: '#00d68f',
    MODERATE: '#7a8a99',
    ELEVATED: '#A3937B',
    HIGH: '#ff9f43',
    EXTREME: '#ff3b3b',
  };

  return (
    <div className={`bg-[#0f1113] border p-6 ${
      isFlightDetected 
        ? 'border-[#ff3b3b] ios-crisis-pulse' 
        : 'border-[rgba(163,147,123,0.08)]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#A3937B]" />
          <div>
            <h2 className="text-lg font-mono font-bold text-white uppercase tracking-wider">
              Capital Flight Detector
            </h2>
            <p className="text-xs font-mono text-[#6b6b6b]">
              Early warning system for crisis capital movement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] font-mono text-[#6b6b6b]">
              {new Date(lastUpdated).toLocaleTimeString('en-US', { hour12: false })}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-2 rounded hover:bg-[rgba(163,147,123,0.08)] transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-[#A3937B] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-[rgba(255,59,59,0.1)] border border-[rgba(255,59,59,0.3)]">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#ff3b3b]" />
            <span className="text-xs font-mono text-[#ff3b3b]">{error}</span>
          </div>
        </div>
      )}

      {/* Flight Alert Banner */}
      {isFlightDetected && (
        <div className="mb-6 p-4 bg-[rgba(255,59,59,0.1)] border border-[rgba(255,59,59,0.3)]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ff3b3b] animate-pulse" />
            <div>
              <span className="text-sm font-mono font-bold text-[#ff3b3b] uppercase">
                CAPITAL FLIGHT DETECTED
              </span>
              <p className="text-xs font-mono text-[#ff9f43]">
                Multiple indicators suggest institutional capital movement to safe havens
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Gauge & Level */}
        <div className="flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="w-40 h-24 ios-skeleton" />
          ) : (
            <>
              <FlightGauge value={flightIndex} level={flightLevel} />
              
              <div 
                className="mt-4 px-4 py-2 border"
                style={{ 
                  backgroundColor: `${levelColors[flightLevel]}15`,
                  borderColor: `${levelColors[flightLevel]}40`,
                }}
              >
                <span 
                  className="text-sm font-mono font-bold uppercase tracking-wider"
                  style={{ color: levelColors[flightLevel] }}
                >
                  {flightLevel} RISK
                </span>
              </div>

              {/* Signal Grid */}
              <div className="mt-6 w-full grid grid-cols-2 gap-2">
                <SignalIndicator label="DXY Rising" active={signals.dxyRising} icon={DollarSign} />
                <SignalIndicator label="Gold Rising" active={signals.goldRising} icon={Coins} />
                <SignalIndicator label="EM Outflows" active={signals.emOutflows} icon={Globe2} />
                <SignalIndicator label="Yields Drop" active={signals.yieldsDropping} icon={BarChart3} />
              </div>
            </>
          )}
        </div>

        {/* Right: Indicators List */}
        <div>
          <h3 className="text-xs font-mono text-[#7a8a99] uppercase tracking-wider mb-3">
            Market Indicators
          </h3>
          
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-14 ios-skeleton" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {indicators.map((indicator) => (
                <IndicatorRow key={indicator.name} indicator={indicator} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CapitalFlightDetector;
