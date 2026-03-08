/**
 * Background Sync Edge Function
 * Syncs ALL external APIs → Supabase snapshots
 * Called by Vercel Cron every 5 minutes — NOT by the frontend
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FRED_API_KEY = process.env.VITE_FRED_API_KEY || process.env.FRED_API_KEY;
const FMP_API_KEY = process.env.VITE_FMP_API_KEY || process.env.FMP_API_KEY;
const EIA_API_KEY = process.env.VITE_EIA_API_KEY || process.env.EIA_API_KEY || 'DEMO_KEY';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const results: Record<string, { status: string; latencyMs: number; error?: string }> = {};

  // =========================================================================
  // 1. FRED SYNC → macro_metrics
  // =========================================================================
  const fredSeries = ['DGS10', 'DGS2', 'WM2NS', 'ECBMAINREF', 'INTDSRJPM193N', 'LI0201GYM186S'];
  
  for (const seriesId of fredSeries) {
    const start = Date.now();
    try {
      if (!FRED_API_KEY) {
        results[`FRED_${seriesId}`] = { status: 'SKIPPED', latencyMs: 0, error: 'No API key' };
        continue;
      }

      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      
      if (!response.ok) {
        results[`FRED_${seriesId}`] = { status: 'ERROR', latencyMs: Date.now() - start, error: `HTTP ${response.status}` };
        continue;
      }

      const data = await response.json();
      const rawValue = data?.observations?.[0]?.value;
      
      if (!rawValue || rawValue === '.' || rawValue === 'N/A') {
        results[`FRED_${seriesId}`] = { status: 'NO_DATA', latencyMs: Date.now() - start };
        continue;
      }

      const value = parseFloat(rawValue);
      
      const { error: upsertError } = await supabase
        .from('macro_metrics')
        .upsert({
          symbol: seriesId,
          value,
          status: 'LIVE',
          source: 'FRED',
          fetched_at: new Date().toISOString(),
        }, { onConflict: 'symbol' });

      results[`FRED_${seriesId}`] = {
        status: upsertError ? 'DB_ERROR' : 'SYNCED',
        latencyMs: Date.now() - start,
        error: upsertError?.message,
      };
    } catch (err) {
      results[`FRED_${seriesId}`] = {
        status: 'ERROR',
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  // =========================================================================
  // 2. FMP OIL SYNC → energy_snapshot
  // =========================================================================
  const oilStart = Date.now();
  try {
    if (!FMP_API_KEY) {
      results['FMP_OIL'] = { status: 'SKIPPED', latencyMs: 0, error: 'No API key' };
    } else {
      const [wtiRes, brentRes] = await Promise.all([
        fetch(`https://financialmodelingprep.com/api/v3/quote/CL=F?apikey=${FMP_API_KEY}`, { signal: AbortSignal.timeout(10000) }),
        fetch(`https://financialmodelingprep.com/api/v3/quote/BZ=F?apikey=${FMP_API_KEY}`, { signal: AbortSignal.timeout(10000) }),
      ]);

      if (wtiRes.ok && brentRes.ok) {
        const [wtiData, brentData] = await Promise.all([wtiRes.json(), brentRes.json()]);
        
        const wti = wtiData[0];
        const brent = brentData[0];

        if (wti?.price && brent?.price) {
          await supabase.from('energy_snapshot').upsert([
            { symbol: 'WTI', value: wti.price, source: 'FMP', fetched_at: new Date().toISOString() },
            { symbol: 'BRENT', value: brent.price, source: 'FMP', fetched_at: new Date().toISOString() },
          ], { onConflict: 'symbol' });
          
          results['FMP_OIL'] = { status: 'SYNCED', latencyMs: Date.now() - oilStart };
        } else {
          results['FMP_OIL'] = { status: 'NO_DATA', latencyMs: Date.now() - oilStart };
        }
      } else {
        results['FMP_OIL'] = { status: 'ERROR', latencyMs: Date.now() - oilStart, error: `WTI=${wtiRes.status}, Brent=${brentRes.status}` };
      }
    }
  } catch (err) {
    results['FMP_OIL'] = { status: 'ERROR', latencyMs: Date.now() - oilStart, error: err instanceof Error ? err.message : 'Unknown' };
  }

  // =========================================================================
  // 3. EIA NATGAS SYNC → energy_snapshot
  // =========================================================================
  const eiaStart = Date.now();
  try {
    const url = `https://api.eia.gov/v2/natural-gas/pri/fut/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=RNGWHHD&sort[0][column]=period&sort[0][direction]=desc&length=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (response.ok) {
      const data = await response.json();
      const value = data?.response?.data?.[0]?.value;
      
      if (value) {
        await supabase.from('energy_snapshot').upsert({
          symbol: 'NATGAS',
          value: parseFloat(value),
          source: 'EIA',
          fetched_at: new Date().toISOString(),
        }, { onConflict: 'symbol' });
        
        results['EIA_NATGAS'] = { status: 'SYNCED', latencyMs: Date.now() - eiaStart };
      } else {
        results['EIA_NATGAS'] = { status: 'NO_DATA', latencyMs: Date.now() - eiaStart };
      }
    } else {
      results['EIA_NATGAS'] = { status: 'ERROR', latencyMs: Date.now() - eiaStart, error: `HTTP ${response.status}` };
    }
  } catch (err) {
    results['EIA_NATGAS'] = { status: 'ERROR', latencyMs: Date.now() - eiaStart, error: err instanceof Error ? err.message : 'Unknown' };
  }

  // =========================================================================
  // 4. FEAR & GREED SYNC → macro_metrics
  // =========================================================================
  const fngStart = Date.now();
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1', { signal: AbortSignal.timeout(5000) });
    
    if (response.ok) {
      const data = await response.json();
      const value = data?.data?.[0]?.value;
      
      if (value) {
        await supabase.from('macro_metrics').upsert({
          symbol: 'FEAR_GREED',
          value: parseInt(value, 10),
          status: 'LIVE',
          source: 'ALTERNATIVE_ME',
          fetched_at: new Date().toISOString(),
        }, { onConflict: 'symbol' });
        
        results['FEAR_GREED'] = { status: 'SYNCED', latencyMs: Date.now() - fngStart };
      } else {
        results['FEAR_GREED'] = { status: 'NO_DATA', latencyMs: Date.now() - fngStart };
      }
    } else {
      results['FEAR_GREED'] = { status: 'ERROR', latencyMs: Date.now() - fngStart, error: `HTTP ${response.status}` };
    }
  } catch (err) {
    results['FEAR_GREED'] = { status: 'ERROR', latencyMs: Date.now() - fngStart, error: err instanceof Error ? err.message : 'Unknown' };
  }

  return res.status(200).json({
    success: true,
    syncedAt: new Date().toISOString(),
    results,
  });
}
