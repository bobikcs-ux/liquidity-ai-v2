'use client';

import React from 'react';
import { EnergyFinanceDashboard } from '../components/EnergyFinanceDashboard';
import { ErrorBoundaryWrapper } from '../components/ErrorBoundary';
import { InfrastructureStatusBar } from '../components/InfrastructureStatusBar';

export function EnergyFinance() {
  return (
    <ErrorBoundaryWrapper componentName="EnergyFinanceDashboard">
      <InfrastructureStatusBar refreshInterval={30000} />
      <EnergyFinanceDashboard />
    </ErrorBoundaryWrapper>
  );
}

export default EnergyFinance;
