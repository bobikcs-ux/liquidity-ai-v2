-- Japan Macro Intelligence Table
-- Stores data from e-Stat API v3.0
CREATE TABLE IF NOT EXISTS japan_macro_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator TEXT NOT NULL,
  value NUMERIC,
  period DATE NOT NULL,
  source TEXT DEFAULT 'e-stat',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Japan macro data
CREATE INDEX IF NOT EXISTS idx_japan_macro_indicator ON japan_macro_intelligence(indicator);
CREATE INDEX IF NOT EXISTS idx_japan_macro_period ON japan_macro_intelligence(period DESC);
CREATE INDEX IF NOT EXISTS idx_japan_macro_created ON japan_macro_intelligence(created_at DESC);

-- India Fiscal Intelligence Table
-- Stores data from India GST Revenue API
CREATE TABLE IF NOT EXISTS india_fiscal_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_year TEXT NOT NULL,
  quarter TEXT,
  actual_revenue_collection NUMERIC,
  budget_estimates NUMERIC,
  revenue_velocity NUMERIC,
  source TEXT DEFAULT 'gst-api',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for India fiscal data
CREATE INDEX IF NOT EXISTS idx_india_fiscal_year ON india_fiscal_intelligence(financial_year);
CREATE INDEX IF NOT EXISTS idx_india_fiscal_created ON india_fiscal_intelligence(created_at DESC);

-- RLS Policies
ALTER TABLE japan_macro_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE india_fiscal_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "japan_macro_public_read" ON japan_macro_intelligence FOR SELECT USING (true);
CREATE POLICY "india_fiscal_public_read" ON india_fiscal_intelligence FOR SELECT USING (true);
