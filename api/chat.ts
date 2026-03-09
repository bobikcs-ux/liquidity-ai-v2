import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// ============================================================================
// FETCH LIVE DATA FROM SUPABASE
// ============================================================================

interface LiveMarketData {
  // Macro
  dgs10: number | null;
  dgs2: number | null;
  spread: number | null;
  // Crypto
  btcPrice: number | null;
  ethPrice: number | null;
  btcChange24h: number | null;
  fearGreed: number | null;
  // Energy/Commodities
  wti: number | null;
  brent: number | null;
  naturalGas: number | null;
  gold: number | null;
  silver: number | null;
  // Metadata
  lastUpdated: string | null;
  dataSource: string;
}

async function fetchLiveMarketData(): Promise<LiveMarketData> {
  const defaultData: LiveMarketData = {
    dgs10: null, dgs2: null, spread: null,
    btcPrice: null, ethPrice: null, btcChange24h: null, fearGreed: null,
    wti: null, brent: null, naturalGas: null, gold: null, silver: null,
    lastUpdated: null,
    dataSource: 'NO_DATA',
  };

  if (!supabase) {
    console.log('[chat] Supabase not configured');
    return { ...defaultData, dataSource: 'NO_SUPABASE' };
  }

  try {
    // Fetch latest data from all three tables in parallel
    const [macroRes, cryptoRes, energyRes, pricesRes] = await Promise.all([
      supabase.from('macro_data').select('region, series, fetched_at').eq('region', 'US').order('fetched_at', { ascending: false }).limit(1).single(),
      supabase.from('crypto_data').select('series, fetched_at').order('fetched_at', { ascending: false }).limit(1).single(),
      supabase.from('energy_data').select('series, fetched_at').order('fetched_at', { ascending: false }).limit(1).single(),
      supabase.from('prices').select('product_code, price, updated_at').limit(10),
    ]);

    const macroSeries = macroRes.data?.series || {};
    const cryptoSeries = cryptoRes.data?.series || {};
    const energySeries = energyRes.data?.series || {};
    const prices = pricesRes.data || [];

    // Get latest timestamp
    const timestamps = [
      macroRes.data?.fetched_at,
      cryptoRes.data?.fetched_at,
      energyRes.data?.fetched_at,
    ].filter(Boolean);
    const lastUpdated = timestamps.length > 0 
      ? new Date(Math.max(...timestamps.map(t => new Date(t).getTime()))).toISOString()
      : null;

    // Build prices map
    const priceMap: Record<string, number> = {};
    prices.forEach((p: any) => { priceMap[p.product_code] = p.price; });

    return {
      // Macro data
      dgs10: macroSeries.DGS10 ?? null,
      dgs2: macroSeries.DGS2 ?? null,
      spread: macroSeries.SPREAD ?? (macroSeries.DGS10 && macroSeries.DGS2 ? macroSeries.DGS10 - macroSeries.DGS2 : null),
      // Crypto data
      btcPrice: cryptoSeries.BTC_PRICE ?? null,
      ethPrice: cryptoSeries.ETH_PRICE ?? null,
      btcChange24h: cryptoSeries.BTC_CHANGE_24H ?? null,
      fearGreed: cryptoSeries.FEAR_GREED ?? null,
      // Energy data
      wti: energySeries.WTI_CRUDE ?? priceMap['T81'] ?? null,
      brent: energySeries.BRENT_CRUDE ?? null,
      naturalGas: energySeries.NATURAL_GAS ?? null,
      gold: energySeries.GOLD_XAU ?? priceMap['T76'] ?? null,
      silver: energySeries.SILVER_XAG ?? null,
      // Metadata
      lastUpdated,
      dataSource: 'SUPABASE_LIVE',
    };
  } catch (err) {
    console.error('[chat] Error fetching live data:', err);
    return { ...defaultData, dataSource: 'FETCH_ERROR' };
  }
}

// ============================================================================
// BUILD DYNAMIC SYSTEM CONTEXT WITH LIVE DATA
// ============================================================================

function buildSystemContext(data: LiveMarketData): string {
  const formatPrice = (val: number | null, decimals = 2) => 
    val !== null ? val.toFixed(decimals) : 'N/A';
  
  const formatChange = (val: number | null) => 
    val !== null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A';

  const timestamp = data.lastUpdated 
    ? new Date(data.lastUpdated).toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC'
    : 'Unknown';

  return `You are Aurelius Intelligence Core of the BOBIKCS TERMINAL.

INSTRUCTIONS:
- Respond in English
- Use ONLY the live market data provided below - DO NOT use any cached or memorized prices
- You are discrete, sharp and strategic AI
- Provide precise numerical values from the CURRENT DATA section
- Analyze correlations between energy prices and geopolitical risk
- Use professional, institutional language
- Format responses for terminal display (short, data-driven)
- When asked about prices, ALWAYS cite the exact values from CURRENT DATA below

=== CURRENT MARKET DATA (Last Updated: ${timestamp}) ===
Data Source: ${data.dataSource}

TREASURY YIELDS:
• 10Y Treasury (DGS10): ${formatPrice(data.dgs10)}%
• 2Y Treasury (DGS2): ${formatPrice(data.dgs2)}%
• Yield Spread (10Y-2Y): ${formatPrice(data.spread)} bps

CRYPTO MARKETS:
• Bitcoin (BTC): $${formatPrice(data.btcPrice, 0)} (${formatChange(data.btcChange24h)} 24h)
• Ethereum (ETH): $${formatPrice(data.ethPrice, 0)}
• Fear & Greed Index: ${data.fearGreed ?? 'N/A'}

COMMODITIES:
• WTI Crude Oil: $${formatPrice(data.wti)}/bbl
• Brent Crude: $${formatPrice(data.brent)}/bbl
• Natural Gas (Henry Hub): $${formatPrice(data.naturalGas)}/MMBtu
• Gold (XAU): $${formatPrice(data.gold, 0)}/oz
• Silver (XAG): $${formatPrice(data.silver)}/oz

=== END CURRENT DATA ===

CRITICAL: The prices above are LIVE from the database. If a user asks "What is the WTI price?" you MUST respond with $${formatPrice(data.wti)}/bbl (the exact value shown above), NOT any other number.

When greeted, respond briefly and professionally. When asked for data, cite the exact values from CURRENT DATA.

STATUS: ONLINE | Data: ${data.dataSource} | Updated: ${timestamp}`;
}

// ============================================================================
// FALLBACK RESPONSE USING LIVE DATA
// ============================================================================

function generateFallbackResponse(query: string, data: LiveMarketData): string {
  const q = query.toLowerCase();
  const formatPrice = (val: number | null, decimals = 2) => 
    val !== null ? val.toFixed(decimals) : 'N/A';
  const formatChange = (val: number | null) => 
    val !== null ? `${val >= 0 ? '+' : ''}${val.toFixed(2)}%` : 'N/A';

  if (q.includes('wti') || q.includes('crude') || q.includes('oil')) {
    return `WTI Crude: $${formatPrice(data.wti)}/bbl | Brent: $${formatPrice(data.brent)}/bbl | Source: ${data.dataSource}`;
  }

  if (q.includes('btc') || q.includes('bitcoin')) {
    return `Bitcoin: $${formatPrice(data.btcPrice, 0)} (${formatChange(data.btcChange24h)} 24h) | Fear & Greed: ${data.fearGreed ?? 'N/A'} | Source: ${data.dataSource}`;
  }

  if (q.includes('eth') || q.includes('ethereum')) {
    return `Ethereum: $${formatPrice(data.ethPrice, 0)} | Source: ${data.dataSource}`;
  }

  if (q.includes('gold')) {
    return `Gold (XAU): $${formatPrice(data.gold, 0)}/oz | Silver: $${formatPrice(data.silver)}/oz | Source: ${data.dataSource}`;
  }

  if (q.includes('yield') || q.includes('treasury') || q.includes('dgs')) {
    return `10Y Treasury: ${formatPrice(data.dgs10)}% | 2Y Treasury: ${formatPrice(data.dgs2)}% | Spread: ${formatPrice(data.spread)} bps | Source: ${data.dataSource}`;
  }

  if (q.includes('gas') || q.includes('natural')) {
    return `Natural Gas (Henry Hub): $${formatPrice(data.naturalGas)}/MMBtu | Source: ${data.dataSource}`;
  }

  if (q.includes('status') || q.includes('hi') || q.includes('hello')) {
    return `AURELIUS INTELLIGENCE ACTIVE | Data Source: ${data.dataSource} | WTI: $${formatPrice(data.wti)} | BTC: $${formatPrice(data.btcPrice, 0)} | Last Updated: ${data.lastUpdated ?? 'Unknown'}`;
  }

  // Default market brief
  return `AURELIUS MARKET BRIEF (${data.lastUpdated ? new Date(data.lastUpdated).toLocaleString('en-US', { timeZone: 'UTC' }) : 'Unknown'} UTC):

COMMODITIES:
• WTI: $${formatPrice(data.wti)}/bbl | Brent: $${formatPrice(data.brent)}/bbl
• Gold: $${formatPrice(data.gold, 0)}/oz | Silver: $${formatPrice(data.silver)}/oz
• Natural Gas: $${formatPrice(data.naturalGas)}/MMBtu

CRYPTO:
• BTC: $${formatPrice(data.btcPrice, 0)} (${formatChange(data.btcChange24h)} 24h)
• ETH: $${formatPrice(data.ethPrice, 0)}
• Fear & Greed: ${data.fearGreed ?? 'N/A'}

RATES:
• 10Y: ${formatPrice(data.dgs10)}% | 2Y: ${formatPrice(data.dgs2)}%
• Spread: ${formatPrice(data.spread)} bps

Data Source: ${data.dataSource}`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, systemInit } = req.body;

    // Fetch live market data from Supabase FIRST
    const liveData = await fetchLiveMarketData();
    console.log('[chat] Fetched live data, source:', liveData.dataSource, 'WTI:', liveData.wti);

    // Handle SYSTEM_INIT test
    if (systemInit === 'SYSTEM_INIT') {
      return res.status(200).json({
        status: 'ACTIVE',
        response: `AURELIUS INTELLIGENCE ONLINE. Data source: ${liveData.dataSource}. WTI: $${liveData.wti?.toFixed(2) ?? 'N/A'}. BTC: $${liveData.btcPrice?.toFixed(0) ?? 'N/A'}. Ready for queries.`,
        timestamp: new Date().toISOString(),
        dataSource: liveData.dataSource,
        lastUpdated: liveData.lastUpdated,
      });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Build dynamic system context with live data
    const systemContext = buildSystemContext(liveData);

    // Try AI API
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_GATEWAY_API_KEY || '';
    
    if (!apiKey) {
      return res.status(200).json({
        status: 'FALLBACK',
        response: generateFallbackResponse(message, liveData),
        source: 'SUPABASE_DIRECT',
        dataSource: liveData.dataSource,
        lastUpdated: liveData.lastUpdated,
        timestamp: new Date().toISOString()
      });
    }

    // Use Google Generative AI API with live data context
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemContext}\n\nUser query: ${message}` }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[chat] Gemini API Error:', error);
      
      return res.status(200).json({
        status: 'FALLBACK',
        response: generateFallbackResponse(message, liveData),
        source: 'SUPABASE_DIRECT',
        dataSource: liveData.dataSource,
        lastUpdated: liveData.lastUpdated,
        timestamp: new Date().toISOString()
      });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                       'No response from AI. ' + generateFallbackResponse(message, liveData);

    return res.status(200).json({
      status: 'ACTIVE',
      response: aiResponse,
      source: 'GEMINI_INTELLIGENCE',
      dataSource: liveData.dataSource,
      lastUpdated: liveData.lastUpdated,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[chat] Error:', error);
    const liveData = await fetchLiveMarketData().catch(() => ({
      dgs10: null, dgs2: null, spread: null,
      btcPrice: null, ethPrice: null, btcChange24h: null, fearGreed: null,
      wti: null, brent: null, naturalGas: null, gold: null, silver: null,
      lastUpdated: null, dataSource: 'ERROR',
    }));
    
    return res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: generateFallbackResponse('status', liveData as LiveMarketData),
      timestamp: new Date().toISOString()
    });
  }
}
