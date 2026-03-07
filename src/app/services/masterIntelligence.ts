import { supabase } from '../lib/supabase';

// ============================================
// V104 ARCHITECTURE: SUPABASE CRON PIPELINE
// ============================================
// All data is pre-fetched by Supabase Edge Functions (cron)
// and stored in materialized views for instant access.
// NO direct API calls - maximum speed & security.
// ============================================

// 1. Interface for market data
export interface MarketContext {
  yieldCurve: string | null;
  fearGreedValue: string;
  fearGreedLabel: string;
  btcPrice: number;
  btcChange: number;
  btcDominance: number;
}

// 2. Fetch FRED data from Supabase materialized view
async function fetchFREDFromSupabase(): Promise<string> {
  if (!supabase) {
    console.warn('[v104] Supabase not configured, using fallback');
    return 'N/A';
  }

  try {
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('value')
      .eq('data_type', 'fred_yield_curve')
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('[v104] FRED cache miss, using fallback');
      return 'N/A';
    }

    return data.value || 'N/A';
  } catch (err) {
    console.error('[v104] FRED fetch error:', err);
    return 'N/A';
  }
}

// 3. Fetch Fear & Greed data from Supabase materialized view
async function fetchFearGreedFromSupabase(): Promise<{ value: string; label: string }> {
  if (!supabase) {
    return { value: '50', label: 'Neutral' };
  }

  try {
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('value, label')
      .eq('data_type', 'fear_greed_index')
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('[v104] Fear/Greed cache miss');
      return { value: '50', label: 'Neutral' };
    }

    return { 
      value: data.value || '50', 
      label: data.label || 'Neutral' 
    };
  } catch (err) {
    console.error('[v104] Fear/Greed fetch error:', err);
    return { value: '50', label: 'Neutral' };
  }
}

// 4. Fetch BTC data from Supabase materialized view
async function fetchBTCFromSupabase(): Promise<{ price: number; change: number; dominance: number }> {
  if (!supabase) {
    return { price: 0, change: 0, dominance: 0 };
  }

  try {
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('value, change_24h, dominance')
      .eq('data_type', 'btc_price')
      .order('cached_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('[v104] BTC cache miss');
      return { price: 0, change: 0, dominance: 0 };
    }

    return {
      price: parseFloat(data.value) || 0,
      change: parseFloat(data.change_24h) || 0,
      dominance: parseFloat(data.dominance) || 0
    };
  } catch (err) {
    console.error('[v104] BTC fetch error:', err);
    return { price: 0, change: 0, dominance: 0 };
  }
}

// 5. Main function to fetch all market data from Supabase cache
export const fetchAllMarketData = async (): Promise<MarketContext> => {
  try {
    // Parallel fetch from Supabase materialized views
    const [fredData, fngData, btcData] = await Promise.all([
      fetchFREDFromSupabase(),
      fetchFearGreedFromSupabase(),
      fetchBTCFromSupabase()
    ]);

    return {
      yieldCurve: fredData,
      fearGreedValue: fngData.value,
      fearGreedLabel: fngData.label,
      btcPrice: btcData.price,
      btcChange: btcData.change,
      btcDominance: btcData.dominance
    };
  } catch (error) {
    console.error('[v104] Master Fetch Error:', error);
    // Return safe defaults
    return {
      yieldCurve: 'N/A',
      fearGreedValue: '50',
      fearGreedLabel: 'Neutral',
      btcPrice: 0,
      btcChange: 0,
      btcDominance: 0
    };
  }
};

// 6. Function to build the AI prompt
export const buildBlackSwanPrompt = (context: MarketContext): string => {
  return `
System: Act as a Black Swan Risk Analyst.
Data Input:
- Yield Curve (10Y-2Y): ${context.yieldCurve} (Negative means recession risk)
- Fear & Greed: ${context.fearGreedValue} (${context.fearGreedLabel})
- Bitcoin Price: $${context.btcPrice.toLocaleString()} (${context.btcChange.toFixed(2)}% 24h)
- BTC Dominance: ${context.btcDominance.toFixed(1)}%

Task: Provide a short, aggressive professional analysis.
Calculate a "Survival Probability" percentage.
Format: Bullet points for Risk Level, Liquidity State, and Final Warning.
  `.trim();
};

// 7. Function that talks to Gemini API
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
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

// 8. Mock analysis fallback
const generateMockAnalysis = (context: MarketContext): string => {
  const fearGreed = parseInt(context.fearGreedValue) || 50;
  const yieldValue = parseFloat(context.yieldCurve || '0');
  
  let riskLevel = 'MODERATE';
  let survivalProb = 78;
  let liquidityState = 'Stable';
  
  if (fearGreed < 25 || yieldValue < -0.5) {
    riskLevel = 'ELEVATED';
    survivalProb = 62;
    liquidityState = 'Tightening';
  } else if (fearGreed > 75) {
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

**Final Warning:**
${riskLevel === 'ELEVATED' 
  ? 'Defensive positioning recommended. Reduce leverage and increase hedges.'
  : riskLevel === 'EUPHORIA WARNING'
  ? 'Market complacency detected. Consider profit-taking and protective puts.'
  : 'Continue monitoring. No immediate action required.'}
  `.trim();
};

// 9. Combined scan function for easy use
export const runMasterScan = async (): Promise<{
  context: MarketContext;
  analysis: string;
}> => {
  const context = await fetchAllMarketData();
  const analysis = await analyzeBlackSwanRisk(context);
  return { context, analysis };
};
