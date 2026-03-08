'use client';

import { RefreshCw } from 'lucide-react';
import { usePrices } from '../hooks/usePrices';

const PRODUCT_CODES = ['T63', 'T76', 'T81', 'T94', 'T95'];

function formatPrice(price: number, currency: string): string {
  if (price === 0) return 'Pending';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(price);
}

function formatAge(updatedAt: string): string {
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export function ProductPricesPanel() {
  const { prices, loading, error, lastFetch, refresh } = usePrices(PRODUCT_CODES);

  const lastFetchTime = lastFetch
    ? lastFetch.toLocaleTimeString('en-US', { hour12: false })
    : '--:--:--';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div
        className="flex items-center justify-between pb-3"
        style={{ borderBottom: '1px solid rgba(101,162,158,0.3)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: error ? '#ef4444' : loading ? '#f59e0b' : '#22c55e',
              boxShadow: error
                ? '0 0 6px #ef4444'
                : loading
                ? '0 0 6px #f59e0b'
                : '0 0 6px #22c55e',
            }}
          />
          <span
            className="text-xs font-mono font-bold tracking-widest"
            style={{ color: '#66fcf1' }}
          >
            PRODUCT PRICES
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-1.5 rounded hover:opacity-70 transition-opacity disabled:opacity-40"
          style={{ color: '#66fcf1' }}
          title="Refresh prices"
          aria-label="Refresh product prices"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div
          className="text-xs font-mono px-3 py-2 rounded"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
        >
          {error}
        </div>
      )}

      {/* Price rows */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(101,162,158,0.2)' }}
      >
        {loading && prices.length === 0 ? (
          // Skeleton rows
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center px-4 py-3"
              style={{
                borderBottom: i < 4 ? '1px solid rgba(101,162,158,0.1)' : undefined,
                background: i % 2 === 0 ? 'rgba(11,12,16,0.5)' : 'rgba(11,12,16,0.3)',
              }}
            >
              <div
                className="h-3 w-8 rounded animate-pulse"
                style={{ background: 'rgba(101,162,158,0.2)' }}
              />
              <div
                className="h-3 w-20 rounded animate-pulse"
                style={{ background: 'rgba(101,162,158,0.2)' }}
              />
            </div>
          ))
        ) : prices.length === 0 ? (
          <div
            className="px-4 py-6 text-center text-xs font-mono"
            style={{ color: '#8b8b8b' }}
          >
            No price data available
          </div>
        ) : (
          prices.map((p, i) => (
            <div
              key={p.product_code}
              className="flex justify-between items-center px-4 py-3"
              style={{
                borderBottom:
                  i < prices.length - 1 ? '1px solid rgba(101,162,158,0.1)' : undefined,
                background: i % 2 === 0 ? 'rgba(11,12,16,0.5)' : 'rgba(11,12,16,0.3)',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: '#66fcf1', minWidth: '2.5rem' }}
                >
                  {p.product_code}
                </span>
                <span className="text-[10px] font-mono" style={{ color: '#45a29e' }}>
                  {p.source}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-sm font-mono font-bold"
                  style={{ color: p.price === 0 ? '#8b8b8b' : '#f1c40f' }}
                >
                  {formatPrice(p.price, p.currency)}
                </span>
                <span className="text-[10px] font-mono" style={{ color: '#8b8b8b' }}>
                  {formatAge(p.updated_at)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between text-[10px] font-mono" style={{ color: '#8b8b8b' }}>
        <span>{prices.length} products</span>
        <span>Last sync: {lastFetchTime}</span>
      </div>
    </div>
  );
}
