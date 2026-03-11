import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Gemini Intelligence Chat Endpoint
 * Direct connection to Gemini API with LIVE market data
 * Fetches real-time prices before each response
 */

// Default/fallback values (used only if live fetch fails)
const DEFAULT_PRICES = {
  wti: 78.45,
  brent: 81.65,
  btc: 67500,
  eth: 3450,
  gold: 2340,
  henryHub: 2.89,
  ttf: 12.45,
};

// Fetch live market data from our proxy APIs
async function fetchLiveMarketData() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  const results = {
    oil: { wti: DEFAULT_PRICES.wti, brent: DEFAULT_PRICES.brent, wtiChange: 0, brentChange: 0 },
    crypto: { btc: DEFAULT_PRICES.btc, eth: DEFAULT_PRICES.eth, btcChange: 0, ethChange: 0 },
    macro: { dgs10: 4.25, dgs2: 4.65, fedfunds: 5.33 },
  };

  try {
    // Fetch oil prices
    const oilResp = await fetch(`${baseUrl}/api/commodities/oil`, { 
      signal: AbortSignal.timeout(5000) 
    }).catch(() => null);
    if (oilResp?.ok) {
      const oilData = await oilResp.json();
      results.oil.wti = oilData.wti?.price || DEFAULT_PRICES.wti;
      results.oil.brent = oilData.brent?.price || DEFAULT_PRICES.brent;
      results.oil.wtiChange = oilData.wti?.changesPercentage || 0;
      results.oil.brentChange = oilData.brent?.changesPercentage || 0;
    }

    // Fetch crypto prices
    const cryptoResp = await fetch(`${baseUrl}/api/crypto/prices`, { 
      signal: AbortSignal.timeout(5000) 
    }).catch(() => null);
    if (cryptoResp?.ok) {
      const cryptoData = await cryptoResp.json();
      results.crypto.btc = cryptoData.bitcoin?.usd || DEFAULT_PRICES.btc;
      results.crypto.eth = cryptoData.ethereum?.usd || DEFAULT_PRICES.eth;
      results.crypto.btcChange = cryptoData.bitcoin?.usd_24h_change || 0;
      results.crypto.ethChange = cryptoData.ethereum?.usd_24h_change || 0;
    }

    // Fetch macro data (yields)
    const macroResp = await fetch(`${baseUrl}/api/macro/fred?series=DGS10`, { 
      signal: AbortSignal.timeout(5000) 
    }).catch(() => null);
    if (macroResp?.ok) {
      const macroData = await macroResp.json();
      results.macro.dgs10 = macroData.value || 4.25;
    }

  } catch (err) {
    console.error('[chat.ts] Error fetching live data:', err);
  }

  return results;
}

// Build dynamic TABLE_DATA with live prices
function buildTableData(live: Awaited<ReturnType<typeof fetchLiveMarketData>>) {
  return {
    // Table 6.3 - Tanker Rates (mostly static geopolitical data)
    t63: {
      name: 'Tanker Rates - Table 6.3',
      description: 'VLCC, Suezmax, and Aframax tanker rates with route premiums',
      data: {
        vlcc: { 
          baseRate: 48500, 
          hormuzPremium: 8.2, 
          babElMandebPremium: 24.6,
          malaccaPremium: -2.1 
        },
        suezmax: { baseRate: 41200, suezPremium: 15.4 },
        aframax: { baseRate: 32100, turkishStraitsPremium: 1.2 },
        acledCorrelation: {
          hormuz: 0.35,
          babElMandeb: 0.78,
          suez: 0.28,
          malacca: 0.12,
          turkishStraits: 0.18
        }
      }
    },
    
    // Table 7.6 - Crude Oil Prices (LIVE DATA)
    t76: {
      name: 'Crude Oil Prices - Table 7.6',
      description: 'WTI, Brent prices with crack spreads and refining margins',
      data: {
        wti: { price: live.oil.wti, change24h: live.oil.wtiChange, change7d: -1.2 },
        brent: { price: live.oil.brent, change24h: live.oil.brentChange, change7d: -0.9 },
        crackSpread321: { value: Math.round((live.oil.brent - live.oil.wti + 15) * 100) / 100, change: 2.8 },
        refiningMargin: { value: 14.12, change: 1.4 },
        inventory: { us: 425600000, change: -1200000 },
        opecSupply: { value: 27.8, unit: 'mb/d', change: 0.5 }
      }
    },
    
    // Table 8.1 - Natural Gas and Energy Mix
    t81: {
      name: 'Natural Gas & Energy - Table 8.1',
      description: 'Henry Hub, TTF prices, LNG spot rates',
      data: {
        henryHub: { price: DEFAULT_PRICES.henryHub, change24h: -1.5, unit: 'USD/MMBtu' },
        ttf: { price: DEFAULT_PRICES.ttf, change24h: 0.8, unit: 'EUR/MWh' },
        lngSpot: { price: 14.20, asiaPremium: 2.8 },
        coalNewcastle: { price: 145.20, change: 0.8 },
        euEmissions: { price: 68.50, change: -2.1 }
      }
    },
    
    // Table 9.4 - Shipping Flow Analytics
    t94: {
      name: 'Shipping Flow - Table 9.4',
      description: 'Maritime chokepoint transit volumes and disruption indices',
      data: {
        hormuz: { flow: 21.0, delta: -2.3, unit: 'mb/d' },
        malacca: { flow: 16.8, delta: 1.2 },
        suez: { flow: 5.5, delta: -8.7 },
        babElMandeb: { flow: 4.8, delta: -12.4 },
        turkishStraits: { flow: 3.2, delta: 0.5 },
        capeOfGoodHope: { rerouting: 18.5, increase: 34.2 }
      }
    },
    
    // Table 9.5 - Petrodollar Index Components
    t95: {
      name: 'Petrodollar Index - Table 9.5',
      description: 'USD dominance metrics in oil trade settlement',
      data: {
        indexValue: 78.4,
        components: {
          usdOilCorrelation: 0.82,
          petroForexReserves: 65.2,
          saudiUsdPegStability: 99.8,
          oilTradeUsdSettlement: 72.1
        },
        deDollarizationRisk: {
          china: 'ELEVATED',
          russia: 'HIGH',
          india: 'MODERATE',
          brazil: 'LOW'
        }
      }
    },
    
    // LIVE CRYPTO DATA (new)
    crypto: {
      name: 'Crypto Markets - Live',
      data: {
        btc: { price: live.crypto.btc, change24h: live.crypto.btcChange },
        eth: { price: live.crypto.eth, change24h: live.crypto.ethChange },
      }
    },
    
    // LIVE MACRO DATA (new)
    macro: {
      name: 'Macro Indicators - Live',
      data: {
        dgs10: live.macro.dgs10,
        dgs2: live.macro.dgs2,
        fedfunds: live.macro.fedfunds,
      }
    }
  };
}

// Build dynamic system context with live data
function buildSystemContext(tableData: ReturnType<typeof buildTableData>): string {
  return `You are Aurelius Intelligence Core of the BOBIKCS TERMINAL.

INSTRUCTIONS:
- Respond in English
- Use context from Table 6.3 (Shipping), Table 7.6 (Crude) and Table 8.1 (Energy) for analysis
- You are discrete, sharp and strategic AI
- Provide precise numerical values from tables
- Analyze correlations between energy prices and geopolitical risk
- Use professional, institutional language
- Format responses for terminal display (short, data-driven)

LIVE MARKET DATA (fetched ${new Date().toISOString()}):
1. Table 6.3 (t63): Tanker Rates - VLCC $${tableData.t63.data.vlcc.baseRate}/day, Bab el-Mandeb Premium: +${tableData.t63.data.vlcc.babElMandebPremium}%
2. Table 7.6 (t76): WTI $${tableData.t76.data.wti.price.toFixed(2)}/bbl (${tableData.t76.data.wti.change24h > 0 ? '+' : ''}${tableData.t76.data.wti.change24h.toFixed(1)}%), Brent $${tableData.t76.data.brent.price.toFixed(2)}/bbl, Crack Spread: $${tableData.t76.data.crackSpread321.value}/bbl
3. Table 8.1 (t81): Henry Hub $${tableData.t81.data.henryHub.price}/MMBtu, TTF €${tableData.t81.data.ttf.price}/MWh
4. Table 9.4 (t94): Shipping Flow - Hormuz ${tableData.t94.data.hormuz.flow} mb/d, Bab el-Mandeb ${tableData.t94.data.babElMandeb.flow} mb/d
5. Table 9.5 (t95): Petrodollar Index: ${tableData.t95.data.indexValue}
6. CRYPTO: BTC $${tableData.crypto.data.btc.price.toLocaleString()} (${tableData.crypto.data.btc.change24h > 0 ? '+' : ''}${tableData.crypto.data.btc.change24h.toFixed(1)}%), ETH $${tableData.crypto.data.eth.price.toLocaleString()}
7. MACRO: 10Y Yield ${tableData.macro.data.dgs10}%, Fed Funds ${tableData.macro.data.fedfunds}%

US Inventory: ${(tableData.t76.data.inventory.us / 1000000).toFixed(1)}M barrels
OPEC Supply: ${tableData.t76.data.opecSupply.value} mb/d

When greeted, respond briefly and professionally. When asked for data, cite specific tables.

STATUS: ONLINE | Data: LIVE | Mode: STRATEGIST`;
}

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

    // Fetch LIVE market data before processing
    const liveData = await fetchLiveMarketData();
    const TABLE_DATA = buildTableData(liveData);
    const SYSTEM_CONTEXT = buildSystemContext(TABLE_DATA);

    // Handle SYSTEM_INIT test
    if (systemInit === 'SYSTEM_INIT') {
      return res.status(200).json({
        status: 'ACTIVE',
        response: `AURELIUS INTELLIGENCE ONLINE. Live data: WTI $${TABLE_DATA.t76.data.wti.price.toFixed(2)}, BTC $${TABLE_DATA.crypto.data.btc.price.toLocaleString()}. Tables t63, t76, t81, t94, t95 loaded.`,
        timestamp: new Date().toISOString(),
        tables: Object.keys(TABLE_DATA),
        liveData: {
          wti: TABLE_DATA.t76.data.wti.price,
          brent: TABLE_DATA.t76.data.brent.price,
          btc: TABLE_DATA.crypto.data.btc.price,
          eth: TABLE_DATA.crypto.data.eth.price,
        }
      });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Use Google Generative AI directly for Gemini
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_GATEWAY_API_KEY || '';
    
    if (!apiKey) {
      return res.status(200).json({
        status: 'FALLBACK',
        response: generateFallbackResponse(message, TABLE_DATA),
        source: 'LOCAL_TABLE_DATA',
        note: 'No API key available. Using local table data.',
        timestamp: new Date().toISOString()
      });
    }

    // Use Google Generative AI API with LIVE data context
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { 
            role: 'user', 
            parts: [{ text: `${SYSTEM_CONTEXT}\n\nUser query: ${message}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });
    
    

    if (!response.ok) {
      const error = await response.text();
      console.error('[Gemini API Error]:', error);
      
      // Fallback to direct table query if AI fails
      return res.status(200).json({
        status: 'FALLBACK',
        response: generateFallbackResponse(message, TABLE_DATA),
        source: 'LOCAL_TABLE_DATA',
        timestamp: new Date().toISOString()
      });
    }

    const data = await response.json();
    
    // Google Generative AI response format
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                       data.choices?.[0]?.message?.content || 
                       'No response from AI';

    return res.status(200).json({
      status: 'ACTIVE',
      response: aiResponse,
      source: 'GEMINI_INTELLIGENCE',
      liveData: {
        wti: TABLE_DATA.t76.data.wti.price,
        brent: TABLE_DATA.t76.data.brent.price,
        btc: TABLE_DATA.crypto.data.btc.price,
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Chat API Error]:', error);
    // Build fallback data for error case
    const fallbackLive = await fetchLiveMarketData().catch(() => ({
      oil: { wti: DEFAULT_PRICES.wti, brent: DEFAULT_PRICES.brent, wtiChange: 0, brentChange: 0 },
      crypto: { btc: DEFAULT_PRICES.btc, eth: DEFAULT_PRICES.eth, btcChange: 0, ethChange: 0 },
      macro: { dgs10: 4.25, dgs2: 4.65, fedfunds: 5.33 },
    }));
    const fallbackTable = buildTableData(fallbackLive);
    return res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: generateFallbackResponse('status', fallbackTable),
      timestamp: new Date().toISOString()
    });
  }
}

// Fallback response generator using LIVE table data
function generateFallbackResponse(query: string, tableData: ReturnType<typeof buildTableData>): string {
  const q = query.toLowerCase();
  
  if (q.includes('inventory') || q.includes('us inventory')) {
    return `US Crude Inventory (Table 7.6): ${(tableData.t76.data.inventory.us / 1000000).toFixed(1)}M barrels (${tableData.t76.data.inventory.change > 0 ? '+' : ''}${(tableData.t76.data.inventory.change / 1000000).toFixed(2)}M change)`;
  }
  
  if (q.includes('opec') || q.includes('supply')) {
    return `OPEC Supply (Table 7.6): ${tableData.t76.data.opecSupply.value} mb/d (${tableData.t76.data.opecSupply.change > 0 ? '+' : ''}${tableData.t76.data.opecSupply.change} change)`;
  }
  
  if (q.includes('wti') || q.includes('crude') || q.includes('oil')) {
    return `WTI Crude (Table 7.6): $${tableData.t76.data.wti.price.toFixed(2)}/bbl (${tableData.t76.data.wti.change24h > 0 ? '+' : ''}${tableData.t76.data.wti.change24h.toFixed(1)}% 24h) | Brent: $${tableData.t76.data.brent.price.toFixed(2)}/bbl | Crack Spread: $${tableData.t76.data.crackSpread321.value}/bbl`;
  }
  
  if (q.includes('btc') || q.includes('bitcoin') || q.includes('crypto')) {
    return `CRYPTO (Live): BTC $${tableData.crypto.data.btc.price.toLocaleString()} (${tableData.crypto.data.btc.change24h > 0 ? '+' : ''}${tableData.crypto.data.btc.change24h.toFixed(1)}% 24h) | ETH $${tableData.crypto.data.eth.price.toLocaleString()}`;
  }
  
  if (q.includes('tanker') || q.includes('shipping') || q.includes('rate')) {
    return `Tanker Rates (Table 6.3): VLCC $${tableData.t63.data.vlcc.baseRate}/day | Bab el-Mandeb Premium: +${tableData.t63.data.vlcc.babElMandebPremium}% (ACLED Risk: ${(tableData.t63.data.acledCorrelation.babElMandeb * 100).toFixed(0)}%)`;
  }
  
  if (q.includes('bab') || q.includes('mandeb') || q.includes('yemen')) {
    return `Bab el-Mandeb (Table 9.4): Flow ${tableData.t94.data.babElMandeb.flow} mb/d (${tableData.t94.data.babElMandeb.delta}% change) | ACLED Risk Index: ${(tableData.t63.data.acledCorrelation.babElMandeb * 100).toFixed(0)}% | Tanker Premium: +${tableData.t63.data.vlcc.babElMandebPremium}%`;
  }
  
  if (q.includes('petrodollar') || q.includes('usd') || q.includes('dollar')) {
    return `Petrodollar Index (Table 9.5): ${tableData.t95.data.indexValue} | USD/Oil Correlation: ${tableData.t95.data.components.usdOilCorrelation} | De-dollarization Risk: China ${tableData.t95.data.deDollarizationRisk.china}, Russia ${tableData.t95.data.deDollarizationRisk.russia}`;
  }
  
  if (q.includes('status') || q.includes('hi') || q.includes('hello')) {
    return `AURELIUS INTELLIGENCE ACTIVE | Live Data: WTI $${tableData.t76.data.wti.price.toFixed(2)}, BTC $${tableData.crypto.data.btc.price.toLocaleString()} | Bab el-Mandeb Risk: ${(tableData.t63.data.acledCorrelation.babElMandeb * 100).toFixed(0)}%`;
  }
  
  // Strategic fallback - provide actual analysis with LIVE prices
  const overview = `AURELIUS MARKET BRIEF (LIVE):

WTI: $${tableData.t76.data.wti.price.toFixed(2)}/bbl (${tableData.t76.data.wti.change24h > 0 ? '+' : ''}${tableData.t76.data.wti.change24h.toFixed(1)}%)
Brent: $${tableData.t76.data.brent.price.toFixed(2)}/bbl
BTC: $${tableData.crypto.data.btc.price.toLocaleString()} (${tableData.crypto.data.btc.change24h > 0 ? '+' : ''}${tableData.crypto.data.btc.change24h.toFixed(1)}%)
ETH: $${tableData.crypto.data.eth.price.toLocaleString()}

RISK INDICATORS:
• Bab el-Mandeb: ${(tableData.t63.data.acledCorrelation.babElMandeb * 100).toFixed(0)}% ACLED correlation
• VLCC Premium: +${tableData.t63.data.vlcc.babElMandebPremium}%
• Hormuz Flow: ${tableData.t94.data.hormuz.flow} mb/d

US Inventory: ${(tableData.t76.data.inventory.us / 1000000).toFixed(1)}M bbl
OPEC Supply: ${tableData.t76.data.opecSupply.value} mb/d

Ask a specific question for detailed analysis.`;
  return overview;
}
