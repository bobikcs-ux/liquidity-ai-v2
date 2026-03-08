/**
 * useModelAccuracy — Live model accuracy computed from intel_feed signals vs market_snapshots
 *
 * Logic:
 *  1. Fetch the last 10 SIGNAL/AI_SIGNAL rows from intel_feed (predictions)
 *  2. Fetch market_snapshots ordered by created_at to get sequential BTC prices
 *  3. For each prediction, find the market snapshot AFTER the prediction timestamp
 *     and compare price change vs predicted direction
 *  4. HIT = BULLISH + price > 0, or BEARISH + price < 0. MISS = anything else.
 *  5. Accuracy = (hits / total) * 100
 *  6. lastUpdate = created_at of the latest intel_audit_log row
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ModelAccuracyResult {
  accuracy: number | null;         // 0–100
  hits: number;
  misses: number;
  total: number;
  lastUpdate: Date | null;         // from intel_audit_log
  isLoading: boolean;
  error: string | null;
  sampleSize: number;              // how many predictions were evaluable
}

// Extract directional bias from prediction content/title
function extractDirection(title: string, content: string): 'BULLISH' | 'BEARISH' | null {
  const text = `${title} ${content}`.toUpperCase();

  const bullishKeywords = ['BULLISH', 'BUY', 'RESISTANCE BREAK', 'UPSIDE', 'RALLY', 'BREAKOUT', 'PUMP', 'LONG', 'SURGE', 'ACCUMULATION', 'HIGHER', 'TARGET \\$[0-9]'];
  const bearishKeywords = ['BEARISH', 'SELL', 'DOWNSIDE', 'BREAKDOWN', 'CRASH', 'SHORT', 'DROP', 'DECLINE', 'LOWER', 'CORRECTION', 'DUMP'];

  const bullScore = bullishKeywords.filter(kw => {
    try { return new RegExp(kw).test(text); } catch { return text.includes(kw); }
  }).length;

  const bearScore = bearishKeywords.filter(kw => {
    try { return new RegExp(kw).test(text); } catch { return text.includes(kw); }
  }).length;

  if (bullScore > bearScore) return 'BULLISH';
  if (bearScore > bullScore) return 'BEARISH';
  return null; // neutral / undetermined
}

export function useModelAccuracy(): ModelAccuracyResult {
  const [result, setResult] = useState<ModelAccuracyResult>({
    accuracy: null,
    hits: 0,
    misses: 0,
    total: 0,
    lastUpdate: null,
    isLoading: true,
    error: null,
    sampleSize: 0,
  });

  const calculate = useCallback(async () => {
    setResult(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch in parallel: signals, market snapshots, latest audit log entry
      const [signalsRes, snapshotsRes, auditRes] = await Promise.all([
        supabase
          .from('intel_feed')
          .select('type, title, content, severity, created_at')
          .in('type', ['SIGNAL', 'AI_SIGNAL'])
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('market_snapshots')
          .select('btc_price, created_at')
          .order('created_at', { ascending: true })
          .limit(200),

        supabase
          .from('intel_audit_log')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1),
      ]);

      const signals = signalsRes.data ?? [];
      const snapshots = snapshotsRes.data ?? [];
      const latestAudit = auditRes.data?.[0] ?? null;
      const lastUpdate = latestAudit ? new Date(latestAudit.created_at) : null;

      // Need at least 2 snapshots to compute a price change
      if (signals.length === 0 || snapshots.length < 2) {
        setResult({
          accuracy: null,
          hits: 0,
          misses: 0,
          total: signals.length,
          lastUpdate,
          isLoading: false,
          error: signals.length === 0 ? 'No signal predictions found' : 'Insufficient market data',
          sampleSize: 0,
        });
        return;
      }

      let hits = 0;
      let misses = 0;
      let evaluable = 0;

      for (const signal of signals) {
        const direction = extractDirection(signal.title ?? '', signal.content ?? '');
        if (!direction) continue; // skip neutral signals

        const signalTime = new Date(signal.created_at).getTime();

        // Find snapshot just before the signal (baseline price)
        const baseline = [...snapshots]
          .reverse()
          .find(s => new Date(s.created_at).getTime() <= signalTime);

        // Find snapshot AFTER signal (outcome price — at least 1 entry later)
        const outcome = snapshots.find(s => new Date(s.created_at).getTime() > signalTime);

        if (!baseline || !outcome || !baseline.btc_price || !outcome.btc_price) continue;

        const priceChange = outcome.btc_price - baseline.btc_price;
        evaluable++;

        const isHit =
          (direction === 'BULLISH' && priceChange > 0) ||
          (direction === 'BEARISH' && priceChange < 0);

        if (isHit) hits++;
        else misses++;
      }

      const accuracy = evaluable > 0 ? Math.round((hits / evaluable) * 100 * 10) / 10 : null;

      setResult({
        accuracy,
        hits,
        misses,
        total: signals.length,
        lastUpdate,
        isLoading: false,
        error: evaluable === 0 ? 'Signals lack directional data' : null,
        sampleSize: evaluable,
      });
    } catch (err) {
      setResult(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  useEffect(() => {
    calculate();
    // Refresh every 5 minutes
    const interval = setInterval(calculate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  return result;
}
