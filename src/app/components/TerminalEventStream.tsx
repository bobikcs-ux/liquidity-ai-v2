'use client';

import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Terminal, AlertTriangle, Activity, Database, Zap, TrendingUp } from 'lucide-react';
import { useMarketSnapshot } from '../hooks/useMarketSnapshot';

interface EventEntry {
  id: string;
  timestamp: Date;
  type: 'snapshot' | 'regime' | 'volatility' | 'risk' | 'pipeline' | 'system';
  message: string;
  level: 'info' | 'warning' | 'critical';
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
}

function getEventIcon(type: EventEntry['type']) {
  switch (type) {
    case 'snapshot': return Database;
    case 'regime': return Activity;
    case 'volatility': return TrendingUp;
    case 'risk': return AlertTriangle;
    case 'pipeline': return Zap;
    default: return Terminal;
  }
}

function getEventColor(level: EventEntry['level']): string {
  switch (level) {
    case 'critical': return 'text-red-400';
    case 'warning': return 'text-amber-400';
    default: return 'text-green-400';
  }
}

interface TerminalEventStreamProps {
  maxEvents?: number;
  compact?: boolean;
}

export const TerminalEventStream = memo(function TerminalEventStream({ 
  maxEvents = 10,
  compact = false 
}: TerminalEventStreamProps) {
  const { latest: snapshot, loading } = useMarketSnapshot();
  const [events, setEvents] = useState<EventEntry[]>([]);
  const previousSnapshot = useRef<typeof snapshot>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Add event to stream
  const addEvent = useCallback((
    type: EventEntry['type'], 
    message: string, 
    level: EventEntry['level'] = 'info'
  ) => {
    const newEvent: EventEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
      level,
    };
    
    setEvents(prev => [newEvent, ...prev].slice(0, maxEvents));
  }, [maxEvents]);
  
  // Monitor snapshot changes and generate events
  useEffect(() => {
    if (!snapshot || loading) return;
    
    const prev = previousSnapshot.current;
    
    // First load
    if (!prev) {
      addEvent('snapshot', 'SNAPSHOT INGESTED', 'info');
      addEvent('system', 'TERMINAL INITIALIZED', 'info');
      previousSnapshot.current = snapshot;
      return;
    }
    
    // New snapshot detected
    if (prev.id !== snapshot.id || prev.created_at !== snapshot.created_at) {
      addEvent('snapshot', 'SNAPSHOT INGESTED', 'info');
      
      // Check for regime change
      if (prev.regime !== snapshot.regime) {
        addEvent('regime', `REGIME CHANGED: ${prev.regime?.toUpperCase()} → ${snapshot.regime?.toUpperCase()}`, 
          snapshot.regime === 'crisis' ? 'critical' : snapshot.regime === 'stress' ? 'warning' : 'info'
        );
      }
      
      // Check for volatility spike (>20% increase)
      const prevVol = prev.btc_volatility ?? 0;
      const currVol = snapshot.btc_volatility ?? 0;
      if (currVol > prevVol * 1.2 && currVol > 0.5) {
        addEvent('volatility', `VOLATILITY SPIKE DETECTED: ${(currVol * 100).toFixed(1)}%`, 'warning');
      }
      
      // Check for high systemic risk
      const systemicRisk = snapshot.systemic_risk != null 
        ? (snapshot.systemic_risk > 1 ? snapshot.systemic_risk : snapshot.systemic_risk * 100)
        : 0;
      if (systemicRisk > 70) {
        addEvent('risk', `HIGH SYSTEMIC RISK: ${Math.round(systemicRisk)}`, 'critical');
      }
      
      // Pipeline update
      addEvent('pipeline', 'LIQUIDITY PIPELINE UPDATED', 'info');
    }
    
    previousSnapshot.current = snapshot;
  }, [snapshot, loading, addEvent]);
  
  // Auto-scroll to top on new events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);
  
  // Generate initial events on mount
  useEffect(() => {
    const initialEvents: EventEntry[] = [
      {
        id: 'init-1',
        timestamp: new Date(Date.now() - 1000),
        type: 'system',
        message: 'TERMINAL ONLINE',
        level: 'info',
      },
      {
        id: 'init-2',
        timestamp: new Date(Date.now() - 2000),
        type: 'system',
        message: 'DATA PIPELINE CONNECTED',
        level: 'info',
      },
      {
        id: 'init-3',
        timestamp: new Date(Date.now() - 3000),
        type: 'system',
        message: 'BLACK SWAN DETECTOR ACTIVE',
        level: 'info',
      },
    ];
    setEvents(initialEvents);
  }, []);
  
  if (compact) {
    return (
      <div className="font-mono text-xs space-y-1">
        {events.slice(0, 3).map(event => (
          <div key={event.id} className={`flex items-center gap-2 ${getEventColor(event.level)}`}>
            <span className="text-gray-500">[{formatTime(event.timestamp)}]</span>
            <span>{event.message}</span>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="bg-[#0a1628] border border-blue-900/50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-900/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Terminal Event Stream
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-mono">LIVE</span>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="h-48 overflow-y-auto font-mono text-xs p-3 space-y-1.5 custom-scrollbar"
      >
        {events.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Waiting for events...
          </div>
        ) : (
          events.map(event => {
            const Icon = getEventIcon(event.type);
            const color = getEventColor(event.level);
            
            return (
              <div 
                key={event.id} 
                className={`flex items-start gap-2 py-1 border-b border-gray-800/50 last:border-0 animate-in fade-in slide-in-from-top-1 duration-300`}
              >
                <span className="text-gray-500 whitespace-nowrap">
                  [{formatTime(event.timestamp)}]
                </span>
                <Icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${color}`} />
                <span className={color}>{event.message}</span>
              </div>
            );
          })
        )}
      </div>
      
      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)]" style={{ backgroundSize: '100% 4px' }} />
    </div>
  );
});

export default TerminalEventStream;
