import React from 'react';
import { PageContainer } from './PageContainer';
import { Barcode } from './Barcode';
import { StatusIndicator } from './StatusIndicator';

interface Page01Props {
  clientName: string;
  serialNumber: string;
  timestamp: string;
}

export function Page01({ clientName, serialNumber, timestamp }: Page01Props) {
  return (
    <PageContainer pageNumber="PAGE_01">
      <div className="flex flex-col h-full p-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-16">
          <div>
            <h1 className="text-[24px] tracking-[0.08em] uppercase text-[#D4C6A9] mb-2">
              PERSONAL_AUTHORITY_DOSSIER
            </h1>
            <p className="text-[12px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-60">
              STRUCTURAL_MIRROR_ANALYSIS
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50 mb-1">
              SERIAL
            </div>
            <div className="text-[14px] tracking-[0.08em] text-[#D4C6A9]">
              {serialNumber}
            </div>
          </div>
        </div>

        {/* Client Name - Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[10px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50 mb-4">
              CLIENT_DESIGNATION
            </div>
            <input
              type="text"
              value={clientName}
              readOnly
              className="text-[32px] tracking-[0.08em] uppercase text-[#D4C6A9] bg-transparent border-none text-center w-full outline-none"
              style={{ fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace" }}
            />
          </div>
        </div>

        {/* 3x3 Grid Visualization */}
        <div className="mb-16">
          <div className="grid grid-cols-3 gap-4 max-w-[300px] mx-auto">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square border border-[#1A1A1A] bg-[#1A1A1A]/20 relative group hover:border-[#D4C6A9]/30 transition-colors"
              >
                <div className="absolute top-1 left-1 text-[8px] text-[#D4C6A9] opacity-30">
                  {String.fromCharCode(65 + Math.floor(i / 3))}{(i % 3) + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-8">
          {/* Status Indicator */}
          <div className="flex justify-center">
            <StatusIndicator label="CONFIDENTIAL // AUTHORIZED_ACCESS_ONLY" color="red" />
          </div>

          {/* Barcode */}
          <div className="flex justify-center">
            <Barcode />
          </div>

          {/* Timestamp */}
          <div className="flex justify-between items-center text-[9px] tracking-[0.08em] uppercase text-[#E0E0E0] opacity-50">
            <div>GENERATED: {timestamp}</div>
            <div>STRUCTURAL_MIRROR_v2.0</div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
