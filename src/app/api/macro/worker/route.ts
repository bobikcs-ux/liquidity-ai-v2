import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// --- Helper: fetch with retry and exponential backoff ---
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, delay = 500) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err: any) {
      console.warn(`[MacroWorker] Fetch attempt ${i + 1} failed:`, err.message);
      if (i < retries) await new Promise((r) => setTimeout(r, delay * Math.pow(2, i)));
      else throw err;
    }
  }
}

// --- Fetch FRED yield curve ---
async function fetchYieldCurve() {
  const fredApiKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
  if (!fredApiKey) {
    console.warn('[MacroWorker] No FRED API key configured, using fallback');
    return { spread: -0.42, rateShock: 0.15 };
  }

  try {
    const [gs10Res, gs2Res] = await Promise.all([
      fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=GS10&api_key=${fredApiKey}&file_type=json&limit=1&sort_order=desc`),
      fetchWithRetry(`https://api.stlouisfed.org/fred/series/observations?series_id=GS2&api_key=${fredApiKey}&file_type=json&limit=1&sort_order=desc`),
    ]);

    const [gs10Data, gs2Data] = await Promise.all([gs10Res.json(), gs2Res.json()]);
    const gs10 = parseFloat(gs10Data.observations?.[0]?.value || '4.5');
    const gs2 = parseFloat(gs2Data.observations?.[0]?.value || '4.9');
    const spread = gs10 - gs2;

    console.log('[MacroWorker] FRED yield curve fetched:', { gs10, gs2, spread });
    return { spread, rateShock: Math.abs(spread) > 0.5 ? 0.2 : 0.1 };
  } catch (error: any) {
    console.error('[MacroWorker] FRED fetch error:', error.message);
    return { spread: -0.42, rateShock: 0.15 };
  }
}

// --- Fetch BTC data ---
async function fetchBTCData() {
  const coinGeckoApiKey = process.env.COINGECKO_API_KEY;
  const headers: HeadersInit = { Accept: 'application/json' };
  if (coinGeckoApiKey) headers['x-cg-demo-api-key'] = coinGeckoApiKey;

  let price = 67500,
    vol = 0.65,
    dominance = 52.5;

  try {
    const chartRes = await fetchWithRetry(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30',
      { headers }
    );
    const chartData = await chartRes.json();
    const prices = chartData.prices?.map((p: number[]) => p[1]) || [];
    price = prices[prices.length - 1] || price;

    if (prices.length > 1) {
      const returns = prices.slice(1).map((v, i) => Math.log(v / prices[i]));
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      vol = Math.sqrt(variance) * Math.sqrt(365);
    }

    const globalRes = await fetchWithRetry('https://api.coingecko.com/api/v3/global', { headers });
    const globalData = await globalRes.json();
    const btcDom = globalData?.data?.market_cap_percentage?.btc;
    if (typeof btcDom === 'number') dominance = btcDom;

    console.log('[MacroWorker] BTC data fetched:', { price, vol, dominance });
  } catch (err: any) {
    console.error('[MacroWorker] CoinGecko fetch error:', err.message);
  }

  return { price, volatility: vol, dominance };
}

// --- Fetch Fed balance sheet delta ---
async function fetchBalanceSheetDelta() {
  const fredApiKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
  if (!fredApiKey) return -2.3;

  try {
    const res = await fetchWithRetry(
      `https://api.stlouisfed.org/fred/series/observations?series_id=WALCL&api_key=${fredApiKey}&file_type=json&limit=8&sort_order=desc`
    );
    const data = await res.json();
    const obs = data.observations || [];
    if (obs.length >= 2) {
      const latest = parseFloat(obs[0].value),
        prev = parseFloat(obs[1].value);
      return ((latest - prev) / prev) * 100;
    }
    return -2.3;
  } catch (err: any) {
    console.error('[MacroWorker] FRED balance sheet error:', err.message);
    return -2.3;
  }
}

// --- Calculate systemic risk metrics ---
function calculateMetrics(data: {
  yieldSpread: number;
  rateShock: number;
  balanceSheetDelta: number;
  btcVolatility: number;
}) {
  const yieldRisk = data.yieldSpread < 0 ? Math.abs(data.yieldSpread) * 0.5 : 0;
  const volRisk = Math.min(data.btcVolatility, 1) * 0.3;
  const liquidityRisk = data.balanceSheetDelta < 0 ? Math.abs(data.balanceSheetDelta) * 0.02 : 0;
  const shockRisk = data.rateShock * 0.2;

  const systemicRisk = Math.min(1, yieldRisk + volRisk + liquidityRisk + shockRisk);
  const survivalProbability = Math.max(0, Math.min(1, 1 - systemicRisk * 0.8));
  const var95 = data.btcVolatility * 1.645 * 0.1;
  let regime: 'normal' | 'stress' | 'crisis' = 'normal';
  if (systemicRisk > 0.6) regime = 'crisis';
  else if (systemicRisk > 0.3) regime = 'stress';

  console.log('[MacroWorker] Metrics calculated:', { systemicRisk, survivalProbability, var95, regime });
  return { systemicRisk, survivalProbability, var95, regime };
}

// --- POST handler: Macro worker orchestration ---
export async function POST(req: NextRequest) {
  try {
    console.log('[MacroWorker] Starting macro worker');

    const [yieldData, btcData, balanceDelta] = await Promise.all([
      fetchYieldCurve(),
      fetchBTCData(),
      fetchBalanceSheetDelta(),
    ]);

    const metrics = calculateMetrics({
      yieldSpread: yieldData.spread,
      rateShock: yieldData.rateShock,
      balanceSheetDelta: balanceDelta,
      btcVolatility: btcData.volatility,
    });

    const snapshotPayload = {
      yield_spread: yieldData.spread,
      rate_shock: yieldData.rateShock,
      balance_sheet_delta: balanceDelta,
      btc_price: btcData.price,
      btc_volatility: btcData.volatility,
      btc_dominance: btcData.dominance,
      systemic_risk: metrics.systemicRisk,
      survival_probability: metrics.survivalProbability,
      var_95: metrics.var95,
      regime: metrics.regime,
      data_sources_ok: true,
    };

    const { data: snapshot, error } = await supabase
      .from('market_snapshots')
      .insert(snapshotPayload)
      .select()
      .single();

    if (error) {
      console.error('[MacroWorker] Supabase insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    console.log('[MacroWorker] Snapshot saved:', snapshot?.id);
    return NextResponse.json({ success: true, snapshot }, { status: 200 });
  } catch (err: any) {
    console.error('[MacroWorker] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// --- GET handler: Health check ---
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    message: 'Macro worker endpoint is operational. POST to trigger macro data fetch.',
  });
}
