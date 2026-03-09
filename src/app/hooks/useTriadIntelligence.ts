/**
 * useTriadIntelligence Hook
 * Real-time data management for Triad Intelligence Dashboard
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  TriadDashboardState,
  LiquidityStressData,
  ConflictRadarData,
  ChokepointMonitorData,
  SystemicRiskAssessment,
  TopStatusBarData,
  ExportSnapshot,
} from '../types/triad';
import {
  fetchLiquidityStressData,
  fetchConflictRadarData,
  fetchChokepointData,
  calculateSystemicRisk,
  generateExportSnapshot,
  downloadSnapshot,
} from '../services/triadIntelligenceService';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD = 10 * 60 * 1000; // 10 minutes

export function useTriadIntelligence() {
  const [state, setState] = useState<TriadDashboardState>({
    liquidity: null,
    conflict: null,
    chokepoints: null,
    systemicRisk: null,
    isLoading: true,
    error: null,
    lastFullUpdate: '',
    aiMode: 'PASSIVE',
    systemStatus: 'ONLINE',
    dataSyncStatus: 'SYNCING',
  });

  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAllData = useCallback(async () => {
    const now = Date.now();
    
    // Prevent duplicate fetches
    if (now - lastFetchRef.current < 10000) return;
    lastFetchRef.current = now;

    setState(prev => ({ ...prev, dataSyncStatus: 'SYNCING' }));

    try {
      // Fetch all data in parallel
      const [liquidity, conflict, chokepoints] = await Promise.all([
        fetchLiquidityStressData(),
        fetchConflictRadarData(),
        fetchChokepointData(),
      ]);

      // Calculate systemic risk
      const systemicRisk = calculateSystemicRisk(liquidity, conflict, chokepoints);

      // Determine AI mode based on risk level
      const aiMode = systemicRisk.isSystemicCollapse 
        ? 'ALERT' 
        : systemicRisk.riskLevel === 'HIGH' 
          ? 'ACTIVE' 
          : 'PASSIVE';

      // Check for stale data
      const hasStaleData = liquidity.isStale || conflict.isStale || chokepoints.isStale;

      setState({
        liquidity,
        conflict,
        chokepoints,
        systemicRisk,
        isLoading: false,
        error: null,
        lastFullUpdate: new Date().toISOString(),
        aiMode,
        systemStatus: hasStaleData ? 'DEGRADED' : 'ONLINE',
        dataSyncStatus: hasStaleData ? 'STALE' : 'SYNCED',
      });
    } catch (error) {
      console.error('[v0] Triad Intelligence fetch error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        systemStatus: 'DEGRADED',
        dataSyncStatus: 'STALE',
      }));
    }
  }, []);

  // Initial fetch and interval setup
  useEffect(() => {
    fetchAllData();

    intervalRef.current = setInterval(fetchAllData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllData]);

  // Manual refresh
  const refresh = useCallback(() => {
    lastFetchRef.current = 0; // Reset to allow immediate fetch
    fetchAllData();
  }, [fetchAllData]);

  // Export snapshot
  const exportSnapshot = useCallback(() => {
    if (!state.liquidity || !state.conflict || !state.chokepoints || !state.systemicRisk) {
      return;
    }

    const snapshot = generateExportSnapshot(
      state.liquidity,
      state.conflict,
      state.chokepoints,
      state.systemicRisk
    );

    downloadSnapshot(snapshot);
  }, [state]);

  // Get status bar data
  const getStatusBarData = useCallback((): TopStatusBarData => {
    const alertLevel = state.systemicRisk?.isSystemicCollapse 
      ? 'RED'
      : state.systemicRisk?.riskLevel === 'HIGH'
        ? 'ORANGE'
        : state.systemicRisk?.riskLevel === 'ELEVATED'
          ? 'YELLOW'
          : 'GREEN';

    return {
      systemStatus: state.systemStatus,
      dataSyncIndicator: state.dataSyncStatus,
      aiMode: state.aiMode,
      lastUpdate: state.lastFullUpdate,
      alertLevel,
    };
  }, [state]);

  return {
    ...state,
    refresh,
    exportSnapshot,
    getStatusBarData,
  };
}

// Helper hook for checking if data is stale
export function useDataFreshness(lastUpdate: string): { isStale: boolean; staleDuration: number } {
  const [staleInfo, setStaleInfo] = useState({ isStale: false, staleDuration: 0 });

  useEffect(() => {
    if (!lastUpdate) {
      setStaleInfo({ isStale: true, staleDuration: 0 });
      return;
    }

    const checkStaleness = () => {
      const updateTime = new Date(lastUpdate).getTime();
      const now = Date.now();
      const duration = now - updateTime;
      
      setStaleInfo({
        isStale: duration > STALE_THRESHOLD,
        staleDuration: Math.floor(duration / 60000), // minutes
      });
    };

    checkStaleness();
    const interval = setInterval(checkStaleness, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [lastUpdate]);

  return staleInfo;
}
