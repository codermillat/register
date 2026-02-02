#!/bin/bash
# Browser Tab Monitor - Alert if too many tabs open
# Runs via heartbeat check

set -euo pipefail

BROWSER_PORT=18800
MAX_TABS=5

# Check if browser is running
if ! curl -s "http://127.0.0.1:${BROWSER_PORT}/json" > /dev/null 2>&1; then
    exit 0
fi

# Count page tabs
TAB_COUNT=$(curl -s "http://127.0.0.1:${BROWSER_PORT}/json" | jq -r '[.[] | select(.type=="page")] | length')

if [ "$TAB_COUNT" -gt "$MAX_TABS" ]; then
    echo "⚠️ Browser has $TAB_COUNT tabs open (limit: $MAX_TABS)"
    echo "Auto-closing tabs..."
    bash ~/.openclaw/workspace/scripts/browser-cleanup.sh
fi
