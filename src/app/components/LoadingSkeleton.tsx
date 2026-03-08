'use client';

import React from 'react';

interface LoadingSkeletonProps {
  height?: string;
  width?: string;
  variant?: 'line' | 'chart' | 'card' | 'metric';
  count?: number;
}

export function LoadingSkeleton({
  height = 'h-6',
  width = 'w-full',
  variant = 'line',
  count = 1,
}: LoadingSkeletonProps) {
  const getSkeletonClass = () => {
    switch (variant) {
      case 'chart':
        return `${width} h-48 bg-gradient-to-r from-[#121218] via-[#1a1a22] to-[#121218] animate-pulse rounded`;
      case 'card':
        return `${width} h-32 bg-gradient-to-r from-[#121218] via-[#1a1a22] to-[#121218] animate-pulse rounded-lg border border-[#d4af37]/10`;
      case 'metric':
        return `${width} h-16 bg-gradient-to-r from-[#121218] via-[#1a1a22] to-[#121218] animate-pulse rounded`;
      case 'line':
      default:
        return `${width} ${height} bg-gradient-to-r from-[#121218] via-[#1a1a22] to-[#121218] animate-pulse rounded`;
    }
  };

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={getSkeletonClass()} />
      ))}
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <LoadingSkeleton variant="line" height="h-8" width="w-48" />
        <LoadingSkeleton variant="line" height="h-4" width="w-96" count={2} />
      </div>

      {/* Alert banner skeleton */}
      <LoadingSkeleton variant="card" />

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="metric" />
        ))}
      </div>

      {/* Chart skeleton */}
      <LoadingSkeleton variant="chart" />

      {/* Table rows skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="line" height="h-12" />
        ))}
      </div>
    </div>
  );
}

export default LoadingSkeleton;
