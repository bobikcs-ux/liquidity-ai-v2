import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { supabase } from '../lib/supabase';
import { GLOBAL_FEAR_GREED_VALUE } from '../hooks/useMarketSnapshot';

interface YieldCurveData {
  date: string;
  value: number;
}

interface PriceData {
  date: string;
  price: number;
  fearGreed: number;
}

interface MarketChartsProps {
  className?: string;
}

export function MarketCharts({ className = '' }: MarketChartsProps) {
  const [yieldCurveData, setYieldCurveData] = useState<YieldCurveData[]>([]);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<'yield' | 'price'>('yield');
  const { uiTheme } = useAdaptiveTheme();

  const isDark = uiTheme === 'dark';
  const isHybrid = uiTheme === 'hybrid';

  // Fetch historical data from Supabase - NO MOCK DATA
  // Query: SELECT created_at, btc_price, systemic_risk, yield_spread FROM market_snapshots ORDER BY created_at ASC LIMIT 200
  const fetchHistoricalData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (!supabase) {
        // No Supabase - show waiting state
        setYieldCurveData([]);
        setPriceData([]);
        setIsLoading(false);
        return;
      }
      
      // Fetch from market_snapshots table (primary source)
      const { data: snapshotData, error: snapshotError } = await supabase
        .from('market_snapshots')
        .select('created_at, btc_price, yield_spread, systemic_risk')
        .order('created_at', { ascending: true })
        .limit(200);

      if (snapshotError) {
        console.error('Failed to fetch market data:', snapshotError);
        setYieldCurveData([]);
        setPriceData([]);
        return;
      }
      
      if (!snapshotData || snapshotData.length === 0) {
        // No data yet - show waiting state, DO NOT generate mock data
        setYieldCurveData([]);
        setPriceData([]);
        return;
      }

      // Transform for yield curve chart
      const yieldData: YieldCurveData[] = snapshotData.map(row => ({
        date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: row.yield_spread || 0,
      }));
      setYieldCurveData(yieldData);

      // Transform for price chart - use GLOBAL Fear & Greed value (22 = Extreme Fear)
      const priceHistory: PriceData[] = snapshotData.map(row => ({
        date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: row.btc_price || 0,
        fearGreed: GLOBAL_FEAR_GREED_VALUE, // Consistent Fear & Greed = 22
      }));
      setPriceData(priceHistory);
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      // Do NOT fall back to mock data - show error state
      setYieldCurveData([]);
      setPriceData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  // Chart colors based on theme
  const colors = {
    primary: isDark || isHybrid ? '#f59e0b' : '#d97706',
    secondary: isDark || isHybrid ? '#3b82f6' : '#2563eb',
    danger: isDark || isHybrid ? '#ef4444' : '#dc2626',
    success: isDark || isHybrid ? '#22c55e' : '#16a34a',
    grid: isDark ? '#374151' : isHybrid ? '#4b5563' : '#e5e7eb',
    text: isDark || isHybrid ? '#9ca3af' : '#6b7280',
    bg: isDark ? '#1f2937' : isHybrid ? '#374151' : '#ffffff',
  };

  // Calculate statistics
  const latestYield = yieldCurveData[yieldCurveData.length - 1]?.value || 0;
  const latestPrice = priceData[priceData.length - 1]?.price || 0;
  const latestFearGreed = priceData[priceData.length - 1]?.fearGreed || 50;
  const priceChange = priceData.length > 1 
    ? ((latestPrice - priceData[priceData.length - 2]?.price) / priceData[priceData.length - 2]?.price * 100).toFixed(2)
    : '0.00';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className={`p-3 rounded-lg shadow-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : isHybrid ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
      }`}>
        <p className={`text-xs font-medium mb-2 ${isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'}`}>
          {label}
        </p>
        {payload.map((entry, idx) => (
          <p key={idx} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'Price' ? `$${entry.value.toLocaleString()}` : entry.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className={`rounded-xl overflow-hidden w-full ${
      isDark ? 'bg-[#0b0f17] border border-[#1f2937]' : isHybrid ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'
    } ${className}`}>
      {/* Header - Responsive with flex-wrap */}
      <div className={`flex flex-wrap md:flex-nowrap items-center justify-between gap-2 p-3 md:p-4 border-b ${
        isDark ? 'border-gray-700' : isHybrid ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-2 shrink-0">
          <Activity className={`w-4 h-4 md:w-5 md:h-5 ${isDark || isHybrid ? 'text-amber-400' : 'text-amber-600'}`} />
          <h3 className={`text-sm md:text-base font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
            Market Analytics
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Chart Toggle */}
          <div className={`flex rounded-lg p-0.5 md:p-1 ${isDark ? 'bg-gray-800' : isHybrid ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <button
              onClick={() => setActiveChart('yield')}
              className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeChart === 'yield'
                  ? isDark || isHybrid ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
                  : isDark || isHybrid ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yield
            </button>
            <button
              onClick={() => setActiveChart('price')}
              className={`px-2 md:px-3 py-1 text-[10px] md:text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeChart === 'price'
                  ? isDark || isHybrid ? 'bg-amber-600 text-white' : 'bg-amber-500 text-white'
                  : isDark || isHybrid ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Price
            </button>
          </div>
          <button
            onClick={fetchHistoricalData}
            disabled={isLoading}
            aria-label={isLoading ? 'Refreshing data' : 'Refresh market data'}
            className={`p-1.5 md:p-2 rounded-lg transition-colors ${
              isDark || isHybrid ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Bar - Layout locked with shrink-0 and min-w */}
      <div className={`flex flex-wrap md:flex-nowrap gap-3 md:gap-4 p-3 md:p-4 border-b ${
        isDark ? 'border-gray-700 bg-gray-800/50' : isHybrid ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
      }`}>
        <div className="flex items-center gap-2 min-w-[140px] shrink-0 whitespace-nowrap overflow-hidden">
          <div>
            <p className={`text-[10px] md:text-xs ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}`}>Yield Curve</p>
            <div className="flex items-center gap-1">
              <span className={`font-mono font-semibold tabular-nums text-sm md:text-base ${latestYield < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {latestYield.toFixed(3)}%
              </span>
              {latestYield < 0 ? (
                <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-red-500 flex-shrink-0" />
              ) : (
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-[160px] shrink-0 whitespace-nowrap overflow-hidden">
          <div>
            <p className={`text-[10px] md:text-xs ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}`}>BTC Price</p>
            <div className="flex items-center gap-1">
              <span className={`font-mono font-semibold tabular-nums text-sm md:text-base ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                ${latestPrice.toLocaleString()}
              </span>
              <span className={`text-[10px] md:text-xs tabular-nums ${parseFloat(priceChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-[100px] shrink-0 whitespace-nowrap overflow-hidden">
          <div>
            <p className={`text-[10px] md:text-xs ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}`}>Fear & Greed</p>
            <span className={`font-mono font-semibold tabular-nums text-sm md:text-base ${
              latestFearGreed < 25 ? 'text-red-500' : latestFearGreed > 75 ? 'text-green-500' : 'text-amber-500'
            }`}>
              {latestFearGreed}/100
            </span>
          </div>
        </div>
      </div>

      {/* Chart - Fixed container with aspect ratio per spec */}
      <div className="p-3 md:p-4 aspect-[16/9] min-h-[220px] max-h-[300px]">
        {isLoading ? (
          <div className={`h-full flex items-center justify-center ${isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'}`}>
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        ) : (yieldCurveData.length === 0 && priceData.length === 0) ? (
          <div className={`h-full flex flex-col items-center justify-center gap-3 ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}`}>
            <AlertCircle className="w-10 h-10 text-amber-500" />
            <p className="text-sm font-medium">Waiting for first market snapshot...</p>
            <p className="text-xs opacity-60">Charts will populate when data is available from Supabase</p>
          </div>
        ) : activeChart === 'yield' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={yieldCurveData}>
              <defs>
                <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: colors.text }}
                axisLine={{ stroke: colors.grid }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: colors.text }}
                axisLine={{ stroke: colors.grid }}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke={colors.danger} strokeDasharray="5 5" label={{ value: 'Inversion', fill: colors.danger, fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="value"
                name="Yield Spread"
                stroke={colors.primary}
                fill="url(#yieldGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: colors.text }}
                axisLine={{ stroke: colors.grid }}
              />
              <YAxis 
                yAxisId="price"
                tick={{ fontSize: 10, fill: colors.text }}
                axisLine={{ stroke: colors.grid }}
                domain={['auto', 'auto']}
                tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                yAxisId="fng"
                orientation="right"
                tick={{ fontSize: 10, fill: colors.text }}
                axisLine={{ stroke: colors.grid }}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                name="Price"
                stroke={colors.primary}
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="fng"
                type="monotone"
                dataKey="fearGreed"
                name="Fear/Greed"
                stroke={colors.secondary}
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info */}
      <div className={`px-3 md:px-4 py-2 text-[10px] md:text-xs border-t truncate ${
        isDark ? 'border-gray-700 text-gray-500' : isHybrid ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-400'
      }`}>
        {activeChart === 'yield' 
          ? 'Negative values indicate yield curve inversion'
          : 'BTC price with Fear & Greed index'}
      </div>
    </div>
  );
}

export default MarketCharts;
