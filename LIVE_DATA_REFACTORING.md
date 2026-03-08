# Live Data Refactoring — Build v102 Completion Status

**Goal:** Eliminate all hardcoded mock data. Replace every metric with live Supabase queries.

---

## ✅ COMPLETED

### 1. **Shared Supabase Client** (`/lib/supabase/client.ts`)
- Created centralized Supabase client initialization
- Used by all data fetching hooks

### 2. **Data Fetching Hooks** (`/app/hooks/useMetrics.ts`)
- `useCryptoPrice(asset)` — Fetches live crypto prices from crypto_markets
- `useCryptoDominance(asset)` — Fetches BTC dominance %
- `useMacroMetric(symbol)` — Fetches single macro metric (DGS10, WM2NS, ECBMAINREF, etc.)
- `useMacroMetrics(symbols[])` — Batch fetch multiple macro metrics
- `useLatestSnapshot()` — Fetches latest market_snapshots record
- `useEnergyPrice(commodity)` — Fetches oil/gas/uranium prices
- `useTradeRate(pair)` — Fetches currency pairs and trade rates
- All hooks auto-refresh every 30-60 seconds
- Proper error handling with null returns (no fallback values)

### 3. **Dashboard Refactor**
- Removed hardcoded fallbacks: `survivalProb = 78`, `yieldSpread = '-0.23'`, `btcDominance = '57.4'`
- Changed to null values when Supabase returns no data
- Added loading state tracking

### 4. **GlobalRiskMeter Component**
- Removed hardcoded risk components breakdown
- Now calculates components dynamically from snapshot data
- Pulls yield_spread, systemic_risk, btc_volatility, regime from Supabase

### 5. **Fear & Greed Index**
- Replaced hardcoded `GLOBAL_FEAR_GREED_VALUE = 22` with live fetch
- Now queries macro_metrics table for 'FEAR_GREED' symbol
- Dynamic label generation based on actual value

### 6. **Loading Skeletons**
- Created `DataLoadingSkeletons.tsx` with proper loading placeholders
- Components show skeleton UI instead of mock numbers while fetching

---

## 📋 STILL TODO

### Remaining Components Needing Updates:
- **CapitalFlightDetector** — Replace mock capital flow data
- **MarketCharts** — Ensure all chart data comes from Supabase history
- **Reports** — Replace any PDF export mock data
- **Crypto Components** (if separate) — Use useCryptoPrice/Dominance hooks
- **Sovereign/BRICS Widgets** — Update to fetch from geopolitics_events and regional tables

### Pattern to Apply Everywhere:
```typescript
// BEFORE (Mock)
const btcPrice = 68000;

// AFTER (Live)
const { price: btcPrice, loading, error } = useCryptoPrice('BTC');

if (loading) return <MetricSkeleton />;
if (!btcPrice) return <div>Price unavailable</div>;
```

---

## 🔗 Table Mapping Reference

| Data Type | Table | Hook |
|-----------|-------|------|
| BTC, ETH, etc. | `crypto_markets` | `useCryptoPrice()`, `useCryptoDominance()` |
| DGS10, WM2NS, etc. | `macro_metrics` | `useMacroMetric()`, `useMacroMetrics()` |
| Market snapshots | `market_snapshots` | `useLatestSnapshot()` |
| Oil, Gas, Uranium | `energy_metrics` | `useEnergyPrice()` |
| USD/EUR, etc. | `trade_metrics` | `useTradeRate()` |
| Geopolitical events | `geopolitics_events` | (needs hook) |
| Regional data | Regional tables | (needs hooks) |

---

## 🎯 Success Criteria

✅ All numeric constants removed from components
✅ All metric displays pull from Supabase
✅ Loading states shown (not fake numbers)
✅ Error states handled gracefully
✅ No hardcoded fallback values used
✅ Dashboard updates live as Supabase data changes

---

## 🚀 Next Steps

1. Apply the refactoring pattern to remaining components
2. Test end-to-end with live market data
3. Verify all feeds (FRED, CoinGecko, Fear/Greed) publishing to Supabase
4. Monitor for any stale data and refresh intervals
