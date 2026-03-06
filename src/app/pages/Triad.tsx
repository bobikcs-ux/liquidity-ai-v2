'use client';

import { TriadDashboard } from '../components/TriadDashboard';
import { ErrorBoundaryWrapper } from '../components/ErrorBoundary';

export function Triad() {
  return (
    <ErrorBoundaryWrapper componentName="TriadDashboard">
      <TriadDashboard />
    </ErrorBoundaryWrapper>
  );
}

export default Triad;
