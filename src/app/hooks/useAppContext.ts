/**
 * useAppContext — Consumer hook for the AppContext provider.
 * 
 * Re-exports the hook from AppContext.tsx plus convenience selectors
 * for the most common use cases across pages.
 */

export { useAppContext } from '../context/AppContext';

import { useAppContext } from '../context/AppContext';
import type { TerminalState } from '../types/terminal';

// ============================================================================
// CONVENIENCE SELECTORS
// ============================================================================

/** Returns only the prices sub-state for components that only need price data. */
export function usePriceState(): TerminalState['prices'] {
  const { state } = useAppContext();
  return state.prices;
}

/** Returns only the macro sub-state. */
export function useMacroState(): TerminalState['macro'] {
  const { state } = useAppContext();
  return state.macro;
}

/** Returns only the sentiment sub-state (risk metrics, F&G index, regime). */
export function useSentimentState(): TerminalState['sentiment'] {
  const { state } = useAppContext();
  return state.sentiment;
}

/** Returns only the energy sub-state. */
export function useEnergyState(): TerminalState['energy'] {
  const { state } = useAppContext();
  return state.energy;
}

/** Returns only the geopolitics sub-state (alerts, conflict index). */
export function useGeopoliticsState(): TerminalState['geopolitics'] {
  const { state } = useAppContext();
  return state.geopolitics;
}

/** Returns only the on-chain sub-state. */
export function useOnChainState(): TerminalState['onChain'] {
  const { state } = useAppContext();
  return state.onChain;
}

/** Returns only the FX sub-state. */
export function useFXState(): TerminalState['fx'] {
  const { state } = useAppContext();
  return state.fx;
}

/** Returns source statuses and overall health. */
export function useDataSourceHealth(): {
  sources: TerminalState['sources'];
  overallStatus: TerminalState['overallStatus'];
  lastSyncMs: number;
} {
  const { state } = useAppContext();
  return {
    sources: state.sources,
    overallStatus: state.overallStatus,
    lastSyncMs: state.lastSyncMs,
  };
}
