'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Building2, 
  Euro,
  RefreshCw,
  ChevronRight,
  Activity,
  Shield
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

// Cache for data
let cachedData: {
  macro: EurozoneMacroData | null;
  index: EuropeSovereignIndex | null;
  signals: DebtStressSignal[];
  timestamp: number;
} = { macro: null, index: null, signals: [], timestamp: 0 };

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Europe Sovereign Widget - "Continental Shield" Design
 * Blue/gold EU theme with debt stress monitoring
 */
export const EuropeWidget = memo(function EuropeWidget() {
  const [view, setView] = useState<EuropeView>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EurozoneMacroData | null>(null);
  const [sovereignIndex, setSovereignIndex] = useState<EuropeSovereignIndex | null>(null);
  const [debtSignals, setDebtSignals] = useState<DebtStressSignal[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<EuroCountryCode | null>(null);
  
  // Live ECB rate from FRED via macroDataService
  const { display, values, metricStatus, lastSync, configError } = useMacroData();
  const ecbRateLive = values?.ecbRate ?? null;
  const ecbStatus = configError ? 'CONFIG_ERROR' : (metricStatus?.ecbRate ?? 'FALLBACK');
  const dgs10Status = configError ? 'CONFIG_ERROR' : (metricStatus?.dgs10 ?? 'FALLBACK');
  const dgs10Live = values?.dgs10 ?? null;
  const dgs2Live = values?.dgs2 ?? null;

  const fetchData = useCallback(async () => {
    // Check cache
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

      // Update cache
      cachedData = {
        macro: macroData,
        index,
        signals,
        timestamp: Date.now(),
      };

      setData(macroData);
      setSovereignIndex(index);
      setDebtSignals(signals);
    } catch (error) {
      console.error('[EuropeWidget] Error fetching data:', error);
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
    switch (trend) {
      case 'IMPROVING': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'DETERIORATING': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getIndexColor = (value: number) => {
    if (value >= 70) return 'text-red-500';
    if (value >= 50) return 'text-orange-400';
    if (value >= 30) return 'text-[#B8A892]';
    return 'text-green-400';
  };

  return (
    <div className="bg-black border border-blue-700/30 rounded-none overflow-hidden">
      {/* Header - EU Blue/Gold Theme */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-4 py-3 border-b border-blue-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#B8A892] rounded-none flex items-center justify-center">
              <Euro className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">EUROPE SOVEREIGN</h3>
              <p className="text-blue-300 text-xs font-mono">FRED / ECB via Supabase Sync</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sovereignIndex?.piigs_alert && (
              <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-none">
                <span className="text-red-400 text-xs font-bold animate-pulse">PIIGS ALERT</span>
              </div>
            )}
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 hover:bg-blue-700/50 rounded-none transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-blue-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-blue-900/50">
        {(['OVERVIEW', 'DEBT_STRESS', 'COUNTRY_DETAIL'] as EuropeView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
              view === v 
                ? 'bg-blue-900/50 text-[#B8A892] border-b-2 border-[#B8A892]' 
                : 'text-gray-400 hover:text-white hover:bg-blue-900/30'
            }`}
          >
            {v.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : view === 'OVERVIEW' ? (
          <OverviewView 
            data={data} 
            index={sovereignIndex} 
            getTrendIcon={getTrendIcon}
            getIndexColor={getIndexColor}
          />
        ) : view === 'DEBT_STRESS' ? (
          <DebtStressView signals={debtSignals} />
        ) : (
          <CountryDetailView 
            data={data}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
          />
        )}
      </div>

      {/* Footer with sync status */}
      <div className="px-4 py-2 border-t border-blue-900/50 bg-blue-950/20">
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>Source: FRED / ECB via Supabase Sync</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-none ${
              ecbStatus === 'CONFIG_ERROR' ? 'bg-purple-500' :
              ecbStatus === 'LIVE' ? 'bg-green-500' : 
              ecbStatus === 'CACHED' ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <span className="text-xs">
              {ecbStatus === 'CONFIG_ERROR' ? 'CONFIG_ERROR' : 
               ecbStatus === 'CACHED' ? 'CACHED' :
               ecbStatus === 'LIVE' ? 'LIVE' : 'OFFLINE'}
            </span>
            <span>{lastSync ? lastSync.toLocaleTimeString() : '--:--'}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

// Overview View Component
const OverviewView = memo(function OverviewView({
  data,
  index,
  getTrendIcon,
  getIndexColor,
}: {
  data: EurozoneMacroData | null;
  index: EuropeSovereignIndex | null;
  getTrendIcon: (trend: string) => React.ReactNode;
  getIndexColor: (value: number) => string;
}) {
  if (!data || !index) return null;

  return (
    <div className="space-y-4">
      {/* Sovereign Index Gauge */}
      <div className="bg-blue-950/30 border border-blue-800/50 rounded-none p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-xs font-mono">EUROPE SOVEREIGN INDEX</span>
          <div className="flex items-center gap-2">
            {getTrendIcon(index.trend)}
            <span className="text-xs text-gray-500">{index.trend}</span>
          </div>
        </div>
        <div className="flex items-end gap-4">
          <span className={`text-5xl font-black tabular-nums ${getIndexColor(index.value)}`}>
            {index.value}
          </span>
          <span className="text-gray-500 text-sm mb-2">/100</span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-800 rounded-none overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              index.value >= 70 ? 'bg-red-500' :
              index.value >= 50 ? 'bg-orange-500' :
              index.value >= 30 ? 'bg-[#B8A892]' : 'bg-green-500'
            }`}
            style={{ width: `${index.value}%` }}
          />
        </div>
      </div>

      {/* US Treasury Yields (Live from FRED) */}
      <div className="bg-blue-950/20 border border-blue-800/30 rounded-none p-3 mb-4">
        <div className="text-gray-400 text-xs font-mono mb-2">US TREASURY (FRED LIVE)</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">10Y</div>
            <div className="text-lg font-bold text-white">{dgs10Live !== null ? `${dgs10Live.toFixed(2)}%` : '--'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">2Y</div>
            <div className="text-lg font-bold text-white">{dgs2Live !== null ? `${dgs2Live.toFixed(2)}%` : '--'}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">SPREAD</div>
            <div className={`text-lg font-bold ${dgs10Live && dgs2Live && (dgs10Live - dgs2Live) < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {dgs10Live !== null && dgs2Live !== null ? `${(dgs10Live - dgs2Live).toFixed(2)}%` : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Index Components */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(index.components).map(([key, value]) => (
          <div key={key} className="bg-gray-900/50 border border-gray-800 rounded-none p-3">
            <div className="text-gray-500 text-xs font-mono mb-1">
              {key.replace('_', ' ').toUpperCase()}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xl font-bold ${getIndexColor(value)}`}>{value}</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded-none overflow-hidden">
                <div 
                  className={`h-full ${
                    value >= 70 ? 'bg-red-500' :
                    value >= 50 ? 'bg-orange-500' :
                    value >= 30 ? 'bg-[#B8A892]' : 'bg-green-500'
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Eurozone Aggregates */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900/50 border border-gray-800 rounded-none p-3 text-center">
          <div className="text-gray-500 text-xs font-mono mb-1">AVG GDP</div>
          <div className={`text-lg font-bold ${data.aggregates.avg_gdp_growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.aggregates.avg_gdp_growth >= 0 ? '+' : ''}{data.aggregates.avg_gdp_growth.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-none p-3 text-center">
          <div className="text-gray-500 text-xs font-mono mb-1">INFLATION</div>
          <div className={`text-lg font-bold ${data.aggregates.avg_inflation > 3 ? 'text-red-400' : 'text-[#B8A892]'}`}>
            {data.aggregates.avg_inflation.toFixed(1)}%
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-none p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 text-xs font-mono mb-1">
            <span>ECB RATE</span>
            <span className={`w-1.5 h-1.5 rounded-none ${ecbStatus === 'LIVE' ? 'bg-green-500' : ecbStatus === 'CACHED' ? 'bg-amber-500' : 'bg-red-500'}`} />
          </div>
          <div className="text-lg font-bold text-blue-400">
            {ecbRateLive !== null ? ecbRateLive.toFixed(2) : data.ecb_rate?.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
});

// Debt Stress View Component
const DebtStressView = memo(function DebtStressView({
  signals,
}: {
  signals: DebtStressSignal[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-[#B8A892]" />
        <span className="text-[#B8A892] text-sm font-bold">PIIGS DEBT STRESS MONITOR</span>
      </div>
      
      {signals.map((signal) => (
        <div 
          key={signal.country_code}
          className={`border rounded-none p-3 ${getStressLevelColor(signal.stress_level)}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCountryFlag(signal.country_code)}</span>
              <span className="text-white font-bold">{signal.country_name}</span>
            </div>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-none ${
              signal.stress_level === 'CRITICAL' ? 'bg-red-500 text-white' :
              signal.stress_level === 'HIGH' ? 'bg-orange-500 text-white' :
              signal.stress_level === 'ELEVATED' ? 'bg-[#B8A892] text-black' :
              'bg-green-500 text-white'
            }`}>
              {signal.stress_level}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Spread vs Bund:</span>
              <span className="ml-2 text-white font-mono">{signal.spread_vs_bund.toFixed(0)}bps</span>
            </div>
            <div>
              <span className="text-gray-500">Debt/GDP:</span>
              <span className="ml-2 text-white font-mono">{signal.debt_to_gdp.toFixed(1)}%</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-2 font-mono">{signal.signal_message}</p>
        </div>
      ))}
    </div>
  );
});

// Country Detail View Component
const CountryDetailView = memo(function CountryDetailView({
  data,
  selectedCountry,
  setSelectedCountry,
}: {
  data: EurozoneMacroData | null;
  selectedCountry: EuroCountryCode | null;
  setSelectedCountry: (code: EuroCountryCode | null) => void;
}) {
  if (!data) return null;

  const country = selectedCountry 
    ? data.countries.find(c => c.code === selectedCountry)
    : null;

  return (
    <div className="space-y-3">
      {/* Country Selector */}
      <div className="grid grid-cols-5 gap-2">
        {data.countries.map((c) => (
          <button
            key={c.code}
            onClick={() => setSelectedCountry(c.code === selectedCountry ? null : c.code)}
            className={`p-2 rounded-none border transition-colors text-center ${
              c.code === selectedCountry
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:border-blue-600'
            }`}
          >
            <span className="text-lg">{getCountryFlag(c.code)}</span>
            <div className="text-xs mt-1">{c.code}</div>
          </button>
        ))}
      </div>

      {/* Country Details */}
      {country ? (
        <div className="bg-blue-950/30 border border-blue-800/50 rounded-none p-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{getCountryFlag(country.code)}</span>
            <div>
              <h4 className="text-white font-bold">{country.name}</h4>
              <p className="text-blue-300 text-xs font-mono">Eurozone Member</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 p-3 rounded-none">
              <div className="text-gray-500 text-xs">GDP Growth</div>
              <div className={`text-lg font-bold ${(country.gdp_growth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {country.gdp_growth !== null ? `${country.gdp_growth >= 0 ? '+' : ''}${country.gdp_growth.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-none">
              <div className="text-gray-500 text-xs">Inflation</div>
              <div className="text-lg font-bold text-[#B8A892]">
                {country.inflation_rate !== null ? `${country.inflation_rate.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-none">
              <div className="text-gray-500 text-xs">Unemployment</div>
              <div className="text-lg font-bold text-blue-400">
                {country.unemployment_rate !== null ? `${country.unemployment_rate.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-none">
              <div className="text-gray-500 text-xs">Debt/GDP</div>
              <div className={`text-lg font-bold ${(country.debt_to_gdp ?? 0) > 100 ? 'text-red-400' : 'text-green-400'}`}>
                {country.debt_to_gdp !== null ? `${country.debt_to_gdp.toFixed(1)}%` : 'N/A'}
              </div>
            </div>
            <div className="bg-gray-900/50 p-3 rounded-none col-span-2">
              <div className="text-gray-500 text-xs">10Y Bond Yield</div>
              <div className="text-lg font-bold text-white">
                {country.bond_yield_10y !== null ? `${country.bond_yield_10y.toFixed(2)}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-900/30 border border-gray-800 rounded-none p-8 text-center">
          <Building2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Select a country to view details</p>
        </div>
      )}
    </div>
  );
});

export default EuropeWidget;
