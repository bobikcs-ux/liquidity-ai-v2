'use client';

import React, { Suspense } from 'react';
import { SovereignIntelligenceNode } from '../components/SovereignIntelligenceNode';
import { GlobalCapitalFlightDetector } from '../components/GlobalCapitalFlightDetector';
import { InfrastructureStatusBar } from '../components/InfrastructureStatusBar';
import { ErrorBoundaryWrapper } from '../components/ErrorBoundary';

/**
 * SOVEREIGN PAGE - Resilience Optimized
 */
export function Sovereign() {
  return (
    <div className="min-h-screen bg-[#05070a] text-gray-100 selection:bg-cyan-500/30">
      <ErrorBoundaryWrapper componentName="InfrastructureStatus">
        <InfrastructureStatusBar refreshInterval={30000} />
      </ErrorBoundaryWrapper>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Capital Flight Section - Wrapped for safety */}
        <ErrorBoundaryWrapper componentName="CapitalFlightDetector">
          <Suspense fallback={<div className="h-48 animate-pulse bg-gray-900/50 rounded-xl" />}>
            <GlobalCapitalFlightDetector />
          </Suspense>
        </ErrorBoundaryWrapper>

        {/* Main Intelligence Node */}
        <ErrorBoundaryWrapper componentName="SovereignIntelligenceNode">
          <SovereignIntelligenceNode />
        </ErrorBoundaryWrapper>
      </main>
    </div>
  );
}

export default Sovereign;