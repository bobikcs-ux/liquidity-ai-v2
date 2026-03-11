import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function - System Health Check
 * Route: /api/health
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const envCheck = {
    supabase: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    fred: !!(process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY),
    coingecko: !!(process.env.COINGECKO_API_KEY || process.env.VITE_COINGECKO_API_KEY),
    finnhub: !!(process.env.FINNHUB_API_KEY || process.env.VITE_FINNHUB_API_KEY),
    alchemy: !!(process.env.ALCHEMY_API_KEY || process.env.VITE_ALCHEMY_API_KEY),
    eia: !!(process.env.EIA_API_KEY || process.env.VITE_EIA_API_KEY),
  };

  const configuredCount = Object.values(envCheck).filter(Boolean).length;
  const status = configuredCount >= 3 ? 'HEALTHY' : configuredCount >= 1 ? 'DEGRADED' : 'OFFLINE';

  return res.status(200).json({
    status,
    timestamp: new Date().toISOString(),
    services: envCheck,
    configured: `${configuredCount}/${Object.keys(envCheck).length}`,
    version: '2.0.0',
  });
}
