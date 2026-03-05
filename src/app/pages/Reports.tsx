import React, { useState } from 'react';
import { FileText, Download, AlertCircle, ExternalLink, Link2, Loader2 } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import { useUserRole } from '../context/UserRoleContext';
import { useMarketSnapshot, GLOBAL_FEAR_GREED_VALUE, GLOBAL_FEAR_GREED_LABEL } from '../hooks/useMarketSnapshot';
import { quickExport } from '../utils/exportPDF';

// Revolut payment link (external) - not used directly here, handled by ProModal
const REVOLUT_PAYMENT_URL = 'https://revolut.me/studiobobikcs/149usd';

// Consistent AI processing delay (2 seconds)
const AI_PROCESSING_DELAY = 2000;

export function Reports() {
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  const { isPro, openProModal, setShowEmailModal, incrementReportDownload, freeReportsDownloaded } = useUserRole();
  const { latest: snapshot } = useMarketSnapshot();
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  
  type ReportType = 'daily' | 'volatility' | 'liquidity' | 'crash';

  const allReports = [
    {
      id: 1,
      title: 'Daily Market Snapshot - March 5, 2026',
      date: '2026-03-05',
      riskLevel: 'Low',
      description: 'Daily risk assessment and market intelligence summary',
      pages: 12,
      type: 'daily' as ReportType,
    },
    {
      id: 2,
      title: 'Volatility Expansion Alert - March 2026',
      date: '2026-03-03',
      riskLevel: 'Medium',
      description: 'Early warning signals for potential volatility spike in equity markets',
      pages: 23,
      type: 'volatility' as ReportType,
    },
    {
      id: 3,
      title: 'Central Bank Liquidity Flow Report',
      date: '2026-03-01',
      riskLevel: 'Low',
      description: 'Monthly tracking of global central bank balance sheets and QE operations',
      pages: 38,
      type: 'liquidity' as ReportType,
    },
    {
      id: 4,
      title: 'Crash Similarity Engine - March 2026',
      date: '2026-02-28',
      riskLevel: 'High',
      description: 'Historical pattern matching and tail risk assessment',
      pages: 29,
      type: 'crash' as ReportType,
    },
    {
      id: 5,
      title: 'Daily Market Snapshot - March 4, 2026',
      date: '2026-03-04',
      riskLevel: 'Low',
      description: 'Daily risk assessment and market intelligence summary',
      pages: 11,
      type: 'daily' as ReportType,
    },
    // Page 2 reports
    {
      id: 6,
      title: 'Volatility Alert - February 2026',
      date: '2026-02-15',
      riskLevel: 'Medium',
      description: 'Mid-month volatility analysis and regime signals',
      pages: 19,
      type: 'volatility' as ReportType,
    },
    {
      id: 7,
      title: 'Liquidity Conditions Report - February',
      date: '2026-02-10',
      riskLevel: 'Low',
      description: 'Comprehensive liquidity analysis across markets',
      pages: 34,
      type: 'liquidity' as ReportType,
    },
    {
      id: 8,
      title: 'Daily Market Snapshot - February 28',
      date: '2026-02-28',
      riskLevel: 'Low',
      description: 'End of month market intelligence summary',
      pages: 13,
      type: 'daily' as ReportType,
    },
    {
      id: 9,
      title: 'Crash Engine - February 2026',
      date: '2026-02-20',
      riskLevel: 'Medium',
      description: 'Pattern analysis and historical crash similarities',
      pages: 27,
      type: 'crash' as ReportType,
    },
    {
      id: 10,
      title: 'Daily Market Snapshot - February 27',
      date: '2026-02-27',
      riskLevel: 'Low',
      description: 'Daily risk metrics and market overview',
      pages: 12,
      type: 'daily' as ReportType,
    },
    // Page 3 reports
    {
      id: 11,
      title: 'Q4 2025 Liquidity Intelligence Report',
      date: '2026-01-15',
      riskLevel: 'Low',
      description: 'Quarterly comprehensive analysis of global liquidity',
      pages: 52,
      type: 'liquidity' as ReportType,
    },
    {
      id: 12,
      title: 'Crash Similarity Engine - January 2026',
      date: '2026-01-10',
      riskLevel: 'Low',
      description: 'Historical pattern matching and tail risk assessment',
      pages: 29,
      type: 'crash' as ReportType,
    },
    {
      id: 13,
      title: 'Volatility Alert - January 2026',
      date: '2026-01-05',
      riskLevel: 'High',
      description: 'Year-start volatility expansion warning',
      pages: 21,
      type: 'volatility' as ReportType,
    },
  ];

  const reportsPerPage = 5;
  const totalPages = Math.ceil(allReports.length / reportsPerPage);
  const reports = allReports.slice((currentPage - 1) * reportsPerPage, currentPage * reportsPerPage);

  const isReportLocked = (type: ReportType) => {
    if (isPro) return false;
    return type !== 'daily';
  };

  const handleReportAction = async (report: typeof allReports[0], action: 'download' | 'external') => {
    // Check if report type is locked (PRO-only)
    if (isReportLocked(report.type)) {
      openProModal(`${report.type.charAt(0).toUpperCase() + report.type.slice(1)} Reports`);
      return;
    }
    
    // For daily reports (free tier), check download limit
    if (report.type === 'daily' && !isPro) {
      // Check if user has exceeded free report limit
      if (!incrementReportDownload()) {
        // ProModal will be shown by incrementReportDownload
        return;
      }
    }
    
    // Proceed with download/open
    if (action === 'download') {
      await handleDownload(report.id);
    } else {
      await handleOpenExternal(report.id);
    }
    
    // Show email collection modal AFTER download for free users (lead capture)
    if (report.type === 'daily' && !isPro) {
      setShowEmailModal(true);
    }
  };

  const handleDownload = async (reportId: number) => {
    setDownloadingId(reportId);
    
    // Consistent AI processing delay (2 seconds) for perceived value
    await new Promise(resolve => setTimeout(resolve, AI_PROCESSING_DELAY));
    
    // Generate and export PDF - use GLOBAL Fear & Greed for consistency
    const marketContext = {
      yieldCurve: snapshot?.yield_spread?.toFixed(2) || '-0.42',
      fearGreedValue: String(GLOBAL_FEAR_GREED_VALUE), // 22 = Extreme Fear
      fearGreedLabel: GLOBAL_FEAR_GREED_LABEL,
      btcPrice: snapshot?.btc_price || 67500,
      btcChange: 2.3,
      btcDominance: snapshot?.btc_dominance || 58.2,
      survivalProbability: snapshot?.survival_probability,
      systemicRisk: snapshot?.systemic_risk,
      regime: snapshot?.regime,
      balanceSheetDelta: snapshot?.balance_sheet_delta,
    };
    
    await quickExport(marketContext, `Generated intelligence report for ${new Date().toLocaleDateString()}.`);
    setDownloadingId(null);
  };

  const handleOpenExternal = async (reportId: number) => {
    setDownloadingId(reportId);
    // Consistent AI processing delay (2 seconds) for perceived value
    await new Promise(resolve => setTimeout(resolve, AI_PROCESSING_DELAY));
    
    const marketContext = {
      yieldCurve: snapshot?.yield_spread?.toFixed(2) || '-0.42',
      fearGreedValue: String(GLOBAL_FEAR_GREED_VALUE), // 22 = Extreme Fear
      fearGreedLabel: GLOBAL_FEAR_GREED_LABEL,
      btcPrice: snapshot?.btc_price || 67500,
      btcChange: 2.3,
      btcDominance: snapshot?.btc_dominance || 58.2,
      survivalProbability: snapshot?.survival_probability,
      systemicRisk: snapshot?.systemicRisk,
      regime: snapshot?.regime,
      balanceSheetDelta: snapshot?.balance_sheet_delta,
    };
    
    await quickExport(marketContext, `Intelligence report opened in new tab.`);
    setDownloadingId(null);
  };

  const handleCopyLink = (reportId: number) => {
    const url = `${window.location.origin}/reports/${reportId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(reportId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${
          isDark || isHybrid ? 'text-white' : 'text-gray-900'
        }`}>
          Reports
        </h1>
        <p className={isDark || isHybrid ? 'text-gray-300' : 'text-gray-600'}>
          Evidence-based PDF intelligence
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Reports</div>
          <div className="text-2xl font-bold text-gray-900">127</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">This Month</div>
          <div className="text-2xl font-bold text-[#2563EB]">8</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">High Risk Alerts</div>
          <div className="text-2xl font-bold text-red-600">3</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Downloads</div>
          <div className="text-2xl font-bold text-gray-900">342</div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left Section - Report Info */}
              <div className="flex gap-4 flex-1">
                <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-[#2563EB]" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">{report.title}</h2>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${getRiskColor(report.riskLevel)}`}>
                      {report.riskLevel} Risk
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(report.date).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span>•</span>
                    <span>{report.pages} pages</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Copy Link */}
                <button 
                  onClick={() => handleCopyLink(report.id)}
                  aria-label={`Copy link to ${report.title}`}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group relative"
                >
                  <Link2 className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                  {copiedId === report.id && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
                
                {/* Open External */}
                <button 
                  onClick={() => handleReportAction(report, 'external')}
                  aria-label={`Open ${report.title} in new tab`}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  {downloadingId === report.id ? (
                    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                  ) : (
                    <ExternalLink className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                  )}
                </button>
                
                {/* Download */}
                <button 
                  onClick={() => handleReportAction(report, 'download')}
                  aria-label={`Download ${report.title}`}
                  disabled={downloadingId === report.id}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-colors font-medium ${
                    isReportLocked(report.type) 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white'
                  }`}
                >
                  {downloadingId === report.id ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="hidden sm:inline">AI Processing...</span>
                    </>
                  ) : isReportLocked(report.type) ? (
                    <>
                      <span className="hidden sm:inline">PRO</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span className="hidden sm:inline">Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 mb-2">Report Generation</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Intelligence reports are automatically generated based on regime changes, stress signals, and critical market events. 
              All reports include detailed methodology, data sources, confidence intervals, and actionable insights. 
              PRO subscribers receive priority notifications and custom report requests.
            </p>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-6">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map(page => (
            <button 
              key={page}
              onClick={() => setCurrentPage(page)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
              className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                currentPage === page 
                  ? 'bg-[#2563EB] text-white' 
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
