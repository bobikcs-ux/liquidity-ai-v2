/**
 * FINNHUB SERVICE
 * 
 * Fetches real-time commodity spot prices (Gold, WTI, Brent) and
 * market sentiment data from Finnhub.io.
 */

import { gatewayFetch } from '../lib/apiGateway';
import type { PriceMetric } from '../types/terminal';
import { TERMINAL_STATE_DEFAULTS } from '../types/terminal';

// ============================================================================
// TYPES (Finnhub API shapes)
// ============================================================================

interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // high
  l: number;  // low
  o: number;  // open
  pc: number; // previous close
}

// ============================================================================
// HELPERS
// ============================================================================

function getApiKey(): string {
  const key = import.meta.env.VITE_FINNHUB_API_KEY;
  return key && key.trim() ? key.trim() : '';
}

function makePriceMetric(quote: FinnhubQuote, source: string): PriceMetric {
  return {
    value: quote.c,
    change24h: quote.d,
    changePct24h: quote.dp,
    source,
  };
}

// ============================================================================
// FETCH FUNCTIONS (via server-side proxy to avoid CORS)
// ============================================================================

/**
 * Fetch Gold spot price via server proxy.
 */
export async function fetchGoldPrice(): Promise<PriceMetric | null> {
  try {
    const resp = await gatewayFetch<FinnhubQuote & { status: string }>(
      '/api/commodities/quote?symbol=OANDA:XAU_USD',
      { apiName: 'finnhub', cacheKey: 'finnhub-gold-proxy', cacheTtlMs: 3 * 60_000 },
    );

    if (resp.data?.c && resp.data.c > 0) {
      return makePriceMetric(resp.data, 'finnhub');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch WTI + Brent crude oil spot prices via server proxy.
 */
export async function fetchOilPrices(): Promise<{
  wti: PriceMetric;
  brent: PriceMetric;
  source: 'LIVE' | 'SEED';
}> {
  const seeds = TERMINAL_STATE_DEFAULTS.prices.oil;

  try {
    const [wtiResp, brentResp] = await Promise.allSettled([
      gatewayFetch<FinnhubQuote & { status: string }>(
        '/api/commodities/quote?symbol=OANDA:WTICO_USD',
        { apiName: 'finnhub', cacheKey: 'finnhub-wti-proxy', cacheTtlMs: 3 * 60_000 },
      ),
      gatewayFetch<FinnhubQuote & { status: string }>(
        '/api/commodities/quote?symbol=OANDA:BCO_USD',
        { apiName: 'finnhub', cacheKey: 'finnhub-brent-proxy', cacheTtlMs: 3 * 60_000, skipRateLimit: true },
      ),
    ]);

    const wtiData = wtiResp.status === 'fulfilled' ? wtiResp.value.data : null;
    const brentData = brentResp.status === 'fulfilled' ? brentResp.value.data : null;

    const wti = wtiData?.c && wtiData.c > 0
      ? makePriceMetric(wtiData, 'finnhub')
      : seeds.wti;

    const brent = brentData?.c && brentData.c > 0
      ? makePriceMetric(brentData, 'finnhub')
      : seeds.brent;

    const isLive = (wtiData?.c ?? 0) > 0 || (brentData?.c ?? 0) > 0;
    return { wti, brent, source: isLive ? 'LIVE' : 'SEED' };
  } catch {
    return { wti: seeds.wti, brent: seeds.brent, source: 'SEED' };
  }
}

/**
 * Fetch market sentiment score from Finnhub (BTC symbol news sentiment).
 * Returns 0–100 normalized score.
 */
export async function fetchSentimentScore(): Promise<number | null> {
  const key = getApiKey();
  if (!key) return null;

  interface FinnhubSentiment {
    buzz: { articlesInLastWeek: number; weeklyAverage: number; buzz: number };
    companyNewsScore: number;
    sectorAverageBullishPercent: number;
    sectorAverageNewsScore: number;
    sentiment: { bearishPercent: number; bullishPercent: number };
  }

  const resp = await gatewayFetch<FinnhubSentiment>(
    `${BASE}/news-sentiment?symbol=BINANCE:BTCUSDT&token=${key}`,
    { apiName: 'finnhub', cacheKey: 'finnhub-sentiment', cacheTtlMs: 10 * 60_000 },
  );

  if (resp.data?.sentiment?.bullishPercent !== undefined) {
    return Math.round(resp.data.sentiment.bullishPercent * 100);
  }
  return null;
}
