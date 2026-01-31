# Quick Installation & Usage Guide

## 📦 Installation

The skill is now installed at:
```
/home/openclaw/.openclaw/workspace/skills/perplexity-search/
```

### File Structure
```
perplexity-search/
├── SKILL.md                          # Main skill documentation
├── README.md                         # Quick start guide
├── .gitignore                        # Git ignore rules
├── scripts/
│   ├── perplexity.sh                 # Main CLI tool (bash)
│   ├── perplexity-search.js          # Node.js API wrapper
│   └── setup.sh                      # One-time setup wizard
├── examples/
│   ├── research-workflow.md          # Integration examples
│   └── test-suite.sh                 # Test suite
└── references/
    └── api.md                        # Full API documentation
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Setup
```bash
cd /home/openclaw/.openclaw/workspace/skills/perplexity-search
./scripts/setup.sh
```

This will:
- Prompt for your Perplexity API key
- Save config to `~/.config/perplexity/credentials.json`
- Test the connection

**Get API key:** https://www.perplexity.ai/settings/api  
**Free tier:** $5 credit (~2500 queries)

### Step 2: Test
```bash
./scripts/perplexity.sh search "What is OpenClaw?"
```

### Step 3: Use
```bash
# Quick search
./scripts/perplexity.sh search "latest AI news 2026"

# Research with citations
./scripts/perplexity.sh research "EdTech trends in India"

# Fact-check
./scripts/perplexity.sh fact "GitHub Copilot is free"

# Compare
./scripts/perplexity.sh compare "Claude vs GPT-4"

# Check usage
./scripts/perplexity.sh usage
```

---

## 📋 Key Features

✅ **4 Search Modes:**
- `search` - Fast, general-purpose
- `research` - Deep research with citations
- `fact` - Fact-checking with verdict
- `compare` - A vs B analysis

✅ **Multiple Output Formats:**
- Plain text (default)
- JSON (`--json`)
- With citations (`--citations`)

✅ **Cost Tracking:**
- Automatic usage tracking
- Alerts at 80% of free tier
- Per-query cost estimates

✅ **Integration Ready:**
- Bash scripts for CLI
- Node.js API for programmatic use
- Works with other OpenClaw skills

---

## 🔗 Integration Examples

### With Deep Research
```bash
# Get intel with Perplexity
./scripts/perplexity.sh research "AI in education" > /tmp/intel.txt

# Analyze with Deep Research
cd ../deep-research
./scripts/research.sh "Analyze AI in education trends" --context /tmp/intel.txt
```

### With Memory Manager
```bash
# Save important research
result=$(./scripts/perplexity.sh search "quantum computing")
echo "$result" | ../memory-manager/scripts/save.sh --tag research
```

### From Node.js
```javascript
const PerplexitySearch = require('./scripts/perplexity-search.js');
const pplx = new PerplexitySearch();

const result = await pplx.search("What is AI?");
console.log(result.answer);
console.log(result.citations);
```

---

## 🧪 Testing

Run the test suite:
```bash
./examples/test-suite.sh
```

This will verify:
- Dependencies (jq, curl, node)
- Configuration
- API connection
- All search modes
- Error handling
- Usage tracking

---

## 📊 Cost Management

### Check Usage
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

### Models & Pricing

| Model | Cost/1K | Best For |
|-------|---------|----------|
| sonar | $0.002 | Quick searches (default) |
| sonar-pro | $0.01 | Research with citations |
| sonar-reasoning | $0.02 | Deep analysis |

---

## 🛠️ Troubleshooting

### "No API key found"
Run: `./scripts/setup.sh`

### "jq: command not found"
Install: `sudo apt install jq` (Linux) or `brew install jq` (macOS)

### API errors (401, 429)
- 401: Check your API key at perplexity.ai/settings/api
- 429: Rate limited, wait 60s and retry

### Slow responses
Switch to faster model: `--model sonar`

---

## 📚 Documentation

- **SKILL.md** - Complete skill documentation
- **README.md** - Quick start guide
- **examples/research-workflow.md** - Integration examples
- **references/api.md** - Full API reference

---

## 🎯 Use Cases for EdTech

### Student Research
```bash
./scripts/perplexity.sh research "History of Indian Independence"
```

### Curriculum Development
```bash
./scripts/perplexity.sh search "STEM education trends 2026"
```

### Fact-Checking
```bash
./scripts/perplexity.sh fact "Einstein failed math in school"
```

### Competitive Analysis
```bash
./scripts/perplexity.sh compare "Byju's vs Unacademy"
```

---

## ✅ Next Steps

1. **Run setup:** `./scripts/setup.sh`
2. **Test it:** `./scripts/perplexity.sh search "test"`
3. **Check docs:** `cat SKILL.md`
4. **Try workflows:** `cat examples/research-workflow.md`
5. **Add to TOOLS.md:** Document your usage patterns

---

## 🤝 Contributing

This skill is part of your OpenClaw workspace. Improve it:
- Edit scripts for your needs
- Add custom workflows
- Share with the community

---

**Questions?** Check the docs or run: `./scripts/perplexity.sh --help`
