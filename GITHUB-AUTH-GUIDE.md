# GitHub Device Flow Authentication Guide

Complete guide for setting up multiple GitHub Copilot Pro accounts using device flow authentication.

## Table of Contents

- [Quick Start](#quick-start)
- [What is Device Flow?](#what-is-device-flow)
- [Prerequisites](#prerequisites)
- [Setup Methods](#setup-methods)
- [Manual Authentication](#manual-authentication)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [Monthly Limits & Resets](#monthly-limits--resets)
- [API Reference](#api-reference)

---

## Quick Start

The fastest way to set up multiple accounts:

```bash
# Interactive setup wizard (recommended)
node setup-accounts.js

# Or add accounts one by one
node github-auth-collector.js add "Work Account"
node github-auth-collector.js add "Personal Account"

# Verify all accounts
node test-accounts.js

# Check account health
node account-health-check.js
```

---

## What is Device Flow?

GitHub's device flow is an OAuth 2.0 flow designed for devices without browsers (like CLI tools). It works like this:

1. **Request Device Code**: Your CLI requests a device code from GitHub
2. **User Authorization**: You visit `github.com/login/device` in your browser
3. **Enter Code**: You enter the displayed code (e.g., `ABCD-1234`)
4. **Approve Access**: You review and approve the application
5. **Token Issued**: GitHub issues an access token to the CLI

**Benefits:**
- ✅ No need to manually copy/paste tokens
- ✅ More secure than personal access tokens
- ✅ User-friendly authentication flow
- ✅ Easy to authenticate multiple accounts sequentially

---

## Prerequisites

### 1. GitHub Accounts

You need:
- At least one GitHub account with Copilot access
- **Pro accounts recommended** for higher model limits
- Multiple accounts for load balancing (optional but recommended)

### 2. GitHub Copilot Subscription

Each account must have:
- Active GitHub Copilot subscription ($10/month for Pro)
- Or Copilot Free tier (limited to smaller models)

Check your subscription: https://github.com/settings/copilot

### 3. System Requirements

- Node.js v16+ installed
- Internet connection
- Access to a web browser
- Terminal/command line access

---

## Setup Methods

### Method 1: Interactive Wizard (Recommended)

Best for first-time setup or adding multiple accounts at once.

```bash
node setup-accounts.js
```

**What it does:**
1. Asks how many accounts you want to add
2. Guides you through device flow for each account
3. Tests all accounts after adding them
4. Displays a summary report
5. Offers to run health checks

**Example flow:**

```
╔════════════════════════════════════════════════════╗
║      GITHUB COPILOT ACCOUNT SETUP WIZARD          ║
╚════════════════════════════════════════════════════╝

How many GitHub Copilot accounts do you want to add? 2

✨ Great! Let's add 2 account(s).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 ADDING ACCOUNT 1 of 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name for this account: Work Account

==========================================
   GITHUB DEVICE AUTHENTICATION
==========================================

📱 Please complete authentication in your browser:

   1. Visit: https://github.com/login/device
   2. Enter code: ABCD-1234
   3. Approve access for OpenClaw

⏱️  Code expires in 15 minutes

🔄 Waiting for authentication...........

✅ Authentication successful!

👤 Fetching user information...
   Username: codermillat
   Email: email@example.com

🧪 Testing model access...
   ✓ gpt-4o
   ✓ gpt-4o-mini
   ✓ claude-sonnet-4.5
   ✓ o1-preview

🎯 Tier: PRO
📦 Available models: 7

✅ Account 1 added successfully!
```

---

### Method 2: Individual Account Addition

Best for adding accounts one at a time or when you only need one account.

```bash
# Add with custom name
node github-auth-collector.js add "Personal Copilot"

# Add with default name
node github-auth-collector.js add
```

---

### Method 3: Manual Token Configuration (Not Recommended)

If you prefer to manually configure tokens:

1. Generate a personal access token at: https://github.com/settings/tokens
2. Required scopes: `user:email`, `read:user`
3. Copy `accounts.json.template` to `accounts.json`
4. Paste your token in the `token` field
5. Set `encrypted: false`

**⚠️ Warning:** Manual tokens don't get the same testing and validation as device flow.

---

## Manual Authentication

### Step-by-Step Device Flow

If you want to understand what happens under the hood:

#### 1. Start Authentication

```bash
node github-auth-collector.js add
```

#### 2. You'll See This Screen

```
==========================================
   GITHUB DEVICE AUTHENTICATION
==========================================

📱 Please complete authentication in your browser:

   1. Visit: https://github.com/login/device
   2. Enter code: WXYZ-5678
   3. Approve access for OpenClaw

⏱️  Code expires in 15 minutes

🔄 Waiting for authentication.
```

#### 3. Open Your Browser

- Navigate to: https://github.com/login/device
- **Important:** Use the browser logged into the GitHub account you want to add

#### 4. Enter the Code

- Type the exact code shown (e.g., `WXYZ-5678`)
- Codes are case-insensitive
- They expire in 15 minutes

#### 5. Review Permissions

GitHub will show:
- **Application:** OpenClaw (or your OAuth app name)
- **Permissions requested:**
  - Read your email address
  - Read your user profile

#### 6. Authorize

Click "Authorize" or "Continue"

#### 7. Wait for Confirmation

Back in your terminal, you'll see:

```
✅ Authentication successful!

👤 Fetching user information...
   Username: your-username
   Email: your@email.com

🧪 Testing model access...
   ✓ gpt-4o-mini
   ✓ claude-sonnet-4.5
   ...

✅ ACCOUNT ADDED SUCCESSFULLY!
```

---

## Security Best Practices

### 1. Encryption Key

**Set a custom encryption key** (strongly recommended):

```bash
# Linux/Mac
export ACCOUNT_ENCRYPTION_KEY="your-super-secret-key-here"

# Windows (PowerShell)
$env:ACCOUNT_ENCRYPTION_KEY="your-super-secret-key-here"

# Add to your .bashrc or .zshrc for persistence
echo 'export ACCOUNT_ENCRYPTION_KEY="your-key"' >> ~/.bashrc
```

⚠️ Without this, tokens are encrypted with a default key (less secure).

### 2. File Permissions

Protect your accounts file:

```bash
# Restrict access to accounts.json
chmod 600 accounts.json

# Restrict access to entire workspace (optional)
chmod 700 ~/.openclaw/workspace/
```

### 3. Gitignore

Ensure sensitive files are never committed:

```bash
# Already in .gitignore, but verify:
cat .gitignore | grep accounts.json
# Should show:
# accounts.json
# rotation-state.json
```

### 4. Token Rotation

Regularly rotate tokens (every 3-6 months):

```bash
# Remove old account
node github-auth-collector.js remove old-account

# Add fresh account
node github-auth-collector.js add
```

### 5. Audit Logs

Check GitHub's security logs regularly:
- https://github.com/settings/security-log
- Look for OAuth authorizations
- Revoke unused tokens

---

## Troubleshooting

### Problem: "Code Expired"

**Cause:** You took more than 15 minutes to authorize.

**Solution:**
```bash
# Just run the command again
node github-auth-collector.js add
```

---

### Problem: "Access Denied"

**Cause:** You clicked "Cancel" or denied access.

**Solution:**
```bash
# Try again and click "Authorize" this time
node github-auth-collector.js add
```

---

### Problem: "Authentication Failed"

**Causes:**
- Network connectivity issues
- GitHub API temporarily down
- Wrong code entered

**Solutions:**
1. Check your internet connection
2. Verify GitHub status: https://www.githubstatus.com/
3. Ensure you typed the code correctly
4. Try again in a few minutes

---

### Problem: "No Models Available"

**Cause:** Account doesn't have Copilot access.

**Solution:**
1. Check your subscription: https://github.com/settings/copilot
2. Ensure billing is active
3. Wait a few minutes after subscribing (activation can take time)
4. Try re-authenticating

---

### Problem: "Account Already Exists"

**Cause:** You've already added this GitHub account.

**Solutions:**
```bash
# List accounts to see what's configured
node github-auth-collector.js list

# Remove duplicate if needed
node github-auth-collector.js remove username

# Add again
node github-auth-collector.js add
```

---

### Problem: "Token Decryption Failed"

**Cause:** Encryption key changed or corrupted data.

**Solution:**
```bash
# Backup current accounts
cp accounts.json accounts.json.backup

# Remove and re-add accounts
node github-auth-collector.js remove account-name
node github-auth-collector.js add
```

---

## Monthly Limits & Resets

### Understanding Monthly Limits

GitHub Copilot Pro accounts have **monthly request limits per model**:

| Model | Pro Tier | Free Tier |
|-------|----------|-----------|
| GPT-4o | ~500 | ❌ Not available |
| Claude Sonnet 4.5 | ~1000 | ❌ Not available |
| GPT-4o-mini | ~1000 | ~150 |
| O1-Preview | ~50 | ❌ Not available |
| O1-Mini | ~100 | ❌ Not available |
| Claude Haiku 3.5 | ~1000 | ~150 |

**Note:** Exact limits may vary and change. The system auto-detects limits.

---

### How Resets Work

1. **Reset Day**: Each account tracks the day of the month it was added
2. **Monthly Cycle**: Limits reset on that day each month
3. **Auto-Detection**: The system automatically detects when to reset
4. **Usage Tracking**: All requests are tracked per model

**Example:**
- Added account on January 15th
- Monthly reset day = 15
- Limits reset on February 15th, March 15th, etc.

---

### Check Reset Status

```bash
# View upcoming resets for all accounts
node account-health-check.js

# Manually trigger reset check
node account-rotator.js check-resets

# View remaining credits
node account-rotator.js remaining
```

---

### Usage Tracking

Every request is tracked:

```bash
# Record usage manually (for testing)
node account-rotator.js record \
  --account github-abc123 \
  --model gpt-4o \
  --tokens 1500

# Check remaining credits
node account-rotator.js remaining --account github-abc123

# View usage breakdown
node account-health-check.js --account github-abc123
```

---

## API Reference

### GitHub Device Flow Endpoints

#### 1. Request Device Code

```
POST https://github.com/login/device/code
Content-Type: application/json

{
  "client_id": "your_client_id",
  "scope": "user:email read:user"
}
```

**Response:**
```json
{
  "device_code": "3584d83530557fdd1f46af8289938c8ef79f9dc5",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://github.com/login/device",
  "expires_in": 900,
  "interval": 5
}
```

---

#### 2. Poll for Access Token

```
POST https://github.com/login/oauth/access_token
Content-Type: application/json

{
  "client_id": "your_client_id",
  "device_code": "device_code_from_step_1",
  "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
}
```

**Responses:**

**Pending:**
```json
{
  "error": "authorization_pending"
}
```

**Success:**
```json
{
  "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
  "token_type": "bearer",
  "scope": "user:email,read:user"
}
```

---

#### 3. Test User Access

```
GET https://api.github.com/user
Authorization: Bearer ACCESS_TOKEN
```

---

#### 4. Test Copilot Access

```
POST https://api.githubcopilot.com/chat/completions
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json

{
  "model": "gpt-4o",
  "messages": [{"role": "user", "content": "test"}],
  "max_tokens": 1
}
```

---

## CLI Command Reference

### github-auth-collector.js

```bash
# Add new account
node github-auth-collector.js add [name]

# List all accounts
node github-auth-collector.js list

# Test account
node github-auth-collector.js test <account-name>

# Remove account
node github-auth-collector.js remove <account-name>
```

---

### setup-accounts.js

```bash
# Interactive setup wizard
node setup-accounts.js
```

---

### test-accounts.js

```bash
# Test all accounts
node test-accounts.js

# Test specific account
node test-accounts.js <account-name>
```

---

### account-health-check.js

```bash
# Check all accounts
node account-health-check.js

# Check specific account
node account-health-check.js --account <id>

# JSON output
node account-health-check.js --json
```

---

### account-rotator.js

```bash
# Show current account
node account-rotator.js current

# Get next available account
node account-rotator.js next --model gpt-4o

# Show status
node account-rotator.js status

# Record usage
node account-rotator.js record \
  --account <id> \
  --model <model> \
  --tokens <num>

# Check monthly resets
node account-rotator.js check-resets

# View remaining credits
node account-rotator.js remaining
```

---

## Advanced Configuration

### Custom OAuth App

To use your own OAuth app:

1. Register app: https://github.com/settings/applications/new
2. Set **Authorization callback URL**: (not used for device flow)
3. Enable **Device Flow**
4. Copy your Client ID

Set environment variable:

```bash
export GITHUB_CLIENT_ID="your_custom_client_id"
```

---

### Custom Polling Interval

Default is 5 seconds. To change:

Edit `github-auth-collector.js`:

```javascript
const accessToken = await pollForAccessToken(deviceCode, 3); // 3 seconds
```

**⚠️ Warning:** GitHub rate limits aggressive polling.

---

## Getting Help

### Common Commands

```bash
# Show help for any tool
node github-auth-collector.js --help
node setup-accounts.js --help
node account-rotator.js --help

# View current configuration
node github-auth-collector.js list

# Check account health
node account-health-check.js

# Test connectivity
node test-accounts.js
```

### Logs & Debugging

Enable verbose logging:

```bash
# Set debug mode (add to your tools)
export DEBUG=1

# Run with verbose output
node github-auth-collector.js add --verbose
```

---

## Best Practices Summary

✅ **DO:**
- Use the interactive wizard for initial setup
- Set a custom encryption key
- Test accounts after adding them
- Monitor monthly usage with health checks
- Rotate accounts when approaching limits
- Add 2-3 accounts for redundancy

❌ **DON'T:**
- Commit `accounts.json` to version control
- Share your encryption key
- Use expired or revoked tokens
- Exceed monthly limits (system prevents this)
- Manually edit `accounts.json` (use CLI tools)

---

## Next Steps

After setting up accounts:

1. **Verify Setup**
   ```bash
   node test-accounts.js
   ```

2. **Check Health**
   ```bash
   node account-health-check.js
   ```

3. **Test Rotation**
   ```bash
   node account-rotator.js status
   node account-rotator.js next --model gpt-4o
   ```

4. **Monitor Usage**
   ```bash
   node account-health-check.js
   ```

5. **Schedule Regular Checks**
   - Add to cron or scheduled tasks
   - Run health checks daily
   - Monitor for resets

---

## Support

For issues or questions:
1. Check this guide first
2. Run diagnostic commands
3. Review error messages carefully
4. Check GitHub's status page
5. Consult OpenClaw documentation

Happy coding! 🚀
