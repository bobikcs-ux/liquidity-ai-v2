'use client';

/**
 * India Fiscal Widget - "Saffron Finance" Dashboard
 * Sovereign aesthetic with India's tricolor accents
 */

import React, { memo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  PieChart,
  Wallet,
  Building2,
} from 'lucide-react';
import { useAsianIntelligence, getFiscalStatusColor } from '../hooks/useAsianIntelligence';
import { formatGSTValue } from '../services/indiaFiscalService';
import type { IndiaFiscalData, IndiaEconomicPulse } from '../types/japan-india';

// India color palette (saffron, white, green)
const INDIA_COLORS = {
  saffron: '#FF9933',
  white: '#FFFFFF',
  green: '#138808',
  navy: '#000080', // Ashoka Chakra
  black: '#000000',
};

type IndiaView = 'overview' | 'gst-breakdown' | 'fiscal-health';

/**
 * GST Collection Gauge
 */
const GSTGauge = memo(function GSTGauge({ 
  data,
  pulse,
}: { 
  data: IndiaFiscalData | null;
  pulse: IndiaEconomicPulse | null;
}) {
  if (!data || !pulse) {
    return (
      <div className="bg-black border border-orange-900/50 rounded-none p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded-none w-1/2" />
          <div className="h-24 bg-gray-800 rounded-none" />
        </div>
      </div>
    );
  }

  const trendColor = pulse.gstCollection.trend === 'ACCELERATING' 
    ? 'text-green-500' 
    : pulse.gstCollection.trend === 'DECELERATING' 
      ? 'text-red-500' 
      : 'text-[#A3937B]';

  return (
    <div className="bg-black border border-orange-900/50 rounded-none p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-orange-500" />
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            GST Collection
          </span>
        </div>
        <span className={`text-xs font-bold uppercase ${trendColor}`}>
          {pulse.gstCollection.trend}
        </span>
      </div>

      {/* Main Value */}
      <div className="text-center py-6">
        <div className="text-4xl font-bold text-white font-mono">
          {formatGSTValue(pulse.gstCollection.total)}
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          {data.yoy_change >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-lg font-mono ${data.yoy_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data.yoy_change >= 0 ? '+' : ''}{data.yoy_change.toFixed(1)}%
          </span>
          <span className="text-sm text-gray-500">YoY</span>
        </div>
      </div>

      {/* Mini Bar Chart - GST Components */}
      <div className="pt-4 border-t border-orange-900/30">
        <div className="flex items-end justify-between h-16 gap-2">
          <div className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-orange-500/80 rounded-none"
              style={{ height: `${(pulse.gstCollection.cgst / pulse.gstCollection.total) * 200}%` }}
            />
            <span className="text-[10px] text-gray-500 mt-1">CGST</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-green-500/80 rounded-none"
              style={{ height: `${(pulse.gstCollection.sgst / pulse.gstCollection.total) * 200}%` }}
            />
            <span className="text-[10px] text-gray-500 mt-1">SGST</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-blue-500/80 rounded-none"
              style={{ height: `${(pulse.gstCollection.igst / pulse.gstCollection.total) * 200}%` }}
            />
            <span className="text-[10px] text-gray-500 mt-1">IGST</span>
          </div>
          <div className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-purple-500/80 rounded-none"
              style={{ height: `${(pulse.gstCollection.cess / pulse.gstCollection.total) * 200}%` }}
            />
            <span className="text-[10px] text-gray-500 mt-1">Cess</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Fiscal Health Card
 */
const FiscalHealthCard = memo(function FiscalHealthCard({
  pulse,
}: {
  pulse: IndiaEconomicPulse | null;
}) {
  if (!pulse) {
    return (
      <div className="bg-black border border-orange-900/30 rounded-none p-4">
        <div className="animate-pulse h-20 bg-gray-800 rounded-none" />
      </div>
    );
  }

  const statusColor = getFiscalStatusColor(pulse.fiscalHealth.status);
  const deficitWidth = Math.min((pulse.fiscalHealth.deficitToGDP / 10) * 100, 100);

  return (
    <div className="bg-black border border-orange-900/30 rounded-none p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
            Fiscal Health
          </span>
        </div>
        <span className={`text-xs font-bold uppercase ${statusColor}`}>
          {pulse.fiscalHealth.status}
        </span>
      </div>

      <div className="space-y-3">
        {/* Deficit to GDP */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Deficit/GDP</span>
            <span className="text-white font-mono">{pulse.fiscalHealth.deficitToGDP.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-900 rounded-none overflow-hidden">
            <div 
              className={`h-full transition-all ${
                pulse.fiscalHealth.deficitToGDP > 6 
                  ? 'bg-red-500' 
                  : pulse.fiscalHealth.deficitToGDP > 5 
                    ? 'bg-[#A3937B]' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${deficitWidth}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>0%</span>
            <span className="text-amber-600">Target: 5.9%</span>
            <span>10%</span>
          </div>
        </div>

        {/* Revenue Growth */}
        <div className="flex items-center justify-between pt-2 border-t border-orange-900/20">
          <span className="text-xs text-gray-500">Revenue Growth</span>
          <span className={`text-sm font-mono ${
            pulse.fiscalHealth.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {pulse.fiscalHealth.revenueGrowth >= 0 ? '+' : ''}{pulse.fiscalHealth.revenueGrowth.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * GST Breakdown Panel
 */
const GSTBreakdown = memo(function GSTBreakdown({
  pulse,
}: {
  pulse: IndiaEconomicPulse | null;
}) {
  if (!pulse) return null;

  const components = [
    { name: 'CGST', value: pulse.gstCollection.cgst, color: 'bg-orange-500', desc: 'Central GST' },
    { name: 'SGST', value: pulse.gstCollection.sgst, color: 'bg-green-500', desc: 'State GST' },
    { name: 'IGST', value: pulse.gstCollection.igst, color: 'bg-blue-500', desc: 'Integrated GST' },
    { name: 'Cess', value: pulse.gstCollection.cess, color: 'bg-purple-500', desc: 'Compensation Cess' },
  ];

  return (
    <div className="bg-black border border-orange-900/30 rounded-none p-4">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          GST Component Breakdown
        </span>
      </div>

      <div className="space-y-3">
        {components.map((comp) => (
          <div key={comp.name} className="flex items-center gap-3">
            <div className={`w-3 h-3 ${comp.color} rounded-none`} />
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-sm text-white">{comp.name}</span>
                <span className="text-sm text-white font-mono">
                  {formatGSTValue(comp.value)}
                </span>
              </div>
              <div className="text-[10px] text-gray-500">{comp.desc}</div>
            </div>
            <span className="text-xs text-gray-500">
              {((comp.value / pulse.gstCollection.total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * Historical Trend Chart
 */
const HistoricalTrend = memo(function HistoricalTrend({
  data,
}: {
  data: IndiaFiscalData[];
}) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div className="bg-black border border-orange-900/30 rounded-none p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-orange-500" />
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
          12-Month Trend
        </span>
      </div>

      <div className="flex items-end justify-between h-24 gap-1">
        {data.map((point, i) => {
          const height = range > 0 
            ? ((point.value - minValue) / range) * 80 + 20 
            : 50;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group">
              <div 
                className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-none transition-all group-hover:from-orange-500 group-hover:to-orange-300"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between text-[10px] text-gray-600 mt-2">
        <span>{data[0]?.period.slice(5)}</span>
        <span>{data[data.length - 1]?.period.slice(5)}</span>
      </div>
    </div>
  );
});

/**
 * Main India Fiscal Widget
 */
export const IndiaFiscalWidget = memo(function IndiaFiscalWidget() {
  const { india, refresh } = useAsianIntelligence();
  const [view, setView] = useState<IndiaView>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="bg-black border border-orange-900/50 rounded-none overflow-hidden">
      {/* Header - Tricolor Theme */}
      <div className="relative overflow-hidden">
        {/* Tricolor Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-950/20 via-transparent to-green-950/20" />
        
        <div className="relative px-6 py-4 border-b border-orange-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                INDIA FISCAL LAYER
              </h2>
              <p className="text-xs text-gray-500 font-mono mt-1">
                GST Portal // Fiscal Intelligence Monitor
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-orange-900/20 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* View Tabs */}
          <div className="flex gap-4 mt-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'gst-breakdown', label: 'GST Breakdown' },
              { id: 'fiscal-health', label: 'Fiscal Health' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id as IndiaView)}
                className={`text-xs font-mono uppercase tracking-wider pb-2 border-b-2 transition-colors ${
                  view === tab.id
                    ? 'text-orange-500 border-orange-500'
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
            <GSTGauge data={india.gstData} pulse={india.economicPulse} />
            <div className="grid grid-cols-2 gap-3">
              <FiscalHealthCard pulse={india.economicPulse} />
              <HistoricalTrend data={india.historicalGST} />
            </div>
          </div>
        )}

        {view === 'gst-breakdown' && (
          <div className="space-y-4">
            <GSTBreakdown pulse={india.economicPulse} />
            <HistoricalTrend data={india.historicalGST} />
          </div>
        )}

        {view === 'fiscal-health' && (
          <div className="space-y-4">
            <FiscalHealthCard pulse={india.economicPulse} />
            
            <div className="bg-gray-950 border border-orange-900/30 rounded-none p-4">
              <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
                Fiscal Analysis
              </h4>
              <div className="space-y-3 text-sm text-gray-300">
                <p>
                  India's fiscal position is monitored through GST collections as a proxy 
                  for economic activity. Strong GST growth indicates robust domestic consumption 
                  and manufacturing output.
                </p>
                
                {india.economicPulse?.fiscalHealth.status === 'STRESS' && (
                  <div className="p-3 bg-red-950/30 border border-red-800/50 rounded-none">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs text-red-300">
                        Fiscal deficit above comfort zone. Monitor bond yields and 
                        rupee pressure for signs of market stress.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-orange-900/30 bg-orange-950/10">
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>Source: GST Portal (GSTN)</span>
          <span>{india.lastUpdated ? new Date(india.lastUpdated).toLocaleTimeString() : '--:--'}</span>
        </div>
      </div>
    </div>
  );
});

export default IndiaFiscalWidget;
