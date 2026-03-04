import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

interface MarketReport {
  id: string;
  created_at: string;
  btc_price: number;
  fear_greed_value: number;
  fear_greed_label: string;
  yield_curve: string;
  btc_dominance: number;
  analysis: string;
}

export default function HistoryPanel() {
  const [reports, setReports] = useState<MarketReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentRegime, uiTheme } = useAdaptiveTheme();
  
  const isDark = uiTheme === 'dark';
  const isHybrid = uiTheme === 'hybrid';

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('market_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setReports(data);
      }
      setIsLoading(false);
    };

    fetchHistory();

    // Subscribe to real-time changes
    const channel = supabase.channel('market_reports_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'market_reports' }, 
        (payload) => {
          setReports(prev => [payload.new as MarketReport, ...prev.slice(0, 4)]);
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, []);

  // Calculate survival score based on fear/greed (inverse relationship)
  const getSurvivalScore = (fearGreed: number) => {
    // Lower fear/greed = higher survival chance (contrarian approach)
    if (fearGreed <= 25) return 85;
    if (fearGreed <= 40) return 70;
    if (fearGreed <= 60) return 55;
    if (fearGreed <= 75) return 40;
    return 25;
  };

  if (!supabase) {
    return (
      <div className={`mt-8 border-t pt-6 ${
        isDark ? 'border-gray-700' : isHybrid ? 'border-gray-600' : 'border-gray-200'
      }`}>
        <p className={`text-sm ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
          Database connection not configured.
        </p>
      </div>
    );
  }

  return (
    <div className={`mt-8 border-t pt-6 ${
      isDark ? 'border-green-900' : isHybrid ? 'border-green-800' : 'border-green-200'
    }`}>
      <h3 className={`font-mono text-sm mb-4 tracking-widest uppercase underline ${
        isDark ? 'text-green-500' : isHybrid ? 'text-green-400' : 'text-green-700'
      }`}>
        - Historical Black Swan Records -
      </h3>
      
      {isLoading ? (
        <div className={`text-xs font-mono ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading historical data...
        </div>
      ) : reports.length === 0 ? (
        <div className={`text-xs font-mono ${isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}`}>
          No historical records found. Run a Master Scan to create the first entry.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const survivalScore = getSurvivalScore(report.fear_greed_value);
            return (
              <div 
                key={report.id} 
                className={`grid grid-cols-4 gap-4 text-[10px] font-mono p-2 border transition-colors ${
                  isDark 
                    ? 'border-green-900/30 bg-green-950/5 hover:bg-green-900/20' 
                    : isHybrid 
                    ? 'border-green-800/30 bg-green-900/5 hover:bg-green-800/20'
                    : 'border-green-200 bg-green-50/50 hover:bg-green-100'
                }`}
              >
                <span className={isDark || isHybrid ? 'text-gray-500' : 'text-gray-600'}>
                  {format(new Date(report.created_at), 'MMM dd, HH:mm')}
                </span>
                <span className={isDark ? 'text-green-400' : isHybrid ? 'text-green-300' : 'text-green-700'}>
                  BTC: ${Number(report.btc_price).toLocaleString()}
                </span>
                <span className={isDark ? 'text-yellow-500' : isHybrid ? 'text-yellow-400' : 'text-yellow-600'}>
                  FEAR: {report.fear_greed_value}
                </span>
                <span className={`font-bold text-right ${
                  survivalScore >= 70 
                    ? (isDark ? 'text-green-400' : isHybrid ? 'text-green-300' : 'text-green-600')
                    : survivalScore >= 50 
                    ? (isDark ? 'text-yellow-500' : isHybrid ? 'text-yellow-400' : 'text-yellow-600')
                    : (isDark ? 'text-red-500' : isHybrid ? 'text-red-400' : 'text-red-600')
                }`}>
                  SURVIVAL: {survivalScore}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
