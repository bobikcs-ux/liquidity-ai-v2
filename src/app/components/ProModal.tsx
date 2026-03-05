'use client';

import React from 'react';
import { Lock, X, Zap, Shield, TrendingUp, FileText } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

export function ProModal() {
  const { showProModal, closeProModal, proModalFeature, setUserRole } = useUserRole();
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  if (!showProModal) return null;

  const features = [
    { icon: Shield, label: 'Institutional Risk Drivers' },
    { icon: TrendingUp, label: 'Stress Heat Map Analysis' },
    { icon: FileText, label: 'Advanced Reports (Volatility, Liquidity, Crash Engine)' },
    { icon: Zap, label: 'Full Stress Lab Access' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeProModal}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-3xl p-8 shadow-2xl ${
        isDark || isHybrid 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-amber-500/30' 
          : 'bg-white border border-gray-200'
      }`}>
        {/* Close Button */}
        <button
          onClick={closeProModal}
          aria-label="Close modal"
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isDark || isHybrid 
              ? 'hover:bg-gray-700 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gold Lock Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold text-center mb-2 ${
          isDark || isHybrid ? 'text-white' : 'text-gray-900'
        }`}>
          Unlock {proModalFeature || 'PRO Features'}
        </h2>

        <p className={`text-center mb-6 ${
          isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Get full access to institutional-grade risk intelligence
        </p>

        {/* Features List */}
        <div className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                isDark || isHybrid ? 'bg-gray-800/50' : 'bg-gray-50'
              }`}
            >
              <feature.icon className={`w-5 h-5 ${
                isDark || isHybrid ? 'text-amber-400' : 'text-amber-600'
              }`} />
              <span className={`text-sm ${
                isDark || isHybrid ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {feature.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              setUserRole('PRO');
              closeProModal();
            }}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            Upgrade to PRO
          </button>
          
          <button
            onClick={closeProModal}
            className={`w-full py-3 px-6 font-medium rounded-xl transition-colors ${
              isDark || isHybrid 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            Maybe Later
          </button>
        </div>

        {/* Pricing Note */}
        <p className={`text-xs text-center mt-6 ${
          isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'
        }`}>
          Starting at $49/month. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

// Email Collection Modal for FREE Daily Snapshot
export function EmailCollectionModal() {
  const { showEmailModal, setShowEmailModal } = useUserRole();
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  if (!showEmailModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would submit to your backend
    setSubmitted(true);
    setTimeout(() => {
      setShowEmailModal(false);
      setSubmitted(false);
      setEmail('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowEmailModal(false)}
      />
      
      <div className={`relative w-full max-w-md mx-4 rounded-3xl p-8 shadow-2xl ${
        isDark || isHybrid 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-blue-500/30' 
          : 'bg-white border border-gray-200'
      }`}>
        <button
          onClick={() => setShowEmailModal(false)}
          aria-label="Close modal"
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
            isDark || isHybrid 
              ? 'hover:bg-gray-700 text-gray-400' 
              : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileText className="w-8 h-8 text-white" />
          </div>
        </div>

        {submitted ? (
          <>
            <h2 className={`text-2xl font-bold text-center mb-2 ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Thank You!
            </h2>
            <p className={`text-center ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Your Daily Snapshot will be delivered to your inbox.
            </p>
          </>
        ) : (
          <>
            <h2 className={`text-2xl font-bold text-center mb-2 ${
              isDark || isHybrid ? 'text-white' : 'text-gray-900'
            }`}>
              Get Your Free Daily Snapshot
            </h2>

            <p className={`text-center mb-6 ${
              isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Enter your email to receive the daily market intelligence report
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark || isHybrid 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } outline-none`}
              />
              
              <button
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
              >
                Download Report
              </button>
            </form>

            <p className={`text-xs text-center mt-4 ${
              isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'
            }`}>
              No spam. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// Locked Overlay Component
export function LockedOverlay({ 
  feature, 
  className = '' 
}: { 
  feature: string; 
  className?: string;
}) {
  const { openProModal } = useUserRole();
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  return (
    <div 
      className={`absolute inset-0 z-10 flex flex-col items-center justify-center cursor-pointer rounded-lg ${className}`}
      onClick={() => openProModal(feature)}
      style={{
        background: isDark || isHybrid 
          ? 'rgba(15, 23, 42, 0.85)' 
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
        <Lock className="w-7 h-7 text-white" />
      </div>
      <p className={`text-lg font-semibold mb-1 ${
        isDark || isHybrid ? 'text-white' : 'text-gray-900'
      }`}>
        PRO Feature
      </p>
      <p className={`text-sm ${
        isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Click to unlock {feature}
      </p>
    </div>
  );
}
