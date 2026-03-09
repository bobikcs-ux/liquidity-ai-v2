'use client';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface WorkerLog {
  id: number;
  created_at: string;
  worker_run: string | null;
  table_name: string | null;
  metric_key: string | null;
  old_value:  number | null;
  new_value:  number | null;
  status:     string | null;
  details:    Record<string, any> | null;
}

export interface MacroSeries   { DGS10?: number; DGS2?: number; WALCL?: number; SPREAD?: number; RATE_SHOCK?: number; ECB_RATE?: number; HICP?: number; M3_GROWTH?: number; [k: string]: number | undefined; }
export interface CryptoSeries  { BTC_PRICE?: number; BTC_CHANGE_24H?: number; BTC_DOMINANCE?: number; BTC_VOL?: number; ETH_PRICE?: number; FEAR_GREED?: number; VAR_95?: number; }
export interface EnergySeries  { WTI_CRUDE?: number; BRENT_CRUDE?: number; NATURAL_GAS?: number; URANIUM?: number; GOLD_XAU?: number; SILVER_XAG?: number; COPPER?: number; }

export interface WorkerData {
  macroUS:    MacroSeries;
  macroEU:    MacroSeries;
  crypto:     CryptoSeries;
  energy:     EnergySeries;
  logs:       WorkerLog[];
  loading:    boolean;
  running:    boolean;
  lastRun:    string | null;
  triggerRun: () => Promise<void>;
  refresh:    () => Promise<void>;
}

export function useWorkerData(): WorkerData {
  const [macroUS,  setMacroUS]  = useState<MacroSeries>({});
  const [macroEU,  setMacroEU]  = useState<MacroSeries>({});
  const [crypto,   setCrypto]   = useState<CryptoSeries>({});
  const [energy,   setEnergy]   = useState<EnergySeries>({});
  const [logs,     setLogs]     = useState<WorkerLog[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [running,  setRunning]  = useState(false);
  const [lastRun,  setLastRun]  = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [
      { data: macroData },
      { data: cryptoData },
      { data: energyData },
      { data: logData },
    ] = await Promise.all([
      supabase.from('macro_data').select('region, series').order('fetched_at', { ascending: false }).limit(10),
      supabase.from('crypto_data').select('series').order('fetched_at', { ascending: false }).limit(1).single(),
      supabase.from('energy_data').select('series').order('fetched_at', { ascending: false }).limit(1).single(),
      supabase.from('macro_worker_logs').select('*').order('created_at', { ascending: false }).limit(40),
    ]);

    if (macroData) {
      const us = macroData.find((r: any) => r.region === 'US');
      const eu = macroData.find((r: any) => r.region === 'EU');
      if (us) setMacroUS(us.series);
      if (eu) setMacroEU(eu.series);
    }
    if (cryptoData?.series) setCrypto(cryptoData.series);
    if (energyData?.series) setEnergy(energyData.series);
    if (logData) setLogs(logData as WorkerLog[]);

    setLoading(false);
  }, []);

  const triggerRun = useCallback(async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/mock-data-worker', { method: 'POST' });
      const json = await res.json();
      if (json.success) setLastRun(json.worker_run);
      await refresh();
    } finally {
      setRunning(false);
    }
  }, [refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime: stream new log entries as they insert
  useEffect(() => {
    const channel = supabase
      .channel('worker-logs-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'macro_worker_logs' },
        (payload) => setLogs((prev) => [payload.new as WorkerLog, ...prev].slice(0, 40))
      )
      .subscribe();

    // Also auto-refresh data tables on new inserts
    const dataChannel = supabase
      .channel('worker-data-stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'macro_data' },  () => refresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crypto_data' }, () => refresh())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'energy_data' }, () => refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(dataChannel);
    };
  }, [refresh]);

  return { macroUS, macroEU, crypto, energy, logs, loading, running, lastRun, triggerRun, refresh };
}
