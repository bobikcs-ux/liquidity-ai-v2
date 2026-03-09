import React from 'react';
import { PageContainer } from './PageContainer';
import { StatusIndicator } from './StatusIndicator';
import { ProgressBar } from './ProgressBar';
import { InfoBox } from './InfoBox';

interface Page06Props {
  timestamp: string;
}

export function Page06({ timestamp }: Page06Props) {
  return (
    <PageContainer pageNumber="PAGE_06">
      <div className="flex flex-col h-full p-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h2 className="text-[20px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-3">
              NEW_AUTHORITY_MANIFEST // v1.0
            </h2>
            <StatusIndicator label="ACTIVE_DEPLOYMENT" color="green" pulse={true} />
          </div>
          <div className="text-right">
            <div className="text-[9px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50 mb-1">
              ENCRYPTION_KEY
            </div>
            <div className="text-[12px] tracking-[0.08em] text-[#D4C6A9]">A-88-MIRROR</div>
          </div>
        </div>

        {/* Voice Parameters */}
        <div className="mb-8">
          <h3 className="text-[12px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-6">
            VOICE_PARAMETERS // CORE_SPECS
          </h3>
          <div className="space-y-4 bg-[#1A1A1A]/20 border border-[#1A1A1A] p-6">
            <ProgressBar label="DIRECTNESS" percentage={100} color="green" />
            <ProgressBar label="FRICTION_LEVEL" percentage={65} color="gold" />
            <ProgressBar label="COMPLEXITY" percentage={40} color="gold" />
            <ProgressBar label="AUTHORITY_BIAS" percentage={95} color="green" />
          </div>
        </div>

        {/* Deprecated Patterns */}
        <div className="mb-8">
          <InfoBox
            variant="warning"
            title="DEPRECATED_PATTERNS // FORBIDDEN_CONSTRUCTS"
            content={
              <div className="space-y-3">
                <div>
                  <div className="text-xs tracking-[0.08em] uppercase text-[#E63946] mb-2">
                    NO_AI_GREETINGS
                  </div>
                  <div className="text-[11px] opacity-70 line-through">
                    "Hope you're having a great week!"
                  </div>
                </div>
                <div>
                  <div className="text-xs tracking-[0.08em] uppercase text-[#E63946] mb-2">
                    NO_PASSIVE_VALIDATION
                  </div>
                  <div className="text-[11px] opacity-70 line-through">
                    "What do you think? Let me know in the comments!"
                  </div>
                </div>
                <div>
                  <div className="text-xs tracking-[0.08em] uppercase text-[#E63946] mb-2">
                    NO_EMOJI_DECORATION
                  </div>
                  <div className="text-[11px] opacity-70 line-through">
                    "🚀 Here are 5 tips 💡 to boost your productivity 📈"
                  </div>
                </div>
                <div>
                  <div className="text-xs tracking-[0.08em] uppercase text-[#E63946] mb-2">
                    NO_GENERIC_HOOKS
                  </div>
                  <div className="text-[11px] opacity-70 line-through">
                    "Want to know the secret to success?"
                  </div>
                </div>
                <div>
                  <div className="text-xs tracking-[0.08em] uppercase text-[#E63946] mb-2">
                    NO_TREND_CHASING
                  </div>
                  <div className="text-[11px] opacity-70 line-through">
                    "Here's what ChatGPT taught me about..."
                  </div>
                </div>
              </div>
            }
          />
        </div>

        {/* Footer Section */}
        <div className="mt-auto space-y-6">
          <div className="border-t border-[#1A1A1A] pt-6">
            <h3 className="text-[12px] tracking-[0.08em] uppercase text-[#00FF41] mb-4">
              READY_FOR_MARKET_DISTORTION
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs tracking-[0.08em] uppercase text-[#E0E0E0] opacity-70">
                  ARCHITECT_APPROVAL
                </span>
                <span className="text-xs tracking-[0.08em] uppercase text-[#00FF41]">
                  [SIGNED]
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs tracking-[0.08em] uppercase text-[#E0E0E0] opacity-70">
                  SYNCED_AT
                </span>
                <span className="text-xs tracking-[0.08em] text-[#E0E0E0]">
                  {timestamp}
                </span>
              </div>
            </div>
          </div>

          {/* Authority Seal */}
          <div className="flex justify-center">
            <div
              className="border-2 border-[#D4C6A9] w-24 h-24 flex items-center justify-center relative"
              style={{ transform: 'rotate(-5deg)' }}
            >
              <div className="text-center">
                <div className="text-[8px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-1">
                  AUTHORITY
                </div>
                <div className="text-[16px] tracking-[0.08em] uppercase text-[#D4C6A9]">SEAL</div>
                <div className="text-[8px] tracking-[0.08em] uppercase text-[#D4C6A9] mt-1">
                  2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
