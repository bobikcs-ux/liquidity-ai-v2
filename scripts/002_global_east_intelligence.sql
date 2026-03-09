-- Global East Intelligence Table for BRICS GDP Data
-- Source: World Bank API (NY.GDP.MKTP.CD indicator)

CREATE TABLE IF NOT EXISTS global_east_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  year INT NOT NULL,
  gdp_usd NUMERIC NOT NULL,
  source TEXT NOT NULL DEFAULT 'worldbank',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate entries for same country/year
  UNIQUE(country_code, year)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_global_east_country ON global_east_intelligence(country_code);
CREATE INDEX IF NOT EXISTS idx_global_east_year ON global_east_intelligence(year DESC);
CREATE INDEX IF NOT EXISTS idx_global_east_country_year ON global_east_intelligence(country_code, year DESC);

-- Enable RLS
ALTER TABLE global_east_intelligence ENABLE ROW LEVEL SECURITY;

-- Allow public read access (this is public economic data)
CREATE POLICY "global_east_intelligence_select" ON global_east_intelligence
  FOR SELECT USING (true);

-- Only authenticated users can insert/update
CREATE POLICY "global_east_intelligence_insert" ON global_east_intelligence
  FOR INSERT WITH CHECK (true);

CREATE POLICY "global_east_intelligence_update" ON global_east_intelligence
  FOR UPDATE USING (true);

-- Comment on table
COMMENT ON TABLE global_east_intelligence IS 'BRICS GDP data from World Bank API for geoeconomic analysis';
