-- Sovereign Intelligence Terminal Database Schema
-- Creates the core tables for the unified macro-geopolitical risk radar

-- 1. Intelligence Ingestion Stream
-- Stores all incoming data from external APIs (FRED, EIA, BIS, ACLED, GDELT, CoinGecko)
CREATE TABLE IF NOT EXISTS sovereign_intelligence_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 2. Market Pulse Table
-- Stores real-time crypto market data (BTC price, volatility, dominance)
CREATE TABLE IF NOT EXISTS sovereign_market_pulse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL,
  price DOUBLE PRECISION,
  volatility DOUBLE PRECISION,
  dominance DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- 3. Sovereign Risk Signals Table
-- Stores calculated SRI scores and triggered signals
CREATE TABLE IF NOT EXISTS sovereign_risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sri_score NUMERIC,
  sri_signal TEXT,
  signal_confidence NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_stream_timestamp 
ON sovereign_intelligence_stream(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_market_timestamp 
ON sovereign_market_pulse(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_risk_created 
ON sovereign_risk_signals(created_at DESC);

-- Additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_stream_source 
ON sovereign_intelligence_stream(source);

CREATE INDEX IF NOT EXISTS idx_stream_metric 
ON sovereign_intelligence_stream(metric_name);

CREATE INDEX IF NOT EXISTS idx_market_asset 
ON sovereign_market_pulse(asset_id);

-- Enable Row Level Security
ALTER TABLE sovereign_intelligence_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE sovereign_market_pulse ENABLE ROW LEVEL SECURITY;
ALTER TABLE sovereign_risk_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public SELECT only (server workers INSERT via service role)
CREATE POLICY "Allow public read on intelligence stream" 
ON sovereign_intelligence_stream FOR SELECT 
USING (true);

CREATE POLICY "Allow public read on market pulse" 
ON sovereign_market_pulse FOR SELECT 
USING (true);

CREATE POLICY "Allow public read on risk signals" 
ON sovereign_risk_signals FOR SELECT 
USING (true);

-- Service role can INSERT (for server-side workers)
CREATE POLICY "Service role can insert intelligence stream" 
ON sovereign_intelligence_stream FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can insert market pulse" 
ON sovereign_market_pulse FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can insert risk signals" 
ON sovereign_risk_signals FOR INSERT 
WITH CHECK (true);
