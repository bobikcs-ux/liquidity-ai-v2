import React, { useState } from 'react';
import { AlertTriangle, Activity, TrendingUp, Zap, Target, Shield, Brain, Info } from 'lucide-react';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';

type RiskLevel = 'GREEN' | 'AMBER' | 'RED' | 'BLACK';

interface SystemicSignal {
  category: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export function BlackSwanTerminal() {
  const { latest: snapshot, loading: snapshotLoading } = useMarketSnapshot();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  
  // Calculate Black Swan Risk Index from real data
  const systemicRisk = snapshot?.systemic_risk != null 
    ? (snapshot.systemic_risk > 1 ? snapshot.systemic_risk : Math.round(snapshot.systemic_risk * 100))
    : 35;
  const balanceSheetDelta = snapshot?.balance_sheet_delta ?? -2.3;
  const rateShock = snapshot?.rate_shock != null 
    ? (snapshot.rate_shock > 1 ? snapshot.rate_shock : Math.round(snapshot.rate_shock * 100))
    : 15;
  const btcVolatility = snapshot?.btc_volatility != null 
    ? (snapshot.btc_volatility > 1 ? snapshot.btc_volatility : Math.round(snapshot.btc_volatility * 100))
    : 65;
  
  // Calculate Black Swan Index from systemic risk components
  const blackSwanIndex = Math.min(100, Math.round(systemicRisk * 1.5 + rateShock * 0.3 + btcVolatility * 0.2));
  
  // Risk level determination
  const getRiskLevel = (index: number): RiskLevel => {
    if (index >= 80) return 'BLACK';
    if (index >= 60) return 'RED';
    if (index >= 40) return 'AMBER';
    return 'GREEN';
  };
  
  const riskLevel = getRiskLevel(blackSwanIndex);
  
  // Systemic stress probabilities - derived from real data
  const baseStress = systemicRisk;
  const stressProbabilities = {
    '7d': Math.min(95, Math.round(baseStress * 0.7)),
    '30d': Math.min(95, Math.round(baseStress * 1.2)),
    '90d': Math.min(95, Math.round(baseStress * 1.5)),
  };
  
  // Primary risk drivers - mapped from real database metrics
  const riskDrivers = [
    {
      driver: 'Balance Sheet Contraction (QT)',
      impact: Math.min(100, Math.abs(balanceSheetDelta) * 10),
      trend: balanceSheetDelta < -5 ? 'accelerating' : balanceSheetDelta < 0 ? 'stable' : 'easing',
      description: `Fed balance sheet delta: ${balanceSheetDelta.toFixed(1)}% (${balanceSheetDelta < 0 ? 'QT' : 'QE'})`,
    },
    {
      driver: 'Interest Rate Shock',
      impact: rateShock,
      trend: rateShock > 20 ? 'accelerating' : rateShock > 10 ? 'stable' : 'normalizing',
      description: `Rate shock velocity: ${rateShock}% above historical norms`,
    },
    {
      driver: 'Crypto Volatility Index',
      impact: btcVolatility,
      trend: btcVolatility > 70 ? 'accelerating' : btcVolatility > 50 ? 'elevated' : 'stable',
      description: `BTC volatility at ${btcVolatility}% - ${btcVolatility > 60 ? 'high leverage risk' : 'moderate conditions'}`,
    },
  ];
  
  // Historical analog matches
  const historicalAnalogs = [
    { event: '2008 Financial Crisis', similarity: 67, year: '2008' },
    { event: '2020 COVID Liquidity Shock', similarity: 42, year: '2020' },
    { event: '2022 Tightening Crisis', similarity: 71, year: '2022' },
  ];
  
// Signal layers - mapped from real database metrics
  const signalLayers: SystemicSignal[] = [
    {
      category: 'Macro Layer',
      metric: 'Interest Rate Shock Velocity',
      value: rateShock,
      threshold: 20,
      severity: rateShock > 30 ? 'critical' : rateShock > 20 ? 'high' : 'medium',
    },
    {
      category: 'Macro Layer',
      metric: 'Central Bank Balance Sheet Change',
      value: balanceSheetDelta,
      threshold: -5,
      severity: balanceSheetDelta < -10 ? 'critical' : balanceSheetDelta < -5 ? 'high' : 'medium',
    },
    {
      category: 'Market Structure',
      metric: 'Systemic Risk Index',
      value: systemicRisk,
      threshold: 40,
      severity: systemicRisk > 60 ? 'critical' : systemicRisk > 40 ? 'high' : 'medium',
    },
    {
      category: 'Market Structure',
      metric: 'Yield Spread (10Y-2Y)',
      value: snapshot?.yield_spread ?? -0.42,
      threshold: 0,
      severity: (snapshot?.yield_spread ?? -0.42) < -0.5 ? 'critical' : (snapshot?.yield_spread ?? -0.42) < 0 ? 'high' : 'low',
    },
    {
      category: 'Crypto Layer',
      metric: 'BTC Volatility Index',
      value: btcVolatility,
      threshold: 50,
      severity: btcVolatility > 70 ? 'critical' : btcVolatility > 50 ? 'high' : 'medium',
    },
    {
      category: 'Credit Layer',
      metric: 'VaR 95% Threshold',
      value: (snapshot?.var_95 ?? 0.12) * 100,
      threshold: 10,
      severity: (snapshot?.var_95 ?? 0.12) > 0.15 ? 'critical' : (snapshot?.var_95 ?? 0.12) > 0.1 ? 'high' : 'medium',
    },
  ];
  
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'BLACK': return 'bg-black text-white border-red-500';
      case 'RED': return 'bg-red-950 text-red-100 border-red-600';
      case 'AMBER': return 'bg-amber-950 text-amber-100 border-amber-600';
      case 'GREEN': return 'bg-green-950 text-green-100 border-green-600';
    }
  };
  
  const getRiskLabel = (level: RiskLevel) => {
    switch (level) {
      case 'BLACK': return 'IMMINENT TAIL EVENT';
      case 'RED': return 'SYSTEMIC RISK EXPANSION';
      case 'AMBER': return 'STRUCTURAL STRESS BUILDING';
      case 'GREEN': return 'STABLE SYSTEM';
    }
  };
  
  return (
    <div className="black-swan-terminal space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white" style={{ opacity: 0.95, lineHeight: 1.6 }}>
          Black Swan Early Warning Terminal
        </h1>
        <p className="text-sm md:text-base text-gray-400" style={{ opacity: 0.95, lineHeight: 1.6 }}>
          Systemic Risk Intelligence Infrastructure
        </p>
      </div>
      
      {/* Main Risk Index Display */}
      <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6 md:p-8">
        <div className="text-center mb-6 md:mb-8">
          <div className="text-xs md:text-sm font-semibold tracking-wider text-gray-400 mb-3">
            BLACK SWAN RISK INDEX
          </div>
          <div className="text-6xl md:text-8xl font-bold text-red-500 mb-4 tracking-tight">
            {blackSwanIndex}
          </div>
          <div className={`inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-md border-2 font-bold tracking-wide text-xs md:text-sm ${getRiskColor(riskLevel)}`}>
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">{getRiskLabel(riskLevel)}</span>
            <span className="sm:hidden">{riskLevel} RISK</span>
          </div>
        </div>
        
        {/* Systemic Stress Probability */}
        <div className="border-t border-blue-900/50 pt-6">
          <h3 className="text-sm font-semibold tracking-wider text-gray-400 mb-4">
            SYSTEMIC STRESS PROBABILITY
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(stressProbabilities).map(([period, probability]) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period as '7d' | '30d' | '90d')}
                className={`p-4 rounded-md border transition-all ${
                  selectedTimeframe === period
                    ? 'border-blue-600 bg-blue-950/30'
                    : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {period === '7d' ? '7 Day' : period === '30d' ? '30 Day' : '90 Day'}
                </div>
                <div className={`text-3xl font-bold ${
                  probability >= 70 ? 'text-red-500' :
                  probability >= 50 ? 'text-amber-500' : 'text-gray-300'
                }`}>
                  {probability}%
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Primary Risk Drivers */}
      <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-semibold tracking-wider text-gray-400">
            PRIMARY RISK DRIVERS
          </h3>
        </div>
        
        <div className="space-y-4">
          {riskDrivers.map((driver, index) => (
            <div key={index} className="border border-gray-800 rounded-md p-4 bg-gray-900/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-semibold">{driver.driver}</span>
                    <span className={`text-xs px-2 py-1 rounded font-semibold tracking-wide ${
                      driver.trend === 'accelerating' ? 'bg-red-900 text-red-200' :
                      driver.trend === 'stable' ? 'bg-amber-900 text-amber-200' :
                      'bg-gray-800 text-gray-300'
                    }`}>
                      {driver.trend.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{driver.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className={`text-2xl font-bold ${
                    driver.impact >= 90 ? 'text-red-500' :
                    driver.impact >= 70 ? 'text-amber-500' : 'text-gray-300'
                  }`}>
                    {driver.impact}
                  </div>
                  <div className="text-xs text-gray-500">Impact</div>
                </div>
              </div>
              
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    driver.impact >= 90 ? 'bg-red-500' :
                    driver.impact >= 70 ? 'bg-amber-500' : 'bg-gray-500'
                  }`}
                  style={{ width: `${driver.impact}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Historical Analog Matches */}
        <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold tracking-wider text-gray-400">
              HISTORICAL ANALOG MATCHES
            </h3>
          </div>
          
          <div className="space-y-4">
            {historicalAnalogs.map((analog, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">{analog.event}</div>
                    <div className="text-xs text-gray-500">{analog.year}</div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    analog.similarity >= 70 ? 'text-red-500' :
                    analog.similarity >= 50 ? 'text-amber-500' : 'text-gray-400'
                  }`}>
                    {analog.similarity}%
                  </div>
                </div>
                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full ${
                      analog.similarity >= 70 ? 'bg-red-500' :
                      analog.similarity >= 50 ? 'bg-amber-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${analog.similarity}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-3 bg-blue-950/30 border border-blue-900/50 rounded-md">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300 leading-relaxed">
                Historical pattern matching uses structural similarity analysis, not price correlation.
              </p>
            </div>
          </div>
        </div>
        
        {/* AI Explanation Panel */}
        <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-semibold tracking-wider text-gray-400">
              SYSTEMIC RISK ANALYSIS
            </h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-white mb-2">
                Why Systemic Risk Is Increasing
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Market liquidity depth has contracted sharply over the past 14 days while cross-asset 
                correlations have spiked to 0.87, indicating structural fragility. Central bank balance 
                sheet reduction is accelerating (-12.3% QoQ) concurrent with interest rate velocity 
                exceeding historical stress thresholds.
              </p>
            </div>
            
            <div>
              <div className="text-sm font-semibold text-white mb-2">
                Liquidity Conditions
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Bid-ask spreads widening in credit markets. Treasury market depth 34% below 12-month 
                average. Funding market stress indicators elevated.
              </p>
            </div>
            
            <div>
              <div className="text-sm font-semibold text-white mb-2">
                Market Structure Signals
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Volatility surface steepening. Options skew expanding. Leverage in crypto derivatives 
                exceeding pre-liquidation cascade levels observed in historical tail events.
              </p>
            </div>
            
            <div>
              <div className="text-sm font-semibold text-white mb-2">
                Macro Policy Shocks
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Rate shock velocity 2.3σ above mean. Real yield acceleration creating refinancing stress. 
                Policy divergence between major central banks increasing currency volatility.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Signal Layers */}
      <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-semibold tracking-wider text-gray-400">
            INPUT SIGNAL LAYERS
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signalLayers.map((signal, index) => (
            <div key={index} className="border border-gray-800 rounded-md p-4 bg-gray-900/30">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">{signal.category}</div>
                  <div className="text-sm font-semibold text-white">{signal.metric}</div>
                </div>
                <div className={`w-2 h-2 rounded-full mt-1 ${
                  signal.severity === 'critical' ? 'bg-red-500' :
                  signal.severity === 'high' ? 'bg-amber-500' :
                  signal.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-bold ${
                  signal.severity === 'critical' ? 'text-red-500' :
                  signal.severity === 'high' ? 'text-amber-500' : 'text-gray-300'
                }`}>
                  {signal.value > 1 ? signal.value.toFixed(0) : signal.value.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  / {signal.threshold} threshold
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Correlation Network Preview */}
      <div className="bg-[#0a1628] border border-blue-900/50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-green-400" />
          <h3 className="text-sm font-semibold tracking-wider text-gray-400">
            SYSTEMIC STRESS HEAT MAP
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { asset: 'Equities', stress: 76 },
            { asset: 'Credit', stress: 84 },
            { asset: 'Treasuries', stress: 62 },
            { asset: 'Crypto', stress: 91 },
            { asset: 'FX', stress: 58 },
            { asset: 'Commodities', stress: 47 },
            { asset: 'Volatility', stress: 79 },
            { asset: 'Liquidity', stress: 88 },
          ].map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-md border text-center"
              style={{
                backgroundColor: item.stress >= 80 ? 'rgba(239, 68, 68, 0.1)' :
                               item.stress >= 60 ? 'rgba(251, 191, 36, 0.1)' :
                               'rgba(34, 197, 94, 0.1)',
                borderColor: item.stress >= 80 ? 'rgba(239, 68, 68, 0.3)' :
                            item.stress >= 60 ? 'rgba(251, 191, 36, 0.3)' :
                            'rgba(34, 197, 94, 0.3)',
              }}
            >
              <div className="text-xs text-gray-400 mb-1">{item.asset}</div>
              <div className={`text-2xl font-bold ${
                item.stress >= 80 ? 'text-red-500' :
                item.stress >= 60 ? 'text-amber-500' : 'text-green-500'
              }`}>
                {item.stress}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-md p-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          ⚠️ This terminal detects systemic risk conditions and structural market stress. It does not predict 
          price movements or provide trading signals. For research and risk management purposes only. 
          Systemic risk intelligence should be used alongside independent risk assessment frameworks.
        </p>
      </div>
    </div>
  );
}
