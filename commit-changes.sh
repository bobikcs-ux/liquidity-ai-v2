#!/bin/bash

# Git commit script for API integration changes
cd /vercel/share/v0-project

# Stage all changes
git add -A

# Commit with detailed message
git commit -m "feat: API Integration for Aurelius Intelligence OS

- Add centralized AppContext managing 12+ API integrations (CoinGecko, Finnhub, Alchemy, FRED, EIA, News, ACLED)
- Implement rate limiting manager (FRED: 30s, CoinGecko: 5s, Finnhub: 2s, News/ACLED: 60s)
- Add API gateway with fallback chain: LIVE API -> In-memory cache (5min TTL) -> Supabase -> Seed defaults
- Create service adapters: coingeckoService, finnhubService, alchemyService, newsAggregator
- Add useAureliusAnalysis hook for Gemini AI with Supabase Edge Function routing
- Refactor legacy hooks (useMarketSnapshot, useBlackSwanRisk) to delegate to AppContext
- Update Intelligence.tsx to consume AppContext instead of direct Supabase queries
- Add 14 VITE_ environment variables to vite-env.d.ts
- Maintain full backward compatibility with existing components

Closes: API integration refactor ticket

BREAKING CHANGE: None - fully backward compatible"

# Show commit info
echo "✅ Commit created on branch: $(git rev-parse --abbrev-ref HEAD)"
echo "📝 Commit message saved"

# Display files changed
echo ""
echo "📊 Changes summary:"
git diff --cached --stat HEAD
