import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface CryptoMetric {
  asset: string;
  price: number;
  volume_24h: number;
  dominance: number;
  change_24h: number;
  timestamp: string;
}

export interface MacroMetric {
  symbol: string;
  value: number;
  status: string;
  source: string;
  fetched_at: string;
}

export interface MarketSnapshot {
  id: string;
  region?: string;
  vix?: number;
  dgs2?: number;
  dgs10?: number;
  btc_price?: number;
  btc_volatility?: number;
  btc_dominance?: number;
  fear_greed?: number;
  systemic_risk?: number;
  regime?: string;
  fetched_at: string;
}

export interface EnergyMetric {
  commodity: string;
  price: number;
  change_24h: number;
  timestamp: string;
}

export interface TradeMetric {
  pair: string;
  rate: number;
  timestamp: string;
}

// ============================================================================
// CRYPTO MARKET HOOKS
// ============================================================================

export function useCryptoPrice(asset: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('crypto_markets')
          .select('price')
          .eq('asset', asset)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (err) throw err;
        setPrice(data?.price || null);
        setError(null);
      } catch (err: any) {
        console.warn(`[useCryptoPrice] Failed to fetch ${asset}:`, err.message);
        setError(err.message);
        setPrice(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [asset]);

  return { price, loading, error };
}

export function useCryptoDominance(asset: string) {
  const [dominance, setDominance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDominance = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('crypto_markets')
          .select('dominance')
          .eq('asset', asset)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (err) throw err;
        setDominance(data?.dominance || null);
        setError(null);
      } catch (err: any) {
        console.warn(`[useCryptoDominance] Failed to fetch ${asset}:`, err.message);
        setError(err.message);
        setDominance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDominance();
    const interval = setInterval(fetchDominance, 60_000);
    return () => clearInterval(interval);
  }, [asset]);

  return { dominance, loading, error };
}

// ============================================================================
// MACRO METRIC HOOKS
// ============================================================================

export function useMacroMetric(symbol: string) {
  const [value, setValue] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetric = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('macro_metrics')
          .select('value, status')
          .eq('symbol', symbol)
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single();

        if (err) throw err;
        setValue(data?.value || null);
        setStatus(data?.status || null);
        setError(null);
      } catch (err: any) {
        console.warn(`[useMacroMetric] Failed to fetch ${symbol}:`, err.message);
        setError(err.message);
        setValue(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetric();
    const interval = setInterval(fetchMetric, 60_000);
    return () => clearInterval(interval);
  }, [symbol]);

  return { value, status, loading, error };
}

export function useMacroMetrics(symbols: string[]) {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('macro_metrics')
          .select('symbol, value')
          .in('symbol', symbols)
          .order('fetched_at', { ascending: false });

        if (err) throw err;

        const result: Record<string, number> = {};
        data?.forEach((m: any) => {
          result[m.symbol] = m.value;
        });
        setMetrics(result);
        setError(null);
      } catch (err: any) {
        console.warn('[useMacroMetrics] Failed to fetch metrics:', err.message);
        setError(err.message);
        setMetrics({});
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error };
}

// ============================================================================
// MARKET SNAPSHOT HOOKS
// ============================================================================

export function useLatestSnapshot() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('market_snapshots')
          .select('*')
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single();

        if (err && err.code !== 'PGRST116') throw err; // PGRST116 = no rows
        setSnapshot(data || null);
        setError(null);
      } catch (err: any) {
        console.warn('[useLatestSnapshot] Failed to fetch snapshot:', err.message);
        setError(err.message);
        setSnapshot(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 30_000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { snapshot, loading, error };
}

// ============================================================================
// ENERGY METRIC HOOKS
// ============================================================================

export function useEnergyPrice(commodity: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('energy_metrics')
          .select('price')
          .eq('commodity', commodity)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (err) throw err;
        setPrice(data?.price || null);
        setError(null);
      } catch (err: any) {
        console.warn(`[useEnergyPrice] Failed to fetch ${commodity}:`, err.message);
        setError(err.message);
        setPrice(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000);
    return () => clearInterval(interval);
  }, [commodity]);

  return { price, loading, error };
}

// ============================================================================
// TRADE METRIC HOOKS
// ============================================================================

export function useTradeRate(pair: string) {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('trade_metrics')
          .select('rate')
          .eq('pair', pair)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();

        if (err) throw err;
        setRate(data?.rate || null);
        setError(null);
      } catch (err: any) {
        console.warn(`[useTradeRate] Failed to fetch ${pair}:`, err.message);
        setError(err.message);
        setRate(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 60_000);
    return () => clearInterval(interval);
  }, [pair]);

  return { rate, loading, error };
}
