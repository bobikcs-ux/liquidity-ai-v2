'use client';

/**
 * Triad Intelligence Dashboard
 * Predictive geopolitical-financial intelligence system
 * Bloomberg Terminal + Stratfor Intelligence + Military Situation Room
 */

import React, { memo, useMemo, useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Activity,
  Globe,
  Anchor,
  Radio,
  RefreshCw,
  Download,
  Cpu,
  Shield,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Ship,
  Target,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Percent,
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
import { useTriadIntelligence, useDataFreshness } from '../hooks/useTriadIntelligence';
import { CapitalFlightDetector } from './CapitalFlightDetector';
import type {
  LiquidityStressData,
  ConflictRadarData,
  ChokepointMonitorData,
  SystemicRiskAssessment,
  CurrencyVolatilityCell,
  ConflictHotspot,
  ChokepointData,
  FreightRateData,
} from '../types/triad';

// ============================================
// TOP STATUS BAR
// ============================================

const TopStatusBar = memo(function TopStatusBar({
  systemStatus,
  dataSyncIndicator,
  aiMode,
  lastUpdate,
  alertLevel,
  onRefresh,
  onExport,
}: {
  systemStatus: string;
  dataSyncIndicator: string;
  aiMode: string;
  lastUpdate: string;
  alertLevel: string;
  onRefresh: () => void;
  onExport: () => void;
}) {
  const alertColors = {
    GREEN: 'bg-[#00d68f]',
    YELLOW: 'bg-[#A3937B]',
    ORANGE: 'bg-[#ff9f43]',
    RED: 'bg-[#ff3b3b]',
  };

  const statusColors = {
    ONLINE: 'text-[#00d68f]',
    DEGRADED: 'text-[#ff9f43]',
    OFFLINE: 'text-[#ff3b3b]',
  };

  const syncColors = {
    SYNCED: 'text-[#00d68f]',
    SYNCING: 'text-[#A3937B]',
    STALE: 'text-[#ff9f43]',
  };

  const aiModeColors = {
    PASSIVE: 'text-[#7a8a99]',
    ACTIVE: 'text-[#A3937B]',
    ALERT: 'text-[#ff3b3b]',
  };

  const formattedTime = lastUpdate 
    ? new Date(lastUpdate).toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#0f1113] border-b border-[rgba(163,147,123,0.08)]">
      <div className="flex items-center gap-6">
        {/* Alert Level Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${alertColors[alertLevel as keyof typeof alertColors]} ${alertLevel === 'RED' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-mono text-[#a0a0a0] uppercase tracking-wider">DEFCON</span>
        </div>

        {/* System Status */}
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${statusColors[systemStatus as keyof typeof statusColors]}`} />
          <span className={`text-xs font-mono uppercase ${statusColors[systemStatus as keyof typeof statusColors]}`}>
            {systemStatus}
          </span>
        </div>

        {/* Data Sync */}
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${syncColors[dataSyncIndicator as keyof typeof syncColors]} ${dataSyncIndicator === 'SYNCING' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-mono uppercase ${syncColors[dataSyncIndicator as keyof typeof syncColors]}`}>
            {dataSyncIndicator}
          </span>
        </div>

        {/* AI Mode */}
        <div className="flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${aiModeColors[aiMode as keyof typeof aiModeColors]}`} />
          <span className={`text-xs font-mono uppercase ${aiModeColors[aiMode as keyof typeof aiModeColors]}`}>
            AI: {aiMode}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Last Update */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#6b6b6b]" />
          <span className="text-xs font-mono text-[#a0a0a0]">{formattedTime}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="p-2 rounded hover:bg-[rgba(163,147,123,0.08)] transition-colors"
          aria-label="Refresh data"
        >
          <RefreshCw className="w-4 h-4 text-[#A3937B]" />
        </button>

        {/* Export Button */}
        <button
          onClick={onExport}
          aria-label="Export dashboard snapshot"
          className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(163,147,123,0.08)] border border-[rgba(212,175,55,0.2)] text-[#A3937B] text-xs font-mono uppercase tracking-wider hover:bg-[rgba(212,175,55,0.2)] transition-colors"
        >
          <Download className="w-3 h-3" />
          EXPORT
        </button>
      </div>
    </div>
  );
});

// ============================================
// LIQUIDITY STRESS ENGINE PANEL
// ============================================

const LiquidityStressPanel = memo(function LiquidityStressPanel({
  data,
}: {
  data: LiquidityStressData | null;
}) {
  if (!data) {
    return <PanelSkeleton title="LIQUIDITY STRESS ENGINE" />;
  }

  const stressColors = {
    NORMAL: '#00d68f',
    ELEVATED: '#A3937B',
    WARNING: '#ff9f43',
    CRITICAL: '#ff3b3b',
  };

  const stressColor = stressColors[data.stressLevel];

  return (
    <div className="bg-[#0f1113] border border-[rgba(163,147,123,0.08)] p-4 ios-hover-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#A3937B]" />
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Liquidity Stress Engine
          </h3>
        </div>
        {data.isStale && <StaleIndicator />}
      </div>

      {/* Stress Index Display */}
      <div className="mb-6">
        <div className="flex items-baseline gap-3">
          <span 
            className="text-4xl font-mono font-bold"
            style={{ color: stressColor }}
          >
            {data.stressIndex.toFixed(2)}σ
          </span>
          <span 
            className="text-sm font-mono uppercase tracking-wider"
            style={{ color: stressColor }}
          >
            {data.stressLevel}
          </span>
        </div>
        
        {/* Threshold Bar */}
        <div className="mt-3 h-2 bg-[#1a1c1e] relative">
          <div 
            className="absolute top-0 left-0 h-full transition-all duration-500"
            style={{ 
              width: `${Math.min(100, (data.stressIndex / 2) * 100)}%`,
              backgroundColor: stressColor,
            }}
          />
          {/* Threshold markers */}
          <div className="absolute top-0 h-full w-px bg-[#A3937B]" style={{ left: '60%' }} />
          <div className="absolute top-0 h-full w-px bg-[#ff3b3b]" style={{ left: '80%' }} />
        </div>
        <div className="flex justify-between mt-1 text-xs font-mono text-[#6b6b6b]">
          <span>0σ</span>
          <span>1.2σ</span>
          <span>1.6σ</span>
          <span>2σ</span>
        </div>
      </div>

      {/* Currency Volatility Heatmap */}
      <div className="mb-4">
        <h4 className="text-xs font-mono text-[#7a8a99] uppercase mb-2">Currency Volatility</h4>
        <div className="grid grid-cols-7 gap-1">
          {(data.currencyVolatility || []).map((cell) => (
            <VolatilityCell key={cell.pair} cell={cell} />
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricBox label="WALCL Δ30d" value={`${data.fred?.walcl_30d_change?.toFixed(1) ?? '--'}%`} trend={data.fred?.walcl_30d_change < 0 ? 'down' : 'up'} />
        <MetricBox label="DXY" value={data.fred?.dxy?.toFixed(1) ?? '--'} />
        <MetricBox label="EUR/USD" value={data.fred?.eurusd?.toFixed(4) ?? '--'} />
        <MetricBox label="USD/JPY Vol" value={`${data.fred?.usdjpy_volatility_7d?.toFixed(2) ?? '--'}%`} />
      </div>
    </div>
  );
});

const VolatilityCell = memo(function VolatilityCell({ cell }: { cell: CurrencyVolatilityCell }) {
  const colors = {
    LOW: '#1a1c1e',
    MEDIUM: '#2a3a2a',
    HIGH: '#4a3a2a',
    EXTREME: '#4a2a2a',
  };

  return (
    <div 
      className="aspect-square flex items-center justify-center text-[8px] font-mono border border-zinc-800/30"
      style={{ backgroundColor: colors[cell.level] }}
      title={`${cell.pair}: ${cell.volatility.toFixed(2)}%`}
    >
      <span className="text-zinc-400">{cell.pair.split('/')[0]}</span>
    </div>
  );
});

// ============================================
// GLOBAL CONFLICT RADAR PANEL
// ============================================

const ConflictRadarPanel = memo(function ConflictRadarPanel({
  data,
}: {
  data: ConflictRadarData | null;
}) {
  if (!data) {
    return <PanelSkeleton title="GLOBAL CONFLICT RADAR" />;
  }

  return (
    <div className="bg-[#0f1113] border border-[rgba(163,147,123,0.08)] p-4 ios-hover-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-[#ff9f43]" />
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Global Conflict Radar
          </h3>
        </div>
        {data.alertTriggered && (
          <div className="flex items-center gap-1 px-2 py-1 bg-[rgba(255,59,59,0.2)] border border-[rgba(255,59,59,0.3)]">
            <AlertTriangle className="w-3 h-3 text-[#ff3b3b]" />
            <span className="text-xs font-mono text-[#ff3b3b] uppercase">ALERT</span>
          </div>
        )}
      </div>

      {/* World Map with Hotspots (Simplified) */}
      <div className="relative h-40 mb-4 bg-[#0a0a0a] border border-zinc-800/30 overflow-hidden">
        <div className="absolute inset-0 ios-grid-overlay opacity-30" />
        
        {/* Hotspot dots */}
        {(data.hotspots || []).map((hotspot) => (
          <HotspotDot key={hotspot.region} hotspot={hotspot} />
        ))}

        {/* Map label */}
        <div className="absolute bottom-2 right-2 text-[8px] font-mono text-[#6b6b6b]">
          ACLED DATA FEED
        </div>
      </div>

      {/* Escalation Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricBox 
          label="Max Escalation 24h" 
          value={`${data.maxEscalation24h?.toFixed(0) ?? '--'}%`} 
          alert={(data.maxEscalation24h ?? 0) > 25}
        />
        <MetricBox 
          label="Max Escalation 72h" 
          value={`${data.maxEscalation72h?.toFixed(0) ?? '--'}%`}
          alert={(data.maxEscalation72h ?? 0) > 100}
        />
      </div>

      {/* Hotspot List */}
      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
        {(data.hotspots || [])
          .sort((a, b) => b.intensityScore - a.intensityScore)
          .slice(0, 5)
          .map((hotspot) => (
            <HotspotRow key={hotspot.region} hotspot={hotspot} />
          ))}
      </div>
    </div>
  );
});

const HotspotDot = memo(function HotspotDot({ hotspot }: { hotspot: ConflictHotspot }) {
  // Simplified positioning based on lat/lng
  const left = ((hotspot.longitude + 180) / 360) * 100;
  const top = ((90 - hotspot.latitude) / 180) * 100;

  const alertColors = {
    LOW: '#00d68f',
    MODERATE: '#A3937B',
    HIGH: '#ff9f43',
    CRITICAL: '#ff3b3b',
  };

  const size = Math.min(20, 8 + hotspot.intensityScore / 10);

  return (
    <div
      className="absolute rounded-full animate-pulse"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        width: size,
        height: size,
        backgroundColor: alertColors[hotspot.alertLevel],
        boxShadow: `0 0 ${size}px ${alertColors[hotspot.alertLevel]}`,
        transform: 'translate(-50%, -50%)',
      }}
      title={`${hotspot.displayName}: ${hotspot.intensityScore.toFixed(0)}`}
    />
  );
});

const HotspotRow = memo(function HotspotRow({ hotspot }: { hotspot: ConflictHotspot }) {
  const alertColors = {
    LOW: 'text-[#00d68f]',
    MODERATE: 'text-[#A3937B]',
    HIGH: 'text-[#ff9f43]',
    CRITICAL: 'text-[#ff3b3b]',
  };

  return (
    <div className="flex items-center justify-between py-1.5 px-2 border border-zinc-800/50 border-l-2 border-transparent hover:border-[#A3937B] transition-colors">
      <span className="text-xs font-mono text-white">{hotspot.displayName}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-[#7a8a99]">{hotspot.intensityScore.toFixed(0)}</span>
        <span className={`text-xs font-mono uppercase ${alertColors[hotspot.alertLevel]}`}>
          {hotspot.alertLevel}
        </span>
      </div>
    </div>
  );
});

// ============================================
// CHOKEPOINT MONITOR PANEL
// ============================================

const ChokepointPanel = memo(function ChokepointPanel({
  data,
}: {
  data: ChokepointMonitorData | null;
}) {
  if (!data) {
    return <PanelSkeleton title="CHOKEPOINT MONITOR" />;
  }

  return (
    <div className="bg-[#0f1113] border border-[rgba(163,147,123,0.08)] p-4 ios-hover-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Anchor className="w-5 h-5 text-[#3b82f6]" />
          <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
            Chokepoint Monitor
          </h3>
        </div>
        {data.alertTriggered && (
          <div className="flex items-center gap-1 px-2 py-1 bg-[rgba(255,159,67,0.2)] border border-[rgba(255,159,67,0.3)]">
            <Ship className="w-3 h-3 text-[#ff9f43]" />
            <span className="text-xs font-mono text-[#ff9f43] uppercase">DISRUPTION</span>
          </div>
        )}
      </div>

      {/* Chokepoint Grid */}
      <div className="space-y-2 mb-4">
        {(data.chokepoints || []).map((cp) => (
          <ChokepointRow key={cp.id} chokepoint={cp} />
        ))}
      </div>

      {/* Freight Rates */}
      <div>
        <h4 className="text-xs font-mono text-[#7a8a99] uppercase mb-2">Freight Rates</h4>
        <div className="grid grid-cols-3 gap-2">
          {(data.freightRates || []).map((fr) => (
            <FreightRateBox key={fr.vesselType} data={fr} />
          ))}
        </div>
      </div>
    </div>
  );
});

const ChokepointRow = memo(function ChokepointRow({ chokepoint }: { chokepoint: ChokepointData }) {
  const congestionColors = {
    NORMAL: 'bg-[#00d68f]',
    ELEVATED: 'bg-[#A3937B]',
    HIGH: 'bg-[#ff9f43]',
    CRITICAL: 'bg-[#ff3b3b]',
  };

  return (
    <div className="flex items-center gap-3 py-2 px-2 border border-zinc-800/50">
      <div className={`w-2 h-2 rounded-full ${congestionColors[chokepoint.congestionLevel]}`} />
      <span className="text-xs font-mono text-white flex-1">{chokepoint.displayName}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-mono ${chokepoint.flowDelta < 0 ? 'text-[#ff3b3b]' : 'text-[#00d68f]'}`}>
          {chokepoint.flowDelta > 0 ? '+' : ''}{chokepoint.flowDelta.toFixed(0)}%
        </span>
        {chokepoint.freightSpike > 20 && (
          <TrendingUp className="w-3 h-3 text-[#ff9f43]" />
        )}
      </div>
    </div>
  );
});

const FreightRateBox = memo(function FreightRateBox({ data }: { data: FreightRateData }) {
  const isSpike = data.spike > 20;

  return (
    <div className={`p-2 border border-zinc-800/50 border ${isSpike ? 'border-[rgba(255,159,67,0.3)]' : 'border-transparent'}`}>
      <div className="text-xs font-mono text-[#6b6b6b] uppercase">{data.vesselType}</div>
      <div className={`text-sm font-mono font-bold ${isSpike ? 'text-[#ff9f43]' : 'text-white'}`}>
        +{data.spike.toFixed(0)}%
      </div>
    </div>
  );
});

// ============================================
// CROSS CORRELATION ENGINE (Bottom Panel)
// ============================================

const CorrelationEngine = memo(function CorrelationEngine({
  systemicRisk,
}: {
  systemicRisk: SystemicRiskAssessment | null;
}) {
  if (!systemicRisk) {
    return (
      <div className="bg-[#0f1113] border border-[rgba(163,147,123,0.08)] p-4 ios-skeleton h-32" />
    );
  }

  const riskColors = {
    STABLE: '#00d68f',
    ELEVATED: '#A3937B',
    HIGH: '#ff9f43',
    SYSTEMIC_COLLAPSE: '#ff3b3b',
  };

  const isCollapse = systemicRisk.isSystemicCollapse;

  return (
    <div className={`bg-[#0f1113] border p-4 ${isCollapse ? 'border-[#ff3b3b] ios-crisis-pulse' : 'border-[rgba(163,147,123,0.08)]'}`}>
      <div className="flex items-start gap-6">
        {/* Risk Score Gauge */}
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="#1a1c1e"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={riskColors[systemicRisk.riskLevel]}
                strokeWidth="8"
                strokeDasharray={`${(systemicRisk.riskScore / 100) * 251.2} 251.2`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span 
                className="text-2xl font-mono font-bold"
                style={{ color: riskColors[systemicRisk.riskLevel] }}
              >
                {systemicRisk.riskScore}
              </span>
              <span className="text-[8px] font-mono text-[#6b6b6b] uppercase">RISK</span>
            </div>
          </div>
        </div>

        {/* Triggers & Assessment */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5" style={{ color: riskColors[systemicRisk.riskLevel] }} />
            <span 
              className="text-sm font-mono font-bold uppercase tracking-wider"
              style={{ color: riskColors[systemicRisk.riskLevel] }}
            >
              {systemicRisk.riskLevel.replace('_', ' ')}
            </span>
          </div>

          {/* Trigger Indicators */}
          <div className="flex gap-4 mb-3">
            <TriggerIndicator label="Liquidity" active={systemicRisk.triggers.liquidityStress} />
            <TriggerIndicator label="Conflict" active={systemicRisk.triggers.conflictEscalation} />
            <TriggerIndicator label="Congestion" active={systemicRisk.triggers.chokepointCongestion} />
            <TriggerIndicator label="Freight" active={systemicRisk.triggers.freightSpike} />
          </div>

          {/* AI Assessment */}
          <div className="p-3 border border-zinc-800/50 border border-[rgba(163,147,123,0.08)]">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-3 h-3 text-[#A3937B]" />
              <span className="text-xs font-mono text-[#A3937B] uppercase">AI Assessment</span>
            </div>
            <p className="text-xs font-mono text-[#a0a0a0] leading-relaxed">
              {systemicRisk.aiAssessment}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

const TriggerIndicator = memo(function TriggerIndicator({ 
  label, 
  active 
}: { 
  label: string; 
  active: boolean; 
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-[#ff3b3b]' : 'bg-[#2a2a2a]'}`} />
      <span className={`text-xs font-mono uppercase ${active ? 'text-[#ff3b3b]' : 'text-[#6b6b6b]'}`}>
        {label}
      </span>
    </div>
  );
});

// ============================================
// SHARED COMPONENTS
// ============================================

const MetricBox = memo(function MetricBox({
  label,
  value,
  trend,
  alert,
}: {
  label: string;
  value: string;
  trend?: 'up' | 'down';
  alert?: boolean;
}) {
  return (
    <div className={`p-2 border border-zinc-800/50 border ${alert ? 'border-[rgba(255,59,59,0.3)]' : 'border-transparent'}`}>
      <div className="text-xs font-mono text-[#6b6b6b] uppercase tracking-wider">{label}</div>
      <div className="flex items-center gap-1">
        <span className={`text-sm font-mono font-bold ${alert ? 'text-[#ff3b3b]' : 'text-white'}`}>
          {value}
        </span>
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-[#00d68f]" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-[#ff3b3b]" />}
      </div>
    </div>
  );
});

const StaleIndicator = memo(function StaleIndicator() {
  return (
    <div className="ios-stale-indicator">
      <AlertCircle className="w-3 h-3" />
      STALE
    </div>
  );
});

const PanelSkeleton = memo(function PanelSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-[#0f1113] border border-[rgba(163,147,123,0.08)] p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 ios-skeleton" />
        <span className="text-sm font-mono font-bold text-[#6b6b6b] uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="space-y-3">
        <div className="h-10 ios-skeleton" />
        <div className="h-24 ios-skeleton" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 ios-skeleton" />
          <div className="h-12 ios-skeleton" />
        </div>
      </div>
    </div>
  );
});

// ============================================
// CRISIS CONTROL SYSTEM
// Non-blocking alert banner with control panel
// ============================================

type CrisisMode = 'NORMAL' | 'ACKNOWLEDGED' | 'SUPPRESSED' | 'ANALYSIS';

const CrisisControlSystem = memo(function CrisisControlSystem({
  isSystemicAlert,
  riskLevel,
  riskScore,
}: {
  isSystemicAlert: boolean;
  riskLevel: string;
  riskScore: number;
}) {
  const [mode, setMode] = useState<CrisisMode>('NORMAL');
  const [showControls, setShowControls] = useState(false);

  // Reset mode when alert clears
  useEffect(() => {
    if (!isSystemicAlert && mode !== 'NORMAL') {
      setMode('NORMAL');
    }
  }, [isSystemicAlert, mode]);

  // Determine display state
  const getRiskLevelDisplay = () => {
    if (riskScore < 25) return { level: 'LOW', color: '#2ecc71' };
    if (riskScore < 50) return { level: 'ELEVATED', color: '#A3937B' };
    if (riskScore < 75) return { level: 'HIGH', color: '#ff6b4a' };
    return { level: 'SYSTEMIC', color: '#ff3b5c' };
  };

  const { level, color } = getRiskLevelDisplay();
  const isSuppressed = mode === 'SUPPRESSED';
  const isAnalysis = mode === 'ANALYSIS';

  return (
    <>
      {/* Top Risk Level Bar - Always visible */}
      <div className="sticky top-0 z-40 bg-[#0b0b0f] border-b border-[rgba(163,147,123,0.08)]">
        {/* Animated Risk Level Bar */}
        <div className="h-1 w-full risk-level-bar relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-black/50 transition-all duration-500"
            style={{ width: `${100 - riskScore}%`, right: 0, left: 'auto' }}
          />
        </div>

        {/* Risk Status Row */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#6b6b6b] uppercase tracking-wider">SYSTEMIC RISK LEVEL</span>
              <div className="flex items-center gap-1">
                {['LOW', 'ELEVATED', 'HIGH', 'SYSTEMIC'].map((lvl) => (
                  <span 
                    key={lvl}
                    className={`text-xs font-mono px-2 py-0.5 transition-all ${
                      level === lvl 
                        ? `bg-[${lvl === 'LOW' ? '#2ecc71' : lvl === 'ELEVATED' ? '#A3937B' : lvl === 'HIGH' ? '#ff6b4a' : '#ff3b5c'}]/20 text-[${lvl === 'LOW' ? '#2ecc71' : lvl === 'ELEVATED' ? '#A3937B' : lvl === 'HIGH' ? '#ff6b4a' : '#ff3b5c'}] border border-current`
                        : 'text-[#3a3a3a]'
                    }`}
                    style={level === lvl ? { 
                      backgroundColor: `${color}20`, 
                      color: color,
                      borderColor: `${color}50`
                    } : {}}
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>

            {/* Score Display */}
            <div className="flex items-center gap-2">
              <span 
                className="text-lg font-mono font-bold"
                style={{ color }}
              >
                {riskScore}
              </span>
              <span className="text-xs font-mono text-[#6b6b6b]">/100</span>
            </div>
          </div>

          {/* Mode Indicator */}
          {mode !== 'NORMAL' && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono px-2 py-1 ${
                mode === 'ACKNOWLEDGED' ? 'bg-[#A3937B]/10 text-[#A3937B] border border-[#A3937B]/30' :
                mode === 'SUPPRESSED' ? 'bg-[#6b6b6b]/10 text-[#6b6b6b] border border-[#6b6b6b]/30' :
                'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30'
              }`}>
                {mode} MODE
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Crisis Alert Banner - Only shows when systemic AND not suppressed */}
      {isSystemicAlert && !isSuppressed && (
        <div className={`relative z-30 ${isAnalysis ? 'bg-[#121218]' : 'bg-[#ff3b5c]/10'} border-b ${isAnalysis ? 'border-[#3b82f6]/30' : 'border-[#ff3b5c]/30'} transition-colors`}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${isAnalysis ? 'text-[#3b82f6]' : 'text-[#ff3b5c]'} ${mode === 'NORMAL' ? 'animate-pulse' : ''}`} />
              <span className={`text-sm font-mono font-bold uppercase tracking-wider ${isAnalysis ? 'text-[#3b82f6]' : 'text-[#ff3b5c]'}`}>
                {isAnalysis ? 'ANALYSIS MODE: SYSTEMIC COLLAPSE SCENARIO' : 'SYSTEMIC GLOBAL COLLAPSE RISK DETECTED'}
              </span>
            </div>

            {/* Crisis Control Buttons */}
            <div className="flex items-center gap-2">
              {mode === 'NORMAL' && (
                <>
                  <button
                    onClick={() => setMode('ACKNOWLEDGED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#A3937B]/10 border border-[#A3937B]/30 text-[#A3937B] text-xs font-mono uppercase hover:bg-[#A3937B]/20 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Acknowledge
                  </button>
                  <button
                    onClick={() => setMode('SUPPRESSED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6b6b6b]/10 border border-[#6b6b6b]/30 text-[#6b6b6b] text-xs font-mono uppercase hover:bg-[#6b6b6b]/20 transition-colors"
                  >
                    <Shield className="w-3 h-3" />
                    Suppress
                  </button>
                  <button
                    onClick={() => setMode('ANALYSIS')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6] text-xs font-mono uppercase hover:bg-[#3b82f6]/20 transition-colors"
                  >
                    <Cpu className="w-3 h-3" />
                    Analysis Mode
                  </button>
                </>
              )}
              {mode !== 'NORMAL' && (
                <button
                  onClick={() => setMode('NORMAL')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff3b5c]/10 border border-[#ff3b5c]/30 text-[#ff3b5c] text-xs font-mono uppercase hover:bg-[#ff3b5c]/20 transition-colors"
                >
                  Reset Alert
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Edge Glow Effect - Subtle crisis indication */}
      {isSystemicAlert && !isSuppressed && mode === 'NORMAL' && (
        <div className="fixed inset-0 pointer-events-none z-10 crisis-edge-active" />
      )}
    </>
  );
});

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export const TriadDashboard = memo(function TriadDashboard() {
  const {
    liquidity,
    conflict,
    chokepoints,
    systemicRisk,
    isLoading,
    error,
    refresh,
    exportSnapshot,
    getStatusBarData,
  } = useTriadIntelligence();

  const statusBar = getStatusBarData();

return (
  <div className="min-h-screen bg-[#0b0b0f] ios-terminal">
  {/* Crisis Control System - Non-blocking alert with controls */}
  <CrisisControlSystem 
    isSystemicAlert={systemicRisk?.isSystemicCollapse ?? false}
    riskLevel={systemicRisk?.riskLevel ?? 'STABLE'}
    riskScore={systemicRisk?.riskScore ?? 0}
  />

      {/* Top Status Bar */}
      <TopStatusBar
        {...statusBar}
        onRefresh={refresh}
        onExport={exportSnapshot}
      />

      {/* Main Content */}
      <div className="p-3 md:p-6 space-y-4 md:space-y-6 overflow-x-hidden">
        {/* Dashboard Title */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
          <Globe className="w-5 md:w-6 h-5 md:h-6 text-[#A3937B]" />
          <h1 className="text-base md:text-xl font-mono font-bold text-white uppercase tracking-wider">
            Triad Intelligence
          </h1>
          <span className="text-xs md:text-xs font-mono text-[#6b6b6b]">v1.0</span>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-[rgba(255,59,59,0.1)] border border-[rgba(255,59,59,0.3)]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#ff3b3b]" />
              <span className="text-sm font-mono text-[#ff3b3b]">{error}</span>
            </div>
          </div>
        )}

        {/* Main 3-Panel Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 mobile-stack">
          <LiquidityStressPanel data={liquidity} />
          <ConflictRadarPanel data={conflict} />
          <ChokepointPanel data={chokepoints} />
        </div>

        {/* Cross Correlation Engine */}
        <CorrelationEngine systemicRisk={systemicRisk} />

        {/* Capital Flight Detector */}
        <CapitalFlightDetector />
      </div>
    </div>
  );
});

export default TriadDashboard;
