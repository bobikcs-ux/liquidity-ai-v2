import { VercelRequest, VercelResponse } from '@vercel/node';

const NEWS_API_KEY = process.env.VITE_NEWS_API_KEY || '';
const WORLD_NEWS_API_KEY = process.env.VITE_WORLD_NEWS_API_KEY || '';

interface NewsAlert {
  title: string;
  source: string;
  date: string;
  severity: number; // 1-100
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  const alerts: NewsAlert[] = [];
  const sources: string[] = [];

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
      }
    } catch (err) {
      console.log('[News] NewsAPI error:', err instanceof Error ? err.message : String(err));
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
      }
    } catch (err) {
      console.log('[News] WorldNewsAPI error:', err instanceof Error ? err.message : String(err));
    }
  }

  return res.status(200).json({
    status: sources.length > 0 ? 'LIVE' : 'FALLBACK',
    alerts: alerts.slice(0, 10),
    sources,
    reason: sources.length === 0 ? 'No API keys available' : undefined,
  });
}
