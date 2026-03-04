import React from 'react';

interface ContentContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '7xl';
  className?: string;
}

/**
 * Universal Content Wrapper for Liquidity.ai Platform
 * Ensures consistent spacing and max-width across all pages
 * 
 * Usage:
 * <ContentContainer>
 *   <YourContent />
 * </ContentContainer>
 */
export function ContentContainer({ 
  children, 
  maxWidth = '7xl',
  className = '' 
}: ContentContainerProps) {
  const maxWidthClass = {
    'sm': 'max-w-2xl',
    'md': 'max-w-4xl',
    'lg': 'max-w-5xl',
    'xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];
  
  return (
    <div className={`w-full ${maxWidthClass} mx-auto px-4 md:px-8 ${className}`}>
      {children}
    </div>
  );
}
