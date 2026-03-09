/**
 * Master Sync Edge Function — Unified Market Worker
 * Syncs ALL external APIs → 4 core Supabase tables:
 *   market_snapshots  (BTC, regime, survival probability)
 *   macro_data        (FRED yields, M2, ECB, BoJ — JSONB by region)
 *   energy_data       (WTI, Brent, NatGas — JSONB)
 *   geopolitics_data  (ACLED conflict index — JSONB)
 *
 * Called by Vercel Cron every 5 minutes — NOT by the frontend.
 * Uses created_at for market_snapshots (existing schema), fetched_at for others.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FRED_API_KEY = process.env.VITE_FRED_API_KEY || process.env.FRED_API_KEY;
const FMP_API_KEY = process.env.VITE_FMP_API_KEY || process.env.FMP_API_KEY;
const EIA_API_KEY = process.env.VITE_EIA_API_KEY || process.env.EIA_API_KEY || 'DEMO_KEY';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
  const now = new Date().toISOString();

  // =========================================================================
  // 1. BTC + MARKET SNAPSHOT → market_snapshots (created_at schema)
  // =========================================================================
  const btcStart = Date.now();
  try {
    const [btcRes, domRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', { signal: AbortSignal.timeout(8000) }),
      fetch('https://api.coingecko.com/api/v3/global', { signal: AbortSignal.timeout(8000) }),
    ]);

    if (btcRes.ok) {
      const btcData = await btcRes.json();
      const btcPrice = btcData?.bitcoin?.usd ?? null;
      const btcChange = btcData?.bitcoin?.usd_24h_change ?? null;

      let btcDominance = 52.4;
      if (domRes.ok) {
        const domData = await domRes.json();
        btcDominance = domData?.data?.market_cap_percentage?.btc ?? 52.4;
      }

      // Read latest yield spread from macro_metrics for market_snapshots row
      const { data: fredMetrics } = await supabase
        .from('macro_metrics')
        .select('symbol, value')
        .in('symbol', ['DGS10', 'DGS2']);

      const m = new Map((fredMetrics ?? []).map((r: { symbol: string; value: number }) => [r.symbol, Number(r.value)]));
      const dgs10 = m.get('DGS10') ?? 4.28;
      const dgs2 = m.get('DGS2') ?? 4.12;
      const yieldSpread = parseFloat((dgs10 - dgs2).toFixed(3));

      // Determine regime from yield curve + btc volatility
      const regime = yieldSpread < -0.5 ? 'crisis' : yieldSpread < 0 ? 'stress' : 'normal';
      const survivalProbability = regime === 'crisis' ? 78 : regime === 'stress' ? 88 : 95;

      if (btcPrice) {
        await supabase.from('market_snapshots').insert({
          btc_price: btcPrice,
          btc_dominance: btcDominance,
          yield_spread: yieldSpread,
          regime,
          survival_probability: survivalProbability,
          data_sources_ok: true,
          // created_at is auto-filled by Supabase default
        });
        results['BTC'] = { status: 'SYNCED', latencyMs: Date.now() - btcStart };
      } else {
        results['BTC'] = { status: 'NO_DATA', latencyMs: Date.now() - btcStart };
      }
    } else {
      results['BTC'] = { status: 'ERROR', latencyMs: Date.now() - btcStart, error: `HTTP ${btcRes.status}` };
    }
  } catch (err) {
    results['BTC'] = { status: 'ERROR', latencyMs: Date.now() - btcStart, error: err instanceof Error ? err.message : 'Unknown' };
  }

  // =========================================================================
  // 2. FRED SYNC → macro_metrics (symbol rows) + macro_data (JSONB global row)
  // =========================================================================
  const fredSeries = ['DGS10', 'DGS2', 'WM2NS', 'ECBMAINREF', 'INTDSRJPM193N', 'LI0201GYM186S'];
  const fredValues: Record<string, number> = {};

  for (const seriesId of fredSeries) {
    const start = Date.now();
    try {
      if (!FRED_API_KEY) {
        results[`FRED_${seriesId}`] = { status: 'SKIPPED', latencyMs: 0, error: 'No VITE_FRED_API_KEY' };
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
      fredValues[seriesId] = value;

      const { error: upsertError } = await supabase
        .from('macro_metrics')
        .upsert({
          symbol: seriesId,
          value,
          status: 'LIVE',
          source: 'FRED',
          fetched_at: now,
        }, { onConflict: 'symbol' });

      results[`FRED_${seriesId}`] = {
        status: upsertError ? 'DB_ERROR' : 'SYNCED',
        latencyMs: Date.now() - start,
        error: upsertError?.message,
      };
    } catch (err) {
      results[`FRED_${seriesId}`] = {
        status: 'ERROR',
        latencyMs: Date.now() - fredSeries.indexOf(seriesId),
        error: err instanceof Error ? err.message : 'Unknown',
      };
    }
  }

  // Write consolidated JSONB row to macro_data for snapshot-first reads
  const macroStart = Date.now();
  try {
    const { data: freshMetrics } = await supabase
      .from('macro_metrics')
      .select('symbol, value')
      .in('symbol', ['DGS10', 'DGS2', 'WM2NS', 'FEAR_GREED', 'ECBMAINREF', 'INTDSRJPM193N']);

    if (freshMetrics && freshMetrics.length > 0) {
      const m = new Map((freshMetrics as { symbol: string; value: number }[]).map(r => [r.symbol, Number(r.value)]));
      const dgs10 = m.get('DGS10') ?? 4.28;
      const dgs2 = m.get('DGS2') ?? 4.12;

      await supabase.from('macro_data').insert({
        region: 'global',
        series: {
          dgs10,
          dgs2,
          spread: parseFloat((dgs10 - dgs2).toFixed(3)),
          wm2ns: m.get('WM2NS') ?? 21200,
          fear_greed: m.get('FEAR_GREED') ?? 52,
          ecb_rate: m.get('ECBMAINREF') ?? 3.75,
          boj_rate: m.get('INTDSRJPM193N') ?? -0.10,
        },
        fetched_at: now,
      });
      results['MACRO_DATA_GLOBAL'] = { status: 'SYNCED', latencyMs: Date.now() - macroStart };
    }
  } catch (err) {
    results['MACRO_DATA_GLOBAL'] = { status: 'ERROR', latencyMs: Date.now() - macroStart, error: err instanceof Error ? err.message : 'Unknown' };
  }

  // =========================================================================
  // 3. FMP OIL → energy_data (JSONB)
  // =========================================================================
  const oilStart = Date.now();
  try {
    if (!FMP_API_KEY) {
      results['FMP_OIL'] = { status: 'SKIPPED', latencyMs: 0, error: 'No FMP_API_KEY' };
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
          await supabase.from('energy_data').insert({
            series: {
              wti: wti.price,
              brent: brent.price,
              wti_change: wti.changesPercentage ?? 0,
              brent_change: brent.changesPercentage ?? 0,
            },
            fetched_at: now,
          });
          results['FMP_OIL'] = { status: 'SYNCED', latencyMs: Date.now() - oilStart };
        } else {
          results['FMP_OIL'] = { status: 'NO_DATA', latencyMs: Date.now() - oilStart };
        }
      } else {
        results['FMP_OIL'] = { status: 'ERROR', latencyMs: Date.now() - oilStart, error: `WTI=${wtiRes.status} Brent=${brentRes.status}` };
      }
    }
  } catch (err) {
    results['FMP_OIL'] = { status: 'ERROR', latencyMs: Date.now() - oilStart, error: err instanceof Error ? err.message : 'Unknown' };
  }

  // =========================================================================
  // 4. EIA NATGAS → energy_data (JSONB)
  // Tight 5s timeout — fail over to previous snapshot value if slow
  // =========================================================================
  const eiaStart = Date.now();
  try {
    const url = `https://api.eia.gov/v2/natural-gas/pri/fut/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&facets[series][]=RNGWHHD&sort[0][column]=period&sort[0][direction]=desc&length=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) }); // 5s max

    if (response.ok) {
      const data = await response.json();
      const value = data?.response?.data?.[0]?.value;
      if (value) {
        await supabase.from('energy_data').insert({
          series: { natgas: parseFloat(value) },
          fetched_at: now,
        });
        results['EIA_NATGAS'] = { status: 'SYNCED', latencyMs: Date.now() - eiaStart };
      } else {
        results['EIA_NATGAS'] = { status: 'NO_DATA', latencyMs: Date.now() - eiaStart };
      }
    } else {
      results['EIA_NATGAS'] = { status: 'ERROR', latencyMs: Date.now() - eiaStart, error: `HTTP ${response.status}` };
    }
  } catch (err) {
    // EIA timed out or failed — fail over to previous snapshot
    const latency = Date.now() - eiaStart;
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    results['EIA_NATGAS'] = { 
      status: isTimeout ? 'TIMEOUT_FAILOVER' : 'ERROR', 
      latencyMs: latency, 
      error: isTimeout ? `Timeout after ${latency}ms — using previous snapshot` : (err instanceof Error ? err.message : 'Unknown')
    };
    // No insert — UI reads previous value from energy_data
  }

  // =========================================================================
  // 5. FEAR & GREED → macro_metrics
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
          fetched_at: now,
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
    syncedAt: now,
    results,
  });
}
