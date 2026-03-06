'use client';

import React, { memo, useState, useEffect, useCallback } from 'react';
import { 
  Fuel, 
  Flame, 
  BarChart3, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  Activity
} from 'lucide-react';

// Types
interface OilMarketData {
  globalPrice: number;
  opecSupply: 'STABLE' | 'TIGHT' | 'SURPLUS';
  inventories: 'RISING' | 'STABLE' | 'DECLINING';
}

interface GasMarketData {
  demandChange: number;
  euImports: 'RISING' | 'STABLE' | 'FALLING';
  lngFlow: 'HIGH' | 'MODERATE' | 'LOW';
}

interface EnergyStructure {
  country: string;
  crudePrice: number;
  tax: number;
  industryMargin: number;
}

interface EnergySignal {
  gasDemandRising: boolean;
  opecSupplyTight: boolean;
  euImportsIncreasing: boolean;
  signal: 'ENERGY TIGHTENING CYCLE' | 'ENERGY EASING CYCLE' | 'NEUTRAL CONDITIONS';
}

// Metric Card Component
const MetricCard = memo(function MetricCard({ 
  label, 
  value, 
  unit = '', 
  status,
  trend 
}: { 
  label: string; 
  value: string | number; 
  unit?: string;
  status?: 'positive' | 'negative' | 'neutral' | 'warning';
  trend?: 'up' | 'down' | 'stable';
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'positive': return 'text-emerald-400';
      case 'negative': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      default: return 'text-white';
    }
  };

  const getGlowClass = () => {
    switch (status) {
      case 'positive': return 'shadow-[0_0_20px_rgba(52,211,153,0.15)]';
      case 'negative': return 'shadow-[0_0_20px_rgba(248,113,113,0.15)]';
      case 'warning': return 'shadow-[0_0_20px_rgba(251,191,36,0.15)]';
      default: return 'shadow-[0_0_20px_rgba(163,147,123,0.08)]';
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`bg-zinc-950 border border-zinc-800 p-6 ${getGlowClass()} transition-all hover:border-zinc-700`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase">
          {label}
        </span>
        {trend && (
          <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500'}`}>
            <TrendIcon className="w-3 h-3" />
            {trend === 'up' && <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight tabular-nums ${getStatusColor()}`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-zinc-500 font-medium">{unit}</span>
        )}
      </div>
    </div>
  );
});

// Energy Structure Bar Component
const EnergyBar = memo(function EnergyBar({ data }: { data: EnergyStructure }) {
  const total = data.crudePrice + data.tax + data.industryMargin;
  const crudePercent = (data.crudePrice / total) * 100;
  const taxPercent = (data.tax / total) * 100;
  const marginPercent = (data.industryMargin / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-white uppercase">{data.country}</span>
        <span className="text-xs text-zinc-500 font-mono">${total.toFixed(0)}/bbl</span>
      </div>
      <div className="h-3 flex overflow-hidden bg-zinc-900 border border-zinc-800">
        <div 
          className="bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-500"
          style={{ width: `${crudePercent}%` }}
          title={`Crude: $${data.crudePrice}`}
        />
        <div 
          className="bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
          style={{ width: `${taxPercent}%` }}
          title={`Tax: $${data.tax}`}
        />
        <div 
          className="bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500"
          style={{ width: `${marginPercent}%` }}
          title={`Margin: $${data.industryMargin}`}
        />
      </div>
    </div>
  );
});

// Signal Engine Component
const SignalEngine = memo(function SignalEngine({ signal }: { signal: EnergySignal }) {
  const conditions = [
    { label: 'Gas Demand Rising', active: signal.gasDemandRising },
    { label: 'OPEC Supply Tight', active: signal.opecSupplyTight },
    { label: 'EU Imports Increasing', active: signal.euImportsIncreasing },
  ];

  const activeCount = conditions.filter(c => c.active).length;
  const isTightening = signal.signal === 'ENERGY TIGHTENING CYCLE';

  return (
    <div className={`bg-zinc-950 border p-6 transition-all ${
      isTightening 
        ? 'border-amber-500/50 shadow-[0_0_30px_rgba(251,191,36,0.1)]' 
        : 'border-zinc-800'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-8 h-8 flex items-center justify-center ${
          isTightening ? 'bg-amber-500/20' : 'bg-zinc-800'
        }`}>
          <Zap className={`w-4 h-4 ${isTightening ? 'text-amber-400' : 'text-zinc-500'}`} />
        </div>
        <div>
          <h3 className="text-xs font-bold tracking-[0.2em] text-white uppercase">
            Structural Energy Signal
          </h3>
          <p className="text-xs text-zinc-600 font-mono mt-0.5">
            {activeCount}/3 CONDITIONS ACTIVE
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-xs font-medium tracking-wider text-zinc-500 uppercase">IF</div>
        
        <div className="space-y-2 pl-4 border-l border-zinc-800">
          {conditions.map((condition, i) => (
            <div key={condition.label} className="flex items-center gap-3">
              <div className={`w-2 h-2 ${
                condition.active 
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' 
                  : 'bg-zinc-700'
              }`} />
              <span className={`text-sm font-medium ${
                condition.active ? 'text-white' : 'text-zinc-600'
              }`}>
                {condition.label}
              </span>
              {i < conditions.length - 1 && (
                <span className="text-zinc-600 text-xs">+</span>
              )}
            </div>
          ))}
        </div>

        <div className="text-xs font-medium tracking-wider text-zinc-500 uppercase pt-2">THEN</div>

        <div className={`p-4 ${
          isTightening 
            ? 'bg-amber-500/10 border border-amber-500/30' 
            : 'bg-zinc-900 border border-zinc-800'
        }`}>
          <span className={`text-lg font-bold tracking-wide ${
            isTightening ? 'text-amber-400' : 'text-zinc-500'
          }`}>
            {signal.signal}
          </span>
        </div>
      </div>
    </div>
  );
});

// Main Dashboard Component
export const CitadelEnergyDashboard = memo(function CitadelEnergyDashboard() {
  const [loading, setLoading] = useState(true);
  const [oilData, setOilData] = useState<OilMarketData>({
    globalPrice: 82.41,
    opecSupply: 'STABLE',
    inventories: 'DECLINING'
  });
  const [gasData, setGasData] = useState<GasMarketData>({
    demandChange: 3.2,
    euImports: 'RISING',
    lngFlow: 'HIGH'
  });
  const [energyStructure] = useState<EnergyStructure[]>([
    { country: 'USA', crudePrice: 65, tax: 12, industryMargin: 18 },
    { country: 'EUROPE', crudePrice: 68, tax: 45, industryMargin: 15 },
    { country: 'JAPAN', crudePrice: 70, tax: 38, industryMargin: 14 },
    { country: 'INDIA', crudePrice: 72, tax: 28, industryMargin: 16 },
  ]);
  const [energySignal, setEnergySignal] = useState<EnergySignal>({
    gasDemandRising: true,
    opecSupplyTight: true,
    euImportsIncreasing: true,
    signal: 'ENERGY TIGHTENING CYCLE'
  });

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Update signal based on conditions
  const updateSignal = useCallback(() => {
    const conditions = [
      gasData.demandChange > 0,
      oilData.opecSupply === 'TIGHT' || oilData.opecSupply === 'STABLE',
      gasData.euImports === 'RISING'
    ];
    
    const activeCount = conditions.filter(Boolean).length;
    
    setEnergySignal({
      gasDemandRising: conditions[0],
      opecSupplyTight: conditions[1],
      euImportsIncreasing: conditions[2],
      signal: activeCount >= 2 ? 'ENERGY TIGHTENING CYCLE' : 
              activeCount === 0 ? 'ENERGY EASING CYCLE' : 'NEUTRAL CONDITIONS'
    });
  }, [gasData, oilData]);

  useEffect(() => {
    updateSignal();
  }, [updateSignal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-amber-400 rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-mono tracking-wider">INITIALIZING CITADEL</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle Grid Background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
linear-gradient(rgba(163,147,123,0.03) 1px, transparent 1px),
linear-gradient(90deg, rgba(163,147,123,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative max-w-[1080px] mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex items-start justify-between mb-12 pb-6 border-b border-zinc-900">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                ENERGY INTELLIGENCE SYSTEM
              </h1>
            </div>
            <p className="text-xs text-zinc-600 font-mono tracking-wider">
              CITADEL MACRO TERMINAL // REAL-TIME GLOBAL ENERGY MONITOR
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase block">
              Global Energy Monitor
            </span>
            <span className="text-xs text-zinc-600 font-mono">
              {new Date().toISOString().split('T')[0]}
            </span>
          </div>
        </header>

        {/* Section 1 - Oil Market */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Fuel className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase">
              Oil Market
            </h2>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              label="Global Oil Price"
              value={oilData.globalPrice.toFixed(2)}
              unit="USD"
              status="neutral"
              trend="stable"
            />
            <MetricCard 
              label="OPEC Supply"
              value={oilData.opecSupply}
              status={oilData.opecSupply === 'TIGHT' ? 'warning' : 'neutral'}
            />
            <MetricCard 
              label="Global Inventories"
              value={oilData.inventories}
              status={oilData.inventories === 'DECLINING' ? 'warning' : 'positive'}
              trend={oilData.inventories === 'DECLINING' ? 'down' : 'up'}
            />
          </div>
        </section>

        {/* Section 2 - Natural Gas */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase">
              Natural Gas
            </h2>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              label="Global Gas Demand"
              value={`UP +${gasData.demandChange}%`}
              status="positive"
              trend="up"
            />
            <MetricCard 
              label="EU Gas Imports"
              value={gasData.euImports}
              status={gasData.euImports === 'RISING' ? 'positive' : 'neutral'}
              trend={gasData.euImports === 'RISING' ? 'up' : 'stable'}
            />
            <MetricCard 
              label="LNG Export Flow"
              value={gasData.lngFlow}
              status={gasData.lngFlow === 'HIGH' ? 'positive' : 'neutral'}
            />
          </div>
        </section>

        {/* Section 3 - Energy Structure */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase">
              Energy Structure
            </h2>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          
          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <div className="flex items-center gap-6 mb-6 text-xs font-medium tracking-wider text-zinc-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500" />
                <span>CRUDE PRICE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500" />
                <span>TAX</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500" />
                <span>INDUSTRY MARGIN</span>
              </div>
            </div>
            
            <div className="space-y-5">
              {energyStructure.map((data) => (
                <EnergyBar key={data.country} data={data} />
              ))}
            </div>
          </div>
        </section>

        {/* Section 4 - Energy Signal Engine */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase">
              Energy Signal Engine
            </h2>
            <div className="flex-1 h-px bg-zinc-900" />
          </div>
          
          <SignalEngine signal={energySignal} />
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3 text-zinc-600" />
              <span className="text-xs font-medium tracking-wider text-zinc-600 uppercase">
                Data Sources:
              </span>
            </div>
            <div className="flex items-center gap-4">
              {['EIA', 'OPEC', 'EUROSTAT', 'ABS'].map((source) => (
                <span 
                  key={source}
                  className="text-xs font-mono text-zinc-500 px-2 py-1 bg-zinc-900 border border-zinc-800"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="text-xs text-zinc-700 font-mono">
              CITADEL ENERGY INTELLIGENCE // INSTITUTIONAL TERMINAL v2.0
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
});

export default CitadelEnergyDashboard;
