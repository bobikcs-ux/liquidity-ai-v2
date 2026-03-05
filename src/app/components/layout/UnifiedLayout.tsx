import React from 'react';
import { Outlet, useLocation, Link } from 'react-router';
import { 
  Home, 
  Brain, 
  FlaskConical, 
  FileText, 
  Database, 
  User,
  TrendingUp,
  TrendingDown,
  Moon,
  Sun,
  Zap,
  AlertTriangle,
  Shield,
  Menu,
  ChevronLeft,
  Crown
} from 'lucide-react';
import { useAdaptiveTheme } from '../../context/AdaptiveThemeContext';
import { useMarketSnapshot } from '../../hooks/useMarketSnapshot';
import { useUserRole } from '../../context/UserRoleContext';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: Home },
  { path: '/intelligence', label: 'Intelligence', icon: Brain },
  { path: '/capital-survival', label: 'Capital AI', icon: Shield },
  { path: '/stress-lab', label: 'Stress Lab', icon: FlaskConical },
  { path: '/black-swan', label: 'Black Swan', icon: AlertTriangle },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/profile', label: 'Profile', icon: User },
];

export function UnifiedLayout() {
  const location = useLocation();
  const { currentRegime, uiTheme, setManualOverride } = useAdaptiveTheme();
  const { latest: snapshot, loading: snapshotLoading } = useMarketSnapshot();
  const { isPro, setUserRole, userRole } = useUserRole();
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

  return (
    <div className="min-h-screen transition-colors duration-500"
      style={{ backgroundColor: isDark ? '#0F1419' : isHybrid ? '#1a1f2e' : '#F8F9FA' }}
    >
      {/* Top Bar */}
      <div className={`border-b fixed top-0 left-0 right-0 z-40 transition-colors duration-500 ${
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
          <div className={`hidden md:flex items-center justify-center gap-3 px-4 py-2 rounded-lg ${
            isDark ? 'bg-gray-900/50' : isHybrid ? 'bg-gray-800/50' : 'bg-[#F0F9FF]'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${getRegimeColor()}`}></div>
            <span className={`text-sm font-medium ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              {currentRegime.regime.charAt(0).toUpperCase() + currentRegime.regime.slice(1)}
            </span>
            <span className={`text-sm tabular-nums min-w-[5rem] ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {currentRegime.confidence}% confidence
            </span>
          </div>

          {/* Theme Indicator & Manual Override */}
          <div className="hidden lg:flex items-center gap-3">
            {/* PRO/FREE Toggle */}
            <button 
              onClick={() => setUserRole(isPro ? 'FREE' : 'PRO')}
              aria-label={isPro ? 'Switch to FREE tier' : 'Switch to PRO tier'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                isPro 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' 
                  : isDark || isHybrid 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Crown className={`w-4 h-4 ${isPro ? 'text-white' : isDark || isHybrid ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className="text-xs font-medium">
                {isPro ? 'PRO' : 'FREE'}
              </span>
            </button>
            
            <button 
              onClick={() => setManualOverride(uiTheme === 'terminal' ? 'light' : 'terminal')}
              aria-label={uiTheme === 'terminal' ? 'Switch to light theme' : 'Switch to terminal theme'}
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
            <div className="flex md:hidden items-center gap-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${getRegimeColor()}`}></div>
              <span className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-500'}>
                {currentRegime.regime.toUpperCase()}
              </span>
              <span className={`font-medium ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                {currentRegime.confidence}%
              </span>
            </div>
            
            <div className={`hidden md:block w-px h-4 ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            
            <div className="flex items-center gap-2">
              <span className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-500'}>SRI</span>
              <span className={`font-medium tabular-nums min-w-[2.5rem] ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                {snapshotLoading ? <span className="inline-block w-8 h-4 bg-gray-700 rounded animate-pulse" /> : systemicRisk}
              </span>
              <span className={`min-w-[2.5rem] ${systemicRisk > 50 ? 'text-red-600' : 'text-green-600'}`}>
                {systemicRisk > 50 ? 'HIGH' : 'OK'}
              </span>
            </div>
            <div className={`w-px h-4 ${isDark || isHybrid ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <div className="flex items-center gap-2">
              <span className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-500'}>Survival</span>
              <span className={`font-medium tabular-nums min-w-[3rem] ${isDark || isHybrid ? 'text-white' : 'text-gray-900'}`}>
                {snapshotLoading ? <span className="inline-block w-10 h-4 bg-gray-700 rounded animate-pulse" /> : `${survivalProb}%`}
              </span>
              <span className={`min-w-[4rem] ${survivalProb >= 70 ? 'text-green-600' : survivalProb >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
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

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block fixed left-0 top-[104px] bottom-0 border-r z-30 transition-all duration-300 ${
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                  active
                    ? isDark || isHybrid
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-[#2563EB] text-white shadow-md'
                    : isDark || isHybrid
                    ? 'text-gray-300 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                  sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                }`}>
                  {item.label}
                </span>
                
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className={`absolute left-full ml-2 px-3 py-2 rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${
                    isDark || isHybrid ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
                  }`}>
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
          
          <div className={`pt-4 mt-4 border-t ${
            isDark || isHybrid ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <Link
              to="/data-sources"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                isActive('/data-sources')
                  ? isDark || isHybrid
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-[#2563EB] text-white shadow-md'
                  : isDark || isHybrid
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={sidebarCollapsed ? 'Data Sources' : undefined}
            >
              <Database className="w-5 h-5 flex-shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              }`}>
                Data Sources
              </span>
              
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className={`absolute left-full ml-2 px-3 py-2 rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${
                  isDark || isHybrid ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'
                }`}>
                  Data Sources
                </div>
              )}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 pt-[112px] lg:pt-[129px] pb-20 lg:pb-8 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
      } ${
        isDark ? 'bg-[#0F1419]' : isHybrid ? 'bg-[#1a1f2e]' : 'bg-[#F8F9FA]'
      }`}>
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-10 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className={`lg:hidden fixed bottom-0 left-0 right-0 border-t z-40 transition-colors duration-500 ${
        isDark ? 'bg-[#1a2332] border-blue-900' : isHybrid ? 'bg-[#242b3d] border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  active
                    ? isDark || isHybrid
                      ? 'text-blue-400'
                      : 'text-[#2563EB]'
                    : isDark || isHybrid
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
