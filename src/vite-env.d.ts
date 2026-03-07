/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_FRED_API_KEY: string;
  readonly VITE_FMP_API_KEY: string;
  readonly VITE_EIA_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
