-- ============================================================================
-- Build v102: Macro-Nervous System Integration
-- Create macro_metrics table for FRED data caching
-- ============================================================================

-- Create the macro_metrics table for storing FRED series data
CREATE TABLE IF NOT EXISTS macro_metrics (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  value DECIMAL(18, 8) NOT NULL,
  status TEXT DEFAULT 'LIVE' CHECK (status IN ('LIVE', 'STALE_DATA', 'FALLBACK')),
  source TEXT DEFAULT 'FRED' CHECK (source IN ('FRED', 'SUPABASE', 'MEMORY', 'SEED', 'API', 'alternative.me')),
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by symbol
CREATE INDEX IF NOT EXISTS idx_macro_metrics_symbol ON macro_metrics(symbol);
CREATE INDEX IF NOT EXISTS idx_macro_metrics_fetched_at ON macro_metrics(fetched_at DESC);

-- Add comment documenting the table
COMMENT ON TABLE macro_metrics IS 'Cached macro indicators from FRED, alternative.me, and other sources. Used as fallback when live APIs are unavailable.';
COMMENT ON COLUMN macro_metrics.symbol IS 'FRED series ID (e.g., DGS10, WM2NS, ECBMAINREF) or custom identifier (e.g., FEAR_GREED)';
COMMENT ON COLUMN macro_metrics.value IS 'Metric value with 8 decimal places for precision';
COMMENT ON COLUMN macro_metrics.status IS 'LIVE (fresh), STALE_DATA (older than 1 hour), FALLBACK (seed value)';
COMMENT ON COLUMN macro_metrics.source IS 'Where the value came from - FRED API, Supabase cache, or alternative.me';

-- Seed initial values for critical metrics (last known good prints as of March 2026)
INSERT INTO macro_metrics (symbol, value, status, source, fetched_at)
VALUES
  ('DGS10', 4.28, 'FALLBACK', 'SEED', NOW()),
  ('DGS2', 4.12, 'FALLBACK', 'SEED', NOW()),
  ('WM2NS', 21200, 'FALLBACK', 'SEED', NOW()),
  ('ECBMAINREF', 3.75, 'FALLBACK', 'SEED', NOW()),
  ('INTDSRJPM193N', -0.10, 'FALLBACK', 'SEED', NOW()),
  ('LI0201GYM186S', 102.5, 'FALLBACK', 'SEED', NOW()),
  ('FEAR_GREED', 52, 'FALLBACK', 'SEED', NOW())
ON CONFLICT (symbol) DO UPDATE SET
  updated_at = NOW();

-- ============================================================================
-- Build v102: Enhanced market_snapshots for infrastructure tracking
-- ============================================================================

-- Ensure market_snapshots table exists with data_sources_ok column
-- (Exists from earlier migrations; adding column if missing)
ALTER TABLE IF EXISTS market_snapshots
ADD COLUMN IF NOT EXISTS data_sources_ok BOOLEAN DEFAULT true;

ALTER TABLE IF EXISTS market_snapshots
ADD COLUMN IF NOT EXISTS last_macro_sync TIMESTAMPTZ;

-- Index for quick status queries
CREATE INDEX IF NOT EXISTS idx_market_snapshots_regime ON market_snapshots(regime);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_data_ok ON market_snapshots(data_sources_ok);
