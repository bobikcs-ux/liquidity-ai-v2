import React from 'react';

interface ProgressBarProps {
  label: string;
  percentage: number;
  color?: 'green' | 'gold' | 'red';
}

export function ProgressBar({ label, percentage, color = 'green' }: ProgressBarProps) {
  const colorMap = {
    green: '#00FF41',
    gold: '#D4C6A9',
    red: '#E63946',
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs tracking-[0.08em] uppercase opacity-70 text-[#E0E0E0]">
          {label}
        </span>
        <span className="text-xs text-[#E0E0E0] opacity-80">{percentage}%</span>
      </div>
      <div className="h-1 bg-[#1A1A1A] border border-[#1A1A1A] relative overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: colorMap[color],
          }}
        />
      </div>
    </div>
  );
}
