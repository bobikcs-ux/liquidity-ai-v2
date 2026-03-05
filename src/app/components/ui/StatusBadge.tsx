'use client';

import React from 'react';

type StatusLevel = 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

interface StatusBadgeProps {
  level: StatusLevel | string;
  className?: string;
}

// Standardized status badge colors (Bloomberg terminal style)
// HIGH → red, ELEVATED → amber, NORMAL/LOW → green, CRITICAL → red pulsing
export function StatusBadge({ level, className = '' }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'ELEVATED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'LOW':
      case 'NORMAL':
      case 'STABLE':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-1
        text-xs font-semibold
        rounded border
        whitespace-nowrap
        min-w-[70px]
        ${getStatusStyles(level)}
        ${className}
      `}
    >
      {level}
    </span>
  );
}

// Risk level determination helper (reusable across components)
export function getRiskLevel(value: number): StatusLevel {
  if (value >= 75) return 'CRITICAL';
  if (value >= 60) return 'HIGH';
  if (value >= 40) return 'ELEVATED';
  return 'LOW';
}

// Risk color helper for metric values
export function getRiskColor(level: StatusLevel | string): string {
  switch (level.toUpperCase()) {
    case 'CRITICAL':
      return 'text-red-500';
    case 'HIGH':
      return 'text-orange-500';
    case 'ELEVATED':
      return 'text-amber-500';
    case 'LOW':
    case 'NORMAL':
    case 'STABLE':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}
