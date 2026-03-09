import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch prices
  if (req.method === 'GET') {
    try {
      const codes = req.query.codes;
      let query = supabase.from('prices').select('*').order('product_code');

      if (codes && typeof codes === 'string') {
        const codeList = codes.split(',').map((c) => c.trim().toUpperCase());
        query = query.in('product_code', codeList);
      }

      const { data, error } = await query;

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ data, count: data?.length ?? 0, fetched_at: new Date().toISOString() });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH: Bulk update prices
  if (req.method === 'PATCH') {
    try {
      const { updates } = req.body as { updates: { product_code: string; price: number; source?: string }[] };

      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'updates array required' });
      }

      const results = await Promise.all(
        updates.map(async ({ product_code, price, source }) => {
          const { error } = await supabase
            .from('prices')
            .update({ price, source: source ?? 'api', updated_at: new Date().toISOString() })
            .eq('product_code', product_code.toUpperCase());
          return { product_code, success: !error, error: error?.message };
        })
      );

      return res.status(200).json({ results, updated_at: new Date().toISOString() });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
