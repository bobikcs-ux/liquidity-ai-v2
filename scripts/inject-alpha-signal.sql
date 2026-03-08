-- AURELIUS INTELLIGENCE SYSTEM - ALPHA SIGNAL INJECTION
-- Test signal for Live Alpha Ticker and Central Intelligence Terminal
-- Signal: WTI/BRENT DIVERGENCE DETECTED with HIGH impact

INSERT INTO public.intelligence_logs (
  signal_name,
  content,
  impact_level,
  confidence_score,
  source,
  status,
  created_at,
  updated_at
) VALUES (
  'WTI/BRENT DIVERGENCE DETECTED',
  'EIA reported a larger-than-expected drawdown of 3.2M barrels. Combined with elevated risk premiums in the Red Sea, our predictive model targets a resistance break at $82.40. Institutional buy-side pressure increasing.',
  'HIGH',
  89,
  'AURELIUS AI CORE',
  'ACTIVE',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT signal_name, impact_level, confidence_score, status, created_at 
FROM public.intelligence_logs 
ORDER BY created_at DESC 
LIMIT 1;
