'use client';

import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import { supabase } from '../lib/supabase';

export interface IntelligenceLog {
  id: string;
  timestamp: string;
  signal: string;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source: string;
  details: string;
  region?: string;
}

const fetcher = async (): Promise<IntelligenceLog[]> => {
  if (!supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('intelligence_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[v0] intelligence_logs fetch failed:', err);
    return [];
  }
};

/**
 * Hook to fetch intelligence logs with SWR caching
 * - Automatically refreshes every 10 minutes unless manually triggered
 * - Caches data to prevent excessive API calls
 */
export function useIntelligenceLogs(autoRefresh = true) {
  const { data, error, isLoading, mutate } = useSWR(
    'intelligence-logs',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 min dedup
      focusThrottleInterval: 600000, // 10 min between refreshes
      errorRetryCount: 2,
      errorRetryInterval: 5000,
    }
  );

  useEffect(() => {
    if (!autoRefresh) return;
    
    // Manual refresh every 10 minutes
    const interval = setInterval(() => {
      mutate();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, mutate]);

  return {
    logs: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}
