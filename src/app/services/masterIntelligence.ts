import { supabase } from '../lib/supabase';

// ============================================
// V104 ARCHITECTURE: SUPABASE CRON PIPELINE
// ============================================
// All data is pre-fetched by sovereign-ingest-all cron job
// and stored in materialized views for instant access.
// NO direct API calls - maximum speed & security.
// ============================================
// VIEWS: macro_snapshot, energy_snapshot, liquidity_snapshot, geopolitics_snapshot
// TIMESTAMP COLUMN: created
// ============================================

export interface MacroSnapshot {
  yield_curve_10y2y: number | null;
  fear_greed_value: number | null;
  fear_greed_label: string | null;
  dxy_value: number | null;
  vix_value: number | null;
  created: string;
}

export interface EnergySnapshot {
  btc_price: number | null;
  btc_change_24h: number | null;
  btc_dominance: number | null;
  eth_price: number | null;
  eth_change_24h: number | null;
  total_market_cap: number | null;
  created: string;
}

export interface LiquiditySnapshot {
  fed_balance_sheet: number | null;
  reverse_repo: number | null;
  tga_balance: number | null;
  net_liquidity: number | null;
  m2_supply: number | null;
  created: string;
}

export interface GeopoliticsSnapshot {
  gpr_index: number | null;
  threat_level: string | null;
  active_conflicts: number | null;
  sanctions_count: number | null;
  created: string;
}

export interface MarketContext {
  yieldCurve: string | null;
  fearGreedValue: string;
  fearGreedLabel: string;
  btcPrice: number;
  btcChange: number;
  btcDominance: number;
  dxy: number | null;
  vix: number | null;
  netLiquidity: number | null;
  gprIndex: number | null;
  threatLevel: string | null;
}

// Fetch from macro_snapshot view
async function fetchMacroSnapshot(): Promise<MacroSnapshot | null> {
  if (!supabase) {
    console.warn('[v104] Supabase not configured');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('macro_snapshot')
      .select('*')
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('[v104] macro_snapshot fetch error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[v104] macro_snapshot error:', err);
    return null;
  }
}

// Fetch from energy_snapshot view
async function fetchEnergySnapshot(): Promise<EnergySnapshot | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('energy_snapshot')
      .select('*')
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('[v104] energy_snapshot fetch error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[v104] energy_snapshot error:', err);
    return null;
  }
}

// Fetch from liquidity_snapshot view
async function fetchLiquiditySnapshot(): Promise<LiquiditySnapshot | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('liquidity_snapshot')
      .select('*')
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('[v104] liquidity_snapshot fetch error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[v104] liquidity_snapshot error:', err);
    return null;
  }
}

// Fetch from geopolitics_snapshot view
async function fetchGeopoliticsSnapshot(): Promise<GeopoliticsSnapshot | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('geopolitics_snapshot')
      .select('*')
      .order('created', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.warn('[v104] geopolitics_snapshot fetch error:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('[v104] geopolitics_snapshot error:', err);
    return null;
  }
}

// Main function: fetch all market data from Supabase materialized views
export const fetchAllMarketData = async (): Promise<MarketContext> => {
  try {
    // Parallel fetch from all 4 materialized views
    const [macro, energy, liquidity, geopolitics] = await Promise.all([
      fetchMacroSnapshot(),
      fetchEnergySnapshot(),
      fetchLiquiditySnapshot(),
      fetchGeopoliticsSnapshot()
    ]);

    return {
      yieldCurve: macro?.yield_curve_10y2y?.toFixed(2) ?? 'N/A',
      fearGreedValue: macro?.fear_greed_value?.toString() ?? '50',
      fearGreedLabel: macro?.fear_greed_label ?? 'Neutral',
      btcPrice: energy?.btc_price ?? 0,
      btcChange: energy?.btc_change_24h ?? 0,
      btcDominance: energy?.btc_dominance ?? 0,
      dxy: macro?.dxy_value ?? null,
      vix: macro?.vix_value ?? null,
      netLiquidity: liquidity?.net_liquidity ?? null,
      gprIndex: geopolitics?.gpr_index ?? null,
      threatLevel: geopolitics?.threat_level ?? null
    };
  } catch (error) {
    console.error('[v104] Master Fetch Error:', error);
    return {
      yieldCurve: 'N/A',
      fearGreedValue: '50',
      fearGreedLabel: 'Neutral',
      btcPrice: 0,
      btcChange: 0,
      btcDominance: 0,
      dxy: null,
      vix: null,
      netLiquidity: null,
      gprIndex: null,
      threatLevel: null
    };
  }
};

// Build the AI prompt with full v104 data
export const buildBlackSwanPrompt = (context: MarketContext): string => {
  return `
System: Act as a Black Swan Risk Analyst.
Data Input (from Supabase Materialized Views):
- Yield Curve (10Y-2Y): ${context.yieldCurve} (Negative = recession risk)
- Fear & Greed: ${context.fearGreedValue} (${context.fearGreedLabel})
- Bitcoin: $${context.btcPrice.toLocaleString()} (${context.btcChange.toFixed(2)}% 24h)
- BTC Dominance: ${context.btcDominance.toFixed(1)}%
- DXY: ${context.dxy ?? 'N/A'}
- VIX: ${context.vix ?? 'N/A'}
- Net Liquidity: ${context.netLiquidity ? '$' + (context.netLiquidity / 1e12).toFixed(2) + 'T' : 'N/A'}
- GPR Index: ${context.gprIndex ?? 'N/A'} (Threat: ${context.threatLevel ?? 'Unknown'})

Task: Provide a short, aggressive professional analysis.
Calculate a "Survival Probability" percentage.
Format: Bullet points for Risk Level, Liquidity State, and Final Warning.
  `.trim();
};

// Gemini AI analysis
export const analyzeBlackSwanRisk = async (context: MarketContext): Promise<string> => {
  const GEMINI_KEY = import.meta.env.VITE_GOOGLE_AI_KEY;
  
  if (!GEMINI_KEY) {
    return generateMockAnalysis(context);
  }

  const prompt = buildBlackSwanPrompt(context);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || generateMockAnalysis(context);
  } catch (error) {
    console.error('[v104] Gemini API Error:', error);
    return generateMockAnalysis(context);
  }
};

// Mock analysis fallback
const generateMockAnalysis = (context: MarketContext): string => {
  const fearGreed = parseInt(context.fearGreedValue) || 50;
  const yieldValue = parseFloat(context.yieldCurve || '0');
  const vix = context.vix ?? 20;
  
  let riskLevel = 'MODERATE';
  let survivalProb = 78;
  let liquidityState = 'Stable';
  
  if (fearGreed < 25 || yieldValue < -0.5 || vix > 30) {
    riskLevel = 'ELEVATED';
    survivalProb = 62;
    liquidityState = 'Tightening';
  } else if (fearGreed > 75 || vix < 12) {
    riskLevel = 'EUPHORIA WARNING';
    survivalProb = 71;
    liquidityState = 'Overextended';
  } else if (fearGreed > 50 && yieldValue > 0) {
    riskLevel = 'LOW';
    survivalProb = 89;
    liquidityState = 'Healthy';
  }

  return `
**BLACK SWAN RISK ASSESSMENT** [v104 Pipeline]

• **Risk Level:** ${riskLevel}
• **Survival Probability:** ${survivalProb}%
• **Liquidity State:** ${liquidityState}

**Market Conditions:**
- Yield Curve: ${context.yieldCurve}${yieldValue < 0 ? ' (INVERTED - Recession Signal)' : ''}
- Sentiment: ${context.fearGreedLabel} (${context.fearGreedValue}/100)
- BTC: $${context.btcPrice.toLocaleString()} (${context.btcChange >= 0 ? '+' : ''}${context.btcChange.toFixed(2)}%)
- BTC Dominance: ${context.btcDominance.toFixed(1)}%
- VIX: ${context.vix ?? 'N/A'}
- Net Liquidity: ${context.netLiquidity ? '$' + (context.netLiquidity / 1e12).toFixed(2) + 'T' : 'N/A'}
- Geopolitical Threat: ${context.threatLevel ?? 'Unknown'}

**Final Warning:**
${riskLevel === 'ELEVATED' 
  ? 'Defensive positioning recommended. Reduce leverage and increase hedges.'
  : riskLevel === 'EUPHORIA WARNING'
  ? 'Market complacency detected. Consider profit-taking and protective puts.'
  : 'Continue monitoring. No immediate action required.'}
  `.trim();
};

// Combined scan function
export const runMasterScan = async (): Promise<{
  context: MarketContext;
  analysis: string;
}> => {
  const context = await fetchAllMarketData();
  const analysis = await analyzeBlackSwanRisk(context);
  return { context, analysis };
};
