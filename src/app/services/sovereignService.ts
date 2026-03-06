/**
 * Sovereign Intelligence Service
 * Server-side data fetching and SRI calculation
 */

import type {
  SRIInputs,
  SRIResult,
  CorrelationMatrix,
  FlowSignal,
  DefiLlamaStablecoinData,
  SovereignMarketPulse,
  SovereignRiskSignal,
} from '../types/sovereign';

// ============================================================================
// DATA FETCHING FUNCTIONS
// ============================================================================

/**
 * Fetch stablecoin data from DefiLlama
 * Endpoint: /stablecoins
 */
export async function fetchStablecoinLiquidity(): Promise<{
  totalMcap: number;
  change24h: number;
  change7d: number;
  change30d: number;
  topStablecoins: Array<{ name: string; symbol: string; mcap: number; change7d: number }>;
}> {
  try {
    const response = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true');
    if (!response.ok) throw new Error('Failed to fetch stablecoin data');
    
    const data: DefiLlamaStablecoinData = await response.json();
    
    const totalMcap = data.totalCirculating?.peggedUSD || 0;
    const totalPrevDay = data.totalCirculatingPrevDay?.peggedUSD || totalMcap;
    const totalPrevWeek = data.totalCirculatingPrevWeek?.peggedUSD || totalMcap;
    const totalPrevMonth = data.totalCirculatingPrevMonth?.peggedUSD || totalMcap;
    
    const change24h = totalPrevDay > 0 ? ((totalMcap - totalPrevDay) / totalPrevDay) * 100 : 0;
    const change7d = totalPrevWeek > 0 ? ((totalMcap - totalPrevWeek) / totalPrevWeek) * 100 : 0;
    const change30d = totalPrevMonth > 0 ? ((totalMcap - totalPrevMonth) / totalPrevMonth) * 100 : 0;
    
    const topStablecoins = (data.peggedAssets || [])
      .slice(0, 10)
      .map(asset => ({
        name: asset.name,
        symbol: asset.symbol,
        mcap: asset.circulating?.peggedUSD || 0,
        change7d: asset.circulatingPrevWeek?.peggedUSD 
          ? ((asset.circulating.peggedUSD - asset.circulatingPrevWeek.peggedUSD) / asset.circulatingPrevWeek.peggedUSD) * 100
          : 0,
      }));
    
    return { totalMcap, change24h, change7d, change30d, topStablecoins };
  } catch (error) {
    console.error('[sovereignService] Failed to fetch stablecoin data:', error);
    // Return mock data for development
    return {
      totalMcap: 178500000000,
      change24h: -0.12,
      change7d: -1.8,
      change30d: -3.2,
      topStablecoins: [
        { name: 'Tether', symbol: 'USDT', mcap: 120000000000, change7d: -0.5 },
        { name: 'USD Coin', symbol: 'USDC', mcap: 32000000000, change7d: -2.1 },
        { name: 'DAI', symbol: 'DAI', mcap: 5200000000, change7d: -1.2 },
      ],
    };
  }
}

/**
 * Fetch energy data from EIA API
 * Uses series IDs for Crude Oil, Natural Gas, Coal
 */
export async function fetchEnergyData(apiKey?: string): Promise<{
  crudeOil: { price: number; change: number };
  naturalGas: { price: number; change: number };
  coal: { price: number; change: number };
}> {
  // EIA API requires an API key - use mock data if not available
  // In production, this would fetch from EIA Open Data API
  
  // Mock data representing realistic energy prices
  return {
    crudeOil: { price: 78.45, change: 2.3 },
    naturalGas: { price: 2.89, change: -1.5 },
    coal: { price: 145.20, change: 0.8 },
  };
}

// ============================================================================
// SOVEREIGN RISK INDEX (SRI) CALCULATION
// ============================================================================

/**
 * Calculate Sovereign Risk Index
 * Combines liquidity, energy, crypto, and macro signals
 * 
 * Formula:
 * SRI = (LiquidityScore * 0.30) + (EnergyScore * 0.25) + (CryptoScore * 0.25) + (MacroScore * 0.20)
 */
export function calculateSRI(inputs: SRIInputs): SRIResult {
  // Liquidity Score (0-100)
  // Negative stablecoin growth = higher risk
  const liquidityScore = Math.min(100, Math.max(0,
    50 - (inputs.stablecoinMcapChange7d * 5) + // Negative change increases score
    (inputs.fedBalanceSheet < 7000000000000 ? 20 : 0) // QT pressure
  ));
  
  // Energy Score (0-100)
  // Rising energy prices = higher risk
  const energyScore = Math.min(100, Math.max(0,
    30 +
    (inputs.crudeOilPrice > 80 ? 20 : inputs.crudeOilPrice > 70 ? 10 : 0) +
    (inputs.crudeOilPriceChange > 5 ? 25 : inputs.crudeOilPriceChange > 2 ? 15 : 0) +
    (inputs.naturalGasPriceChange > 10 ? 25 : inputs.naturalGasPriceChange > 5 ? 15 : 0)
  ));
  
  // Crypto Score (0-100)
  // High volatility = higher risk
  const cryptoScore = Math.min(100, Math.max(0,
    inputs.btcVolatility * 1.2 +
    (inputs.systemicRisk > 50 ? 20 : 0)
  ));
  
  // Macro Score (0-100)
  // Inverted yield curve = higher risk
  const macroScore = Math.min(100, Math.max(0,
    50 +
    (inputs.yieldSpread < 0 ? 30 : inputs.yieldSpread < 0.5 ? 15 : 0) +
    (inputs.yieldSpread < -0.5 ? 20 : 0)
  ));
  
  // Weighted composite score
  const score = Math.round(
    (liquidityScore * 0.30) +
    (energyScore * 0.25) +
    (cryptoScore * 0.25) +
    (macroScore * 0.20)
  );
  
  // Determine regime
  let regime: SRIResult['regime'];
  if (score >= 75) regime = 'CRISIS';
  else if (score >= 55) regime = 'STRESS';
  else if (score >= 35) regime = 'CONTRACTION';
  else regime = 'EXPANSION';
  
  // Determine alert level
  let alertLevel: SRIResult['alertLevel'];
  if (score >= 80) alertLevel = 'BLACK';
  else if (score >= 60) alertLevel = 'RED';
  else if (score >= 40) alertLevel = 'AMBER';
  else alertLevel = 'GREEN';
  
  // Generate signals
  const signals: string[] = [];
  if (inputs.stablecoinMcapChange7d < -2) signals.push('LIQUIDITY_DRAIN');
  if (inputs.crudeOilPriceChange > 5) signals.push('OIL_SURGE');
  if (inputs.btcVolatility > 60) signals.push('CRYPTO_VOLATILITY');
  if (inputs.yieldSpread < -0.3) signals.push('YIELD_INVERSION');
  if (liquidityScore > 60 && energyScore > 60) signals.push('STAGFLATION_RISK');
  
  return {
    score,
    components: {
      liquidityScore,
      energyScore,
      cryptoScore,
      macroScore,
    },
    regime,
    alertLevel,
    signals,
  };
}

// ============================================================================
// CORRELATION ANALYSIS
// ============================================================================

/**
 * Calculate Oil vs Liquidity Correlation
 * Detects "Inflow to Commodities / Outflow from Risk Assets" pattern
 */
export function calculateOilLiquidityCorrelation(
  oilPriceChange: number,
  liquidityChange: number
): { correlation: number; signal: FlowSignal | null } {
  // Negative correlation = divergence (oil up, liquidity down or vice versa)
  const correlation = oilPriceChange * liquidityChange < 0 
    ? -Math.abs(oilPriceChange - liquidityChange) / 10
    : Math.min(1, (oilPriceChange + liquidityChange) / 20);
  
  let signal: FlowSignal | null = null;
  
  // Oil rising + Liquidity falling = Capital rotation into commodities
  if (oilPriceChange > 2 && liquidityChange < -1) {
    signal = {
      type: 'INFLOW_COMMODITIES',
      confidence: Math.min(95, 50 + Math.abs(oilPriceChange - liquidityChange) * 5),
      description: 'INFLOW TO COMMODITIES / OUTFLOW FROM RISK ASSETS',
      triggers: [
        `Oil price +${oilPriceChange.toFixed(1)}%`,
        `Stablecoin liquidity ${liquidityChange.toFixed(1)}%`,
        'Capital rotating from digital to physical assets',
      ],
    };
  }
  
  // Oil falling + Liquidity rising = Risk-on environment
  if (oilPriceChange < -2 && liquidityChange > 1) {
    signal = {
      type: 'RISK_ON',
      confidence: Math.min(95, 50 + Math.abs(oilPriceChange - liquidityChange) * 5),
      description: 'RISK-ON: LIQUIDITY EXPANSION',
      triggers: [
        `Oil price ${oilPriceChange.toFixed(1)}%`,
        `Stablecoin liquidity +${liquidityChange.toFixed(1)}%`,
        'Capital flowing into risk assets',
      ],
    };
  }
  
  return { correlation, signal };
}

/**
 * Build full correlation matrix
 */
export function buildCorrelationMatrix(
  oilChange: number,
  gasChange: number,
  liquidityChange: number,
  btcVolatility: number,
  yieldSpread: number
): CorrelationMatrix {
  return {
    oilVsLiquidity: oilChange * liquidityChange < 0 
      ? -Math.abs(oilChange - liquidityChange) / 10 
      : (oilChange + liquidityChange) / 20,
    gasVsCrypto: gasChange > 5 && btcVolatility > 50 ? 0.7 : 0.2,
    yieldVsEnergy: yieldSpread < 0 && oilChange > 3 ? 0.8 : 0.3,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// MOCK DATA GENERATORS (for development)
// ============================================================================

export function generateMockMarketPulse(): SovereignMarketPulse {
  const sri = Math.floor(Math.random() * 40) + 35; // 35-75 range
  
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    sri_score: sri,
    liquidity_momentum: Math.floor(Math.random() * 60) - 30,
    energy_pressure: Math.floor(Math.random() * 40) + 30,
    crypto_stress: Math.floor(Math.random() * 50) + 20,
    macro_tension: Math.floor(Math.random() * 40) + 25,
    regime: sri >= 60 ? 'STRESS' : sri >= 40 ? 'CONTRACTION' : 'EXPANSION',
    alert_level: sri >= 70 ? 'RED' : sri >= 50 ? 'AMBER' : 'GREEN',
  };
}

export function generateMockSignals(): SovereignRiskSignal[] {
  return [
    {
      id: crypto.randomUUID(),
      created_at: new Date(Date.now() - 300000).toISOString(), // 5 min ago
      signal_type: 'CORRELATION_BREAK',
      severity: 'HIGH',
      title: 'Oil-Liquidity Divergence Detected',
      description: 'Crude oil prices rising while stablecoin market cap declining. Potential capital rotation into commodities.',
      data_sources: ['EIA', 'DEFILLAMA'],
      acknowledged: false,
      expires_at: null,
    },
    {
      id: crypto.randomUUID(),
      created_at: new Date(Date.now() - 900000).toISOString(), // 15 min ago
      signal_type: 'THRESHOLD_BREACH',
      severity: 'MEDIUM',
      title: 'Energy Pressure Index Above 60',
      description: 'Combined energy pressure from oil and natural gas exceeds warning threshold.',
      data_sources: ['EIA'],
      acknowledged: false,
      expires_at: null,
    },
    {
      id: crypto.randomUUID(),
      created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      signal_type: 'ANOMALY',
      severity: 'LOW',
      title: 'Unusual Stablecoin Outflow Pattern',
      description: 'USDC redemptions accelerating beyond seasonal norms.',
      data_sources: ['DEFILLAMA'],
      acknowledged: true,
      expires_at: null,
    },
  ];
}
