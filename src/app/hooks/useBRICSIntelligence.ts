/**
 * BRICS Intelligence Hook
 * Fetches and manages BRICS geoeconomic data
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BRICSIntelligence, BRICSWidgetState } from '../types/brics';
import { fetchBRICSIntelligence } from '../services/bricsService';

// Global cache to prevent duplicate fetches across components
let globalCache: { data: BRICSIntelligence; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useBRICSIntelligence() {
  const [state, setState] = useState<BRICSWidgetState>({
    data: globalCache?.data ?? null,
    loading: !globalCache,
    error: null,
    selectedView: 'momentum',
    timeRange: '10Y',
  });

  const isMounted = useRef(true);
  const fetchInProgress = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    // Check cache validity
    if (!force && globalCache && Date.now() - globalCache.timestamp < CACHE_TTL) {
      if (isMounted.current) {
        setState((prev) => ({
          ...prev,
          data: globalCache!.data,
          loading: false,
          error: null,
        }));
      }
      return;
    }

    // Prevent duplicate fetches
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    if (isMounted.current) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      const data = await fetchBRICSIntelligence();

      // Update global cache
      globalCache = { data, timestamp: Date.now() };

      if (isMounted.current) {
        setState((prev) => ({
          ...prev,
          data,
          loading: false,
          error: null,
        }));
      }
    } catch (error) {
      console.error('[useBRICSIntelligence] Error:', error);
      if (isMounted.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch BRICS data',
        }));
      }
    } finally {
      fetchInProgress.current = false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [fetchData]);

  // View selection
  const setSelectedView = useCallback((view: 'momentum' | 'powershift' | 'breakdown') => {
    setState((prev) => ({ ...prev, selectedView: view }));
  }, []);

  // Time range selection
  const setTimeRange = useCallback((range: '5Y' | '10Y' | '20Y') => {
    setState((prev) => ({ ...prev, timeRange: range }));
  }, []);

  // Refresh data
  const refresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    ...state,
    setSelectedView,
    setTimeRange,
    refresh,
  };
}
