import React from 'react';
import { PageContainer } from './PageContainer';
import { InfoBox } from './InfoBox';

export function Page02() {
  return (
    <PageContainer pageNumber="PAGE_02">
      <div className="flex flex-col h-full p-12">
        {/* Title */}
        <h2 className="text-[16px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-12">
          THE_STRUCTURAL_MIRROR
        </h2>

        {/* 2x2 Matrix */}
        <div className="mb-12">
          <div className="relative w-full aspect-square max-w-[500px] mx-auto">
            {/* Axes */}
            <div className="absolute inset-0 border border-[#1A1A1A]">
              {/* Vertical Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#1A1A1A]" />
              {/* Horizontal Line */}
              <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-[#1A1A1A]" />

              {/* Quadrants */}
              {/* Top Left - EMERGING_AUTHORITY */}
              <div className="absolute top-0 left-0 w-1/2 h-1/2 p-4 border-r border-b border-[#1A1A1A]">
                <div className="text-[11px] tracking-[0.08em] uppercase text-[#00FF41]">
                  EMERGING_AUTHORITY
                </div>
              </div>

              {/* Top Right - MONOLITH */}
              <div className="absolute top-0 right-0 w-1/2 h-1/2 p-4 border-b border-[#1A1A1A]">
                <div className="text-[11px] tracking-[0.08em] uppercase text-[#00FF41] text-right">
                  MONOLITH
                </div>
              </div>

              {/* Bottom Left - INVISIBLE_EXPERT */}
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 p-4 border-r border-[#1A1A1A] bg-[#E63946]/10">
                <div className="text-[11px] tracking-[0.08em] uppercase text-[#E63946] absolute bottom-4 left-4">
                  INVISIBLE_EXPERT
                </div>
              </div>

              {/* Bottom Right - COMMODITY */}
              <div className="absolute bottom-0 right-0 w-1/2 h-1/2 p-4 bg-[#E63946]/10">
                <div className="text-[11px] tracking-[0.08em] uppercase text-[#E63946] absolute bottom-4 right-4 text-right">
                  COMMODITY
                </div>
              </div>
            </div>

            {/* Axis Labels */}
            <div className="absolute -left-32 top-0 text-[9px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50 -rotate-90 origin-left">
              HIGH AUTHORITY
            </div>
            <div className="absolute -left-32 bottom-0 text-[9px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50 -rotate-90 origin-left">
              LOW AUTHORITY
            </div>
            <div className="absolute -bottom-8 left-0 text-[9px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50">
              LOW REPLACEABILITY
            </div>
            <div className="absolute -bottom-8 right-0 text-[9px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50">
              HIGH REPLACEABILITY
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 mt-8">
          <InfoBox
            variant="warning"
            title="THE_BRUTAL_TRUTH"
            content={
              <>
                <p className="mb-3">
                  <strong className="text-[#E63946]">PARASITIC_GENERICISM:</strong> When your
                  content could be authored by anyone in your industry, you become structurally
                  invisible. The market doesn't reward expertise—it rewards{' '}
                  <strong>IRREPLACEABILITY</strong>.
                </p>
                <p>
                  You're trapped in the INVISIBLE_EXPERT quadrant: high skill, zero market
                  recognition. Your voice has been commodified.
                </p>
              </>
            }
          />

          <InfoBox
            variant="info"
            title="THE_AUTHORITY_LEAKS"
            content={
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4C6A9] mt-1">▸</span>
                  <span>
                    <strong className="text-[#D4C6A9]">AI_SLOP:</strong> Generic hooks, emoji
                    crutches, and listicle dependency
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4C6A9] mt-1">▸</span>
                  <span>
                    <strong className="text-[#D4C6A9]">LACK_OF_POLARIZING_TRUTH:</strong> Safe
                    opinions that offend no one and inspire no one
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4C6A9] mt-1">▸</span>
                  <span>
                    <strong className="text-[#D4C6A9]">SECONDARY_CONTENT:</strong> Reacting to
                    trends instead of creating intellectual territory
                  </span>
                </li>
              </ul>
            }
          />
        </div>
      </div>
    </PageContainer>
  );
}
