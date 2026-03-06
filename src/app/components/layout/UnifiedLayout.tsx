import React, { useCallback, memo } from 'react';
import { Outlet, useLocation, Link } from 'react-router';
import { 
  Home, 
  Brain, 
  FlaskConical, 
  FileText, 
  Database, 
  User,
  TrendingUp,
  Moon,
  Sun,
  Zap,
  AlertTriangle,
  Shield,
  Menu,
  ChevronLeft,
  Crown,
  Cpu,
  X,
  MoreHorizontal,
  Activity
} from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../ui/drawer';
import { useAdaptiveTheme } from '../../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../../hooks/useMarketSnapshot';
import { useUserRole } from '../../context/UserRoleContext';
import { InstitutionalQR } from '../ProModal';
import { DataSourceStatusCompact } from '../DataSourceStatus';
import { GlobalStatusBar } from '../GlobalStatusBar';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/triad', label: 'Triad', icon: TrendingUp },
  { path: '/agi-terminal', label: 'AGI Terminal', icon: Cpu },
  { path: '/intelligence', label: 'Intelligence', icon: Brain },
  { path: '/sovereign', label: 'Sovereign', icon: Crown },
  { path: '/citadel', label: 'Citadel', icon: Activity },
  { path: '/capital-survival', label: 'Capital AI', icon: Shield },
  { path: '/stress-lab', label: 'Stress Lab', icon: FlaskConical },
  { path: '/black-swan', label: 'Black Swan', icon: AlertTriangle },
  { path: '/energy-finance', label: 'Energy', icon: Zap },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/data-sources', label: 'Data', icon: Database },
];

export function UnifiedLayout() {
  const location = useLocation();
  const { currentRegime, uiTheme, setManualOverride } = useAdaptiveTheme();
  const { latest: snapshot, loading: snapshotLoading } = useMarketSnapshot();
  const { isPro } = useUserRole();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  
  // Format values from Supabase snapshot
  const systemicRisk = snapshot?.systemic_risk != null 
    ? (snapshot.systemic_risk > 1 ? snapshot.systemic_risk : Math.round(snapshot.systemic_risk * 100))
    : 67.3;
  const survivalProb = snapshot?.survival_probability != null 
    ? (snapshot.survival_probability > 1 ? snapshot.survival_probability : Math.round(snapshot.survival_probability * 100))
    : 78;
  const yieldSpread = snapshot?.yield_spread?.toFixed(2) ?? '-0.23';
  const btcVolatility = snapshot?.btc_volatility != null 
    ? (snapshot.btc_volatility > 1 ? snapshot.btc_volatility.toFixed(2) : (snapshot.btc_volatility * 100).toFixed(1))
    : '0.42';

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };
  
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname === path;
  };

  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  // Check if regime is "stress" from latest snapshot
  const isStressRegime = snapshot?.regime === 'stress' || currentRegime.regime === 'stress';
  
  // Regime indicator color
  const getRegimeColor = () => {
    switch (currentRegime.regime) {
      case 'stress':
        return 'bg-red-500';
      case 'contraction':
        return 'bg-amber-500';
      default:
        return 'bg-green-500';
    }
  };
  
  // Stress badge styles with pulse animation
  const stressBadgeClass = isStressRegime 
    ? 'bg-red-500/20 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse' 
    : '';

  return (
    <div className="min-h-[100dvh] transition-colors duration-500"
      style={{ backgroundColor: isDark ? '#0F1419' : isHybrid ? '#1a1f2e' : '#F8F9FA' }}
    >
      {/* Global Status Bar - Thin fixed header for institutional terminal feel */}
      {(isDark || isHybrid) && (
        <GlobalStatusBar className="fixed top-0 left-0 right-0 z-50" />
      )}
      
      {/* Top Bar - Adjusts position based on GlobalStatusBar presence */}
      <div className={`border-b fixed left-0 right-0 z-40 transition-colors duration-500 ${
        (isDark || isHybrid) ? 'top-[36px]' : 'top-0'
      } ${
        isDark ? 'bg-[#1a2332] border-blue-900' : isHybrid ? 'bg-[#242b3d] border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-blue-600' : isHybrid ? 'bg-blue-500' : 'bg-[#2563EB]'
            }`}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-semibold ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Liquidity.ai
            </span>
          </div>

          {/* Current Regime Indicator - Hidden on mobile, centered on tablet/desktop */}
          <div className={`hidden md:flex items-center justify-center gap-3 px-4 py-2 rounded-lg transition-all ${
            isDark ? 'bg-gray-900/50' : isHybrid ? 'bg-gray-800/50' : 'bg-[#F0F9FF]'
          } ${stressBadgeClass}`}>
            <div className={`w-2 h-2 rounded-full ${isStressRegime ? 'animate-ping' : 'animate-pulse'} ${getRegimeColor()}`}></div>
            <span className={`text-sm font-medium ${
              isStressRegime ? 'text-red-400' : isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              {currentRegime.regime.charAt(0).toUpperCase() + currentRegime.regime.slice(1)}
            </span>
            <span className={`text-sm tabular-nums min-w-[5rem] ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {currentRegime.confidence}% confidence
            </span>
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Theme Toggle */}
            <button 
              onClick={() => setManualOverride(uiTheme === 'terminal' ? 'light' : 'terminal')}
              aria-label={`Switch to ${uiTheme === 'terminal' ? 'light' : 'dark'} theme`}
              className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : isHybrid ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {uiTheme === 'terminal' ? (
                <Sun className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-gray-600'}`} />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            {/* Hamburger Menu Drawer */}
            <Drawer>
              <DrawerTrigger asChild>
                <button 
                  className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700' : isHybrid ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  aria-label="Open navigation menu"
                >
                  <Menu className={`w-5 h-5 ${isDark || isHybrid ? 'text-white' : 'text-gray-700'}`} />
                </button>
              </DrawerTrigger>
              <DrawerContent className={`${
                isDark ? 'bg-[#1a2332] border-blue-900' : isHybrid ? 'bg-[#242b3d] border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <DrawerHeader className={`border-b ${isDark ? 'border-blue-900/50' : isHybrid ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <DrawerTitle className={isDark || isHybrid ? 'text-white' : 'text-gray-900'}>
                      Navigation
                    </DrawerTitle>
                    <DrawerClose asChild>
                      <button 
                        className={`p-2 rounded-lg ${isDark || isHybrid ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        aria-label="Close menu"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </DrawerClose>
                  </div>
                </DrawerHeader>
                <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                  {/* All nav items */}
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <DrawerClose key={item.path} asChild>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all touch-manipulation min-h-[56px] ${
                            active
                              ? isDark || isHybrid
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#2563EB] text-white'
                              : isDark || isHybrid
                              ? 'text-gray-300 hover:bg-gray-800 active:bg-gray-700'
                              : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                          }`}
                        >
                          <Icon className="w-6 h-6 flex-shrink-0" />
                          <span className="font-medium text-base">{item.label}</span>
                        </Link>
                      </DrawerClose>
                    );
                  })}
                  
                  {/* Data Sources */}
                  <DrawerClose asChild>
                    <Link
                      to="/data-sources"
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all touch-manipulation min-h-[56px] ${
                        isActive('/data-sources')
                          ? isDark || isHybrid
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#2563EB] text-white'
                          : isDark || isHybrid
                          ? 'text-gray-300 hover:bg-gray-800 active:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <Database className="w-6 h-6 flex-shrink-0" />
                      <span className="font-medium text-base">Data Sources</span>
                    </Link>
                  </DrawerClose>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Theme Indicator & PRO Badge */}
          <div className="hidden lg:flex items-center gap-3">
            {/* PRO Badge (shown when user is PRO) */}
            {isPro && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <Crown className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold">PRO MEMBER</span>
              </div>
            )}
            
            <button 
              onClick={() => setManualOverride(uiTheme === 'terminal' ? 'light' : 'terminal')}
              aria-label={`Switch to ${uiTheme === 'terminal' ? 'light research' : 'dark terminal'} theme. Currently using ${uiTheme === 'terminal' ? 'Terminal' : uiTheme === 'hybrid' ? 'Hybrid' : 'Research'} mode.`}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : isHybrid ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {uiTheme === 'terminal' ? (
                <Sun className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
              ) : (
                <Moon className={`w-4 h-4 text-gray-600`} />
              )}
              <span className={`text-xs font-medium ${
                isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {uiTheme === 'terminal' ? 'Terminal' : uiTheme === 'hybrid' ? 'Hybrid' : 'Research'}
              </span>
            </button>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isDark || isHybrid ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className={`text-xs font-medium ${
                isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Verified
              </span>
            </div>
          </div>
        </div>

        {/* Macro Ticker - Centered on mobile */}
        <div className={`border-t px-4 lg:px-6 py-2 overflow-x-auto ${
          isDark ? 'border-blue-900/50 bg-gray-900/30' : isHybrid ? 'border-gray-700 bg-gray-800/30' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-center justify-center md:justify-start gap-6 text-xs whitespace-nowrap">
            {/* Mobile Regime Status - Only shows on mobile */}
            <div className={`flex md:hidden items-center gap-2 px-2 py-1 rounded ${isStressRegime ? 'bg-red-500/10 border border-red-500/30' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${isStressRegime ? 'animate-ping' : 'animate-pulse'} ${getRegimeColor()}`}></div>
              <span className={isStressRegime ? 'text-red-400 font-semibold' : isDark || isHybrid ? 'text-gray-200' : 'text-gray-500'}>
                {currentRegime.regime.toUpperCase()}
              </span>
              <span className={`font-medium ${isStressRegime ? 'text-red-300' : isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                {currentRegime.confidence}%
              </span>
            </div>
            
            <div className={`hidden md:block w-px h-4 ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            
            <div className="flex items-center gap-2">
              <span className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-500'}>SRI</span>
              <span className={`font-medium tabular-nums min-w-[2.5rem] ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                {snapshotLoading ? <span className="inline-block w-8 h-4 bg-gray-700 rounded animate-pulse" /> : systemicRisk}
              </span>
              <span className={`min-w-[2.5rem] font-semibold ${systemicRisk > 50 ? 'text-red-600' : isDark || isHybrid ? 'text-emerald-400' : 'text-green-700'}`}>
                {systemicRisk > 50 ? 'HIGH' : 'OK'}
              </span>
            </div>
            <div className={`w-px h-4 ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className="flex items-center gap-2">
              <span className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-500'}>Survival</span>
              <span className={`font-medium tabular-nums min-w-[3rem] ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                {snapshotLoading ? <span className="inline-block w-10 h-4 bg-gray-700 rounded animate-pulse" /> : `${survivalProb}%`}
              </span>
              <span className={`min-w-[4rem] font-semibold ${survivalProb >= 70 ? (isDark || isHybrid ? 'text-emerald-400' : 'text-green-700') : survivalProb >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {survivalProb >= 70 ? 'SAFE' : survivalProb >= 50 ? 'CAUTION' : 'RISK'}
              </span>
            </div>
            <div className={`w-px h-4 ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className="flex items-center gap-2">
              <span className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-500'}>Yield</span>
              <span className={`font-medium tabular-nums min-w-[3.5rem] ${parseFloat(yieldSpread) < 0 ? 'text-red-400' : 'text-white'}`}>
                {snapshotLoading ? <span className="inline-block w-12 h-4 bg-gray-700 rounded animate-pulse" /> : `${yieldSpread}%`}
              </span>
            </div>
            
            {/* Risk Level Indicator (shows in terminal/hybrid mode) */}
            {(isDark || isHybrid) && (
              <>
                <div className="w-px h-4 bg-gray-700"></div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-red-500" />
                  <span className="text-gray-200">Risk</span>
                  <span className="font-medium tabular-nums min-w-[2.5rem] text-red-400">{currentRegime.riskLevel}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar - Adjusts position based on GlobalStatusBar presence */}
      <aside className={`hidden lg:block fixed left-0 bottom-0 border-r z-30 transition-all duration-300 ${
        (isDark || isHybrid) ? 'top-[140px]' : 'top-[104px]'
      } ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } ${
        isDark ? 'bg-[#1a2332] border-blue-900' : isHybrid ? 'bg-[#242b3d] border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Toggle Button */}
        <div className="absolute -right-3 top-6 z-40">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all hover:scale-110 ${
              isDark ? 'bg-gray-800 border-blue-900 text-gray-300 hover:bg-gray-700' : 
              isHybrid ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 
              'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {sidebarCollapsed ? (
              <Menu className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label={`Navigate to ${item.label}`}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 relative group ${
                  active
                    ? isDark || isHybrid
                      ? 'bg-[rgba(212,175,55,0.15)] text-[#d4af37] border-l-2 border-[#d4af37] shadow-[inset_0_0_20px_rgba(212,175,55,0.1),0_0_15px_rgba(212,175,55,0.2)] rounded-r-lg'
                      : 'bg-[#2563EB] text-white shadow-md rounded-xl'
                    : isDark || isHybrid
                    ? 'text-gray-400 hover:text-[#d4af37] hover:bg-[rgba(212,175,55,0.05)] hover:border-l-2 hover:border-[rgba(212,175,55,0.3)] rounded-r-lg border-l-2 border-transparent'
                    : 'text-gray-600 hover:bg-gray-50 rounded-xl'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                  active && (isDark || isHybrid) ? 'text-[#d4af37]' : ''
                } group-hover:scale-110`} />
                <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                  sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                } ${active && (isDark || isHybrid) ? 'font-mono tracking-wide' : ''}`}>
                  {item.label}
                </span>
                
                {/* Active glow indicator */}
                {active && (isDark || isHybrid) && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                )}
                
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className={`absolute left-full ml-2 px-3 py-2 rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${
                    isDark || isHybrid ? 'bg-[#0f1113] text-[#d4af37] border border-[rgba(212,175,55,0.2)]' : 'bg-gray-900 text-white'
                  }`}>
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area - Adjusts for GlobalStatusBar */}
      <main className={`flex-1 pb-8 lg:pb-24 transition-all duration-300 ${
        (isDark || isHybrid) ? 'pt-[148px] lg:pt-[165px]' : 'pt-[112px] lg:pt-[129px]'
      } ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      } ${
        isDark ? 'bg-[#0F1419]' : isHybrid ? 'bg-[#1a1f2e]' : 'bg-[#F8F9FA]'
      }`}>
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-10 py-6">
          <Outlet />
        </div>
        
        {/* Footer */}
        <footer className={`mt-12 border-t py-8 transition-all duration-300 ${
          isDark ? 'border-gray-800' : isHybrid ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className={`text-sm ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
                  &copy; 2026 Studio Bobikcs. All rights reserved.
                </div>
                {/* System Status Indicator - fixed dimensions */}
                <div className="flex items-center gap-2 min-w-[140px]" aria-label="System status: Live">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className={`text-xs font-medium ${isDark || isHybrid ? 'text-emerald-400' : 'text-green-700'}`}>
                    System Status: LIVE
                  </span>
                </div>
              </div>
              
              {/* Center - Terminal QR - Production Spec: Black on White, 220px, Level H */}
              <div className="hidden md:flex items-center gap-4">
                <DataSourceStatusCompact />
                <InstitutionalQR 
                  size={64} 
                  label=""
                />
              </div>
              
              <div className={`text-sm font-medium text-center md:text-right ${isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-mono tracking-wider">BOBIKCS // TERMINAL</span>
                <span className={`block text-[10px] mt-1 ${isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'}`}>
                  Professional Risk Intelligence Platform
                </span>
              </div>
            </div>
          </div>
        </footer>
      </main>

      

    </div>
  );
}
