import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/prices
 * Returns current prices for all products, or filtered by ?codes=T63,T76
 *
 * GET /api/prices?codes=T63,T76,T81,T94,T95
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const codesParam = searchParams.get('codes');
    const codes = codesParam
      ? codesParam.split(',').map((c) => c.trim().toUpperCase())
      : ['T63', 'T76', 'T81', 'T94', 'T95'];

    const { data, error } = await supabase
      .from('prices')
      .select('product_code, price, currency, source, updated_at')
      .in('product_code', codes)
      .order('product_code', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ prices: data ?? [], fetched_at: new Date().toISOString() });
  } catch (err: any) {
    console.error('[PricesAPI] GET error:', err.message);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/prices
 * Update one or more product prices.
 * Body: [{ product_code: 'T63', price: 1.25, currency?: 'USD', source?: 'api' }]
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const updates: { product_code: string; price: number; currency?: string; source?: string }[] =
      Array.isArray(body) ? body : [body];

    if (!updates.length) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const results = await Promise.all(
      updates.map(({ product_code, price, currency = 'USD', source = 'api' }) =>
        supabase
          .from('prices')
          .update({ price, currency, source, updated_at: new Date().toISOString() })
          .eq('product_code', product_code.toUpperCase())
          .select()
          .single()
      )
    );

    const errors = results.filter((r) => r.error).map((r) => r.error!.message);
    if (errors.length) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    }

    const updated = results.map((r) => r.data);
    console.log('[PricesAPI] Updated prices:', updated.map((r: any) => r?.product_code));
    return NextResponse.json({ updated });
  } catch (err: any) {
    console.error('[PricesAPI] PATCH error:', err.message);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
