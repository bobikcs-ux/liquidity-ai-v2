import React, { useState } from 'react';
import { Sparkles, TrendingUp, Target, Shield, Brain, X, Zap, Loader2 } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { runMasterScan, MarketContext } from '../services/masterIntelligence';
import { saveMarketReport } from '../services/supabaseService';
import HistoryPanel from './HistoryPanel';

interface IntelligenceQuery {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  insight: string;
}

export function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<IntelligenceQuery | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [masterAnalysis, setMasterAnalysis] = useState<string | null>(null);
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const { currentRegime, uiTheme } = useAdaptiveTheme();

  // Master scan handler
  const handleMasterScan = async () => {
    setIsScanning(true);
    setMasterAnalysis(null);
    try {
      const { context, analysis } = await runMasterScan();
      setMarketContext(context);
      setMasterAnalysis(analysis);
      
      // Archive report to Supabase
      const isSaved = await saveMarketReport(context, analysis);
      if (isSaved) {
        console.log('Report archived in Supabase.');
      }
    } catch (error) {
      console.error('Master scan failed:', error);
      setMasterAnalysis('Error: Unable to complete market scan. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };
  
  // Regime-driven intelligent queries
  const queries: IntelligenceQuery[] = [
    {
      id: 'regime',
      icon: TrendingUp,
      title: 'What is the current risk regime?',
      description: 'Analyze market liquidity conditions',
      insight: `Market is in **${currentRegime.regime.toUpperCase()}** regime with ${currentRegime.confidence}% confidence. Risk level is ${currentRegime.riskLevel}%. ${
        currentRegime.regime === 'stress' 
          ? 'High alert: Consider defensive positioning.' 
          : currentRegime.regime === 'expansionary'
          ? 'Favorable conditions for growth assets.'
          : 'Mixed signals: Monitor closely.'
      }`,
    },
    {
      id: 'survival',
      icon: Shield,
      title: 'What is my portfolio survival probability?',
      description: 'Stress test current allocation',
      insight: `Based on current ${currentRegime.regime} regime, your portfolio has a **${94 - currentRegime.riskLevel * 0.3}%** survival probability over 30 days. Maximum drawdown estimate: -${Math.round(18 + currentRegime.riskLevel * 0.35)}%. ${
        currentRegime.riskLevel > 70 
          ? '⚠️ Consider hedging strategies.' 
          : '✓ Within acceptable risk parameters.'
      }`,
    },
    {
      id: 'volatility',
      icon: Target,
      title: 'Is volatility about to expand?',
      description: 'VIX expansion probability',
      insight: `Volatility expansion probability: **${currentRegime.volatilityIndex}%** over next 14 days. Current VIX: 15.7. Projected range: 18-28. ${
        currentRegime.volatilityIndex > 50 
          ? 'Elevated risk of vol spike. Review options positions.' 
          : 'Vol environment remains stable.'
      }`,
    },
    {
      id: 'protection',
      icon: Shield,
      title: 'What protection strategies should I consider?',
      description: 'Autonomous risk defense recommendations',
      insight: `**Recommended Actions:**\n${
        currentRegime.riskLevel > 70 
          ? '🔴 High Risk Mode:\n• Add 15-20% put protection\n• Reduce leverage exposure\n• Increase cash allocation to 25%\n• Consider tail risk hedges' 
          : currentRegime.riskLevel > 40
          ? '🟡 Moderate Risk:\n• Maintain 10% protective puts\n• Diversify correlation exposures\n• Monitor credit spreads'
          : '🟢 Low Risk:\n• Maintain baseline hedges\n• Opportunistic growth positioning\n• Regular rebalancing sufficient'
      }`,
    },
    {
      id: 'liquidity',
      icon: Brain,
      title: 'How are liquidity conditions evolving?',
      description: 'Flow analysis and forward signals',
      insight: `Liquidity Score: **${currentRegime.liquidityScore}/100**. ${
        currentRegime.liquidityScore > 70 
          ? 'Strong liquidity flows. Central bank QE + positive retail/institutional flows support risk assets.' 
          : currentRegime.liquidityScore < 40
          ? '⚠️ Liquidity tightening detected. Monitor funding markets and credit conditions closely.'
          : 'Neutral liquidity conditions. No major regime shift signals.'
      }`,
    },
  ];
  
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Intelligence Copilot"
        className={`fixed bottom-24 lg:bottom-8 right-8 w-14 h-14 rounded-xl shadow-lg transition-all flex items-center justify-center group z-50 ${
          isDark 
            ? 'bg-blue-600 hover:bg-blue-500' 
            : 'bg-[#2563EB] hover:bg-[#1d4ed8]'
        }`}
      >
        <Sparkles className="w-6 h-6 text-white" />
        <span className={`absolute right-16 px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
          isDark ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
        }`}>
          Intelligence Copilot
        </span>
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-24 lg:bottom-8 right-8 w-[380px] max-h-[600px] rounded-xl shadow-2xl overflow-hidden z-50 border"
      style={{
        backgroundColor: isDark ? '#0F1419' : isHybrid ? '#1a1f2e' : '#ffffff',
        borderColor: isDark ? '#1e3a8a' : isHybrid ? '#334155' : '#e5e7eb',
      }}
    >
      {/* Header */}
      <div className={`p-4 border-b flex items-center justify-between ${
        isDark || isHybrid ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isDark ? 'bg-blue-600' : isHybrid ? 'bg-blue-500' : 'bg-[#EFF6FF]'
          }`}>
            <Sparkles className={`w-5 h-5 ${isDark || isHybrid ? 'text-white' : 'text-[#2563EB]'}`} />
          </div>
          <div>
            <h3 className={`font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              Intelligence Copilot
            </h3>
            <p className={`text-xs ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}`}>
              Regime: {currentRegime.regime.toUpperCase()}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setSelectedQuery(null);
          }}
          aria-label="Close Intelligence Copilot"
          className={`p-2 rounded-lg transition-colors ${
            isDark || isHybrid 
              ? 'hover:bg-gray-800 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 max-h-[500px] overflow-y-auto">
        {/* Master Scan Button */}
        <button
          onClick={handleMasterScan}
          disabled={isScanning}
          className={`w-full mb-4 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-3 ${
            isDark 
              ? 'border-amber-600 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400' 
              : isHybrid
              ? 'border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
              : 'border-amber-500 bg-amber-50 hover:bg-amber-100 text-amber-700'
          } ${isScanning ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isScanning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-semibold">Scanning Markets...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Master Black Swan Scan</span>
            </>
          )}
        </button>

        {/* Master Analysis Result */}
        {masterAnalysis && (
          <div className={`mb-4 p-4 rounded-xl ${
            isDark ? 'bg-gray-900 border border-amber-600/50' : isHybrid ? 'bg-gray-800 border border-amber-500/50' : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className={`w-5 h-5 ${isDark || isHybrid ? 'text-amber-400' : 'text-amber-600'}`} />
              <h4 className={`font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                Master Intelligence Report
              </h4>
            </div>
            
            {marketContext && (
              <div className={`mb-3 p-3 rounded-lg text-xs grid grid-cols-2 gap-2 ${
                isDark ? 'bg-gray-800' : isHybrid ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                  BTC: <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>${marketContext.btcPrice.toLocaleString()}</span>
                </div>
                <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                  Fear/Greed: <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>{marketContext.fearGreedValue}</span>
                </div>
                <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                  Yield Curve: <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>{marketContext.yieldCurve}</span>
                </div>
                <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                  BTC Dom: <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>{marketContext.btcDominance.toFixed(1)}%</span>
                </div>
              </div>
            )}
            
            <div className={`text-sm leading-relaxed whitespace-pre-line ${
              isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {masterAnalysis}
            </div>
            
            {/* Historical Records */}
            <HistoryPanel />
          </div>
        )}

        {selectedQuery ? (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedQuery(null)}
              className={`text-sm font-medium ${
                isDark || isHybrid ? 'text-blue-400 hover:text-blue-300' : 'text-[#2563EB] hover:text-[#1d4ed8]'
              }`}
            >
              ← Back to queries
            </button>
            
            <div className={`p-4 rounded-xl ${
              isDark ? 'bg-gray-900' : isHybrid ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <selectedQuery.icon className={`w-5 h-5 ${
                  isDark || isHybrid ? 'text-blue-400' : 'text-[#2563EB]'
                }`} />
                <h4 className={`font-semibold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                  {selectedQuery.title}
                </h4>
              </div>
              
              <div className={`text-sm leading-relaxed whitespace-pre-line ${
                isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {selectedQuery.insight}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg text-xs ${
              isDark ? 'bg-blue-900/30 text-blue-200' : isHybrid ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-700'
            }`}>
              This analysis is generated in real-time based on current market regime and your portfolio parameters.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className={`text-sm mb-4 ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
              Research intelligence queries:
            </p>
            
            {queries.map((query) => {
              const Icon = query.icon;
              return (
                <button
                  key={query.id}
                  onClick={() => setSelectedQuery(query)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isDark 
                      ? 'border-gray-700 hover:border-blue-600 bg-gray-900 hover:bg-gray-800' 
                      : isHybrid
                      ? 'border-gray-700 hover:border-blue-500 bg-gray-800 hover:bg-gray-700'
                      : 'border-gray-200 hover:border-[#2563EB] bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-blue-600' : isHybrid ? 'bg-blue-500' : 'bg-[#EFF6FF]'
                    }`}>
                      <Icon className={`w-4 h-4 ${isDark || isHybrid ? 'text-white' : 'text-[#2563EB]'}`} />
                    </div>
                    <div>
                      <div className={`font-medium text-sm mb-1 ${
                        isDark || isHybrid ? 'text-white' : 'text-gray-900'
                      }`}>
                        {query.title}
                      </div>
                      <div className={`text-xs ${
                        isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {query.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className={`p-3 border-t text-center ${
        isDark || isHybrid ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className={`text-xs ${isDark || isHybrid ? 'text-gray-500' : 'text-gray-500'}`}>
          Powered by Liquidity.ai Intelligence Engine
        </div>
      </div>
    </div>
  );
}
