/**
 * useYieldWall — Automated broadcast trigger for yield_wall_triggers.
 *
 * Polls DGS10 from macro_metrics every 60 seconds.
 * When DGS10 >= any enabled trigger threshold, it:
 *  1. Fires a CRITICAL intel_feed alert with the configured message
 *  2. Updates yield_wall_triggers.last_triggered_at + trigger_count
 *  3. Exposes the breach state so the UI can render the GLOBAL DEBT COLLAPSE banner
 *
 * The 4.50% "YIELD WALL" trigger is seeded in the DB. Additional triggers can be
 * added directly to yield_wall_triggers and will be picked up automatically.
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
  activeBreach: YieldWallTrigger | null;   // The highest-priority active breach
  currentDGS10: number | null;
  isWatching: boolean;
  lastChecked: Date | null;
}

const POLL_INTERVAL_MS = 60_000;            // Check every 60 seconds
const COOLDOWN_MS = 5 * 60_000;            // Don't re-fire same trigger within 5 min

export function useYieldWall(): YieldWallState {
  const [state, setState] = useState<YieldWallState>({
    triggers: [],
    activeBreach: null,
    currentDGS10: null,
    isWatching: false,
    lastChecked: null,
  });
  const isMounted = useRef(true);
  const firedTriggers = useRef<Set<string>>(new Set()); // prevent duplicate fires in session

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

    let activeBreach: YieldWallTrigger | null = null;

    if (dgs10 !== null) {
      for (const trigger of triggers) {
        if (trigger.metric !== 'DGS10') continue;

        const breached =
          (trigger.direction === 'ABOVE' && dgs10 >= trigger.threshold) ||
          (trigger.direction === 'BELOW' && dgs10 <= trigger.threshold) ||
          (trigger.direction === 'CROSS' && Math.abs(dgs10 - trigger.threshold) < 0.05);

        if (!breached) continue;

        // Check cooldown — don't re-fire if triggered recently in DB
        const lastFired = trigger.last_triggered_at
          ? Date.now() - new Date(trigger.last_triggered_at).getTime()
          : Infinity;
        const sessionFired = firedTriggers.current.has(trigger.id);

        if (lastFired < COOLDOWN_MS || sessionFired) {
          activeBreach = trigger; // Still show breach UI, just don't re-insert
          continue;
        }

        // Fire the broadcast: insert intel_feed alert
        firedTriggers.current.add(trigger.id);
        activeBreach = trigger;

        await Promise.all([
          supabase.from('intel_feed').insert({
            type: 'SYSTEM_ALERT',
            title: trigger.alert_title,
            content: `${trigger.alert_message} [DGS10: ${dgs10.toFixed(2)}%]`,
            severity: trigger.alert_severity,
            created_at: new Date().toISOString(),
          }),
          supabase
            .from('yield_wall_triggers')
            .update({
              last_triggered_at: new Date().toISOString(),
              trigger_count: trigger.trigger_count + 1,
            })
            .eq('id', trigger.id),
          supabase.from('intel_audit_log').insert({
            entity: 'YIELD_WALL',
            action: `TRIGGERED: ${trigger.trigger_name}`,
            status: `DGS10=${dgs10.toFixed(2)}`,
            created_at: new Date().toISOString(),
          }),
        ]);
      }
    }

    if (isMounted.current) {
      setState({
        triggers,
        activeBreach,
        currentDGS10: dgs10,
        isWatching: true,
        lastChecked: new Date(),
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
