#!/usr/bin/env node
/**
 * GitHub Copilot Account Monthly Reset Handler
 * 
 * Automatically resets usage counters on the 1st of each month
 * Can be run manually or via cron
 */

const fs = require('fs');
const path = require('path');

const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

function loadAccounts() {
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    console.error('❌ accounts.json not found');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'));
}

function saveAccounts(data) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
}

function shouldReset(account) {
  const now = new Date();
  const currentDay = now.getDate();
  const resetDay = account.monthlyResetDay || 1;
  
  // Reset on the configured day
  return currentDay === resetDay;
}

function resetAccount(account) {
  console.log(`🔄 Resetting ${account.username}...`);
  
  // Clear usage
  const oldUsage = { ...account.usageThisMonth };
  account.usageThisMonth = {};
  
  // Re-enable if was disabled due to limits
  if (account.tier === 'pro' && !account.active) {
    account.active = true;
    console.log(`   ✅ Re-enabled account (was disabled due to limit)`);
  }
  
  // Log what was reset
  const totalUsed = Object.values(oldUsage).reduce((a, b) => a + b, 0);
  if (totalUsed > 0) {
    console.log(`   📊 Reset ${totalUsed} total requests`);
    Object.entries(oldUsage).forEach(([model, count]) => {
      console.log(`      - ${model}: ${count} requests`);
    });
  } else {
    console.log(`   ✓ Already at 0 usage`);
  }
  
  return account;
}

function checkAndReset(force = false) {
  const data = loadAccounts();
  const now = new Date();
  const resetDate = now.toISOString().split('T')[0];
  
  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║   GitHub Copilot Monthly Reset                     ║`);
  console.log(`╚════════════════════════════════════════════════════╝\n`);
  console.log(`📅 Date: ${resetDate}\n`);
  
  let resetCount = 0;
  let skippedCount = 0;
  
  data.accounts = data.accounts.map(account => {
    if (force || shouldReset(account)) {
      resetAccount(account);
      resetCount++;
    } else {
      console.log(`⏭️  Skipping ${account.username} (reset day: ${account.monthlyResetDay || 1})`);
      skippedCount++;
    }
    return account;
  });
  
  saveAccounts(data);
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`✅ Reset complete:`);
  console.log(`   - Accounts reset: ${resetCount}`);
  console.log(`   - Accounts skipped: ${skippedCount}`);
  console.log(`\n🎯 All accounts ready for new month!\n`);
}

function showStatus() {
  const data = loadAccounts();
  const now = new Date();
  
  console.log(`\n╔════════════════════════════════════════════════════╗`);
  console.log(`║   GitHub Copilot Usage Status                      ║`);
  console.log(`╚════════════════════════════════════════════════════╝\n`);
  
  data.accounts.forEach((account, i) => {
    const totalUsage = Object.values(account.usageThisMonth).reduce((a, b) => a + b, 0);
    const totalLimit = Object.values(account.limits).reduce((a, b) => a + b, 0);
    const percentUsed = totalLimit > 0 ? ((totalUsage / totalLimit) * 100).toFixed(1) : 0;
    
    const statusIcon = account.active ? '🟢' : '🔴';
    const tierBadge = account.tier === 'pro' ? '⭐ PRO' : 'FREE';
    
    console.log(`${i + 1}. ${account.username} ${statusIcon} ${tierBadge}`);
    console.log(`   Usage: ${totalUsage}/${totalLimit} (${percentUsed}%)`);
    console.log(`   Reset day: ${account.monthlyResetDay || 1} of each month`);
    
    if (Object.keys(account.usageThisMonth).length > 0) {
      console.log(`   Models:`);
      Object.entries(account.usageThisMonth).forEach(([model, count]) => {
        const limit = account.limits[model] || 0;
        const pct = limit > 0 ? ((count / limit) * 100).toFixed(0) : 0;
        console.log(`      - ${model}: ${count}/${limit} (${pct}%)`);
      });
    }
    console.log(``);
  });
}

// CLI
const args = process.argv.slice(2);
const command = args[0];

if (command === 'status') {
  showStatus();
} else if (command === 'reset' || command === 'force-reset') {
  checkAndReset(command === 'force-reset');
} else if (command === 'check') {
  // Dry run - check if reset needed
  const data = loadAccounts();
  const needsReset = data.accounts.some(acc => shouldReset(acc));
  if (needsReset) {
    console.log('✅ Reset needed for some accounts');
    process.exit(0);
  } else {
    console.log('⏭️  No reset needed today');
    process.exit(1);
  }
} else {
  console.log(`
GitHub Copilot Monthly Reset Handler

Usage:
  node monthly-reset.js status        Show current usage
  node monthly-reset.js check         Check if reset needed
  node monthly-reset.js reset         Reset accounts (on reset day only)
  node monthly-reset.js force-reset   Force reset all accounts now

Examples:
  node monthly-reset.js status
  node monthly-reset.js reset
  `);
}
