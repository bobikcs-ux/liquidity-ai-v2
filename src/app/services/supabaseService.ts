import { supabase } from '../lib/supabase';
import type { MarketContext } from './masterIntelligence';

export interface MarketReport {
  id?: string;
  btc_price: number;
  fear_greed_value: number;
  yield_curve: string;
  btc_dominance: number;
  analysis: string;
  created_at?: string;
}

export interface SystemLog {
  id?: string;
  log_type: 'error' | 'warning' | 'info' | 'repair' | 'debug';
  source: string;
  message: string;
  details?: Record<string, unknown>;
  resolved?: boolean;
  created_at?: string;
}

// System logging functions
export async function logSystemEvent(
  logType: SystemLog['log_type'],
  source: string,
  message: string,
  details?: Record<string, unknown>
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured. Log not saved.');
    return false;
  }

  try {
    const { error } = await supabase.from('system_logs').insert({
      log_type: logType,
      source,
      message,
      details: details || null,
    });

    if (error) {
      console.error('Error saving system log:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to save system log:', err);
    return false;
  }
}

export async function getSystemLogs(
  limit = 20,
  logType?: SystemLog['log_type']
): Promise<SystemLog[]> {
  if (!supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (logType) {
      query = query.eq('log_type', logType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching system logs:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch system logs:', err);
    return [];
  }
}

export async function saveMarketReport(
  context: MarketContext,
  analysis: string
): Promise<boolean> {
  if (!supabase) {
    console.warn('Supabase not configured. Report not saved.');
    return false;
  }

  try {
    const { error } = await supabase.from('market_reports').insert({
      btc_price: context.btcPrice,
      fear_greed_value: context.fearGreedValue,
      fear_greed_label: context.fearGreedLabel,
      yield_curve: context.yieldCurve,
      btc_dominance: context.btcDominance,
      analysis: analysis,
    });

    if (error) {
      console.error('Error saving market report:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to save market report:', err);
    return false;
  }
}

export async function getMarketReports(limit = 10): Promise<MarketReport[]> {
  if (!supabase) {
    console.warn('Supabase not configured.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('market_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching market reports:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch market reports:', err);
    return [];
  }
}
