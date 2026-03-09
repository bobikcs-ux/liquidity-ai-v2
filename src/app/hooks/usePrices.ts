import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ProductPrice {
  product_code: string;
  price: number;
  currency: string;
  source: string;
  updated_at: string;
}

interface UsePricesReturn {
  prices: ProductPrice[];
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
  refresh: () => Promise<void>;
}

const DEFAULT_CODES = ['T63', 'T76', 'T81', 'T94', 'T95'];
const POLL_INTERVAL_MS = 30_000; // refresh every 30 seconds

export function usePrices(codes: string[] = DEFAULT_CODES): UsePricesReturn {
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      const { data, error: sbError } = await supabase
        .from('prices')
        .select('product_code, price, currency, source, updated_at')
        .in('product_code', codes)
        .order('product_code', { ascending: true });

      if (sbError) throw sbError;

      setPrices(data ?? []);
      setLastFetch(new Date());
    } catch (err: any) {
      console.error('[usePrices] fetch error:', err.message);
      setError(err.message ?? 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, [codes.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch + polling
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Supabase realtime subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('prices-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'prices' },
        (payload) => {
          const updated = payload.new as ProductPrice;
          if (codes.includes(updated.product_code)) {
            setPrices((prev) =>
              prev.map((p) => (p.product_code === updated.product_code ? updated : p))
            );
            setLastFetch(new Date());
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [codes.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  return { prices, loading, error, lastFetch, refresh: fetchPrices };
}
