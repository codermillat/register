#!/usr/bin/env node
/**
 * USAGE TRACKER - Track model usage, credits, and rate limits
 * Usage: node usage-tracker.js <command> [options]
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'usage-data.json');
const RATE_LIMIT_FILE = path.join(__dirname, 'rate-limits.json');

// Credit estimates per 1k tokens (rough estimates)
const CREDIT_COSTS = {
  'o1-preview': 15,
  'o1-mini': 3.5,
  'claude-sonnet-4.5': 3,
  'gpt-4o': 2.5,
  'gemini-pro-1.5': 2.5,
  'gpt-4o-mini': 0.15,
  'claude-haiku-3.5': 0.25,
  'gemini-flash-2.0': 0.075,
  'claude-opus-3': 15,
  'gpt-4-turbo': 10
};

/**
 * Initialize data files if they don't exist
 */
function initDataFiles() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ entries: [] }, null, 2));
  }
  if (!fs.existsSync(RATE_LIMIT_FILE)) {
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify({ accounts: {} }, null, 2));
  }
}

/**
 * Load usage data
 */
function loadData() {
  initDataFiles();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

/**
 * Save usage data
 */
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * Load rate limit data
 */
function loadRateLimits() {
  initDataFiles();
  return JSON.parse(fs.readFileSync(RATE_LIMIT_FILE, 'utf8'));
}

/**
 * Save rate limit data
 */
function saveRateLimits(data) {
  fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(data, null, 2));
}

/**
 * Log a new usage entry
 */
function logUsage(options) {
  const {
    accountId = 'default',
    accountName = 'Default Account',
    model,
    taskType = 'general',
    tokensUsed = 0,
    success = true,
    errorMessage = null,
    metadata = {}
  } = options;

  if (!model) {
    throw new Error('Model name is required');
  }

  const data = loadData();
  
  const entry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    accountId,
    accountName,
    model,
    taskType,
    tokensUsed,
    creditsConsumed: estimateCredits(model, tokensUsed),
    success,
    errorMessage,
    metadata
  };

  data.entries.push(entry);
  saveData(data);

  // Update rate limit tracking
  updateRateLimit(accountId, model);

  return entry;
}

/**
 * Estimate credits consumed
 */
function estimateCredits(model, tokens) {
  const costPer1k = CREDIT_COSTS[model] || 1;
  return (tokens / 1000) * costPer1k;
}

/**
 * Update rate limit tracking
 */
function updateRateLimit(accountId, model) {
  const rateLimits = loadRateLimits();
  
  if (!rateLimits.accounts[accountId]) {
    rateLimits.accounts[accountId] = {
      requests: {},
      lastReset: new Date().toISOString()
    };
  }

  const account = rateLimits.accounts[accountId];
  
  if (!account.requests[model]) {
    account.requests[model] = {
      count: 0,
      firstRequest: new Date().toISOString(),
      lastRequest: new Date().toISOString()
    };
  }

  account.requests[model].count++;
  account.requests[model].lastRequest = new Date().toISOString();

  saveRateLimits(rateLimits);
}

/**
 * Get usage statistics
 */
function getStats(options = {}) {
  const {
    accountId = null,
    model = null,
    startDate = null,
    endDate = null,
    taskType = null
  } = options;

  const data = loadData();
  let entries = data.entries;

  // Apply filters
  if (accountId) {
    entries = entries.filter(e => e.accountId === accountId);
  }
  if (model) {
    entries = entries.filter(e => e.model === model);
  }
  if (taskType) {
    entries = entries.filter(e => e.taskType === taskType);
  }
  if (startDate) {
    entries = entries.filter(e => new Date(e.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    entries = entries.filter(e => new Date(e.timestamp) <= new Date(endDate));
  }

  // Calculate statistics
  const stats = {
    totalRequests: entries.length,
    successfulRequests: entries.filter(e => e.success).length,
    failedRequests: entries.filter(e => !e.success).length,
    totalTokens: entries.reduce((sum, e) => sum + e.tokensUsed, 0),
    totalCredits: entries.reduce((sum, e) => sum + e.creditsConsumed, 0),
    byModel: {},
    byAccount: {},
    byTaskType: {},
    timeline: []
  };

  // Group by model
  entries.forEach(e => {
    if (!stats.byModel[e.model]) {
      stats.byModel[e.model] = {
        requests: 0,
        tokens: 0,
        credits: 0,
        successes: 0,
        failures: 0
      };
    }
    stats.byModel[e.model].requests++;
    stats.byModel[e.model].tokens += e.tokensUsed;
    stats.byModel[e.model].credits += e.creditsConsumed;
    if (e.success) stats.byModel[e.model].successes++;
    else stats.byModel[e.model].failures++;
  });

  // Group by account
  entries.forEach(e => {
    if (!stats.byAccount[e.accountId]) {
      stats.byAccount[e.accountId] = {
        name: e.accountName,
        requests: 0,
        tokens: 0,
        credits: 0,
        successes: 0,
        failures: 0
      };
    }
    stats.byAccount[e.accountId].requests++;
    stats.byAccount[e.accountId].tokens += e.tokensUsed;
    stats.byAccount[e.accountId].credits += e.creditsConsumed;
    if (e.success) stats.byAccount[e.accountId].successes++;
    else stats.byAccount[e.accountId].failures++;
  });

  // Group by task type
  entries.forEach(e => {
    if (!stats.byTaskType[e.taskType]) {
      stats.byTaskType[e.taskType] = {
        requests: 0,
        tokens: 0,
        credits: 0
      };
    }
    stats.byTaskType[e.taskType].requests++;
    stats.byTaskType[e.taskType].tokens += e.tokensUsed;
    stats.byTaskType[e.taskType].credits += e.creditsConsumed;
  });

  // Create timeline (group by day)
  const timelineMap = {};
  entries.forEach(e => {
    const date = e.timestamp.split('T')[0];
    if (!timelineMap[date]) {
      timelineMap[date] = {
        date,
        requests: 0,
        tokens: 0,
        credits: 0
      };
    }
    timelineMap[date].requests++;
    timelineMap[date].tokens += e.tokensUsed;
    timelineMap[date].credits += e.creditsConsumed;
  });
  stats.timeline = Object.values(timelineMap).sort((a, b) => 
    a.date.localeCompare(b.date)
  );

  return stats;
}

/**
 * Export data in various formats
 */
function exportData(format = 'json', options = {}) {
  const stats = getStats(options);
  const data = loadData();

  if (format === 'json') {
    return JSON.stringify({ stats, entries: data.entries }, null, 2);
  }

  if (format === 'csv') {
    const headers = 'Timestamp,Account,Model,Task Type,Tokens,Credits,Success,Error\n';
    const rows = data.entries.map(e => 
      `${e.timestamp},${e.accountName},${e.model},${e.taskType},${e.tokensUsed},${e.creditsConsumed.toFixed(2)},${e.success},${e.errorMessage || ''}`
    ).join('\n');
    return headers + rows;
  }

  throw new Error(`Unsupported format: ${format}`);
}

/**
 * Get rate limit status
 */
function getRateLimitStatus(accountId = null) {
  const rateLimits = loadRateLimits();
  
  if (accountId) {
    return rateLimits.accounts[accountId] || null;
  }
  
  return rateLimits.accounts;
}

/**
 * Reset rate limits for an account
 */
function resetRateLimits(accountId) {
  const rateLimits = loadRateLimits();
  
  if (rateLimits.accounts[accountId]) {
    rateLimits.accounts[accountId] = {
      requests: {},
      lastReset: new Date().toISOString()
    };
    saveRateLimits(rateLimits);
    return true;
  }
  
  return false;
}

/**
 * Generate unique ID
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * View recent entries
 */
function viewRecent(limit = 10, options = {}) {
  const data = loadData();
  let entries = data.entries;

  // Apply filters
  if (options.accountId) {
    entries = entries.filter(e => e.accountId === options.accountId);
  }
  if (options.model) {
    entries = entries.filter(e => e.model === options.model);
  }

  // Sort by timestamp descending and limit
  return entries
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help') {
    console.log(`
Usage Tracker - Track model usage and credits

COMMANDS:
  log         Log a new usage entry
  view        View recent usage entries
  stats       Show usage statistics
  export      Export data (JSON or CSV)
  rate-limit  Check rate limit status
  reset       Reset rate limits for an account

EXAMPLES:
  node usage-tracker.js log --model gpt-4o --tokens 1500 --task code
  node usage-tracker.js view --limit 20
  node usage-tracker.js stats --account acc-123
  node usage-tracker.js export csv > usage-report.csv
  node usage-tracker.js rate-limit --account acc-123
  node usage-tracker.js reset --account acc-123
`);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'log': {
        const options = {
          accountId: getArg('--account', 'default'),
          accountName: getArg('--account-name', 'Default Account'),
          model: getArg('--model'),
          taskType: getArg('--task', 'general'),
          tokensUsed: parseInt(getArg('--tokens', '0')),
          success: !args.includes('--failed'),
          errorMessage: getArg('--error', null)
        };

        const entry = logUsage(options);
        console.log('✅ Usage logged:');
        console.log(`   ID: ${entry.id}`);
        console.log(`   Model: ${entry.model}`);
        console.log(`   Tokens: ${entry.tokensUsed}`);
        console.log(`   Credits: ${entry.creditsConsumed.toFixed(2)}`);
        break;
      }

      case 'view': {
        const limit = parseInt(getArg('--limit', '10'));
        const options = {
          accountId: getArg('--account', null),
          model: getArg('--model', null)
        };

        const entries = viewRecent(limit, options);
        console.log(`\n📋 Recent Usage (${entries.length} entries):\n`);
        entries.forEach(e => {
          const status = e.success ? '✅' : '❌';
          console.log(`${status} ${e.timestamp}`);
          console.log(`   Account: ${e.accountName}`);
          console.log(`   Model: ${e.model}`);
          console.log(`   Task: ${e.taskType}`);
          console.log(`   Tokens: ${e.tokensUsed} | Credits: ${e.creditsConsumed.toFixed(2)}`);
          if (e.errorMessage) {
            console.log(`   Error: ${e.errorMessage}`);
          }
          console.log('');
        });
        break;
      }

      case 'stats': {
        const options = {
          accountId: getArg('--account', null),
          model: getArg('--model', null),
          startDate: getArg('--start', null),
          endDate: getArg('--end', null)
        };

        const stats = getStats(options);
        console.log('\n📊 Usage Statistics:\n');
        console.log(`Total Requests: ${stats.totalRequests}`);
        console.log(`  ✅ Successful: ${stats.successfulRequests}`);
        console.log(`  ❌ Failed: ${stats.failedRequests}`);
        console.log(`Total Tokens: ${stats.totalTokens.toLocaleString()}`);
        console.log(`Total Credits: ${stats.totalCredits.toFixed(2)}`);

        console.log('\n📈 By Model:');
        Object.entries(stats.byModel).forEach(([model, data]) => {
          console.log(`  ${model}:`);
          console.log(`    Requests: ${data.requests} | Tokens: ${data.tokens.toLocaleString()}`);
          console.log(`    Credits: ${data.credits.toFixed(2)} | Success Rate: ${((data.successes / data.requests) * 100).toFixed(1)}%`);
        });

        if (Object.keys(stats.byAccount).length > 1) {
          console.log('\n👤 By Account:');
          Object.entries(stats.byAccount).forEach(([id, data]) => {
            console.log(`  ${data.name}:`);
            console.log(`    Requests: ${data.requests} | Credits: ${data.credits.toFixed(2)}`);
          });
        }

        console.log('');
        break;
      }

      case 'export': {
        const format = args[1] || 'json';
        const options = {
          accountId: getArg('--account', null),
          model: getArg('--model', null)
        };

        const output = exportData(format, options);
        console.log(output);
        break;
      }

      case 'rate-limit': {
        const accountId = getArg('--account', null);
        const status = getRateLimitStatus(accountId);

        if (accountId) {
          if (!status) {
            console.log(`No rate limit data for account: ${accountId}`);
          } else {
            console.log(`\n🚦 Rate Limit Status for ${accountId}:\n`);
            console.log(`Last Reset: ${status.lastReset}`);
            console.log('\nRequests by Model:');
            Object.entries(status.requests).forEach(([model, data]) => {
              console.log(`  ${model}: ${data.count} requests`);
              console.log(`    First: ${data.firstRequest}`);
              console.log(`    Last: ${data.lastRequest}`);
            });
          }
        } else {
          console.log('\n🚦 Rate Limit Status (All Accounts):\n');
          Object.entries(status).forEach(([id, data]) => {
            const totalRequests = Object.values(data.requests).reduce((sum, r) => sum + r.count, 0);
            console.log(`  ${id}: ${totalRequests} total requests`);
          });
        }
        console.log('');
        break;
      }

      case 'reset': {
        const accountId = getArg('--account');
        if (!accountId) {
          console.error('❌ Account ID required (--account)');
          process.exit(1);
        }

        const success = resetRateLimits(accountId);
        if (success) {
          console.log(`✅ Rate limits reset for account: ${accountId}`);
        } else {
          console.log(`⚠️  No rate limit data found for account: ${accountId}`);
        }
        break;
      }

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error('Run with --help for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Helper to get CLI argument value
 */
function getArg(flag, defaultValue = null) {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return defaultValue;
}

module.exports = {
  logUsage,
  getStats,
  exportData,
  getRateLimitStatus,
  resetRateLimits,
  viewRecent,
  estimateCredits,
  CREDIT_COSTS
};
