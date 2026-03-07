'use client';

import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface MacroBriefProps {
  dgs10: number;
  dgs2: number;
  ecbRate: number;
}

export function MacroBrief({ dgs10, dgs2, ecbRate }: MacroBriefProps) {
  const [brief, setBrief] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateMacroBrief();
  }, [dgs10, dgs2, ecbRate]);

  const generateMacroBrief = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/macro-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dgs10,
          dgs2,
          ecbRate,
          yieldCurve: dgs10 - dgs2,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate macro brief');
      }

      const data = await response.json();
      setBrief(data.brief);
    } catch (err) {
      console.error('[MacroBrief] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setBrief('Unable to generate brief at this time.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.03)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4" style={{ color: '#d4af37' }} />
        <h3 className="text-sm font-semibold uppercase" style={{ color: '#d4af37' }}>
          AI Pulse
        </h3>
        {loading && <span className="text-xs animate-pulse" style={{ color: '#a1a1aa' }}>Analyzing...</span>}
      </div>
      
      <p className="text-sm leading-relaxed" style={{ color: '#e4e4e7' }}>
        {brief || 'Market analysis pending...'}
      </p>

      {error && (
        <p className="text-xs mt-2" style={{ color: '#ff3b5c' }}>
          {error}
        </p>
      )}

      <div className="text-xs mt-3 pt-2 border-t" style={{ borderColor: 'rgba(212,175,55,0.1)', color: '#71717a' }}>
        Updated {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
