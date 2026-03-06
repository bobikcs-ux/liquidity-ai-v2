'use client';

import React from 'react';
import { EnergyFinanceDashboard } from '../components/EnergyFinanceDashboard';
import { ErrorBoundaryWrapper } from '../components/ErrorBoundary';

export function EnergyFinance() {
  return (
    <ErrorBoundaryWrapper componentName="EnergyFinanceDashboard">
      <div className="h-[calc(100vh-200px)] min-h-[600px]">
        <EnergyFinanceDashboard />
      </div>
    </ErrorBoundaryWrapper>
  );
}

export default EnergyFinance;
