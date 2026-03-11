import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function - Finnhub Commodity Quotes Proxy
 * Route: /api/commodities/quote?symbol=XAU
 */

const SEEDS: Record<string, { c: number; d: number; dp: number }> = {
  'OANDA:XAU_USD': { c: 2650, d: 15, dp: 0.57 },
  'OANDA:WTICO_USD': { c: 78.5, d: 1.2, dp: 1.55 },
  'OANDA:BCO_USD': { c: 82.3, d: 0.9, dp: 1.1 },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const symbol = (req.query.symbol as string) || 'OANDA:XAU_USD';
  const apiKey = process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY || '';

  if (!apiKey) {
    const seed = SEEDS[symbol] || SEEDS['OANDA:XAU_USD'];
    return res.status(200).json({ status: 'FALLBACK', symbol, ...seed, reason: 'No API key' });
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!response.ok) {
      const seed = SEEDS[symbol] || SEEDS['OANDA:XAU_USD'];
      return res.status(200).json({ status: 'FALLBACK', symbol, ...seed, reason: `HTTP ${response.status}` });
    }

    const data = await response.json();
    
    if (data.c === 0 && data.d === null) {
      // Finnhub returns zeros for invalid symbols
      const seed = SEEDS[symbol] || SEEDS['OANDA:XAU_USD'];
      return res.status(200).json({ status: 'FALLBACK', symbol, ...seed, reason: 'Invalid symbol' });
    }

    return res.status(200).json({
      status: 'LIVE',
      symbol,
      c: data.c,
      d: data.d,
      dp: data.dp,
      h: data.h,
      l: data.l,
      o: data.o,
      pc: data.pc,
      fetchedAt: new Date().toISOString(),
    });

  } catch (err) {
    const seed = SEEDS[symbol] || SEEDS['OANDA:XAU_USD'];
    return res.status(200).json({
      status: 'FALLBACK',
      symbol,
      ...seed,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
