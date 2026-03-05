// 1. Interface for market data
export interface MarketContext {
  yieldCurve: string | null;
  fearGreedValue: string;
  fearGreedLabel: string;
  btcPrice: number;
  btcChange: number;
  btcDominance: number;
}

// 2. Main function to fetch all market data
export const fetchAllMarketData = async (): Promise<MarketContext> => {
  // Get API keys from environment
  const FRED_KEY = import.meta.env.VITE_FRED_API_KEY || 
    (typeof process !== 'undefined' && process.env.VITE_FRED_API_KEY);
  const COINGECKO_KEY = import.meta.env.NEXT_PUBLIC_COINGECKO_API_KEY || 
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_COINGECKO_API_KEY);
  
  // CoinGecko headers with API key if available
  const cgHeaders: HeadersInit = { 'Accept': 'application/json' };
  if (COINGECKO_KEY) {
    cgHeaders['x-cg-demo-api-key'] = COINGECKO_KEY;
  }
  
  try {
    const [fredRes, fngRes, cgGlobalRes, cgPriceRes] = await Promise.all([
      // FRED (Macro) - Yield Curve 10Y-2Y
      FRED_KEY 
        ? fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=T10Y2Y&api_key=${FRED_KEY}&file_type=json&limit=1&sort_order=desc`)
            .then(res => res.json())
            .catch(() => ({ observations: [{ value: 'Loading...' }] }))
        : Promise.resolve({ observations: [{ value: 'Loading...' }] }),
      
      // Alternative.me (Sentiment - Fear & Greed)
      fetch(import.meta.env.VITE_FEAR_GREED_API_URL || 'https://api.alternative.me/fng/')
        .then(res => res.json())
        .catch(() => ({ data: [{ value: '50', value_classification: 'Neutral' }] })),
      
      // CoinGecko Global Data (BTC Dominance) with API key
      fetch('https://api.coingecko.com/api/v3/global', { headers: cgHeaders })
        .then(res => res.json())
        .catch(() => ({ data: { market_cap_percentage: { btc: 0 } } })),
      
      // CoinGecko Price Data with API key
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', { headers: cgHeaders })
        .then(res => res.json())
        .catch(() => ({ bitcoin: { usd: 0, usd_24h_change: 0 } }))
    ]);

    const yieldValue = fredRes.observations?.[0]?.value;
    const btcDominance = cgGlobalRes.data?.market_cap_percentage?.btc || 0;
    
    return {
      yieldCurve: yieldValue && yieldValue !== '.' ? yieldValue : "Loading...",
      fearGreedValue: fngRes.data?.[0]?.value || "50",
      fearGreedLabel: fngRes.data?.[0]?.value_classification || "Neutral",
      btcPrice: cgPriceRes.bitcoin?.usd || 0,
      btcChange: cgPriceRes.bitcoin?.usd_24h_change || 0,
      btcDominance: btcDominance
    };
  } catch (error) {
    console.error("[v0] Master Fetch Error:", error);
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
  // Check for API key: GOOGLE_GENERATIVE_AI_API_KEY (Vercel) or VITE_GOOGLE_AI_KEY (Vite dev)
  const GEMINI_KEY = 
    (typeof process !== 'undefined' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) ||
    import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    import.meta.env.VITE_GOOGLE_AI_KEY;
  
  if (!GEMINI_KEY) {
    console.warn('[v0] Google AI key not found, using mock analysis');
    return generateMockAnalysis(context);
  }

  console.log('[v0] Using Google AI for Black Swan analysis');
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
      const errorText = await response.text();
      console.error('[v0] Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || generateMockAnalysis(context);
  } catch (error) {
    console.error("[v0] Gemini API Error:", error);
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
