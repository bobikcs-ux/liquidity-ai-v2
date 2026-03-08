/**
 * useModelAccuracy — Live model accuracy computed from intel_feed signals vs market_snapshots
 *
 * Time-Match Logic (4-hour horizon):
 *  1. Fetch the last 10 SIGNAL/AI_SIGNAL rows from intel_feed (predictions)
 *  2. For each signal, find the BTC price at signal.created_at (baseline)
 *  3. Find the BTC price ~4 hours later (outcome)
 *  4. Binary result:
 *     - BULLISH + price went UP   -> 1 (HIT)
 *     - BEARISH + price went DOWN -> 1 (HIT)
 *     - Else                      -> 0 (MISS)
 *  5. Accuracy = Average(results) * 100
 *  6. lastUpdate = created_at of the latest intel_audit_log row
 *  7. Fallback: If < 3 evaluable signals, display "Calibrating..."
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// 4-hour window in milliseconds
const EVALUATION_WINDOW_MS = 4 * 60 * 60 * 1000;

// Minimum evaluable signals required to show a meaningful accuracy
const MIN_SAMPLES_FOR_ACCURACY = 3;

export interface ModelAccuracyResult {
  accuracy: number | null;         // 0–100 or null if calibrating
  hits: number;
  misses: number;
  total: number;
  lastUpdate: Date | null;         // from intel_audit_log
  isLoading: boolean;
  error: string | null;
  sampleSize: number;              // how many predictions were evaluable
  isCalibrating: boolean;          // true if insufficient data for meaningful score
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
    isCalibrating: false,
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
          isCalibrating: true,
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
        const targetOutcomeTime = signalTime + EVALUATION_WINDOW_MS; // 4 hours later

        // Find snapshot closest to signal time (baseline price)
        const baseline = [...snapshots]
          .reverse()
          .find(s => new Date(s.created_at).getTime() <= signalTime);

        // Find snapshot closest to 4 hours after signal (outcome price)
        // Look for the snapshot nearest to targetOutcomeTime
        const outcome = snapshots
          .filter(s => new Date(s.created_at).getTime() > signalTime)
          .reduce<typeof snapshots[0] | null>((best, current) => {
            const currentTime = new Date(current.created_at).getTime();
            const currentDiff = Math.abs(currentTime - targetOutcomeTime);
            if (!best) return current;
            const bestTime = new Date(best.created_at).getTime();
            const bestDiff = Math.abs(bestTime - targetOutcomeTime);
            return currentDiff < bestDiff ? current : best;
          }, null);

        // Skip if we don't have both baseline and outcome, or outcome is too far from 4hr window
        if (!baseline || !outcome || !baseline.btc_price || !outcome.btc_price) continue;

        const outcomeTime = new Date(outcome.created_at).getTime();
        const timeDiff = outcomeTime - signalTime;

        // Skip if outcome is less than 2 hours or more than 8 hours from signal (too early or too late)
        if (timeDiff < 2 * 60 * 60 * 1000 || timeDiff > 8 * 60 * 60 * 1000) continue;

        const priceChange = outcome.btc_price - baseline.btc_price;
        evaluable++;

        // Binary result: 1 if direction matches price movement, 0 otherwise
        const isHit =
          (direction === 'BULLISH' && priceChange > 0) ||
          (direction === 'BEARISH' && priceChange < 0);

        if (isHit) hits++;
        else misses++;
      }

      // Check if we have enough samples for a meaningful score
      const isCalibrating = evaluable < MIN_SAMPLES_FOR_ACCURACY;
      const accuracy = !isCalibrating && evaluable > 0 
        ? Math.round((hits / evaluable) * 100 * 10) / 10 
        : null;

      setResult({
        accuracy,
        hits,
        misses,
        total: signals.length,
        lastUpdate,
        isLoading: false,
        error: evaluable === 0 ? 'Signals lack directional data' : null,
        sampleSize: evaluable,
        isCalibrating,
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
