import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function - News API Proxy
 * Route: /api/news/geopolitical
 */

const SEED_NEWS = [
  { title: 'Global Markets React to Central Bank Decisions', source: 'Reuters', publishedAt: new Date().toISOString() },
  { title: 'Energy Prices Stable Amid Supply Concerns', source: 'Bloomberg', publishedAt: new Date().toISOString() },
  { title: 'Trade Negotiations Continue Between Major Economies', source: 'FT', publishedAt: new Date().toISOString() },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const newsApiKey = process.env.NEWS_API_KEY || process.env.VITE_NEWS_API_KEY || '';
  const worldNewsKey = process.env.WORLD_NEWS_API_KEY || process.env.VITE_WORLD_NEWS_API_KEY || '';

  // Try WorldNewsAPI first (better for server-side)
  if (worldNewsKey) {
    try {
      const url = `https://api.worldnewsapi.com/search-news?text=geopolitical+conflict+sanctions&language=en&number=10&api-key=${worldNewsKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      
      if (response.ok) {
        const data = await response.json();
        const articles = (data.news || []).map((n: any) => ({
          title: n.title,
          source: n.source?.name || 'WorldNews',
          publishedAt: n.publish_date,
          url: n.url,
        }));
        return res.status(200).json({ status: 'LIVE', source: 'WorldNewsAPI', articles });
      }
    } catch (e) {
      console.error('[News Proxy] WorldNewsAPI error:', e);
    }
  }

  // Fallback to NewsAPI (blocked from browser but works server-side)
  if (newsApiKey) {
    try {
      const url = `https://newsapi.org/v2/everything?q=geopolitical+OR+conflict&sortBy=publishedAt&pageSize=10&language=en&apiKey=${newsApiKey}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      
      if (response.ok) {
        const data = await response.json();
        const articles = (data.articles || []).map((a: any) => ({
          title: a.title,
          source: a.source?.name || 'NewsAPI',
          publishedAt: a.publishedAt,
          url: a.url,
        }));
        return res.status(200).json({ status: 'LIVE', source: 'NewsAPI', articles });
      }
    } catch (e) {
      console.error('[News Proxy] NewsAPI error:', e);
    }
  }

  // Fallback
  return res.status(200).json({
    status: 'FALLBACK',
    source: 'SEED',
    articles: SEED_NEWS,
  });
}
