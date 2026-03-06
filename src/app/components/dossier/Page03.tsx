import React from 'react';
import { PageContainer } from './PageContainer';

export function Page03() {
  return (
    <PageContainer pageNumber="PAGE_03">
      <div className="flex flex-col h-full p-12">
        {/* Title */}
        <div className="mb-12">
          <h2 className="text-[16px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-2">
            THE_RECONSTRUCTION_PROTOCOL
          </h2>
          <p className="text-[12px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-60">
            FROM_INVISIBLE_TO_INEVITABLE
          </p>
        </div>

        {/* Three Pillars */}
        <div className="mb-12">
          <h3 className="text-[12px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-6">
            3_PILLARS_OF_AUTHORITY
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="border border-[#1A1A1A] p-6 bg-[#1A1A1A]/20">
              <div className="text-xs tracking-[0.08em] uppercase text-[#D4C6A9] mb-4">
                01 // NARRATIVE_ASSEMBLY
              </div>
              <p className="text-[11px] leading-[1.7] tracking-[0.02em] text-[#E0E0E0]">
                Philosophy over process. Stop teaching "how-to" and start articulating "why it
                matters." The architect doesn't explain bricks—they explain vision.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="border border-[#1A1A1A] p-6 bg-[#1A1A1A]/20">
              <div className="text-xs tracking-[0.08em] uppercase text-[#D4C6A9] mb-4">
                02 // RADICAL_DIFFERENTIATION
              </div>
              <p className="text-[11px] leading-[1.7] tracking-[0.02em] text-[#E0E0E0]">
                Identify the enemy. Every monolith needs a villain. Define what you're against to
                clarify what you're for. Polarization is precision.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="border border-[#1A1A1A] p-6 bg-[#1A1A1A]/20">
              <div className="text-xs tracking-[0.08em] uppercase text-[#D4C6A9] mb-4">
                03 // FRICTION_LOGIC
              </div>
              <p className="text-[11px] leading-[1.7] tracking-[0.02em] text-[#E0E0E0]">
                Make your brand harder to consume. Complexity filters casuals. Dense prose,
                technical vocabulary, philosophical depth—these aren't bugs, they're features.
              </p>
            </div>
          </div>
        </div>

        {/* Wave Visualization */}
        <div className="mb-12">
          <h3 className="text-[12px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-6">
            TRANSFORMATION_TRAJECTORY
          </h3>
          <div className="relative h-32 border border-[#1A1A1A] bg-[#1A1A1A]/20 p-4">
            {/* Before - Flat Line */}
            <svg className="absolute inset-4" viewBox="0 0 400 80" preserveAspectRatio="none">
              <path
                d="M 0 60 L 400 60"
                stroke="#E63946"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
              />
              <text x="10" y="55" fill="#E63946" fontSize="8" fontFamily="JetBrains Mono, monospace">
                BEFORE
              </text>
            </svg>

            {/* After - Ascending Curve */}
            <svg className="absolute inset-4" viewBox="0 0 400 80" preserveAspectRatio="none">
              <path
                d="M 0 60 Q 100 50, 200 30 T 400 10"
                stroke="#00FF41"
                strokeWidth="2"
                fill="none"
              />
              <text x="340" y="15" fill="#00FF41" fontSize="8" fontFamily="JetBrains Mono, monospace">
                AFTER
              </text>
            </svg>
          </div>
        </div>

        {/* Implementation Timeline */}
        <div>
          <h3 className="text-[12px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-6">
            IMPLEMENTATION_MAP
          </h3>
          <div className="flex items-start justify-between relative">
            {/* Timeline Line */}
            <div className="absolute top-6 left-0 right-0 h-[1px] bg-[#1A1A1A]" />

            {/* Milestone 1 */}
            <div className="relative flex flex-col items-center flex-1">
              <div className="w-3 h-3 rounded-full bg-[#00FF41] border-2 border-[#020502] z-10 mb-3" />
              <div className="text-center">
                <div className="text-xs tracking-[0.08em] uppercase text-[#00FF41] mb-1">
                  T+24h
                </div>
                <div className="text-xs tracking-[0.08em] uppercase text-[#E0E0E0] opacity-60">
                  AUDIT_ABSORPTION
                </div>
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="relative flex flex-col items-center flex-1">
              <div className="w-3 h-3 rounded-full bg-[#D4C6A9] border-2 border-[#020502] z-10 mb-3" />
              <div className="text-center">
                <div className="text-xs tracking-[0.08em] uppercase text-[#D4C6A9] mb-1">
                  T+7d
                </div>
                <div className="text-xs tracking-[0.08em] uppercase text-[#E0E0E0] opacity-60">
                  VOICE_CALIBRATION
                </div>
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="relative flex flex-col items-center flex-1">
              <div className="w-3 h-3 rounded-full bg-[#00FF41] border-2 border-[#020502] z-10 mb-3" />
              <div className="text-center">
                <div className="text-xs tracking-[0.08em] uppercase text-[#00FF41] mb-1">
                  T+30d
                </div>
                <div className="text-xs tracking-[0.08em] uppercase text-[#E0E0E0] opacity-60">
                  STRUCTURAL_MIRROR_COMPLETE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
