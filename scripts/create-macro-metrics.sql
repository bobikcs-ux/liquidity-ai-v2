-- Build v102: Macro-Nervous System Integration
-- Creates the macro_metrics table for FRED DGS10, WM2NS, and Fear/Greed caching
-- This acts as a Supabase fallback layer when FRED API is offline or rate-limited

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS macro_metrics;

-- Create macro_metrics table
CREATE TABLE macro_metrics (
  id          BIGSERIAL PRIMARY KEY,
  symbol      TEXT        NOT NULL,           -- e.g. 'DGS10', 'WM2NS', 'FEAR_GREED'
  value       DECIMAL(18, 6) NOT NULL,        -- numeric value
  status      TEXT        NOT NULL DEFAULT 'LIVE',   -- 'LIVE' | 'STALE_DATA' | 'FALLBACK'
  source      TEXT        NOT NULL DEFAULT 'FRED',   -- 'FRED' | 'ALTERNATIVE_ME' | 'FALLBACK'
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- when this value was fetched from API
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- row creation time
  UNIQUE (symbol)   -- one row per symbol, upserted on every successful fetch
);

-- Indexes for fast lookup
CREATE INDEX idx_macro_metrics_symbol     ON macro_metrics (symbol);
CREATE INDEX idx_macro_metrics_fetched_at ON macro_metrics (fetched_at DESC);

-- Seed with known fallback values so the table is never empty
INSERT INTO macro_metrics (symbol, value, status, source)
VALUES
  ('DGS10',      4.28,  'FALLBACK', 'SEED'),
  ('WM2NS',      21200, 'FALLBACK', 'SEED'),
  ('FEAR_GREED', 52,    'FALLBACK', 'SEED')
ON CONFLICT (symbol) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE macro_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: allow anonymous reads (public dashboard)
CREATE POLICY "macro_metrics_anon_read"
  ON macro_metrics FOR SELECT
  TO anon
  USING (true);

-- Policy: allow authenticated writes (server-side upserts)
CREATE POLICY "macro_metrics_auth_write"
  ON macro_metrics FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: allow service role full access
CREATE POLICY "macro_metrics_service_role"
  ON macro_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
