import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function - FRED API Proxy
 * Bypasses CORS restrictions for client-side requests
 * Route: /api/macro/fred?series=DGS10
 */

const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const series = req.query.series as string;
  if (!series) {
    return res.status(400).json({ error: 'Missing series parameter' });
  }

  const fredKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
  if (!fredKey) {
    console.error('[FRED API] No API key configured');
    return res.status(500).json({ 
      error: 'FRED_API_KEY not configured', 
      status: 'CONFIG_ERROR',
      fallback: getFallbackValue(series)
    });
  }

  try {
    const url = `${FRED_API_BASE}?series_id=${series}&api_key=${fredKey}&file_type=json&limit=1&sort_order=desc`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[FRED API] ${series} failed: ${response.status}`);
      return res.status(200).json({ 
        series,
        value: getFallbackValue(series),
        status: 'FALLBACK',
        reason: `FRED returned ${response.status}`
      });
    }

    const data = await response.json();
    const observations = data?.observations;
    
    if (!observations || observations.length === 0) {
      return res.status(200).json({ 
        series,
        value: getFallbackValue(series),
        status: 'FALLBACK',
        reason: 'No observations'
      });
    }

    const latest = observations[0];
    const value = parseFloat(latest.value);
    
    if (isNaN(value)) {
      return res.status(200).json({ 
        series,
        value: getFallbackValue(series),
        status: 'FALLBACK',
        reason: 'Invalid value'
      });
    }

    return res.status(200).json({
      series,
      value,
      date: latest.date,
      fetchedAt: new Date().toISOString(),
      status: 'LIVE',
    });

  } catch (err) {
    console.error(`[FRED API] ${series} error:`, err);
    return res.status(200).json({ 
      series,
      value: getFallbackValue(series),
      status: 'FALLBACK',
      reason: err instanceof Error ? err.message : 'Network error'
    });
  }
}

// Fallback values for common FRED series
function getFallbackValue(series: string): number {
  const fallbacks: Record<string, number> = {
    'DGS10': 4.25,
    'DGS2': 4.65,
    'WM2NS': 21000,
    'INTDSRJPM193N': 0.1,
    'LI0201GYM186S': 0.25,
    'ECBMAINREF': 4.0,
    'FEDFUNDS': 5.25,
    'T10Y2Y': -0.35,
    'BAMLH0A0HYM2': 4.5,
  };
  return fallbacks[series] ?? 0;
}
