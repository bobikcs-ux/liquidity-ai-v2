import React from 'react';
import { PageContainer } from './PageContainer';
import { InfoBox } from './InfoBox';

export function Page04() {
  return (
    <PageContainer pageNumber="PAGE_04">
      <div className="flex flex-col h-full p-12">
        {/* Title */}
        <h2 className="text-[16px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-12">
          DISSECTION_GRID // X-RAY_ANALYSIS
        </h2>

        {/* LinkedIn Post Container with HUD */}
        <div className="mb-8">
          <div className="border-2 border-[#D4C6A9] bg-[#1A1A1A]/40 p-6 relative">
            {/* Scan ID Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#1A1A1A]">
              <div className="text-xs tracking-[0.08em] uppercase text-[#D4C6A9]">
                SCAN_ID: POST_001
              </div>
              <div className="text-[9px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50">
                ANALYSIS_COMPLETE
              </div>
            </div>

            {/* Sample Post Content */}
            <div className="text-[13px] leading-[1.7] tracking-[0.02em] text-[#E0E0E0] mb-4">
              <p className="mb-3">
                🚀 5 Tips to Boost Your Productivity Today! 🚀
              </p>
              <p className="mb-2">
                1️⃣ Start your day with intention<br />
                2️⃣ Break tasks into smaller steps<br />
                3️⃣ Use time-blocking techniques<br />
                4️⃣ Take regular breaks<br />
                5️⃣ Reflect on your progress
              </p>
              <p>
                What's your #1 productivity hack? Drop it in the comments! 💬👇
              </p>
            </div>

            {/* Post Metadata */}
            <div className="flex justify-between items-center pt-3 border-t border-[#1A1A1A] text-[9px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50">
              <div>ENGAGEMENT: 47 LIKES // 3 COMMENTS</div>
              <div>TIMESTAMP: 2026-02-14_09:32</div>
            </div>
          </div>

          {/* HUD Indicators */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="border border-[#E63946] bg-[#E63946]/5 p-3">
              <div className="text-xs tracking-[0.08em] uppercase text-[#E63946] mb-1">
                AI_SLOP_DETECTED
              </div>
              <div className="text-[20px] text-[#E63946]">95%</div>
            </div>
            <div className="border border-[#E63946] bg-[#E63946]/5 p-3">
              <div className="text-xs tracking-[0.08em] uppercase text-[#E63946] mb-1">
                GENERIC_HOOK
              </div>
              <div className="text-[20px] text-[#E63946]">88%</div>
            </div>
            <div className="border border-[#E63946] bg-[#E63946]/5 p-3">
              <div className="text-xs tracking-[0.08em] uppercase text-[#E63946] mb-1">
                EMOJI_CRUTCH
              </div>
              <div className="text-[20px] text-[#E63946]">100%</div>
            </div>
          </div>
        </div>

        {/* Analysis Boxes */}
        <div className="space-y-6">
          <InfoBox
            variant="warning"
            title="DIAGNOSIS // INVISIBLE_EXPERT_SYNDROME"
            content={
              <>
                <p className="mb-3">
                  <strong className="text-[#E63946]">CRITICAL_FAILURE:</strong> This content is
                  structurally indistinguishable from 10,000+ other "productivity coaches" on
                  LinkedIn. Zero intellectual property. Zero memorable voice.
                </p>
                <p className="mb-3">
                  <strong className="text-[#E63946]">SYMPTOMS:</strong>
                </p>
                <ul className="space-y-1 ml-4">
                  <li>• Emoji-laden hooks signaling desperation for attention</li>
                  <li>• Listicle format indicating algorithmic pandering</li>
                  <li>• Generic advice available in 1,000 free blog posts</li>
                  <li>• CTA begging for validation ("Drop it in comments")</li>
                </ul>
              </>
            }
          />

          <InfoBox
            variant="success"
            title="PRESCRIPTION // RECONSTRUCTION_PROTOCOL"
            content={
              <>
                <p className="mb-3">
                  <strong className="text-[#00FF41]">IMMEDIATE_ACTION:</strong>
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#00FF41] mt-1">▸</span>
                    <span>
                      Replace hooks with <strong>PHILOSOPHICAL_FRICTION</strong>: Start with a
                      controversial statement that filters casuals
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00FF41] mt-1">▸</span>
                    <span>
                      Eliminate listicles. Develop <strong>NARRATIVE_ARCHITECTURE</strong>: Tell
                      stories that only YOU can tell
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00FF41] mt-1">▸</span>
                    <span>
                      Remove all emojis. Let language carry weight through{' '}
                      <strong>DENSITY</strong>, not decoration
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#00FF41] mt-1">▸</span>
                    <span>
                      Never ask for engagement. <strong>COMMAND_ATTENTION</strong> through
                      intellectual authority
                    </span>
                  </li>
                </ul>
              </>
            }
          />
        </div>
      </div>
    </PageContainer>
  );
}
