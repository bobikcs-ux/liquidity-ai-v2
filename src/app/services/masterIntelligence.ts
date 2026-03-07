import { fetchMacroSnapshot, fetchLiquiditySnapshot } from './MacroDataService';

// 1. Interface for market data
export interface MarketContext {
  yieldCurve: string | null;
  fearGreedValue: string;
  fearGreedLabel: string;
  btcPrice: number;
  btcChange: number;
  btcDominance: number;
  fredStatus: 'ONLINE' | 'FALLBACK' | 'DELAYED';
}

/**
 * V104: Fetches all market data from Supabase materialized views
 * Sources: macro_snapshot, liquidity_snapshot (populated by ingest_all_sources())
 * Uses: `created` column for timestamps
 */
export const fetchAllMarketData = async (): Promise<MarketContext> => {
  try {
    // V104: Fetch from materialized views instead of direct API calls
    const [macroData, liquidityData] = await Promise.all([
      fetchMacroSnapshot(),
      fetchLiquiditySnapshot()
    ]);

    return {
      yieldCurve: macroData.US?.yieldCurve?.toString() || macroData.US?.fredValue?.toString() || "N/A",
      fearGreedValue: liquidityData.fearGreedValue?.toString() || "50",
      fearGreedLabel: liquidityData.fearGreedLabel || "Neutral",
      btcPrice: liquidityData.btcPrice || 0,
      btcChange: liquidityData.btcChange || 0,
      btcDominance: liquidityData.btcDominance || 0,
      fredStatus: macroData.US?.status || 'FALLBACK'
    };
  } catch (error) {
    console.error("Master Fetch Error:", error);
    throw error;
  }
};

// 3. Function to build the AI prompt
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

// 4. Function that talks to Gemini API
export const analyzeBlackSwanRisk = async (context: MarketContext): Promise<string> => {
  const GEMINI_KEY = import.meta.env.VITE_GOOGLE_AI_KEY;
  
  if (!GEMINI_KEY) {
    // Return a mock analysis when no API key is available
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
    console.error("Gemini API Error:", error);
    return generateMockAnalysis(context);
  }
};

// 5. Mock analysis fallback
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
**BLACK SWAN RISK ASSESSMENT**

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
  ? '⚠️ Defensive positioning recommended. Reduce leverage and increase hedges.'
  : riskLevel === 'EUPHORIA WARNING'
  ? '⚠️ Market complacency detected. Consider profit-taking and protective puts.'
  : '✓ Continue monitoring. No immediate action required.'}
  `.trim();
};

// 6. Combined scan function for easy use
export const runMasterScan = async (): Promise<{
  context: MarketContext;
  analysis: string;
}> => {
  const context = await fetchAllMarketData();
  const analysis = await analyzeBlackSwanRisk(context);
  return { context, analysis };
};
