/**
 * useSnapshotFirst Hook
 * Provides <100ms data access by reading ONLY from Supabase snapshots
 * External APIs are synced by background Edge Functions
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchGlobalSnapshot,
  fetchEnergySnapshot,
  fetchMacroSnapshot,
  fetchGeopoliticsSnapshot,
  type GlobalSnapshot,
  type EnergySnapshot,
  type MacroSnapshot,
  type GeopoliticsSnapshot,
} from '../services/snapshotFirstService';

const REFRESH_INTERVAL = 30_000; // 30 seconds — snapshots are fast

export interface UseSnapshotFirstReturn {
  data: GlobalSnapshot | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  latencyMs: number;
  
  // Quick accessors
  energy: EnergySnapshot | null;
  macro: MacroSnapshot | null;
  geopolitics: GeopoliticsSnapshot | null;
  
  // Status indicators
  isLive: boolean;
  isDegraded: boolean;
  isOffline: boolean;
}

export function useSnapshotFirst(): UseSnapshotFirstReturn {
  const [data, setData] = useState<GlobalSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState(0);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const start = Date.now();
      const snapshot = await fetchGlobalSnapshot();
      
      if (!mountedRef.current) return;
      
      setData(snapshot);
      setLatencyMs(Date.now() - start);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch snapshots');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refresh]);

  // Derive status
  const allStatuses = [
    data?.energy?.status,
    data?.macro?.status,
    data?.geopolitics?.status,
  ].filter(Boolean);
  
  const liveCount = allStatuses.filter(s => s === 'LIVE').length;
  const offlineCount = allStatuses.filter(s => s === 'OFFLINE').length;

  return {
    data,
    isLoading,
    error,
    refresh,
    latencyMs,
    
    // Quick accessors
    energy: data?.energy ?? null,
    macro: data?.macro ?? null,
    geopolitics: data?.geopolitics ?? null,
    
    // Status
    isLive: liveCount === allStatuses.length && allStatuses.length > 0,
    isDegraded: liveCount > 0 && liveCount < allStatuses.length,
    isOffline: offlineCount === allStatuses.length || allStatuses.length === 0,
  };
}

// Individual snapshot hooks for targeted updates
export function useEnergySnapshot() {
  const [data, setData] = useState<EnergySnapshot | null>(null);
  const [latencyMs, setLatencyMs] = useState(0);
  
  useEffect(() => {
    let mounted = true;
    
    const fetch = async () => {
      const start = Date.now();
      const snapshot = await fetchEnergySnapshot();
      if (mounted) {
        setData(snapshot);
        setLatencyMs(Date.now() - start);
      }
    };
    
    fetch();
    const interval = setInterval(fetch, REFRESH_INTERVAL);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  
  return { data, latencyMs };
}

export function useMacroSnapshot() {
  const [data, setData] = useState<MacroSnapshot | null>(null);
  const [latencyMs, setLatencyMs] = useState(0);
  
  useEffect(() => {
    let mounted = true;
    
    const fetch = async () => {
      const start = Date.now();
      const snapshot = await fetchMacroSnapshot();
      if (mounted) {
        setData(snapshot);
        setLatencyMs(Date.now() - start);
      }
    };
    
    fetch();
    const interval = setInterval(fetch, REFRESH_INTERVAL);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  
  return { data, latencyMs };
}
