import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel Cron Job to trigger the Supabase Edge Function every 5 minutes
// This calls the market-worker function on the structural-core-db project (ssrvswohtexhpihqcbak)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request (Vercel adds this header)
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow requests from Vercel Cron (no auth needed) or with valid secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Skip auth check for Vercel Cron jobs which don't send authorization
    if (req.headers['x-vercel-cron'] !== '1') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Call the Supabase Edge Function
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL not configured');
    }

    // Extract project ref from URL (e.g., https://ssrvswohtexhpihqcbak.supabase.co)
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    
    if (!projectRef) {
      throw new Error('Could not extract project ref from SUPABASE_URL');
    }

    const edgeFunctionUrl = `https://${projectRef}.supabase.co/functions/v1/market-worker`;
    
    console.log(`Calling edge function: ${edgeFunctionUrl}`);

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(supabaseServiceKey && { 'Authorization': `Bearer ${supabaseServiceKey}` }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Edge function error:', data);
      return res.status(response.status).json({ 
        error: 'Edge function failed', 
        details: data 
      });
    }

    console.log('Market snapshot created:', data.snapshot?.id);

    return res.status(200).json({
      success: true,
      message: 'Market snapshot triggered',
      snapshotId: data.snapshot?.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      error: 'Failed to trigger market snapshot',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
