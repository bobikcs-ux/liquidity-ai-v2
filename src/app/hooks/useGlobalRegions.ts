'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchGlobalRegionData, 
  type GlobalRegionData,
  type RegionSnapshot 
} from '../services/globalRegionService';

const REFRESH_INTERVAL = 60_000; // 60 seconds

export interface UseGlobalRegionsReturn {
  data: GlobalRegionData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastSync: Date | null;
  
  // Quick status checks
  regionStatuses: {
    eu: RegionSnapshot['status'] | 'OFFLINE';
    asia: RegionSnapshot['status'] | 'OFFLINE';
    india: RegionSnapshot['status'] | 'OFFLINE';
    brics: RegionSnapshot['status'] | 'OFFLINE';
    uk: RegionSnapshot['status'] | 'OFFLINE';
  };
}

export function useGlobalRegions(): UseGlobalRegionsReturn {
  const [data, setData] = useState<GlobalRegionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchGlobalRegionData();
      setData(result);
      setLastSync(result.lastSync);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch global region data';
      setError(msg);
      console.error('[useGlobalRegions]', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();

    // Set up interval refresh
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  // Extract region statuses for quick access
  const regionStatuses = {
    eu: data?.eu?.status ?? 'OFFLINE',
    asia: data?.asia?.status ?? 'OFFLINE',
    india: data?.india?.status ?? 'OFFLINE',
    brics: data?.brics?.status ?? 'OFFLINE',
    uk: data?.uk?.status ?? 'OFFLINE',
  };

  return {
    data,
    isLoading,
    error,
    refresh,
    lastSync,
    regionStatuses,
  };
}

export default useGlobalRegions;
