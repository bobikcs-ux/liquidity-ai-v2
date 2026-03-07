'use client';

import React from 'react';
import { VaultHeader } from '../components/VaultHeader';
import { Lock, Shield, Zap, FileText, TrendingUp, AlertCircle } from 'lucide-react';

export function TheVault() {
  const vaultSections = [
    {
      title: 'Proprietary Algorithms',
      description: 'Institutional-grade AI models for systemic risk detection and capital flow analysis',
      icon: Zap,
      items: ['Black Swan Detection', 'Liquidity Transmission Models', 'Regime Transition Forecasting'],
    },
    {
      title: 'Intelligence Archives',
      description: 'Real-time intelligence feeds from 50+ global data sources',
      icon: FileText,
      items: ['Market Surveillance', 'Geopolitical Risk Tracking', 'Central Bank Intelligence'],
    },
    {
      title: 'Performance Analytics',
      description: 'Deep-dive portfolio analytics and stress testing framework',
      icon: TrendingUp,
      items: ['VaR & CVaR Analysis', 'Correlation Matrices', 'Historical Simulations'],
    },
    {
      title: 'Risk Management',
      description: 'Comprehensive risk dashboards and early warning systems',
      icon: AlertCircle,
      items: ['Systemic Risk Alerts', 'Capital Flight Detection', 'Liquidity Stress Tests'],
    },
  ];

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0b0b0f, #16161d)',
        minHeight: '100vh',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-12">
        {/* Vault Header */}
        <VaultHeader />

        {/* Vault Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vaultSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="group rounded-lg p-6 transition-all duration-300 cursor-pointer hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08), rgba(212, 175, 55, 0.02))',
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212, 175, 55, 0.4)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(212, 175, 55, 0.15)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212, 175, 55, 0.15)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {/* Icon + Title */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="p-2 rounded-lg mt-1"
                    style={{
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: '#d4af37' }} />
                  </div>
                  <h3
                    className="text-lg font-bold uppercase tracking-wide"
                    style={{ color: '#d4af37' }}
                  >
                    {section.title}
                  </h3>
                </div>

                {/* Description */}
                <p
                  className="text-sm mb-4"
                  style={{ color: '#a1a1aa', lineHeight: 1.6 }}
                >
                  {section.description}
                </p>

                {/* Items List */}
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: '#c6a85a' }}
                    >
                      <Shield className="w-3 h-3 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* Lock Icon Accent */}
                <div className="mt-4 pt-4 border-t border-[rgba(212,175,55,0.1)] flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Lock className="w-4 h-4" style={{ color: '#d4af37' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Features Section */}
        <div
          className="rounded-lg p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05), rgba(0,0,0,0.3))',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <h2
            className="text-2xl font-bold uppercase tracking-wider mb-6"
            style={{ color: '#d4af37' }}
          >
            Security Architecture
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3
                className="text-sm font-bold uppercase tracking-wide mb-3"
                style={{ color: '#c6a85a' }}
              >
                Data Protection
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: '#a1a1aa' }}>
                <li>• End-to-end encryption at rest and in transit</li>
                <li>• Bank-grade SSL/TLS 1.3 certificates</li>
                <li>• Multi-factor authentication for all users</li>
                <li>• Real-time DDoS protection and firewall</li>
              </ul>
            </div>

            <div>
              <h3
                className="text-sm font-bold uppercase tracking-wide mb-3"
                style={{ color: '#c6a85a' }}
              >
                Infrastructure
              </h3>
              <ul className="space-y-2 text-sm" style={{ color: '#a1a1aa' }}>
                <li>• Redundant global server infrastructure</li>
                <li>• 99.99% uptime SLA guarantee</li>
                <li>• Automated backup and disaster recovery</li>
                <li>• SOC 2 Type II compliant architecture</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Notice */}
        <div
          className="text-center text-xs py-6"
          style={{
            color: '#a1a1aa',
            borderTop: '1px solid rgba(212, 175, 55, 0.1)',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
          }}
        >
          AURELIUS LIQUIDITY GROUP — Institutional Investment Intelligence Platform
          <br />
          Confidential — For Authorized Users Only
        </div>
      </div>
    </div>
  );
}

export default TheVault;
