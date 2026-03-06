'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Globe, 
  Calendar, 
  ChevronDown, 
  Search,
  ExternalLink,
  Loader2,
  Filter,
  X
} from 'lucide-react';
import { useAdaptiveTheme } from '../context/AdaptiveThemeContext';
import {
  WorldBankApiResponse,
  IntelligenceReport,
  CountryOption,
  mapWorldBankResponse,
  extractCountryOptions,
  filterReportsByCountry,
} from '../types/worldbank';

interface IntelligenceArchiveProps {
  data?: WorldBankApiResponse;
  className?: string;
}

// Sample data for development/demo (based on the provided JSON)
const SAMPLE_DATA: WorldBankApiResponse = {
  rows: 10,
  os: 0,
  page: 1,
  total: 591,
  documents: {
    "D11831032": {
      id: "11831032",
      count: "Mexico",
      entityids: { entityid: "000334955_20100222012800" },
      docdt: "2006-04-24T04:00:00Z",
      abstracts: {
        "cdata!": "The objective of the Wind Umbrella (La Venta II) Project aims to reduce greenhouse gases emissions from power generation in Mexico and promote investment in wind energy in Mexico to diversify the sources of power generation in the country."
      },
      display_title: "Mexico - Wind Umbrella (La Venta II) Project",
      pdfurl: "http://documents.worldbank.org/curated/en/995361468056343658/pdf/529200PAD0P0801for0disclosure0final.pdf",
      guid: "995361468056343658",
      url: "http://documents.worldbank.org/curated/en/995361468056343658"
    },
    "D19030958": {
      id: "19030958",
      count: "Yemen, Republic of",
      entityids: { entityid: "000442464_20140220094225" },
      docdt: "2014-02-11T05:00:00Z",
      abstracts: {
        "cdata!": "The development objective of the Mocha Wind Park Project for Yemen is to increase the supply of cost-effective renewable wind electricity. The project has two components."
      },
      display_title: "Yemen - Mocha Wind Park Project",
      pdfurl: "http://documents.worldbank.org/curated/en/156751468335513164/pdf/PAD6510P146055010Box382145B00OUO090.pdf",
      guid: "156751468335513164",
      url: "http://documents.worldbank.org/curated/en/156751468335513164"
    },
    "D19544300": {
      id: "19544300",
      count: "World",
      entityids: { entityid: "000333037_20140521124748" },
      docdt: "2014-05-21T04:00:00Z",
      abstracts: {
        "cdata!": "The kinetic energy in wind is converted into mechanical power in specialized propeller-driven turbines mounted on towers. A generator inside the turbine converts the mechanical power into electricity."
      },
      display_title: "Implementing onshore wind power projects",
      pdfurl: "https://documents.worldbank.org/curated/en/556561468337209595/pdf/IBArchive-966e3ae6-b9b7-48bc-a2d0-bcfe02875521.pdf",
      guid: "556561468337209595",
      url: "http://documents.worldbank.org/curated/en/556561468337209595"
    },
    "D29900830": {
      id: "29900830",
      count: "Zambia",
      entityids: { entityid: "090224b08608649a_3_0" },
      docdt: "2018-05-01T04:00:00Z",
      abstracts: {
        "cdata!": "The overall Zambia ESMAP program consists of providing a validated mesoscale wind atlas for Zambia, including associated deliverables and wind energy development training courses."
      },
      display_title: "Renewable energy wind mapping for Zambia : 12-month site resource report",
      pdfurl: "http://documents.worldbank.org/curated/en/528711526549758961/pdf/Renewable-energy-wind-mapping-for-Zambia-12-month-site-resource-report.pdf",
      guid: "528711526549758961",
      url: "http://documents.worldbank.org/curated/en/528711526549758961"
    },
    "D26951778": {
      id: "26951778",
      count: "World",
      entityids: { entityid: "090224b084710367_1_0" },
      docdt: "2015-08-07T04:00:00Z",
      abstracts: {
        "cdata!": "The environmental, health, and safety (EHS) guidelines are technical reference documents with general and industry-specific examples of good international industry practice (GIIP)."
      },
      display_title: "Environmental, health, and safety guidelines for wind energy",
      pdfurl: "http://documents.worldbank.org/curated/en/498831479463882556/pdf/110346-WP-FINAL-Aug-2015-Wind-Energy-EHS-Guideline-PUBLIC.pdf",
      guid: "498831479463882556",
      url: "http://documents.worldbank.org/curated/en/498831479463882556"
    },
    "D15950212": {
      id: "15950212",
      count: "Kenya",
      entityids: { entityid: "000003596_20120319143702" },
      docdt: "2012-03-14T04:00:00Z",
      display_title: "Kenya - Lake Turkana Wind Project",
      pdfurl: "http://documents.worldbank.org/curated/en/274181468046144157/pdf/Integrated0Saf00Sheet0Concept0Stage.pdf",
      guid: "274181468046144157",
      url: "http://documents.worldbank.org/curated/en/274181468046144157"
    },
    "D10875353": {
      id: "10875353",
      count: "Uruguay",
      entityids: { entityid: "000333038_20090727233747" },
      docdt: "2009-07-16T04:00:00Z",
      display_title: "Uruguay - Wind Farm Project",
      pdfurl: "http://documents.worldbank.org/curated/en/254201468131715945/pdf/495790ISDS0P101arm010ISDS0Appraisal.pdf",
      guid: "254201468131715945",
      url: "http://documents.worldbank.org/curated/en/254201468131715945"
    },
    "D26204368": {
      id: "26204368",
      count: "Jordan",
      entityids: { entityid: "090224b08427b05a_1_0" },
      docdt: "2016-03-29T04:00:00Z",
      abstracts: {
        "cdata!": "Ratings for the Promotion of a Wind Power Market Project for Jordan were as follows: outcomes were moderately satisfactory, the risk to global environment outcome was low or negligible."
      },
      display_title: "Jordan - Promotion of a Wind Power Market Project",
      pdfurl: "http://documents.worldbank.org/curated/en/152051485960685155/pdf/ICR3759-P093201-Box394878B-PUBLIC-disclosed-4-7-16.pdf",
      guid: "152051485960685155",
      url: "http://documents.worldbank.org/curated/en/152051485960685155"
    },
    facets: {} as any
  }
};

export function IntelligenceArchive({ data, className = '' }: IntelligenceArchiveProps) {
  const { uiTheme } = useAdaptiveTheme();
  const isDark = uiTheme === 'terminal';
  const isHybrid = uiTheme === 'hybrid';
  
  // Use provided data or sample data
  const apiData = data || SAMPLE_DATA;
  
  // State
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Map API response to normalized reports
  const allReports = useMemo(() => mapWorldBankResponse(apiData), [apiData]);
  
  // Extract country options
  const countryOptions = useMemo(() => extractCountryOptions(allReports), [allReports]);
  
  // Filter reports by country and search query
  const filteredReports = useMemo(() => {
    let reports = filterReportsByCountry(allReports, selectedCountry);
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      reports = reports.filter(report => 
        report.title.toLowerCase().includes(query) ||
        report.description.toLowerCase().includes(query) ||
        report.country.toLowerCase().includes(query)
      );
    }
    
    return reports;
  }, [allReports, selectedCountry, searchQuery]);
  
  // Handle PDF download
  const handleDownload = useCallback(async (report: IntelligenceReport) => {
    setDownloadingId(report.id);
    
    // Open PDF in new tab
    window.open(report.pdfUrl, '_blank', 'noopener,noreferrer');
    
    // Brief loading state for UX feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    setDownloadingId(null);
  }, []);
  
  // Get selected country label
  const selectedCountryLabel = countryOptions.find(c => c.value === selectedCountry)?.label || 'All Countries';
  
  // Card styles based on theme
  const cardStyle = `rounded-xl border p-4 md:p-5 transition-all overflow-hidden max-w-full ${
    isDark 
      ? 'bg-[#0b0f17] border-[#1f2937] hover:border-blue-800' 
      : isHybrid 
      ? 'bg-[#1e2536] border-gray-700 hover:border-blue-600' 
      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
  }`;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl md:text-2xl font-bold ${
            isDark || isHybrid ? 'text-white' : 'text-gray-900'
          }`}>
            Intelligence Archive
          </h2>
          <p className={`text-sm mt-1 ${
            isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
          }`}>
            World Bank Documents API - {apiData.total} total reports
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg ${
            isDark || isHybrid ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'
          }`}>
            <span className={`text-sm font-medium ${isDark || isHybrid ? 'text-blue-300' : 'text-blue-700'}`}>
              {filteredReports.length} results
            </span>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            isDark || isHybrid ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-colors ${
              isDark 
                ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-blue-600' 
                : isHybrid 
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 ${
                isDark || isHybrid ? 'hover:bg-gray-700' : ''
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {/* Country Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors min-w-[200px] justify-between ${
              isDark 
                ? 'bg-gray-900 border-gray-700 text-white hover:border-gray-600' 
                : isHybrid 
                ? 'bg-gray-800 border-gray-600 text-white hover:border-gray-500' 
                : 'bg-white border-gray-200 text-gray-900 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="truncate">{selectedCountryLabel}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-lg z-50 max-h-[300px] overflow-y-auto ${
              isDark 
                ? 'bg-gray-900 border-gray-700' 
                : isHybrid 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}>
              {countryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedCountry(option.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${
                    selectedCountry === option.value
                      ? isDark || isHybrid 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-50 text-blue-700'
                      : isDark || isHybrid 
                        ? 'text-gray-300 hover:bg-gray-800' 
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedCountry === option.value
                      ? 'bg-white/20 text-white'
                      : isDark || isHybrid 
                        ? 'bg-gray-700 text-gray-400' 
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {option.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Reports Grid */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className={`text-center py-12 rounded-xl border ${
            isDark 
              ? 'bg-gray-900/50 border-gray-800' 
              : isHybrid 
              ? 'bg-gray-800/50 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <FileText className={`w-12 h-12 mx-auto mb-4 ${
              isDark || isHybrid ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'}>
              No reports found for the selected filters.
            </p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className={cardStyle}>
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isDark 
                    ? 'bg-blue-900/30' 
                    : isHybrid 
                    ? 'bg-blue-800/30' 
                    : 'bg-blue-50'
                }`}>
                  <FileText className={`w-6 h-6 ${
                    isDark || isHybrid ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-2 break-words ${
                    isDark || isHybrid ? 'text-white' : 'text-gray-900'
                  }`}>
                    {report.title}
                  </h3>
                  
                  <p className={`text-sm mb-3 line-clamp-2 break-words ${
                    isDark || isHybrid ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {report.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Country */}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                      isDark 
                        ? 'bg-green-900/30 text-green-400 border border-green-800/50' 
                        : isHybrid 
                        ? 'bg-green-800/30 text-green-300 border border-green-700/50' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      <Globe className="w-3 h-3" />
                      {report.country}
                    </span>
                    
                    {/* Date */}
                    <span className={`inline-flex items-center gap-1.5 ${
                      isDark || isHybrid ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      <Calendar className="w-3 h-3" />
                      {report.date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* View Source */}
                  <a
                    href={report.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2.5 rounded-xl transition-colors ${
                      isDark 
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : isHybrid 
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                    }`}
                    title="View source"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  
                  {/* Download PDF */}
                  <button
                    onClick={() => handleDownload(report)}
                    disabled={downloadingId === report.id}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                      isDark || isHybrid
                        ? 'bg-blue-600 hover:bg-blue-500 text-white disabled:bg-blue-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300'
                    }`}
                  >
                    {downloadingId === report.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">PDF</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}

export default IntelligenceArchive;
