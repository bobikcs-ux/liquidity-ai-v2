'use client';

import React from 'react';
import { EnergyFinanceDashboard } from '../components/EnergyFinanceDashboard';

export function EnergyFinance() {
  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px]">
      <EnergyFinanceDashboard />
    </div>
  );
}

export default EnergyFinance;
