#!/bin/bash

# Script to fetch GitHub Codespaces domains from the GitHub Meta API
# Usage: ./fetch_codespaces_domains.sh
#
# In GitHub Actions, make sure to set GH_TOKEN:
#   env:
#     GH_TOKEN: ${{ github.token }}

set -e

echo "🔍 Fetching GitHub Codespaces domains..."
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is not installed."
    echo "Please install jq to parse JSON output."
    exit 1
fi

# Check if running in GitHub Actions without token
if [ -n "$GITHUB_ACTIONS" ] && [ -z "$GH_TOKEN" ]; then
    echo "⚠️  Warning: Running in GitHub Actions but GH_TOKEN is not set."
    echo "Please set the GH_TOKEN environment variable:"
    echo "  env:"
    echo "    GH_TOKEN: \${{ github.token }}"
    echo ""
fi

# Fetch codespaces domains
echo "Codespaces domains:"
gh api meta --jq .domains.codespaces

exit 0
