import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function - CoinGecko Proxy
 * Route: /api/crypto/prices
 */

const SEEDS = {
  btc: { usd: 98500, usd_24h_change: 2.5 },
  eth: { usd: 3450, usd_24h_change: 1.8 },
  btcDominance: 54.2,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.COINGECKO_API_KEY || process.env.VITE_COINGECKO_API_KEY || '';
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey;

  try {
    // Fetch prices
    const priceUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true';
    const priceRes = await fetch(priceUrl, { headers, signal: AbortSignal.timeout(10000) });
    
    let priceData = null;
    if (priceRes.ok) {
      priceData = await priceRes.json();
    }

    // Fetch global data (BTC dominance)
    const globalUrl = 'https://api.coingecko.com/api/v3/global';
    const globalRes = await fetch(globalUrl, { headers, signal: AbortSignal.timeout(10000) });
    
    let btcDominance = SEEDS.btcDominance;
    if (globalRes.ok) {
      const globalData = await globalRes.json();
      btcDominance = globalData?.data?.market_cap_percentage?.btc ?? SEEDS.btcDominance;
    }

    return res.status(200).json({
      status: priceData ? 'LIVE' : 'FALLBACK',
      bitcoin: priceData?.bitcoin ?? SEEDS.btc,
      ethereum: priceData?.ethereum ?? SEEDS.eth,
      btcDominance,
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[CoinGecko Proxy] Error:', err);
    return res.status(200).json({
      status: 'FALLBACK',
      bitcoin: SEEDS.btc,
      ethereum: SEEDS.eth,
      btcDominance: SEEDS.btcDominance,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
