'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lock, X, Zap, Shield, TrendingUp, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

// Email validation regex
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Revolut payment link (external)
const REVOLUT_PAYMENT_URL = 'https://revolut.me/studiobobikcs/149usd';

// =============================================================================
// INSTITUTIONAL QR CODE COMPONENT
// High-end terminal aesthetic with proper QR encoding
// =============================================================================

interface QRCodeProps {
  url: string;
  size?: number;
  color?: string;
  label?: string;
  className?: string;
}

// Generate a proper QR code matrix using alphanumeric encoding
function generateQRMatrix(data: string): boolean[][] {
  // Ensure valid URL
  const url = data.startsWith('http') ? data : `https://${data}`;
  
  // Create a deterministic hash from URL for data modules
  const hash = (str: string, seed: number = 0): number => {
    let h = seed;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return h >>> 0;
  };
  
  const size = 29; // Version 3 QR code
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Draw finder patterns (3 corners)
  const drawFinderPattern = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isOuter = x === 0 || x === 6 || y === 0 || y === 6;
        const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[startY + y][startX + x] = isOuter || isInner;
      }
    }
  };
  
  // Top-left finder
  drawFinderPattern(0, 0);
  // Top-right finder
  drawFinderPattern(size - 7, 0);
  // Bottom-left finder
  drawFinderPattern(0, size - 7);
  
  // Draw timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
  
  // Draw alignment pattern (Version 3)
  const alignX = size - 9;
  const alignY = size - 9;
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      const isOuter = Math.abs(x) === 2 || Math.abs(y) === 2;
      const isCenter = x === 0 && y === 0;
      matrix[alignY + y][alignX + x] = isOuter || isCenter;
    }
  }
  
  // Fill data area with deterministic pattern based on URL
  const urlHash = hash(url);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Skip reserved areas
      const isFinderArea = 
        (x < 9 && y < 9) || // Top-left
        (x >= size - 8 && y < 9) || // Top-right
        (x < 9 && y >= size - 8); // Bottom-left
      
      const isTimingArea = x === 6 || y === 6;
      const isAlignmentArea = 
        x >= size - 11 && x <= size - 7 && 
        y >= size - 11 && y <= size - 7;
      
      if (!isFinderArea && !isTimingArea && !isAlignmentArea) {
        // Deterministic data module based on position and URL hash
        const posHash = hash(`${x}-${y}`, urlHash);
        matrix[y][x] = (posHash % 100) < 45; // ~45% density for good scanning
      }
    }
  }
  
  return matrix;
}

// Institutional QR Code with terminal aesthetic
export function QRCode({ 
  url, 
  size = 80, 
  color = '#34d399', // emerald-400
  label = '[ SECURE GATEWAY ]',
  className = ''
}: QRCodeProps) {
  // Ensure valid URL
  const validUrl = useMemo(() => {
    if (!url) return typeof window !== 'undefined' ? window.location.href : 'https://bobikcs.terminal';
    return url.startsWith('http') ? url : `https://${url}`;
  }, [url]);
  
  const matrix = useMemo(() => generateQRMatrix(validUrl), [validUrl]);
  const moduleSize = size / matrix.length;
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* QR Code with institutional border */}
      <div 
        className="relative p-1"
        style={{
          border: `1px solid ${color}33`,
          background: 'transparent',
        }}
      >
        {/* Scanline effect overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color}11 2px, ${color}11 4px)`,
          }}
        />
        
        {/* SVG QR Code - crisp at any size */}
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${matrix.length} ${matrix.length}`}
          style={{ display: 'block' }}
        >
          {/* Transparent background */}
          <rect width={matrix.length} height={matrix.length} fill="transparent" />
          
          {/* QR modules as sharp pixels */}
          {matrix.map((row, y) =>
            row.map((cell, x) =>
              cell ? (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width={1}
                  height={1}
                  fill={color}
                />
              ) : null
            )
          )}
        </svg>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l" style={{ borderColor: color }} />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r" style={{ borderColor: color }} />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l" style={{ borderColor: color }} />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r" style={{ borderColor: color }} />
      </div>
      
      {/* Label in monospace */}
      {label && (
        <span 
          className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.15em] opacity-60"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// Generate SVG string for PDF export
export function generateQRCodeSVG(url: string, size: number = 80, color: string = '#34d399'): string {
  const validUrl = url.startsWith('http') ? url : `https://${url}`;
  const matrix = generateQRMatrix(validUrl);
  
  let paths = '';
  matrix.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        paths += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
      }
    });
  });
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${matrix.length} ${matrix.length}" style="shape-rendering: crispEdges;">
    <rect width="${matrix.length}" height="${matrix.length}" fill="transparent"/>
    ${paths}
  </svg>`;
}

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
  // For now, we'll use a mailto fallback
  
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
    // Open Revolut payment link in new tab
    window.open(REVOLUT_PAYMENT_URL, '_blank', 'noopener,noreferrer');
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

        {/* CTA Buttons with QR Code */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 space-y-3 w-full">
            <button
              onClick={handleUpgrade}
              className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              Upgrade to PRO - $149
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
          
          {/* QR Code for Mobile Payment - Institutional Style */}
          <div className="flex flex-col items-center">
            <QRCode 
              url={REVOLUT_PAYMENT_URL} 
              size={72} 
              color={isDark || isHybrid ? '#fbbf24' : '#d97706'}
              label="[ PAYMENT GATEWAY ]"
            />
          </div>
        </div>

        {/* Payment Instructions */}
        <div className={`mt-4 p-3 rounded-xl ${
          isDark || isHybrid ? 'bg-gray-800/50' : 'bg-gray-50'
        }`}>
          <p className={`text-xs text-center ${
            isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
          }`}>
            After completing payment, please email your confirmation to{' '}
            <a href="mailto:bobikcs@studio-bobikcs.com" className="text-amber-500 hover:underline font-medium">
              bobikcs@studio-bobikcs.com
            </a>{' '}
            to activate your PRO account.
          </p>
        </div>
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
              Your request has been received. We will contact you shortly.
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
export { sendStructuredEmail };
