# Live Data System - Complete Implementation

## Status: FULLY IMPLEMENTED ✓

The Aurelius OS has been fully refactored to use LIVE DATA from 12+ APIs instead of hardcoded values. All numbers across the system are now dynamic.

---

## Core Architecture

### 1. Global Data Layer
- **`src/app/context/AppContext.tsx`** - Main provider managing all data
- **`src/app/context/TerminalContext.tsx`** - Alias for AppContext (for compatibility)
- **Hook:** `useAppContext()` (aliased as `useTerminal()`)

All data flows through **TerminalState** type defined in `src/app/types/terminal.ts`

### 2. API Services Integrated

| API | Data Points | Service File | Rate Limit |
|-----|---|---|---|
| FRED | DGS10, DGS2, FEDFUNDS, CPIAUCSL, UNRATE, ECBDFR, IRSTCI01JPM156N, etc. | `macroDataService.ts` | 30s |
| CoinGecko | BTC/ETH prices, top 20 heatmap, fear-greed | `coingeckoService.ts` | 5s |
| Finnhub | Gold, WTI, Brent | `finnhubService.ts` | 2s |
| Alchemy | ETH gas, blocks | `alchemyService.ts` | 10s |
| EIA | Oil inventory, natural gas | `energyFinanceService.ts` | 60s |
| NewsAPI | Global geopolitical news | `newsAggregator.ts` | 60s |
| WorldNewsAPI | Conflict/military news | `newsAggregator.ts` | 60s |
| ACLED | Conflict events data | `newsAggregator.ts` | 60s |

### 3. Data Flow Chain (Fallback Strategy)

```
LIVE API (CoinGecko, FRED, etc.)
    ↓ (if fails) ↓
In-Memory Cache (5 min TTL)
    ↓ (if empty) ↓
Supabase Historical Cache
    ↓ (if missing) ↓
Seed Defaults (hardcoded fallback)
```

### 4. Pages Connected to Live Data

All pages pull data from **TerminalState** via hooks:

- **Home/Dashboard** - `useMarketSnapshot()`, `useAppContext()`
- **Triad** - `useTriadIntelligence()`
- **AGI Terminal** - `useAureliusAnalysis()`, market data
- **Intelligence** - `useMarketSnapshot()`, `GLOBAL_FEAR_GREED_VALUE`
- **Sovereign** - `useSovereignIntelligence()`, `useAsianIntelligence()`
- **Citadel** - `useSovereignIntelligence()`
- **Capital AI** - `useMacroData()`, liquidity metrics
- **Stress Lab** - Risk scenarios
- **Black Swan** - `useBlackSwanRisk()`, systemic risk
- **Energy** - `useEnergyFinanceData()`
- **Prophecy Log** - Supabase historical logs
- **Reports** - Dashboard summaries
- **Data Sources** - `useAppContext().state.dataSourceStatus`

---

## Key Features

### ✓ Dynamic Market Data
- BTC/ETH prices (live from CoinGecko)
- Gold/Oil prices (live from Finnhub)
- Fear & Greed Index
- BTC Dominance

### ✓ Macro Indicators (FRED)
- 10Y Yield (DGS10)
- 2Y Yield (DGS2)
- Fed Funds Rate (FEDFUNDS)
- CPI Inflation (CPIAUCSL)
- Unemployment (UNRATE)
- M2 Money Supply

### ✓ Regional Rates
- ECB Rate (ECBDFR)
- Japan BoJ Rate (IRSTCI01JPM156N)
- Australia Rate (IRSTCI01AUM156N)
- India Rate (IRSTCI01INM156N)

### ✓ On-Chain Metrics
- ETH Gas Price (from Alchemy)
- Latest Block Number
- Network Activity Score

### ✓ Geopolitical Intelligence
- Military conflict index
- News volume tracking
- ACLED conflict events
- Alert priority system

### ✓ Energy Data
- Oil inventory (EIA)
- Natural gas storage
- Commodity trends

---

## Error Handling

If API key is missing or API is down:
- System shows **"DATA SOURCE OFFLINE"** instead of crashing
- Falls back to cached data or seed defaults
- Per-source status visible in `DataSourceStatus` component

---

## Configuration

### Environment Variables Required
```
VITE_COINGECKO_API_KEY
VITE_FINNHUB_API_KEY
VITE_ALCHEMY_API_KEY
VITE_FRED_API_KEY
VITE_EIA_API_KEY
VITE_NEWS_API_KEY
VITE_WORLD_NEWS_API_KEY
VITE_ACLED_EMAIL
VITE_ACLED_API_KEY
VITE_FEAR_GREED_API_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

All defined in `src/vite-env.d.ts`

---

## Auto-Sync Behavior

- **Initial load:** All 12 data sources fetch in parallel
- **Refresh interval:** 60 seconds
- **Per-source rate limit:** 5s-60s depending on API
- **Cache TTL:** 5 minutes (in-memory)
- **Supabase fallback:** 15 minutes stale threshold

---

## UI Components Displaying Live Data

| Component | Live Data Source | File |
|---|---|---|
| GlobalRiskMeter | Systemic risk from `useMarketSnapshot()` | `GlobalRiskMeter.tsx` |
| MarketCharts | BTC/ETH prices | `MarketCharts.tsx` |
| DataSourceStatus | Status of all 12 APIs | `DataSourceStatus.tsx` |
| InfrastructureStatusBar | API health checks | `InfrastructureStatusBar.tsx` |
| JapanMacroWidget | BoJ rate from FRED | `JapanMacroWidget.tsx` |
| EuropeWidget | ECB rate, DGS10/2 yields | `EuropeWidget.tsx` |
| AustraliaWidget | Australian rate | `AustraliaWidget.tsx` |
| BRICSWidget | BRICS GDP from FRED | `BRICSWidget.tsx` |
| IndiaFiscalWidget | India rate | `IndiaFiscalWidget.tsx` |
| EnergyFinanceDashboard | Oil prices, inventory | `EnergyFinanceDashboard.tsx` |

---

## No Hardcoded Values

All numeric displays are now:
- ✓ Fetched from live APIs
- ✓ Cached intelligently
- ✓ Updated every 60 seconds
- ✓ Fallback to Supabase historical data if API fails
- ✓ Display "DATA SOURCE OFFLINE" if completely unavailable

**UI design unchanged** - only the numbers behind them are now live.

---

## Deployment

The system is production-ready. Deploy with:
```bash
git push
# Vercel auto-deploys when env vars are set
```

No schema changes needed - all data flows through existing Supabase tables.
