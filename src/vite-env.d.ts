/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Supabase (persistence layer + Edge Functions)
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  // Macro / Economic
  readonly VITE_FRED_API_KEY: string;

  // Energy
  readonly VITE_EIA_API_KEY: string;

  // Market / Prices
  readonly VITE_FMP_API_KEY: string;
  readonly VITE_COINGECKO_API_KEY: string;
  readonly VITE_FINNHUB_API_KEY: string;

  // On-chain
  readonly VITE_ALCHEMY_API_KEY: string;

  // News / Geopolitics
  readonly VITE_NEWS_API_KEY: string;
  readonly VITE_WORLD_NEWS_API_KEY: string;

  // ACLED conflict data
  readonly VITE_ACLED_EMAIL: string;
  readonly VITE_ACLED_API_KEY: string;

  // Sentiment
  readonly VITE_FEAR_GREED_API_URL: string;

  // AI (Gemini — never exposed directly, routed through Supabase Edge Function)
  readonly VITE_GOOGLE_GENERATIVE_AI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
