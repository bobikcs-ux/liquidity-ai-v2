import { supabase } from '../lib/supabase';
import { GLOBAL_FEAR_GREED_VALUE, GLOBAL_FEAR_GREED_LABEL } from '../hooks/useMarketSnapshot';
import { fetchL1Data, formatL1Value } from './l1DataNervousSystem';
import { fetchGlobalRegionData, type GlobalRegionData } from './globalRegionService';
import { fetchMacroData, type MacroDataResult } from './macroDataService';

// 1. Interface for market data
export interface MarketContext {
  yieldCurve: string | null;
  fearGreedValue: string;
  fearGreedLabel: string;
  btcPrice: number;
  btcChange: number;
  btcDominance: number;
  survivalProbability?: number;
  systemicRisk?: number;
  regime?: string;
  balanceSheetDelta?: number;
  dataSourcesOk?: boolean;
}

// Extended context with global regions
export interface GlobalMasterContext extends MarketContext {
  macro: MacroDataResult | null;
  regions: GlobalRegionData | null;
}

// 2. Enhanced function using L1 Data Nervous System
export const fetchAllMarketDataL1 = async (): Promise<MarketContext> => {
  const l1Data = await fetchL1Data();
  
  // Use L1 system with proper fallbacks
  return {
    yieldCurve: l1Data.yieldCurve !== null ? l1Data.yieldCurve.toFixed(2) : 'N/A',
    fearGreedValue: l1Data.fearGreedIndex !== null ? String(l1Data.fearGreedIndex) : String(GLOBAL_FEAR_GREED_VALUE),
    fearGreedLabel: l1Data.fearGreedIndex !== null 
      ? (l1Data.fearGreedIndex < 25 ? 'Extreme Fear' : l1Data.fearGreedIndex < 45 ? 'Fear' : l1Data.fearGreedIndex < 55 ? 'Neutral' : l1Data.fearGreedIndex < 75 ? 'Greed' : 'Extreme Greed')
      : GLOBAL_FEAR_GREED_LABEL,
    btcPrice: l1Data.btcPrice ?? 0,
    btcChange: l1Data.btcChange24h ?? 0,
    btcDominance: l1Data.btcDominance ?? 0,
    dataSourcesOk: l1Data.status === 'LIVE',
  };
};

// 2b. Legacy function - tries Supabase first, then external APIs
export const fetchAllMarketData = async (): Promise<MarketContext> => {
  // Try to fetch from Supabase first (market_snapshots table)
  if (supabase) {
    try {
      const { data: latestSnapshot, error } = await supabase
        .from('market_snapshots')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && latestSnapshot) {
        // Use GLOBAL Fear & Greed value (22 = Extreme Fear) for consistency
        // This ensures Dashboard, Reports, Analytics, and PDF export all show the same value
        return {
          yieldCurve: latestSnapshot.yield_spread?.toFixed(2) || 'N/A',
          fearGreedValue: String(GLOBAL_FEAR_GREED_VALUE),
          fearGreedLabel: GLOBAL_FEAR_GREED_LABEL,
          btcPrice: latestSnapshot.btc_price || 0,
          btcChange: 0, // Not stored in DB, would need historical comparison
          btcDominance: latestSnapshot.btc_dominance || 0,
          survivalProbability: latestSnapshot.survival_probability,
          systemicRisk: latestSnapshot.systemic_risk,
          regime: latestSnapshot.regime,
          balanceSheetDelta: latestSnapshot.balance_sheet_delta,
          dataSourcesOk: latestSnapshot.data_sources_ok,
        };
      }
    } catch (err) {
      console.warn('[v0] Supabase fetch failed, falling back to external APIs:', err);
    }
  }

  // Fallback: fetch from external APIs directly
  const FRED_KEY = import.meta.env.VITE_FRED_API_KEY || 
    (typeof process !== 'undefined' && process.env.VITE_FRED_API_KEY);
  const COINGECKO_KEY = import.meta.env.NEXT_PUBLIC_COINGECKO_API_KEY || 
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_COINGECKO_API_KEY);
  
  const cgHeaders: HeadersInit = { 'Accept': 'application/json' };
  if (COINGECKO_KEY) {
    cgHeaders['x-cg-demo-api-key'] = COINGECKO_KEY;
  }
  
  try {
    const [fredRes, fngRes, cgGlobalRes, cgPriceRes] = await Promise.all([
      FRED_KEY 
        ? fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=T10Y2Y&api_key=${FRED_KEY}&file_type=json&limit=1&sort_order=desc`)
            .then(res => res.json())
            .catch(() => ({ observations: [{ value: 'N/A' }] }))
        : Promise.resolve({ observations: [{ value: 'N/A' }] }),
      
      fetch('https://api.alternative.me/fng/')
        .then(res => res.json())
        .catch(() => ({ data: [{ value: '50', value_classification: 'Neutral' }] })),
      
      fetch('https://api.coingecko.com/api/v3/global', { headers: cgHeaders })
        .then(res => res.json())
        .catch(() => ({ data: { market_cap_percentage: { btc: 0 } } })),
      
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', { headers: cgHeaders })
        .then(res => res.json())
        .catch(() => ({ bitcoin: { usd: 0, usd_24h_change: 0 } }))
    ]);

    const yieldValue = fredRes.observations?.[0]?.value;
    const btcDominance = cgGlobalRes.data?.market_cap_percentage?.btc || 0;
    
    return {
      yieldCurve: yieldValue && yieldValue !== '.' ? yieldValue : "N/A",
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

// 5. Mock analysis fallback - uses database values when available
const generateMockAnalysis = (context: MarketContext): string => {
  const fearGreed = parseInt(context.fearGreedValue) || 50;
  const yieldValue = parseFloat(context.yieldCurve || '0');
  
  // Use database values if available - survival_probability is stored as 0-1 decimal
  // Check if value is already a percentage (>1) or decimal (0-1)
  let survivalProb = 78;
  if (context.survivalProbability != null) {
    // If value is > 1, it's already a percentage; if <= 1, multiply by 100
    survivalProb = context.survivalProbability > 1 
      ? Math.round(context.survivalProbability) 
      : Math.round(context.survivalProbability * 100);
  }
  
  // Determine risk level strictly from database regime
  let riskLevel = 'MODERATE';
  if (context.regime) {
    const regime = context.regime.toLowerCase();
    if (regime === 'crisis') riskLevel = 'ELEVATED';
    else if (regime === 'stress') riskLevel = 'STRESS';
    else if (regime === 'normal') riskLevel = 'LOW';
  } else if (context.survivalProbability == null) {
    // Fallback calculation only if no DB data
    if (fearGreed < 25 || yieldValue < -0.5) {
      riskLevel = 'ELEVATED';
      survivalProb = 62;
    } else if (fearGreed > 75) {
      riskLevel = 'EUPHORIA WARNING';
      survivalProb = 71;
    } else if (fearGreed > 50 && yieldValue > 0) {
      riskLevel = 'LOW';
      survivalProb = 89;
    }
  }
  
  // Determine liquidity state from balance_sheet_delta or systemic_risk
  let liquidityState = 'Stable';
  if (context.balanceSheetDelta != null) {
    liquidityState = context.balanceSheetDelta < -0.1 ? 'Tightening (QT)' : 
                     context.balanceSheetDelta > 0.1 ? 'Easing (QE)' : 'Neutral';
  } else if (context.systemicRisk != null) {
    liquidityState = context.systemicRisk > 0.5 ? 'Tightening (QT)' : 
                     context.systemicRisk > 0.3 ? 'Cautious' : 'Healthy';
  } else if (fearGreed < 25 || yieldValue < -0.5) {
    liquidityState = 'Tightening';
  } else if (fearGreed > 75) {
    liquidityState = 'Overextended';
  }

  // Systemic risk display - same decimal check
  let systemicRiskDisplay = '';
  if (context.systemicRisk != null) {
    const sysRisk = context.systemicRisk > 1 
      ? Math.round(context.systemicRisk) 
      : Math.round(context.systemicRisk * 100);
    systemicRiskDisplay = `• **Systemic Risk:** ${sysRisk}%`;
  }

  // Yield curve with % unit
  const yieldDisplay = context.yieldCurve && context.yieldCurve !== 'N/A' 
    ? `${context.yieldCurve}%` 
    : 'N/A';

  return `
**BLACK SWAN RISK ASSESSMENT**

• **Risk Level:** ${riskLevel}
• **Survival Probability:** ${survivalProb}%
• **Liquidity State:** ${liquidityState}
${systemicRiskDisplay}

**Market Conditions:**
- Yield Curve (10Y-2Y): ${yieldDisplay}${yieldValue < 0 ? ' (INVERTED - Recession Signal)' : ''}
- Sentiment: ${context.fearGreedLabel} (${context.fearGreedValue}/100)
- BTC: $${context.btcPrice.toLocaleString()} (${context.btcChange >= 0 ? '+' : ''}${context.btcChange.toFixed(2)}%)
- BTC Dominance: ${context.btcDominance.toFixed(1)}%

**Final Warning:**
${riskLevel === 'ELEVATED' || riskLevel === 'CRISIS' || riskLevel === 'STRESS'
  ? 'Defensive positioning recommended. Reduce leverage and increase hedges.'
  : riskLevel === 'EUPHORIA WARNING'
  ? 'Market complacency detected. Consider profit-taking and protective puts.'
  : 'Continue monitoring. No immediate action required.'}
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

// 7. Global Master Context — fetches all regional snapshots + macro data in parallel
export const fetchGlobalMasterContext = async (): Promise<GlobalMasterContext> => {
  const [baseContext, macro, regions] = await Promise.all([
    fetchAllMarketDataL1(),
    fetchMacroData(),
    fetchGlobalRegionData(),
  ]);

  return {
    ...baseContext,
    macro,
    regions,
  };
};

// 8. Run global scan with all 5 regions + macro data
export const runGlobalMasterScan = async (): Promise<{
  context: GlobalMasterContext;
  analysis: string;
}> => {
  const context = await fetchGlobalMasterContext();
  const analysis = await analyzeBlackSwanRisk(context);
  return { context, analysis };
};
