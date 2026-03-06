'use client';

/**
 * Sovereign Intelligence Terminal Page
 * Premium risk intelligence dashboard
 */

import React from 'react';
import { SovereignTerminal } from '../components/SovereignTerminal';
import { ErrorBoundaryWrapper } from '../components/ErrorBoundary';

export function Sovereign() {
  return (
    <ErrorBoundaryWrapper componentName="SovereignTerminal">
      <SovereignTerminal />
    </ErrorBoundaryWrapper>
  );
}

export default Sovereign;
