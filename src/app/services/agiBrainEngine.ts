/**
 * AGI DEFENSE INTELLIGENCE ENGINE
 * 10-Layer Strategic Intelligence System
 * 
 * L10 — Strategic Civilization Forecast Intelligence
 * L9  — Geoeconomic Warfare Prediction AI
 * L8  — Sovereign Monetary Power Modeling
 * L7  — Global Conflict Transmission AGI
 * L6  — Capital Defense Autonomous Execution
 * L5  — Macro Liquidity Neural Intelligence
 * L4  — Market Microstructure Consciousness
 * L3  — Crowd Psychology AI
 * L2  — Regime Evolution Prediction
 * L1  — Real-Time Global Data Nervous System
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SovereignPowerMetrics {
  reserveCurrencyShare: number;      // 0-100
  tradeSettlementVolume: number;     // 0-100
  capitalControlStrength: number;    // 0-100
  digitalCurrencyAdoption: number;   // 0-100
  sovereignPowerIndex: number;       // Calculated
}

export interface CivilizationMetrics {
  demographicHealth: number;         // 0-100
  economicSustainability: number;    // 0-100
  technologicalAdaptation: number;   // 0-100
  geopoliticalStability: number;     // 0-100
  civilizationScore: number;         // Calculated
}

export interface DefenseMetrics {
  defenseScore: number;              // 0-1
  survivalProbability: number;       // 0-1
  systemicRiskIndex: number;         // 0-1
  geopoliticalRiskIndex: number;     // 0-1
  volatilityExpansionProb: number;   // 0-1
  autonomousActions: DefenseAction[];
}

export interface DefenseAction {
  id: string;
  action: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  impact: string;
  allocation?: string;
}

export interface LiquidityBrainMetrics {
  m2GrowthVelocity: number;
  realYieldGrowth: number;
  creditSpreadExpansion: number;
  liquidityBrainIndex: number;       // Calculated
  contractionWarning: boolean;
}

export interface RegimeMetrics {
  regimeSpeed: number;
  liquidityVelocityDelta: number;
  volatilityStructureDelta: number;
  correlationConvergenceDelta: number;
  currentPhase: 'EXPANSION' | 'CONTRACTION' | 'BUBBLE' | 'CRISIS';
}

export interface BlackSwanMetrics {
  volatilityShockRate: number;       // 0-1
  correlationCollapseSpeed: number;  // 0-1
  liquidityDrainVelocity: number;    // 0-1
  blackSwanRisk: number;             // Calculated 0-1
  emergencyMode: boolean;
}

export interface MarketEmotionMetrics {
  momentumChasingIntensity: number;  // 0-100
  socialNarrativeAmplification: number; // 0-100
  retailCapitalFlowRate: number;     // 0-100
  leverageGrowthRate: number;        // 0-100
  bubbleRisk: number;                // Calculated
}

export interface AGISystemState {
  sovereign: SovereignPowerMetrics;
  civilization: CivilizationMetrics;
  defense: DefenseMetrics;
  liquidity: LiquidityBrainMetrics;
  regime: RegimeMetrics;
  blackSwan: BlackSwanMetrics;
  emotion: MarketEmotionMetrics;
  lastUpdate: Date;
  nervousSystemStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
}

// ============================================================================
// L8 — SOVEREIGN MONETARY POWER MODELING
// ============================================================================

export function calculateSovereignPower(
  reserveCurrencyShare: number,
  tradeSettlementVolume: number,
  capitalControlStrength: number
): number {
  // SovereignPower = ReserveCurrencyShare * 0.4 + TradeSettlementVolume * 0.3 + CapitalControlStrength * 0.3
  return (
    (reserveCurrencyShare / 100) * 0.4 +
    (tradeSettlementVolume / 100) * 0.3 +
    (capitalControlStrength / 100) * 0.3
  ) * 100;
}

// ============================================================================
// L10 — CIVILIZATION FORECAST
// ============================================================================

export function calculateCivilizationScore(
  demographicHealth: number,
  economicSustainability: number,
  technologicalAdaptation: number,
  geopoliticalStability: number
): number {
  // CivilizationScore = DemographicHealth + EconomicSustainability + TechnologicalAdaptation + GeopoliticalStability
  return (demographicHealth + economicSustainability + technologicalAdaptation + geopoliticalStability) / 4;
}

// ============================================================================
// L6 — CAPITAL DEFENSE AUTONOMOUS EXECUTION
// ============================================================================

export function calculateDefenseScore(
  survivalProbability: number,
  systemicRiskIndex: number,
  geopoliticalRiskIndex: number,
  volatilityExpansionProb: number
): number {
  // DefenseScore = (1 - SurvivalProbability) * 0.35 + SystemicRiskIndex * 0.25 + GeopoliticalRiskIndex * 0.25 + VolatilityExpansionProbability * 0.15
  return (
    (1 - survivalProbability) * 0.35 +
    systemicRiskIndex * 0.25 +
    geopoliticalRiskIndex * 0.25 +
    volatilityExpansionProb * 0.15
  );
}

export function getAutonomousDefenseActions(defenseScore: number): DefenseAction[] {
  if (defenseScore <= 0.3) {
    return [
      { id: 'hold', action: 'MAINTAIN CURRENT ALLOCATION', priority: 'LOW', impact: 'No action required' }
    ];
  }
  
  if (defenseScore <= 0.5) {
    return [
      { id: 'monitor', action: 'INCREASE MONITORING FREQUENCY', priority: 'MEDIUM', impact: 'Enhanced surveillance' },
      { id: 'review', action: 'REVIEW STOP-LOSS LEVELS', priority: 'MEDIUM', impact: 'Risk containment' }
    ];
  }
  
  // DefenseScore > 0.5 — STRATEGIC PIVOT REQUIRED
  return [
    { id: 'liquidity', action: 'INCREASE LIQUIDITY BUFFER', priority: 'CRITICAL', impact: '+15% cash allocation', allocation: '15%' },
    { id: 'hedge', action: 'ADD INFLATION HEDGE ASSETS', priority: 'HIGH', impact: 'Gold/TIPS allocation', allocation: '10%' },
    { id: 'geo', action: 'REDUCE GEOPOLITICAL EXPOSURE', priority: 'HIGH', impact: 'EM equity reduction', allocation: '-20%' },
    { id: 'corr', action: 'LOWER CORRELATION ASSETS', priority: 'HIGH', impact: 'Uncorrelated alternatives', allocation: '8%' },
    { id: 'vol', action: 'VOLATILITY PROTECTION', priority: 'CRITICAL', impact: 'Put spreads / VIX calls', allocation: '5%' }
  ];
}

// ============================================================================
// L5 — MACRO LIQUIDITY NEURAL INTELLIGENCE
// ============================================================================

export function calculateLiquidityBrain(
  m2GrowthVelocity: number,
  realYieldGrowth: number,
  creditSpreadExpansion: number
): { index: number; warning: boolean } {
  // LiquidityBrain = M2GrowthVelocity - RealYieldGrowth - CreditSpreadExpansionRate
  const index = m2GrowthVelocity - realYieldGrowth - creditSpreadExpansion;
  return {
    index,
    warning: index < 0 // Contraction warning when negative
  };
}

// ============================================================================
// L2 — REGIME EVOLUTION PREDICTION
// ============================================================================

export function calculateRegimeSpeed(
  liquidityVelocityDelta: number,
  volatilityStructureDelta: number,
  correlationConvergenceDelta: number
): number {
  // RegimeSpeed = Δ LiquidityVelocity + Δ VolatilityStructure + Δ CorrelationConvergence
  return Math.abs(liquidityVelocityDelta) + Math.abs(volatilityStructureDelta) + Math.abs(correlationConvergenceDelta);
}

export function determineRegimePhase(
  liquidityBrain: number,
  regimeSpeed: number,
  bubbleRisk: number
): 'EXPANSION' | 'CONTRACTION' | 'BUBBLE' | 'CRISIS' {
  if (liquidityBrain < -2 && regimeSpeed > 5) return 'CRISIS';
  if (bubbleRisk > 70) return 'BUBBLE';
  if (liquidityBrain < 0) return 'CONTRACTION';
  return 'EXPANSION';
}

// ============================================================================
// BLACK SWAN AGI WAR ENGINE
// ============================================================================

export function calculateBlackSwanRisk(
  volatilityShockRate: number,
  correlationCollapseSpeed: number,
  liquidityDrainVelocity: number
): { risk: number; emergency: boolean } {
  // BlackSwanRisk = (VolatilityShockRate * 0.25) + (CorrelationCollapseSpeed * 0.25) + (LiquidityDrainVelocity * 0.50)
  const risk = 
    volatilityShockRate * 0.25 +
    correlationCollapseSpeed * 0.25 +
    liquidityDrainVelocity * 0.50;
  
  return {
    risk,
    emergency: risk > 0.8 // TACTICAL RED-OUT when > 0.8
  };
}

// ============================================================================
// L4 & L3 — MARKET MICROSTRUCTURE & CROWD PSYCHOLOGY
// ============================================================================

export function calculateMarketEmotion(
  momentumChasing: number,
  socialNarrative: number
): number {
  // MarketEmotion = MomentumChasingIntensity + SocialNarrativeAmplification
  return (momentumChasing + socialNarrative) / 2;
}

export function calculateBubbleRisk(
  retailCapitalFlow: number,
  leverageGrowth: number
): number {
  // BubbleRisk = RetailCapitalFlowRate + LeverageGrowthRate
  return (retailCapitalFlow + leverageGrowth) / 2;
}

// ============================================================================
// FULL AGI SYSTEM STATE CALCULATOR
// ============================================================================

export function computeAGISystemState(
  marketData: {
    survivalProbability: number | null | undefined;
    systemicRisk: number | null | undefined;
    yieldSpread: number | null | undefined;
    btcVolatility: number | null | undefined;
    balanceSheetDelta: number | null | undefined;
    rateShock: number | null | undefined;
  }
): AGISystemState {
  const now = new Date();
  
  // Safe number extraction with defaults
  const safeNum = (val: number | null | undefined, fallback: number): number => {
    if (val === null || val === undefined || isNaN(val)) return fallback;
    return val;
  };
  
  // Extract with safe defaults
  const rawSurvival = safeNum(marketData.survivalProbability, 0.8);
  const rawSystemic = safeNum(marketData.systemicRisk, 0.2);
  const rawYieldSpread = safeNum(marketData.yieldSpread, 0);
  const rawBtcVol = safeNum(marketData.btcVolatility, 50);
  const rawBalanceSheet = safeNum(marketData.balanceSheetDelta, 0);
  
  // Derive metrics from market data
  const survivalProb = rawSurvival > 1 
    ? rawSurvival / 100 
    : rawSurvival;
  
  const systemicRisk = rawSystemic > 1 
    ? rawSystemic / 100 
    : rawSystemic;

  // L8 - Sovereign Power (simulated based on market conditions)
  const reserveCurrencyShare = 58 - (systemicRisk * 10); // USD dominance declining under stress
  const tradeSettlementVolume = 65 - (systemicRisk * 5);
  const capitalControlStrength = 45 + (systemicRisk * 15); // Controls tighten under stress
  const sovereignPowerIndex = calculateSovereignPower(reserveCurrencyShare, tradeSettlementVolume, capitalControlStrength);

  // L10 - Civilization Score
  const demographicHealth = 62 - (systemicRisk * 5);
  const economicSustainability = 55 - (systemicRisk * 10);
  const technologicalAdaptation = 78;
  const geopoliticalStability = 45 - (systemicRisk * 15);
  const civilizationScore = calculateCivilizationScore(demographicHealth, economicSustainability, technologicalAdaptation, geopoliticalStability);

  // L5 - Liquidity Brain
  const m2GrowthVelocity = -2 + (rawBalanceSheet * 0.5);
  const realYieldGrowth = rawYieldSpread * 2;
  const creditSpreadExpansion = systemicRisk * 3;
  const liquidityBrain = calculateLiquidityBrain(m2GrowthVelocity, realYieldGrowth, creditSpreadExpansion);

  // L2 - Regime Speed
  const liquidityVelocityDelta = m2GrowthVelocity * 0.5;
  const volatilityStructureDelta = (rawBtcVol / 100) * 2;
  const correlationConvergenceDelta = systemicRisk * 1.5;
  const regimeSpeed = calculateRegimeSpeed(liquidityVelocityDelta, volatilityStructureDelta, correlationConvergenceDelta);

  // L4/L3 - Market Emotion
  const momentumChasing = 35 + (systemicRisk * 30);
  const socialNarrative = 40 + (systemicRisk * 25);
  const retailFlow = 30 + (systemicRisk * 20);
  const leverageGrowth = 25 + (systemicRisk * 35);
  const bubbleRisk = calculateBubbleRisk(retailFlow, leverageGrowth);

  // Regime Phase
  const currentPhase = determineRegimePhase(liquidityBrain.index, regimeSpeed, bubbleRisk);

  // L6 - Defense Score
  const geopoliticalRiskIndex = (100 - geopoliticalStability) / 100;
  const volatilityExpansionProb = rawBtcVol / 100;
  const defenseScore = calculateDefenseScore(survivalProb, systemicRisk, geopoliticalRiskIndex, volatilityExpansionProb);
  const autonomousActions = getAutonomousDefenseActions(defenseScore);

  // Black Swan Risk
  const volatilityShockRate = Math.min(1, (rawBtcVol / 100) * 1.2);
  const correlationCollapseSpeed = Math.min(1, systemicRisk * 1.1);
  const liquidityDrainVelocity = Math.min(1, Math.abs(rawBalanceSheet) / 10);
  const blackSwan = calculateBlackSwanRisk(volatilityShockRate, correlationCollapseSpeed, liquidityDrainVelocity);

  return {
    sovereign: {
      reserveCurrencyShare,
      tradeSettlementVolume,
      capitalControlStrength,
      digitalCurrencyAdoption: 23,
      sovereignPowerIndex
    },
    civilization: {
      demographicHealth,
      economicSustainability,
      technologicalAdaptation,
      geopoliticalStability,
      civilizationScore
    },
    defense: {
      defenseScore,
      survivalProbability: survivalProb,
      systemicRiskIndex: systemicRisk,
      geopoliticalRiskIndex,
      volatilityExpansionProb,
      autonomousActions
    },
    liquidity: {
      m2GrowthVelocity,
      realYieldGrowth,
      creditSpreadExpansion,
      liquidityBrainIndex: liquidityBrain.index,
      contractionWarning: liquidityBrain.warning
    },
    regime: {
      regimeSpeed,
      liquidityVelocityDelta,
      volatilityStructureDelta,
      correlationConvergenceDelta,
      currentPhase
    },
    blackSwan: {
      volatilityShockRate,
      correlationCollapseSpeed,
      liquidityDrainVelocity,
      blackSwanRisk: blackSwan.risk,
      emergencyMode: blackSwan.emergency
    },
    emotion: {
      momentumChasingIntensity: momentumChasing,
      socialNarrativeAmplification: socialNarrative,
      retailCapitalFlowRate: retailFlow,
      leverageGrowthRate: leverageGrowth,
      bubbleRisk
    },
    lastUpdate: now,
    nervousSystemStatus: 'ONLINE'
  };
}

// ============================================================================
// COPILOT INTELLIGENCE PROMPT GENERATOR
// ============================================================================

export function generateStrategicAnalysisPrompt(state: AGISystemState): string {
  return `
STRATEGIC INTELLIGENCE BRIEFING
================================
System Status: ${state.nervousSystemStatus}
Last Update: ${state.lastUpdate.toISOString()}

SOVEREIGN POWER ANALYSIS (L8):
- Reserve Currency Dominance: ${state.sovereign.reserveCurrencyShare.toFixed(1)}%
- Trade Settlement Volume: ${state.sovereign.tradeSettlementVolume.toFixed(1)}%
- Capital Control Strength: ${state.sovereign.capitalControlStrength.toFixed(1)}%
- Sovereign Power Index: ${state.sovereign.sovereignPowerIndex.toFixed(1)}

CIVILIZATION STABILITY (L10):
- Demographic Health: ${state.civilization.demographicHealth.toFixed(1)}
- Economic Sustainability: ${state.civilization.economicSustainability.toFixed(1)}
- Geopolitical Stability: ${state.civilization.geopoliticalStability.toFixed(1)}
- Civilization Score: ${state.civilization.civilizationScore.toFixed(1)}

DEFENSE POSTURE (L6):
- Defense Score: ${(state.defense.defenseScore * 100).toFixed(1)}%
- Strategic Pivot Required: ${state.defense.defenseScore > 0.5 ? 'YES' : 'NO'}

LIQUIDITY BRAIN (L5):
- Liquidity Index: ${state.liquidity.liquidityBrainIndex.toFixed(2)}
- Contraction Warning: ${state.liquidity.contractionWarning ? 'ACTIVE' : 'INACTIVE'}

REGIME INTELLIGENCE (L2):
- Regime Speed: ${state.regime.regimeSpeed.toFixed(2)}
- Current Phase: ${state.regime.currentPhase}

BLACK SWAN STATUS:
- Risk Level: ${(state.blackSwan.blackSwanRisk * 100).toFixed(1)}%
- Emergency Mode: ${state.blackSwan.emergencyMode ? 'ACTIVATED' : 'STANDBY'}

Provide analysis using macro structure, geopolitics, and monetary policy frameworks.
`.trim();
}
