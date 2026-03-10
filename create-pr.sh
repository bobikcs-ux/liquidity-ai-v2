#!/bin/bash

# Git Pull Request script
cd /vercel/share/v0-project

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📋 Current branch: $BRANCH"

# Check if branch is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Uncommitted changes detected. Run commit-changes.sh first."
  exit 1
fi

# Ensure we're on the feature branch
if [[ "$BRANCH" != "api-integration-for-aurelius" ]]; then
  echo "❌ Error: Expected to be on 'api-integration-for-aurelius' but on '$BRANCH'"
  exit 1
fi

echo "✅ All changes committed"
echo ""
echo "📝 Pull Request Details:"
echo "  From: $BRANCH"
echo "  To: main"
echo "  Repo: bobikcs-ux/liquidity-ai-v2"
echo ""
echo "Next steps:"
echo "1. GitHub: https://github.com/bobikcs-ux/liquidity-ai-v2/compare/main...$BRANCH"
echo "2. Click 'Create pull request'"
echo "3. Review and Merge"
echo "4. Vercel will auto-deploy to aurelius.bobikcs.com"
