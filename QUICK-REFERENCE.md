# 🎯 Model Rotation System - Quick Reference Card

## One-Line Commands

```bash
# Model Selection
node model-selector.js "your task description"
node model-selector.js "task" --max-cost low
node model-selector.js "task" --provider Anthropic
node model-selector.js --list reasoning

# Account Rotation
node account-rotator.js current
node account-rotator.js next --model gpt-4o
node account-rotator.js status
node account-rotator.js rate-limit --account acc-1

# Usage Tracking
node usage-tracker/usage-tracker.js view
node usage-tracker/usage-tracker.js stats
node usage-tracker/usage-tracker.js export csv

# Smart Spawn
node smart-spawn.js "task" --type code
node smart-spawn.js "task" --max-cost medium
node smart-spawn.js "task" --json

# Testing & Examples
npm test
npm run examples
npm run dashboard
```

## Programmatic API

```javascript
// Model Selection
const { selectModel } = require('./model-selector');
const choice = selectModel('write Python code');
// Returns: { model, provider, category, confidence, reasoning }

// Account Rotation
const { getNextAccount } = require('./account-rotator');
const account = getNextAccount({ requireModel: 'gpt-4o' });
// Returns: { id, name, tier, models, token }

// Usage Tracking
const { logUsage, getStats } = require('./usage-tracker/usage-tracker');
logUsage({ accountId: 'acc-1', model: 'gpt-4o', tokensUsed: 1500 });
const stats = getStats({ startDate: '2025-01-01' });

// Smart Spawn (All-in-One)
const { smartSpawn } = require('./smart-spawn');
const result = await smartSpawn({ task: 'your task', taskType: 'code' });
// Returns: { sessionKey, model, account, usageId }
```

## File Locations

```
model-rotation-system/
├── model-selector.js           # Model selection engine
├── account-rotator.js          # Account rotation logic
├── smart-spawn.js              # Unified wrapper
├── accounts.json               # YOUR accounts (create from template)
├── accounts.json.template      # Configuration template
├── rotation-state.json         # Auto-generated state
├── test-system.js              # Test suite
├── examples.js                 # Integration examples
├── README.md                   # Main documentation
├── QUICKSTART.md               # 5-minute setup
├── MODEL-CAPABILITIES.md       # Model comparison
├── model-rotation-integration.md  # OpenClaw guide
└── usage-tracker/
    ├── usage-tracker.js        # Tracking CLI
    ├── usage-data.json         # Auto-generated logs
    ├── dashboard.html          # Web dashboard
    └── dashboard.js            # Dashboard logic
```

## Model Decision Tree

```
Need deep reasoning/math? → o1-preview (or o1-mini for budget)
Creative writing?          → Claude Opus 3 (or GPT-4 Turbo)
Code generation?           → Claude Sonnet 4.5 (best overall)
Huge document analysis?    → Gemini Pro 1.5 (1M context)
Speed-critical?            → Gemini Flash 2.0 (fastest)
Quick/simple task?         → GPT-4o-mini or Claude Haiku 3.5
Multimodal (images)?       → GPT-4o
Unsure/general?            → Claude Sonnet 4.5 (default)
```

## Task Type Keywords

| Type | Keywords | Best Models |
|------|----------|-------------|
| **reasoning** | solve, prove, calculate, math, logic, optimize | o1-preview, o1-mini |
| **code** | code, program, function, debug, API, implement | Claude Sonnet 4.5, GPT-4o |
| **creative** | story, creative, brainstorm, narrative, marketing | Claude Opus 3, GPT-4 Turbo |
| **fast** | quick, simple, summarize, brief, TLDR | Gemini Flash 2.0, Claude Haiku |
| **balanced** | explain, help, create, design, review | Claude Sonnet 4.5, GPT-4o |

## Cost Tiers

| Tier | Models | Use For |
|------|--------|---------|
| **low** | Haiku, GPT-4o-mini, Flash | Simple tasks, batch processing |
| **medium** | Sonnet, GPT-4o, Gemini Pro | Most tasks, production work |
| **high** | o1-preview, Opus, GPT-4 Turbo | Complex problems, creative work |

## Setup (5 Minutes)

```bash
# 1. Copy template
cp accounts.json.template accounts.json

# 2. Edit with your tokens
nano accounts.json

# 3. Test
npm test

# 4. Use
node smart-spawn.js "your task"
```

## Common Patterns

### Auto-Select & Spawn
```javascript
const result = await smartSpawn({ 
  task: 'Write REST API',
  taskType: 'code' 
});
```

### Cost-Conscious
```javascript
const result = await smartSpawn({ 
  task: 'Quick summary',
  maxCostTier: 'low'
});
```

### Provider Preference
```javascript
const result = await smartSpawn({ 
  task: 'Creative story',
  preferProvider: 'Anthropic'
});
```

### Batch Processing
```javascript
const results = await smartSpawnBatch([
  { description: 'task 1', type: 'code' },
  { description: 'task 2', type: 'fast' }
]);
```

### Manual Control
```javascript
const model = selectModel('analyze algorithm');
const account = getNextAccount({ requireModel: model.model });
// Use with your spawn function
```

## Error Handling

```javascript
try {
  const result = await smartSpawn({ task, autoRotate: true });
} catch (error) {
  if (error.message.includes('No available accounts')) {
    // All accounts exhausted - queue task
  } else if (error.message.includes('rate limit')) {
    // Rate limit hit - wait or use fallback
  } else {
    // Other error - log and alert
  }
}
```

## Monitoring

```bash
# Dashboard (web)
npm run dashboard
# Open http://localhost:8080/dashboard.html

# CLI stats
npm run stats

# Account status
npm run status

# Recent usage
node usage-tracker/usage-tracker.js view --limit 20
```

## Security

```bash
# Generate encryption key
openssl rand -hex 32 > .encryption_key

# Set environment variable
export ACCOUNT_ENCRYPTION_KEY=$(cat .encryption_key)

# Encrypt tokens (run once per account)
node -e "
const { updateAccount } = require('./account-rotator');
updateAccount({ id: 'acc-1', token: 'plaintext-token' });
"
```

## Troubleshooting

| Issue | Command | Solution |
|-------|---------|----------|
| No accounts | `cp accounts.json.template accounts.json` | Configure accounts |
| All rate limited | `node account-rotator.js reset` | Reset rate limits |
| High failures | `node usage-tracker/usage-tracker.js view` | Check recent errors |
| Wrong model | `node model-selector.js "task" --json` | Check reasoning |

## NPM Scripts

```bash
npm test              # Run test suite
npm run examples      # Run integration examples
npm run dashboard     # Start web dashboard
npm run status        # Check account status
npm run stats         # View usage statistics
```

## Documentation Files

- **README.md** - Complete system guide
- **QUICKSTART.md** - 5-minute setup
- **MODEL-CAPABILITIES.md** - Model comparison matrix
- **model-rotation-integration.md** - OpenClaw integration
- **CHANGELOG.md** - Version history
- **MISSION-COMPLETE.md** - Project summary

## Model Stats (Quick Reference)

| Model | Provider | Context | Speed | Best For |
|-------|----------|---------|-------|----------|
| **o1-preview** | OpenAI | 128K | ⭐⭐ | Complex reasoning |
| **o1-mini** | OpenAI | 128K | ⭐⭐⭐ | Code challenges |
| **Claude Sonnet 4.5** | Anthropic | 200K | ⭐⭐⭐⭐ | **Best overall** |
| **Claude Opus 3** | Anthropic | 200K | ⭐⭐ | Creative writing |
| **Claude Haiku 3.5** | Anthropic | 200K | ⭐⭐⭐⭐⭐ | Fast tasks |
| **GPT-4o** | OpenAI | 128K | ⭐⭐⭐ | Multimodal |
| **GPT-4o-mini** | OpenAI | 128K | ⭐⭐⭐⭐⭐ | Budget-friendly |
| **GPT-4 Turbo** | OpenAI | 128K | ⭐⭐⭐ | Detailed content |
| **Gemini Pro 1.5** | Google | 1M | ⭐⭐⭐⭐ | Huge documents |
| **Gemini Flash 2.0** | Google | 1M | ⭐⭐⭐⭐⭐ | **Fastest** |

## Support

- **Help:** All commands support `--help` flag
- **Examples:** `npm run examples`
- **Tests:** `npm test`
- **Docs:** Check README.md

---

**Keep this card handy for quick reference!** 📌

*Version 1.0.0 | January 2025*
