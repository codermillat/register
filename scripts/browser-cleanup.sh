#!/bin/bash
# Browser Tab Cleanup - Close all tabs after browser operations
# Safe to run anytime, only affects browser tabs

set -euo pipefail

BROWSER_PORT=18800

# Check if browser is running
if ! curl -s "http://127.0.0.1:${BROWSER_PORT}/json" > /dev/null 2>&1; then
    echo "Browser not running, nothing to clean"
    exit 0
fi

# Get all page tabs (exclude workers, iframes, etc)
TAB_COUNT=$(curl -s "http://127.0.0.1:${BROWSER_PORT}/json" | jq -r '[.[] | select(.type=="page")] | length')

if [ "$TAB_COUNT" -eq 0 ]; then
    echo "No tabs open"
    exit 0
fi

echo "Closing $TAB_COUNT browser tabs..."

# Close all page tabs
curl -s "http://127.0.0.1:${BROWSER_PORT}/json" | \
  jq -r '.[] | select(.type=="page") | .id' | \
  while read -r id; do
    curl -s -X DELETE "http://127.0.0.1:${BROWSER_PORT}/json/close/$id" > /dev/null
  done

echo "✅ Closed $TAB_COUNT tabs"
