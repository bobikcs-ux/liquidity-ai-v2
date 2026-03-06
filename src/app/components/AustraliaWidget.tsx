'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  Gem,
  RefreshCw,
  Building,
  Ship,
  Activity
} from 'lucide-react';
import type { 
  AustraliaView, 
  AustraliaMacroData, 
  AustraliaSovereignIndex, 
  ChinaExposureIndex 
} from '../types/europe-australia';
import { 
  fetchAustraliaMacroData, 
  calculateChinaExposureIndex, 
  calculateAustraliaSovereignIndex,
  getRiskLevelColor,
  formatAUD
} from '../services/australiaMacroService';

// Cache for data
let cachedData: {
  macro: AustraliaMacroData | null;
  index: AustraliaSovereignIndex | null;
  chinaExposure: ChinaExposureIndex | null;
  timestamp: number;
} = { macro: null, index: null, chinaExposure: null, timestamp: 0 };

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Australia Macro Widget - "Southern Cross" Design
 * Green/gold Australian theme with China exposure monitoring
 */
export const AustraliaWidget = memo(function AustraliaWidget() {
  const [view, setView] = useState<AustraliaView>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AustraliaMacroData | null>(null);
  const [sovereignIndex, setSovereignIndex] = useState<AustraliaSovereignIndex | null>(null);
  const [chinaExposure, setChinaExposure] = useState<ChinaExposureIndex | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache
    if (cachedData.macro && Date.now() - cachedData.timestamp < CACHE_TTL) {
      setData(cachedData.macro);
      setSovereignIndex(cachedData.index);
      setChinaExposure(cachedData.chinaExposure);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const macroData = await fetchAustraliaMacroData();
      const exposure = calculateChinaExposureIndex(macroData);
      const index = calculateAustraliaSovereignIndex(macroData, exposure);

      // Update cache
      cachedData = {
        macro: macroData,
        index,
        chinaExposure: exposure,
        timestamp: Date.now(),
      };

      setData(macroData);
      setSovereignIndex(index);
      setChinaExposure(exposure);
    } catch (error) {
      console.error('[AustraliaWidget] Error fetching data:', error);
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
    if (value >= 30) return 'text-amber-400';
    return 'text-green-400';
  };

  return (
    <div className="bg-black border border-green-700/30 rounded-none overflow-hidden">
      {/* Header - Australian Green/Gold Theme */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 px-4 py-3 border-b border-green-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-400 rounded-none flex items-center justify-center">
              <Gem className="w-5 h-5 text-green-900" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">AUSTRALIA MACRO</h3>
              <p className="text-green-300 text-xs font-mono">RBA // ABS Data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {sovereignIndex?.china_decoupling_alert && (
              <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-none">
                <span className="text-red-400 text-xs font-bold animate-pulse">CHINA ALERT</span>
              </div>
            )}
            <button 
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 hover:bg-green-700/50 rounded-none transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-green-300 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex border-b border-green-900/50">
        {(['OVERVIEW', 'CHINA_EXPOSURE', 'COMMODITIES'] as AustraliaView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
              view === v 
                ? 'bg-green-900/50 text-amber-400 border-b-2 border-amber-400' 
                : 'text-gray-400 hover:text-white hover:bg-green-900/30'
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
            <RefreshCw className="w-6 h-6 text-green-400 animate-spin" />
          </div>
        ) : view === 'OVERVIEW' ? (
          <OverviewView 
            data={data} 
            index={sovereignIndex} 
            getTrendIcon={getTrendIcon}
            getIndexColor={getIndexColor}
          />
        ) : view === 'CHINA_EXPOSURE' ? (
          <ChinaExposureView exposure={chinaExposure} />
        ) : (
          <CommoditiesView data={data} index={sovereignIndex} />
        )}
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
  data: AustraliaMacroData | null;
  index: AustraliaSovereignIndex | null;
  getTrendIcon: (trend: string) => React.ReactNode;
  getIndexColor: (value: number) => string;
}) {
  if (!data || !index) return null;

  return (
    <div className="space-y-4">
      {/* Sovereign Index Gauge */}
      <div className="bg-green-950/30 border border-green-800/50 rounded-none p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-xs font-mono">AUSTRALIA SOVEREIGN INDEX</span>
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
              index.value >= 30 ? 'bg-amber-400' : 'bg-green-500'
            }`}
            style={{ width: `${index.value}%` }}
          />
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
                    value >= 30 ? 'bg-amber-400' : 'bg-green-500'
                  }`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900/50 border border-gray-800 rounded-none p-3 text-center">
          <div className="text-gray-500 text-xs font-mono mb-1">GDP GROWTH</div>
          <div className={`text-lg font-bold ${(data.gdp_growth ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.gdp_growth !== null ? `${data.gdp_growth >= 0 ? '+' : ''}${data.gdp_growth.toFixed(1)}%` : 'N/A'}
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-none p-3 text-center">
          <div className="text-gray-500 text-xs font-mono mb-1">RBA RATE</div>
          <div className="text-lg font-bold text-green-400">
            {data.rba_cash_rate?.toFixed(2)}%
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-none p-3 text-center">
          <div className="text-gray-500 text-xs font-mono mb-1">AUD/USD</div>
          <div className="text-lg font-bold text-amber-400">
            {data.aud_usd?.toFixed(4)}
          </div>
        </div>
      </div>
    </div>
  );
});

// China Exposure View Component
const ChinaExposureView = memo(function ChinaExposureView({
  exposure,
}: {
  exposure: ChinaExposureIndex | null;
}) {
  if (!exposure) return null;

  return (
    <div className="space-y-4">
      {/* China Exposure Header */}
      <div className={`border rounded-none p-4 ${getRiskLevelColor(exposure.risk_level)}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🇨🇳</span>
            <span className="text-white font-bold">CHINA EXPOSURE INDEX</span>
          </div>
          <span className={`px-2 py-1 text-xs font-bold rounded-none ${
            exposure.risk_level === 'CRITICAL' ? 'bg-red-500 text-white' :
            exposure.risk_level === 'HIGH' ? 'bg-orange-500 text-white' :
            exposure.risk_level === 'MODERATE' ? 'bg-amber-400 text-black' :
            'bg-green-500 text-white'
          }`}>
            {exposure.risk_level}
          </span>
        </div>
        
        <div className="flex items-end gap-4 mb-3">
          <span className={`text-5xl font-black ${
            exposure.value >= 60 ? 'text-red-500' :
            exposure.value >= 45 ? 'text-orange-400' :
            exposure.value >= 30 ? 'text-amber-400' : 'text-green-400'
          }`}>
            {exposure.value}
          </span>
          <span className="text-gray-500 text-sm mb-2">/100</span>
        </div>

        <div className="h-2 bg-gray-800 rounded-none overflow-hidden">
          <div 
            className={`h-full ${
              exposure.value >= 60 ? 'bg-red-500' :
              exposure.value >= 45 ? 'bg-orange-500' :
              exposure.value >= 30 ? 'bg-amber-400' : 'bg-green-500'
            }`}
            style={{ width: `${exposure.value}%` }}
          />
        </div>
      </div>

      {/* Exposure Components */}
      <div className="space-y-3">
        {Object.entries(exposure.components).map(([key, value]) => (
          <div key={key} className="bg-gray-900/50 border border-gray-800 rounded-none p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">
                {key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </span>
              <span className={`font-bold ${
                value >= 60 ? 'text-red-400' :
                value >= 40 ? 'text-orange-400' :
                value >= 20 ? 'text-amber-400' : 'text-green-400'
              }`}>
                {value.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-none overflow-hidden">
              <div 
                className={`h-full ${
                  value >= 60 ? 'bg-red-500' :
                  value >= 40 ? 'bg-orange-500' :
                  value >= 20 ? 'bg-amber-400' : 'bg-green-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Warning Message */}
      {exposure.risk_level === 'CRITICAL' || exposure.risk_level === 'HIGH' ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-none p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">
              High China trade dependency creates vulnerability to geopolitical tensions and demand shocks from Chinese economy.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
});

// Commodities View Component
const CommoditiesView = memo(function CommoditiesView({
  data,
  index,
}: {
  data: AustraliaMacroData | null;
  index: AustraliaSovereignIndex | null;
}) {
  if (!data) return null;

  const commodities = [
    { 
      name: 'Iron Ore', 
      price: data.iron_ore_price, 
      unit: 'USD/t',
      icon: <Gem className="w-5 h-5" />,
      color: 'text-orange-400'
    },
    { 
      name: 'Coal', 
      price: data.coal_price, 
      unit: 'USD/t',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-gray-400'
    },
    { 
      name: 'Trade Balance', 
      price: data.trade_balance, 
      unit: 'Bn AUD',
      icon: <Ship className="w-5 h-5" />,
      color: 'text-green-400'
    },
  ];

  return (
    <div className="space-y-4">
      {/* Commodity Shock Alert */}
      {index?.commodity_shock_alert && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-none p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-bold">COMMODITY SHOCK RISK ELEVATED</span>
          </div>
        </div>
      )}

      {/* Commodity Cards */}
      <div className="space-y-3">
        {commodities.map((commodity) => (
          <div key={commodity.name} className="bg-gray-900/50 border border-gray-800 rounded-none p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gray-800 rounded-none flex items-center justify-center ${commodity.color}`}>
                  {commodity.icon}
                </div>
                <div>
                  <div className="text-white font-bold">{commodity.name}</div>
                  <div className="text-gray-500 text-xs font-mono">{commodity.unit}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${commodity.color}`}>
                  {commodity.price !== null ? commodity.price.toFixed(1) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Housing Market */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-none p-4">
        <div className="flex items-center gap-3 mb-3">
          <Building className="w-5 h-5 text-blue-400" />
          <span className="text-white font-bold">Housing Market</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500 text-xs">Price Index</div>
            <div className="text-xl font-bold text-blue-400">
              {data.housing_index?.toFixed(1) ?? 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-xs">Risk Level</div>
            <div className={`text-xl font-bold ${
              (index?.components.housing_risk ?? 0) >= 60 ? 'text-red-400' :
              (index?.components.housing_risk ?? 0) >= 40 ? 'text-orange-400' :
              'text-green-400'
            }`}>
              {index?.components.housing_risk ?? 'N/A'}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AustraliaWidget;
