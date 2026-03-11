import { VercelRequest, VercelResponse } from '@vercel/node';

const NEWS_API_KEY = process.env.VITE_NEWS_API_KEY || process.env.NEWS_API_KEY || '';
const WORLD_NEWS_API_KEY = process.env.VITE_WORLD_NEWS_API_KEY || process.env.WORLD_NEWS_API_KEY || '';

interface NewsAlert {
  title: string;
  source: string;
  date: string;
  severity: number; // 1-100
}

// Static geopolitical headlines when all APIs fail (401/403/429)
const STATIC_GEOPOLITICAL_ALERTS: NewsAlert[] = [
  { title: 'Global energy markets remain volatile amid supply concerns', source: 'Static', date: new Date().toISOString(), severity: 60 },
  { title: 'Central banks worldwide monitor inflation pressures', source: 'Static', date: new Date().toISOString(), severity: 55 },
  { title: 'Commodity prices fluctuate on geopolitical uncertainty', source: 'Static', date: new Date().toISOString(), severity: 50 },
  { title: 'Trade tensions impact global supply chains', source: 'Static', date: new Date().toISOString(), severity: 45 },
  { title: 'Currency markets react to monetary policy divergence', source: 'Static', date: new Date().toISOString(), severity: 40 },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  const alerts: NewsAlert[] = [];
  const sources: string[] = [];
  let apiErrors: string[] = [];

  // Try NewsAPI
  if (NEWS_API_KEY) {
    try {
      const newsRes = await fetch(
        'https://newsapi.org/v2/everything?' +
          new URLSearchParams({
            q: 'geopolitical OR conflict OR sanctions OR war OR crisis',
            sortBy: 'publishedAt',
            pageSize: '10',
            language: 'en',
            apiKey: NEWS_API_KEY,
          }),
        { signal: AbortSignal.timeout(8000) },
      );

      if (newsRes.ok) {
        const data = await newsRes.json();
        if (data.articles?.length) {
          data.articles.slice(0, 5).forEach((article: any) => {
            alerts.push({
              title: article.title,
              source: article.source?.name || 'NewsAPI',
              date: article.publishedAt,
              severity: 50,
            });
          });
          sources.push('NewsAPI');
        }
      } else if (newsRes.status === 401 || newsRes.status === 403) {
        apiErrors.push(`NewsAPI: ${newsRes.status} unauthorized`);
      } else if (newsRes.status === 429) {
        apiErrors.push('NewsAPI: 429 rate limited');
      }
    } catch (err) {
      apiErrors.push(`NewsAPI: ${err instanceof Error ? err.message : 'timeout'}`);
    }
  }

  // Try WorldNewsAPI
  if (WORLD_NEWS_API_KEY) {
    try {
      const worldRes = await fetch(
        'https://api.worldnewsapi.com/search-news?' +
          new URLSearchParams({
            text: 'geopolitical conflict sanctions',
            language: 'en',
            number: '10',
            'api-key': WORLD_NEWS_API_KEY,
          }),
        { signal: AbortSignal.timeout(8000) },
      );

      if (worldRes.ok) {
        const data = await worldRes.json();
        if (data.news?.length) {
          data.news.slice(0, 5).forEach((article: any) => {
            alerts.push({
              title: article.title,
              source: article.source_country || 'WorldNews',
              date: article.publish_date,
              severity: 55,
            });
          });
          sources.push('WorldNews');
        }
      } else if (worldRes.status === 401 || worldRes.status === 403) {
        apiErrors.push(`WorldNewsAPI: ${worldRes.status} unauthorized`);
      } else if (worldRes.status === 429) {
        apiErrors.push('WorldNewsAPI: 429 rate limited');
      }
    } catch (err) {
      apiErrors.push(`WorldNewsAPI: ${err instanceof Error ? err.message : 'timeout'}`);
    }
  }

  // If no live alerts, use static fallback (never return empty)
  if (alerts.length === 0) {
    return res.status(200).json({
      status: 'FALLBACK',
      alerts: STATIC_GEOPOLITICAL_ALERTS,
      sources: ['Static'],
      reason: apiErrors.length > 0 ? apiErrors.join('; ') : 'No API keys configured',
    });
  }

  return res.status(200).json({
    status: 'LIVE',
    alerts: alerts.slice(0, 10),
    sources,
  });
}
