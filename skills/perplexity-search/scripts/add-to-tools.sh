#!/bin/bash
# Add Perplexity Search to TOOLS.md

TOOLS_FILE="/home/openclaw/.openclaw/workspace/TOOLS.md"

# Check if already added
if grep -q "### 🔍 Perplexity Search" "$TOOLS_FILE"; then
    echo "Perplexity Search already documented in TOOLS.md"
    exit 0
fi

# Add to TOOLS.md
cat >> "$TOOLS_FILE" <<'EOF'

### 🔍 Perplexity Search
```bash
# Setup (one-time)
cd ~/.openclaw/workspace/skills/perplexity-search
./scripts/setup.sh

# API key: https://www.perplexity.ai/settings/api
# Free tier: $5 credit (~2500 queries)

# Usage
./scripts/perplexity.sh search "query"           # Quick search
./scripts/perplexity.sh research "query"         # With citations
./scripts/perplexity.sh fact "claim"             # Fact-check
./scripts/perplexity.sh compare "A vs B"         # Compare
./scripts/perplexity.sh usage                    # Check usage

# My preferred model: sonar (fast, cheap)
# Use sonar-pro for research with citations
```

**When to use:**
- Current events and news
- Real-time information lookup
- Fact-checking with sources
- Research requiring citations
- Better than web_search for synthesis and reasoning

**Integration:**
- Perplexity → Deep Research (intel gathering)
- Perplexity + Memory Manager (save findings)
- Perplexity + YouTube Transcript (multi-source research)

EOF

echo "✅ Added Perplexity Search to TOOLS.md"
