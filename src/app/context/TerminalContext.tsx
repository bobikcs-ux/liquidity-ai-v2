/**
 * Terminal Context (Alias for AppContext)
 * 
 * Provides access to the global TerminalState containing all live data from:
 * - FRED (US macro: DGS10, FEDFUNDS, CPIAUCSL, UNRATE)
 * - Regional macro (ECBDFR, IRSTCI01JPM156N, IRSTCI01AUM156N, etc.)
 * - CoinGecko (BTC, ETH prices + top 20 heatmap)
 * - Finnhub (Oil, Gold)
 * - EIA (Energy inventory)
 * - Alchemy (ETH gas, blocks)
 * - Fear & Greed Index
 * - NewsAPI + WorldNewsAPI (geopolitics)
 * - ACLED (conflict data)
 */

export { AppContextProvider as TerminalProvider, useAppContext as useTerminal } from './AppContext';
export type { AppContextValue as TerminalContextValue } from './AppContext';
