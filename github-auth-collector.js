#!/usr/bin/env node
/**
 * GITHUB AUTH COLLECTOR - GitHub Device Flow Authentication
 * Collects and manages multiple GitHub Copilot Pro accounts
 * 
 * Usage:
 *   node github-auth-collector.js add [account-name]
 *   node github-auth-collector.js list
 *   node github-auth-collector.js test [account-name]
 *   node github-auth-collector.js remove [account-name]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// Configuration
const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');
const ENCRYPTION_KEY = process.env.ACCOUNT_ENCRYPTION_KEY || 'default-key-change-me';

// GitHub OAuth App credentials for device flow
// NOTE: For production, register your own OAuth App at https://github.com/settings/developers
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Iv1.b507a08c87ecfe98'; // Public client ID for device flow
const DEVICE_CODE_URL = 'https://github.com/login/device/code';
const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const USER_API_URL = 'https://api.github.com/user';
const COPILOT_API_URL = 'https://api.githubcopilot.com/chat/completions';

/**
 * Encrypt sensitive data using AES-256-CBC
 */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Make HTTPS POST request
 */
function httpsPost(urlString, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const postData = typeof data === 'string' ? data : JSON.stringify(data);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'application/json',
        'User-Agent': 'OpenClaw-GitHub-Auth/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Make HTTPS GET request
 */
function httpsGet(urlString, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpenClaw-GitHub-Auth/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Request device code from GitHub
 */
async function requestDeviceCode() {
  console.log('🔑 Requesting device code from GitHub...\n');

  const response = await httpsPost(DEVICE_CODE_URL, {
    client_id: GITHUB_CLIENT_ID,
    scope: 'user:email read:user'
  });

  if (response.status !== 200) {
    throw new Error(`Failed to get device code: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

/**
 * Poll for access token
 */
async function pollForAccessToken(deviceCode, interval = 5) {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await httpsPost(ACCESS_TOKEN_URL, {
          client_id: GITHUB_CLIENT_ID,
          device_code: deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        });

        const data = response.data;

        if (data.access_token) {
          clearInterval(pollInterval);
          resolve(data.access_token);
        } else if (data.error === 'authorization_pending') {
          // Still waiting
          process.stdout.write('.');
        } else if (data.error === 'slow_down') {
          // Increase interval
          clearInterval(pollInterval);
          pollInterval = setInterval(poll, (interval + 5) * 1000);
        } else if (data.error === 'expired_token') {
          clearInterval(pollInterval);
          reject(new Error('Device code expired. Please try again.'));
        } else if (data.error === 'access_denied') {
          clearInterval(pollInterval);
          reject(new Error('Access denied by user.'));
        } else {
          clearInterval(pollInterval);
          reject(new Error(`Authentication error: ${data.error}`));
        }
      } catch (error) {
        clearInterval(pollInterval);
        reject(error);
      }
    };

    let pollInterval = setInterval(poll, interval * 1000);
  });
}

/**
 * Fetch GitHub user information
 */
async function fetchUserInfo(accessToken) {
  const response = await httpsGet(USER_API_URL, {
    'Authorization': `Bearer ${accessToken}`
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch user info: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}

/**
 * Test GitHub Copilot API access and detect available models
 */
async function testCopilotAccess(accessToken) {
  const testModels = [
    'gpt-4o',
    'gpt-4o-mini',
    'claude-sonnet-4.5',
    'claude-haiku-3.5',
    'o1-preview',
    'o1-mini',
    'gemini-2.0-flash-exp'
  ];

  const availableModels = [];
  const limits = {};
  let tier = 'free';

  console.log('\n🧪 Testing model access...');

  for (const model of testModels) {
    try {
      const response = await httpsPost(COPILOT_API_URL, {
        model: model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1,
        stream: false
      }, {
        'Authorization': `Bearer ${accessToken}`,
        'Editor-Version': 'vscode/1.85.0',
        'Editor-Plugin-Version': 'copilot-chat/0.11.1',
        'Openai-Organization': 'github-copilot',
        'Openai-Intent': 'conversation-panel'
      });

      if (response.status === 200 || response.status === 201) {
        availableModels.push(model);
        console.log(`   ✓ ${model}`);

        // Check for rate limit headers
        if (response.headers['x-ratelimit-limit']) {
          limits[model] = parseInt(response.headers['x-ratelimit-limit']);
        }

        // Detect Pro tier (usually has higher limits or more models)
        if (model === 'o1-preview' || model === 'claude-sonnet-4.5') {
          tier = 'pro';
        }
      } else {
        console.log(`   ✗ ${model} (not available)`);
      }
    } catch (error) {
      console.log(`   ✗ ${model} (error)`);
    }
  }

  // Set default limits based on tier
  const defaultLimits = tier === 'pro' ? {
    'gpt-4o': 500,
    'gpt-4o-mini': 1000,
    'claude-sonnet-4.5': 1000,
    'claude-haiku-3.5': 1000,
    'o1-preview': 50,
    'o1-mini': 100,
    'gemini-2.0-flash-exp': 500
  } : {
    'gpt-4o-mini': 150,
    'claude-haiku-3.5': 150,
    'gemini-2.0-flash-exp': 150
  };

  // Merge detected limits with defaults
  const finalLimits = { ...defaultLimits };
  Object.keys(limits).forEach(model => {
    if (limits[model] > 0) {
      finalLimits[model] = limits[model];
    }
  });

  return {
    models: availableModels,
    tier: tier,
    limits: finalLimits
  };
}

/**
 * Load accounts from file
 */
function loadAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return { accounts: [] };
  }

  try {
    const data = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
    return data;
  } catch (error) {
    console.error('❌ Error loading accounts:', error.message);
    return { accounts: [] };
  }
}

/**
 * Save accounts to file
 */
function saveAccounts(data) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
}

/**
 * Generate unique account ID
 */
function generateAccountId(username) {
  const timestamp = Date.now();
  const hash = crypto.createHash('md5').update(username + timestamp).digest('hex').slice(0, 8);
  return `github-${hash}`;
}

/**
 * Add new account via device flow
 */
async function addAccount(accountName = null) {
  console.log('==========================================');
  console.log('   GITHUB DEVICE AUTHENTICATION');
  console.log('==========================================\n');

  try {
    // Step 1: Request device code
    const deviceInfo = await requestDeviceCode();
    const { device_code, user_code, verification_uri, expires_in, interval } = deviceInfo;

    // Step 2: Display instructions to user
    console.log('📱 Please complete authentication in your browser:\n');
    console.log(`   1. Visit: ${verification_uri}`);
    console.log(`   2. Enter code: ${user_code}`);
    console.log(`   3. Approve access for OpenClaw\n`);
    console.log(`⏱️  Code expires in ${Math.floor(expires_in / 60)} minutes`);
    console.log('\n🔄 Waiting for authentication');

    // Step 3: Poll for token
    const accessToken = await pollForAccessToken(device_code, interval);
    console.log('\n\n✅ Authentication successful!\n');

    // Step 4: Fetch user info
    console.log('👤 Fetching user information...');
    const userInfo = await fetchUserInfo(accessToken);
    console.log(`   Username: ${userInfo.login}`);
    console.log(`   Email: ${userInfo.email || 'Not public'}`);
    console.log(`   Name: ${userInfo.name || 'Not set'}`);

    // Step 5: Test Copilot access
    const copilotInfo = await testCopilotAccess(accessToken);
    console.log(`\n🎯 Tier: ${copilotInfo.tier.toUpperCase()}`);
    console.log(`📦 Available models: ${copilotInfo.models.length}`);

    // Step 6: Store account
    const accountData = loadAccounts();
    const accountId = generateAccountId(userInfo.login);
    const now = new Date().toISOString();

    // Determine monthly reset day (day of month when account was added)
    const resetDay = new Date().getDate();

    const newAccount = {
      id: accountId,
      name: accountName || `GitHub Copilot - ${userInfo.login}`,
      provider: 'github-copilot',
      username: userInfo.login,
      email: userInfo.email || null,
      tier: copilotInfo.tier,
      active: true,
      token: encrypt(accessToken),
      encrypted: true,
      models: copilotInfo.models,
      limits: copilotInfo.limits,
      addedAt: now,
      lastUsed: now,
      monthlyResetDay: resetDay,
      usageThisMonth: {},
      rateLimit: copilotInfo.tier === 'pro' ? 100 : 20,
      notes: `Added via device flow on ${new Date().toLocaleDateString()}`
    };

    accountData.accounts.push(newAccount);
    saveAccounts(accountData);

    console.log('\n==========================================');
    console.log('✅ ACCOUNT ADDED SUCCESSFULLY!');
    console.log('==========================================\n');
    console.log(`   Account ID: ${accountId}`);
    console.log(`   Username: ${userInfo.login}`);
    console.log(`   Tier: ${copilotInfo.tier}`);
    console.log(`   Models: ${copilotInfo.models.length} available`);
    console.log(`   Monthly reset: Day ${resetDay} of each month`);
    console.log('\n');

    return newAccount;
  } catch (error) {
    console.error('\n❌ Authentication failed:', error.message);
    throw error;
  }
}

/**
 * List all accounts
 */
function listAccounts() {
  const data = loadAccounts();

  if (data.accounts.length === 0) {
    console.log('📭 No accounts configured yet.');
    console.log('   Run: node github-auth-collector.js add');
    return;
  }

  console.log('\n📋 Configured Accounts:\n');
  console.log('==========================================\n');

  data.accounts.forEach((acc, index) => {
    const status = acc.active ? '✅' : '❌';
    const usage = Object.values(acc.usageThisMonth || {}).reduce((sum, val) => sum + val, 0);
    const totalLimit = Object.values(acc.limits || {}).reduce((sum, val) => sum + val, 0);

    console.log(`${index + 1}. ${acc.name}`);
    console.log(`   ID: ${acc.id}`);
    console.log(`   Status: ${status} ${acc.active ? 'Active' : 'Inactive'}`);
    console.log(`   Username: ${acc.username}`);
    console.log(`   Tier: ${acc.tier}`);
    console.log(`   Models: ${acc.models ? acc.models.length : 0} available`);
    console.log(`   Usage this month: ${usage} / ${totalLimit} requests`);
    console.log(`   Resets: Day ${acc.monthlyResetDay || 1} of each month`);
    console.log(`   Added: ${new Date(acc.addedAt).toLocaleDateString()}`);
    console.log('');
  });

  console.log('==========================================\n');
}

/**
 * Test account access
 */
async function testAccount(accountName) {
  const data = loadAccounts();

  let account = data.accounts.find(acc => acc.id === accountName || acc.username === accountName || acc.name === accountName);

  if (!account) {
    console.error(`❌ Account not found: ${accountName}`);
    console.log('   Use "list" command to see available accounts');
    process.exit(1);
  }

  console.log(`\n🧪 Testing account: ${account.name}\n`);
  console.log('==========================================\n');

  try {
    // Decrypt token
    const token = account.encrypted ? decrypt(account.token) : account.token;

    // Test user info
    console.log('1️⃣ Testing GitHub user access...');
    const userInfo = await fetchUserInfo(token);
    console.log(`   ✅ User: ${userInfo.login}`);
    console.log(`   Email: ${userInfo.email || 'Not public'}\n`);

    // Test Copilot access
    console.log('2️⃣ Testing GitHub Copilot API access...');
    const copilotInfo = await testCopilotAccess(token);
    console.log(`   ✅ Tier: ${copilotInfo.tier}`);
    console.log(`   ✅ Models: ${copilotInfo.models.length} available\n`);

    // Update account info if models changed
    if (JSON.stringify(account.models) !== JSON.stringify(copilotInfo.models)) {
      console.log('📝 Updating account model list...');
      account.models = copilotInfo.models;
      account.tier = copilotInfo.tier;
      account.limits = copilotInfo.limits;
      saveAccounts(data);
      console.log('   ✅ Account updated\n');
    }

    console.log('==========================================');
    console.log('✅ ALL TESTS PASSED!');
    console.log('==========================================\n');

    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 This account may have expired or been revoked.');
    console.log('   Consider removing it and adding a fresh account.\n');
    return false;
  }
}

/**
 * Remove account
 */
function removeAccount(accountName) {
  const data = loadAccounts();

  const index = data.accounts.findIndex(acc => 
    acc.id === accountName || acc.username === accountName || acc.name === accountName
  );

  if (index === -1) {
    console.error(`❌ Account not found: ${accountName}`);
    console.log('   Use "list" command to see available accounts');
    process.exit(1);
  }

  const account = data.accounts[index];

  // Confirm removal
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question(`\n⚠️  Remove account "${account.name}"? (yes/no): `, (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      data.accounts.splice(index, 1);
      saveAccounts(data);
      console.log(`\n✅ Account removed: ${account.name}\n`);
    } else {
      console.log('\n❌ Removal cancelled\n');
    }
    rl.close();
  });
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
GitHub Auth Collector - Device Flow Authentication

USAGE:
  node github-auth-collector.js <command> [options]

COMMANDS:
  add [name]           Add new GitHub account via device flow
  list                 List all configured accounts
  test <account>       Test account access and update info
  remove <account>     Remove an account

EXAMPLES:
  node github-auth-collector.js add
  node github-auth-collector.js add "Work Account"
  node github-auth-collector.js list
  node github-auth-collector.js test codermillat
  node github-auth-collector.js remove github-a1b2c3d4

ENVIRONMENT:
  ACCOUNT_ENCRYPTION_KEY    Encryption key for tokens (recommended)
  GITHUB_CLIENT_ID          Custom OAuth app client ID (optional)
`);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'add':
        await addAccount(args[1]);
        break;

      case 'list':
        listAccounts();
        break;

      case 'test':
        if (!args[1]) {
          console.error('❌ Account name required');
          console.log('   Usage: node github-auth-collector.js test <account>');
          process.exit(1);
        }
        await testAccount(args[1]);
        break;

      case 'remove':
        if (!args[1]) {
          console.error('❌ Account name required');
          console.log('   Usage: node github-auth-collector.js remove <account>');
          process.exit(1);
        }
        removeAccount(args[1]);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.error('   Run with --help for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  addAccount,
  listAccounts,
  testAccount,
  removeAccount,
  loadAccounts,
  encrypt,
  decrypt
};
