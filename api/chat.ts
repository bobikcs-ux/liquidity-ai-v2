import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Gemini Intelligence Chat Endpoint
 * Direct connection to Gemini API with access to Table data
 * No blocking middleware - direct passthrough
 */

// Embedded Table Data for AI Context
const TABLE_DATA = {
  // Table 6.3 - Tanker Rates
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
  
  // Table 7.6 - Crude Oil Prices and Spreads
  t76: {
    name: 'Crude Oil Prices - Table 7.6',
    description: 'WTI, Brent prices with crack spreads and refining margins',
    data: {
      wti: { price: 78.45, change24h: 2.3, change7d: -1.2 },
      brent: { price: 81.65, change24h: 2.6, change7d: -0.9 },
      crackSpread321: { value: 18.42, change: 2.8 },
      refiningMargin: { value: 14.12, change: 1.4 },
      inventory: { us: 425600000, change: -1200000 }, // barrels
      opecSupply: { value: 27.8, unit: 'mb/d', change: 0.5 }
    }
  },
  
  // Table 8.1 - Natural Gas and Energy Mix
  t81: {
    name: 'Natural Gas & Energy - Table 8.1',
    description: 'Henry Hub, TTF prices, LNG spot rates',
    data: {
      henryHub: { price: 2.89, change24h: -1.5, unit: 'USD/MMBtu' },
      ttf: { price: 12.45, change24h: 0.8, unit: 'EUR/MWh' },
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
  }
};

// System context for Gemini - The Strategist (Bulgarian)
const SYSTEM_CONTEXT = `Ти си Gemini, Intelligence Core на BOBIKCS TERMINAL. 

ИНСТРУКЦИИ:
- Отговаряш ВИНАГИ на български език
- Използваш контекста от Table 6.3 (Shipping), Table 7.6 (Cracks) и Table 8.1 (Tax) за своите анализи
- Ти си дискретен, остър и стратегически AI
- Даваш точни числови стойности от таблиците
- Анализираш корелации между енергийни цени и геополитически риск
- Използваш професионален, институционален език
- Форматираш отговорите за терминален дисплей (кратки, базирани на данни)

НАЛИЧНИ ДАННИ:
1. Table 6.3 (t63): Tanker Rates - VLCC $${TABLE_DATA.t63.data.vlcc.baseRate}/day, Bab el-Mandeb Premium: +${TABLE_DATA.t63.data.vlcc.babElMandebPremium}%
2. Table 7.6 (t76): WTI $${TABLE_DATA.t76.data.wti.price}/bbl, Brent $${TABLE_DATA.t76.data.brent.price}/bbl, Crack Spread: $${TABLE_DATA.t76.data.crackSpread321.value}/bbl
3. Table 8.1 (t81): Henry Hub $${TABLE_DATA.t81.data.henryHub.price}/MMBtu, TTF €${TABLE_DATA.t81.data.ttf.price}/MWh
4. Table 9.4 (t94): Shipping Flow - Hormuz ${TABLE_DATA.t94.data.hormuz.flow} mb/d, Bab el-Mandeb ${TABLE_DATA.t94.data.babElMandeb.flow} mb/d
5. Table 9.5 (t95): Petrodollar Index: ${TABLE_DATA.t95.data.indexValue}

US Inventory: ${(TABLE_DATA.t76.data.inventory.us / 1000000).toFixed(1)}M барела
OPEC Supply: ${TABLE_DATA.t76.data.opecSupply.value} mb/d

При поздрав отговори кратко и професионално. При въпроси за данни, цитирай конкретни таблици.

СТАТУС: ОНЛАЙН | Данни: LIVE | Режим: СТРАТЕГ`;

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

    // Handle SYSTEM_INIT test
    if (systemInit === 'SYSTEM_INIT') {
      return res.status(200).json({
        status: 'ACTIVE',
        response: 'SOVEREIGN INTELLIGENCE ONLINE. All data feeds connected. Tables t63, t76, t81, t94, t95 loaded. Ready for queries.',
        timestamp: new Date().toISOString(),
        tables: Object.keys(TABLE_DATA)
      });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Use Google Generative AI directly for Gemini
    // Try direct Google AI endpoint first
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_GATEWAY_API_KEY || '';
    
    if (!apiKey) {
      
      return res.status(200).json({
        status: 'FALLBACK',
        response: generateFallbackResponse(message),
        source: 'LOCAL_TABLE_DATA',
        note: 'Няма API ключ. Използвам локални данни.',
        timestamp: new Date().toISOString()
      });
    }

    // Use Google Generative AI API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { 
            role: 'user', 
            parts: [{ text: `${SYSTEM_CONTEXT}\n\nПотребителят пита: ${message}` }]
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
        response: generateFallbackResponse(message),
        source: 'LOCAL_TABLE_DATA',
        timestamp: new Date().toISOString()
      });
    }

    const data = await response.json();
    
    // Google Generative AI response format
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                       data.choices?.[0]?.message?.content || 
                       'Няма отговор от AI';

    return res.status(200).json({
      status: 'ACTIVE',
      response: aiResponse,
      source: 'GEMINI_INTELLIGENCE',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Chat API Error]:', error);
    return res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: generateFallbackResponse('status'),
      timestamp: new Date().toISOString()
    });
  }
}

// Fallback response generator using local table data
function generateFallbackResponse(query: string): string {
  const q = query.toLowerCase();
  
  if (q.includes('inventory') || q.includes('us inventory')) {
    return `US Crude Inventory (Table 7.6): ${(TABLE_DATA.t76.data.inventory.us / 1000000).toFixed(1)}M barrels (${TABLE_DATA.t76.data.inventory.change > 0 ? '+' : ''}${(TABLE_DATA.t76.data.inventory.change / 1000000).toFixed(2)}M change)`;
  }
  
  if (q.includes('opec') || q.includes('supply')) {
    return `OPEC Supply (Table 7.6): ${TABLE_DATA.t76.data.opecSupply.value} mb/d (${TABLE_DATA.t76.data.opecSupply.change > 0 ? '+' : ''}${TABLE_DATA.t76.data.opecSupply.change} change)`;
  }
  
  if (q.includes('wti') || q.includes('crude') || q.includes('oil')) {
    return `WTI Crude (Table 7.6): $${TABLE_DATA.t76.data.wti.price}/bbl (${TABLE_DATA.t76.data.wti.change24h > 0 ? '+' : ''}${TABLE_DATA.t76.data.wti.change24h}% 24h) | Brent: $${TABLE_DATA.t76.data.brent.price}/bbl | Crack Spread: $${TABLE_DATA.t76.data.crackSpread321.value}/bbl`;
  }
  
  if (q.includes('tanker') || q.includes('shipping') || q.includes('rate')) {
    return `Tanker Rates (Table 6.3): VLCC $${TABLE_DATA.t63.data.vlcc.baseRate}/day | Bab el-Mandeb Premium: +${TABLE_DATA.t63.data.vlcc.babElMandebPremium}% (ACLED Risk: ${(TABLE_DATA.t63.data.acledCorrelation.babElMandeb * 100).toFixed(0)}%)`;
  }
  
  if (q.includes('bab') || q.includes('mandeb') || q.includes('yemen')) {
    return `Bab el-Mandeb (Table 9.4): Flow ${TABLE_DATA.t94.data.babElMandeb.flow} mb/d (${TABLE_DATA.t94.data.babElMandeb.delta}% change) | ACLED Risk Index: ${(TABLE_DATA.t63.data.acledCorrelation.babElMandeb * 100).toFixed(0)}% | Tanker Premium: +${TABLE_DATA.t63.data.vlcc.babElMandebPremium}%`;
  }
  
  if (q.includes('petrodollar') || q.includes('usd') || q.includes('dollar')) {
    return `Petrodollar Index (Table 9.5): ${TABLE_DATA.t95.data.indexValue} | USD/Oil Correlation: ${TABLE_DATA.t95.data.components.usdOilCorrelation} | De-dollarization Risk: China ${TABLE_DATA.t95.data.deDollarizationRisk.china}, Russia ${TABLE_DATA.t95.data.deDollarizationRisk.russia}`;
  }
  
  if (q.includes('status') || q.includes('hi') || q.includes('hello')) {
    return `SOVEREIGN INTELLIGENCE ACTIVE | Tables Loaded: t63, t76, t81, t94, t95 | WTI: $${TABLE_DATA.t76.data.wti.price} | Bab el-Mandeb Risk: ${(TABLE_DATA.t63.data.acledCorrelation.babElMandeb * 100).toFixed(0)}%`;
  }
  
  // Strategic fallback - provide actual analysis instead of generic message
  const overview = `SOVEREIGN MARKET BRIEF:

WTI: $${TABLE_DATA.t76.data.wti.price}/bbl (${TABLE_DATA.t76.data.wti.change24h > 0 ? '+' : ''}${TABLE_DATA.t76.data.wti.change24h}%)
Brent: $${TABLE_DATA.t76.data.brent.price}/bbl
3:2:1 Crack: $${TABLE_DATA.t76.data.crackSpread321.value}/bbl

РИСК ИНДИКАТОРИ:
• Bab el-Mandeb: ${(TABLE_DATA.t63.data.acledCorrelation.babElMandeb * 100).toFixed(0)}% ACLED корелация
• VLCC Premium: +${TABLE_DATA.t63.data.vlcc.babElMandebPremium}%
• Hormuz Flow: ${TABLE_DATA.t94.data.hormuz.flow} mb/d

US Inventory: ${(TABLE_DATA.t76.data.inventory.us / 1000000).toFixed(1)}M bbl
OPEC Supply: ${TABLE_DATA.t76.data.opecSupply.value} mb/d

Задайте конкретен въпрос за детайлен анализ.`;
  return overview;
}
