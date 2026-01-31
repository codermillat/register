# Perplexity Search Skill

Web search and research powered by Perplexity AI. A standalone tool for real-time information, citations, and deep research.

## 🚀 Quick Start

### 1. Setup (One-Time)
```bash
cd /home/openclaw/.openclaw/workspace/skills/perplexity-search
./scripts/setup.sh
```

This will:
- Prompt for your Perplexity API key (get from [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api))
- Configure default model and settings
- Test the connection
- Save credentials to `~/.config/perplexity/credentials.json`

### 2. Basic Usage
```bash
# Quick search
./scripts/perplexity.sh search "latest AI developments 2026"

# Research with citations
./scripts/perplexity.sh research "EdTech trends in India"

# Fact-check
./scripts/perplexity.sh fact "GitHub Copilot is free for students"

# Compare
./scripts/perplexity.sh compare "Claude vs GPT-4 for coding"

# Check usage
./scripts/perplexity.sh usage
```

### 3. From Node.js
```javascript
const PerplexitySearch = require('./scripts/perplexity-search.js');
const pplx = new PerplexitySearch();

// Search
const result = await pplx.search("What is OpenClaw?");
console.log(result.answer);
console.log(result.citations);

// Research
const research = await pplx.research("EdTech market analysis 2026");
console.log(research.answer);

// Fact-check
const fact = await pplx.factCheck("The Earth is flat");
console.log(fact.verdict); // TRUE/FALSE/MIXED
```

## 📊 Features

### Search Modes
- **search** - Fast, general-purpose search
- **research** - Deep research with enhanced citations
- **fact** - Fact-checking with verdict
- **compare** - A vs B comparison analysis

### Output Formats
- **Plain text** (default) - Human-readable
- **JSON** - `--json` flag for programmatic use
- **Citations** - `--citations` flag to show sources

### Cost Tracking
- Automatic usage tracking in `~/.config/perplexity/usage.json`
- Alerts at 80% of free tier ($4 / $5)
- Per-query cost estimates

## 🧪 Examples

### Example 1: Current Events
```bash
./scripts/perplexity.sh search "latest OpenAI announcements January 2026"
```

### Example 2: Deep Research
```bash
./scripts/perplexity.sh research "Impact of AI on education in developing countries" --citations
```

### Example 3: Fact-Checking
```bash
./scripts/perplexity.sh fact "Python 3.13 was released in 2025"
```

### Example 4: Comparison
```bash
./scripts/perplexity.sh compare "React vs Vue.js for beginners in 2026"
```

### Example 5: JSON Output
```bash
./scripts/perplexity.sh search "best AI coding assistants" --json | jq '.answer'
```

## 🔗 Integration with Other Skills

### With Deep Research
```bash
# Get initial intel with Perplexity
./scripts/perplexity.sh research "AI safety regulations EU" > intel.txt

# Deep dive with Deep Research skill
cd ../deep-research
./scripts/research.sh "Analyze EU AI regulations" --context ../perplexity-search/intel.txt
```

### With Memory Manager
```bash
# Save important research
result=$(./scripts/perplexity.sh search "quantum computing breakthroughs 2026")
echo "$result" | ../memory-manager/scripts/save.sh --tag quantum --source perplexity
```

### With Yahoo Finance
```bash
# Research a company first
./scripts/perplexity.sh research "NVIDIA financial performance 2026"

# Then get real-time stock data
cd ../yahoo-finance
./scripts/quote.sh NVDA
```

## 📝 Configuration

Config file: `~/.config/perplexity/credentials.json`

```json
{
  "api_key": "pplx-...",
  "model": "sonar",
  "max_tokens": 1000,
  "temperature": 0.2
}
```

### Models
- **sonar** - Fast, cheap ($0.002/1K tokens)
- **sonar-pro** - Better citations ($0.01/1K tokens)
- **sonar-reasoning** - Deep analysis ($0.02/1K tokens)

### Environment Variable
Alternatively, set:
```bash
export PERPLEXITY_API_KEY="pplx-..."
```

## 💰 Cost Management

Free tier: $5 credit (~2500 queries with sonar model)

Check usage:
```bash
./scripts/perplexity.sh usage
```

Output:
```
📊 Perplexity Usage Stats
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Queries:        143
Total Tokens:   89,432
Estimated Cost: $0.18
Since:          2026-01-15T10:00:00Z

Free Tier:      $5.00
Remaining:      $4.82
Usage:          3.6%
```

## 🛠️ Troubleshooting

### "No API key found"
Run `./scripts/setup.sh` or set `PERPLEXITY_API_KEY` environment variable.

### "jq: command not found"
Install jq:
- Linux: `sudo apt install jq`
- macOS: `brew install jq`

### "API Error: 401"
Invalid API key. Check your key at [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)

### "API Error: 429"
Rate limited. Wait 60 seconds and retry. Free tier: ~10 requests/minute.

### Slow responses
Switch to faster model: `--model sonar`

### No citations
Use research mode: `./scripts/perplexity.sh research "query"` or add `--citations` flag.

## 🔒 Security

- API keys stored in `~/.config/perplexity/` with `chmod 600`
- No query logging (except usage stats)
- Citations may link to third-party sites (verify sources)

## 📚 Full Documentation

See [SKILL.md](./SKILL.md) for complete documentation including:
- API reference
- Advanced options
- Integration patterns
- Best practices

## 🧩 Use Cases for EdTech

### Student Research
```bash
./scripts/perplexity.sh research "History of the Indian Independence Movement"
```

### Curriculum Development
```bash
./scripts/perplexity.sh search "latest trends in STEM education 2026"
```

### Fact-Checking
```bash
./scripts/perplexity.sh fact "Albert Einstein failed mathematics in school"
```

### Competitive Analysis
```bash
./scripts/perplexity.sh compare "Byju's vs Unacademy business model"
```

## 🤝 Contributing

This skill is part of the OpenClaw ecosystem. Improve it:
1. Edit the scripts or documentation
2. Test your changes
3. Share with the community

## 📄 License

Part of OpenClaw workspace. Use freely, improve openly.

---

**Need help?** Check the [examples](./examples/) folder or read [SKILL.md](./SKILL.md)
