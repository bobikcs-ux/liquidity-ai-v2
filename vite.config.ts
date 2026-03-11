import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  
  // CRITICAL: Force Vite to bake Vercel env vars into the build
  define: {
    'process.env': {},
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_FRED_API_KEY': JSON.stringify(process.env.VITE_FRED_API_KEY || ''),
    'import.meta.env.VITE_FMP_API_KEY': JSON.stringify(process.env.VITE_FMP_API_KEY || ''),
    'import.meta.env.VITE_EIA_API_KEY': JSON.stringify(process.env.VITE_EIA_API_KEY || ''),
    'import.meta.env.VITE_COINGECKO_API_KEY': JSON.stringify(process.env.VITE_COINGECKO_API_KEY || ''),
    'import.meta.env.VITE_FINNHUB_API_KEY': JSON.stringify(process.env.VITE_FINNHUB_API_KEY || ''),
    'import.meta.env.VITE_ALCHEMY_API_KEY': JSON.stringify(process.env.VITE_ALCHEMY_API_KEY || ''),
    'import.meta.env.VITE_NEWS_API_KEY': JSON.stringify(process.env.VITE_NEWS_API_KEY || ''),
    'import.meta.env.VITE_WORLD_NEWS_API_KEY': JSON.stringify(process.env.VITE_WORLD_NEWS_API_KEY || ''),
    'import.meta.env.VITE_ACLED_EMAIL': JSON.stringify(process.env.VITE_ACLED_EMAIL || ''),
    'import.meta.env.VITE_ACLED_API_KEY': JSON.stringify(process.env.VITE_ACLED_API_KEY || ''),
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router'],
          'ui-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'charts': ['recharts'],
          'mui': ['@mui/material', '@mui/icons-material'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  server: {
    port: 3000,
    open: false,
    host: true,
  },

  preview: {
    port: 4173,
    host: true,
  },
})
