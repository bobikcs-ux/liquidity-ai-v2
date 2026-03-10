/**
 * NEWS AGGREGATOR SERVICE
 * 
 * Fetches geopolitical news and conflict data from:
 * - NewsAPI (general financial + geopolitical news)
 * - WorldNewsAPI (global news with regional filtering)
 * - ACLED (Armed Conflict Location & Event Data)
 * 
 * Aggregates into a normalized GeopoliticsMetrics shape for AppContext.
 */

import { gatewayFetch } from '../lib/apiGateway';
import type { GeopoliticsAlert, GeopoliticsMetrics } from '../types/terminal';
import { TERMINAL_STATE_DEFAULTS } from '../types/terminal';

// ============================================================================
// TYPES
// ============================================================================

interface NewsAPIArticle {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: { name: string };
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
}

interface WorldNewsAPIArticle {
  id: number;
  title: string;
  text: string;
  url: string;
  publish_date: string;
  source_country: string;
}

interface WorldNewsAPIResponse {
  news: WorldNewsAPIArticle[];
  available: number;
}

interface ACLEDEvent {
  event_id_cnty: string;
  event_date: string;
  event_type: string;
  country: string;
  admin1: string;
  location: string;
  fatalities: number;
  notes: string;
}

interface ACLEDResponse {
  data: ACLEDEvent[];
  count: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function getNewsApiKey(): string {
  const key = import.meta.env.VITE_NEWS_API_KEY;
  return key && key.trim() ? key.trim() : '';
}

function getWorldNewsApiKey(): string {
  const key = import.meta.env.VITE_WORLD_NEWS_API_KEY;
  return key && key.trim() ? key.trim() : '';
}

function getAcledCredentials(): { email: string; key: string } | null {
  const email = import.meta.env.VITE_ACLED_EMAIL;
  const key = import.meta.env.VITE_ACLED_API_KEY;
  if (email?.trim() && key?.trim()) return { email: email.trim(), key: key.trim() };
  return null;
}

/**
 * Score a news article headline for geopolitical severity.
 * Returns 'low' | 'medium' | 'high' | 'critical'.
 */
function scoreHeadline(title: string): GeopoliticsAlert['severity'] {
  const lower = title.toLowerCase();
  const critical = ['war', 'invasion', 'nuclear', 'attack', 'terrorist', 'default', 'collapse'];
  const high = ['conflict', 'sanctions', 'crisis', 'recession', 'protest', 'coup', 'explosion'];
  const medium = ['tension', 'threat', 'election', 'trade war', 'tariff', 'inflation'];

  if (critical.some((w) => lower.includes(w))) return 'critical';
  if (high.some((w) => lower.includes(w))) return 'high';
  if (medium.some((w) => lower.includes(w))) return 'medium';
  return 'low';
}

const SEEDS = TERMINAL_STATE_DEFAULTS.geopolitics;

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

/**
 * Fetch geopolitical news from NewsAPI.
 */
async function fetchNewsAPIAlerts(): Promise<GeopoliticsAlert[]> {
  const key = getNewsApiKey();
  if (!key) return [];

  const query = encodeURIComponent('geopolitical OR conflict OR sanctions OR war OR crisis');
  const resp = await gatewayFetch<NewsAPIResponse>(
    `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${key}`,
    { apiName: 'news', cacheKey: 'newsapi-geo', cacheTtlMs: 60_000 },
  );

  if (!resp.data?.articles?.length) return [];

  return resp.data.articles.slice(0, 8).map((article, i) => ({
    id: `newsapi-${i}-${Date.now()}`,
    headline: article.title,
    region: article.source.name,
    severity: scoreHeadline(article.title),
    source: 'NewsAPI',
    publishedAt: article.publishedAt,
  }));
}

/**
 * Fetch global news from WorldNewsAPI with geopolitical focus.
 */
async function fetchWorldNewsAlerts(): Promise<GeopoliticsAlert[]> {
  const key = getWorldNewsApiKey();
  if (!key) return [];

  const resp = await gatewayFetch<WorldNewsAPIResponse>(
    `https://api.worldnewsapi.com/search-news?text=geopolitical+conflict+sanctions&language=en&number=10&api-key=${key}`,
    { apiName: 'worldNews', cacheKey: 'worldnews-geo', cacheTtlMs: 60_000 },
  );

  if (!resp.data?.news?.length) return [];

  return resp.data.news.slice(0, 8).map((article, i) => ({
    id: `worldnews-${i}-${Date.now()}`,
    headline: article.title,
    region: article.source_country || 'Global',
    severity: scoreHeadline(article.title),
    source: 'WorldNewsAPI',
    publishedAt: article.publish_date,
  }));
}

/**
 * Fetch recent ACLED conflict events (last 7 days).
 */
async function fetchACLEDEvents(): Promise<GeopoliticsAlert[]> {
  const creds = getAcledCredentials();
  if (!creds) return [];

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]; // YYYY-MM-DD

  const params = new URLSearchParams({
    key: creds.key,
    email: creds.email,
    event_date: sevenDaysAgo,
    event_date_where: 'BETWEEN',
    event_date_end: new Date().toISOString().split('T')[0],
    limit: '20',
    fields: 'event_id_cnty|event_date|event_type|country|admin1|location|fatalities|notes',
  });

  const resp = await gatewayFetch<ACLEDResponse>(
    `https://api.acleddata.com/acled/read?${params.toString()}`,
    { apiName: 'acled', cacheKey: 'acled-events', cacheTtlMs: 60_000 },
  );

  if (!resp.data?.data?.length) return [];

  return resp.data.data.slice(0, 10).map((event) => ({
    id: event.event_id_cnty,
    headline: `${event.event_type}: ${event.location}, ${event.country}${event.fatalities > 0 ? ` (${event.fatalities} fatalities)` : ''}`,
    region: `${event.country} — ${event.admin1}`,
    severity: event.fatalities > 10 ? 'critical' : event.fatalities > 0 ? 'high' : 'medium',
    source: 'ACLED',
    publishedAt: event.event_date,
  }));
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Aggregate all geopolitical data sources into a single GeopoliticsMetrics object.
 * Gracefully falls back to seed data for any failed source.
 */
export async function fetchGeopoliticsMetrics(): Promise<GeopoliticsMetrics> {
  const [newsAlerts, worldAlerts, acledAlerts] = await Promise.allSettled([
    fetchNewsAPIAlerts(),
    fetchWorldNewsAlerts(),
    fetchACLEDEvents(),
  ]);

  const allAlerts: GeopoliticsAlert[] = [
    ...(newsAlerts.status === 'fulfilled' ? newsAlerts.value : []),
    ...(worldAlerts.status === 'fulfilled' ? worldAlerts.value : []),
    ...(acledAlerts.status === 'fulfilled' ? acledAlerts.value : []),
  ];

  // Deduplicate by similar headlines (very basic fuzzy check)
  const seen = new Set<string>();
  const deduped = allAlerts.filter((a) => {
    const key = a.headline.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: critical first, then by publishedAt
  deduped.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sDiff !== 0) return sDiff;
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  const acledCount = acledAlerts.status === 'fulfilled' ? acledAlerts.value.length : 0;

  // Military conflict index: derived from alert severity distribution
  const criticalCount = deduped.filter((a) => a.severity === 'critical').length;
  const highCount = deduped.filter((a) => a.severity === 'high').length;
  const conflictIndex = Math.min(100, criticalCount * 15 + highCount * 5 + acledCount * 2);

  // News volume index: derived from total alert count
  const newsVolumeIndex = Math.min(100, deduped.length * 5);

  return {
    militaryConflictIndex: deduped.length > 0 ? Math.max(conflictIndex, SEEDS.militaryConflictIndex) : SEEDS.militaryConflictIndex,
    newsVolumeIndex: deduped.length > 0 ? newsVolumeIndex : SEEDS.newsVolumeIndex,
    acledEventCount: acledCount,
    alerts: deduped.slice(0, 15), // cap at 15 alerts
  };
}
