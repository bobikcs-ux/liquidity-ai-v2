'use client';

import React, { useState } from 'react';
import { Lock, X, Zap, Shield, TrendingUp, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Stripe checkout URL
const STRIPE_CHECKOUT_URL = 'https://checkout.stripe.com/pay/pro_plan';

// Email endpoint
const BUSINESS_EMAIL = 'bobikcs@studio-bobikcs.com';

// Helper function to send structured email
async function sendStructuredEmail(data: {
  type: 'lead_gen' | 'institutional_inquiry' | 'data_source_request' | 'daily_snapshot';
  email: string;
  name?: string;
  company?: string;
  message?: string;
  context?: Record<string, unknown>;
}) {
  // In production, this would call your backend API
  // For now, we'll use a mailto fallback and log the data
  console.log('[v0] Sending structured email:', data);
  
  const subject = encodeURIComponent(`[BOBIKCS Terminal] ${data.type.replace(/_/g, ' ').toUpperCase()}`);
  const body = encodeURIComponent(
    `Type: ${data.type}\nEmail: ${data.email}\n${data.name ? `Name: ${data.name}\n` : ''}${data.company ? `Company: ${data.company}\n` : ''}${data.message ? `Message: ${data.message}\n` : ''}${data.context ? `\nContext: ${JSON.stringify(data.context, null, 2)}` : ''}`
  );
  
  // Open mailto as fallback (in production, use backend API)
  window.open(`mailto:${BUSINESS_EMAIL}?subject=${subject}&body=${body}`, '_blank');
  
  return true;
}

export function ProModal() {
  const { showProModal, closeProModal, proModalFeature } = useUserRole();
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';

  if (!showProModal) return null;

  const features = [
    { icon: Shield, label: 'Institutional Risk Drivers' },
    { icon: TrendingUp, label: 'Stress Heat Map Analysis' },
    { icon: FileText, label: 'Advanced Reports (Volatility, Liquidity, Crash Engine)' },
    { icon: Zap, label: 'Full Stress Lab Access & Unlimited AI Copilot' },
  ];

  const handleUpgrade = () => {
    // Redirect to Stripe checkout with return URL
    const returnUrl = encodeURIComponent(`${window.location.origin}${window.location.pathname}?success=true`);
    window.location.href = `${STRIPE_CHECKOUT_URL}?success_url=${returnUrl}`;
  };

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
            onClick={handleUpgrade}
            className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
          >
            Upgrade to PRO - $49/mo
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
          Secure checkout powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

// Email Collection Modal for FREE Daily Snapshot
export function EmailCollectionModal() {
  const { showEmailModal, setShowEmailModal, incrementReportDownload } = useUserRole();
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!showEmailModal) return null;

  const validateEmail = (email: string) => EMAIL_REGEX.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Check if user has exceeded free report limit
    if (!incrementReportDownload()) {
      setShowEmailModal(false);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await sendStructuredEmail({
        type: 'daily_snapshot',
        email,
        name: name || undefined,
        context: {
          requestedAt: new Date().toISOString(),
          source: 'Daily Snapshot Modal',
        },
      });
      
      setSubmitted(true);
      setTimeout(() => {
        setShowEmailModal(false);
        setSubmitted(false);
        setEmail('');
        setName('');
      }, 2000);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
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
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  isDark || isHybrid 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } outline-none`}
              />
              
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email *"
                required
                className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                  error 
                    ? 'border-red-500' 
                    : isDark || isHybrid 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                } outline-none`}
              />
              
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Download Report'
                )}
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

// Confetti Component
export function ConfettiEffect() {
  const { showConfetti } = useUserRole();
  
  if (!showConfetti) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* Generate confetti particles */}
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)],
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${Math.random() * 2 + 2}s`,
          }}
        />
      ))}
      
      {/* Add CSS animation */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti-fall linear forwards;
        }
      `}</style>
    </div>
  );
}

// Export email helper for use in other components
export { sendStructuredEmail, EMAIL_REGEX };
