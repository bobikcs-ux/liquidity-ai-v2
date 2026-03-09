import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 1. Премахваме : Promise<void>, за да не се кара TS на return-ите
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return; // Просто приключваме функцията
  }

  const { dgs10, dgs2, ecbRate, yieldCurve } = req.body;

  if (typeof dgs10 !== 'number' || typeof dgs2 !== 'number' || typeof ecbRate !== 'number') {
    res.status(400).json({ error: 'Invalid request: missing macro data' });
    return;
  }

  try {
    // Внимание: gemini-1.5-mini не съществува, трябва да е gemini-1.5-flash или gemini-2.0-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this macro data snapshot and provide a 1-sentence market risk assessment:
- 10Y Treasury Yield (DGS10): ${dgs10.toFixed(2)}%
- 2Y Treasury Yield (DGS2): ${dgs2.toFixed(2)}%
- Yield Curve (10Y-2Y): ${(yieldCurve || (dgs10 - dgs2)).toFixed(2)}%
- ECB Main Refinancing Rate: ${ecbRate.toFixed(2)}%

Focus on: inflation expectations, growth signals, and geopolitical risk. Keep response concise (max 20 words).`;

    const result = await model.generateContent(prompt);
    const brief = result.response.text();

    res.status(200).json({
      brief: brief.trim(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[MacroBrief API] Error:', error);
    res.status(500).json({
      error: 'Failed to generate brief',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}