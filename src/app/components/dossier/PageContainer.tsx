import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  pageNumber: string;
}

export function PageContainer({ children, pageNumber }: PageContainerProps) {
  return (
    <div
      className="dossier-page relative overflow-hidden bg-[#020502] border border-[#1A1A1A]"
      style={{
        width: '794px',
        height: '1123px',
        fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
      }}
    >
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(212, 198, 169, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(212, 198, 169, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '10px 10px',
        }}
      />

      {/* Noise Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Page Number */}
      <div className="absolute bottom-6 right-6 text-[#D4C6A9] text-[10px] tracking-[0.08em] opacity-60">
        {pageNumber}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}