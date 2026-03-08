import React from 'react';

export function MetricSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
      <div className="h-8 bg-gray-100 rounded w-32 animate-pulse" />
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
      </div>

      {/* Cards skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg p-4 bg-gray-50 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
            <div className="h-10 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
