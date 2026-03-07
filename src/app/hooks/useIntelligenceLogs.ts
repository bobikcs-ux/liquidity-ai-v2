import { useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '../lib/supabase';

// ============================================================
// Mapped to the real Supabase table: public.intel_feed
// Columns: id, type, title, content, severity, created_at
// ============================================================

export interface IntelligenceLog {
  id: string;
  type: string;          // 'SIGNAL' | 'ALERT' | 'UPDATE'
  title: string;         // Signal name / headline
  content: string;       // Full analysis text
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: string;
  // Derived client-side (not stored)
  confidence?: number;
  source?: string;
}

// Seed data shown when the table returns zero rows or Supabase is unavailable
const SEED_LOGS: IntelligenceLog[] = [
  {
    id: 'seed-1',
    type: 'SIGNAL',
    title: 'WTI/BRENT DIVERGENCE DETECTED',
    content:
      'EIA reported a larger-than-expected drawdown of 3.2M barrels. Combined with elevated risk premiums in the Red Sea, our predictive model targets a resistance break at $82.40. Institutional buy-side pressure increasing.',
    severity: 'HIGH',
    created_at: new Date().toISOString(),
    confidence: 89,
    source: 'AURELIUS AI CORE',
  },
];

const fetcher = async (): Promise<IntelligenceLog[]> => {
  if (!supabase) return SEED_LOGS;

  try {
    const { data, error } = await supabase
      .from('intel_feed')
      .select('id, type, title, content, severity, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    if (!data || data.length === 0) return SEED_LOGS;

    // Derive confidence from severity for display richness
    return data.map((row) => ({
      ...row,
      confidence:
        row.severity === 'CRITICAL' ? 95
        : row.severity === 'HIGH' ? 85
        : row.severity === 'MEDIUM' ? 65
        : 45,
      source: row.type === 'SIGNAL' ? 'AURELIUS AI CORE' : 'INTEL FEED',
    }));
  } catch {
    return SEED_LOGS;
  }
};

export function useIntelligenceLogs(autoRefresh = true) {
  const { data, error, isLoading, mutate } = useSWR(
    'intel-feed',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60_000,        // 1 min dedup window
      focusThrottleInterval: 600_000,  // 10 min focus throttle
      errorRetryCount: 2,
      errorRetryInterval: 5_000,
    }
  );

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(() => mutate(), 5 * 60 * 1000); // 5-min refresh
    return () => clearInterval(iv);
  }, [autoRefresh, mutate]);

  return {
    logs: data ?? SEED_LOGS,
    isLoading,
    error,
    refresh: mutate,
  };
}

