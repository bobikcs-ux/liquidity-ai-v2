import type { MarketContext } from '../services/masterIntelligence';
import { logSystemEvent } from '../services/supabaseService';

interface ReportData {
  context: MarketContext;
  analysis: string;
  timestamp: Date;
}

// Generate PDF content as HTML for printing
export const generateReportHTML = (data: ReportData): string => {
  const { context, analysis, timestamp } = data;
  
  // Use database regime for risk level (strict sync)
  const fearGreed = parseInt(context.fearGreedValue) || 50;
  const yieldValue = parseFloat(context.yieldCurve || '0');
  
  let riskLevel = 'MODERATE';
  let riskColor = '#f59e0b';
  
  // Strictly use database regime if available
  if (context.regime) {
    const regime = context.regime.toLowerCase();
    if (regime === 'crisis') {
      riskLevel = 'HIGH';
      riskColor = '#ef4444';
    } else if (regime === 'stress') {
      riskLevel = 'STRESS';
      riskColor = '#f97316';
    } else if (regime === 'normal') {
      riskLevel = 'LOW';
      riskColor = '#22c55e';
    }
  } else {
    // Fallback only if no DB regime
    if (fearGreed < 25 || yieldValue < -0.5) {
      riskLevel = 'HIGH';
      riskColor = '#ef4444';
    } else if (fearGreed > 75) {
      riskLevel = 'ELEVATED';
      riskColor = '#f97316';
    } else if (fearGreed > 50 && yieldValue > 0) {
      riskLevel = 'LOW';
      riskColor = '#22c55e';
    }
  }
  
  // Calculate survival probability - handle decimal vs percentage
  let survivalProb = 78;
  if (context.survivalProbability != null) {
    survivalProb = context.survivalProbability > 1 
      ? Math.round(context.survivalProbability) 
      : Math.round(context.survivalProbability * 100);
  }
  
  // Liquidity state from balance sheet delta
  let liquidityState = 'Stable';
  if (context.balanceSheetDelta != null) {
    liquidityState = context.balanceSheetDelta < -0.1 ? 'Tightening (QT)' : 
                     context.balanceSheetDelta > 0.1 ? 'Easing (QE)' : 'Neutral';
  } else if (context.systemicRisk != null) {
    liquidityState = context.systemicRisk > 0.5 ? 'Tightening' : 
                     context.systemicRisk > 0.3 ? 'Cautious' : 'Healthy';
  }
  
  // Yield curve display with % unit
  const yieldDisplay = context.yieldCurve && context.yieldCurve !== 'N/A' 
    ? `${context.yieldCurve}%` 
    : 'N/A';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Black Swan Intelligence Report - ${timestamp.toLocaleDateString()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 40px;
      min-height: 100vh;
    }
    
    .report-container {
      max-width: 800px;
      margin: 0 auto;
      background: #1e293b;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #334155;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    
    .logo-text h1 {
      font-size: 20px;
      font-weight: 700;
      color: #f8fafc;
    }
    
    .logo-text p {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .timestamp {
      text-align: right;
      font-size: 12px;
      color: #94a3b8;
    }
    
    .risk-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 8px;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 32px;
    }
    
    .metric-card {
      background: #0f172a;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #334155;
    }
    
    .metric-label {
      font-size: 12px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #f8fafc;
    }
    
    .metric-change {
      font-size: 12px;
      margin-top: 4px;
    }
    
    .positive { color: #22c55e; }
    .negative { color: #ef4444; }
    .neutral { color: #f59e0b; }
    
    .analysis-section {
      background: #0f172a;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #334155;
      margin-bottom: 32px;
    }
    
    .analysis-title {
      font-size: 14px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .analysis-content {
      font-size: 14px;
      line-height: 1.7;
      color: #cbd5e1;
      white-space: pre-line;
    }
    
    .footer {
      text-align: center;
      padding-top: 24px;
      border-top: 1px solid #334155;
      font-size: 11px;
      color: #64748b;
    }
    
    .disclaimer {
      margin-top: 16px;
      padding: 16px;
      background: #1e1e1e;
      border-radius: 8px;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.5;
    }
    
    @media print {
      body {
        background: white;
        color: #1e293b;
        padding: 20px;
      }
      
      .report-container {
        background: white;
        box-shadow: none;
        border: 1px solid #e2e8f0;
      }
      
      .metric-card, .analysis-section {
        background: #f8fafc;
        border-color: #e2e8f0;
      }
      
      .metric-value, .analysis-title, .logo-text h1 {
        color: #1e293b;
      }
      
      .metric-label, .logo-text p, .timestamp {
        color: #64748b;
      }
      
      .analysis-content {
        color: #334155;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">BS</div>
        <div class="logo-text">
          <h1>Black Swan Intelligence</h1>
          <p>Market Risk Assessment Report</p>
        </div>
      </div>
      <div class="timestamp">
        <div>Generated: ${timestamp.toLocaleString()}</div>
        <div class="risk-badge" style="background: ${riskColor}22; color: ${riskColor}; border: 1px solid ${riskColor};">
          Risk Level: ${riskLevel}
        </div>
      </div>
    </div>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Bitcoin Price</div>
        <div class="metric-value">$${context.btcPrice.toLocaleString()}</div>
        <div class="metric-change ${context.btcChange >= 0 ? 'positive' : 'negative'}">
          ${context.btcChange >= 0 ? '+' : ''}${context.btcChange.toFixed(2)}% (24h)
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Fear & Greed Index</div>
        <div class="metric-value ${fearGreed < 25 ? 'negative' : fearGreed > 75 ? 'positive' : 'neutral'}">${fearGreed}/100</div>
        <div class="metric-change neutral">${context.fearGreedLabel}</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Yield Curve (10Y-2Y)</div>
        <div class="metric-value ${yieldValue < 0 ? 'negative' : 'positive'}">${yieldDisplay}</div>
        <div class="metric-change ${yieldValue < 0 ? 'negative' : 'positive'}">
          ${yieldValue < 0 ? 'Inverted - Recession Signal' : 'Normal - Growth Expected'}
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">Survival Probability</div>
        <div class="metric-value ${survivalProb < 60 ? 'negative' : survivalProb > 80 ? 'positive' : 'neutral'}">${survivalProb}%</div>
        <div class="metric-change neutral">${liquidityState}</div>
      </div>
      
      <div class="metric-card">
        <div class="metric-label">BTC Dominance</div>
        <div class="metric-value">${context.btcDominance.toFixed(1)}%</div>
        <div class="metric-change neutral">
          ${context.btcDominance > 55 ? 'Risk-Off Mode' : context.btcDominance < 45 ? 'Altcoin Season' : 'Neutral Flow'}
        </div>
      </div>
    </div>
    
    <div class="analysis-section">
      <div class="analysis-title">
        <span>AI Risk Analysis</span>
      </div>
      <div class="analysis-content">${analysis}</div>
    </div>
    
    <div class="footer">
      <p>Black Swan Intelligence Terminal v1.0</p>
      <div class="disclaimer">
        DISCLAIMER: This report is generated by AI for informational purposes only and does not constitute financial advice. 
        Past performance does not guarantee future results. Always conduct your own research and consult with qualified 
        financial advisors before making investment decisions. The creators of this tool are not responsible for any 
        trading losses or decisions made based on this analysis.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
};

// Export as PDF by opening print dialog
export const exportToPDF = async (data: ReportData): Promise<boolean> => {
  try {
    const html = generateReportHTML(data);
    
    // Open new window with report
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for PDF export.');
    }
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    
    // Log the export event
    await logSystemEvent('info', 'PDFExport', 'Report exported successfully', {
      timestamp: data.timestamp.toISOString(),
      btcPrice: data.context.btcPrice,
    });
    
    return true;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('PDF export failed:', errMsg);
    
    await logSystemEvent('error', 'PDFExport', 'Export failed', { error: errMsg });
    
    return false;
  }
};

// Quick export function that generates report from current data
export const quickExport = async (context: MarketContext, analysis: string): Promise<boolean> => {
  return exportToPDF({
    context,
    analysis,
    timestamp: new Date(),
  });
};

export default exportToPDF;
