/**
 * useYieldWall — Quiet yield monitoring without automatic alerts.
 *
 * Polls DGS10 from macro_metrics every 60 seconds.
 * Logs threshold events quietly to console/monitoring only.
 * Does NOT fire broadcast alerts to intel_feed.
 * 
 * The system detects yield crosses but keeps them internal for now.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface YieldWallTrigger {
  id: string;
  trigger_name: string;
  metric: string;
  threshold: number;
  direction: 'ABOVE' | 'BELOW' | 'CROSS';
  alert_severity: string;
  alert_title: string;
  alert_message: string;
  enabled: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
}

export interface YieldWallState {
  triggers: YieldWallTrigger[];
  currentDGS10: number | null;
  isWatching: boolean;
  lastChecked: Date | null;
  breachedThresholds: number[];  // Just the values that were breached, for monitoring only
}

const POLL_INTERVAL_MS = 60_000;            // Check every 60 seconds

export function useYieldWall(): YieldWallState {
  const [state, setState] = useState<YieldWallState>({
    triggers: [],
    currentDGS10: null,
    isWatching: false,
    lastChecked: null,
    breachedThresholds: [],
  });
  const isMounted = useRef(true);

  const checkTriggers = useCallback(async () => {
    if (!supabase) return;

    // Fetch DGS10 and all enabled triggers in parallel
    const [metricsResult, triggersResult] = await Promise.all([
      supabase.from('macro_metrics').select('symbol, value').eq('symbol', 'DGS10').single(),
      supabase.from('yield_wall_triggers').select('*').eq('enabled', true),
    ]);

    if (!isMounted.current) return;

    const dgs10 = metricsResult.data ? Number(metricsResult.data.value) : null;
    const triggers: YieldWallTrigger[] = triggersResult.data ?? [];

    const breachedThresholds: number[] = [];

    if (dgs10 !== null) {
      for (const trigger of triggers) {
        if (trigger.metric !== 'DGS10') continue;

        const breached =
          (trigger.direction === 'ABOVE' && dgs10 >= trigger.threshold) ||
          (trigger.direction === 'BELOW' && dgs10 <= trigger.threshold) ||
          (trigger.direction === 'CROSS' && Math.abs(dgs10 - trigger.threshold) < 0.05);

        if (breached) {
          breachedThresholds.push(trigger.threshold);
          // Log event quietly — no broadcast to intel_feed
          console.log(
            `[YieldWall] Threshold breach detected: ${trigger.trigger_name} at DGS10=${dgs10.toFixed(2)}% (threshold: ${trigger.threshold}%)`
          );
        }
      }
    }

    if (isMounted.current) {
      setState({
        triggers,
        currentDGS10: dgs10,
        isWatching: true,
        lastChecked: new Date(),
        breachedThresholds,
      });
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // Initial check immediately
    checkTriggers();

    // Poll every 60 seconds
    const interval = setInterval(checkTriggers, POLL_INTERVAL_MS);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [checkTriggers]);

  return state;
}
