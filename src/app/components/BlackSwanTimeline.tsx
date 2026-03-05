'use client';

import React, { memo, useMemo, useState, useCallback, startTransition } from 'react';
import { TrendingUp, AlertTriangle, Activity, ChevronRight } from 'lucide-react';
import { useBlackSwanRisk, getRiskColorClass } from '../hooks/useBlackSwanRisk';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';

type Timeframe = '7D' | '30D' | '90D';

interface BlackSwanTimelineProps {
  onAlertClick?: () => void;
}

export const BlackSwanTimeline = memo(function BlackSwanTimeline({ onAlertClick }: BlackSwanTimelineProps) {
  const { average7d, average30d, average90d, latestRisk, loading } = useBlackSwanRisk();
  const { history } = useMarketSnapshot();
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('30D');
  
  // Calculate risk acceleration (>20 points rise in 7 days)
  const riskAcceleration = useMemo(() => {
    if (average7d === null || average30d === null) return null;
    
    // Compare 7D average to 30D baseline
    const acceleration = average7d - average30d;
    return acceleration;
  }, [average7d, average30d]);
  
  const isAccelerating = riskAcceleration !== null && riskAcceleration >= 20;
  
  // Get value for selected timeframe
  const getTimeframeValue = useCallback((tf: Timeframe): number | null => {
    switch (tf) {
      case '7D': return average7d;
      case '30D': return average30d;
      case '90D': return average90d;
    }
  }, [average7d, average30d, average90d]);
  
  // Handle timeframe change with transition
  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    startTransition(() => {
      setSelectedTimeframe(tf);
    });
  }, []);
  
  const selectedValue = getTimeframeValue(selectedTimeframe);
  
  return (
    <div className="bg-[#0a1628] border border-blue-900/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Black Swan Timeline
          </h3>
        </div>
        
        {/* Risk Acceleration Alert */}
        {isAccelerating && (
          <button 
            onClick={onAlertClick}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/20 border border-red-500/50 animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-bold text-red-400 font-mono">RISK ACCELERATION</span>
          </button>
        )}
      </div>
      
      {/* Timeframe selector */}
      <div className="flex gap-2 mb-4">
        {(['7D', '30D', '90D'] as Timeframe[]).map(tf => {
          const value = getTimeframeValue(tf);
          const isSelected = selectedTimeframe === tf;
          
          return (
            <button
              key={tf}
              onClick={() => handleTimeframeChange(tf)}
              className={`flex-1 p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                  : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
              }`}
            >
              <div className="text-xs text-gray-400 font-mono mb-1">{tf}</div>
              <div className={`text-xl font-black font-mono tabular-nums ${
                loading ? 'text-gray-500' : getRiskColorClass(value)
              }`}>
                {loading ? '--' : value !== null ? `${value}%` : '--'}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Current risk indicator */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-700/50">
        <div>
          <div className="text-xs text-gray-400 font-mono mb-1">CURRENT RISK</div>
          <div className={`text-2xl font-black font-mono tabular-nums ${getRiskColorClass(latestRisk)}`}>
            {loading ? '--' : latestRisk !== null ? latestRisk : '--'}
          </div>
        </div>
        
        {/* Trend indicator */}
        <div className="text-right">
          <div className="text-xs text-gray-400 font-mono mb-1">
            {selectedTimeframe} TREND
          </div>
          <div className={`flex items-center gap-1 ${
            riskAcceleration !== null 
              ? riskAcceleration > 0 
                ? 'text-red-400' 
                : riskAcceleration < 0 
                  ? 'text-green-400' 
                  : 'text-gray-400'
              : 'text-gray-500'
          }`}>
            {riskAcceleration !== null && (
              <>
                <TrendingUp 
                  className={`w-4 h-4 ${riskAcceleration < 0 ? 'rotate-180' : ''}`}
                />
                <span className="text-lg font-bold font-mono">
                  {riskAcceleration > 0 ? '+' : ''}{Math.round(riskAcceleration)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Risk acceleration warning */}
      {isAccelerating && (
        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-bold text-red-400 mb-1">
                RISK ACCELERATION DETECTED
              </div>
              <p className="text-xs text-red-300/80">
                Systemic risk has increased by {Math.round(riskAcceleration!)} points over the past 7 days.
                This indicates elevated market stress and potential black swan conditions.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Mini timeline visualization */}
      <div className="mt-4 pt-3 border-t border-gray-700/50">
        <div className="flex items-end justify-between h-16 gap-1">
          {[average90d, average30d, average7d, latestRisk].map((value, i) => {
            const height = value !== null ? Math.max(10, (value / 100) * 100) : 10;
            const labels = ['90D', '30D', '7D', 'NOW'];
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`w-full rounded-t transition-all ${
                    value !== null && value >= 70 
                      ? 'bg-red-500' 
                      : value !== null && value >= 40 
                        ? 'bg-amber-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-gray-500 font-mono">{labels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default BlackSwanTimeline;
