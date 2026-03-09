import React, { ReactNode } from 'react';
import { Lock, Shield, Zap, Database, TrendingUp, Brain } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';

interface IntelligenceGuardProps {
  children: ReactNode;
  feature: 'intelligence' | 'deepRisk' | 'dossier';
}

// Design tokens - Sovereign Sand palette
const DESIGN = {
  sovereignSand: '#A3937B',
  sovereignSandLight: '#B8A892',
  sovereignSandDark: '#8B7D67',
  bgPrimary: '#0a0a0a',
  bgPanel: '#111111',
  textPrimary: '#d4d4d8',
  textMuted: '#71717a',
  border: 'rgba(163, 147, 123, 0.2)',
};

export function IntelligenceGuard({ children, feature }: IntelligenceGuardProps) {
  const { checkAccess, subscription } = useSubscription();
  
  const hasAccess = checkAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Paywall overlay with glassmorphism
  return (
    <div className="relative">
      {/* Blurred content underneath */}
      <div 
        className="filter blur-md pointer-events-none select-none opacity-40"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Paywall overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-50"
        style={{
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <SubscriptionBox feature={feature} />
      </div>
    </div>
  );
}

interface SubscriptionBoxProps {
  feature: 'intelligence' | 'deepRisk' | 'dossier';
}

function SubscriptionBox({ feature }: SubscriptionBoxProps) {
  const { upgradeTier } = useSubscription();

  const handleUnlock = () => {
    // In production, this would redirect to Stripe/payment
    // For now, we show an alert and can unlock for demo
    if (window.confirm('Демо режим: Искате ли да отключите достъпа за тестване?')) {
      upgradeTier('INSTITUTIONAL');
    }
  };

  return (
    <div 
      className="w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: `linear-gradient(145deg, ${DESIGN.bgPanel} 0%, ${DESIGN.bgPrimary} 100%)`,
        border: `1px solid ${DESIGN.sovereignSand}40`,
        boxShadow: `0 0 60px ${DESIGN.sovereignSand}15, inset 0 1px 0 ${DESIGN.sovereignSand}20`,
      }}
    >
      {/* Header accent bar */}
      <div 
        className="h-1.5"
        style={{
          background: `linear-gradient(90deg, ${DESIGN.sovereignSand} 0%, ${DESIGN.sovereignSandLight} 50%, ${DESIGN.sovereignSand} 100%)`,
        }}
      />

      <div className="p-8">
        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <div 
            className="p-4 rounded-2xl"
            style={{
              background: `${DESIGN.sovereignSand}15`,
              border: `1px solid ${DESIGN.sovereignSand}30`,
            }}
          >
            <Lock className="w-8 h-8" style={{ color: DESIGN.sovereignSand }} />
          </div>
        </div>

        {/* Title */}
        <h2 
          className="text-center text-xl font-bold font-mono tracking-wide mb-2"
          style={{ color: DESIGN.sovereignSand }}
        >
          INSTITUTIONAL INTELLIGENCE ACCESS
        </h2>

        {/* Subtitle */}
        <p 
          className="text-center text-sm mb-8 leading-relaxed"
          style={{ color: DESIGN.textPrimary }}
        >
          Достъп до Gemini Strategic Core и реални данни от Триадата (T63, T76, T81).
        </p>

        {/* Features list */}
        <div className="space-y-3 mb-8">
          <FeatureRow 
            icon={<Brain className="w-4 h-4" />}
            text="Gemini Intelligence - AI стратегически анализи"
          />
          <FeatureRow 
            icon={<Database className="w-4 h-4" />}
            text="Real-time данни: Tanker Rates, Crack Spreads, Gas"
          />
          <FeatureRow 
            icon={<TrendingUp className="w-4 h-4" />}
            text="Deep Risk Analysis - Bab el-Mandeb, Hormuz корелации"
          />
          <FeatureRow 
            icon={<Shield className="w-4 h-4" />}
            text="ACLED конфликтен индекс интеграция"
          />
        </div>

        {/* CTA Button */}
        <button
          onClick={handleUnlock}
          className="w-full py-4 rounded-xl font-bold font-mono text-sm tracking-wide transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] min-h-[44px]"
          style={{
            background: `linear-gradient(135deg, ${DESIGN.sovereignSand} 0%, ${DESIGN.sovereignSandDark} 100%)`,
            color: '#0a0a0a',
            boxShadow: `0 4px 20px ${DESIGN.sovereignSand}40`,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            <span>UNLOCK ACCESS - 99 USDT/mo</span>
          </div>
        </button>

        {/* Security note */}
        <p 
          className="text-center text-xs mt-4 font-mono"
          style={{ color: DESIGN.textMuted }}
        >
          Сигурно плащане чрез Stripe | Анулирай по всяко време
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div 
        className="p-1.5 rounded-lg flex-shrink-0"
        style={{
          background: `${DESIGN.sovereignSand}10`,
          color: DESIGN.sovereignSand,
        }}
      >
        {icon}
      </div>
      <span 
        className="text-sm"
        style={{ color: DESIGN.textPrimary }}
      >
        {text}
      </span>
    </div>
  );
}

export default IntelligenceGuard;
