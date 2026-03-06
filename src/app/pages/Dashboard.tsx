import React from 'react';
import { TrendingUp, AlertTriangle, Activity, DollarSign, ShieldAlert, Cpu } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot, GLOBAL_FEAR_GREED_VALUE, GLOBAL_FEAR_GREED_LABEL } from '../hooks/useMarketSnapshot';
import { AICopilot } from '../components/AICopilot';
import { RiskDefenseAI } from '../components/RiskDefenseAI';
import { ResourceShockEngine } from '../components/ResourceShockEngine';
import { ConflictTransmissionModel } from '../components/ConflictTransmissionModel';
import { EmploymentDisruptionLayer } from '../components/EmploymentDisruptionLayer';
import { NarrativeShockModel } from '../components/NarrativeShockModel';
import { DataSourceStatus } from '../components/DataSourceStatus';
import { BlackSwanDetector } from '../components/BlackSwanDetector';
import { LiquidityTransmission } from '../components/LiquidityTransmission';
import { TerminalEventStream } from '../components/TerminalEventStream';
import { DataIntegrityPanel } from '../components/DataIntegrityPanel';
import { BlackSwanTimeline } from '../components/BlackSwanTimeline';
import { GlobalRiskMeter } from '../components/GlobalRiskMeter';

export function Dashboard() {
  const { currentRegime, uiTheme } = useAdaptiveTheme();
  const { latest: snapshot, loading: snapshotLoading } = useMarketSnapshot();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  // Format values from Supabase snapshot
  const survivalProb = snapshot?.survival_probability != null 
    ? (snapshot.survival_probability > 1 ? snapshot.survival_probability : Math.round(snapshot.survival_probability * 100))
    : 78;
  const yieldSpread = snapshot?.yield_spread?.toFixed(2) ?? '-0.23';
  const btcDominance = snapshot?.btc_dominance?.toFixed(1) ?? '57.4';
  
  const cardStyle = `rounded-xl shadow-sm border p-4 md:p-6 min-h-[260px] w-full max-w-full flex flex-col overflow-hidden transition-all duration-500 ${
    isDark ? 'bg-[#0b0f17] border-[#1f2937]' : 
    isHybrid ? 'bg-[#1e2536] border-gray-700' : 
    'bg-white border-gray-200'
  }`;

  return (
    <div className="space-y-4 md:space-y-6 max-w-6xl mx-auto px-4 py-4 md:py-8">
      
      {/* HEADER SECTION - ПЕРСОНАЛИЗИРАНО ЗАГЛАВИЕ */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6 mb-6 md:mb-10 border-b border-blue-900/30 pb-4 md:pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="px-1.5 py-0.5 bg-blue-600 text-white text-xs font-mono font-bold rounded">
                CORE_SYSTEM_ACTIVE
             </div>
             <div className="text-xs text-slate-300 font-mono tracking-widest uppercase">
                Auth: Admin_Bobikcs
             </div>
          </div>
          <h1 className={`text-2xl md:text-4xl font-black tracking-tighter uppercase italic ${
            isDark || isHybrid ? 'text-white' : 'text-gray-900'
          }`} id="main-heading">
            BOBIKCS <span className="text-blue-500 text-xl md:text-3xl not-italic font-light" aria-hidden="true">//</span> <span className="text-blue-500">INTELLIGENCE TERMINAL</span>
          </h1>
          <p className={`font-mono text-xs tracking-[0.2em] uppercase opacity-70 ${
            isDark || isHybrid ? 'text-blue-300' : 'text-gray-600'
          }`}>
            Advanced Regime Analysis & Risk Mitigation Suite
          </p>
        </div>

        {/* AI STATUS HUD + Data Source Status */}
        <div className="flex items-center gap-4">
          {/* Data Source Status Indicator */}
          <DataSourceStatus />
          
          {/* AI Status */}
          <div className="flex items-center gap-5 bg-blue-950/20 px-5 py-3 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
            <div className="flex flex-col items-end">
              <span className="text-xs text-blue-400 font-mono uppercase leading-none mb-1">Neural Uplink</span>
              <span className="text-sm font-bold text-white tracking-tight uppercase">Copilot Online</span>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border border-blue-500/30 animate-spin-slow absolute"></div>
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Global Risk Meter - Sovereign Risk Index */}
      {(isDark || isHybrid) && (
        <GlobalRiskMeter />
      )}

      {/* Black Swan Early Warning System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <BlackSwanDetector />
        <BlackSwanTimeline />
      </div>
      
      {/* Liquidity Transmission Pipeline */}
      <LiquidityTransmission />
      
      {/* Autonomous Risk Defense AI - Силно визуално предупреждение */}
      {currentRegime.riskLevel >= 60 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-600/50 bg-red-950/10 p-1 animate-in fade-in slide-in-from-top-4 duration-700">
           <RiskDefenseAI />
        </div>
      )}

      {/* SYSTEMIC DRIVERS PANEL - С ДВОЙНИЯ ТЕХНОЛОГИЧЕН ФОН */}
      <section 
        className="rounded-xl md:rounded-3xl p-4 md:p-8 mb-4 md:mb-8 relative border border-blue-500/20 overflow-hidden shadow-2xl"
        style={{
          background: isDark || isHybrid 
            ? 'linear-gradient(135deg, #020617 0%, #081229 100%)' 
            : '#f1f5f9',
        }}
      >
        {/* HUD SCANLINE EFFECT */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0" style={{ backgroundSize: '100% 2px, 3px 100%' }}></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
             <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <ShieldAlert className="w-6 h-6 text-blue-500" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase italic">Systemic Risk Drivers</h2>
                <p className="text-xs font-mono text-blue-400 uppercase">Real-time correlation matrix</p>
             </div>
          </div>

          {/* Responsive 2-column grid with proper gap spacing */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ResourceShockEngine />
            <ConflictTransmissionModel />
            <EmploymentDisruptionLayer />
            <NarrativeShockModel />
          </div>
        </div>
      </section>

      {/* Grid с основните карти (Metrics) - Responsive layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Regime Intelligence Card */}
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-500" aria-hidden="true" />
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              Regime Intelligence
            </h3>
          </div>
          
          <div className="space-y-3 md:space-y-5 flex-1">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 md:p-4">
              <span className="text-xs font-mono text-blue-400 block mb-1 uppercase tracking-tighter">Current Market State</span>
              <div className="text-xl md:text-2xl font-black text-white italic tracking-tight truncate">
                {currentRegime.regime.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className={`p-2 md:p-3 rounded-lg overflow-hidden ${isDark || isHybrid ? 'bg-white/5' : 'bg-gray-100'}`}>
                <div className={`text-xs uppercase font-mono font-medium ${isDark || isHybrid ? 'text-slate-300' : 'text-gray-900'}`}>Confidence</div>
                <div className="text-base md:text-lg font-bold text-green-600 font-mono tabular-nums">{currentRegime.confidence}%</div>
              </div>
              <div className={`p-2 md:p-3 rounded-lg overflow-hidden ${isDark || isHybrid ? 'bg-white/5' : 'bg-gray-100'}`}>
                <div className={`text-xs uppercase font-mono font-medium ${isDark || isHybrid ? 'text-slate-300' : 'text-gray-900'}`}>Risk Level</div>
                <div className={`text-base md:text-lg font-bold font-mono tabular-nums ${currentRegime.riskLevel > 50 ? 'text-red-600' : 'text-green-600'}`}>
                  {currentRegime.riskLevel}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Survival Matrix Card */}
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-green-500" aria-hidden="true" />
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              Survival Matrix
            </h3>
          </div>
          <div className="text-center py-2 md:py-4 flex-1 flex flex-col justify-center">
            <div className={`text-4xl md:text-6xl font-black mb-2 font-mono tabular-nums min-h-[3rem] md:min-h-[4rem] flex items-center justify-center ${
              survivalProb >= 70 ? 'text-green-500' : survivalProb >= 50 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {snapshotLoading ? <span className="inline-block w-16 md:w-20 h-10 md:h-14 bg-gray-700 rounded animate-pulse" /> : `${survivalProb}%`}
            </div>
            <p className={`text-xs font-mono font-medium uppercase ${isDark || isHybrid ? 'text-slate-300' : 'text-gray-900'}`}>30-day horizon survival probability</p>
          </div>
          <select className="w-full bg-slate-950 border border-white/10 text-white rounded-lg p-3 text-xs font-mono uppercase focus:border-blue-500 outline-none">
             <option>BOBIKCS_BALANCED_ALPHA</option>
             <option>TAIL_RISK_PROTECTION</option>
             <option>AGGRESSIVE_GROWTH_v4</option>
          </select>
        </div>

        {/* Macro Engine Card */}
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-5 h-5 text-amber-500" aria-hidden="true" />
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              Macro Snapshot
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'BTC Dominance', val: snapshotLoading ? null : `${btcDominance}%`, trend: parseFloat(btcDominance) > 55 ? 'up' : 'neutral' },
              { label: 'Survival Prob', val: snapshotLoading ? null : `${survivalProb}%`, trend: survivalProb >= 70 ? 'up' : survivalProb >= 50 ? 'neutral' : 'down' },
              { label: 'Yield Curve', val: snapshotLoading ? null : `${yieldSpread}%`, trend: parseFloat(yieldSpread) < 0 ? 'down' : 'up' },
              { label: 'VIX Terminal', val: currentRegime.volatilityIndex, trend: 'neutral' },
            ].map((m, i) => (
              <div key={i} className={`flex justify-between items-end border-b pb-2 min-h-[2rem] ${isDark || isHybrid ? 'border-white/5' : 'border-gray-200'}`}>
                <span className={`text-xs font-mono uppercase ${isDark || isHybrid ? 'text-gray-200' : 'text-gray-900 font-semibold'}`}>{m.label}</span>
                <span className={`text-base font-bold font-mono tabular-nums min-w-[4rem] text-right ${m.trend === 'up' ? 'text-green-600' : m.trend === 'down' ? 'text-red-600' : isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                  {m.val ?? <span className={`inline-block w-12 h-5 rounded animate-pulse ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-300'}`} />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal Event Stream & Data Integrity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <TerminalEventStream maxEvents={8} />
        <DataIntegrityPanel />
      </div>

      {/* Stress signals & AI Copilot Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <div className={cardStyle}>
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Systemic Stress</h3>
              </div>
              <span className="text-xs font-mono text-blue-400 animate-pulse" aria-label="Live feed active">LIVE_FEED</span>
           </div>
           <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {[
                { level: 'High', msg: 'Volatility expansion probability 68%', time: '12m ago', color: 'bg-red-500' },
                { level: 'Med', msg: 'BBB Credit spread widening detected', time: '1h ago', color: 'bg-amber-500' },
                { level: 'Low', msg: 'USD Liquidity improving in repo markets', time: '3h ago', color: 'bg-green-500' },
                { level: 'Med', msg: 'Cross-asset correlation spike: Equities & Bonds', time: '5h ago', color: 'bg-amber-500' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full ${s.color} shadow-sm`}></div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white uppercase leading-tight">{s.msg}</div>
                    <div className="text-xs text-slate-300 font-mono font-medium mt-1">{s.time} // PRIORITY: {s.level}</div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* AI Copilot */}
        <div className="flex flex-col">
           <AICopilot />
        </div>
      </div>
    </div>
  );
}
