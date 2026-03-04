import React from 'react';
import { PageContainer } from './PageContainer';

export function Page05() {
  return (
    <PageContainer pageNumber="PAGE_05">
      <div className="flex flex-col h-full p-12">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-[16px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-2">
            SYSTEM_RE-ARCHITECTURE_LOG
          </h2>
          <p className="text-[11px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-60">
            PROTOCOL_APPLIED: RADICAL_DIFFERENTIATION_V2
          </p>
        </div>

        {/* Comparison Layout */}
        <div className="grid grid-cols-[1fr_80px_1fr] gap-6 mb-8">
          {/* LEFT: Deprecated Version */}
          <div className="relative">
            <div className="border-2 border-[#E63946] bg-[#E63946]/5 p-4 relative overflow-hidden">
              {/* Diagonal X Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="#E63946" strokeWidth="2" />
                  <line x1="100%" y1="0" x2="0" y2="100%" stroke="#E63946" strokeWidth="2" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="text-[10px] tracking-[0.08em] uppercase text-[#E63946] mb-3">
                  DEPRECATED_VERSION
                </div>
                <div className="text-[11px] leading-[1.7] tracking-[0.02em] text-[#E0E0E0] opacity-70 mb-4">
                  <p className="mb-2">🚀 Want to level up your career?</p>
                  <p className="mb-2">
                    Here are 3 simple tips that helped me grow:<br />
                    → Network authentically<br />
                    → Keep learning<br />
                    → Stay consistent
                  </p>
                  <p>What's working for you? 💬</p>
                </div>
              </div>
            </div>
            <div className="mt-2 text-[9px] tracking-[0.08em] uppercase text-[#E63946] flex items-center gap-2">
              <div className="w-2 h-2 bg-[#E63946]" />
              REPLACEABLE / COMMODITY
            </div>
          </div>

          {/* MIDDLE: Transformation Indicators */}
          <div className="flex flex-col justify-center items-center space-y-6">
            <div className="flex flex-col items-center">
              <div className="text-[8px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-1 text-center leading-tight">
                GENERIC_HOOK
              </div>
              <div className="text-[#D4C6A9] text-[20px]">→</div>
              <div className="text-[8px] tracking-[0.08em] uppercase text-[#D4C6A9] mt-1 text-center leading-tight">
                FRICTION_OPENING
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-[8px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-1 text-center leading-tight">
                SAFE_OPINION
              </div>
              <div className="text-[#D4C6A9] text-[20px]">→</div>
              <div className="text-[8px] tracking-[0.08em] uppercase text-[#D4C6A9] mt-1 text-center leading-tight">
                POLARIZING_STANCE
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-[8px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-1 text-center leading-tight">
                AI_STRUCTURE
              </div>
              <div className="text-[#D4C6A9] text-[20px]">→</div>
              <div className="text-[8px] tracking-[0.08em] uppercase text-[#D4C6A9] mt-1 text-center leading-tight">
                ARCHITECT_NARRATIVE
              </div>
            </div>
          </div>

          {/* RIGHT: Optimized Version */}
          <div className="relative">
            <div className="border-2 border-[#D4C6A9] bg-[#D4C6A9]/5 p-4">
              <div className="text-[10px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-3">
                OPTIMIZED_MONOLITH_SIGNAL
              </div>
              <div className="text-[11px] leading-[1.7] tracking-[0.02em] text-[#E0E0E0] mb-4">
                <p className="mb-3">
                  Most career advice is structural poison disguised as optimization.
                </p>
                <p className="mb-3">
                  Networking is not "authentic connection"—it's strategic proximity. Learning is
                  not consumption—it's synthesis into proprietary frameworks. Consistency is not
                  volume—it's disciplined restraint.
                </p>
                <p>
                  The market doesn't reward hard workers. It rewards those who architect their own
                  irreplaceability.
                </p>
              </div>
            </div>
            <div className="mt-2 text-[9px] tracking-[0.08em] uppercase text-[#00FF41] flex items-center gap-2">
              <div className="w-2 h-2 bg-[#00FF41]" />
              UNIQUE / HIGH-AUTHORITY
            </div>
          </div>
        </div>

        {/* Impact Projection */}
        <div className="mt-auto">
          <h3 className="text-[12px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-4">
            IMPACT_PROJECTION
          </h3>

          {/* Bar Chart */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-70">
                  MARKET_ATTENTION
                </span>
                <span className="text-[10px] text-[#E0E0E0]">20% → 85%</span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="h-6 bg-[#E63946] flex items-center justify-center text-[8px] text-[#020502]" style={{ width: '20%' }}>
                  BEFORE
                </div>
                <div className="h-6 bg-[#00FF41] flex items-center justify-center text-[8px] text-[#020502]" style={{ width: '85%' }}>
                  AFTER
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-70">
                AUTHORITY_RECOGNITION
              </span>
              <span className="text-[10px] text-[#00FF41]">98%</span>
            </div>
            <div className="h-2 bg-[#1A1A1A] border border-[#1A1A1A] relative overflow-hidden">
              <div
                className="h-full bg-[#00FF41]"
                style={{ width: '98%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
