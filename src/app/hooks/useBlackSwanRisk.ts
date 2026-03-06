import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface BlackSwanRiskData {
  average7d: number | null;
  average30d: number | null;
  average90d: number | null;
  latestRisk: number | null;
  loading: boolean;
  error: string | null;
}

// Cache configuration: 30 seconds
const CACHE_DURATION_MS = 30 * 1000;

interface CachedData {
  data: BlackSwanRiskData;
  timestamp: number;
}

// Global cache to share between component instances
let globalCache: CachedData | null = null;

/**
 * Hook to fetch Black Swan Risk Index data from Supabase
 * Implements 7D/30D/90D averages with 30-second caching
 */
export function useBlackSwanRisk(): BlackSwanRiskData & { refresh: () => Promise<void> } {
  const [data, setData] = useState<BlackSwanRiskData>({
    average7d: null,
    average30d: null,
    average90d: null,
    latestRisk: null,
    loading: true,
    error: null,
  });

  const isMounted = useRef(true);

  const fetchRiskData = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && globalCache && Date.now() - globalCache.timestamp < CACHE_DURATION_MS) {
      if (isMounted.current) {
        setData(globalCache.data);
      }
      return;
    }

    if (!supabase) {
      const errorData: BlackSwanRiskData = {
        average7d: null,
        average30d: null,
        average90d: null,
        latestRisk: null,
        loading: false,
        error: 'Supabase not configured',
      };
      if (isMounted.current) setData(errorData);
      return;
    }

    try {
      // Direct queries to market_snapshots table
      // This approach works without requiring RPC functions
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch all data in parallel
      const [result7d, result30d, result90d, resultLatest] = await Promise.all([
        // 7 Day data
        supabase
          .from('market_snapshots')
          .select('systemic_risk')
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false }),
        // 30 Day data
        supabase
          .from('market_snapshots')
          .select('systemic_risk')
          .gte('created_at', thirtyDaysAgo)
          .order('created_at', { ascending: false }),
        // 90 Day data
        supabase
          .from('market_snapshots')
          .select('systemic_risk')
          .gte('created_at', ninetyDaysAgo)
          .order('created_at', { ascending: false }),
        // Latest snapshot for fallback
        supabase
          .from('market_snapshots')
          .select('systemic_risk')
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ]);

      // Calculate averages from data
      const calculateAvg = (data: { systemic_risk: number }[] | null): number | null => {
        if (!data || data.length === 0) return null;
        const validData = data.filter(row => row.systemic_risk != null);
        if (validData.length === 0) return null;
        const sum = validData.reduce((acc, row) => acc + row.systemic_risk, 0);
        return sum / validData.length;
      };

      // Normalize values: if stored as decimal (0-1), convert to percentage (0-100)
      const normalize = (val: number | null): number | null => {
        if (val === null) return null;
        return val > 1 ? Math.round(val) : Math.round(val * 100);
      };

      // Extract latest risk as fallback
      const latestRisk = resultLatest.data?.systemic_risk ?? null;
      const latestNormalized = normalize(latestRisk);
      
      // Calculate averages or fallback to latest
      const avg7d = calculateAvg(result7d.data);
      const avg30d = calculateAvg(result30d.data);
      const avg90d = calculateAvg(result90d.data);

      const newData: BlackSwanRiskData = {
        average7d: normalize(avg7d) ?? latestNormalized,
        average30d: normalize(avg30d) ?? latestNormalized,
        average90d: normalize(avg90d) ?? latestNormalized,
        latestRisk: latestNormalized,
        loading: false,
        error: null,
      };

      // Update cache
      globalCache = {
        data: newData,
        timestamp: Date.now(),
      };

      if (isMounted.current) {
        setData(newData);
      }
    } catch (err) {
      console.error('[useBlackSwanRisk] Error fetching risk data:', err);
      
      const errorData: BlackSwanRiskData = {
        average7d: null,
        average30d: null,
        average90d: null,
        latestRisk: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch risk data',
      };
      if (isMounted.current) setData(errorData);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchRiskData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchRiskData(true), CACHE_DURATION_MS);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchRiskData]);

  return {
    ...data,
    refresh: () => fetchRiskData(true),
  };
}

/**
 * Get color for risk value
 * 0-40 → Green (#22c55e)
 * 40-70 → Yellow (#fbbf24)
 * 70-85 → Orange (#f97316)
 * 85+ → Red (#ef4444)
 */
export function getRiskColor(value: number | null): string {
  if (value === null) return '#6b7280'; // gray
  if (value < 40) return '#22c55e'; // green
  if (value < 70) return '#fbbf24'; // yellow
  if (value < 85) return '#f97316'; // orange
  return '#ef4444'; // red
}

export function getRiskColorClass(value: number | null): string {
  if (value === null) return 'text-gray-500';
  if (value < 40) return 'text-green-500';
  if (value < 70) return 'text-[#B8A892]';
  if (value < 85) return 'text-[#A3937B]';
  return 'text-red-500';
}
