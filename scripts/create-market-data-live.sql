-- Create market_data_live table for Edge Function to populate
-- This table is the SOLE source of truth for AppContext

CREATE TABLE IF NOT EXISTS market_data_live (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(50) UNIQUE NOT NULL,
  value DECIMAL(20, 6) NOT NULL,
  source VARCHAR(50) NOT NULL DEFAULT 'unknown',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_market_data_live_metric ON market_data_live(metric_name);
CREATE INDEX IF NOT EXISTS idx_market_data_live_updated ON market_data_live(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE market_data_live ENABLE ROW LEVEL SECURITY;

-- Allow public read access (data is not sensitive)
CREATE POLICY IF NOT EXISTS "Allow public read" ON market_data_live
  FOR SELECT TO public USING (true);

-- Allow service role to write
CREATE POLICY IF NOT EXISTS "Allow service write" ON market_data_live
  FOR ALL TO service_role USING (true);

-- Insert seed data so the table is never empty
INSERT INTO market_data_live (metric_name, value, source) VALUES
  ('DGS10', 4.25, 'SEED'),
  ('DGS2', 4.15, 'SEED'),
  ('WM2NS', 21000, 'SEED'),
  ('FEDFUNDS', 5.33, 'SEED'),
  ('ECBDFR', 4.0, 'SEED'),
  ('IRSTCI01JPM156N', -0.1, 'SEED'),
  ('BTC_USD', 67500, 'SEED'),
  ('ETH_USD', 3450, 'SEED'),
  ('BTC_DOMINANCE', 54.5, 'SEED'),
  ('WTI_CRUDE', 78.5, 'SEED'),
  ('BRENT_CRUDE', 82.3, 'SEED'),
  ('EURUSD', 1.085, 'SEED'),
  ('GBPUSD', 1.265, 'SEED'),
  ('USDJPY', 150.5, 'SEED'),
  ('USDCHF', 0.88, 'SEED'),
  ('AUDUSD', 0.655, 'SEED')
ON CONFLICT (metric_name) DO NOTHING;

-- Grant permissions
GRANT SELECT ON market_data_live TO anon;
GRANT SELECT ON market_data_live TO authenticated;
GRANT ALL ON market_data_live TO service_role;
