# GitHub Device Flow Authentication System - README

🚀 **Complete system for managing multiple GitHub Copilot Pro accounts with intelligent load balancing and monthly limit tracking.**

---

## 🎯 Quick Start

### 1. First Time Setup

```bash
# Interactive wizard (easiest method)
node setup-accounts.js

# Or add accounts individually
node github-auth-collector.js add "Work Account"
node github-auth-collector.js add "Personal Account"
```

### 2. Verify Accounts

```bash
# Test all accounts
node test-accounts.js

# Check account health
node account-health-check.js
```

### 3. Start Using

The system will automatically:
- ✅ Rotate between accounts intelligently
- ✅ Track monthly usage per model
- ✅ Reset counters on monthly reset dates
- ✅ Prefer accounts with more credits
- ✅ Handle rate limits gracefully

---

## 📦 What's Included

### Core Tools

| File | Purpose |
|------|---------|
| `github-auth-collector.js` | Add/remove/test accounts via device flow |
| `setup-accounts.js` | Interactive wizard for bulk account setup |
| `account-rotator.js` | Intelligent account rotation with monthly tracking |
| `test-accounts.js` | Verify all accounts and model access |
| `account-health-check.js` | Monitor usage, limits, and upcoming resets |

### Configuration

| File | Purpose |
|------|---------|
| `accounts.json.template` | Example account configuration |
| `accounts.json` | Your actual accounts (created during setup) |
| `rotation-state.json` | Runtime state (auto-generated) |

### Documentation

| File | Purpose |
|------|---------|
| `GITHUB-AUTH-GUIDE.md` | Complete step-by-step authentication guide |
| `README-GITHUB-AUTH.md` | This file |

---

## 🔐 GitHub Device Flow Authentication

### What is Device Flow?

A secure OAuth 2.0 method for CLI authentication:

1. CLI generates a device code
2. You visit `github.com/login/device` in browser
3. Enter the code shown
4. Approve access
5. CLI receives access token

**Benefits:**
- ✅ No manual token copy/paste
- ✅ More secure than PATs
- ✅ User-friendly
- ✅ Easy sequential multi-account setup

### Security Features

- 🔒 **AES-256-CBC encryption** for all tokens
- 🔑 **Custom encryption key** support via environment variable
- 📝 **No tokens in version control** (.gitignore configured)
- 🔄 **Token rotation** support
- 🛡️ **File permission** recommendations

---

## 📊 Features

### 1. Multi-Account Support

Manage unlimited GitHub Copilot accounts:
- Pro tier accounts for premium models
- Free tier accounts for basic models
- Intelligent rotation based on availability
- Load balancing across accounts

### 2. Monthly Limit Tracking

Each account tracks:
- **Per-model usage** (e.g., GPT-4o: 250/500)
- **Total monthly requests**
- **Reset day** (day of month when added)
- **Days until reset**
- **Remaining credits**

**Example:**
```
Account: Work Copilot
├─ gpt-4o: 120 / 500 (380 left)
├─ claude-sonnet-4.5: 50 / 1000 (950 left)
├─ o1-preview: 5 / 50 (45 left)
└─ Reset: 5 days (Feb 1st)
```

### 3. Intelligent Rotation

The rotator chooses accounts based on:
- ✅ **Remaining credits** (prefers accounts with more)
- ✅ **Failure rate** (avoids problematic accounts)
- ✅ **Recent usage** (distributes load evenly)
- ✅ **Model availability** (only accounts with requested model)
- ✅ **Tier preference** (Pro > Free)
- ✅ **Rate limits** (skips limited accounts)

### 4. Automatic Monthly Resets

The system automatically:
- Detects when monthly reset is due
- Clears usage counters
- Updates reset timestamp
- Logs reset actions

**Reset Logic:**
- Each account has a `monthlyResetDay` (1-31)
- System checks before every operation
- Resets happen automatically when due
- Manual reset check: `node account-rotator.js check-resets`

### 5. Health Monitoring

Visual health status for each account:

```
🟢 HEALTHY (0-49% used)
🟠 CAUTION (50-74% used)
🟡 WARNING (75-89% used)
🔴 CRITICAL (90%+ used)
```

With recommendations:
- "Reset coming soon. Safe to increase usage."
- "Approaching limit. Monitor closely."
- "URGENT: Near limit! Rotate to other accounts."

---

## 🛠️ Installation

### Prerequisites

- Node.js v16+
- GitHub account(s) with Copilot access
- Terminal access
- Web browser for authentication

### Setup Steps

1. **Clone or navigate to workspace**
   ```bash
   cd /home/openclaw/.openclaw/workspace
   ```

2. **Set encryption key** (recommended)
   ```bash
   export ACCOUNT_ENCRYPTION_KEY="your-super-secret-key-here"
   
   # Add to ~/.bashrc for persistence
   echo 'export ACCOUNT_ENCRYPTION_KEY="your-key"' >> ~/.bashrc
   ```

3. **Run setup wizard**
   ```bash
   node setup-accounts.js
   ```

4. **Verify installation**
   ```bash
   node test-accounts.js
   node account-health-check.js
   ```

---

## 📖 Usage Examples

### Adding Accounts

```bash
# Interactive wizard (recommended for multiple accounts)
node setup-accounts.js

# Add single account with custom name
node github-auth-collector.js add "Work Account"

# Add with default name
node github-auth-collector.js add
```

### Managing Accounts

```bash
# List all accounts
node github-auth-collector.js list

# Test specific account
node github-auth-collector.js test codermillat

# Remove account
node github-auth-collector.js remove github-abc123
```

### Rotation & Usage

```bash
# Show current account
node account-rotator.js current

# Get next account for specific model
node account-rotator.js next --model gpt-4o

# Record usage (done automatically by your app)
node account-rotator.js record \
  --account github-abc123 \
  --model gpt-4o \
  --tokens 1500

# View remaining credits
node account-rotator.js remaining

# Check all accounts status
node account-rotator.js status
```

### Health Monitoring

```bash
# Check health of all accounts
node account-health-check.js

# Check specific account
node account-health-check.js --account github-abc123

# JSON output for scripting
node account-health-check.js --json
```

### Testing

```bash
# Test all accounts
node test-accounts.js

# Test specific account
node test-accounts.js codermillat
```

### Monthly Resets

```bash
# Check and apply any pending resets
node account-rotator.js check-resets

# View days until reset for each account
node account-health-check.js
```

---

## 🔧 Configuration

### Account Structure

Each account in `accounts.json`:

```json
{
  "id": "github-abc123",
  "name": "Work Copilot",
  "provider": "github-copilot",
  "username": "codermillat",
  "email": "email@example.com",
  "tier": "pro",
  "active": true,
  "token": "encrypted_token_here",
  "encrypted": true,
  "models": ["gpt-4o", "claude-sonnet-4.5", "o1-preview"],
  "limits": {
    "gpt-4o": 500,
    "claude-sonnet-4.5": 1000,
    "o1-preview": 50
  },
  "usageThisMonth": {
    "gpt-4o": 120,
    "claude-sonnet-4.5": 50
  },
  "addedAt": "2026-01-31T15:10:00Z",
  "lastUsed": "2026-01-31T18:30:00Z",
  "lastMonthlyReset": "2026-01-31T00:00:00Z",
  "monthlyResetDay": 31,
  "rateLimit": 100
}
```

### Environment Variables

```bash
# Required for encryption (strongly recommended)
export ACCOUNT_ENCRYPTION_KEY="your-secret-key"

# Optional: custom OAuth app
export GITHUB_CLIENT_ID="your_custom_client_id"
```

---

## 🔒 Security

### Best Practices

1. **Set Encryption Key**
   ```bash
   export ACCOUNT_ENCRYPTION_KEY="$(openssl rand -base64 32)"
   ```

2. **Protect Files**
   ```bash
   chmod 600 accounts.json
   chmod 600 rotation-state.json
   ```

3. **Never Commit Secrets**
   - `accounts.json` is already in `.gitignore`
   - Double-check before commits

4. **Rotate Tokens Regularly**
   - Every 3-6 months
   - Use `remove` then `add` commands

5. **Monitor Access**
   - Check https://github.com/settings/security-log
   - Revoke unused tokens

### What's Encrypted

✅ **Encrypted:**
- GitHub access tokens (AES-256-CBC)
- Stored with unique IV per token

❌ **Not Encrypted:**
- Usernames
- Email addresses
- Model lists
- Usage statistics
- Metadata

---

## 🐛 Troubleshooting

### "Code Expired"

**Solution:** Just run the command again. Codes expire in 15 minutes.

```bash
node github-auth-collector.js add
```

---

### "No Models Available"

**Possible Causes:**
1. Account doesn't have Copilot subscription
2. Subscription not yet activated
3. Network/API issues

**Solutions:**
```bash
# Verify subscription
open https://github.com/settings/copilot

# Wait and try again (activation can take minutes)
sleep 300 && node github-auth-collector.js test account-name

# Check GitHub status
open https://www.githubstatus.com/
```

---

### "Token Decryption Failed"

**Cause:** Encryption key changed or corrupted data.

**Solution:**
```bash
# Backup
cp accounts.json accounts.json.backup

# Re-add accounts
node github-auth-collector.js remove account-name
node github-auth-collector.js add
```

---

### "No Available Accounts"

**Possible Causes:**
1. All accounts inactive
2. All accounts at monthly limit
3. No account has requested model

**Solutions:**
```bash
# Check health
node account-health-check.js

# Activate accounts
# Edit accounts.json and set "active": true

# Wait for monthly reset
node account-rotator.js check-resets

# Add more accounts
node setup-accounts.js
```

---

## 📈 Monthly Limits Reference

### Pro Tier (Typical)

| Model | Monthly Limit |
|-------|--------------|
| GPT-4o | 500 |
| GPT-4o-mini | 1,000 |
| Claude Sonnet 4.5 | 1,000 |
| Claude Haiku 3.5 | 1,000 |
| O1-Preview | 50 |
| O1-Mini | 100 |
| Gemini 2.0 Flash | 500 |

### Free Tier (Typical)

| Model | Monthly Limit |
|-------|--------------|
| GPT-4o-mini | 150 |
| Claude Haiku 3.5 | 150 |
| Gemini 2.0 Flash | 150 |

**Note:** Exact limits vary and are auto-detected during account setup.

---

## 🤝 Integration

### Using in Your Code

```javascript
const { getNextAccount, recordUsage } = require('./account-rotator');

// Get best account for a model
const account = getNextAccount({ 
  requireModel: 'gpt-4o',
  preferTier: 'pro'
});

console.log(`Using account: ${account.username}`);
console.log(`Token: ${account.token}`);

// Make your API call...
// ...

// Record usage
recordUsage(
  account.id,
  true, // success
  1500, // tokens used
  'gpt-4o' // model
);
```

### Automatic Monthly Resets

The system checks for resets automatically:
- Every time you call `getNextAccount()`
- When you run `check-resets` command
- During health checks

No manual intervention needed!

---

## 🎯 Advanced Features

### Custom OAuth App

1. Register at: https://github.com/settings/applications/new
2. Enable Device Flow
3. Set environment variable:
   ```bash
   export GITHUB_CLIENT_ID="your_client_id"
   ```

### Programmatic Account Management

```javascript
const collector = require('./github-auth-collector');

// Add account programmatically
await collector.addAccount('Custom Name');

// Test account
await collector.testAccount('username');

// Remove account
collector.removeAccount('github-abc123');
```

### Health Check API

```javascript
const health = require('./account-health-check');

// Analyze account health
const analysis = health.analyzeAccountHealth(account);

console.log(`Overall: ${analysis.overallPercentage}% used`);
console.log(`Health: ${analysis.overallHealth}`);
console.log(`Reset in: ${analysis.resetInfo.days} days`);
```

---

## 📝 File Permissions

Recommended permissions:

```bash
# Protect sensitive files
chmod 600 accounts.json
chmod 600 rotation-state.json

# Executable scripts
chmod 755 github-auth-collector.js
chmod 755 setup-accounts.js
chmod 755 test-accounts.js
chmod 755 account-health-check.js
chmod 755 account-rotator.js
```

---

## 🚀 Production Checklist

Before deploying to production:

- [ ] Set custom `ACCOUNT_ENCRYPTION_KEY`
- [ ] Add at least 2-3 accounts for redundancy
- [ ] Test all accounts: `node test-accounts.js`
- [ ] Verify health: `node account-health-check.js`
- [ ] Set proper file permissions (600 for sensitive files)
- [ ] Add accounts.json to .gitignore (already done)
- [ ] Document your encryption key securely
- [ ] Set up monitoring/alerts for low credits
- [ ] Plan for monthly reset cycles
- [ ] Test rotation logic: `node account-rotator.js next`

---

## 📚 Documentation

- **Full Guide:** [GITHUB-AUTH-GUIDE.md](./GITHUB-AUTH-GUIDE.md)
- **Account Structure:** [accounts.json.template](./accounts.json.template)
- **GitHub Device Flow Docs:** https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow

---

## 🆘 Getting Help

### Quick Diagnostics

```bash
# Check system status
node account-rotator.js status
node account-health-check.js
node test-accounts.js

# View configuration
node github-auth-collector.js list

# Check logs
cat rotation-state.json | jq
```

### Common Commands Help

```bash
node github-auth-collector.js --help
node setup-accounts.js --help
node account-rotator.js --help
```

---

## 📊 Example Output

### Successful Setup

```
╔════════════════════════════════════════════════════╗
║              SETUP COMPLETE! 🎉                    ║
╚════════════════════════════════════════════════════╝

📊 SUMMARY:

   ✅ Accounts added: 3
   🌟 Pro accounts: 3
   🎯 Unique models: 7
   📈 Total monthly requests: ~9,150

📋 ACCOUNTS:

   1. codermillat (pro)
      Models: 7 available
      Resets: Day 31 of each month

   2. work-account (pro)
      Models: 7 available
      Resets: Day 31 of each month

   3. personal (pro)
      Models: 7 available
      Resets: Day 31 of each month
```

---

## 🎉 You're All Set!

Your GitHub device flow authentication system is ready. The system will now:

✅ Automatically rotate between accounts  
✅ Track monthly usage per model  
✅ Reset counters when appropriate  
✅ Prefer accounts with more credits  
✅ Handle rate limits gracefully  
✅ Monitor account health  

**Next Steps:**
1. Integrate with your application
2. Monitor usage daily
3. Add more accounts as needed
4. Check health weekly

Happy coding! 🚀
