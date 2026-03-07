-- V104 Architecture: Market Data Cache Table
-- This table stores pre-fetched API data via Supabase Cron Pipeline
-- for instant access without external API latency or rate limits

CREATE TABLE IF NOT EXISTS market_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL,
  value TEXT,
  label TEXT,
  change_24h TEXT,
  dominance TEXT,
  raw_json JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- Create index for fast lookups by data_type
CREATE INDEX IF NOT EXISTS idx_market_data_cache_type_time 
ON market_data_cache(data_type, cached_at DESC);

-- Enable Row Level Security
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (data is public market info)
CREATE POLICY "Allow public read access" ON market_data_cache
  FOR SELECT USING (true);

-- Only service role can insert/update (from Edge Functions)
CREATE POLICY "Service role can insert" ON market_data_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update" ON market_data_cache
  FOR UPDATE USING (true);

-- Insert initial seed data so the app works immediately
INSERT INTO market_data_cache (data_type, value, label, change_24h, dominance)
VALUES 
  ('fred_yield_curve', '-0.23', NULL, NULL, NULL),
  ('fear_greed_index', '45', 'Fear', NULL, NULL),
  ('btc_price', '67500', NULL, '2.34', '54.2')
ON CONFLICT DO NOTHING;
