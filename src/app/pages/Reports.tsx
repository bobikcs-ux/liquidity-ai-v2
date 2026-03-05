import React from 'react';
import { FileText, Download, Share2, AlertCircle } from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';

export function Reports() {
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  const reports = [
    {
      id: 1,
      title: 'Q1 2026 Liquidity Intelligence Report',
      date: '2026-03-01',
      riskLevel: 'Low',
      description: 'Comprehensive analysis of global liquidity conditions and regime transitions',
      pages: 47,
    },
    {
      id: 2,
      title: 'Volatility Expansion Alert - February 2026',
      date: '2026-02-15',
      riskLevel: 'Medium',
      description: 'Early warning signals for potential volatility spike in equity markets',
      pages: 23,
    },
    {
      id: 3,
      title: 'Correlation Breakdown Analysis',
      date: '2026-02-01',
      riskLevel: 'High',
      description: 'Cross-asset correlation stress indicators and portfolio implications',
      pages: 31,
    },
    {
      id: 4,
      title: 'Central Bank Liquidity Flow Report',
      date: '2026-01-15',
      riskLevel: 'Low',
      description: 'Monthly tracking of global central bank balance sheets and QE operations',
      pages: 38,
    },
    {
      id: 5,
      title: 'Crash Similarity Engine - January 2026',
      date: '2026-01-10',
      riskLevel: 'Low',
      description: 'Historical pattern matching and tail risk assessment',
      pages: 29,
    },
  ];

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
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${
          isDark || isHybrid ? 'text-white' : 'text-gray-900'
        }`}>
          Reports
        </h1>
        <p className={isDark || isHybrid ? 'text-gray-200' : 'text-gray-600'}>
          Evidence-based PDF intelligence
        </p>
      </div>

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
                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
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
                <button 
                  aria-label={`Share ${report.title}`}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <Share2 className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
                </button>
                <button 
                  aria-label={`Download ${report.title}`}
                  className="flex items-center gap-2 px-4 py-3 bg-[#2563EB] text-white rounded-xl hover:bg-[#1d4ed8] transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">Download</span>
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
            <h3 className="font-semibold text-gray-900 mb-2">Report Generation</h3>
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
        <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50" disabled>
          Previous
        </button>
        <div className="flex items-center gap-2">
          <button aria-label="Go to page 1" aria-current="page" className="w-10 h-10 rounded-xl bg-[#2563EB] text-white font-medium">1</button>
          <button aria-label="Go to page 2" className="w-10 h-10 rounded-xl hover:bg-gray-100 text-gray-700 font-medium">2</button>
          <button aria-label="Go to page 3" className="w-10 h-10 rounded-xl hover:bg-gray-100 text-gray-700 font-medium">3</button>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-[#2563EB] hover:text-[#1d4ed8]">
          Next
        </button>
      </div>
    </div>
  );
}
