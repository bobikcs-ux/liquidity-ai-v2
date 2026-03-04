import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Market Regime Types
export type MarketRegime = 'expansionary' | 'neutral' | 'contraction' | 'stress';

export type UITheme = 'light' | 'hybrid' | 'terminal';

export interface RegimeData {
  regime: MarketRegime;
  confidence: number;
  riskLevel: number; // 0-100
  volatilityIndex: number;
  liquidityScore: number;
}

interface AdaptiveThemeContextType {
  currentRegime: RegimeData;
  uiTheme: UITheme;
  setManualOverride: (theme: UITheme | null) => void;
}

const AdaptiveThemeContext = createContext<AdaptiveThemeContextType | undefined>(undefined);

// Regime AI Engine Simulator
function getRegimeFromAPI(): RegimeData {
  // In production, this would call your real AI engine
  // For demo, we'll simulate different regimes based on time
  const hour = new Date().getHours();
  
  if (hour % 3 === 0) {
    return {
      regime: 'stress',
      confidence: 92,
      riskLevel: 85,
      volatilityIndex: 68,
      liquidityScore: 23,
    };
  } else if (hour % 3 === 1) {
    return {
      regime: 'contraction',
      confidence: 78,
      riskLevel: 58,
      volatilityIndex: 42,
      liquidityScore: 51,
    };
  } else {
    return {
      regime: 'expansionary',
      confidence: 87,
      riskLevel: 22,
      volatilityIndex: 15,
      liquidityScore: 82,
    };
  }
}

// Determine UI theme based on regime
function getUIThemeForRegime(regimeData: RegimeData): UITheme {
  const { regime, riskLevel } = regimeData;
  
  // Stress phase → Full Terminal Mode
  if (regime === 'stress' || riskLevel > 75) {
    return 'terminal';
  }
  
  // Uncertain market → Hybrid Mode
  if (regime === 'contraction' || (riskLevel > 40 && riskLevel <= 75)) {
    return 'hybrid';
  }
  
  // Stable market → Light Research Mode
  return 'light';
}

export function AdaptiveThemeProvider({ children }: { children: ReactNode }) {
  const [currentRegime, setCurrentRegime] = useState<RegimeData>(getRegimeFromAPI());
  const [manualOverride, setManualOverride] = useState<UITheme | null>(null);
  
  // Update regime data periodically (every 30 seconds in production, more frequently for demo)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRegime(getRegimeFromAPI());
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const uiTheme = manualOverride || getUIThemeForRegime(currentRegime);
  
  // Apply theme classes to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiTheme);
    document.documentElement.setAttribute('data-regime', currentRegime.regime);
  }, [uiTheme, currentRegime.regime]);
  
  return (
    <AdaptiveThemeContext.Provider
      value={{
        currentRegime,
        uiTheme,
        setManualOverride,
      }}
    >
      {children}
    </AdaptiveThemeContext.Provider>
  );
}

export function useAdaptiveTheme() {
  const context = useContext(AdaptiveThemeContext);
  if (!context) {
    throw new Error('useAdaptiveTheme must be used within AdaptiveThemeProvider');
  }
  return context;
}
