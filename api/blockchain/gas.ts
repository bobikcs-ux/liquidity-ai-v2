import { VercelRequest, VercelResponse } from '@vercel/node';

const ALCHEMY_KEY = process.env.VITE_ALCHEMY_API_KEY || '';
const SEED_GAS_PRICE = 35; // gwei fallback

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

  if (!ALCHEMY_KEY) {
    return res.status(200).json({
      status: 'FALLBACK',
      value: SEED_GAS_PRICE,
      reason: 'No Alchemy API key configured',
    });
  }

  try {
    const alchemyRes = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_gasPrice',
        params: [],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!alchemyRes.ok) {
      console.log(`[Gas] Alchemy returned ${alchemyRes.status}, using fallback`);
      return res.status(200).json({
        status: 'FALLBACK',
        value: SEED_GAS_PRICE,
        reason: `Alchemy ${alchemyRes.status}`,
      });
    }

    const data = await alchemyRes.json();
    if (data.result) {
      const wei = parseInt(data.result, 16);
      const gwei = Math.round(wei / 1e9);
      return res.status(200).json({
        status: 'LIVE',
        value: gwei,
      });
    }

    return res.status(200).json({
      status: 'FALLBACK',
      value: SEED_GAS_PRICE,
      reason: 'No result in response',
    });
  } catch (err) {
    console.error('[Gas] Error:', err instanceof Error ? err.message : String(err));
    return res.status(200).json({
      status: 'FALLBACK',
      value: SEED_GAS_PRICE,
      reason: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}