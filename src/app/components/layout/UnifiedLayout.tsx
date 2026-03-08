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
  Activity,
  DollarSign,
  Globe,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { useIntelligenceLogs } from '../../hooks/useIntelligenceLogs';

// Safe Icon Component - Prevents UI crash if icon is missing
interface SafeIconProps {
  icon?: LucideIcon | null;
  className?: string;
  fallback?: React.ReactNode;
}

const SafeIcon: React.FC<SafeIconProps> = ({ icon: Icon, className = '', fallback = null }) => {
  if (!Icon) return <span className={className}>{fallback}</span>;
  return <Icon className={className} />;
};
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

import { DataSourceStatusCompact } from '../DataSourceStatus';
import { GlobalStatusBar } from '../GlobalStatusBar';

// Merged navigation - same items for desktop and mobile
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
  { path: '/data-sources', label: 'Data Sources', icon: Database },
];

export function UnifiedLayout() {
  const location = useLocation();
  const { currentRegime, uiTheme, setManualOverride } = useAdaptiveTheme();
  const { latest: snapshot, loading: snapshotLoading } = useMarketSnapshot();
  const { isPro } = useUserRole();
  const { logs } = useIntelligenceLogs(true);
  
  // Pin the latest SYSTEM_ALERT (REALITY_DIVERGENCE) if present, auto-dismiss after 60s
  const [alertDismissed, setAlertDismissed] = React.useState(false);
  const systemAlert = React.useMemo(
    () => logs.find(l => l.type === 'SYSTEM_ALERT') ?? null,
    [logs]
  );
  // Auto-dismiss after 60 seconds
  React.useEffect(() => {
    if (!systemAlert) return;
    setAlertDismissed(false);
    const t = setTimeout(() => setAlertDismissed(true), 60_000);
    return () => clearTimeout(t);
  }, [systemAlert?.title]);
  
  // Mounted state to prevent hydration mismatch on theme toggle
  const [mounted, setMounted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  
  // Set mounted after hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
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
      style={{ backgroundColor: isDark ? '#09090b' : isHybrid ? '#0c0c0f' : '#F8F9FA' }}
    >
      {/* Global Status Bar - Thin fixed header for institutional terminal feel */}
      {(isDark || isHybrid) && (
        <GlobalStatusBar className="fixed top-0 left-0 right-0 z-50" />
      )}

      {/* REALITY_DIVERGENCE banner — shown when a SYSTEM_ALERT is in intel_feed */}
      {systemAlert && !alertDismissed && (isDark || isHybrid) && (
        <div
          className="fixed left-0 right-0 z-[110] flex items-center gap-3 px-4 py-2"
          style={{
            top: (isDark || isHybrid) ? '36px' : '0',
            background: 'rgba(255, 59, 92, 0.10)',
            borderBottom: '1px solid rgba(255, 59, 92, 0.45)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#ff3b5c]" />
          <span className="text-xs font-mono font-bold text-[#ff3b5c] tracking-widest uppercase mr-2">
            {systemAlert.title}
          </span>
          <span className="text-xs font-mono text-zinc-400 truncate flex-1 hidden sm:block">
            {systemAlert.content.slice(0, 120)}…
          </span>
          <CheckCircle2 className="w-3.5 h-3.5 text-[#ff3b5c]/60 flex-shrink-0" />
          <button
            onClick={() => setAlertDismissed(true)}
            aria-label="Dismiss alert"
            className="ml-1 text-zinc-500 hover:text-zinc-300 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      {/* Top Bar - Adjusts position based on GlobalStatusBar + alert banner presence */}
      <div className={`border-b fixed left-0 right-0 z-[100] transition-all duration-300 ${
        (isDark || isHybrid)
          ? (systemAlert && !alertDismissed ? 'top-[68px]' : 'top-[36px]')
          : 'top-0'
      } ${
        isDark ? 'bg-zinc-950 border-[#A3937B]/15' : isHybrid ? 'bg-zinc-950 border-[#A3937B]/10' : 'bg-white border-gray-200'
      }`}>
        <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
{/* Logo */}
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark || isHybrid ? 'bg-[#A3937B]/15 border border-[#A3937B]/25' : 'bg-[#2563EB]'
              }`}>
                <TrendingUp className={`w-5 h-5 ${isDark || isHybrid ? 'text-[#A3937B]' : 'text-white'}`} />
              </div>
              <span className={`text-xl font-semibold ${
                isDark || isHybrid ? 'text-[#B8A892]' : 'text-gray-900'
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
            {/* Mobile PRO Button - Pulsating */}
            {!isPro && (
              <a 
                href="https://bobikcs.com/the-vault"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Unlock PRO access"
                className="flex items-center justify-center w-11 h-11 rounded-xl transition-all hover:scale-105 pro-pulse"
                style={{ 
                  backgroundColor: '#A3937B',
                  boxShadow: '0 0 12px rgba(163, 147, 123, 0.5)'
                }}
              >
                <Crown className="w-5 h-5 text-black" />
              </a>
            )}
            
            {/* Theme Toggle - Protected with mounted state */}
            {mounted && (
              <button 
                onClick={() => setManualOverride(uiTheme === 'terminal' ? 'light' : 'terminal')}
                aria-label={`Switch to ${uiTheme === 'terminal' ? 'light' : 'dark'} theme`}
                className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
                  isDark || isHybrid ? 'bg-zinc-900 hover:bg-zinc-800 border border-[#A3937B]/20' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {uiTheme === 'terminal' ? (
                  <Sun className="w-5 h-5 text-[#A3937B]" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}
            
            {/* Hamburger Menu Drawer */}
            <Drawer>
              <DrawerTrigger asChild>
                <button 
                  className={`flex items-center justify-center w-11 h-11 rounded-xl transition-colors ${
                    isDark || isHybrid ? 'bg-zinc-900 hover:bg-zinc-800 border border-[#A3937B]/20' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  aria-label="Open navigation menu"
                >
                  <Menu className={`w-5 h-5 ${isDark || isHybrid ? 'text-[#A3937B]' : 'text-gray-700'}`} />
                </button>
              </DrawerTrigger>
              <DrawerContent className={`z-[120] ${
                isDark || isHybrid ? 'bg-zinc-950 border-[#A3937B]/15' : 'bg-white border-gray-200'
              }`}>
                <DrawerHeader className={`border-b ${isDark || isHybrid ? 'border-[#A3937B]/15' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <DrawerTitle className={isDark || isHybrid ? 'text-[#A3937B] font-mono tracking-wider' : 'text-gray-900'}>
                      NAVIGATION
                    </DrawerTitle>
                    <DrawerClose asChild>
                      <button 
                        className={`p-2 rounded-lg ${isDark || isHybrid ? 'hover:bg-zinc-900 text-[#A3937B]/70 hover:text-[#A3937B]' : 'hover:bg-gray-100 text-gray-500'}`}
                        aria-label="Close menu"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </DrawerClose>
                  </div>
                </DrawerHeader>
                <div className="p-4 space-y-2 max-h-[70vh] overflow-y-auto">
                  {/* All nav items */}
                  {(navItems || []).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <DrawerClose key={item.path} asChild>
                        <Link
                          to={item.path}
                          aria-label={`Navigate to ${item.label}`}
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all touch-manipulation min-h-[56px] ${
                            active
                              ? isDark || isHybrid
                                ? 'bg-[#A3937B]/15 text-[#A3937B] border border-[#A3937B]/20'
                                : 'bg-[#2563EB] text-white'
                              : isDark || isHybrid
                              ? 'text-zinc-400 hover:bg-zinc-900 hover:text-[#A3937B] active:bg-zinc-800'
                              : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                          }`}
                        >
                          <Icon className={`w-6 h-6 flex-shrink-0 ${active && (isDark || isHybrid) ? 'text-[#A3937B]' : ''}`} />
                          <span className="font-medium text-base">{item.label}</span>
                        </Link>
                      </DrawerClose>
                    );
                  })}
                  

                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Theme Indicator & PRO Badge */}
          <div className="hidden lg:flex items-center gap-3">
            {/* PRO Button - Pulsating link to The Vault */}
            {!isPro && (
              <a 
                href="https://bobikcs.com/the-vault"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Unlock PRO access at The Vault"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-black transition-all hover:scale-105 pro-pulse"
                style={{ 
                  backgroundColor: '#A3937B',
                  boxShadow: '0 0 15px rgba(163, 147, 123, 0.5)'
                }}
              >
                <Crown className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wide">PRO</span>
              </a>
            )}
            
            {/* PRO Badge (shown when user is PRO) - Interactive with glow */}
            {isPro && (
              <a 
                href="https://bobikcs.com/the-vault"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit The Vault - PRO Member"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-black transition-all hover:scale-105 pro-pulse cursor-pointer"
                style={{ 
                  background: 'linear-gradient(135deg, #A3937B 0%, #8B7D6B 100%)',
                  boxShadow: '0 0 20px rgba(163, 147, 123, 0.6), 0 0 40px rgba(163, 147, 123, 0.3)'
                }}
              >
                <Crown className="w-4 h-4" />
                <span className="text-xs font-bold tracking-wide">PRO MEMBER</span>
              </a>
            )}
            
            {/* Theme Toggle - Protected with mounted state */}
            {mounted && (
              <button 
                onClick={() => setManualOverride(uiTheme === 'terminal' ? 'light' : 'terminal')}
                aria-label={`Switch to ${uiTheme === 'terminal' ? 'light research' : 'dark terminal'} theme. Currently using ${uiTheme === 'terminal' ? 'Terminal' : uiTheme === 'hybrid' ? 'Hybrid' : 'Research'} mode.`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  isDark || isHybrid ? 'bg-zinc-900 hover:bg-zinc-800 border border-[#A3937B]/15' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {uiTheme === 'terminal' ? (
                  <Sun className="w-4 h-4 text-[#A3937B]" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600" />
                )}
                <span className={`text-xs font-medium font-mono ${
                  isDark || isHybrid ? 'text-[#A3937B]/80' : 'text-gray-600'
                }`}>
                  {uiTheme === 'terminal' ? 'TERMINAL' : uiTheme === 'hybrid' ? 'HYBRID' : 'RESEARCH'}
                </span>
              </button>
            )}
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isDark || isHybrid ? 'bg-zinc-900 border border-emerald-900/30' : 'bg-gray-50'
            }`}>
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-zinc-950" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className={`text-xs font-medium font-mono ${
                isDark || isHybrid ? 'text-emerald-500/80' : 'text-gray-600'
              }`}>
                VERIFIED
              </span>
            </div>
          </div>
        </div>

        {/* Sovereign Ticker - Marquee Style (starts from right, exits left) */}
        <div className={`border-t py-2 overflow-hidden ${
          isDark || isHybrid ? 'border-[#A3937B]/12 bg-zinc-950/90' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="relative overflow-hidden">
            <div className="ticker-marquee whitespace-nowrap">
              {/* Ticker content - larger text for readability */}
              <span className="inline-flex items-center gap-6 text-sm font-mono">
                <span className="inline-flex items-center gap-2">
                  <span className={isDark || isHybrid ? 'text-[#A3937B] font-semibold' : 'text-gray-500'}>SRI</span>
                  <span className={`font-bold tabular-nums ${systemicRisk > 50 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {systemicRisk}
                  </span>
                </span>
                <span className={isDark || isHybrid ? 'text-zinc-700' : 'text-gray-300'}>|</span>

                <span className="inline-flex items-center gap-2">
                  <span className={isDark || isHybrid ? 'text-[#A3937B] font-semibold' : 'text-gray-500'}>Survival</span>
                  <span className={`font-bold tabular-nums ${survivalProb >= 70 ? 'text-emerald-400' : survivalProb >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {survivalProb}%
                  </span>
                </span>
                <span className={isDark || isHybrid ? 'text-zinc-700' : 'text-gray-300'}>|</span>

                <span className="inline-flex items-center gap-2">
                  <span className={isDark || isHybrid ? 'text-[#A3937B] font-semibold' : 'text-gray-500'}>10Y</span>
                  <span className="font-bold tabular-nums text-amber-400">4.13%</span>
                </span>
                <span className={isDark || isHybrid ? 'text-zinc-700' : 'text-gray-300'}>|</span>

                <span className="inline-flex items-center gap-2">
                  <span className={isDark || isHybrid ? 'text-[#A3937B] font-semibold' : 'text-gray-500'}>WTI</span>
                  <span className="font-bold tabular-nums text-red-400">$90.90</span>
                  <ArrowUp className="w-3 h-3 text-red-400" />
                </span>
                <span className={isDark || isHybrid ? 'text-zinc-700' : 'text-gray-300'}>|</span>

                <span className="inline-flex items-center gap-2">
                  <span className={isDark || isHybrid ? 'text-[#A3937B] font-semibold' : 'text-gray-500'}>BRENT</span>
                  <span className="font-bold tabular-nums text-red-400">$92.69</span>
                </span>
                <span className={isDark || isHybrid ? 'text-zinc-700' : 'text-gray-300'}>|</span>

                <span className="inline-flex items-center gap-2">
                  <span className={isDark || isHybrid ? 'text-[#A3937B] font-semibold' : 'text-gray-500'}>XAU</span>
                  <span className="font-bold tabular-nums text-emerald-400">$2,940</span>
                </span>
                <span className={isDark || isHybrid ? 'text-zinc-700' : 'text-gray-300'}>|</span>

                <span className="inline-flex items-center gap-2">
                  <span className={isDark || isHybrid ? 'text-[#A3937B] font-semibold' : 'text-gray-500'}>USD/JPY</span>
                  <span className="font-bold tabular-nums text-amber-400">149.82</span>
                </span>
                <span className={isDark || isHybrid ? 'text-zinc-700' : 'text-gray-300'}>|</span>

                <span className="inline-flex items-center gap-2">
                  <span className={isDark || isHybrid ? 'text-[#A3937B] font-semibold' : 'text-gray-500'}>F&G</span>
                  <span className="font-bold tabular-nums text-red-400">12</span>
                </span>
                <span className={isDark || isHybrid ? 'text-zinc-700' : 'text-gray-300'}>|</span>

                <span className="inline-flex items-center gap-2">
                  <span className={isDark || isHybrid ? 'text-[#A3937B] font-semibold' : 'text-gray-500'}>Yield</span>
                  <span className={`font-bold tabular-nums ${parseFloat(yieldSpread) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {yieldSpread}%
                  </span>
                </span>
                <span className={isDark || isHybrid ? 'text-zinc-700' : 'text-gray-300'}>|</span>

                <span className={`font-bold tracking-wider ${isStressRegime ? 'text-red-400 animate-pulse' : 'text-[#B8A892]'}`}>
                  {currentRegime.regime.toUpperCase()}
                </span>

                {/* Spacer for infinite loop */}
                <span className="inline-block w-32"></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar - Adjusts position based on GlobalStatusBar presence */}
      <aside className={`hidden lg:block fixed left-0 bottom-0 border-r z-[90] transition-all duration-300 ${
        (isDark || isHybrid) ? 'top-[140px]' : 'top-[104px]'
      } ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } ${
        isDark || isHybrid ? 'bg-zinc-950 border-[#A3937B]/12' : 'bg-white border-gray-200'
      }`}>
        {/* Toggle Button */}
        <div className="absolute -right-3 top-6 z-[100]">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all hover:scale-110 ${
              isDark || isHybrid ? 'bg-zinc-900 border-[#A3937B]/15 text-[#A3937B] hover:bg-zinc-800 hover:border-amber-500/50' : 
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
                      ? 'bg-[rgba(212,175,55,0.15)] text-[#A3937B] border-l-2 border-[#A3937B] shadow-[inset_0_0_20px_rgba(212,175,55,0.1),0_0_15px_rgba(212,175,55,0.2)] rounded-r-lg'
                      : 'bg-[#2563EB] text-white shadow-md rounded-xl'
                    : isDark || isHybrid
                    ? 'text-gray-400 hover:text-[#A3937B] hover:bg-[rgba(212,175,55,0.05)] hover:border-l-2 hover:border-[rgba(212,175,55,0.3)] rounded-r-lg border-l-2 border-transparent'
                    : 'text-gray-600 hover:bg-gray-50 rounded-xl'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                  active && (isDark || isHybrid) ? 'text-[#A3937B]' : ''
                } group-hover:scale-110`} />
                <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                  sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                } ${active && (isDark || isHybrid) ? 'font-mono tracking-wide' : ''}`}>
                  {item.label}
                </span>
                
                {/* Active glow indicator */}
                {active && (isDark || isHybrid) && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#A3937B] shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                )}
                
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className={`absolute left-full ml-2 px-3 py-2 rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 ${
                    isDark || isHybrid ? 'bg-[#0f1113] text-[#A3937B] border border-[rgba(212,175,55,0.2)]' : 'bg-gray-900 text-white'
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
        isDark || isHybrid ? 'bg-zinc-950' : 'bg-[#F8F9FA]'
      }`}>
        <div className="w-full max-w-screen-xl mx-auto px-4 md:px-6 lg:px-10 py-6">
          <Outlet />
        </div>
        
        {/* Footer */}
        <footer className={`mt-12 border-t py-8 transition-all duration-300 ${
          isDark || isHybrid ? 'border-[#A3937B]/12' : 'border-gray-200'
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
              
              {/* Center - Data Source Status */}
              <div className="hidden md:flex items-center gap-4">
                <DataSourceStatusCompact />
              </div>
              
              <div className={`text-sm font-medium text-center md:text-right ${isDark || isHybrid ? 'text-[#A3937B]/80' : 'text-gray-700'}`}>
                <span className="font-mono tracking-wider">BOBIKCS // CITADEL</span>
                <span className={`block text-xs mt-1 ${isDark || isHybrid ? 'text-zinc-500' : 'text-gray-400'}`}>
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
