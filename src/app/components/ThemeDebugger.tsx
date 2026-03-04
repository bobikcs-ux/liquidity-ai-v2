import React from 'react';
import { Settings, X } from 'lucide-react';
import { useAdaptiveTheme, MarketRegime } from '../context/AdaptiveThemeContext';

export function ThemeDebugger() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { currentRegime, uiTheme } = useAdaptiveTheme();
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-40 lg:bottom-24 right-8 w-12 h-12 bg-gray-900 rounded-full shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center z-50"
      >
        <Settings className="w-5 h-5 text-white" />
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-40 lg:bottom-24 right-8 w-[320px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Regime Simulator
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-gray-400 mb-1">Current Regime</div>
          <div className="text-white font-semibold">
            {currentRegime.regime.toUpperCase()}
          </div>
        </div>
        
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-gray-400 mb-1">UI Theme</div>
          <div className="text-white font-semibold">
            {uiTheme.toUpperCase()}
          </div>
        </div>
        
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="text-gray-400 mb-2">Metrics</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Risk Level:</span>
              <span className="text-white font-medium">{currentRegime.riskLevel}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Confidence:</span>
              <span className="text-white font-medium">{currentRegime.confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volatility:</span>
              <span className="text-white font-medium">{currentRegime.volatilityIndex}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Liquidity:</span>
              <span className="text-white font-medium">{currentRegime.liquidityScore}</span>
            </div>
          </div>
        </div>
        
        <div className="p-3 bg-blue-900/30 border border-blue-800 rounded-lg">
          <div className="text-blue-300 text-xs leading-relaxed">
            💡 Refresh page to cycle through different regimes. The UI adapts automatically based on market conditions.
          </div>
        </div>
      </div>
    </div>
  );
}
