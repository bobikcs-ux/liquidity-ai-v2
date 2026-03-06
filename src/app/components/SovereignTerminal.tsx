'use client';

/**
 * Sovereign Intelligence Terminal
 * Premium risk intelligence dashboard with "Sovereign" aesthetic
 * Black background, gold accents, rounded-none corners
 */

import React, { useState, useCallback, memo } from 'react';
import { 
  AlertTriangle, 
  Activity, 
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Zap,
  RefreshCw,
  Bell,
  CheckCircle,
  Check,
  Crown,
  Database,
  Radio,
  Loader2,
  Globe,
  X,
  DollarSign,
  Fuel,
  Bitcoin,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { useSovereignIntelligence, getSRIColor, getAlertLevelColor, getRegimeColor } from '../hooks/useSovereignIntelligence';
import type { SovereignView, SovereignRiskSignal } from '../types/sovereign';
import { BRICSWidget } from './BRICSWidget';
import { JapanMacroWidget } from './JapanMacroWidget';
import { IndiaFiscalWidget } from './IndiaFiscalWidget';
import { EuropeWidget } from './EuropeWidget';
import { AustraliaWidget } from './AustraliaWidget';

// ============================================================================
// SAFE ICON COMPONENT - Prevents UI crash if icon is missing
// ============================================================================
interface SafeIconProps {
  icon?: LucideIcon | null;
  className?: string;
  fallback?: React.ReactNode;
}

const SafeIcon: React.FC<SafeIconProps> = ({ icon: Icon, className = '', fallback = null }) => {
  if (!Icon) return <span className={className}>{fallback}</span>;
  return <Icon className={className} />;
};

// ============================================================================
// SOVEREIGN DESIGN TOKENS
// ============================================================================
const SOVEREIGN = {
  bg: {
    primary: 'bg-black',
    secondary: 'bg-zinc-950',
    tertiary: 'bg-zinc-900',
    card: 'bg-zinc-900/50',
  },
  border: {
    primary: 'border-[#A3937B]/20',
    secondary: 'border-zinc-800',
    accent: 'border-[#B8A892]',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-zinc-400',
    accent: 'text-[#A3937B]',
    gold: 'text-[#B8A892]',
  },
  accent: {
    gold: 'bg-[#A3937B]',
    goldMuted: 'bg-[#A3937B]/15',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const SovereignHeader = memo(function SovereignHeader({
  regime,
  alertLevel,
  isConnected,
  lastUpdate,
  onRefresh,
  loading,
}: {
  regime: string;
  alertLevel: string;
  isConnected: boolean;
  lastUpdate: string | null;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className={`${SOVEREIGN.bg.secondary} border-b ${SOVEREIGN.border.primary} px-6 py-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${isConnected ? 'bg-[#A3937B]' : 'bg-red-500'} rounded-none animate-pulse`} />
            <span className={`text-xs font-mono tracking-widest ${SOVEREIGN.text.accent}`}>
              SOVEREIGN INTELLIGENCE TERMINAL
            </span>
          </div>
          <div className={`px-3 py-1 text-xs font-mono tracking-wider border rounded-none ${getAlertLevelColor(alertLevel)}`}>
            {alertLevel} ALERT
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Radio className={`w-3 h-3 ${isConnected ? 'text-[#A3937B] animate-pulse' : 'text-zinc-600'}`} />
            <span className={`text-xs font-mono ${SOVEREIGN.text.secondary}`}>
              {isConnected ? 'REALTIME' : 'OFFLINE'}
            </span>
          </div>
          
          {lastUpdate && (
            <span className={`text-xs font-mono ${SOVEREIGN.text.secondary}`}>
              {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`p-2 rounded-none border ${SOVEREIGN.border.secondary} hover:border-[#A3937B]/30 transition-colors`}
          >
            <RefreshCw className={`w-4 h-4 ${SOVEREIGN.text.accent} ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
});

const SRIGauge = memo(function SRIGauge({
  score,
  regime,
  components,
}: {
  score: number;
  regime: string;
  components: { liquidityScore: number; energyScore: number; cryptoScore: number; macroScore: number };
}) {
  return (
    <div className={`${SOVEREIGN.bg.card} border ${SOVEREIGN.border.primary} rounded-none p-6`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-xs font-mono tracking-widest ${SOVEREIGN.text.accent}`}>
          SOVEREIGN RISK INDEX
        </h3>
        <span className={`text-xs font-mono ${getRegimeColor(regime)}`}>
          {regime}
        </span>
      </div>
      
      {/* Main SRI Score */}
      <div className="text-center mb-8">
        <div className={`text-7xl font-bold tabular-nums tracking-tight ${getSRIColor(score)}`}>
          {score}
        </div>
        <div className={`text-xs font-mono ${SOVEREIGN.text.secondary} mt-2`}>
          COMPOSITE SCORE
        </div>
      </div>
      
      {/* Component Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'LIQUIDITY', value: components.liquidityScore, icon: DollarSign },
          { label: 'ENERGY', value: components.energyScore, icon: Fuel },
          { label: 'CRYPTO', value: components.cryptoScore, icon: Activity },
          { label: 'MACRO', value: components.macroScore, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${SOVEREIGN.bg.tertiary} rounded-none p-3 border ${SOVEREIGN.border.secondary}`}>
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-3 h-3 ${SOVEREIGN.text.accent}`} />
              <span className={`text-lg font-bold tabular-nums ${getSRIColor(value)}`}>{value}</span>
            </div>
            <div className={`text-xs font-mono tracking-wider ${SOVEREIGN.text.secondary}`}>
              {label}
            </div>
            {/* Progress bar */}
            <div className={`h-1 ${SOVEREIGN.bg.secondary} rounded-none mt-2 overflow-hidden`}>
              <div
                className={`h-full transition-all duration-500 ${
                  value >= 60 ? 'bg-red-500' : value >= 40 ? 'bg-[#A3937B]' : 'bg-green-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const FlowSignalBanner = memo(function FlowSignalBanner({
  signal,
}: {
  signal: { type: string; confidence: number; description: string; triggers: string[] } | null;
}) {
  if (!signal) return null;
  
  const isWarning = signal.type === 'INFLOW_COMMODITIES' || signal.type === 'OUTFLOW_RISK';
  
  return (
    <div className={`border-2 rounded-none p-4 ${
      isWarning 
        ? 'border-amber-500 bg-[#A3937B]/10' 
        : 'border-green-500 bg-green-500/10'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-none ${isWarning ? 'bg-[#A3937B]/20' : 'bg-green-500/20'}`}>
          <AlertTriangle className={`w-5 h-5 ${isWarning ? 'text-[#A3937B]' : 'text-green-500'}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-bold tracking-wide ${isWarning ? 'text-[#B8A892]' : 'text-green-400'}`}>
              {signal.description}
            </h4>
            <span className={`text-xs font-mono px-2 py-1 rounded-none ${
              isWarning ? 'bg-[#A3937B]/20 text-[#B8A892]' : 'bg-green-500/20 text-green-400'
            }`}>
              {signal.confidence}% CONFIDENCE
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(signal.triggers || []).map((trigger, i) => (
              <span key={i} className={`text-xs font-mono px-2 py-1 rounded-none ${SOVEREIGN.bg.tertiary} ${SOVEREIGN.text.secondary}`}>
                {trigger}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

const SignalsPanel = memo(function SignalsPanel({
  signals,
  onAcknowledge,
}: {
  signals: SovereignRiskSignal[];
  onAcknowledge: (id: string) => void;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-500 border-red-500/50 bg-red-500/10';
      case 'HIGH': return 'text-[#A3937B] border-[#A3937B]/30 bg-[#A3937B]/10';
      case 'MEDIUM': return 'text-[#B8A892] border-[#B8A892]/50 bg-[#B8A892]/10';
      default: return 'text-green-500 border-green-500/50 bg-green-500/10';
    }
  };
  
  return (
    <div className={`${SOVEREIGN.bg.card} border ${SOVEREIGN.border.primary} rounded-none p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className={`w-4 h-4 ${SOVEREIGN.text.accent}`} />
          <h3 className={`text-xs font-mono tracking-widest ${SOVEREIGN.text.accent}`}>
            RISK SIGNALS
          </h3>
        </div>
        <span className={`text-xs font-mono px-2 py-1 rounded-none ${SOVEREIGN.bg.tertiary} ${SOVEREIGN.text.secondary}`}>
          {signals.filter(s => !s.acknowledged).length} ACTIVE
        </span>
      </div>
      
      <div className="space-y-3 max-h-auto md:max-h-[400px] overflow-y-auto">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`p-3 rounded-none border transition-all ${
              signal.acknowledged ? 'opacity-50' : ''
            } ${getSeverityColor(signal.severity)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded-none border ${getSeverityColor(signal.severity)}`}>
                    {signal.severity}
                  </span>
                  <span className={`text-xs font-mono ${SOVEREIGN.text.secondary}`}>
                    {signal.signal_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <h4 className={`text-sm font-medium ${SOVEREIGN.text.primary} truncate`}>
                  {signal.title}
                </h4>
                <p className={`text-xs ${SOVEREIGN.text.secondary} mt-1 line-clamp-2`}>
                  {signal.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {(signal.data_sources || []).map((source) => (
                    <span key={source} className={`text-xs font-mono px-1.5 py-0.5 rounded-none ${SOVEREIGN.bg.tertiary} ${SOVEREIGN.text.secondary}`}>
                      {source}
                    </span>
                  ))}
                  <span className={`text-xs font-mono ${SOVEREIGN.text.secondary}`}>
                    {new Date(signal.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              {!signal.acknowledged && (
                <button
                  onClick={() => onAcknowledge(signal.id)}
                  className={`p-1.5 rounded-none border ${SOVEREIGN.border.secondary} hover:border-[#A3937B]/30 transition-colors`}
                >
                  <Check className={`w-3 h-3 ${SOVEREIGN.text.accent}`} />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {signals.length === 0 && (
          <div className={`text-center py-8 ${SOVEREIGN.text.secondary}`}>
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-mono">NO ACTIVE SIGNALS</p>
          </div>
        )}
      </div>
    </div>
  );
});

const CorrelationMatrix = memo(function CorrelationMatrix({
  matrix,
}: {
  matrix: { oilVsLiquidity: number; gasVsCrypto: number; yieldVsEnergy: number } | null;
}) {
  if (!matrix) return null;
  
  const getCorrelationColor = (value: number) => {
    if (value < -0.3) return 'text-red-500 bg-red-500/20';
    if (value < 0) return 'text-[#A3937B] bg-[#A3937B]/20';
    if (value < 0.3) return 'text-[#B8A892] bg-[#B8A892]/20';
    return 'text-green-500 bg-green-500/20';
  };
  
  return (
    <div className={`${SOVEREIGN.bg.card} border ${SOVEREIGN.border.primary} rounded-none p-4`}>
      <div className="flex items-center gap-2 mb-4">
        <Database className={`w-4 h-4 ${SOVEREIGN.text.accent}`} />
        <h3 className={`text-xs font-mono tracking-widest ${SOVEREIGN.text.accent}`}>
          CORRELATION MATRIX
        </h3>
      </div>
      
      <div className="space-y-3">
        {[
          { label: 'OIL / LIQUIDITY', value: matrix.oilVsLiquidity },
          { label: 'GAS / CRYPTO', value: matrix.gasVsCrypto },
          { label: 'YIELD / ENERGY', value: matrix.yieldVsEnergy },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className={`text-xs font-mono ${SOVEREIGN.text.secondary}`}>{label}</span>
            <span className={`text-sm font-mono px-2 py-1 rounded-none ${getCorrelationColor(value)}`}>
              {value > 0 ? '+' : ''}{value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

const MarketPulseMetrics = memo(function MarketPulseMetrics({
  pulse,
}: {
  pulse: {
    liquidity_momentum: number;
    energy_pressure: number;
    crypto_stress: number;
    macro_tension: number;
  } | null;
}) {
  if (!pulse) return null;
  
  const getMetricIcon = (value: number) => value > 0 ? TrendingUp : TrendingDown;
  const getMetricColor = (value: number, isInverse: boolean = false) => {
    const adjusted = isInverse ? -value : value;
    if (adjusted > 20) return 'text-red-500';
    if (adjusted > 0) return 'text-[#A3937B]';
    return 'text-green-500';
  };
  
  return (
    <div className={`${SOVEREIGN.bg.card} border ${SOVEREIGN.border.primary} rounded-none p-4`}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className={`w-4 h-4 ${SOVEREIGN.text.accent}`} />
        <h3 className={`text-xs font-mono tracking-widest ${SOVEREIGN.text.accent}`}>
          MARKET PULSE
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'LIQUIDITY', value: pulse.liquidity_momentum, isInverse: true },
          { label: 'ENERGY', value: pulse.energy_pressure, isInverse: false },
          { label: 'CRYPTO', value: pulse.crypto_stress, isInverse: false },
          { label: 'MACRO', value: pulse.macro_tension, isInverse: false },
        ].map(({ label, value, isInverse }) => {
          const Icon = getMetricIcon(isInverse ? -value : value);
          return (
            <div key={label} className={`${SOVEREIGN.bg.tertiary} rounded-none p-3 border ${SOVEREIGN.border.secondary}`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono ${SOVEREIGN.text.secondary}`}>{label}</span>
                <Icon className={`w-3 h-3 ${getMetricColor(value, isInverse)}`} />
              </div>
              <div className={`text-xl font-bold tabular-nums mt-1 ${getMetricColor(value, isInverse)}`}>
                {value > 0 ? '+' : ''}{value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SovereignTerminal = memo(function SovereignTerminal() {
  const {
    currentPulse,
    recentSignals,
    correlationMatrix,
    flowSignal,
    isConnected,
    lastUpdate,
    loading,
    error,
    acknowledgeSignal,
    refresh,
  } = useSovereignIntelligence();

  if (loading && !currentPulse) {
    return (
      <div className={`min-h-screen ${SOVEREIGN.bg.primary} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`w-12 h-12 ${SOVEREIGN.text.accent} animate-spin mx-auto mb-4`} />
          <p className={`text-sm font-mono ${SOVEREIGN.text.secondary}`}>
            INITIALIZING SOVEREIGN INTELLIGENCE...
          </p>
        </div>
      </div>
    );
  }

  const sri = currentPulse?.sri_score ?? 0;
  const regime = currentPulse?.regime ?? 'EXPANSION';
  const alertLevel = currentPulse?.alert_level ?? 'GREEN';

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden ${SOVEREIGN.bg.primary}`}>
      {/* Header */}
      <SovereignHeader
        regime={regime}
        alertLevel={alertLevel}
        isConnected={isConnected}
        lastUpdate={lastUpdate}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Main Content */}
      <div className="p-6">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 rounded-none">
            <div className="flex items-center gap-3">
              <X className="w-5 h-5 text-red-500" />
              <p className={`text-sm ${SOVEREIGN.text.primary}`}>{error}</p>
            </div>
          </div>
        )}

        {/* Flow Signal Banner */}
        {flowSignal && (
          <div className="mb-6">
            <FlowSignalBanner signal={flowSignal} />
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - SRI Gauge */}
          <div className="lg:col-span-1">
            <SRIGauge
              score={sri}
              regime={regime}
              components={currentPulse ? {
                liquidityScore: Math.round(100 - Math.abs(currentPulse.liquidity_momentum)),
                energyScore: currentPulse.energy_pressure,
                cryptoScore: currentPulse.crypto_stress,
                macroScore: currentPulse.macro_tension,
              } : { liquidityScore: 0, energyScore: 0, cryptoScore: 0, macroScore: 0 }}
            />
          </div>

          {/* Middle Column - Signals */}
          <div className="lg:col-span-1">
            <SignalsPanel
              signals={recentSignals}
              onAcknowledge={acknowledgeSignal}
            />
          </div>

          {/* Right Column - Metrics */}
          <div className="lg:col-span-1 space-y-6">
            <MarketPulseMetrics pulse={currentPulse} />
            <CorrelationMatrix matrix={correlationMatrix} />
          </div>
        </div>

        {/* BRICS Intelligence Layer */}
        <div className="mt-8 pt-8 border-t border-[#A3937B]/15">
          <BRICSWidget />
        </div>

        {/* Asian Intelligence Layer - Japan & India */}
        <div className="mt-8 pt-8 border-t border-[#A3937B]/15">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-500 rounded-none flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">ASIAN INTELLIGENCE LAYER</h3>
              <p className="text-xs text-gray-500 font-mono">Japan e-Stat // India GST Portal</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <JapanMacroWidget />
            <IndiaFiscalWidget />
          </div>
        </div>

        {/* Western Intelligence Layer - Europe & Australia */}
        <div className="mt-8 pt-8 border-t border-[#A3937B]/15">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-500 rounded-none flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">WESTERN INTELLIGENCE LAYER</h3>
              <p className="text-xs text-gray-500 font-mono">Eurostat // RBA // ABS Data</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EuropeWidget />
            <AustraliaWidget />
          </div>
        </div>
      </div>
    </div>
  );
});

export default SovereignTerminal;
