import React from 'react';
import { TrendingUp, AlertTriangle, Activity, DollarSign, ShieldAlert, Cpu } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';
import { AICopilot } from '../components/AICopilot';
import { RiskDefenseAI } from '../components/RiskDefenseAI';
import { ResourceShockEngine } from '../components/ResourceShockEngine';
import { ConflictTransmissionModel } from '../components/ConflictTransmissionModel';
import { EmploymentDisruptionLayer } from '../components/EmploymentDisruptionLayer';
import { NarrativeShockModel } from '../components/NarrativeShockModel';

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
  
  const cardStyle = `rounded-xl shadow-sm border p-6 transition-all duration-500 ${
    isDark ? 'bg-[#0a0f1a] border-blue-900/40' : 
    isHybrid ? 'bg-[#1e2536] border-gray-700' : 
    'bg-white border-gray-200'
  }`;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 lg:p-8">
      
      {/* HEADER SECTION - ПЕРСОНАЛИЗИРАНО ЗАГЛАВИЕ */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 border-b border-blue-900/30 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
             <div className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-mono font-bold rounded">
                CORE_SYSTEM_ACTIVE
             </div>
             <div className="text-[10px] text-slate-300 font-mono tracking-widest uppercase">
                Auth: Admin_Bobikcs
             </div>
          </div>
          <h1 className={`text-4xl font-black tracking-tighter uppercase italic ${
            isDark || isHybrid ? 'text-white' : 'text-gray-900'
          }`}>
            BOBIKCS <span className="text-blue-500 text-3xl not-italic font-light">//</span> <span className="text-blue-500">INTELLIGENCE TERMINAL</span>
          </h1>
          <p className={`font-mono text-xs tracking-[0.2em] uppercase opacity-70 ${
            isDark || isHybrid ? 'text-blue-300' : 'text-gray-600'
          }`}>
            Advanced Regime Analysis & Risk Mitigation Suite
          </p>
        </div>

        {/* AI STATUS HUD */}
        <div className="flex items-center gap-5 bg-blue-950/20 px-5 py-3 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-blue-400 font-mono uppercase leading-none mb-1">Neural Uplink</span>
            <span className="text-sm font-bold text-white tracking-tight uppercase">Copilot Online</span>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border border-blue-500/30 animate-spin-slow absolute"></div>
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Autonomous Risk Defense AI - Силно визуално предупреждение */}
      {currentRegime.riskLevel >= 60 && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-600/50 bg-red-950/10 p-1 animate-in fade-in slide-in-from-top-4 duration-700">
           <RiskDefenseAI />
        </div>
      )}

      {/* SYSTEMIC DRIVERS PANEL - С ДВОЙНИЯ ТЕХНОЛОГИЧЕН ФОН */}
      <section 
        className="rounded-3xl p-8 mb-8 relative border border-blue-500/20 overflow-hidden shadow-2xl"
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
                <p className="text-[10px] font-mono text-blue-400/60 uppercase">Real-time correlation matrix</p>
             </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <ResourceShockEngine />
            <ConflictTransmissionModel />
            <EmploymentDisruptionLayer />
            <NarrativeShockModel />
          </div>
        </div>
      </section>

      {/* Grid с основните карти (Metrics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regime Intelligence Card */}
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h2 className={`text-sm font-black uppercase tracking-widest ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              Regime Intelligence
            </h2>
          </div>
          
          <div className="space-y-5">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
              <span className="text-[10px] font-mono text-blue-400 block mb-1 uppercase tracking-tighter">Current Market State</span>
              <div className="text-2xl font-black text-white italic tracking-tight">
                {currentRegime.regime.toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-[9px] text-slate-300 uppercase font-mono font-medium">Confidence</div>
                <div className="text-lg font-bold text-green-500 font-mono">{currentRegime.confidence}%</div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="text-[9px] text-slate-300 uppercase font-mono font-medium">Risk Level</div>
                <div className={`text-lg font-bold font-mono ${currentRegime.riskLevel > 50 ? 'text-red-500' : 'text-green-500'}`}>
                  {currentRegime.riskLevel}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Survival Matrix Card */}
        <div className={cardStyle}>
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-green-500" />
            <h2 className={`text-sm font-black uppercase tracking-widest ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              Survival Matrix
            </h2>
          </div>
          <div className="text-center py-4">
            <div className={`text-6xl font-black mb-2 font-mono ${
              survivalProb >= 70 ? 'text-green-500' : survivalProb >= 50 ? 'text-amber-500' : 'text-red-500'
            }`}>
              {snapshotLoading ? '...' : `${survivalProb}%`}
            </div>
            <p className="text-[9px] font-mono font-medium text-slate-300 uppercase">30-day horizon survival probability</p>
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
            <DollarSign className="w-5 h-5 text-amber-500" />
            <h2 className={`text-sm font-black uppercase tracking-widest ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              Macro Snapshot
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { label: 'BTC Dominance', val: snapshotLoading ? '...' : `${btcDominance}%`, trend: parseFloat(btcDominance) > 55 ? 'up' : 'neutral' },
              { label: 'Survival Prob', val: snapshotLoading ? '...' : `${survivalProb}%`, trend: survivalProb >= 70 ? 'up' : survivalProb >= 50 ? 'neutral' : 'down' },
              { label: 'Yield Curve', val: snapshotLoading ? '...' : `${yieldSpread}%`, trend: parseFloat(yieldSpread) < 0 ? 'down' : 'up' },
              { label: 'VIX Terminal', val: currentRegime.volatilityIndex, trend: 'neutral' },
            ].map((m, i) => (
              <div key={i} className="flex justify-between items-end border-b border-white/5 pb-2">
                <span className="text-[11px] font-mono text-gray-200 uppercase">{m.label}</span>
                <span className={`text-base font-bold font-mono ${m.trend === 'up' ? 'text-green-500' : m.trend === 'down' ? 'text-red-500' : 'text-white'}`}>
                  {m.val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stress signals & AI Copilot Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className={cardStyle}>
           <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h2 className="text-sm font-black uppercase tracking-widest text-white">Systemic Stress</h2>
              </div>
              <span className="text-[9px] font-mono text-blue-400 animate-pulse">● LIVE_FEED</span>
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
                    <div className="text-[9px] text-slate-300 font-mono font-medium mt-1">{s.time} // PRIORITY: {s.level}</div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Интеграция на AI Copilot */}
        <div className="flex flex-col">
           <AICopilot />
        </div>
      </div>
    </div>
  );
}
