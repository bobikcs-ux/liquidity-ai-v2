import React from 'react';

interface InfoBoxProps {
  title: string;
  content: string | React.ReactNode;
  variant: 'warning' | 'success' | 'info';
}

export function InfoBox({ title, content, variant }: InfoBoxProps) {
  const variantStyles = {
    warning: 'border-[#E63946] bg-[#E63946]/5',
    success: 'border-[#00FF41] bg-[#00FF41]/5',
    info: 'border-[#D4C6A9] bg-[#D4C6A9]/5',
  };

  const titleColor = {
    warning: '#E63946',
    success: '#00FF41',
    info: '#D4C6A9',
  };

  return (
    <div className={`border p-4 ${variantStyles[variant]}`}>
      <h4
        className="text-[11px] tracking-[0.08em] uppercase mb-3"
        style={{ color: titleColor[variant] }}
      >
        {title}
      </h4>
      <div className="text-[#E0E0E0] text-[13px] leading-[1.7] tracking-[0.02em]">
        {content}
      </div>
    </div>
  );
}
