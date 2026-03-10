/**
 * RATE LIMIT MANAGER
 * 
 * Enforces per-API minimum intervals to prevent key burnout.
 * Shared singleton — all services check this before making external requests.
 */

// ============================================================================
// RATE LIMIT CONFIG (milliseconds between calls per API)
// ============================================================================

export const RATE_LIMITS: Record<string, number> = {
  coingecko:  5_000,   // free tier: 10-30 req/min
  finnhub:    2_000,   // real-time: 60 req/min
  fred:       30_000,  // daily economic data, conservative
  eia:        30_000,  // official govt data, conservative
  alchemy:    3_000,   // 300 req/sec on paid plans; conservative for free
  news:       60_000,  // news API: 100 req/day on free plan
  worldNews:  60_000,  // world news: 100 req/day
  acled:      60_000,  // conflict data: infrequent updates
  fearGreed:  10_000,  // alternative.me: no hard rate limit, be polite
};

// ============================================================================
// INTERNAL STATE
// ============================================================================

// last successful fetch timestamp per API
const lastFetchMs = new Map<string, number>();

// per-API consecutive failure counters
const failureCount = new Map<string, number>();
const MAX_FAILURES_BEFORE_BACKOFF = 3;
const BACKOFF_MULTIPLIER = 2; // exponential backoff

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Returns true if enough time has passed since the last successful fetch.
 * Respects exponential backoff when an API is experiencing repeated failures.
 */
export function shouldFetch(apiName: string): boolean {
  const minInterval = RATE_LIMITS[apiName] ?? 5_000;
  const last = lastFetchMs.get(apiName) ?? 0;
  const failures = failureCount.get(apiName) ?? 0;

  // Exponential backoff: add 2^n * minInterval for repeated failures
  const backoff = failures >= MAX_FAILURES_BEFORE_BACKOFF
    ? Math.min(minInterval * Math.pow(BACKOFF_MULTIPLIER, failures - MAX_FAILURES_BEFORE_BACKOFF + 1), 10 * 60_000)
    : 0;

  return Date.now() - last > minInterval + backoff;
}

/**
 * Record a successful fetch — resets failure count + updates timestamp.
 */
export function recordSuccess(apiName: string): void {
  lastFetchMs.set(apiName, Date.now());
  failureCount.set(apiName, 0);
}

/**
 * Record a fetch failure — increments failure count for backoff.
 */
export function recordFailure(apiName: string): void {
  const current = failureCount.get(apiName) ?? 0;
  failureCount.set(apiName, current + 1);
}

/**
 * Force-reset an API's rate limit state (useful for manual refresh).
 */
export function resetLimit(apiName: string): void {
  lastFetchMs.set(apiName, 0);
  failureCount.set(apiName, 0);
}

/**
 * Returns the time in ms until this API can be fetched again.
 * Returns 0 if fetch is allowed now.
 */
export function msUntilNextFetch(apiName: string): number {
  const minInterval = RATE_LIMITS[apiName] ?? 5_000;
  const last = lastFetchMs.get(apiName) ?? 0;
  const elapsed = Date.now() - last;
  return Math.max(0, minInterval - elapsed);
}

/**
 * Returns last successful fetch timestamp for an API.
 */
export function getLastFetchMs(apiName: string): number {
  return lastFetchMs.get(apiName) ?? 0;
}
