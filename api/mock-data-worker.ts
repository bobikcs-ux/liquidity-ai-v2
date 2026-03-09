import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Server-side: use SUPABASE_URL and SERVICE_ROLE_KEY (not VITE_ prefixed)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Small random jitter to simulate live market movement
function jitter(base: number, pct = 0.005): number {
  return parseFloat((base * (1 + (Math.random() - 0.5) * 2 * pct)).toFixed(4));
}

async function logChange(
  workerRun: string,
  tableName: string,
  metricKey: string,
  oldValue: number | null,
  newValue: number,
  status = 'OK'
) {
  await supabase.from('macro_worker_logs').insert({
    worker_run: workerRun,
    table_name: tableName,
    metric_key: metricKey,
    old_value: oldValue,
    new_value: newValue,
    status,
    details: {
      message: `${tableName}.${metricKey}: ${oldValue ?? 'init'} → ${newValue}`,
      delta: oldValue != null ? +(newValue - oldValue).toFixed(6) : null,
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ready',
      message: 'Mock Data Worker — POST to trigger a data update cycle.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const workerRun = `run_${Date.now()}`;
  const logs: string[] = [];

  try {
    // ── 1. MACRO DATA ────────────────────────────────────────────────────────
    const { data: latestMacro } = await supabase
      .from('macro_data')
      .select('id, region, series')
      .order('fetched_at', { ascending: false })
      .limit(2);

    const prevMacroUS = latestMacro?.find((r) => r.region === 'US')?.series ?? {};
    const prevMacroEU = latestMacro?.find((r) => r.region === 'EU')?.series ?? {};

    const newMacroUS = {
      DGS10:      jitter(prevMacroUS.DGS10      ?? 4.28,  0.003),
      DGS2:       jitter(prevMacroUS.DGS2       ?? 4.12,  0.003),
      WALCL:      jitter(prevMacroUS.WALCL      ?? 7200,  0.001),
      SPREAD:     +((prevMacroUS.DGS10 ?? 4.28) - (prevMacroUS.DGS2 ?? 4.12)).toFixed(4),
      RATE_SHOCK: jitter(prevMacroUS.RATE_SHOCK ?? 0.12,  0.01),
    };
    const newMacroEU = {
      ECB_RATE:   jitter(prevMacroEU.ECB_RATE   ?? 3.75,  0.002),
      HICP:       jitter(prevMacroEU.HICP        ?? 2.6,   0.004),
      M3_GROWTH:  jitter(prevMacroEU.M3_GROWTH  ?? 3.1,   0.003),
      SPREAD:     jitter(prevMacroEU.SPREAD      ?? 0.22,  0.005),
      RATE_SHOCK: jitter(prevMacroEU.RATE_SHOCK ?? 0.08,  0.01),
    };

    await supabase.from('macro_data').insert([
      { region: 'US', series: newMacroUS, fetched_at: new Date().toISOString() },
      { region: 'EU', series: newMacroEU, fetched_at: new Date().toISOString() },
    ]);

    for (const key of Object.keys(newMacroUS) as (keyof typeof newMacroUS)[]) {
      const oldVal = prevMacroUS[key] ?? null;
      const newVal = newMacroUS[key];
      if (oldVal !== newVal) {
        await logChange(workerRun, 'macro_data', `US.${key}`, oldVal, newVal);
        logs.push(`macro_data US.${key}: ${oldVal} → ${newVal}`);
      }
    }

    // ── 2. CRYPTO DATA ───────────────────────────────────────────────────────
    const { data: latestCrypto } = await supabase
      .from('crypto_data')
      .select('id, series')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    const prevCrypto = latestCrypto?.series ?? {};

    const newCrypto = {
      BTC_PRICE:      jitter(prevCrypto.BTC_PRICE      ?? 67500, 0.008),
      BTC_CHANGE_24H: jitter(prevCrypto.BTC_CHANGE_24H ?? -1.4,  0.05),
      BTC_DOMINANCE:  jitter(prevCrypto.BTC_DOMINANCE  ?? 52.5,  0.002),
      BTC_VOL:        jitter(prevCrypto.BTC_VOL        ?? 0.65,  0.01),
      ETH_PRICE:      jitter(prevCrypto.ETH_PRICE      ?? 3520,  0.008),
      FEAR_GREED:     Math.min(100, Math.max(0, Math.round(jitter(prevCrypto.FEAR_GREED ?? 22, 0.02)))),
      VAR_95:         jitter(prevCrypto.VAR_95         ?? 0.107, 0.005),
    };

    await supabase.from('crypto_data').insert({
      series: newCrypto,
      fetched_at: new Date().toISOString(),
    });

    for (const key of Object.keys(newCrypto) as (keyof typeof newCrypto)[]) {
      const oldVal = prevCrypto[key] ?? null;
      const newVal = newCrypto[key];
      if (oldVal !== newVal) {
        await logChange(workerRun, 'crypto_data', key, oldVal, newVal);
        logs.push(`crypto_data.${key}: ${oldVal} → ${newVal}`);
      }
    }

    // ── 3. ENERGY DATA ───────────────────────────────────────────────────────
    const { data: latestEnergy } = await supabase
      .from('energy_data')
      .select('id, series')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    const prevEnergy = latestEnergy?.series ?? {};

    const newEnergy = {
      WTI_CRUDE:   jitter(prevEnergy.WTI_CRUDE   ?? 82.40, 0.006),
      BRENT_CRUDE: jitter(prevEnergy.BRENT_CRUDE ?? 86.10, 0.006),
      NATURAL_GAS: jitter(prevEnergy.NATURAL_GAS ?? 2.74,  0.01),
      URANIUM:     jitter(prevEnergy.URANIUM     ?? 92.50, 0.004),
      GOLD_XAU:    jitter(prevEnergy.GOLD_XAU   ?? 2940,  0.004),
      SILVER_XAG:  jitter(prevEnergy.SILVER_XAG ?? 32.4,  0.005),
      COPPER:      jitter(prevEnergy.COPPER      ?? 4.12,  0.005),
    };

    await supabase.from('energy_data').insert({
      series: newEnergy,
      fetched_at: new Date().toISOString(),
    });

    for (const key of Object.keys(newEnergy) as (keyof typeof newEnergy)[]) {
      const oldVal = prevEnergy[key] ?? null;
      const newVal = newEnergy[key];
      if (oldVal !== newVal) {
        await logChange(workerRun, 'energy_data', key, oldVal, newVal);
        logs.push(`energy_data.${key}: ${oldVal} → ${newVal}`);
      }
    }

    // ── 4. UPDATE PRICES TABLE ────────────────────────────────────────────────
    // Update T-series product prices with realistic values derived from market data
    const priceUpdates = [
      { product_code: 'T63', price: jitter(newCrypto.BTC_PRICE * 0.001,      0.008), source: 'mock_worker' },
      { product_code: 'T76', price: jitter(newEnergy.GOLD_XAU * 0.1,         0.005), source: 'mock_worker' },
      { product_code: 'T81', price: jitter(newEnergy.WTI_CRUDE,               0.006), source: 'mock_worker' },
      { product_code: 'T94', price: jitter(newMacroUS.DGS10 * 100,            0.004), source: 'mock_worker' },
      { product_code: 'T95', price: jitter(newCrypto.ETH_PRICE * 0.01,        0.007), source: 'mock_worker' },
    ];

    for (const update of priceUpdates) {
      const { data: existing } = await supabase
        .from('prices')
        .select('price')
        .eq('product_code', update.product_code)
        .single();

      const oldPrice = existing?.price ?? 0;
      
      await supabase
        .from('prices')
        .update({ price: update.price, source: update.source, updated_at: new Date().toISOString() })
        .eq('product_code', update.product_code);

      if (Math.abs(Number(oldPrice) - update.price) > 0.0001) {
        await logChange(workerRun, 'prices', update.product_code, Number(oldPrice), update.price);
        logs.push(`prices.${update.product_code}: ${oldPrice} → ${update.price.toFixed(4)}`);
      }
    }

    // ── 5. Write run-summary log entry ───────────────────────────────────────
    await supabase.from('macro_worker_logs').insert({
      worker_run: workerRun,
      table_name: 'ALL',
      metric_key: 'RUN_COMPLETE',
      old_value:  null,
      new_value:  logs.length,
      status:     'OK',
      details: {
        message:    `Worker run complete. ${logs.length} metric(s) updated.`,
        changes:    logs,
        run_id:     workerRun,
      },
    });

    return res.status(200).json({
      success:     true,
      worker_run:  workerRun,
      changes:     logs.length,
      log_entries: logs,
    });
  } catch (err: any) {
    console.error('[MockDataWorker] Error:', err.message);

    await supabase.from('macro_worker_logs').insert({
      worker_run: workerRun,
      table_name: 'ALL',
      metric_key: 'RUN_ERROR',
      status:     'ERROR',
      details:    { message: err.message },
    });

    return res.status(500).json({ success: false, error: err.message });
  }
}
