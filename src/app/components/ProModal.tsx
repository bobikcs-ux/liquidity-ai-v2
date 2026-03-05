'use client';

import React, { useState, useMemo } from 'react';
import { Lock, X, Zap, Shield, TrendingUp, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useUserRole } from '../context/UserRoleContext';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

// Email validation regex
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Revolut payment link (external)
const REVOLUT_PAYMENT_URL = 'https://revolut.me/studiobobikcs/149usd';

// Official production URL for all QR codes
const PRODUCTION_URL = 'https://liquidity.bobikcs.com/';

// =============================================================================
// INSTITUTIONAL QR CODE COMPONENT - Level H Error Correction (30%)
// High-density terminal aesthetic with proper QR encoding
// =============================================================================

interface QRCodeProps {
  url?: string;
  size?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  className?: string;
}

// Reed-Solomon error correction tables for QR codes
// Level H (High) = 30% error correction capacity
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

// Initialize Galois Field tables for error correction
(function initGF256() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_LOG[x] = i;
    x = x << 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF256_EXP[i] = GF256_EXP[i - 255];
  }
})();

// Galois Field multiplication
function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]];
}

// Generate error correction codewords
function generateECC(data: number[], eccCount: number): number[] {
  const generator: number[] = [1];
  for (let i = 0; i < eccCount; i++) {
    const newGen: number[] = new Array(generator.length + 1).fill(0);
    for (let j = 0; j < generator.length; j++) {
      newGen[j] ^= generator[j];
      newGen[j + 1] ^= gfMul(generator[j], GF256_EXP[i]);
    }
    generator.length = 0;
    generator.push(...newGen);
  }
  
  const ecc = new Array(eccCount).fill(0);
  for (const byte of data) {
    const lead = byte ^ ecc[0];
    for (let i = 0; i < eccCount - 1; i++) {
      ecc[i] = ecc[i + 1] ^ gfMul(lead, generator[i + 1]);
    }
    ecc[eccCount - 1] = gfMul(lead, generator[eccCount]);
  }
  return ecc;
}

// Encode URL to QR data with Level H error correction
function encodeURL(url: string): number[] {
  const bytes: number[] = [];
  // Mode indicator: Byte mode (0100)
  bytes.push(0x40);
  // Character count (8 bits for version 5)
  bytes.push(url.length);
  // URL bytes
  for (let i = 0; i < url.length; i++) {
    bytes.push(url.charCodeAt(i));
  }
  // Terminator
  bytes.push(0);
  return bytes;
}

// Generate QR matrix with Level H error correction (Version 5, 37x37)
function generateQRMatrixLevelH(inputUrl?: string): boolean[][] {
  const url = inputUrl || PRODUCTION_URL;
  const size = 37; // Version 5 QR code for Level H with URLs
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  const reserved: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Draw and reserve finder patterns
  const drawFinderPattern = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        reserved[y][x] = true;
        const maxD = Math.max(Math.abs(dx), Math.abs(dy));
        matrix[y][x] = maxD !== 3 && maxD !== 4;
      }
    }
  };
  
  drawFinderPattern(3, 3);      // Top-left
  drawFinderPattern(size - 4, 3); // Top-right
  drawFinderPattern(3, size - 4); // Bottom-left
  
  // Draw timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }
  
  // Draw alignment patterns for Version 5
  const alignPositions = [6, 30];
  for (const ay of alignPositions) {
    for (const ax of alignPositions) {
      // Skip if overlapping with finder patterns
      if ((ax < 9 && ay < 9) || (ax > size - 10 && ay < 9) || (ax < 9 && ay > size - 10)) continue;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = ax + dx;
          const y = ay + dy;
          reserved[y][x] = true;
          const maxD = Math.max(Math.abs(dx), Math.abs(dy));
          matrix[y][x] = maxD !== 1;
        }
      }
    }
  }
  
  // Reserve format info areas
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  // Dark module
  matrix[size - 8][8] = true;
  reserved[size - 8][8] = true;
  
  // Reserve version info (Version 5 doesn't need it, but mark area)
  
  // Encode data with Level H ECC
  const dataBytes = encodeURL(url);
  const eccBytes = generateECC(dataBytes, 26); // Level H needs more ECC
  const allBytes = [...dataBytes, ...eccBytes];
  
  // Convert to bits
  const bits: boolean[] = [];
  for (const byte of allBytes) {
    for (let i = 7; i >= 0; i--) {
      bits.push((byte >> i & 1) === 1);
    }
  }
  
  // Add padding bits to fill capacity
  while (bits.length < 864) { // Version 5 Level H data capacity
    bits.push(false);
  }
  
  // Place data in zigzag pattern
  let bitIndex = 0;
  let upward = true;
  
  for (let right = size - 1; right >= 0; right -= 2) {
    if (right === 6) right = 5; // Skip timing column
    
    const colRange = upward ? 
      Array.from({ length: size }, (_, i) => size - 1 - i) :
      Array.from({ length: size }, (_, i) => i);
    
    for (const row of colRange) {
      for (const col of [right, right - 1]) {
        if (col < 0) continue;
        if (!reserved[row][col] && bitIndex < bits.length) {
          matrix[row][col] = bits[bitIndex++];
        }
      }
    }
    upward = !upward;
  }
  
  // Apply mask pattern 0 (checkerboard) for best contrast
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!reserved[y][x] && (x + y) % 2 === 0) {
        matrix[y][x] = !matrix[y][x];
      }
    }
  }
  
  // Add format information (Level H, Mask 0)
  const formatBits = [1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0]; // H, mask 0
  
  // Place format bits around top-left finder
  for (let i = 0; i < 6; i++) {
    matrix[8][i] = formatBits[i];
  }
  matrix[8][7] = formatBits[6];
  matrix[8][8] = formatBits[7];
  matrix[7][8] = formatBits[8];
  for (let i = 9; i < 15; i++) {
    matrix[14 - i][8] = formatBits[i];
  }
  
  // Place format bits around other finders
  for (let i = 0; i < 8; i++) {
    matrix[8][size - 1 - i] = formatBits[i];
  }
  for (let i = 0; i < 7; i++) {
    matrix[size - 7 + i][8] = formatBits[8 + i];
  }
  
  return matrix;
}

// Institutional QR Code Component - Pure SVG, No Canvas
export function QRCode({ 
  url,
  size = 80, 
  color = '#10b981', // emerald-500
  bgColor = 'transparent',
  label = '[ NODE: LIQUIDITY.BOBIKCS.COM ]',
  className = ''
}: QRCodeProps) {
  const matrix = useMemo(() => generateQRMatrixLevelH(url || PRODUCTION_URL), [url]);
  
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* SVG QR Code - Crystal clear at any resolution */}
      <div 
        className="relative"
        style={{
          padding: '4px',
          border: `1px solid ${color}40`,
          background: bgColor,
        }}
      >
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${matrix.length} ${matrix.length}`}
          style={{ 
            display: 'block',
            shapeRendering: 'crispEdges',
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background */}
          <rect width={matrix.length} height={matrix.length} fill={bgColor} />
          
          {/* QR modules - sharp square pixels */}
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
        
        {/* Corner brackets - industrial style */}
        <div className="absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2" style={{ borderColor: color }} />
        <div className="absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2" style={{ borderColor: color }} />
        <div className="absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2" style={{ borderColor: color }} />
        <div className="absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2" style={{ borderColor: color }} />
      </div>
      
      {/* Industrial label */}
      {label && (
        <span 
          className="mt-2 font-mono text-[7px] uppercase tracking-[0.2em]"
          style={{ color, opacity: 0.8 }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// Generate SVG string for PDF export - High resolution
export function generateQRCodeSVG(
  inputUrl?: string, 
  size: number = 100, 
  color: string = '#10b981'
): string {
  const matrix = generateQRMatrixLevelH(inputUrl || PRODUCTION_URL);
  
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

// Export the matrix generator for external use
export { generateQRMatrixLevelH, PRODUCTION_URL };

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
          
          {/* QR Code - Industrial Style, Level H */}
          <div className="flex flex-col items-center">
            <QRCode 
              url={REVOLUT_PAYMENT_URL} 
              size={72} 
              color={isDark || isHybrid ? '#fbbf24' : '#d97706'}
              bgColor="transparent"
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
