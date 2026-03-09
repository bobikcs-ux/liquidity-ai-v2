-- Europe & Australia Macro Intelligence Schema
-- Supports Eurostat and ABS API data storage

-- Macro Snapshots Table (Global)
CREATE TABLE IF NOT EXISTS macro_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL, -- 'EU', 'AU', 'US', 'JP', 'IN', 'BRICS'
  indicator TEXT NOT NULL, -- 'debt_gdp', 'gdp_growth', 'unemployment', 'inflation', 'cpi'
  country_code TEXT, -- 'DE', 'FR', 'IT', 'AU', etc.
  value NUMERIC NOT NULL,
  previous_value NUMERIC,
  change_pct NUMERIC,
  timestamp TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL, -- 'eurostat', 'abs', 'fred', 'estat'
  dataset_id TEXT, -- Original dataset identifier
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_macro_snapshots_region ON macro_snapshots(region);
CREATE INDEX IF NOT EXISTS idx_macro_snapshots_indicator ON macro_snapshots(indicator);
CREATE INDEX IF NOT EXISTS idx_macro_snapshots_timestamp ON macro_snapshots(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_macro_snapshots_country ON macro_snapshots(country_code);
CREATE INDEX IF NOT EXISTS idx_macro_snapshots_composite ON macro_snapshots(region, indicator, timestamp DESC);

-- Enable RLS
ALTER TABLE macro_snapshots ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access to macro_snapshots"
  ON macro_snapshots FOR SELECT
  USING (true);

-- Europe Risk Signals Table
CREATE TABLE IF NOT EXISTS europe_risk_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL, -- 'EUROZONE_DEBT_STRESS', 'EUROPE_RECESSION_RISK'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  title TEXT NOT NULL,
  description TEXT,
  trigger_conditions JSONB,
  affected_countries TEXT[], -- ['IT', 'ES', 'GR']
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_europe_signals_type ON europe_risk_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_europe_signals_active ON europe_risk_signals(is_active);

ALTER TABLE europe_risk_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to europe_risk_signals"
  ON europe_risk_signals FOR SELECT
  USING (true);
