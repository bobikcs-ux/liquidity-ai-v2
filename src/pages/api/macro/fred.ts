import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Server-side FRED API proxy to bypass CORS restrictions.
 * Client calls /api/macro/fred?series=DGS10 and we fetch from stlouisfed.org
 */

const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { series } = req.query;
  if (!series || typeof series !== 'string') {
    return res.status(400).json({ error: 'Missing series parameter' });
  }

  const fredKey = process.env.VITE_FRED_API_KEY || process.env.FRED_API_KEY;
  if (!fredKey) {
    console.error('[FRED API] No API key configured');
    return res.status(500).json({ error: 'FRED_API_KEY not configured', status: 'CONFIG_ERROR' });
  }

  try {
    const url = `${FRED_API_BASE}?series_id=${series}&api_key=${fredKey}&file_type=json&limit=1&sort_order=desc`;
    
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`[FRED API] ${series} failed: ${response.status}`);
      return res.status(response.status).json({ 
        error: `FRED returned ${response.status}`, 
        status: response.status === 403 ? 'FORBIDDEN' : response.status === 429 ? 'RATE_LIMITED' : 'ERROR'
      });
    }

    const data = await response.json();
    
    // Extract latest observation
    const observations = data?.observations;
    if (!observations || observations.length === 0) {
      return res.status(404).json({ error: 'No observations found', status: 'EMPTY' });
    }

    const latest = observations[0];
    const value = parseFloat(latest.value);
    
    if (isNaN(value)) {
      return res.status(422).json({ error: 'Invalid value from FRED', status: 'PARSE_ERROR' });
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
    return res.status(500).json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      status: 'NETWORK_ERROR'
    });
  }
}
