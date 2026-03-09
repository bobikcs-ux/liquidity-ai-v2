import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(200).json({
      status: 'degraded',
      supabase: 'not_configured',
      error: 'Missing SUPABASE_URL or SUPABASE_ANON_KEY',
      timestamp: new Date().toISOString(),
      version: '1.3.8',
    });
  }

  try {
    // Test Supabase connection using macro_data table
    const { error } = await supabase.from('macro_data').select('id').limit(1);

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
