'use client';

import { useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * useDataInitializer
 * 
 * Runs once on app mount to check if the core data tables
 * (macro_data, crypto_data, energy_data) have any rows.
 * If empty, triggers the mock-data-worker to seed initial data.
 * 
 * This ensures users see live data on first visit instead of empty panels.
 */
export function useDataInitializer() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function checkAndInitialize() {
      if (!supabase) {
        console.warn('[DataInitializer] Supabase not configured — skipping initialization');
        return;
      }
      try {
        // Check if macro_data has any rows
        const { count: macroCount } = await supabase
          .from('macro_data')
          .select('id', { count: 'exact', head: true });

        const { count: cryptoCount } = await supabase
          .from('crypto_data')
          .select('id', { count: 'exact', head: true });

        const { count: energyCount } = await supabase
          .from('energy_data')
          .select('id', { count: 'exact', head: true });

        const isEmpty = (macroCount ?? 0) === 0 || (cryptoCount ?? 0) === 0 || (energyCount ?? 0) === 0;

        // Also check if prices table has zero values (seeded but not yet populated)
        let hasZeroPrices = false;
        const { data: priceData } = await supabase
          .from('prices')
          .select('price')
          .limit(5);
        
        if (priceData && priceData.length > 0) {
          hasZeroPrices = priceData.every((p: any) => Number(p.price) === 0);
        }

        if (isEmpty || hasZeroPrices) {
          console.log('[DataInitializer] Tables empty or have zero values — triggering mock-data-worker...');
          
          // Call the worker to seed/update data
          const res = await fetch('/api/mock-data-worker', { method: 'POST' });
          const result = await res.json();
          
          if (result.success) {
            console.log('[DataInitializer] Data updated:', result.worker_run);
          } else {
            console.error('[DataInitializer] Worker failed:', result.error);
          }
        } else {
          console.log('[DataInitializer] Tables have valid data — skipping initialization');
        }
      } catch (err) {
        console.error('[DataInitializer] Error checking tables:', err);
      }
    }

    checkAndInitialize();
  }, []);
}
