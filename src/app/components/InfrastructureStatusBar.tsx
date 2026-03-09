'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, AlertCircle, WifiOff, Wifi, RefreshCw, Database } from 'lucide-react';
import { getFMPProbeUrl, checkForLegacyEndpoint } from '../lib/fmpEndpointManager';

interface DataSourceStatus {
  id: string;
  name: string;
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE' | 'CACHED';
  latencyMs?: number;
  lastChecked: Date;
  lastKnownGood?: Date;
  errorCode?: number;
  probeUrl?: string; // Masked URL for debugging
  errorMessage?: string;
}

interface InfrastructureStatusBarProps {
  refreshInterval?: number;
}

// SANITIZE: Strip any URL fragments if the env var accidentally contains a full URL
function sanitizeApiKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // If the key contains 'apikey=' (e.g., full URL pasted), extract just the key
  if (raw.includes('apikey=')) {
    const extracted = raw.split('apikey=').pop()?.split('&')[0]?.trim();
    if (extracted) return extracted;
  }
  // If the key contains 'http', it's probably a full URL — extract the last path segment or query param
  if (raw.includes('http')) {
    // Try to find a 32-char alphanumeric key anywhere in the string
    const match = raw.match(/[a-zA-Z0-9]{32}/);
    if (match) return match[0];
  }
  // Otherwise return trimmed key
  return raw.trim();
}

// Environment variables — sanitized
const FMP_API_KEY = sanitizeApiKey(import.meta.env.VITE_FMP_API_KEY as string | undefined);
const EIA_API_KEY = sanitizeApiKey(import.meta.env.VITE_EIA_API_KEY as string | undefined);
const FRED_API_KEY = sanitizeApiKey(import.meta.env.VITE_FRED_API_KEY as string | undefined);

// Persistent cache for last known good data
const lastKnownGoodCache = new Map<string, { timestamp: Date; latencyMs: number }>();

// Mask API key for debug display: "sk-abc123xyz" -> "sk-ab...yz"
function maskKey(key: string | undefined): string {
  if (!key) return '[MISSING]';
  if (key.length <= 8) return key.slice(0, 2) + '...' + key.slice(-2);
  return key.slice(0, 4) + '...' + key.slice(-4);
}

async function probeSource(id: string): Promise<{ 
  status: 'ONLINE' | 'DELAYED' | 'OFFLINE' | 'CACHED'; 
  latencyMs: number;
  errorCode?: number;
  probeUrl?: string;
  errorMessage?: string;
}> {
  const start = Date.now();
  
  // Timeout config: EIA gets 10s, others get 8s
  const timeoutMs = id === 'EIA' ? 10000 : 8000;
  
  try {
    let url = '';
    let maskedUrl = '';
    
    switch (id) {
      case 'FMP':
        // FMP requires API key - if missing, report as CACHED (using fallback data)
        const rawFmpKey = import.meta.env.VITE_FMP_API_KEY as string | undefined;
        if (!FMP_API_KEY) {
          return { status: 'CACHED', latencyMs: 0, probeUrl: 'NO_API_KEY', errorMessage: 'VITE_FMP_API_KEY not set or invalid' };
        }
        // Probe WTI futures — same ticker used by fetchOilSpotPrices
        url = `https://financialmodelingprep.com/api/v3/quote/CL=F?apikey=${FMP_API_KEY}`;
        maskedUrl = url.replace(FMP_API_KEY, maskKey(FMP_API_KEY));
        break;
        
      case 'FRED':
        if (!FRED_API_KEY) {
          return { status: 'CACHED', latencyMs: 0, probeUrl: 'NO_API_KEY', errorMessage: 'VITE_FRED_API_KEY not set' };
        }
        // Probe DGS10 (10Y Treasury) — lightweight, single observation
        url = `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
        maskedUrl = url.replace(FRED_API_KEY, maskKey(FRED_API_KEY));
        break;

      case 'ECB':
        if (!FRED_API_KEY) {
          return { status: 'CACHED', latencyMs: 0, probeUrl: 'NO_API_KEY', errorMessage: 'VITE_FRED_API_KEY not set' };
        }
        // Probe ECB Main Refinancing Rate (ECBMAINREF)
        url = `https://api.stlouisfed.org/fred/series/observations?series_id=ECBMAINREF&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
        maskedUrl = url.replace(FRED_API_KEY, maskKey(FRED_API_KEY));
        break;

      case 'BoJ':
        if (!FRED_API_KEY) {
          return { status: 'CACHED', latencyMs: 0, probeUrl: 'NO_API_KEY', errorMessage: 'VITE_FRED_API_KEY not set' };
        }
        // Probe Bank of Japan Policy Rate (INTDSRJPM193N)
        url = `https://api.stlouisfed.org/fred/series/observations?series_id=INTDSRJPM193N&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
        maskedUrl = url.replace(FRED_API_KEY, maskKey(FRED_API_KEY));
        break;

      case 'Supabase': {
        // Probe macro_data table directly (the actual table we use)
        const sbUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
        const sbKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
        
        console.log('[v0] Supabase probe - URL:', sbUrl ? 'SET' : 'MISSING', 'Key:', sbKey ? 'SET' : 'MISSING');
        
        if (!sbUrl || !sbKey) {
          console.warn('[v0] Supabase credentials missing - VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set');
          return { status: 'OFFLINE', latencyMs: 0, probeUrl: 'NO_CREDENTIALS', errorMessage: 'Supabase credentials not set in VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY' };
        }
        url = `${sbUrl}/rest/v1/macro_data?select=region&limit=1`;
        maskedUrl = `${sbUrl}/rest/v1/macro_data?select=region&limit=1`;
        // Supabase REST requires apikey header — use fetch with headers below
        const sbStart = Date.now();
        try {
          const sbRes = await fetch(url, {
            headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
            signal: AbortSignal.timeout(8000),
          });
          const sbLatency = Date.now() - sbStart;
          console.log('[v0] Supabase probe response:', sbRes.status, 'latency:', sbLatency, 'ms');
          if (sbRes.ok) {
            lastKnownGoodCache.set('Supabase', { timestamp: new Date(), latencyMs: sbLatency });
            return { status: sbLatency > 4000 ? 'DELAYED' : 'ONLINE', latencyMs: sbLatency, probeUrl: maskedUrl };
          }
          const errorBody = await sbRes.text().catch(() => '');
          console.error('[v0] Supabase probe failed:', sbRes.status, errorBody);
          return { status: 'OFFLINE', latencyMs: sbLatency, errorCode: sbRes.status, probeUrl: maskedUrl, errorMessage: `HTTP ${sbRes.status}: ${errorBody.slice(0, 100)}` };
        } catch (err) {
          const sbLatency = Date.now() - sbStart;
          console.error('[v0] Supabase probe error:', err);
          const sbCached = lastKnownGoodCache.get('Supabase');
          return sbCached
            ? { status: 'CACHED', latencyMs: sbLatency, probeUrl: maskedUrl, errorMessage: 'Network error - using cached' }
            : { status: 'OFFLINE', latencyMs: sbLatency, probeUrl: maskedUrl, errorMessage: err instanceof Error ? err.message : 'Network error' };
        }
      }

      case 'DefiLlama':
        // DefiLlama is public, no auth needed
        url = 'https://stablecoins.llama.fi/stablecoins?includePrices=false';
        maskedUrl = url;
        break;
        
      case 'EIA':
        // Use actual EIA API key if available, otherwise use demo key with longer timeout
        const eiaKey = EIA_API_KEY || 'DEMO_KEY';
        url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${eiaKey}&length=1`;
        maskedUrl = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${maskKey(eiaKey)}&length=1`;
        break;
        
      case 'ACLED':
        // ACLED API requires auth - we mark as CACHED since we use static conflict data
        // Don't actually probe ACLED - it requires registration
        return { status: 'CACHED', latencyMs: 0, probeUrl: 'STATIC_DATA', errorMessage: 'Using static conflict data' };
        
      case 'DBnomics':
        url = 'https://api.db.nomics.world/v22/providers?limit=1';
        maskedUrl = url;
        break;
        
      default:
        return { status: 'OFFLINE', latencyMs: 0, probeUrl: 'UNKNOWN', errorMessage: 'Unknown source' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const res = await fetch(url, { 
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;
    
    // Check for "Legacy Endpoint" message (FMP) and auto-switch
    if (id === 'FMP' && res.status === 200) {
      try {
        const text = await res.text();
        checkForLegacyEndpoint(text);
      } catch {
        // Ignore parse errors
      }
    }
    
    // Check for auth/rate limit errors
    if (res.status === 401) {
      return { status: 'OFFLINE', latencyMs, errorCode: 401, probeUrl: maskedUrl, errorMessage: 'Unauthorized - check API key' };
    }
    if (res.status === 403) {
      return { status: 'OFFLINE', latencyMs, errorCode: 403, probeUrl: maskedUrl, errorMessage: 'Forbidden - API key may be invalid or expired' };
    }
    if (res.status === 429) {
      // Rate limited - return DELAYED with cached data indicator
      const cached = lastKnownGoodCache.get(id);
      if (cached) {
        return { status: 'CACHED', latencyMs, errorCode: 429, probeUrl: maskedUrl, errorMessage: 'Rate limited - using cached data' };
      }
      return { status: 'DELAYED', latencyMs, errorCode: 429, probeUrl: maskedUrl, errorMessage: 'Rate limited' };
    }
    
    if (res.ok) {
      // Store last known good
      lastKnownGoodCache.set(id, { timestamp: new Date(), latencyMs });
      
      const status = latencyMs > 4000 ? 'DELAYED' : 'ONLINE';
      return { status, latencyMs, probeUrl: maskedUrl };
    }
    
    // Non-OK response - check if we have cached data
    const cached = lastKnownGoodCache.get(id);
    if (cached) {
      return { status: 'CACHED', latencyMs, errorCode: res.status, probeUrl: maskedUrl, errorMessage: `HTTP ${res.status} - using cached` };
    }
    
    return { status: 'OFFLINE', latencyMs, errorCode: res.status, probeUrl: maskedUrl, errorMessage: `HTTP ${res.status}` };
    
  } catch (err) {
    const latencyMs = Date.now() - start;
    const errorMessage = err instanceof Error ? err.message : 'Network error';
    
    // On error, check if we have cached data to fall back to
    const cached = lastKnownGoodCache.get(id);
    if (cached) {
      return { status: 'CACHED', latencyMs, probeUrl: maskedUrl, errorMessage: `${errorMessage} - using cached` };
    }
    
    return { status: 'OFFLINE', latencyMs, probeUrl: maskedUrl, errorMessage };
  }
}

const SOURCES: { id: string; name: string }[] = [
  { id: 'FRED', name: 'FRED' },
  { id: 'ECB', name: 'ECB' },
  { id: 'BoJ', name: 'BoJ' },
  { id: 'Supabase', name: 'Supabase' },
  { id: 'FMP', name: 'FMP' },
  { id: 'DefiLlama', name: 'DefiLlama' },
  { id: 'EIA', name: 'EIA' },
  { id: 'ACLED', name: 'ACLED' },
  { id: 'DBnomics', name: 'DBnomics' },
];

export function InfrastructureStatusBar({ refreshInterval = 5 * 60 * 1000 }: InfrastructureStatusBarProps) {
  const [sources, setSources] = useState<DataSourceStatus[]>(
    SOURCES.map(s => ({ ...s, status: 'ONLINE', lastChecked: new Date() }))
  );
  const [checking, setChecking] = useState(false);
  const isFirstCheck = useRef(true);

  const checkAll = useCallback(async () => {
    setChecking(true);
    
    const results = await Promise.allSettled(SOURCES.map(s => probeSource(s.id)));
    
    setSources(prev => SOURCES.map((s, i) => {
      const r = results[i];
      const resolved = r.status === 'fulfilled' 
        ? r.value 
        : { status: 'OFFLINE' as const, latencyMs: 0, errorMessage: 'Promise rejected' };
      
      // Preserve lastKnownGood from previous state if this check failed
      const prevSource = prev.find(p => p.id === s.id);
      const lastKnownGood = resolved.status === 'ONLINE' 
        ? new Date() 
        : prevSource?.lastKnownGood || (resolved.status === 'CACHED' ? new Date() : undefined);
      
      return { 
        ...s, 
        status: resolved.status, 
        latencyMs: resolved.latencyMs, 
        lastChecked: new Date(),
        lastKnownGood,
        errorCode: resolved.errorCode,
        probeUrl: resolved.probeUrl,
        errorMessage: resolved.errorMessage,
      };
    }));
    
    setChecking(false);
    isFirstCheck.current = false;
  }, []);

  useEffect(() => {
    checkAll();
    const iv = setInterval(checkAll, refreshInterval);
    return () => clearInterval(iv);
  }, [checkAll, refreshInterval]);

  const offlineCount = sources.filter(s => s.status === 'OFFLINE').length;
  const delayedCount = sources.filter(s => s.status === 'DELAYED').length;
  const cachedCount = sources.filter(s => s.status === 'CACHED').length;
  
  const systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' =
    offlineCount >= 2 ? 'CRITICAL'
    : offlineCount > 0 || delayedCount >= 2 ? 'DEGRADED'
    : cachedCount > 0 ? 'DEGRADED'
    : 'HEALTHY';

  const healthColor =
    systemHealth === 'HEALTHY' ? '#2ecc71'
    : systemHealth === 'DEGRADED' ? '#ffb020'
    : '#ff3b5c';

  const statusColor = (s: 'ONLINE' | 'DELAYED' | 'OFFLINE' | 'CACHED') => {
    switch (s) {
      case 'ONLINE': return '#2ecc71';
      case 'DELAYED': return '#ffb020';
      case 'CACHED': return '#60a5fa'; // Blue for cached/fallback
      case 'OFFLINE': return '#ff3b5c';
    }
  };

  const StatusIcon = ({ s }: { s: 'ONLINE' | 'DELAYED' | 'OFFLINE' | 'CACHED' }) => {
    switch (s) {
      case 'ONLINE': return <Activity className="w-3 h-3" />;
      case 'DELAYED': return <AlertCircle className="w-3 h-3" />;
      case 'CACHED': return <Database className="w-3 h-3" />;
      case 'OFFLINE': return <WifiOff className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (ds: DataSourceStatus) => {
    if (ds.status === 'CACHED') {
      return ds.lastKnownGood 
        ? `CACHED (${ds.lastKnownGood.toLocaleTimeString()})` 
        : 'FALLBACK';
    }
    if (ds.errorCode === 401) return 'AUTH ERROR';
    if (ds.errorCode === 429) return 'RATE LIMITED';
    return ds.status;
  };

  return (
    <div
      className="w-full border-b px-4 py-2"
      style={{ background: '#09090b', borderColor: 'rgba(212,175,55,0.08)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-4 gap-y-1">
        {/* System Health */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Wifi className="w-3.5 h-3.5" style={{ color: healthColor }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: healthColor }}>
            {systemHealth}
          </span>
          {checking && (
            <span className="text-[10px]" style={{ color: '#a1a1aa' }}>checking...</span>
          )}
        </div>

        <span className="text-[#d4af37]/20 hidden sm:block">|</span>

        {/* Per-source badges */}
        <div className="flex flex-wrap items-center gap-2">
          {sources.map(ds => (
            <div
              key={ds.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
              style={{
                border: `1px solid ${statusColor(ds.status)}35`,
                background: `${statusColor(ds.status)}0d`,
                color: statusColor(ds.status),
              }}
              title={`${ds.name}: ${getStatusLabel(ds)}${ds.latencyMs ? ` (${ds.latencyMs}ms)` : ''}${ds.errorCode ? ` [HTTP ${ds.errorCode}]` : ''}${ds.errorMessage ? ` — ${ds.errorMessage}` : ''}\nURL: ${ds.probeUrl || 'N/A'}\nChecked: ${ds.lastChecked.toLocaleTimeString()}`}
            >
              <StatusIcon s={ds.status} />
              <span>{ds.name}</span>
              <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>
                {ds.status === 'CACHED' ? 'FALLBACK' : ds.status}
              </span>
              {ds.latencyMs !== undefined && ds.latencyMs > 0 && ds.status !== 'CACHED' && (
                <span style={{ opacity: 0.45 }}>{ds.latencyMs}ms</span>
              )}
            </div>
          ))}
        </div>

        {/* RETRY Button */}
        <button
          onClick={() => checkAll()}
          disabled={checking}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-all ml-auto shrink-0"
          style={{
            background: checking ? 'rgba(212,175,55,0.05)' : 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.3)',
            color: '#d4af37',
            opacity: checking ? 0.5 : 1,
            cursor: checking ? 'not-allowed' : 'pointer',
          }}
          title="Manually retry all data source connections"
        >
          <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">RETRY</span>
        </button>
      </div>
    </div>
  );
}

export default InfrastructureStatusBar;
