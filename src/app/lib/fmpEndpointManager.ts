/**
 * Shared API endpoint management for FMP
 * Coordinates between InfrastructureStatusBar (probe) and energyFinanceService (fetcher)
 * This is a pure service module - no React or 'use client' needed
 */

// Session-level flag: switches to legacy /api/v3 if /stable/ returns "Legacy Endpoint"
let FMP_USE_STABLE_ENDPOINT = true;

export function checkForLegacyEndpoint(responseText: string): void {
  if (responseText.includes('Legacy Endpoint') && FMP_USE_STABLE_ENDPOINT) {
    console.log('[v0] FMP detected "Legacy Endpoint" response. Switching to /api/v3 for this session.');
    FMP_USE_STABLE_ENDPOINT = false;
  }
}

export function getFMPBaseUrl(): string {
  if (FMP_USE_STABLE_ENDPOINT) {
    return 'https://financialmodelingprep.com/stable';
  }
  return 'https://financialmodelingprep.com/api/v3';
}

export function getFMPProbeUrl(apiKey: string): string {
  if (FMP_USE_STABLE_ENDPOINT) {
    return `https://financialmodelingprep.com/stable/search-symbol?query=CLUSD&apikey=${apiKey}`;
  }
  return `https://financialmodelingprep.com/api/v3/quote/CLUSD?apikey=${apiKey}`;
}
