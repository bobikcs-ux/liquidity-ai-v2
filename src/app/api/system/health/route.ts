import { NextResponse } from 'next/server';

interface ServiceStatus {
  service: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'FALLBACK';
  latency_ms: number;
  last_check: string;
}

/**
 * GET /api/system/health
 * 
 * Returns real-time connectivity status and latency for core services.
 * All measurements are done server-side with actual API/DB calls.
 * No mocked data.
 */
export async function GET() {
  const statuses: ServiceStatus[] = [];
  const now = new Date().toISOString();

  // 1. Check Supabase PostgreSQL connection
  try {
    const startSupabase = Date.now();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      statuses.push({
        service: 'Supabase',
        status: 'OFFLINE',
        latency_ms: 0,
        last_check: now,
      });
    } else {
      // Try a simple query to Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/macro_metrics?select=*&limit=1`, {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      const latencySupabase = Date.now() - startSupabase;
      const supabaseStatus =
        response.ok || response.status === 401
          ? 'ONLINE'
          : response.status === 429
            ? 'DEGRADED'
            : 'OFFLINE';

      statuses.push({
        service: 'Supabase',
        status: supabaseStatus,
        latency_ms: latencySupabase,
        last_check: now,
      });
    }
  } catch (err: any) {
    statuses.push({
      service: 'Supabase',
      status: 'OFFLINE',
      latency_ms: 0,
      last_check: now,
    });
  }

  // 2. Check Resend Email API
  try {
    const startResend = Date.now();
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      statuses.push({
        service: 'Resend',
        status: 'OFFLINE',
        latency_ms: 0,
        last_check: now,
      });
    } else {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      const latencyResend = Date.now() - startResend;
      const resendStatus = response.ok ? 'ONLINE' : response.status === 429 ? 'DEGRADED' : 'OFFLINE';

      statuses.push({
        service: 'Resend',
        status: resendStatus,
        latency_ms: latencyResend,
        last_check: now,
      });
    }
  } catch (err: any) {
    statuses.push({
      service: 'Resend',
      status: 'OFFLINE',
      latency_ms: 0,
      last_check: now,
    });
  }

  // 3. Check Google Generative AI
  try {
    const startGoogle = Date.now();
    const googleApiKey = process.env.VITE_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    if (!googleApiKey) {
      statuses.push({
        service: 'Google AI',
        status: 'OFFLINE',
        latency_ms: 0,
        last_check: now,
      });
    } else {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'ping' }] }],
          }),
          signal: AbortSignal.timeout(8000),
        }
      );

      const latencyGoogle = Date.now() - startGoogle;
      const googleStatus = response.ok ? 'ONLINE' : response.status === 429 ? 'DEGRADED' : 'OFFLINE';

      statuses.push({
        service: 'Google AI',
        status: googleStatus,
        latency_ms: latencyGoogle,
        last_check: now,
      });
    }
  } catch (err: any) {
    statuses.push({
      service: 'Google AI',
      status: 'OFFLINE',
      latency_ms: 0,
      last_check: now,
    });
  }

  // Determine overall health
  const allOnline = statuses.every((s) => s.status === 'ONLINE');
  const anyOffline = statuses.some((s) => s.status === 'OFFLINE');
  const overallStatus = allOnline ? 'HEALTHY' : anyOffline ? 'CRITICAL' : 'DEGRADED';

  return NextResponse.json({
    status: overallStatus,
    timestamp: now,
    services: statuses,
  });
}
