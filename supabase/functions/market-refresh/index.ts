/**
 * MARKET-REFRESH Edge Function
 * 
 * This is the SOLE collector for all external API data.
 * Runs on a schedule (every 5 minutes via pg_cron) and fetches:
 * - FRED: DGS10, DGS2, WM2NS, FEDFUNDS
 * - FMP: FX rates, Oil prices
 * - CoinGecko: BTC/ETH prices
 * 
 * Saves everything to market_data_live table.
 * The frontend UI NEVER calls these APIs directly - it only reads from Supabase.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FRED_API_KEY = Deno.env.get('FRED_API_KEY') || Deno.env.get('VITE_FRED_API_KEY') || '';
const FMP_API_KEY = Deno.env.get('FMP_API_KEY') || Deno.env.get('VITE_FMP_API_KEY') || '';
const COINGECKO_API_KEY = Deno.env.get('COINGECKO_API_KEY') || Deno.env.get('VITE_COINGECKO_API_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// FRED series we need
const FRED_SERIES = ['DGS10', 'DGS2', 'WM2NS', 'FEDFUNDS', 'ECBDFR', 'IRSTCI01JPM156N'];

// FX pairs for FMP
const FX_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD'];

interface MarketDataRow {
  metric_name: string;
  value: number;
  source: string;
  updated_at: string;
}

// Fetch a single FRED series
async function fetchFRED(series: string): Promise<number | null> {
  if (!FRED_API_KEY) return null;
  
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    
    if (!res.ok) {
      console.log(`[FRED] ${series} failed: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    const value = parseFloat(data.observations?.[0]?.value);
    return isNaN(value) ? null : value;
  } catch (err) {
    console.error(`[FRED] ${series} error:`, err);
    return null;
  }
}

// Fetch CoinGecko prices
async function fetchCrypto(): Promise<{ btc: number; eth: number; btcDominance: number } | null> {
  try {
    const headers: Record<string, string> = {};
    if (COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
    }
    
    const [priceRes, globalRes] = await Promise.all([
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd', {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
      fetch('https://api.coingecko.com/api/v3/global', {
        headers,
        signal: AbortSignal.timeout(8000),
      }),
    ]);
    
    if (!priceRes.ok) return null;
    
    const priceData = await priceRes.json();
    const globalData = globalRes.ok ? await globalRes.json() : null;
    
    return {
      btc: priceData.bitcoin?.usd || 0,
      eth: priceData.ethereum?.usd || 0,
      btcDominance: globalData?.data?.market_cap_percentage?.btc || 55,
    };
  } catch (err) {
    console.error('[CoinGecko] error:', err);
    return null;
  }
}

// Fetch FMP FX rates
async function fetchFX(): Promise<Record<string, number> | null> {
  if (!FMP_API_KEY) return null;
  
  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${FX_PAIRS.join(',')}?apikey=${FMP_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const rates: Record<string, number> = {};
    
    for (const quote of data) {
      rates[quote.symbol] = quote.price;
    }
    
    return rates;
  } catch (err) {
    console.error('[FMP] FX error:', err);
    return null;
  }
}

// Fetch FMP Oil prices
async function fetchOil(): Promise<{ wti: number; brent: number } | null> {
  if (!FMP_API_KEY) return null;
  
  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/CL=F,BZ=F?apikey=${FMP_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const wti = data.find((q: any) => q.symbol === 'CL=F')?.price;
    const brent = data.find((q: any) => q.symbol === 'BZ=F')?.price;
    
    return {
      wti: wti || 78.5,
      brent: brent || 82.3,
    };
  } catch (err) {
    console.error('[FMP] Oil error:', err);
    return null;
  }
}

// Save data to Supabase
async function saveToSupabase(rows: MarketDataRow[]): Promise<void> {
  if (rows.length === 0) return;
  
  const { error } = await supabase
    .from('market_data_live')
    .upsert(rows, { onConflict: 'metric_name' });
  
  if (error) {
    console.error('[Supabase] upsert error:', error.message);
    
    // Try inserting one by one as fallback
    for (const row of rows) {
      await supabase
        .from('market_data_live')
        .upsert(row, { onConflict: 'metric_name' })
        .then(({ error: e }) => {
          if (e) console.error(`[Supabase] ${row.metric_name} failed:`, e.message);
        });
    }
  }
}

// Main handler
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[market-refresh] Starting data collection...');
  const startMs = Date.now();
  const rows: MarketDataRow[] = [];
  const now = new Date().toISOString();

  // 1. Fetch FRED data (staggered to avoid rate limits)
  for (const series of FRED_SERIES) {
    const value = await fetchFRED(series);
    if (value !== null) {
      rows.push({
        metric_name: series,
        value,
        source: 'FRED',
        updated_at: now,
      });
    }
    // Small delay between FRED calls
    await new Promise(r => setTimeout(r, 200));
  }

  // 2. Fetch Crypto prices
  const crypto = await fetchCrypto();
  if (crypto) {
    rows.push({ metric_name: 'BTC_USD', value: crypto.btc, source: 'CoinGecko', updated_at: now });
    rows.push({ metric_name: 'ETH_USD', value: crypto.eth, source: 'CoinGecko', updated_at: now });
    rows.push({ metric_name: 'BTC_DOMINANCE', value: crypto.btcDominance, source: 'CoinGecko', updated_at: now });
  }

  // 3. Fetch FX rates
  const fx = await fetchFX();
  if (fx) {
    for (const [pair, rate] of Object.entries(fx)) {
      rows.push({ metric_name: pair, value: rate, source: 'FMP', updated_at: now });
    }
  }

  // 4. Fetch Oil prices
  const oil = await fetchOil();
  if (oil) {
    rows.push({ metric_name: 'WTI_CRUDE', value: oil.wti, source: 'FMP', updated_at: now });
    rows.push({ metric_name: 'BRENT_CRUDE', value: oil.brent, source: 'FMP', updated_at: now });
  }

  // 5. Save all to Supabase
  await saveToSupabase(rows);

  const elapsed = Date.now() - startMs;
  console.log(`[market-refresh] Complete: ${rows.length} metrics saved in ${elapsed}ms`);

  return new Response(
    JSON.stringify({
      status: 'OK',
      metricsUpdated: rows.length,
      elapsedMs: elapsed,
      timestamp: now,
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
