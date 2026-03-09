/**
 * World Bank Documents API Response Types
 * Based on the official World Bank Documents API schema
 */

// Raw API response structure
export interface WorldBankApiResponse {
  rows: number;
  os: number;
  page: number;
  total: number;
  documents: Record<string, WorldBankDocument>;
}

// Raw document from API
export interface WorldBankDocument {
  id: string;
  count: string; // Country name (e.g., "Mexico", "Yemen, Republic of", "World")
  entityids: {
    entityid: string;
  };
  docdt: string; // ISO date string
  abstracts?: {
    'cdata!'?: string;
  };
  display_title: string;
  pdfurl: string;
  guid: string;
  url: string;
}

// Mapped/normalized document for UI display
export interface IntelligenceReport {
  id: string;
  title: string;           // Mapped from display_title
  description: string;     // Mapped from abstracts.cdata!
  country: string;         // Mapped from count
  date: Date;              // Parsed from docdt
  pdfUrl: string;          // Mapped from pdfurl
  sourceUrl: string;       // Mapped from url
  guid: string;
}

// Country filter option
export interface CountryOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Maps a raw World Bank document to our normalized IntelligenceReport format
 */
export function mapWorldBankDocument(doc: WorldBankDocument): IntelligenceReport {
  return {
    id: doc.id,
    title: doc.display_title,
    description: doc.abstracts?.['cdata!'] || 'No description available.',
    country: doc.count,
    date: new Date(doc.docdt),
    pdfUrl: doc.pdfurl,
    sourceUrl: doc.url,
    guid: doc.guid,
  };
}

/**
 * Maps the entire API response to an array of IntelligenceReports
 */
export function mapWorldBankResponse(response: WorldBankApiResponse): IntelligenceReport[] {
  const documents = response.documents;
  const reports: IntelligenceReport[] = [];
  
  for (const key in documents) {
    // Skip the 'facets' key which is not a document
    if (key === 'facets') continue;
    
    const doc = documents[key];
    if (doc && typeof doc === 'object' && 'display_title' in doc) {
      reports.push(mapWorldBankDocument(doc as WorldBankDocument));
    }
  }
  
  // Sort by date descending (newest first)
  return reports.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Extracts unique countries from reports with document counts
 */
export function extractCountryOptions(reports: IntelligenceReport[]): CountryOption[] {
  const countryMap = new Map<string, number>();
  
  reports.forEach(report => {
    const current = countryMap.get(report.country) || 0;
    countryMap.set(report.country, current + 1);
  });
  
  const options: CountryOption[] = Array.from(countryMap.entries())
    .map(([value, count]) => ({
      value,
      label: value,
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  
  // Add "All Countries" option at the beginning
  options.unshift({
    value: '',
    label: 'All Countries',
    count: reports.length,
  });
  
  return options;
}

/**
 * Filters reports by country
 */
export function filterReportsByCountry(
  reports: IntelligenceReport[], 
  country: string
): IntelligenceReport[] {
  if (!country) return reports;
  return reports.filter(report => report.country === country);
}
