'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

        if (isEmpty) {
          console.log('[DataInitializer] Tables empty — triggering mock-data-worker...');
          
          // Call the worker to seed initial data
          const res = await fetch('/api/mock-data-worker', { method: 'POST' });
          const result = await res.json();
          
          if (result.success) {
            console.log('[DataInitializer] Initial data seeded:', result.worker_run);
          } else {
            console.error('[DataInitializer] Worker failed:', result.error);
          }
        } else {
          console.log('[DataInitializer] Tables have data — skipping initialization');
        }
      } catch (err) {
        console.error('[DataInitializer] Error checking tables:', err);
      }
    }

    checkAndInitialize();
  }, []);
}
