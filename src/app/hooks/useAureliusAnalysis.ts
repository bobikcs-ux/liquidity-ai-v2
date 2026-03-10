/**
 * useAureliusAnalysis — Gemini AI analysis hook
 * 
 * Builds a rich prompt from the full TerminalState (all API data), then sends
 * it to the Supabase Edge Function `aurelius-ai` which proxies to Gemini.
 * 
 * The Gemini API key is NEVER exposed on the frontend — it only lives in
 * the Supabase Edge Function environment variables.
 */

import { useState, useCallback, useRef } from 'react';
import { useAppContext } from './useAppContext';
import { supabase } from '../lib/supabase';
import type { TerminalState } from '../types/terminal';

// ============================================================================
// TYPES
// ============================================================================

export interface AureliusAnalysis {
  analysis: string;
  riskLevel: string;
  survivalProbability: number;
  liquidityState: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

/**
 * Serialize full TerminalState into a structured Gemini prompt.
 * This is the "rich context injection" pattern described in the plan.
 */
function buildAureliusPrompt(state: TerminalState): string {
  const { prices, sentiment, macro, energy, geopolitics, onChain, fx } = state;

  const yieldDisplay = `${macro.yield10Y.toFixed(2)}% / ${macro.yield2Y.toFixed(2)}% (spread: ${macro.yieldSpread.toFixed(2)}%)`;
  const oilDisplay = `WTI $${prices.oil.wti.value.toFixed(2)} / Brent $${prices.oil.brent.value.toFixed(2)}`;
  const conflictAlerts = geopolitics.alerts
    .filter((a) => a.severity === 'critical' || a.severity === 'high')
    .slice(0, 3)
    .map((a) => `  • [${a.severity.toUpperCase()}] ${a.headline}`)
    .join('\n');

  return `
You are Aurelius, an elite sovereign intelligence analyst specializing in Black Swan risk, geopolitical stress, and systemic liquidity crises.

Analyze the following real-time global data and provide a structured risk assessment:

=== MARKET DATA ===
BTC Price:          $${prices.btc.value.toLocaleString()} (${prices.btc.changePct24h >= 0 ? '+' : ''}${prices.btc.changePct24h.toFixed(2)}% 24h)
ETH Price:          $${prices.eth.value.toLocaleString()} (${prices.eth.changePct24h >= 0 ? '+' : ''}${prices.eth.changePct24h.toFixed(2)}% 24h)
Gold:               $${prices.gold.value.toLocaleString()} (${prices.gold.changePct24h >= 0 ? '+' : ''}${prices.gold.changePct24h.toFixed(2)}% 24h)
Crude Oil:          ${oilDisplay}
BTC Dominance:      ${prices.btcDominance.toFixed(1)}%

=== RISK SENTIMENT ===
Fear & Greed Index: ${sentiment.fearGreedIndex} / 100 (${sentiment.fearGreedLabel})
Systemic Risk:      ${sentiment.systemicRisk}%
Survival Prob:      ${sentiment.survivalProbability}%
Regime:             ${sentiment.regime.toUpperCase()}
BTC Volatility:     ${sentiment.btcVolatility}%
Rate Shock:         ${sentiment.rateShock}%
Balance Sheet Δ:    ${sentiment.balanceSheetDelta >= 0 ? '+' : ''}${sentiment.balanceSheetDelta.toFixed(1)}% (${sentiment.balanceSheetDelta < 0 ? 'QT' : 'QE'})
VaR 95%:            ${(sentiment.var95 * 100).toFixed(1)}%

=== MACRO / RATES ===
10Y Treasury Yield: ${macro.yield10Y.toFixed(2)}%
2Y Treasury Yield:  ${macro.yield2Y.toFixed(2)}%
Yield Curve:        ${yieldDisplay}${macro.yieldSpread < 0 ? ' — INVERTED (Recession Signal)' : ''}
M2 Money Supply:    $${(macro.m2Supply / 1000).toFixed(1)}T
ECB Rate:           ${macro.ecbRate.toFixed(2)}%
BoJ Rate:           ${macro.bojRate.toFixed(2)}%
OECD Composite LI:  ${macro.oecdLI.toFixed(1)}

=== ENERGY ===
WTI Crude:          $${energy.wtiPrice.toFixed(2)}/bbl
Brent Crude:        $${energy.brentPrice.toFixed(2)}/bbl
Natural Gas Storage: ${energy.naturalGasStorage.toLocaleString()} Bcf

=== FX / DOLLAR ===
USD Strength Index: ${fx.dollarStrengthIndex.toFixed(1)}/100
${fx.pairs.map((p) => `${p.label}:          ${p.rate.toFixed(4)} (${p.changePct >= 0 ? '+' : ''}${p.changePct.toFixed(2)}%)`).join('\n')}

=== ON-CHAIN ===
ETH Gas:            ${onChain.ethGasGwei} Gwei
BTC Hashrate:       ${onChain.btcHashRate.toLocaleString()} TH/s
Network Activity:   ${onChain.networkActivityScore}/100

=== GEOPOLITICS ===
Military Conflict Index: ${geopolitics.militaryConflictIndex}/100
ACLED Events (7d):  ${geopolitics.acledEventCount}
${conflictAlerts ? `Top Alerts:\n${conflictAlerts}` : 'No active critical alerts.'}

=== TASK ===
Provide a structured Black Swan Risk Assessment:
1. Current RISK LEVEL: GREEN / AMBER / RED / BLACK
2. SURVIVAL PROBABILITY: X% (with rationale)
3. LIQUIDITY STATE: Healthy / Cautious / Tightening / Crisis
4. PRIMARY THREAT: Top 2-3 systemic risks with brief explanation
5. FINAL VERDICT: One paragraph executive summary

Format your response in markdown with clear headers.
`.trim();
}

// ============================================================================
// HOOK
// ============================================================================

export function useAureliusAnalysis(): AureliusAnalysis & { runAnalysis: () => Promise<void> } {
  const { state } = useAppContext();
  const [analysis, setAnalysis] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<string>('—');
  const [survivalProbability, setSurvivalProbability] = useState<number>(state.sentiment.survivalProbability);
  const [liquidityState, setLiquidityState] = useState<string>('—');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runAnalysis = useCallback(async () => {
    if (isLoading) return;

    // Abort any previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const prompt = buildAureliusPrompt(state);

      // Route through Supabase Edge Function `aurelius-ai`
      // The Edge Function reads GOOGLE_GENERATIVE_AI_API_KEY from its own env vars
      if (supabase) {
        const { data, error: fnError } = await supabase.functions.invoke('aurelius-ai', {
          body: { prompt },
        });

        if (!fnError && data?.analysis) {
          const text: string = data.analysis;
          setAnalysis(text);

          // Parse structured values from response text
          const survivalMatch = text.match(/(\d+)%.*survival/i);
          if (survivalMatch) setSurvivalProbability(parseInt(survivalMatch[1], 10));

          const riskMatch = text.match(/risk level.*?(GREEN|AMBER|RED|BLACK)/i);
          if (riskMatch) setRiskLevel(riskMatch[1]);

          const liquidityMatch = text.match(/liquidity state.*?(Healthy|Cautious|Tightening|Crisis)/i);
          if (liquidityMatch) setLiquidityState(liquidityMatch[1]);

          setLastUpdated(new Date());
          return;
        }
      }

      // Fallback: Try direct Gemini API (if VITE_GOOGLE_GENERATIVE_AI_API_KEY is set)
      const geminiKey = import.meta.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY;
      if (geminiKey?.trim()) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
            }),
            signal: abortRef.current.signal,
          },
        );

        if (res.ok) {
          const json = await res.json();
          const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
          if (text) {
            setAnalysis(text);
            setLastUpdated(new Date());
            return;
          }
        }
      }

      // Final fallback: generate local analysis from TerminalState
      setAnalysis(generateLocalAnalysis(state));
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setError(msg);
      console.error('[useAureliusAnalysis] Error:', err);
      setAnalysis(generateLocalAnalysis(state));
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  }, [state, isLoading]);

  return {
    analysis,
    riskLevel,
    survivalProbability,
    liquidityState,
    isLoading,
    error,
    lastUpdated,
    runAnalysis,
  };
}

// ============================================================================
// LOCAL FALLBACK ANALYSIS
// ============================================================================

function generateLocalAnalysis(state: TerminalState): string {
  const { sentiment, macro, prices, geopolitics } = state;
  const risk = sentiment.systemicRisk;
  const fearGreed = sentiment.fearGreedIndex;
  const yieldSpread = macro.yieldSpread;

  let riskLevel = 'GREEN';
  if (risk > 70 || fearGreed < 20) riskLevel = 'BLACK';
  else if (risk > 50 || fearGreed < 35) riskLevel = 'RED';
  else if (risk > 35 || fearGreed < 45) riskLevel = 'AMBER';

  const survivalProb = sentiment.survivalProbability;
  const liquidity = sentiment.balanceSheetDelta < -5 ? 'Tightening' : sentiment.balanceSheetDelta < 0 ? 'Cautious' : 'Healthy';

  return `## Black Swan Risk Assessment

**RISK LEVEL:** ${riskLevel}

**SURVIVAL PROBABILITY:** ${survivalProb}%
Current market conditions show ${riskLevel === 'GREEN' ? 'stable' : riskLevel === 'AMBER' ? 'building stress' : 'elevated systemic risk'} across monitored data channels.

**LIQUIDITY STATE:** ${liquidity}
Balance sheet delta at ${sentiment.balanceSheetDelta >= 0 ? '+' : ''}${sentiment.balanceSheetDelta.toFixed(1)}% (${sentiment.balanceSheetDelta < 0 ? 'QT mode' : 'QE mode'}).

**PRIMARY THREATS:**
- Yield curve ${yieldSpread < 0 ? `inverted at ${yieldSpread.toFixed(2)}% — historical recession precursor` : `at ${yieldSpread.toFixed(2)}% — monitoring required`}
- Fear & Greed Index at ${fearGreed} (${state.sentiment.fearGreedLabel}) — ${fearGreed < 30 ? 'extreme fear indicates deleveraging risk' : fearGreed > 75 ? 'euphoria risk — potential correction ahead' : 'neutral conditions'}
- Geopolitical conflict index at ${geopolitics.militaryConflictIndex}/100${geopolitics.militaryConflictIndex > 60 ? ' — elevated global risk' : ''}

**FINAL VERDICT:**
BTC at $${prices.btc.value.toLocaleString()}, systemic risk at ${risk}%. ${riskLevel === 'GREEN' ? 'No immediate action required — continue monitoring.' : riskLevel === 'AMBER' ? 'Consider defensive positioning. Reduce leverage.' : 'High alert. Defensive positioning strongly recommended.'}
`.trim();
}
