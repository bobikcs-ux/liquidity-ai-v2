-- Create market_reports table to store Black Swan scan results
CREATE TABLE IF NOT EXISTS public.market_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  btc_price NUMERIC,
  fear_greed_value INTEGER,
  fear_greed_label TEXT,
  yield_curve TEXT,
  btc_dominance NUMERIC,
  analysis TEXT NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no auth required for viewing reports)
CREATE POLICY "Allow public read access" ON public.market_reports
  FOR SELECT USING (true);

-- Allow public insert access (no auth required for creating reports)
CREATE POLICY "Allow public insert access" ON public.market_reports
  FOR INSERT WITH CHECK (true);
