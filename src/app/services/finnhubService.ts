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
// FETCH FUNCTIONS
// ============================================================================

const BASE = 'https://finnhub.io/api/v1';

/**
 * Fetch Gold spot price from Finnhub (symbol: OANDA:XAU_USD).
 */
export async function fetchGoldPrice(): Promise<PriceMetric | null> {
  const key = getApiKey();
  if (!key) return null;

  const resp = await gatewayFetch<FinnhubQuote>(
    `${BASE}/quote?symbol=OANDA:XAU_USD&token=${key}`,
    { apiName: 'finnhub', cacheKey: 'finnhub-gold', cacheTtlMs: 3 * 60_000 },
  );

  if (resp.data?.c && resp.data.c > 0) {
    return makePriceMetric(resp.data, 'finnhub');
  }
  return null;
}

/**
 * Fetch WTI crude oil spot price from Finnhub (symbol: OANDA:BCOUSD for Brent).
 * Uses EIA futures proxy when available.
 */
export async function fetchOilPrices(): Promise<{
  wti: PriceMetric;
  brent: PriceMetric;
  source: 'LIVE' | 'SEED';
}> {
  const key = getApiKey();
  const seeds = TERMINAL_STATE_DEFAULTS.prices.oil;

  if (!key) {
    return { wti: seeds.wti, brent: seeds.brent, source: 'SEED' };
  }

  // Finnhub commodity symbols: NYMEX:CL1! (WTI futures), NYMEX:BZ1! (Brent futures)
  const [wtiResp, brentResp] = await Promise.allSettled([
    gatewayFetch<FinnhubQuote>(
      `${BASE}/quote?symbol=NYMEX:CL1!&token=${key}`,
      { apiName: 'finnhub', cacheKey: 'finnhub-wti', cacheTtlMs: 3 * 60_000 },
    ),
    gatewayFetch<FinnhubQuote>(
      `${BASE}/quote?symbol=NYMEX:BZ1!&token=${key}`,
      { apiName: 'finnhub', cacheKey: 'finnhub-brent', cacheTtlMs: 3 * 60_000, skipRateLimit: true },
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
