import React from 'react';

interface StatusIndicatorProps {
  label: string;
  color: 'green' | 'red' | 'gold';
  pulse?: boolean;
}

export function StatusIndicator({ label, color, pulse = false }: StatusIndicatorProps) {
  const colorMap = {
    green: 'bg-[#00FF41]',
    red: 'bg-[#E63946]',
    gold: 'bg-[#D4C6A9]',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-2 h-2 rounded-full ${colorMap[color]}`} />
        {pulse && (
          <div
            className={`absolute inset-0 w-2 h-2 rounded-full ${colorMap[color]} animate-ping opacity-75`}
          />
        )}
      </div>
      <span className="text-xs tracking-[0.08em] uppercase opacity-70" style={{ color: color === 'green' ? '#00FF41' : color === 'red' ? '#E63946' : '#D4C6A9' }}>
        {label}
      </span>
    </div>
  );
}
