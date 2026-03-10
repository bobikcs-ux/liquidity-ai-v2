/**
 * COINGECKO SERVICE
 * 
 * Fetches BTC/ETH prices, 24h changes, global market data (BTC dominance),
 * and Fear & Greed Index from alternative.me.
 */

import { gatewayFetch } from '../lib/apiGateway';
import type { MarketPrices, PriceMetric } from '../types/terminal';
import { TERMINAL_STATE_DEFAULTS } from '../types/terminal';

// ============================================================================
// TYPES (CoinGecko API shapes)
// ============================================================================

interface CGSimplePrice {
  bitcoin: { usd: number; usd_24h_change: number };
  ethereum: { usd: number; usd_24h_change: number };
}

interface CGGlobalData {
  data: {
    market_cap_percentage: { btc: number };
  };
}

interface FNGResponse {
  data: Array<{ value: string; value_classification: string }>;
}

// ============================================================================
// SEEDS
// ============================================================================

const SEEDS = TERMINAL_STATE_DEFAULTS.prices;

// ============================================================================
// HELPERS
// ============================================================================

function getApiKey(): string {
  const key = import.meta.env.VITE_COINGECKO_API_KEY;
  return key && key.trim() ? key.trim() : '';
}

function buildHeaders(): Record<string, string> {
  const key = getApiKey();
  if (key) return { 'x-cg-demo-api-key': key };
  return {};
}

function makePriceMetric(value: number, change24h: number, source: string): PriceMetric {
  return {
    value,
    change24h,
    changePct24h: value > 0 ? (change24h / (value - change24h)) * 100 : 0,
    source,
  };
}

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Fetch BTC + ETH spot prices and BTC dominance from CoinGecko.
 * Returns null on failure (caller falls back to seed).
 */
export async function fetchCryptoMarket(): Promise<{
  prices: Pick<MarketPrices, 'btc' | 'eth' | 'btcDominance'>;
  source: 'LIVE' | 'SEED';
} | null> {
  const headers = buildHeaders();
  const baseUrl = 'https://api.coingecko.com/api/v3';

  const [priceResp, globalResp] = await Promise.allSettled([
    gatewayFetch<CGSimplePrice>(
      `${baseUrl}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true`,
      { apiName: 'coingecko', cacheKey: 'cg-simple-price', cacheTtlMs: 5 * 60_000, headers },
    ),
    gatewayFetch<CGGlobalData>(
      `${baseUrl}/global`,
      { apiName: 'coingecko', cacheKey: 'cg-global', cacheTtlMs: 5 * 60_000, headers, skipRateLimit: true },
    ),
  ]);

  const priceData = priceResp.status === 'fulfilled' ? priceResp.value.data : null;
  const globalData = globalResp.status === 'fulfilled' ? globalResp.value.data : null;

  if (!priceData?.bitcoin || !priceData?.ethereum) return null;

  return {
    prices: {
      btc: makePriceMetric(priceData.bitcoin.usd, priceData.bitcoin.usd_24h_change, 'coingecko'),
      eth: makePriceMetric(priceData.ethereum.usd, priceData.ethereum.usd_24h_change, 'coingecko'),
      btcDominance: globalData?.data?.market_cap_percentage?.btc ?? SEEDS.btcDominance,
    },
    source: 'LIVE',
  };
}

/**
 * Fetch Fear & Greed Index from alternative.me (no API key required).
 */
export async function fetchFearGreed(): Promise<{
  value: number;
  label: string;
  source: 'LIVE' | 'SEED';
}> {
  const resp = await gatewayFetch<FNGResponse>(
    'https://api.alternative.me/fng/',
    { apiName: 'fearGreed', cacheKey: 'fear-greed', cacheTtlMs: 10 * 60_000 },
  );

  if (resp.data?.data?.[0]?.value) {
    const raw = resp.data.data[0];
    return {
      value: parseInt(raw.value, 10),
      label: raw.value_classification,
      source: 'LIVE',
    };
  }

  const seed = TERMINAL_STATE_DEFAULTS.sentiment.fearGreedIndex;
  return {
    value: seed,
    label: TERMINAL_STATE_DEFAULTS.sentiment.fearGreedLabel,
    source: 'SEED',
  };
}
