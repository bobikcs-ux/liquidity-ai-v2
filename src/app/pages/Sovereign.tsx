'use client';

/**
 * Sovereign Intelligence Terminal Page
 * Premium risk intelligence dashboard
 */

import React from 'react';
import { SovereignTerminal } from '../components/SovereignTerminal';
import { GlobalCapitalFlightDetector } from '../components/GlobalCapitalFlightDetector';
import { InfrastructureStatusBar } from '../components/InfrastructureStatusBar';
import { ErrorBoundaryWrapper } from '../components/ErrorBoundary';

export function Sovereign() {
  return (
    <ErrorBoundaryWrapper componentName="SovereignTerminal">
      <InfrastructureStatusBar refreshInterval={30000} />
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <GlobalCapitalFlightDetector />
      </div>
      <SovereignTerminal />
    </ErrorBoundaryWrapper>
  );
}

export default Sovereign;
