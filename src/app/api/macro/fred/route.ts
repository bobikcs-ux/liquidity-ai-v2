import { NextResponse } from 'next/server';

/**
 * GET /api/macro/fred?series=DGS10
 * 
 * Server-side FRED API proxy with real credentials.
 * Never exposes API key to frontend.
 * Returns structured macro metric with live status.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const seriesId = url.searchParams.get('series');

  if (!seriesId) {
    return NextResponse.json(
      { error: 'Missing series parameter' },
      { status: 400 }
    );
  }

  const fredKey = process.env.FRED_API_KEY || process.env.VITE_FRED_API_KEY;
  if (!fredKey) {
    return NextResponse.json(
      { error: 'FRED_API_KEY not configured', status: 'OFFLINE' },
      { status: 503 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=${encodeURIComponent(
        seriesId
      )}&api_key=${fredKey}&limit=1&sort_order=desc`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'FRED rate limited', status: 'DEGRADED', seriesId },
          { status: 429 }
        );
      }
      if (response.status === 400 || response.status === 404) {
        return NextResponse.json(
          { error: `Invalid series: ${seriesId}`, status: 'OFFLINE' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `FRED error: ${response.statusText}`, status: 'OFFLINE' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const observations = data.observations || [];

    if (observations.length === 0) {
      return NextResponse.json(
        { error: 'No data for series', status: 'OFFLINE', seriesId },
        { status: 404 }
      );
    }

    const latestValue = parseFloat(observations[0].value);
    if (isNaN(latestValue)) {
      return NextResponse.json(
        { error: 'Invalid value in FRED response', status: 'OFFLINE' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: 'LIVE',
      seriesId,
      value: latestValue,
      date: observations[0].date,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'FRED request timeout', status: 'OFFLINE', seriesId },
        { status: 504 }
      );
    }

    console.error(`[FRED API] Error fetching ${seriesId}:`, err.message);
    return NextResponse.json(
      { error: `FRED fetch failed: ${err.message}`, status: 'OFFLINE', seriesId },
      { status: 502 }
    );
  }
}
