import { VercelRequest, VercelResponse } from '@vercel/node';

const FMP_API_KEY = process.env.VITE_FMP_API_KEY || '';

interface FMPQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
}

const seedData = {
  wti: { price: 78.42, change: 0.85, changesPercentage: 1.09 },
  brent: { price: 82.15, change: 0.92, changesPercentage: 1.13 },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=180, stale-while-revalidate=360');

  if (!FMP_API_KEY) {
    return res.status(200).json({
      status: 'FALLBACK',
      wti: seedData.wti,
      brent: seedData.brent,
      reason: 'No FMP API key',
    });
  }

  try {
    const [wtiRes, brentRes] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/quote/CL=F?apikey=${FMP_API_KEY}`, {
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`https://financialmodelingprep.com/api/v3/quote/BZ=F?apikey=${FMP_API_KEY}`, {
        signal: AbortSignal.timeout(5000),
      }),
    ]);

    const wtiText = await wtiRes.text();
    const brentText = await brentRes.text();

    // Check for "Legacy Endpoint" warning and handle gracefully
    if (wtiText.includes('Legacy Endpoint') || brentText.includes('Legacy Endpoint')) {
      console.log('[Oil] FMP legacy endpoint detected');
    }

    if (!wtiRes.ok || !brentRes.ok) {
      return res.status(200).json({
        status: 'FALLBACK',
        wti: seedData.wti,
        brent: seedData.brent,
        reason: `FMP returned ${wtiRes.status}/${brentRes.status}`,
      });
    }

    const wtiData = JSON.parse(wtiText) as FMPQuote[];
    const brentData = JSON.parse(brentText) as FMPQuote[];

    if (!wtiData?.[0] || !brentData?.[0]) {
      return res.status(200).json({
        status: 'FALLBACK',
        wti: seedData.wti,
        brent: seedData.brent,
        reason: 'FMP returned empty data',
      });
    }

    return res.status(200).json({
      status: 'LIVE',
      wti: {
        price: wtiData[0].price,
        change: wtiData[0].change,
        changesPercentage: wtiData[0].changesPercentage,
      },
      brent: {
        price: brentData[0].price,
        change: brentData[0].change,
        changesPercentage: brentData[0].changesPercentage,
      },
    });
  } catch (err) {
    console.error('[Oil] Error:', err instanceof Error ? err.message : String(err));
    return res.status(200).json({
      status: 'FALLBACK',
      wti: seedData.wti,
      brent: seedData.brent,
      reason: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
