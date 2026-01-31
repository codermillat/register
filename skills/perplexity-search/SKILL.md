---
name: perplexity-search
description: Search the web and conduct research using Perplexity AI. Use for real-time information, current events, fact-checking, and citation-backed research. Complementary to web_search with better context and reasoning.
version: 1.0.0
category: research
tags: [search, research, web, citations, fact-checking]
---

# Perplexity Search

Web search and research powered by Perplexity AI's Sonar models.

## When to Use This Skill

✅ **Use Perplexity for:**
- Current events and breaking news
- Real-time information lookup
- Fact-checking and verification
- Research with citations needed
- Market/competitor research
- Technical documentation search
- Academic research queries
- Deep contextual understanding
- Multi-source synthesis

🔄 **vs. web_search (Brave):**
- Perplexity: Better reasoning, citations, synthesis
- Brave: Faster, raw search results, good for quick lookups

## Prerequisites

### Option 1: Config File (Recommended)
Create `~/.config/perplexity/credentials.json`:
```json
{
  "api_key": "pplx-...",
  "model": "sonar",
  "max_tokens": 1000,
  "temperature": 0.2
}
```

### Option 2: Environment Variable
```bash
export PERPLEXITY_API_KEY="pplx-..."
```

### Get API Key
Sign up at: https://www.perplexity.ai/settings/api

**Free tier:** $5 credit, ~2500 queries (sonar model)

## Usage Examples

### Basic Search
```bash
./scripts/perplexity.sh search "latest AI developments 2026"
```

### Research Mode (with citations)
```bash
./scripts/perplexity.sh research "EdTech trends in India" --citations
```

### Quick Fact Check
```bash
./scripts/perplexity.sh fact "GitHub Copilot pricing 2026"
```

### Compare Mode
```bash
./scripts/perplexity.sh compare "Claude vs GPT-4 for coding"
```

### JSON Output
```bash
./scripts/perplexity.sh search "AI news" --json
```

### From Node.js
```javascript
const PerplexitySearch = require('./scripts/perplexity-search.js');
const pplx = new PerplexitySearch();

const result = await pplx.search("What is OpenClaw?");
console.log(result.answer);
console.log(result.citations);
```

## Models Available

| Model | Speed | Citations | Cost | Best For |
|-------|-------|-----------|------|----------|
| **sonar** | Fast | Basic | $0.002/1K | Quick searches |
| **sonar-pro** | Medium | Enhanced | $0.01/1K | Deep research |
| **sonar-reasoning** | Slow | Detailed | $0.02/1K | Complex analysis |

Default: `sonar` (best balance)

## API Endpoints

- **Base URL:** `https://api.perplexity.ai`
- **Endpoint:** `POST /chat/completions`
- **Format:** OpenAI-compatible
- **Auth:** Bearer token

## Cost Tracking

The skill automatically tracks usage in `~/.config/perplexity/usage.json`:
```bash
./scripts/perplexity.sh usage
```

Alerts at 80% of $5 credit (~$4.00).

## Integration Examples

### With Deep Research
```bash
# Use Perplexity for initial intel, then Deep Research for analysis
./scripts/perplexity.sh research "EdTech market India" > research.txt
cd ../deep-research
./scripts/research.sh "Analyze EdTech market" --context research.txt
```

### With Memory Manager
```bash
# Save important research
result=$(./scripts/perplexity.sh search "AI safety guidelines")
echo "$result" | ../memory-manager/scripts/save.sh --tag ai-safety
```

### With YouTube Transcript
```bash
# Research topic, then find videos
./scripts/perplexity.sh search "best Python tutorials 2026"
# Then use YouTube skill to get transcripts
```

## CLI Reference

```bash
# Search commands
perplexity.sh search <query>           # Basic search
perplexity.sh research <query>         # With citations
perplexity.sh fact <query>             # Fact-check mode
perplexity.sh compare <query>          # A vs B analysis

# Output options
--json                                 # JSON output
--citations                            # Include citations
--model <model>                        # Override model
--max-tokens <n>                       # Token limit

# Utility commands
perplexity.sh usage                    # Show usage stats
perplexity.sh setup                    # Run setup wizard
perplexity.sh test                     # Test connection
```

## Error Handling

- **401 Unauthorized:** Check API key
- **429 Rate Limited:** Wait 60s, retry
- **500 Server Error:** Perplexity down, fallback to web_search
- **No credits:** Add billing at perplexity.ai

## Security Notes

- API keys stored in `~/.config/perplexity/` (chmod 600)
- Never log queries containing PII
- Citations may contain third-party links (verify sources)

## Troubleshooting

**Q: "No API key found"**
Run `./scripts/setup.sh` or set `PERPLEXITY_API_KEY`

**Q: "jq: command not found"**
Install: `sudo apt install jq` (Linux) or `brew install jq` (macOS)

**Q: Citations not showing**
Use `--citations` flag or `research` mode

**Q: Slow responses**
Switch to `sonar` model (faster, cheaper)

## Limitations

- Max 4000 tokens per request
- Rate limit: ~10 req/min (free tier)
- Citations depend on model (sonar-pro best)
- Not suitable for: real-time chat, code execution, file uploads

## Contributing

Found a bug? Want a feature? Edit this skill and share!
