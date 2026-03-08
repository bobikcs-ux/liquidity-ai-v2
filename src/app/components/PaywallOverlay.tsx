'use client';

import React, { ReactNode } from 'react';
import { Lock, Zap } from 'lucide-react';

const DESIGN = {
  sovereignSand: '#A3937B',
  sovereignSandLight: '#B8A892',
  sovereignSandDark: '#8B7D67',
  bgPrimary: '#0a0a0a',
  textPrimary: '#d4d4d8',
  textMuted: '#71717a',
};

interface PaywallOverlayProps {
  children: ReactNode;
  show: boolean;
}

/**
 * The Vault Access - Premium paywall overlay with blur effect
 * - Uses backdrop-filter blur(12px) for performance
 * - Clean <a> link to redirect (no heavy JS)
 * - Institutional messaging
 */
export function PaywallOverlay({ children, show }: PaywallOverlayProps) {
  if (!show) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred content underneath */}
      <div 
        className="pointer-events-none select-none"
        style={{
          filter: 'blur(12px)',
          opacity: 0.4,
        }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Vault Access overlay - z-40 so navigation (z-50+) is above */}
      <div 
        className="absolute inset-0 flex items-center justify-center z-40 backdrop-blur-2xl"
        style={{
          background: 'rgba(10, 10, 10, 0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div 
          className="text-center max-w-md px-6"
          style={{
            borderRadius: '16px',
            padding: '40px 32px',
            border: `2px solid ${DESIGN.sovereignSand}`,
            background: `linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(18, 18, 24, 0.95) 100%)`,
            boxShadow: `0 0 60px ${DESIGN.sovereignSand}20, inset 0 1px 0 ${DESIGN.sovereignSand}30`,
          }}
        >
          {/* Lock icon */}
          <div className="flex justify-center mb-6">
            <div 
              className="p-4 rounded-full"
              style={{
                background: `${DESIGN.sovereignSand}15`,
              }}
            >
              <Lock 
                className="w-8 h-8" 
                style={{ color: DESIGN.sovereignSand }} 
              />
            </div>
          </div>

          {/* Main message */}
          <h3 
            className="text-xl font-bold font-mono tracking-widest mb-4"
            style={{ color: DESIGN.sovereignSand }}
          >
            INSTITUTIONAL ACCESS REQUIRED
          </h3>

          <p 
            className="text-sm mb-8 leading-relaxed"
            style={{ color: DESIGN.textPrimary }}
          >
            Strategic analysis is locked for non-verified members.
          </p>

          {/* CTA Button - Simple <a> link for performance */}
          <a
            href="https://bobikcs.com/the-vault"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-4 rounded-xl font-bold font-mono text-sm tracking-wide transition-all hover:scale-105 active:scale-95 min-h-[44px] justify-center w-full"
            style={{
              background: `linear-gradient(135deg, ${DESIGN.sovereignSand} 0%, ${DESIGN.sovereignSandDark} 100%)`,
              color: '#0a0a0a',
              boxShadow: `0 4px 24px ${DESIGN.sovereignSand}35`,
            }}
          >
            <Zap className="w-4 h-4" />
            ACTIVATE SOVEREIGN ACCESS - VISIT THE VAULT
          </a>

          {/* Security note */}
          <p 
            className="text-xs mt-6 font-mono"
            style={{ color: DESIGN.textMuted }}
          >
            Verified institutional access • Premium data available
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaywallOverlay;
