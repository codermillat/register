#!/usr/bin/env node

/**
 * OpenClaw Integration Middleware
 * 
 * Integrates GitHub Copilot sync system with OpenClaw
 * Provides automatic account selection and rotation
 */

const GitHubCopilotSync = require('./github-copilot-sync');
const fs = require('fs');
const path = require('path');

class OpenClawIntegration {
  constructor(options = {}) {
    this.sync = new GitHubCopilotSync(options);
    this.accountsPath = options.accountsPath || path.join(__dirname, 'accounts.json');
    this.cachePath = options.cachePath || path.join(__dirname, '.openclaw-cache.json');
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
    this.autoSync = options.autoSync !== false;
    this.autoSyncInterval = options.autoSyncInterval || 14400000; // 4 hours
    this.lastAutoSync = 0;
  }

  /**
   * Get account for model request
   * This is the main integration point for OpenClaw
   */
  async getAccountForRequest(model, options = {}) {
    const taskComplexity = options.complexity || this._inferComplexity(options);
    const forceSync = options.forceSync || false;

    // Auto-sync if needed
    if (this.autoSync) {
      await this._autoSyncIfNeeded(forceSync);
    }

    // Select best account
    const result = this.sync.selectAccount(model, taskComplexity);

    if (!result.success) {
      // Try to sync and retry once
      await this.sync.syncAllAccounts({ quiet: true, force: true });
      const retryResult = this.sync.selectAccount(model, taskComplexity);
      
      if (!retryResult.success) {
        throw new Error(`No available accounts for model ${model}: ${retryResult.error}`);
      }
      
      return this._formatAccountResponse(retryResult, model);
    }

    return this._formatAccountResponse(result, model);
  }

  /**
   * Increment usage for an account after a successful request
   */
  async recordUsage(accountId, model, tokensUsed = 1) {
    const data = this._loadAccounts();
    const account = data.accounts.find(a => a.id === accountId);

    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // Initialize usage if needed
    if (!account.usageThisMonth) {
      account.usageThisMonth = {};
    }

    // Increment usage
    account.usageThisMonth[model] = (account.usageThisMonth[model] || 0) + 1;

    // Update last used
    account.lastUsed = new Date().toISOString();

    // Increment request counter
    account.totalRequests = (account.totalRequests || 0) + 1;

    // Save
    this._saveAccounts(data);

    // Check if we should alert
    this._checkUsageAlerts(account, model);

    return {
      success: true,
      accountId,
      model,
      currentUsage: account.usageThisMonth[model],
      limit: account.limits[model] || 0
    };
  }

  /**
   * Record a failed request
   */
  async recordFailure(accountId, model, error) {
    const data = this._loadAccounts();
    const account = data.accounts.find(a => a.id === accountId);

    if (!account) {
      return;
    }

    // Record error
    if (!account.errors) {
      account.errors = [];
    }

    account.errors.push({
      timestamp: new Date().toISOString(),
      model,
      message: error
    });

    // Keep only last 20 errors
    account.errors = account.errors.slice(-20);

    // Disable if too many failures
    const recentErrors = account.errors.slice(-5);
    const authErrors = recentErrors.filter(e => 
      e.message.includes('401') || 
      e.message.includes('403') || 
      e.message.includes('authentication')
    ).length;

    if (authErrors >= 3) {
      account.active = false;
      account.notes = `Auto-disabled: ${authErrors} authentication failures`;
      this._alert(`Account ${account.username} disabled due to repeated auth failures`);
    }

    this._saveAccounts(data);
  }

  /**
   * Get current system status
   */
  async getSystemStatus() {
    return await this.sync.getStatus();
  }

  /**
   * Force sync all accounts
   */
  async forceSyncAll() {
    return await this.sync.syncAllAccounts({ quiet: false, force: true });
  }

  /**
   * Run monitoring checks
   */
  async runMonitoring() {
    return await this.sync.monitor();
  }

  /**
   * Auto-sync if needed
   */
  async _autoSyncIfNeeded(force = false) {
    const now = Date.now();
    
    if (force || (now - this.lastAutoSync) >= this.autoSyncInterval) {
      try {
        await this.sync.syncAllAccounts({ quiet: true, force });
        this.lastAutoSync = now;
      } catch (error) {
        console.error('Auto-sync failed:', error.message);
      }
    }
  }

  /**
   * Infer task complexity from options
   */
  _inferComplexity(options) {
    // Check for hints in the request
    if (options.promptLength) {
      if (options.promptLength > 2000) return 'complex';
      if (options.promptLength < 500) return 'simple';
    }

    if (options.maxTokens) {
      if (options.maxTokens > 2000) return 'complex';
      if (options.maxTokens < 500) return 'simple';
    }

    if (options.temperature) {
      if (options.temperature > 0.8) return 'complex'; // Creative tasks
      if (options.temperature < 0.3) return 'simple'; // Factual tasks
    }

    return 'medium';
  }

  /**
   * Format account response for OpenClaw
   */
  _formatAccountResponse(result, model) {
    const account = result.account;
    
    return {
      success: true,
      account: {
        id: account.id,
        username: account.username,
        provider: account.provider,
        token: account.token,
        encrypted: account.encrypted,
        tier: account.tier
      },
      model: model,
      usage: {
        current: account.usageThisMonth[model] || 0,
        limit: account.limits[model] || 0,
        percentage: this._getUsagePercentage(account, model)
      },
      selectionInfo: {
        score: result.score,
        reason: result.reason,
        alternatives: result.alternatives
      }
    };
  }

  /**
   * Get usage percentage for a model
   */
  _getUsagePercentage(account, model) {
    if (!account.usageThisMonth || !account.limits) return 0;
    
    const used = account.usageThisMonth[model] || 0;
    const limit = account.limits[model] || 1;
    
    return Math.round((used / limit) * 100);
  }

  /**
   * Check usage and generate alerts
   */
  _checkUsageAlerts(account, model) {
    const percentage = this._getUsagePercentage(account, model);
    
    if (percentage >= 100) {
      this._alert(`🚨 EXHAUSTED: ${account.username} - ${model} limit reached (100%)`);
    } else if (percentage >= 90) {
      this._alert(`⚠️ CRITICAL: ${account.username} - ${model} at ${percentage}% usage`);
    } else if (percentage >= 75) {
      this._alert(`⚠️ WARNING: ${account.username} - ${model} at ${percentage}% usage`);
    }
  }

  /**
   * Send alert (can be customized for Telegram, etc.)
   */
  _alert(message) {
    console.log(`[ALERT] ${message}`);
    
    // TODO: Integrate with OpenClaw event system
    // Could send to main session, Telegram, etc.
  }

  /**
   * Load accounts
   */
  _loadAccounts() {
    return JSON.parse(fs.readFileSync(this.accountsPath, 'utf8'));
  }

  /**
   * Save accounts
   */
  _saveAccounts(data) {
    fs.writeFileSync(this.accountsPath, JSON.stringify(data, null, 2));
  }

  /**
   * Get cache
   */
  _getCache() {
    if (!fs.existsSync(this.cachePath)) {
      return {};
    }
    
    try {
      return JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
    } catch {
      return {};
    }
  }

  /**
   * Save cache
   */
  _saveCache(cache) {
    fs.writeFileSync(this.cachePath, JSON.stringify(cache, null, 2));
  }
}

module.exports = OpenClawIntegration;

// CLI usage example
if (require.main === module) {
  const integration = new OpenClawIntegration();

  (async () => {
    try {
      console.log('Testing OpenClaw Integration\n');
      
      // Get account for a request
      console.log('1. Getting account for claude-sonnet-4.5...');
      const result = await integration.getAccountForRequest('claude-sonnet-4.5', {
        complexity: 'medium'
      });
      
      console.log('   Selected:', result.account.username);
      console.log('   Usage:', `${result.usage.current}/${result.usage.limit} (${result.usage.percentage}%)`);
      console.log('   Reason:', result.selectionInfo.reason);
      
      // Record usage
      console.log('\n2. Recording usage...');
      const recordResult = await integration.recordUsage(result.account.id, 'claude-sonnet-4.5');
      console.log('   New usage:', `${recordResult.currentUsage}/${recordResult.limit}`);
      
      // Get system status
      console.log('\n3. Getting system status...');
      const status = await integration.getSystemStatus();
      console.log('   Active accounts:', status.summary.active);
      console.log('   Healthy:', status.summary.healthy);
      console.log('   Warning:', status.summary.warning);
      console.log('   Critical:', status.summary.critical);
      
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
