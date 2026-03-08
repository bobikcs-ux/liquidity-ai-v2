import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/snapshots/latest
 * 
 * Returns the most recent market snapshot from the database.
 * Used by useMarketSnapshot hook for real-time market data display.
 */
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('market_snapshots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is expected when waiting for first snapshot
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { snapshot: null, message: 'Waiting for first market snapshot...' },
          { status: 200 }
        );
      }
      throw error;
    }

    return NextResponse.json({ snapshot: data }, { status: 200 });
  } catch (err: any) {
    console.error('[SnapshotsLatestAPI] Error:', err.message);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
