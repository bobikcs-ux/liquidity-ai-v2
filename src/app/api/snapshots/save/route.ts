import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/snapshots/save
 * 
 * Webhook receiver for external data sources to submit market snapshots.
 * Accepts pre-calculated macro and market data and persists to Supabase.
 * 
 * Request body:
 * {
 *   region?: string,
 *   vix?: number,
 *   dgs2?: number,
 *   dgs10?: number,
 *   btc_price?: number,
 *   btc_volatility?: number,
 *   btc_dominance?: number,
 *   fear_greed?: number,
 *   survival_prob?: number,
 *   yield_curve?: number,
 *   systemic_risk?: number,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const snapshotData = {
      region: body.region || null,
      vix: body.vix || null,
      dgs2: body.dgs2 || null,
      dgs10: body.dgs10 || null,
      btc_price: body.btc_price || null,
      btc_volatility: body.btc_volatility || null,
      btc_dominance: body.btc_dominance || null,
      fear_greed: body.fear_greed || null,
      survival_prob: body.survival_prob || null,
      yield_curve: body.yield_curve || null,
      systemic_risk: body.systemic_risk || null,
      fetched_at: new Date().toISOString(),
      data_sources_ok: true,
    };

    const { data, error } = await supabase
      .from('market_snapshots')
      .insert(snapshotData)
      .select()
      .single();

    if (error) {
      console.error('[SnapshotsAPI] Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    console.log('[SnapshotsAPI] New snapshot saved:', snapshotData);

    return NextResponse.json(
      { success: true, snapshot: data },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (err: any) {
    console.error('[SnapshotsAPI] Error:', err.message);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
