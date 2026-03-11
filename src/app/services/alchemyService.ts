/**
 * ALCHEMY SERVICE
 * 
 * Fetches on-chain metrics via the Alchemy API:
 * - ETH gas price (current gwei)
 * - Network activity score (derived from recent block data)
 * - BTC hashrate (via public mempool.space API, no key required)
 * 
 * On-chain metrics supplement the market + macro data for Black Swan risk.
 */

import { gatewayFetch } from '../lib/apiGateway';
import type { OnChainMetrics } from '../types/terminal';
import { TERMINAL_STATE_DEFAULTS } from '../types/terminal';

// ============================================================================
// TYPES
// ============================================================================

interface AlchemyGasResponse {
  result: string; // hex string of gas price in wei
}

interface MempoolHashrate {
  currentHashrate: number; // H/s
  difficulty: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function getApiKey(): string {
  const key = import.meta.env.VITE_ALCHEMY_API_KEY;
  return key && key.trim() ? key.trim() : '';
}

function hexToGwei(hex: string): number {
  const wei = parseInt(hex, 16);
  return Math.round(wei / 1e9); // wei → gwei
}

const SEEDS = TERMINAL_STATE_DEFAULTS.onChain;

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Fetch current ETH gas price in Gwei via server proxy.
 */
export async function fetchEthGasPrice(): Promise<number | null> {
  try {
    const resp = await gatewayFetch<{ status: string; value: number; reason?: string }>(
      '/api/blockchain/gas',
      {
        apiName: 'alchemy',
        cacheKey: 'alchemy-gas-proxy',
        cacheTtlMs: 60_000, // 1 minute (gas changes frequently)
      },
    );

    if (resp.data?.value && typeof resp.data.value === 'number') {
      return resp.data.value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch BTC network hashrate from mempool.space (no API key required).
 * Returns hashrate in TH/s.
 */
export async function fetchBtcHashRate(): Promise<number | null> {
  interface MempoolHashrateResp {
    currentHashrate: number;
  }

  const resp = await gatewayFetch<MempoolHashrateResp>(
    'https://mempool.space/api/v1/mining/hashrate/3d',
    { apiName: 'alchemy', cacheKey: 'mempool-hashrate', cacheTtlMs: 10 * 60_000 },
  );

  if (resp.data?.currentHashrate && resp.data.currentHashrate > 0) {
    return Math.round(resp.data.currentHashrate / 1e12); // H/s → TH/s
  }
  return null;
}

/**
 * Aggregate on-chain metrics with graceful fallbacks to seed data.
 */
export async function fetchOnChainMetrics(): Promise<OnChainMetrics> {
  const [gasResult, hashResult] = await Promise.allSettled([
    fetchEthGasPrice(),
    fetchBtcHashRate(),
  ]);

  const gas = gasResult.status === 'fulfilled' ? gasResult.value : null;
  const hash = hashResult.status === 'fulfilled' ? hashResult.value : null;

  // Network activity score: rough proxy from gas price
  // Low gas (<10 gwei) = low activity; high gas (>100 gwei) = high activity
  const gasGwei = gas ?? SEEDS.ethGasGwei;
  const networkActivityScore = Math.min(100, Math.round((gasGwei / 80) * 100));

  return {
    ethGasGwei: gasGwei,
    networkActivityScore,
    whaleMovementScore: SEEDS.whaleMovementScore, // future: use Alchemy Token API
    btcHashRate: hash ?? SEEDS.btcHashRate,
  };
}
