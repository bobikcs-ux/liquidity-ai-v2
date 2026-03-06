'use client';

/**
 * Japan Macro Widget - "Rising Sun" Dashboard
 * Sovereign aesthetic: black bg, red/gold accents, rounded-none
 */

import React, { memo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Gauge,
  Factory,
  Ship,
  Users,
} from 'lucide-react';
import { useAsianIntelligence, getYenCarryColor } from '../hooks/useAsianIntelligence';
import type { JapanMacroState, YenCarryTradeData } from '../types/japan-india';

// Rising Sun color palette
const RISING_SUN = {
  red: '#DC2626',
  darkRed: '#991B1B',
  gold: '#D4A574',
  white: '#FFFFFF',
  black: '#000000',
};

type JapanView = 'overview' | 'yen-carry' | 'production';

/**
 * Yen Carry Trade Monitor Component
 */
const YenCarryMonitor = memo(function YenCarryMonitor({ 
  data 
}: { 
  data: YenCarryTradeData | null 
}) {
  if (!data) {
    return (
      <div className="bg-black border border-red-900/50 rounded-none p-4">
        <div className="animate-pulse h-24 bg-gray-900 rounded-none" />
      </div>
    );
  }

  const pressureColor = getYenCarryColor(data.carry_trade_pressure);
  const isUnwinding = data.carry_trade_pressure === 'UNWINDING';

  return (
    <div className={`bg-black border rounded-none p-4 transition-all ${
      isUnwinding ? 'border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'border-red-900/50'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-none ${isUnwinding ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            Yen Carry Trade Monitor
          </span>
        </div>
        <span className={`text-xs font-bold uppercase ${pressureColor}`}>
          {data.carry_trade_pressure}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* USD/JPY Rate */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white font-mono">
            {data.usd_jpy_rate.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">USD/JPY</div>
        </div>

        {/* Carry Spread */}
        <div className="text-center">
          <div className="text-3xl font-bold text-amber-400 font-mono">
            {data.carry_spread.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Carry Spread</div>
        </div>
      </div>

      {/* Rate Comparison Bar */}
      <div className="mt-4 pt-4 border-t border-red-900/30">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>JPY Rate: {data.jpy_overnight_rate}%</span>
          <span>USD Rate: {data.usd_overnight_rate}%</span>
        </div>
        <div className="h-2 bg-gray-900 rounded-none overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-red-600 to-amber-500"
            style={{ width: `${Math.min(data.carry_spread * 15, 100)}%` }}
          />
        </div>
      </div>

      {/* Risk Warning */}
      {isUnwinding && (
        <div className="mt-4 p-3 bg-red-950/50 border border-red-800/50 rounded-none">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-300">
              <span className="font-bold">GLOBAL DELEVERAGING RISK:</span> Yen carry trade unwinding can trigger 
              cascading sell-offs in risk assets. Monitor emerging market currencies and high-yield bonds.
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Macro Indicator Card
 */
const MacroCard = memo(function MacroCard({
  icon: Icon,
  label,
  value,
  unit,
  change,
  changeLabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number | null;
  unit: string;
  change: number | null;
  changeLabel: string;
}) {
  const isPositive = change !== null && change >= 0;

  return (
    <div className="bg-black border border-red-900/30 rounded-none p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-red-500" />
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>

      {value !== null ? (
        <>
          <div className="text-2xl font-bold text-white font-mono">
            {value.toFixed(1)}{unit}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-500" />
            )}
            <span className={`text-xs font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{change?.toFixed(2)}%
            </span>
            <span className="text-xs text-gray-600">{changeLabel}</span>
          </div>
        </>
      ) : (
        <div className="animate-pulse">
          <div className="h-8 w-20 bg-gray-800 rounded-none" />
        </div>
      )}
    </div>
  );
});

/**
 * Main Japan Macro Widget
 */
export const JapanMacroWidget = memo(function JapanMacroWidget() {
  const { japan, refresh } = useAsianIntelligence();
  const [view, setView] = useState<JapanView>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="bg-black border border-red-900/50 rounded-none overflow-hidden">
      {/* Header - Rising Sun Theme */}
      <div className="relative overflow-hidden">
        {/* Rising Sun Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 bg-red-600/20 rounded-b-full blur-2xl" />
        
        <div className="relative px-6 py-4 border-b border-red-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                JAPAN MACRO LAYER
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">
                e-Stat API // Real-time Economic Intelligence
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-red-900/20 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex gap-4 mt-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'yen-carry', label: 'Yen Carry' },
              { id: 'production', label: 'Production' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as JapanView)}
                className={`text-xs font-mono uppercase tracking-wider pb-2 border-b-2 transition-colors ${
                  view === tab.id
                    ? 'text-red-500 border-red-500'
                    : 'text-gray-500 border-transparent hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {view === 'overview' && (
          <div className="space-y-4">
            {/* Yen Carry Summary */}
            <YenCarryMonitor data={japan.yenCarry} />

            {/* Key Indicators Grid */}
            <div className="grid grid-cols-2 gap-3">
              <MacroCard
                icon={Gauge}
                label="CPI"
                value={japan.cpi?.value ?? null}
                unit="%"
                change={japan.cpi?.yoy_change ?? null}
                changeLabel="YoY"
              />
              <MacroCard
                icon={Factory}
                label="Industrial Prod"
                value={japan.industrialProduction?.value ?? null}
                unit=""
                change={japan.industrialProduction?.yoy_change ?? null}
                changeLabel="YoY"
              />
              <MacroCard
                icon={Ship}
                label="Trade Balance"
                value={japan.tradeBalance?.value ?? null}
                unit="B"
                change={japan.tradeBalance?.yoy_change ?? null}
                changeLabel="YoY"
              />
              <MacroCard
                icon={Users}
                label="Unemployment"
                value={japan.unemployment?.value ?? null}
                unit="%"
                change={japan.unemployment?.mom_change ?? null}
                changeLabel="MoM"
              />
            </div>
          </div>
        )}

        {view === 'yen-carry' && (
          <div className="space-y-4">
            <YenCarryMonitor data={japan.yenCarry} />
            
            {/* Detailed Analysis */}
            <div className="bg-gray-950 border border-red-900/30 rounded-none p-4">
              <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
                Carry Trade Analysis
              </h4>
              <div className="space-y-3 text-sm text-gray-300">
                <p>
                  The Yen carry trade exploits the interest rate differential between Japan's 
                  near-zero rates and higher-yielding currencies. When this trade unwinds, 
                  it can trigger global deleveraging.
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Current Spread:</span>
                  <span className="text-amber-400 font-mono">
                    {japan.yenCarry?.carry_spread.toFixed(2)}%
                  </span>
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-500">
                    {japan.yenCarry?.carry_spread && japan.yenCarry.carry_spread > 4 
                      ? 'High incentive for carry trade'
                      : 'Moderate carry incentive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'production' && (
          <div className="space-y-4">
            <MacroCard
              icon={Factory}
              label="Industrial Production Index"
              value={japan.industrialProduction?.value ?? null}
              unit=""
              change={japan.industrialProduction?.yoy_change ?? null}
              changeLabel="YoY Change"
            />
            
            <div className="bg-gray-950 border border-red-900/30 rounded-none p-4">
              <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
                Supply Chain Impact
              </h4>
              <p className="text-sm text-gray-300">
                Japan's industrial production directly impacts global supply chains, 
                particularly in automotive, semiconductors, and precision machinery.
                A decline signals potential disruptions in Asian manufacturing networks.
              </p>
              
              {japan.industrialProduction && japan.industrialProduction.yoy_change < -2 && (
                <div className="mt-3 p-3 bg-amber-950/30 border border-amber-800/50 rounded-none">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="text-xs text-amber-300">
                      Production contraction detected. Monitor automotive and semiconductor 
                      supply chain exposure.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-red-900/30 bg-red-950/10">
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>Source: e-Stat (Japan Statistics Bureau)</span>
          <span>{japan.lastUpdated ? new Date(japan.lastUpdated).toLocaleTimeString() : '--:--'}</span>
        </div>
      </div>
    </div>
  );
});

export default JapanMacroWidget;
