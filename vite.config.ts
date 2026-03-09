import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load env vars - this allows process.env to be used at build time
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    
    // Map NEXT_PUBLIC_ vars to VITE_ vars for frontend access
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || ''
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      ),
      'import.meta.env.VITE_FRED_API_KEY': JSON.stringify(
        env.VITE_FRED_API_KEY || env.NEXT_PUBLIC_FRED_API_KEY || ''
      ),
      'import.meta.env.VITE_COINGECKO_API_KEY': JSON.stringify(
        env.VITE_COINGECKO_API_KEY || env.NEXT_PUBLIC_COINGECKO_API_KEY || ''
      ),
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
  };
})
