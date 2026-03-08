import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Clock, CheckCircle2, XCircle, Loader2, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { supabase } from '../lib/supabase';
import { useYieldWall } from '../hooks/useYieldWall';

interface ProphecyEntry {
  id: string;
  prediction_id: string;
  prediction_type: string;
  asset: string;
  predicted_value: number;
  predicted_direction: 'UP' | 'DOWN' | 'STABLE';
  predicted_at: string;
  target_date: string | null;
  actual_value: number | null;
  verified_at: string | null;
  outcome: 'HIT' | 'MISS' | 'PENDING';
  accuracy_score: number | null;
  confidence_level: number;
  rationale: string | null;
  source_signal: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  ENERGY: '#f97316',
  YIELD:  '#3b82f6',
  FX:     '#a855f7',
  EQUITY: '#22c55e',
  CRYPTO: '#eab308',
  METAL:  '#f59e0b',
};

function OutcomeBadge({ outcome }: { outcome: ProphecyEntry['outcome'] }) {
  if (outcome === 'HIT') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded font-mono"
      style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
      <CheckCircle2 className="w-3 h-3" /> HIT
    </span>
  );
  if (outcome === 'MISS') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded font-mono"
      style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
      <XCircle className="w-3 h-3" /> MISS
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded font-mono"
      style={{ background: 'rgba(163,147,123,0.12)', color: '#A3937B', border: '1px solid rgba(163,147,123,0.3)' }}>
      <Clock className="w-3 h-3" /> PENDING
    </span>
  );
}

function AccuracyScore({ score }: { score: number | null }) {
  if (score === null) return <span className="text-zinc-500 font-mono text-sm">--</span>;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  return <span className="font-bold font-mono text-sm" style={{ color }}>{score.toFixed(1)}%</span>;
}

export function ProphecyLog() {
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  const [entries, setEntries] = useState<ProphecyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'HIT' | 'MISS' | 'PENDING'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const yieldWall = useYieldWall();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('prophecy_log')
        .select('*')
        .order('predicted_at', { ascending: false });
      if (!error && data) setEntries(data as ProphecyEntry[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === 'ALL' ? entries : entries.filter(e => e.outcome === filter);
  const hits = entries.filter(e => e.outcome === 'HIT').length;
  const misses = entries.filter(e => e.outcome === 'MISS').length;
  const pending = entries.filter(e => e.outcome === 'PENDING').length;
  const verified = hits + misses;
  const hitRate = verified > 0 ? Math.round((hits / verified) * 100) : null;

  const surface = isDark || isHybrid;
  const bg = surface ? '#0b0f17' : '#fff';
  const border = surface ? '#1f2937' : '#e5e7eb';
  const text = surface ? '#e2e8f0' : '#111827';
  const muted = surface ? '#6b7280' : '#9ca3af';
  const cardBg = surface ? '#111827' : '#f9fafb';

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 py-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold" style={{ color: text }}>PROPHECY LOG</h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded tracking-widest"
              style={{ background: 'rgba(255,59,92,0.12)', color: '#ff3b5c', border: '1px solid rgba(255,59,92,0.3)' }}>
              GLOBAL_ALERT
            </span>
          </div>
          <p className="text-sm font-mono" style={{ color: muted }}>
            AURELIUS prediction record — every call logged, every outcome verified.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: '#A3937B' }} />
          <span className="text-xs font-mono" style={{ color: muted }}>UNASSAILABLE TRACK RECORD</span>
        </div>
      </div>

      {/* Yield Wall Status */}
      {yieldWall.isWatching && (
        <div
          className="rounded-xl p-4 flex items-center gap-4 flex-wrap"
          style={{
            background: yieldWall.activeBreach
              ? 'rgba(255,59,92,0.08)'
              : 'rgba(163,147,123,0.05)',
            border: `1px solid ${yieldWall.activeBreach ? 'rgba(255,59,92,0.4)' : 'rgba(163,147,123,0.2)'}`,
          }}
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0"
            style={{ color: yieldWall.activeBreach ? '#ff3b5c' : '#A3937B' }} />
          <div className="flex-1">
            <div className="text-xs font-mono font-bold tracking-widest mb-0.5"
              style={{ color: yieldWall.activeBreach ? '#ff3b5c' : '#A3937B' }}>
              {yieldWall.activeBreach ? yieldWall.activeBreach.alert_title : 'YIELD WALL MONITOR — ACTIVE'}
            </div>
            <div className="text-xs font-mono" style={{ color: muted }}>
              {yieldWall.activeBreach
                ? yieldWall.activeBreach.alert_message.slice(0, 140) + '...'
                : `DGS10: ${yieldWall.currentDGS10?.toFixed(2) ?? '--'}% | Breach threshold: 4.50% | Polling every 60s`}
            </div>
          </div>
          {yieldWall.currentDGS10 !== null && (
            <div className="text-right">
              <div className="text-xs font-mono" style={{ color: muted }}>10Y YIELD</div>
              <div className="text-xl font-bold font-mono tabular-nums"
                style={{ color: (yieldWall.currentDGS10 >= 4.5) ? '#ff3b5c' : (yieldWall.currentDGS10 >= 4.0) ? '#f59e0b' : '#22c55e' }}>
                {yieldWall.currentDGS10.toFixed(2)}%
              </div>
              <div className="text-[10px] font-mono" style={{ color: muted }}>
                WALL: 4.50%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'HIT RATE', value: hitRate !== null ? `${hitRate}%` : '--', color: hitRate !== null && hitRate >= 70 ? '#22c55e' : '#f59e0b' },
          { label: 'VERIFIED HITS', value: String(hits), color: '#22c55e' },
          { label: 'MISSES', value: String(misses), color: '#ef4444' },
          { label: 'PENDING', value: String(pending), color: '#A3937B' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl p-4 text-center"
            style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="text-xs font-mono tracking-widest mb-1" style={{ color: muted }}>{stat.label}</div>
            <div className="text-2xl font-bold font-mono tabular-nums" style={{ color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'HIT', 'MISS'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs font-mono font-bold px-3 py-1.5 rounded transition-colors"
            style={{
              background: filter === f ? 'rgba(163,147,123,0.2)' : 'transparent',
              color: filter === f ? '#B8A892' : muted,
              border: `1px solid ${filter === f ? 'rgba(163,147,123,0.4)' : 'rgba(163,147,123,0.15)'}`,
            }}
          >
            {f}
          </button>
        ))}
        <span className="text-xs font-mono ml-auto" style={{ color: muted }}>
          {filtered.length} records
        </span>
      </div>

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#A3937B' }} />
          <span className="ml-3 text-sm font-mono" style={{ color: muted }}>Loading prophecy record...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <Target className="w-8 h-8 mx-auto mb-3" style={{ color: muted }} />
          <p className="text-sm font-mono" style={{ color: muted }}>No predictions found for filter: {filter}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <div key={entry.id}
              className="rounded-xl overflow-hidden transition-colors"
              style={{ background: cardBg, border: `1px solid ${border}` }}>

              {/* Row */}
              <button
                className="w-full flex items-center gap-4 p-4 text-left"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
              >
                {/* Type badge */}
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{
                    background: `${TYPE_COLORS[entry.prediction_type] ?? '#6b7280'}18`,
                    color: TYPE_COLORS[entry.prediction_type] ?? '#6b7280',
                    border: `1px solid ${TYPE_COLORS[entry.prediction_type] ?? '#6b7280'}40`,
                  }}>
                  {entry.prediction_type}
                </span>

                {/* Asset + direction */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-sm font-bold font-mono" style={{ color: text }}>{entry.asset}</span>
                  <span className="text-xs font-mono"
                    style={{ color: entry.predicted_direction === 'UP' ? '#22c55e' : entry.predicted_direction === 'DOWN' ? '#ef4444' : '#f59e0b' }}>
                    {entry.predicted_direction === 'UP' ? '▲' : entry.predicted_direction === 'DOWN' ? '▼' : '—'}
                    {' '}{entry.predicted_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {entry.actual_value !== null && (
                    <span className="text-xs font-mono" style={{ color: muted }}>
                      actual: {entry.actual_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>

                {/* Confidence */}
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  <TrendingUp className="w-3 h-3" style={{ color: muted }} />
                  <span className="text-xs font-mono" style={{ color: muted }}>{entry.confidence_level}%</span>
                </div>

                {/* Accuracy */}
                <div className="flex-shrink-0 w-14 text-right">
                  <AccuracyScore score={entry.accuracy_score} />
                </div>

                {/* Outcome */}
                <div className="flex-shrink-0">
                  <OutcomeBadge outcome={entry.outcome} />
                </div>

                {/* Expand toggle */}
                <div className="flex-shrink-0" style={{ color: muted }}>
                  {expandedId === entry.id
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expanded detail */}
              {expandedId === entry.id && (
                <div className="px-4 pb-4 pt-0 border-t" style={{ borderColor: border }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <div className="text-[10px] font-mono tracking-widest mb-1" style={{ color: muted }}>RATIONALE</div>
                      <p className="text-sm" style={{ color: text }}>{entry.rationale ?? 'No rationale provided.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <div className="tracking-widest mb-0.5" style={{ color: muted }}>PREDICTED</div>
                        <div style={{ color: text }}>{new Date(entry.predicted_at).toLocaleDateString('en-GB')}</div>
                      </div>
                      {entry.target_date && (
                        <div>
                          <div className="tracking-widest mb-0.5" style={{ color: muted }}>TARGET DATE</div>
                          <div style={{ color: text }}>{new Date(entry.target_date).toLocaleDateString('en-GB')}</div>
                        </div>
                      )}
                      {entry.verified_at && (
                        <div>
                          <div className="tracking-widest mb-0.5" style={{ color: muted }}>VERIFIED</div>
                          <div style={{ color: text }}>{new Date(entry.verified_at).toLocaleDateString('en-GB')}</div>
                        </div>
                      )}
                      {entry.source_signal && (
                        <div>
                          <div className="tracking-widest mb-0.5" style={{ color: muted }}>SOURCE</div>
                          <div style={{ color: '#A3937B' }}>{entry.source_signal}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
