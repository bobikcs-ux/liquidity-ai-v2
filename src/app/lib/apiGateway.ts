/**
 * API GATEWAY
 * 
 * Unified fetch wrapper with:
 * - Rate limit enforcement (delegates to rateLimitManager)
 * - In-memory response cache with TTL
 * - Standardized response envelope { data, status, source, error }
 * - Timeout + retry support
 */

import {
  shouldFetch,
  recordSuccess,
  recordFailure,
} from './rateLimitManager';
import type { DataSourceStatus } from '../types/terminal';

// Re-export for convenience
export type { DataSourceStatus };

// ============================================================================
// TYPES
// ============================================================================

export interface GatewayResponse<T> {
  data: T | null;
  status: DataSourceStatus;
  source: string;   // e.g. 'coingecko', 'seed', 'cache'
  error?: string;
  fetchedAtMs: number;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T;
  fetchedAtMs: number;
  ttlMs: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAtMs > entry.ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, fetchedAtMs: Date.now(), ttlMs });
}

export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// ============================================================================
// GATEWAY FETCH
// ============================================================================

interface FetchOptions {
  apiName: string;             // key for rate limiter + cache
  cacheKey: string;            // can be different from apiName (e.g. include params)
  cacheTtlMs?: number;         // default: 5 minutes
  timeoutMs?: number;          // default: 12 seconds
  maxRetries?: number;         // default: 1 (total attempts = 2)
  headers?: Record<string, string>;
  skipRateLimit?: boolean;     // force fetch regardless of rate limit
}

/**
 * Fetches a URL through the gateway, enforcing rate limits + caching.
 * Returns a GatewayResponse<T> — never throws.
 */
export async function gatewayFetch<T>(
  url: string,
  options: FetchOptions,
): Promise<GatewayResponse<T>> {
  const {
    apiName,
    cacheKey,
    cacheTtlMs = 5 * 60_000,
    timeoutMs = 12_000,
    maxRetries = 1,
    headers = {},
    skipRateLimit = false,
  } = options;

  // 1. Return cached data if still valid
  const cached = getCached<T>(cacheKey);
  if (cached !== null) {
    return {
      data: cached,
      status: 'CACHED',
      source: apiName,
      fetchedAtMs: Date.now(),
    };
  }

  // 2. Respect rate limit (unless overridden)
  if (!skipRateLimit && !shouldFetch(apiName)) {
    return {
      data: null,
      status: 'CACHED',
      source: apiName,
      error: `Rate limited — wait before next ${apiName} fetch`,
      fetchedAtMs: Date.now(),
    };
  }

  // 3. Attempt fetch with retry
  let lastError = '';
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        headers: { Accept: 'application/json', ...headers },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        recordFailure(apiName);

        // 429 = rate limited by upstream; don't retry
        if (response.status === 429) {
          return {
            data: null,
            status: 'ERROR',
            source: apiName,
            error: `Upstream rate limit (429): ${apiName}`,
            fetchedAtMs: Date.now(),
          };
        }

        if (attempt < maxRetries) {
          await delay(500 * (attempt + 1));
          continue;
        }
        break;
      }

      const data: T = await response.json();
      recordSuccess(apiName);
      setCache(cacheKey, data, cacheTtlMs);

      return { data, status: 'LIVE', source: apiName, fetchedAtMs: Date.now() };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      recordFailure(apiName);
      if (attempt < maxRetries) {
        await delay(500 * (attempt + 1));
      }
    }
  }

  return {
    data: null,
    status: 'ERROR',
    source: apiName,
    error: lastError,
    fetchedAtMs: Date.now(),
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Compose multiple gateway fetches in parallel, ignoring individual failures.
 */
export async function fetchAll<T>(
  fetchers: Array<() => Promise<GatewayResponse<T>>>,
): Promise<Array<GatewayResponse<T>>> {
  const results = await Promise.allSettled(fetchers.map((f) => f()));
  return results.map((r) =>
    r.status === 'fulfilled'
      ? r.value
      : { data: null, status: 'ERROR' as DataSourceStatus, source: 'unknown', error: String(r.reason), fetchedAtMs: Date.now() },
  );
}
