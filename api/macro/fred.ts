import { VercelRequest, VercelResponse } from '@vercel/node';

const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';

// Fallback values за често използвани серии
const FALLBACKS: Record<string, number> = {
  DGS10: 3.5,
  DGS2: 1.2,
  CPIAUCSL: 0.04,
  FEDFUNDS: 0.25,
  UNRATE: 5.0,
};

function getFallbackValue(series: string) {
  return FALLBACKS[series] ?? 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const series = req.query.series as string;
  if (!series) {
    return res.status(400).json({ error: 'Missing series parameter' });
  }

  const fredKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
  if (!fredKey) {
    return res.status(200).json({
      status: 'FALLBACK',
      value: getFallbackValue(series),
      reason: 'No FRED API key configured',
    });
  }

  try {
    const url = `${FRED_API_BASE}?series_id=${series}&api_key=${fredKey}&file_type=json&sort_order=desc&limit=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (!response.ok) {
      console.warn(`[FRED] API returned ${response.status}`);
      return res.status(200).json({
        status: 'FALLBACK',
        value: getFallbackValue(series),
        reason: `FRED returned ${response.status}`,
      });
    }

    const data = await response.json();
    const latest = data?.observations?.[0];
    if (!latest || !latest.value || latest.value === '.') {
      return res.status(200).json({
        status: 'FALLBACK',
        value: getFallbackValue(series),
        reason: 'No valid observation',
      });
    }

    return res.status(200).json({
      status: 'LIVE',
      value: parseFloat(latest.value),
      date: latest.date,
    });
  } catch (err) {
    console.error('[FRED] Error:', err instanceof Error ? err.message : String(err));
    return res.status(200).json({
      status: 'FALLBACK',
      value: getFallbackValue(series),
      reason: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}