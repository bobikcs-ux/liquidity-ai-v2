/**
 * AGI DEFENSE INTELLIGENCE TERMINAL
 * 10-Layer Strategic Intelligence System
 * 
 * The main tactical intelligence interface that transitions
 * into a full strategic defense command center.
 */

import React, { useMemo, useEffect, useState } from 'react';
import { Brain, Shield, Activity, Radio, Target, Zap, AlertTriangle, Globe, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { useL1Data } from '../hooks/useL1Data';
import { SovereignIntelligenceNode } from '../components/SovereignIntelligenceNode';
import { DefenseExecutionBrain } from '../components/DefenseExecutionBrain';
import { TacticalRedoutOverlay, useTacticalRedout } from '../components/TacticalRedoutOverlay';
import { L1StatusIndicator } from '../components/L1StatusIndicator';
import { computeAGISystemState, type AGISystemState } from '../services/agiBrainEngine';

// Layer Status Indicator
function LayerStatus({ 
  layer, 
  name, 
  status, 
  value 
}: { 
  layer: string; 
  name: string; 
  status: 'ONLINE' | 'DEGRADED' | 'CRITICAL';
  value?: number;
}) {
  const statusColors = {
    ONLINE: 'bg-green-500',
    DEGRADED: 'bg-amber-500',
    CRITICAL: 'bg-red-500 animate-pulse'
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-black/30 rounded-lg border border-gray-800">
      <div className="text-xs font-mono text-cyan-400 w-6">{layer}</div>
      <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      <div className="flex-1 text-xs font-mono text-gray-400 uppercase truncate">{name}</div>
      {value !== undefined && (
        <div className={`text-xs font-mono font-bold tabular-nums ${
          status === 'CRITICAL' ? 'text-red-400' : 
          status === 'DEGRADED' ? 'text-amber-400' : 'text-green-400'
        }`}>
          {value.toFixed(1)}
        </div>
      )}
    </div>
  );
}

// Nervous System Status Panel
function NervousSystemPanel({ agiState, l1Status }: { agiState: AGISystemState | null; l1Status: string }) {
  const [tick, setTick] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => (t + 1) % 60);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const layers = [
    { layer: 'L10', name: 'CIVILIZATION FORECAST', status: 'ONLINE' as const, value: agiState?.civilization.civilizationScore },
    { layer: 'L9', name: 'GEOECONOMIC WARFARE', status: 'ONLINE' as const },
    { layer: 'L8', name: 'SOVEREIGN POWER', status: 'ONLINE' as const, value: agiState?.sovereign.sovereignPowerIndex },
    { layer: 'L7', name: 'CONFLICT TRANSMISSION', status: 'ONLINE' as const },
    { layer: 'L6', name: 'DEFENSE EXECUTION', status: (agiState?.defense.defenseScore ?? 0) > 0.5 ? 'CRITICAL' as const : 'ONLINE' as const, value: (agiState?.defense.defenseScore ?? 0) * 100 },
    { layer: 'L5', name: 'LIQUIDITY NEURAL', status: agiState?.liquidity.contractionWarning ? 'DEGRADED' as const : 'ONLINE' as const, value: agiState?.liquidity.liquidityBrainIndex },
    { layer: 'L4', name: 'MICROSTRUCTURE', status: 'ONLINE' as const },
    { layer: 'L3', name: 'CROWD PSYCHOLOGY', status: 'ONLINE' as const, value: agiState?.emotion.bubbleRisk },
    { layer: 'L2', name: 'REGIME EVOLUTION', status: 'ONLINE' as const, value: agiState?.regime.regimeSpeed },
    { layer: 'L1', name: 'DATA NERVOUS SYSTEM', status: l1Status === 'LIVE' ? 'ONLINE' as const : l1Status === 'RECONNECTING' ? 'DEGRADED' as const : 'CRITICAL' as const },
  ];

  return (
    <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
            AGI NERVOUS SYSTEM
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">REFRESH: {60 - tick}s</span>
          <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan-500 transition-all"
              style={{ width: `${((60 - tick) / 60) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-1">
        {layers.map((layer, i) => (
          <LayerStatus key={i} {...layer} />
        ))}
      </div>
    </div>
  );
}

// Black Swan War Engine Panel
function BlackSwanWarEngine({ agiState }: { agiState: AGISystemState | null }) {
  const blackSwan = agiState?.blackSwan ?? {
    volatilityShockRate: 0,
    correlationCollapseSpeed: 0,
    liquidityDrainVelocity: 0,
    blackSwanRisk: 0,
    emergencyMode: false
  };

  return (
    <div className={`rounded-xl p-4 border ${
      blackSwan.emergencyMode 
        ? 'bg-red-950/30 border-red-500/50' 
        : 'bg-[#0a0f1a] border-gray-800'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${blackSwan.emergencyMode ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
          <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">
            BLACK SWAN WAR ENGINE
          </span>
        </div>
        {blackSwan.emergencyMode && (
          <span className="text-xs font-bold text-red-500 bg-red-500/20 px-2 py-1 rounded animate-pulse">
            EMERGENCY
          </span>
        )}
      </div>

      <div className="text-center mb-4">
        <div className="text-xs font-mono text-gray-500 uppercase mb-1">RISK INDEX</div>
        <div className={`text-5xl font-black font-mono tabular-nums ${
          blackSwan.blackSwanRisk > 0.8 ? 'text-red-500' :
          blackSwan.blackSwanRisk > 0.5 ? 'text-amber-500' : 'text-green-500'
        }`}>
          {(blackSwan.blackSwanRisk * 100).toFixed(0)}
        </div>
      </div>

      <div className="space-y-2">
        {[
          { label: 'VOL SHOCK', value: blackSwan.volatilityShockRate, weight: '25%' },
          { label: 'CORR COLLAPSE', value: blackSwan.correlationCollapseSpeed, weight: '25%' },
          { label: 'LIQ DRAIN', value: blackSwan.liquidityDrainVelocity, weight: '50%' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500 w-20">{item.label}</span>
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  item.value > 0.7 ? 'bg-red-500' : 
                  item.value > 0.4 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${item.value * 100}%` }}
              />
            </div>
            <span className="text-xs font-mono text-gray-400 w-8 text-right">{item.weight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Market Emotion Panel (L3-L4)
function MarketEmotionPanel({ agiState }: { agiState: AGISystemState | null }) {
  const emotion = agiState?.emotion ?? {
    momentumChasingIntensity: 50,
    socialNarrativeAmplification: 50,
    retailCapitalFlowRate: 50,
    leverageGrowthRate: 50,
    bubbleRisk: 50
  };

  return (
    <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
          CROWD PSYCHOLOGY (L3-L4)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'MOMENTUM', value: emotion.momentumChasingIntensity },
          { label: 'NARRATIVE', value: emotion.socialNarrativeAmplification },
          { label: 'RETAIL FLOW', value: emotion.retailCapitalFlowRate },
          { label: 'LEVERAGE', value: emotion.leverageGrowthRate },
        ].map((item, i) => (
          <div key={i} className="p-2 bg-black/30 rounded-lg">
            <div className="text-xs font-mono text-gray-500 mb-1">{item.label}</div>
            <div className={`text-lg font-bold font-mono tabular-nums ${
              item.value > 70 ? 'text-red-400' : 
              item.value > 50 ? 'text-amber-400' : 'text-green-400'
            }`}>
              {item.value.toFixed(0)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 p-2 bg-purple-950/30 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-purple-400 uppercase">BUBBLE RISK</span>
          <span className={`text-lg font-bold font-mono tabular-nums ${
            emotion.bubbleRisk > 70 ? 'text-red-400' : 
            emotion.bubbleRisk > 50 ? 'text-amber-400' : 'text-green-400'
          }`}>
            {emotion.bubbleRisk.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function AGITerminal() {
  const { uiTheme } = useAdaptiveTheme();
  const { latest: snapshot, loading } = useMarketSnapshot();
  const { data: l1Data, displayValues, status: l1Status, isLoading: l1Loading } = useL1Data();
  const { isEmergencyMode, blackSwanRisk } = useTacticalRedout();
  const [showEmergencyOverlay, setShowEmergencyOverlay] = useState(false);
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  // Compute AGI system state
  const agiState = useMemo(() => {
    if (!snapshot) return null;
    
    return computeAGISystemState({
      survivalProbability: snapshot.survival_probability ?? 0.78,
      systemicRisk: snapshot.systemic_risk ?? 0.35,
      yieldSpread: snapshot.yield_spread ?? -0.23,
      btcVolatility: snapshot.btc_volatility ?? 65,
      balanceSheetDelta: snapshot.balance_sheet_delta ?? -2.3,
      rateShock: snapshot.rate_shock ?? 15
    });
  }, [snapshot]);

  // Auto-show emergency overlay when risk exceeds threshold
  useEffect(() => {
    if (isEmergencyMode && !showEmergencyOverlay) {
      setShowEmergencyOverlay(true);
    }
  }, [isEmergencyMode, showEmergencyOverlay]);

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8 border-b border-cyan-900/30 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-cyan-600 text-white text-xs font-mono font-bold rounded">
                AGI_DEFENSE_v2.0
              </div>
              <div className={`px-2 py-1 text-xs font-mono font-bold rounded ${
                isEmergencyMode ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500/20 text-green-400'
              }`}>
                {isEmergencyMode ? 'EMERGENCY_MODE' : 'OPERATIONAL'}
              </div>
            </div>
            <h1 className={`text-3xl md:text-4xl font-black tracking-tighter uppercase ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="text-cyan-500">AGI</span> DEFENSE INTELLIGENCE TERMINAL
            </h1>
            <p className="text-sm font-mono text-cyan-400/70 uppercase tracking-widest">
              10-Layer Strategic Intelligence Infrastructure
            </p>
          </div>

          {/* Emergency Button */}
          {blackSwanRisk > 0.5 && (
            <button 
              onClick={() => setShowEmergencyOverlay(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-colors ${
                isEmergencyMode 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-amber-500 hover:bg-amber-600 text-black'
              }`}
            >
              <Zap className="w-5 h-5" />
              <span>{isEmergencyMode ? 'VIEW EMERGENCY' : 'VIEW WARNING'}</span>
            </button>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Nervous System + Black Swan */}
          <div className="space-y-6">
            {/* L1 Data Nervous System Status */}
            <L1StatusIndicator showFeeds={true} />
            
            {/* L1 Real-time Data Display */}
            <div className="bg-[#0a0f1a] border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-xs font-mono text-green-400 uppercase tracking-wider">
                  L1 REAL-TIME DATA
                </span>
                <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono ${
                  l1Status === 'LIVE' ? 'bg-green-500/20 text-green-400' :
                  l1Status === 'RECONNECTING' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {l1Status === 'RECONNECTING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                  {l1Status}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-black/30 rounded-lg">
                  <div className="text-xs font-mono text-gray-500 mb-1">YIELD CURVE</div>
                  <div className={`text-sm font-bold font-mono tabular-nums ${
                    displayValues.yieldCurve === 'RECONNECTING...' ? 'text-amber-400 animate-pulse' : 'text-cyan-400'
                  }`}>
                    {displayValues.yieldCurve}
                  </div>
                </div>
                <div className="p-2 bg-black/30 rounded-lg">
                  <div className="text-xs font-mono text-gray-500 mb-1">BTC DOMINANCE</div>
                  <div className={`text-sm font-bold font-mono tabular-nums ${
                    displayValues.btcDominance === 'RECONNECTING...' ? 'text-amber-400 animate-pulse' : 'text-cyan-400'
                  }`}>
                    {displayValues.btcDominance}
                  </div>
                </div>
                <div className="p-2 bg-black/30 rounded-lg">
                  <div className="text-xs font-mono text-gray-500 mb-1">BTC PRICE</div>
                  <div className={`text-sm font-bold font-mono tabular-nums ${
                    displayValues.btcPrice === 'RECONNECTING...' ? 'text-amber-400 animate-pulse' : 'text-white'
                  }`}>
                    {displayValues.btcPrice}
                  </div>
                </div>
                <div className="p-2 bg-black/30 rounded-lg">
                  <div className="text-xs font-mono text-gray-500 mb-1">FEAR/GREED</div>
                  <div className={`text-sm font-bold font-mono tabular-nums ${
                    displayValues.fearGreed === 'RECONNECTING...' ? 'text-amber-400 animate-pulse' : 
                    l1Data?.fearGreedIndex && l1Data.fearGreedIndex < 25 ? 'text-red-400' : 
                    l1Data?.fearGreedIndex && l1Data.fearGreedIndex > 75 ? 'text-green-400' : 'text-amber-400'
                  }`}>
                    {displayValues.fearGreed}
                  </div>
                </div>
              </div>
            </div>
            
            <NervousSystemPanel agiState={agiState} l1Status={l1Status} />
            <BlackSwanWarEngine agiState={agiState} />
            <MarketEmotionPanel agiState={agiState} />
          </div>

          {/* Center + Right - Main Components */}
          <div className="xl:col-span-2 space-y-6">
            {/* Sovereign Intelligence Node (L10-L8) */}
            <SovereignIntelligenceNode />
            
            {/* Defense Execution Brain (L6) */}
            <DefenseExecutionBrain />
          </div>
        </div>

        {/* Footer - System Status */}
        <div className="mt-8 p-4 bg-[#0a0f1a] border border-gray-800 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {l1Status === 'RECONNECTING' ? (
                  <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
                ) : l1Status === 'LIVE' ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-mono ${
                  l1Status === 'LIVE' ? 'text-green-400' : 
                  l1Status === 'RECONNECTING' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  L1 NERVOUS SYSTEM: {l1Status}
                </span>
              </div>
              <div className="text-xs font-mono text-gray-600">|</div>
              <span className="text-xs font-mono text-gray-400">
                LAST UPDATE: {l1Data?.lastUpdate?.toLocaleTimeString() ?? 'RECONNECTING...'}
              </span>
            </div>
            <div className="text-xs font-mono text-gray-500">
              LIQUIDITY.AI // AGI DEFENSE INTELLIGENCE v2.0
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Redout Overlay */}
      {showEmergencyOverlay && (
        <TacticalRedoutOverlay 
          onDismiss={() => setShowEmergencyOverlay(false)}
          forcedMode={blackSwanRisk > 0.8}
        />
      )}
    </>
  );
}
