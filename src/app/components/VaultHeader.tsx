'use client';

import React from 'react';
import { Lock, Shield, Crown } from 'lucide-react';

export function VaultHeader() {
  return (
    <div
      className="w-full relative overflow-hidden rounded-lg p-8 md:p-12"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0.03))',
        border: '2px solid rgba(212, 175, 55, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: `0 8px 32px rgba(212, 175, 55, 0.1), inset 0 1px 1px rgba(212, 175, 55, 0.15)`,
      }}
    >
      {/* Locked background elements */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(212, 175, 55, 0.5) 2px,
            rgba(212, 175, 55, 0.5) 4px
          )`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-lg"
              style={{
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
              }}
            >
              <Lock className="w-8 h-8" style={{ color: '#d4af37' }} />
            </div>
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-1"
                style={{
                  color: '#d4af37',
                  fontFamily: '"JetBrains Mono", monospace',
                  textShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                }}
              >
                AURELIUS LIQUIDITY GROUP
              </h1>
              <p
                className="text-sm md:text-base"
                style={{
                  color: '#c6a85a',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.1em',
                }}
              >
                High-Security Institutional Archive
              </p>
            </div>
          </div>
          <Shield className="w-12 h-12 text-opacity-20" style={{ color: '#d4af37' }} />
        </div>

        {/* Vault Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className="p-4 rounded"
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#a1a1aa' }}>
              Access Level
            </div>
            <div className="text-sm font-bold" style={{ color: '#d4af37', fontFamily: '"JetBrains Mono", monospace' }}>
              INSTITUTIONAL PRO
            </div>
          </div>

          <div
            className="p-4 rounded"
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#a1a1aa' }}>
              Status
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#2ecc71' }}
              />
              <span className="text-sm font-bold" style={{ color: '#2ecc71', fontFamily: '"JetBrains Mono", monospace' }}>
                SECURED
              </span>
            </div>
          </div>

          <div
            className="p-4 rounded"
            style={{
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.15)',
            }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#a1a1aa' }}>
              Classification
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" style={{ color: '#d4af37' }} />
              <span className="text-sm font-bold" style={{ color: '#d4af37', fontFamily: '"JetBrains Mono", monospace' }}>
                CONFIDENTIAL
              </span>
            </div>
          </div>
        </div>

        {/* Security Statement */}
        <div
          className="text-xs text-center p-4 rounded"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(212, 175, 55, 0.1)',
            color: '#a1a1aa',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.05em',
          }}
        >
          This institutional archive contains proprietary intelligence and is protected by multiple security layers. 
          Unauthorized access is prohibited.
        </div>
      </div>

      {/* Corner accent */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #d4af37, transparent)',
        }}
      />
    </div>
  );
}

export default VaultHeader;
