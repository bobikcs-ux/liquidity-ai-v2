'use client';

import React from 'react';
import { EnergyFinanceDashboard } from '../components/EnergyFinanceDashboard';
import { ErrorBoundaryWrapper } from '../components/ErrorBoundary';

export function EnergyFinance() {
  return (
    <ErrorBoundaryWrapper componentName="EnergyFinanceDashboard">
      <EnergyFinanceDashboard />
    </ErrorBoundaryWrapper>
  );
}

export default EnergyFinance;
