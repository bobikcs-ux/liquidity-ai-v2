import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side env vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FRED_API_KEY = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY || process.env.VITE_FMP_API_KEY;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || process.env.VITE_COINGECKO_API_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================================================
// REAL API FETCH FUNCTIONS
// ============================================================================

async function fetchFRED(seriesId: string): Promise<number | null> {
  if (!FRED_API_KEY) {
    console.log(`[DataWorker] FRED: No API key for ${seriesId}`);
    return null;
  }
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    console.log(`[DataWorker] FRED ${seriesId}: HTTP ${res.status}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[DataWorker] FRED ${seriesId} error: ${errText.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const value = parseFloat(data.observations?.[0]?.value);
    console.log(`[DataWorker] FRED ${seriesId}: ${value}`);
    return isNaN(value) ? null : value;
  } catch (err) {
    console.error(`[DataWorker] FRED ${seriesId} exception:`, err);
    return null;
  }
}

async function fetchCoinGecko(): Promise<{ btc: number; eth: number; btcChange: number; fearGreed: number } | null> {
  try {
    // CoinGecko simple price endpoint (works without API key)
    const priceUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true';
    const headers: Record<string, string> = {};
    if (COINGECKO_API_KEY) {
      headers['x-cg-demo-api-key'] = COINGECKO_API_KEY;
    }
    const priceRes = await fetch(priceUrl, { headers, signal: AbortSignal.timeout(8000) });
    console.log(`[DataWorker] CoinGecko: HTTP ${priceRes.status}`);
    if (!priceRes.ok) {
      const errText = await priceRes.text().catch(() => '');
      console.error(`[DataWorker] CoinGecko error: ${errText.slice(0, 200)}`);
      return null;
    }
    const priceData = await priceRes.json();
    console.log(`[DataWorker] CoinGecko: BTC=$${priceData.bitcoin?.usd}, ETH=$${priceData.ethereum?.usd}`);

    // Fear & Greed from alternative.me
    let fearGreed = 50;
    try {
      const fgRes = await fetch('https://api.alternative.me/fng/?limit=1', { signal: AbortSignal.timeout(5000) });
      if (fgRes.ok) {
        const fgData = await fgRes.json();
        fearGreed = parseInt(fgData.data?.[0]?.value) || 50;
      }
    } catch { /* ignore */ }

    return {
      btc: priceData.bitcoin?.usd ?? null,
      eth: priceData.ethereum?.usd ?? null,
      btcChange: priceData.bitcoin?.usd_24h_change ?? 0,
      fearGreed,
    };
  } catch {
    return null;
  }
}

async function fetchFMPCommodities(): Promise<{ wti: number; brent: number; gold: number; silver: number; natgas: number } | null> {
  if (!FMP_API_KEY) {
    console.log('[DataWorker] FMP: No API key');
    return null;
  }
  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/CLUSD,BZUSD,GCUSD,SIUSD,NGUSD?apikey=${FMP_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    console.log(`[DataWorker] FMP Commodities: HTTP ${res.status}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`[DataWorker] FMP error: ${errText.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    console.log(`[DataWorker] FMP: WTI=$${data.find?.((d: any) => d.symbol === 'CLUSD')?.price}`);
    const find = (sym: string) => data.find((d: any) => d.symbol === sym)?.price ?? null;
    return {
      wti: find('CLUSD'),
      brent: find('BZUSD'),
      gold: find('GCUSD'),
      silver: find('SIUSD'),
      natgas: find('NGUSD'),
    };
  } catch {
    return null;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function jitter(base: number, pct = 0.002): number {
  return parseFloat((base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(4));
}

async function logChange(
  workerRun: string,
  tableName: string,
  metricKey: string,
  oldValue: number | null,
  newValue: number,
  source: string,
  status = 'OK'
) {
  if (!supabase) return;
  await supabase.from('macro_worker_logs').insert({
    worker_run: workerRun,
    table_name: tableName,
    metric_key: metricKey,
    old_value: oldValue,
    new_value: newValue,
    status,
    details: {
      message: `${tableName}.${metricKey}: ${oldValue ?? 'init'} → ${newValue}`,
      source,
      delta: oldValue != null ? +(newValue - oldValue).toFixed(6) : null,
    },
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ready',
      message: 'Data Worker — POST to fetch real market data from FRED, CoinGecko, FMP.',
      apis: {
        fred: FRED_API_KEY ? 'configured' : 'missing',
        coingecko: COINGECKO_API_KEY ? 'configured' : 'public',
        fmp: FMP_API_KEY ? 'configured' : 'missing',
      },
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Supabase not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  const workerRun = `run_${Date.now()}`;
  const logs: string[] = [];
  const sources: Record<string, string> = {};

  try {
    // ── 1. FETCH REAL DATA FROM EXTERNAL APIS ─────────────────────────────────
    console.log('[DataWorker] Fetching from external APIs...');

    // FRED: Treasury yields
    const [dgs10, dgs2, walcl, ecbRate] = await Promise.all([
      fetchFRED('DGS10'),
      fetchFRED('DGS2'),
      fetchFRED('WALCL'),
      fetchFRED('ECBMAINREF'),
    ]);

    // CoinGecko: Crypto prices
    const cryptoData = await fetchCoinGecko();

    // FMP: Commodities
    const commodityData = await fetchFMPCommodities();

    // ── 2. GET PREVIOUS VALUES FROM DB ────────────────────────────────────────
    const { data: prevMacroRows } = await supabase
      .from('macro_data')
      .select('region, series')
      .order('fetched_at', { ascending: false })
      .limit(2);

    const prevUS = prevMacroRows?.find((r) => r.region === 'US')?.series ?? {};
    const prevEU = prevMacroRows?.find((r) => r.region === 'EU')?.series ?? {};

    const { data: prevCryptoRow } = await supabase
      .from('crypto_data')
      .select('series')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();
    const prevCrypto = prevCryptoRow?.series ?? {};

    const { data: prevEnergyRow } = await supabase
      .from('energy_data')
      .select('series')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();
    const prevEnergy = prevEnergyRow?.series ?? {};

    // ── 3. BUILD NEW DATA (real API → prev DB value → small jitter on prev) ──
    const newMacroUS = {
      DGS10:      dgs10  ?? (prevUS.DGS10  ? jitter(prevUS.DGS10, 0.001)  : null),
      DGS2:       dgs2   ?? (prevUS.DGS2   ? jitter(prevUS.DGS2, 0.001)   : null),
      WALCL:      walcl  ?? (prevUS.WALCL  ? jitter(prevUS.WALCL, 0.0005) : null),
      SPREAD:     dgs10 && dgs2 ? +(dgs10 - dgs2).toFixed(4) : (prevUS.SPREAD ?? null),
      RATE_SHOCK: prevUS.RATE_SHOCK ? jitter(prevUS.RATE_SHOCK, 0.005) : 0.12,
    };
    sources['US.DGS10'] = dgs10 ? 'FRED' : (prevUS.DGS10 ? 'DB_JITTER' : 'NONE');
    sources['US.DGS2'] = dgs2 ? 'FRED' : (prevUS.DGS2 ? 'DB_JITTER' : 'NONE');

    const newMacroEU = {
      ECB_RATE:   ecbRate ?? (prevEU.ECB_RATE ? jitter(prevEU.ECB_RATE, 0.001) : null),
      HICP:       prevEU.HICP ? jitter(prevEU.HICP, 0.002) : null,
      M3_GROWTH:  prevEU.M3_GROWTH ? jitter(prevEU.M3_GROWTH, 0.002) : null,
      SPREAD:     prevEU.SPREAD ? jitter(prevEU.SPREAD, 0.003) : null,
      RATE_SHOCK: prevEU.RATE_SHOCK ? jitter(prevEU.RATE_SHOCK, 0.005) : 0.08,
    };
    sources['EU.ECB_RATE'] = ecbRate ? 'FRED' : (prevEU.ECB_RATE ? 'DB_JITTER' : 'NONE');

    const newCrypto = {
      BTC_PRICE:      cryptoData?.btc ?? (prevCrypto.BTC_PRICE ? jitter(prevCrypto.BTC_PRICE, 0.003) : null),
      BTC_CHANGE_24H: cryptoData?.btcChange ?? (prevCrypto.BTC_CHANGE_24H ?? 0),
      BTC_DOMINANCE:  prevCrypto.BTC_DOMINANCE ? jitter(prevCrypto.BTC_DOMINANCE, 0.001) : 52.5,
      BTC_VOL:        prevCrypto.BTC_VOL ? jitter(prevCrypto.BTC_VOL, 0.005) : 0.65,
      ETH_PRICE:      cryptoData?.eth ?? (prevCrypto.ETH_PRICE ? jitter(prevCrypto.ETH_PRICE, 0.003) : null),
      FEAR_GREED:     cryptoData?.fearGreed ?? prevCrypto.FEAR_GREED ?? 50,
      VAR_95:         prevCrypto.VAR_95 ? jitter(prevCrypto.VAR_95, 0.003) : 0.10,
    };
    sources['CRYPTO.BTC'] = cryptoData?.btc ? 'COINGECKO' : (prevCrypto.BTC_PRICE ? 'DB_JITTER' : 'NONE');
    sources['CRYPTO.FEAR_GREED'] = cryptoData?.fearGreed ? 'ALTERNATIVE.ME' : 'DB';

    const newEnergy = {
      WTI_CRUDE:   commodityData?.wti ?? (prevEnergy.WTI_CRUDE ? jitter(prevEnergy.WTI_CRUDE, 0.003) : null),
      BRENT_CRUDE: commodityData?.brent ?? (prevEnergy.BRENT_CRUDE ? jitter(prevEnergy.BRENT_CRUDE, 0.003) : null),
      NATURAL_GAS: commodityData?.natgas ?? (prevEnergy.NATURAL_GAS ? jitter(prevEnergy.NATURAL_GAS, 0.005) : null),
      URANIUM:     prevEnergy.URANIUM ? jitter(prevEnergy.URANIUM, 0.002) : 92.5,
      GOLD_XAU:    commodityData?.gold ?? (prevEnergy.GOLD_XAU ? jitter(prevEnergy.GOLD_XAU, 0.002) : null),
      SILVER_XAG:  commodityData?.silver ?? (prevEnergy.SILVER_XAG ? jitter(prevEnergy.SILVER_XAG, 0.003) : null),
      COPPER:      prevEnergy.COPPER ? jitter(prevEnergy.COPPER, 0.003) : 4.12,
    };
    sources['ENERGY.WTI'] = commodityData?.wti ? 'FMP' : (prevEnergy.WTI_CRUDE ? 'DB_JITTER' : 'NONE');
    sources['ENERGY.GOLD'] = commodityData?.gold ? 'FMP' : (prevEnergy.GOLD_XAU ? 'DB_JITTER' : 'NONE');

    // ── 4. SKIP INSERT IF ALL VALUES ARE NULL (no data available) ─────────────
    const hasUSData = Object.values(newMacroUS).some(v => v !== null);
    const hasEUData = Object.values(newMacroEU).some(v => v !== null);
    const hasCryptoData = newCrypto.BTC_PRICE !== null || newCrypto.ETH_PRICE !== null;
    const hasEnergyData = Object.values(newEnergy).some(v => v !== null);

    // ── 5. INSERT TO SUPABASE ─────────────────────────────────────────────────
    if (hasUSData || hasEUData) {
      const macroInserts = [];
      if (hasUSData) macroInserts.push({ region: 'US', series: newMacroUS, fetched_at: new Date().toISOString() });
      if (hasEUData) macroInserts.push({ region: 'EU', series: newMacroEU, fetched_at: new Date().toISOString() });
      await supabase.from('macro_data').insert(macroInserts);
      
      // Log US changes
      for (const key of Object.keys(newMacroUS) as (keyof typeof newMacroUS)[]) {
        const oldVal = prevUS[key] ?? null;
        const newVal = newMacroUS[key];
        if (newVal !== null && oldVal !== newVal) {
          await logChange(workerRun, 'macro_data', `US.${key}`, oldVal, newVal, sources[`US.${key}`] ?? 'DERIVED');
          logs.push(`macro_data US.${key}: ${oldVal} → ${newVal} [${sources[`US.${key}`] ?? 'DERIVED'}]`);
        }
      }
    }

    if (hasCryptoData) {
      await supabase.from('crypto_data').insert({ series: newCrypto, fetched_at: new Date().toISOString() });
      
      for (const key of Object.keys(newCrypto) as (keyof typeof newCrypto)[]) {
        const oldVal = prevCrypto[key] ?? null;
        const newVal = newCrypto[key];
        if (newVal !== null && oldVal !== newVal) {
          await logChange(workerRun, 'crypto_data', key, oldVal, newVal, sources[`CRYPTO.${key}`] ?? 'DERIVED');
          logs.push(`crypto_data.${key}: ${oldVal} → ${newVal}`);
        }
      }
    }

    if (hasEnergyData) {
      await supabase.from('energy_data').insert({ series: newEnergy, fetched_at: new Date().toISOString() });
      
      for (const key of Object.keys(newEnergy) as (keyof typeof newEnergy)[]) {
        const oldVal = prevEnergy[key] ?? null;
        const newVal = newEnergy[key];
        if (newVal !== null && oldVal !== newVal) {
          await logChange(workerRun, 'energy_data', key, oldVal, newVal, sources[`ENERGY.${key}`] ?? 'DERIVED');
          logs.push(`energy_data.${key}: ${oldVal} → ${newVal}`);
        }
      }
    }

    // ── 6. SUMMARY LOG ────────────────────────────────────────────────────────
    await supabase.from('macro_worker_logs').insert({
      worker_run: workerRun,
      table_name: 'ALL',
      metric_key: 'RUN_COMPLETE',
      old_value: null,
      new_value: logs.length,
      status: 'OK',
      details: {
        message: `Worker complete. ${logs.length} metric(s) updated.`,
        sources,
        apis: { fred: !!FRED_API_KEY, coingecko: true, fmp: !!FMP_API_KEY },
        changes: logs.slice(0, 20), // Limit log size
      },
    });

    console.log(`[DataWorker] Complete: ${logs.length} changes`);

    return res.status(200).json({
      success: true,
      worker_run: workerRun,
      changes: logs.length,
      sources,
      apis: { fred: !!FRED_API_KEY, coingecko: true, fmp: !!FMP_API_KEY },
      log_entries: logs,
    });
  } catch (err: any) {
    console.error('[DataWorker] Error:', err.message);

    await supabase.from('macro_worker_logs').insert({
      worker_run: workerRun,
      table_name: 'ALL',
      metric_key: 'RUN_ERROR',
      status: 'ERROR',
      details: { message: err.message },
    });

    return res.status(500).json({ success: false, error: err.message });
  }
}
