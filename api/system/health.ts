import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test Supabase connection
    const { error } = await supabase.from('market_snapshots').select('id').limit(1);

    return res.status(200).json({
      status: error ? 'degraded' : 'healthy',
      supabase: error ? 'error' : 'connected',
      timestamp: new Date().toISOString(),
      version: '1.3.8',
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}
