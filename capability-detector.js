#!/usr/bin/env node
/**
 * CAPABILITY DETECTOR
 * Advanced model capability detection with detailed testing
 * 
 * Usage:
 *   node capability-detector.js test-all
 *   node capability-detector.js test <account-name>
 *   node capability-detector.js compare
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// Configuration
const COPILOT_TOKENS_FILE = path.join(__dirname, 'copilot-tokens.json');
const CAPABILITIES_REPORT_FILE = path.join(__dirname, 'capabilities-report.json');
const COPILOT_CHAT_URL = 'https://api.githubcopilot.com/chat/completions';

// All known models to test
const ALL_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-sonnet-4.5',
  'claude-sonnet-3.5',
  'claude-haiku-3.5',
  'o1-preview',
  'o1-mini',
  'o3-mini',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-flash'
];

/**
 * Decrypt token
 */
function decrypt(text, key = process.env.ACCOUNT_ENCRYPTION_KEY || 'default-key-change-me') {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Make HTTPS request
 */
function httpsRequest(method, urlString, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpenClaw-Capability-Detector/1.0',
        ...headers
      },
      timeout: 10000 // 10 second timeout
    };

    if (postData) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ 
            status: res.statusCode, 
            data: parsed, 
            headers: res.headers 
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            data: body, 
            headers: res.headers 
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * Test a single model
 */
async function testModel(token, model) {
  const testMessages = [
    { role: 'user', content: 'test' }
  ];

  const startTime = Date.now();
  
  try {
    const response = await httpsRequest('POST', COPILOT_CHAT_URL, {
      model: model,
      messages: testMessages,
      max_tokens: 1,
      stream: false
    }, {
      'Authorization': `Bearer ${token}`,
      'Editor-Version': 'vscode/1.85.0',
      'Editor-Plugin-Version': 'copilot-chat/0.11.1',
      'Openai-Organization': 'github-copilot',
      'Openai-Intent': 'conversation-panel'
    });

    const latency = Date.now() - startTime;

    if (response.status === 200 || response.status === 201) {
      // Extract rate limit info
      const rateLimit = {
        limit: response.headers['x-ratelimit-limit'] ? parseInt(response.headers['x-ratelimit-limit']) : null,
        remaining: response.headers['x-ratelimit-remaining'] ? parseInt(response.headers['x-ratelimit-remaining']) : null,
        reset: response.headers['x-ratelimit-reset'] ? parseInt(response.headers['x-ratelimit-reset']) : null
      };

      return {
        available: true,
        status: response.status,
        latency: latency,
        rateLimit: rateLimit,
        responseSize: JSON.stringify(response.data).length,
        model: response.data.model || model,
        error: null
      };
    } else {
      return {
        available: false,
        status: response.status,
        latency: latency,
        error: `HTTP ${response.status}: ${JSON.stringify(response.data).substring(0, 200)}`
      };
    }
  } catch (error) {
    return {
      available: false,
      status: null,
      latency: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Test all models for an account
 */
async function testAccount(account, modelsToTest = ALL_MODELS) {
  console.log(`\n🧪 Testing: ${account.username} (${account.tier})`);
  console.log('━'.repeat(52));

  const token = decrypt(account.token);
  const results = {
    accountId: account.id,
    username: account.username,
    tier: account.tier,
    testedAt: new Date().toISOString(),
    models: {},
    summary: {
      available: 0,
      unavailable: 0,
      avgLatency: 0,
      totalRateLimit: 0
    }
  };

  let totalLatency = 0;
  let availableCount = 0;

  for (const model of modelsToTest) {
    process.stdout.write(`   Testing ${model}...`);
    
    const result = await testModel(token, model);
    results.models[model] = result;

    if (result.available) {
      availableCount++;
      results.summary.available++;
      totalLatency += result.latency;
      
      if (result.rateLimit.limit) {
        results.summary.totalRateLimit += result.rateLimit.limit;
      }
      
      console.log(` ✅ (${result.latency}ms, limit: ${result.rateLimit.limit || 'unknown'})`);
    } else {
      results.summary.unavailable++;
      console.log(` ❌ (${result.error ? result.error.substring(0, 50) : 'failed'})`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  if (availableCount > 0) {
    results.summary.avgLatency = Math.round(totalLatency / availableCount);
  }

  console.log('\n📊 Summary:');
  console.log(`   Available: ${results.summary.available}/${modelsToTest.length}`);
  console.log(`   Avg latency: ${results.summary.avgLatency}ms`);
  console.log(`   Total rate limit: ${results.summary.totalRateLimit} req/month`);

  return results;
}

/**
 * Test all accounts
 */
async function testAllAccounts() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE CAPABILITY DETECTION            ║');
  console.log('╚════════════════════════════════════════════════════╝');

  if (!fs.existsSync(COPILOT_TOKENS_FILE)) {
    console.error('\n❌ Copilot tokens file not found. Run setup first.\n');
    process.exit(1);
  }

  const tokenData = JSON.parse(fs.readFileSync(COPILOT_TOKENS_FILE, 'utf8'));
  const accounts = tokenData.accounts.filter(a => a.active);

  if (accounts.length === 0) {
    console.error('\n❌ No active accounts found.\n');
    process.exit(1);
  }

  console.log(`\n📋 Testing ${accounts.length} account(s) with ${ALL_MODELS.length} models\n`);

  const report = {
    generatedAt: new Date().toISOString(),
    accountsTest: accounts.length,
    modelsTested: ALL_MODELS.length,
    accounts: []
  };

  for (const account of accounts) {
    const result = await testAccount(account, ALL_MODELS);
    report.accounts.push(result);

    // Delay between accounts
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Save report
  fs.writeFileSync(CAPABILITIES_REPORT_FILE, JSON.stringify(report, null, 2));
  console.log(`\n✅ Report saved: ${CAPABILITIES_REPORT_FILE}\n`);

  return report;
}

/**
 * Compare accounts
 */
function compareAccounts() {
  if (!fs.existsSync(CAPABILITIES_REPORT_FILE)) {
    console.error('\n❌ Capabilities report not found. Run test-all first.\n');
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(CAPABILITIES_REPORT_FILE, 'utf8'));

  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║           ACCOUNT COMPARISON                       ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log(`Report generated: ${new Date(report.generatedAt).toLocaleString()}\n`);
  console.log('━'.repeat(72));

  // Create comparison table
  const accountNames = report.accounts.map(a => a.username);
  const allTestedModels = [...new Set(report.accounts.flatMap(a => Object.keys(a.models)))];

  console.log('\n📊 Model Availability Matrix:\n');
  console.log('Model'.padEnd(25) + accountNames.map(n => n.substring(0, 12).padEnd(13)).join(''));
  console.log('─'.repeat(25 + accountNames.length * 13));

  allTestedModels.forEach(model => {
    let row = model.padEnd(25);
    
    report.accounts.forEach(account => {
      const modelResult = account.models[model];
      if (modelResult && modelResult.available) {
        row += '✅           ';
      } else {
        row += '❌           ';
      }
    });
    
    console.log(row);
  });

  console.log('\n━'.repeat(72));

  // Summary comparison
  console.log('\n📈 Summary Comparison:\n');
  
  const table = [];
  table.push(['Account', 'Tier', 'Models', 'Rate Limit', 'Avg Latency'].map((h, i) => 
    h.padEnd(i === 0 ? 15 : i === 3 ? 12 : 10)
  ).join(''));
  table.push(['─'.repeat(15), '─'.repeat(10), '─'.repeat(10), '─'.repeat(12), '─'.repeat(10)].join(''));

  report.accounts.forEach(account => {
    table.push([
      account.username.padEnd(15),
      account.tier.toUpperCase().padEnd(10),
      String(account.summary.available).padEnd(10),
      String(account.summary.totalRateLimit).padEnd(12),
      `${account.summary.avgLatency}ms`.padEnd(10)
    ].join(''));
  });

  table.forEach(row => console.log(row));

  console.log('\n━'.repeat(72));

  // Best account recommendations
  console.log('\n🎯 Recommendations:\n');

  const proAccounts = report.accounts.filter(a => a.tier === 'pro');
  const freeAccounts = report.accounts.filter(a => a.tier === 'free');

  if (proAccounts.length > 0) {
    const bestPro = proAccounts.sort((a, b) => b.summary.available - a.summary.available)[0];
    console.log(`   Pro account: ${bestPro.username}`);
    console.log(`   • ${bestPro.summary.available} models available`);
    console.log(`   • ${bestPro.summary.totalRateLimit} req/month`);
    console.log(`   • ${bestPro.summary.avgLatency}ms avg latency\n`);
  }

  if (freeAccounts.length > 0) {
    const bestFree = freeAccounts.sort((a, b) => b.summary.available - a.summary.available)[0];
    console.log(`   Free account: ${bestFree.username}`);
    console.log(`   • ${bestFree.summary.available} models available`);
    console.log(`   • ${bestFree.summary.totalRateLimit} req/month`);
    console.log(`   • ${bestFree.summary.avgLatency}ms avg latency\n`);
  }

  // Model-specific recommendations
  console.log('🤖 Model Recommendations:\n');

  const modelAvailability = {};
  allTestedModels.forEach(model => {
    const availableIn = report.accounts.filter(a => a.models[model]?.available);
    modelAvailability[model] = {
      count: availableIn.length,
      accounts: availableIn.map(a => a.username)
    };
  });

  // Sort by rarity
  const sortedModels = Object.entries(modelAvailability)
    .sort((a, b) => a[1].count - b[1].count)
    .slice(0, 5);

  sortedModels.forEach(([model, info]) => {
    if (info.count > 0) {
      console.log(`   ${model}:`);
      console.log(`   • Available in: ${info.accounts.join(', ')}`);
      console.log(`   • Rarity: ${info.count}/${report.accounts.length} accounts\n`);
    }
  });

  console.log('━'.repeat(72) + '\n');
}

/**
 * Test specific account
 */
async function testSpecificAccount(accountName) {
  if (!fs.existsSync(COPILOT_TOKENS_FILE)) {
    console.error('\n❌ Copilot tokens file not found. Run setup first.\n');
    process.exit(1);
  }

  const tokenData = JSON.parse(fs.readFileSync(COPILOT_TOKENS_FILE, 'utf8'));
  const account = tokenData.accounts.find(a => 
    a.id === accountName || 
    a.username === accountName || 
    a.name === accountName
  );

  if (!account) {
    console.error(`\n❌ Account not found: ${accountName}\n`);
    process.exit(1);
  }

  await testAccount(account, ALL_MODELS);
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Capability Detector - Advanced model testing

USAGE:
  node capability-detector.js <command> [options]

COMMANDS:
  test-all              Test all accounts with all models
  test <account>        Test specific account
  compare               Compare account capabilities
  
EXAMPLES:
  node capability-detector.js test-all
  node capability-detector.js test Unibro6722
  node capability-detector.js compare
`);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'test-all':
        await testAllAccounts();
        break;

      case 'test':
        if (!args[1]) {
          console.error('❌ Account name required');
          console.log('   Usage: node capability-detector.js test <account>');
          process.exit(1);
        }
        await testSpecificAccount(args[1]);
        break;

      case 'compare':
        compareAccounts();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  testModel,
  testAccount,
  testAllAccounts,
  compareAccounts
};
