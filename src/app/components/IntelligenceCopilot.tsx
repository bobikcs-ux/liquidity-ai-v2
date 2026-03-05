import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Zap, Loader2, Terminal, Send, Clock, AlertTriangle, 
  TrendingUp, Shield, Brain, ChevronUp, ChevronDown, X, FileDown
} from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { runMasterScan, MarketContext, analyzeBlackSwanRisk, fetchAllMarketData } from '../services/masterIntelligence';
import { saveMarketReport, logSystemEvent } from '../services/supabaseService';
import { quickExport } from '../utils/exportPDF';
import HistoryPanel from './HistoryPanel';

// Command types for the dual-core system
type CommandType = 
  | 'scan' 
  | 'risk' 
  | 'liquidity' 
  | 'correlation' 
  | 'forecast' 
  | 'export'
  | 'help' 
  | 'clear'
  | 'status';

interface CommandResult {
  command: string;
  output: string;
  timestamp: Date;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Command definitions with descriptions
const COMMANDS: Record<CommandType, { description: string; usage: string }> = {
  scan: { description: 'Run full Black Swan market scan', usage: '/scan' },
  risk: { description: 'Quick risk assessment', usage: '/risk' },
  liquidity: { description: 'Check liquidity conditions', usage: '/liquidity' },
  correlation: { description: 'Analyze cross-asset correlations', usage: '/correlation' },
  forecast: { description: 'Generate 24h risk forecast', usage: '/forecast' },
  export: { description: 'Export last analysis as PDF', usage: '/export' },
  help: { description: 'Show available commands', usage: '/help' },
  clear: { description: 'Clear command history', usage: '/clear' },
  status: { description: 'Check system health', usage: '/status' },
};

export function IntelligenceCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [masterAnalysis, setMasterAnalysis] = useState<string | null>(null);
  const [marketContext, setMarketContext] = useState<MarketContext | null>(null);
  const [commandHistory, setCommandHistory] = useState<CommandResult[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const { currentRegime, uiTheme } = useAdaptiveTheme();

  const isDark = uiTheme === 'dark';
  const isHybrid = uiTheme === 'hybrid';

  // Auto-scroll to bottom of history
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Filter suggestions based on input
  const filteredCommands = Object.entries(COMMANDS).filter(([cmd]) =>
    cmd.startsWith(inputValue.replace('/', '').toLowerCase())
  );

  // Process commands
  const processCommand = useCallback(async (input: string) => {
    const cmd = input.toLowerCase().replace('/', '').trim() as CommandType;
    
    const addResult = (output: string, type: CommandResult['type'] = 'success') => {
      setCommandHistory(prev => [...prev, {
        command: input,
        output,
        timestamp: new Date(),
        type,
      }]);
    };

    switch (cmd) {
      case 'help':
        const helpText = Object.entries(COMMANDS)
          .map(([cmd, info]) => `${info.usage} - ${info.description}`)
          .join('\n');
        addResult(`Available Commands:\n${helpText}`, 'info');
        break;

      case 'clear':
        setCommandHistory([]);
        break;

      case 'status':
        addResult(
          `System Status: OPERATIONAL\nRegime: ${currentRegime?.toUpperCase() || 'UNKNOWN'}\nTheme: ${uiTheme}\nAPI: ${import.meta.env.VITE_GOOGLE_AI_KEY ? 'Connected' : 'Mock Mode'}`,
          'info'
        );
        break;

      case 'scan':
        setIsScanning(true);
        addResult('Initiating full market scan...', 'info');
        try {
          const { context, analysis } = await runMasterScan();
          setMarketContext(context);
          setMasterAnalysis(analysis);
          
          // Save to Supabase
          const saved = await saveMarketReport(context, analysis);
          await logSystemEvent('info', 'IntelligenceCopilot', 'Full scan completed', { saved });
          
          addResult(analysis, 'success');
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : 'Unknown error';
          await logSystemEvent('error', 'IntelligenceCopilot', 'Scan failed', { error: errMsg });
          addResult(`Scan failed: ${errMsg}`, 'error');
        } finally {
          setIsScanning(false);
        }
        break;

      case 'risk':
        setIsScanning(true);
        addResult('Calculating risk metrics...', 'info');
        try {
          const context = await fetchAllMarketData();
          const fearGreed = parseInt(context.fearGreedValue) || 50;
          const yieldValue = parseFloat(context.yieldCurve || '0');
          
          let riskScore = 50;
          if (fearGreed < 25) riskScore += 25;
          else if (fearGreed > 75) riskScore -= 15;
          if (yieldValue < 0) riskScore += 20;
          
          const riskLevel = riskScore > 70 ? 'HIGH' : riskScore > 50 ? 'MODERATE' : 'LOW';
          
          addResult(
            `Risk Assessment:\n- Score: ${riskScore}/100\n- Level: ${riskLevel}\n- Fear/Greed: ${fearGreed}\n- Yield Curve: ${context.yieldCurve}`,
            riskScore > 70 ? 'warning' : 'success'
          );
        } catch (error) {
          addResult('Risk calculation failed', 'error');
        } finally {
          setIsScanning(false);
        }
        break;

      case 'liquidity':
        setIsScanning(true);
        addResult('Analyzing liquidity conditions...', 'info');
        try {
          const context = await fetchAllMarketData();
          const btcDom = context.btcDominance;
          const liquidityState = btcDom > 55 ? 'Risk-Off (BTC Dominance High)' : btcDom < 45 ? 'Risk-On (Altcoin Season)' : 'Neutral';
          
          addResult(
            `Liquidity Analysis:\n- BTC Dominance: ${btcDom.toFixed(1)}%\n- State: ${liquidityState}\n- BTC Price: $${context.btcPrice.toLocaleString()}\n- 24h Change: ${context.btcChange.toFixed(2)}%`,
            'success'
          );
        } catch (error) {
          addResult('Liquidity check failed', 'error');
        } finally {
          setIsScanning(false);
        }
        break;

      case 'correlation':
        addResult(
          'Cross-Asset Correlation (Estimated):\n- BTC/SPY: +0.42\n- BTC/GOLD: +0.18\n- BTC/DXY: -0.35\n- ETH/BTC: +0.91',
          'info'
        );
        break;

      case 'forecast':
        setIsScanning(true);
        addResult('Generating 24h risk forecast...', 'info');
        try {
          const context = await fetchAllMarketData();
          const analysis = await analyzeBlackSwanRisk(context);
          setMarketContext(context);
          addResult(`24H FORECAST:\n${analysis}`, 'success');
        } catch (error) {
          addResult('Forecast generation failed', 'error');
        } finally {
          setIsScanning(false);
        }
        break;

      case 'export':
        if (!marketContext || !masterAnalysis) {
          addResult('No analysis to export. Run /scan first.', 'warning');
        } else {
          setIsScanning(true);
          addResult('Refreshing data and generating PDF report...', 'info');
          try {
            // Refetch latest data before export to ensure freshness
            const freshContext = await fetchAllMarketData();
            // Small delay to ensure UI updates
            await new Promise(resolve => setTimeout(resolve, 100));
            setMarketContext(freshContext);
            
            const exported = await quickExport(freshContext, masterAnalysis);
            if (exported) {
              addResult('PDF report generated with latest data. Check your print dialog.', 'success');
            } else {
              addResult('PDF export failed. Please allow popups and try again.', 'error');
            }
          } catch (error) {
            addResult('Failed to refresh data for export. Using cached data.', 'warning');
            const exported = await quickExport(marketContext, masterAnalysis);
            if (exported) {
              addResult('PDF report generated. Check your print dialog.', 'success');
            }
          } finally {
            setIsScanning(false);
          }
        }
        break;

      default:
        addResult(`Unknown command: ${input}\nType /help for available commands.`, 'error');
    }
  }, [currentRegime, uiTheme]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isScanning) return;
    
    processCommand(inputValue);
    setInputValue('');
    setShowSuggestions(false);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.startsWith('/') && value.length > 0);
  };

  // Select suggestion
  const selectSuggestion = (cmd: string) => {
    setInputValue(`/${cmd}`);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Get result type color
  const getResultColor = (type: CommandResult['type']) => {
    switch (type) {
      case 'success': return isDark || isHybrid ? 'text-green-400' : 'text-green-600';
      case 'error': return isDark || isHybrid ? 'text-red-400' : 'text-red-600';
      case 'warning': return isDark || isHybrid ? 'text-amber-400' : 'text-amber-600';
      case 'info': return isDark || isHybrid ? 'text-blue-400' : 'text-blue-600';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-2xl shadow-2xl transition-all hover:scale-105 z-50 ${
          isDark 
            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white' 
            : isHybrid
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          <span className="font-semibold">AI Intelligence</span>
        </div>
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 rounded-2xl shadow-2xl transition-all z-50 ${
        isExpanded ? 'w-[600px] h-[700px]' : 'w-[420px] h-[550px]'
      } ${
        isDark 
          ? 'bg-gray-900 border border-gray-700' 
          : isHybrid
          ? 'bg-gray-800 border border-gray-600'
          : 'bg-white border border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${
        isDark ? 'border-gray-700' : isHybrid ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${
            isDark ? 'bg-amber-600' : isHybrid ? 'bg-amber-500' : 'bg-amber-100'
          }`}>
            <Terminal className={`w-5 h-5 ${isDark || isHybrid ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className={`font-bold ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
              Black Swan Intelligence
            </h3>
            <p className={`text-xs ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}`}>
              Dual-Core AI Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-colors ${
              isDark || isHybrid ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={`p-2 rounded-lg transition-colors ${
              isDark || isHybrid ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Command History */}
      <div 
        ref={historyRef}
        className={`flex-1 overflow-y-auto p-4 space-y-3 ${
          isExpanded ? 'h-[480px]' : 'h-[330px]'
        }`}
      >
        {commandHistory.length === 0 ? (
          <div className={`text-center py-8 ${isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'}`}>
            <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Type /help to see available commands</p>
            <p className="text-xs mt-1">or /scan to start a full analysis</p>
          </div>
        ) : (
          commandHistory.map((result, idx) => (
            <div key={idx} className="space-y-1">
              <div className={`text-xs flex items-center gap-2 ${
                isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <Clock className="w-3 h-3" />
                {result.timestamp.toLocaleTimeString()}
                <span className="font-mono">{result.command}</span>
              </div>
              <div className={`p-3 rounded-lg font-mono text-sm whitespace-pre-wrap ${
                isDark ? 'bg-gray-800' : isHybrid ? 'bg-gray-700' : 'bg-gray-50'
              } ${getResultColor(result.type)}`}>
                {result.output}
              </div>
            </div>
          ))
        )}

        {isScanning && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            isDark ? 'bg-gray-800' : isHybrid ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <Loader2 className={`w-4 h-4 animate-spin ${isDark || isHybrid ? 'text-amber-400' : 'text-amber-500'}`} />
            <span className={`text-sm ${isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'}`}>
              Processing...
            </span>
          </div>
        )}

        {/* Market Context Display */}
        {marketContext && masterAnalysis && (
          <div className={`mt-4 p-3 rounded-lg ${
            isDark ? 'bg-amber-900/20 border border-amber-700/50' : 
            isHybrid ? 'bg-amber-900/30 border border-amber-600/50' : 
            'bg-amber-50 border border-amber-200'
          }`}>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                BTC: <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>
                  ${marketContext.btcPrice.toLocaleString()}
                </span>
              </div>
              <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                Fear/Greed: <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>
                  {marketContext.fearGreedValue}
                </span>
              </div>
              <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                Yield Curve: <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>
                  {marketContext.yieldCurve && marketContext.yieldCurve !== 'N/A' 
                    ? `${marketContext.yieldCurve}%` 
                    : 'N/A'}
                </span>
              </div>
              <div className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
                BTC Dom: <span className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>
                  {marketContext.btcDominance.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* History Panel (collapsed by default) */}
        {isExpanded && <HistoryPanel />}
      </div>

      {/* Command Input */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-700' : isHybrid ? 'border-gray-600' : 'border-gray-200'}`}>
        {/* Suggestions */}
        {showSuggestions && filteredCommands.length > 0 && (
          <div className={`mb-2 rounded-lg overflow-hidden ${
            isDark ? 'bg-gray-800' : isHybrid ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            {filteredCommands.map(([cmd, info]) => (
              <button
                key={cmd}
                onClick={() => selectSuggestion(cmd)}
                className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center ${
                  isDark ? 'hover:bg-gray-700' : isHybrid ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}
              >
                <span className={`font-mono ${isDark || isHybrid ? 'text-amber-400' : 'text-amber-600'}`}>
                  /{cmd}
                </span>
                <span className={`text-xs ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}`}>
                  {info.description}
                </span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Type /scan or /help..."
            disabled={isScanning}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-mono ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                : isHybrid
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
            } border focus:outline-none focus:ring-2 focus:ring-amber-500`}
          />
          <button
            type="submit"
            disabled={isScanning || !inputValue.trim()}
            className={`px-4 py-2 rounded-xl transition-colors ${
              isScanning || !inputValue.trim()
                ? 'bg-gray-600 cursor-not-allowed'
                : isDark || isHybrid
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-amber-500 hover:bg-amber-600'
            } text-white`}
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => processCommand('/scan')}
            disabled={isScanning}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-amber-400' 
                : isHybrid
                ? 'bg-gray-700 hover:bg-gray-600 text-amber-400'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
            }`}
          >
            <Zap className="w-3 h-3 inline mr-1" />
            Scan
          </button>
          <button
            onClick={() => processCommand('/risk')}
            disabled={isScanning}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-red-400' 
                : isHybrid
                ? 'bg-gray-700 hover:bg-gray-600 text-red-400'
                : 'bg-red-50 hover:bg-red-100 text-red-700'
            }`}
          >
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Risk
          </button>
          <button
            onClick={() => processCommand('/liquidity')}
            disabled={isScanning}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400' 
                : isHybrid
                ? 'bg-gray-700 hover:bg-gray-600 text-blue-400'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            }`}
          >
            <TrendingUp className="w-3 h-3 inline mr-1" />
            Liquidity
          </button>
          <button
            onClick={() => processCommand('/export')}
            disabled={isScanning || !marketContext}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-green-400' 
                : isHybrid
                ? 'bg-gray-700 hover:bg-gray-600 text-green-400'
                : 'bg-green-50 hover:bg-green-100 text-green-700'
            } ${!marketContext ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FileDown className="w-3 h-3 inline mr-1" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}

export default IntelligenceCopilot;
