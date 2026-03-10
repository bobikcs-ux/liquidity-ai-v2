'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Building2,
  Euro,
  RefreshCw
} from 'lucide-react';

import type {
  EuropeView,
  EurozoneMacroData,
  EuropeSovereignIndex,
  DebtStressSignal,
  EuroCountryCode
} from '../types/europe-australia';

import {
  fetchEurozoneMacroData,
  calculateDebtStressSignals,
  calculateEuropeSovereignIndex,
  getCountryFlag,
  getStressLevelColor
} from '../services/europeSovereignService';

import { useMacroData } from '../hooks/useMacroData';

let cachedData: {
  macro: EurozoneMacroData | null
  index: EuropeSovereignIndex | null
  signals: DebtStressSignal[]
  timestamp: number
} = {
  macro: null,
  index: null,
  signals: [],
  timestamp: 0
};

const CACHE_TTL = 5 * 60 * 1000;

export const EuropeWidget = memo(function EuropeWidget() {

  const [view, setView] = useState<EuropeView>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EurozoneMacroData | null>(null);
  const [sovereignIndex, setSovereignIndex] = useState<EuropeSovereignIndex | null>(null);
  const [debtSignals, setDebtSignals] = useState<DebtStressSignal[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<EuroCountryCode | null>(null);

  const { values, metricStatus, configError, lastSync } = useMacroData();

  const ecbRateLive = values?.ecbRate ?? null;
  const dgs10Live = values?.dgs10 ?? null;
  const dgs2Live = values?.dgs2 ?? null;

  const ecbStatus =
    configError ? 'CONFIG_ERROR' : (metricStatus?.ecbRate ?? 'FALLBACK');

  const spread =
    dgs10Live !== null && dgs2Live !== null
      ? dgs10Live - dgs2Live
      : null;

  const fetchData = useCallback(async () => {

    if (cachedData.macro && Date.now() - cachedData.timestamp < CACHE_TTL) {

      setData(cachedData.macro);
      setSovereignIndex(cachedData.index);
      setDebtSignals(cachedData.signals);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {

      const macroData = await fetchEurozoneMacroData();
      const signals = calculateDebtStressSignals(macroData);
      const index = calculateEuropeSovereignIndex(macroData, signals);

      cachedData = {
        macro: macroData,
        index,
        signals,
        timestamp: Date.now()
      };

      setData(macroData);
      setSovereignIndex(index);
      setDebtSignals(signals);

    } catch (err) {

      console.error('[EuropeWidget]', err);

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    fetchData();
    const interval = setInterval(fetchData, CACHE_TTL);

    return () => clearInterval(interval);

  }, [fetchData]);

  const getTrendIcon = (trend: string) => {

    if (trend === 'IMPROVING')
      return <TrendingUp className="w-4 h-4 text-green-400" />

    if (trend === 'DETERIORATING')
      return <TrendingDown className="w-4 h-4 text-red-400" />

    return <Minus className="w-4 h-4 text-gray-400" />
  };

  const getIndexColor = (value: number) => {

    if (value >= 70) return 'text-red-500'
    if (value >= 50) return 'text-orange-400'
    if (value >= 30) return 'text-[#B8A892]'
    return 'text-green-400'
  };

  return (

<div className="bg-black border border-blue-700/30 rounded-none overflow-hidden">

{/* HEADER */}

<div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3 border-b border-blue-700/50">

<div className="flex items-center justify-between">

<div className="flex items-center gap-3">

<div className="w-8 h-8 bg-[#B8A892] flex items-center justify-center">

<Euro className="w-5 h-5 text-blue-900" />

</div>

<div>

<h3 className="text-white font-bold text-sm">
EUROPE SOVEREIGN
</h3>

<p className="text-blue-300 text-xs font-mono">
FRED / ECB via Supabase
</p>

</div>

</div>

<button
onClick={fetchData}
className="p-1.5 hover:bg-blue-700/50"
>

<RefreshCw
className={`w-4 h-4 text-blue-300 ${
loading ? 'animate-spin' : ''
}`}
/>

</button>

</div>

</div>

{/* VIEW TABS */}

<div className="flex border-b border-blue-900/50">

{(['OVERVIEW','DEBT_STRESS','COUNTRY_DETAIL'] as EuropeView[]).map(v => (

<button
key={v}
onClick={() => setView(v)}
className={`flex-1 px-3 py-2 text-xs font-bold ${
view === v
? 'bg-blue-900/50 text-[#B8A892]'
: 'text-gray-400 hover:text-white'
}`}
>

{v.replace('_',' ')}

</button>

))}

</div>

{/* CONTENT */}

<div className="p-4">

{loading && (

<div className="flex justify-center py-12">

<RefreshCw className="w-6 h-6 text-blue-400 animate-spin"/>

</div>

)}

{!loading && view === 'OVERVIEW' && data && sovereignIndex && (

<div className="space-y-4">

{/* Sovereign Index */}

<div className="bg-blue-950/30 border border-blue-800/50 p-4">

<div className="flex justify-between mb-2">

<span className="text-gray-400 text-xs font-mono">
EUROPE SOVEREIGN INDEX
</span>

{getTrendIcon(sovereignIndex.trend)}

</div>

<div className="flex items-end gap-3">

<span className={`text-5xl font-black ${getIndexColor(sovereignIndex.value)}`}>
{sovereignIndex.value}
</span>

<span className="text-gray-500">/100</span>

</div>

</div>

{/* US TREASURY */}

<div className="bg-blue-950/20 border border-blue-800/30 p-3">

<div className="text-gray-400 text-xs font-mono mb-2">
US TREASURY
</div>

<div className="grid grid-cols-3 gap-3">

<div className="text-center">

<div className="text-xs text-gray-500">10Y</div>

<div className="text-lg text-white">

{dgs10Live !== null ? `${dgs10Live.toFixed(2)}%` : '--'}

</div>

</div>

<div className="text-center">

<div className="text-xs text-gray-500">2Y</div>

<div className="text-lg text-white">

{dgs2Live !== null ? `${dgs2Live.toFixed(2)}%` : '--'}

</div>

</div>

<div className="text-center">

<div className="text-xs text-gray-500">SPREAD</div>

<div className={`text-lg font-bold ${
spread !== null && spread < 0
? 'text-red-400'
: 'text-green-400'
}`}>

{spread !== null ? `${spread.toFixed(2)}%` : '--'}

</div>

</div>

</div>

</div>

{/* EUROZONE AGGREGATES */}

<div className="grid grid-cols-3 gap-3">

<div className="bg-gray-900/50 p-3 text-center">

<div className="text-xs text-gray-500">AVG GDP</div>

<div className={`text-lg font-bold ${
data.aggregates.avg_gdp_growth >= 0
? 'text-green-400'
: 'text-red-400'
}`}>

{data.aggregates.avg_gdp_growth.toFixed(1)}%

</div>

</div>

<div className="bg-gray-900/50 p-3 text-center">

<div className="text-xs text-gray-500">INFLATION</div>

<div className="text-lg text-[#B8A892]">

{data.aggregates.avg_inflation.toFixed(1)}%

</div>

</div>

<div className="bg-gray-900/50 p-3 text-center">

<div className="text-xs text-gray-500 flex items-center justify-center gap-1">

ECB RATE

<span className={`w-2 h-2 ${
ecbStatus === 'LIVE'
? 'bg-green-500'
: 'bg-red-500'
}`} />

</div>

<div className="text-lg text-blue-400">

{(ecbRateLive ?? data.ecb_rate ?? 0).toFixed(2)}%

</div>

</div>

</div>

</div>

)}

</div>

{/* FOOTER */}

<div className="px-4 py-2 border-t border-blue-900/50 bg-blue-950/20">

<div className="flex justify-between text-xs text-gray-500 font-mono">

<span>FRED / ECB</span>

<span>
{lastSync ? lastSync.toLocaleTimeString() : '--:--'}
</span>

</div>

</div>

</div>

);

});

export default EuropeWidget;