#!/usr/bin/env node

/**
 * Usage Monitor
 * 
 * Proactive monitoring system for GitHub Copilot accounts
 * Tracks usage, generates alerts, and manages account health
 */

const fs = require('fs');
const path = require('path');

class UsageMonitor {
  constructor(options = {}) {
    this.thresholds = options.thresholds || {
      warning: 0.75,
      critical: 0.90,
      exhausted: 1.0
    };

    this.alertHistory = [];
    this.maxAlertHistory = options.maxAlertHistory || 100;
    this.alertCooldown = options.alertCooldown || 3600000; // 1 hour
    this.lastAlerts = new Map();
  }

  /**
   * Check all accounts and generate alerts
   */
  async checkAccounts(accounts) {
    const results = {
      timestamp: new Date().toISOString(),
      totalAccounts: accounts.length,
      activeAccounts: 0,
      healthyAccounts: 0,
      warningAccounts: 0,
      criticalAccounts: 0,
      exhaustedAccounts: 0,
      alerts: [],
      recommendations: []
    };

    for (const account of accounts) {
      const check = this._checkAccount(account);
      
      results.activeAccounts += check.active ? 1 : 0;
      
      switch (check.status) {
        case 'healthy':
          results.healthyAccounts++;
          break;
        case 'warning':
          results.warningAccounts++;
          break;
        case 'critical':
          results.criticalAccounts++;
          break;
        case 'exhausted':
          results.exhaustedAccounts++;
          break;
      }

      // Generate alerts
      if (check.alerts.length > 0) {
        check.alerts.forEach(alert => {
          const alertObj = {
            accountId: account.id,
            username: account.username,
            level: alert.level,
            message: alert.message,
            model: alert.model,
            usage: alert.usage,
            timestamp: new Date().toISOString()
          };

          if (this._shouldAlert(alertObj)) {
            results.alerts.push(alertObj);
            this._recordAlert(alertObj);
          }
        });
      }

      // Add recommendations
      if (check.recommendations.length > 0) {
        results.recommendations.push({
          accountId: account.id,
          username: account.username,
          recommendations: check.recommendations
        });
      }
    }

    return results;
  }

  /**
   * Check individual account
   */
  _checkAccount(account) {
    const result = {
      active: account.active,
      status: 'healthy',
      alerts: [],
      recommendations: []
    };

    if (!account.active) {
      return result;
    }

    // Check each model's usage
    if (account.models && account.limits && account.usageThisMonth) {
      let maxUsage = 0;

      account.models.forEach(model => {
        const used = account.usageThisMonth[model] || 0;
        const limit = account.limits[model] || 1;
        const usage = Math.min(used / limit, 1.0);

        maxUsage = Math.max(maxUsage, usage);

        // Generate alerts based on thresholds
        if (usage >= this.thresholds.exhausted) {
          result.status = 'exhausted';
          result.alerts.push({
            level: 'exhausted',
            message: `Model ${model} limit reached`,
            model,
            usage: usage,
            used,
            limit
          });
          result.recommendations.push(`Disable account or wait for monthly reset`);
        } else if (usage >= this.thresholds.critical) {
          if (result.status === 'healthy') result.status = 'critical';
          result.alerts.push({
            level: 'critical',
            message: `Model ${model} at ${Math.round(usage * 100)}% usage`,
            model,
            usage: usage,
            used,
            limit
          });
          result.recommendations.push(`Minimize usage of ${model}, prepare fallback account`);
        } else if (usage >= this.thresholds.warning) {
          if (result.status === 'healthy') result.status = 'warning';
          result.alerts.push({
            level: 'warning',
            message: `Model ${model} at ${Math.round(usage * 100)}% usage`,
            model,
            usage: usage,
            used,
            limit
          });
          result.recommendations.push(`Monitor ${model} usage closely`);
        }
      });
    }

    // Check sync status
    if (account.lastSynced) {
      const hoursSinceSync = (Date.now() - new Date(account.lastSynced).getTime()) / 3600000;
      
      if (hoursSinceSync > 72) {
        result.alerts.push({
          level: 'warning',
          message: `Not synced for ${Math.round(hoursSinceSync)} hours`,
          model: null,
          usage: null
        });
        result.recommendations.push('Run sync to update usage data');
      }
    } else {
      result.alerts.push({
        level: 'info',
        message: 'Account never synced',
        model: null,
        usage: null
      });
      result.recommendations.push('Run initial sync');
    }

    // Check for errors
    if (account.errors && account.errors.length > 0) {
      result.alerts.push({
        level: 'warning',
        message: `${account.errors.length} error(s) recorded`,
        model: null,
        usage: null
      });
      result.recommendations.push('Check error logs and validate token');
    }

    return result;
  }

  /**
   * Check if alert should be sent (considering cooldown)
   */
  _shouldAlert(alert) {
    const key = `${alert.accountId}:${alert.model}:${alert.level}`;
    const lastAlert = this.lastAlerts.get(key);

    if (!lastAlert) {
      return true;
    }

    const timeSinceLastAlert = Date.now() - lastAlert;
    return timeSinceLastAlert >= this.alertCooldown;
  }

  /**
   * Record alert in history
   */
  _recordAlert(alert) {
    const key = `${alert.accountId}:${alert.model}:${alert.level}`;
    this.lastAlerts.set(key, Date.now());

    this.alertHistory.push(alert);

    // Trim history if too long
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory.slice(-this.maxAlertHistory);
    }
  }

  /**
   * Get alert summary
   */
  getAlertSummary() {
    const now = Date.now();
    const last24h = this.alertHistory.filter(a => 
      now - new Date(a.timestamp).getTime() < 86400000
    );

    const byLevel = {
      exhausted: last24h.filter(a => a.level === 'exhausted').length,
      critical: last24h.filter(a => a.level === 'critical').length,
      warning: last24h.filter(a => a.level === 'warning').length,
      info: last24h.filter(a => a.level === 'info').length
    };

    return {
      total: last24h.length,
      byLevel,
      recent: this.alertHistory.slice(-10)
    };
  }

  /**
   * Auto-manage accounts based on usage
   */
  autoManageAccounts(accounts) {
    const updates = [];

    accounts.forEach(account => {
      if (!account.active) return;

      // Check if account should be disabled
      const shouldDisable = this._shouldDisableAccount(account);
      
      if (shouldDisable.disable) {
        updates.push({
          accountId: account.id,
          username: account.username,
          action: 'disable',
          reason: shouldDisable.reason,
          previousState: { active: account.active }
        });
      }

      // Check if account should be re-enabled
      const shouldEnable = this._shouldEnableAccount(account);
      
      if (shouldEnable.enable) {
        updates.push({
          accountId: account.id,
          username: account.username,
          action: 'enable',
          reason: shouldEnable.reason,
          previousState: { active: account.active }
        });
      }
    });

    return updates;
  }

  /**
   * Check if account should be disabled
   */
  _shouldDisableAccount(account) {
    if (!account.active) {
      return { disable: false };
    }

    // Disable if all models exhausted
    if (account.models && account.limits && account.usageThisMonth) {
      const allExhausted = account.models.every(model => {
        const used = account.usageThisMonth[model] || 0;
        const limit = account.limits[model] || 1;
        return used >= limit;
      });

      if (allExhausted) {
        return {
          disable: true,
          reason: 'All model limits reached'
        };
      }
    }

    // Disable if token validation failed repeatedly
    if (account.errors && account.errors.length >= 5) {
      const recentErrors = account.errors.slice(-5);
      const authErrors = recentErrors.filter(e => 
        e.includes('401') || e.includes('403') || e.includes('authentication')
      );
      
      if (authErrors.length >= 3) {
        return {
          disable: true,
          reason: 'Repeated authentication failures'
        };
      }
    }

    return { disable: false };
  }

  /**
   * Check if account should be enabled
   */
  _shouldEnableAccount(account) {
    if (account.active) {
      return { enable: false };
    }

    // Re-enable if usage has been reset
    if (account.usageThisMonth && account.resetDate) {
      const now = new Date();
      const resetDate = new Date(account.resetDate);
      
      if (now >= resetDate) {
        // Check if usage has actually been reset (should be near 0)
        const totalUsage = Object.values(account.usageThisMonth).reduce((sum, val) => sum + val, 0);
        
        if (totalUsage < 10) { // Arbitrary low threshold
          return {
            enable: true,
            reason: 'Monthly reset detected, usage cleared'
          };
        }
      }
    }

    return { enable: false };
  }

  /**
   * Generate health report
   */
  generateHealthReport(accounts) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: accounts.length,
        active: 0,
        healthy: 0,
        warning: 0,
        critical: 0,
        exhausted: 0
      },
      accounts: []
    };

    accounts.forEach(account => {
      const check = this._checkAccount(account);
      
      report.summary.active += check.active ? 1 : 0;
      report.summary[check.status]++;

      const accountReport = {
        id: account.id,
        username: account.username,
        active: account.active,
        status: check.status,
        models: {}
      };

      if (account.models && account.limits && account.usageThisMonth) {
        account.models.forEach(model => {
          const used = account.usageThisMonth[model] || 0;
          const limit = account.limits[model] || 1;
          const usage = Math.min(used / limit, 1.0);

          accountReport.models[model] = {
            used,
            limit,
            usage: Math.round(usage * 100),
            remaining: limit - used
          };
        });
      }

      accountReport.alerts = check.alerts.map(a => a.message);
      accountReport.recommendations = check.recommendations;

      report.accounts.push(accountReport);
    });

    return report;
  }

  /**
   * Save monitoring state
   */
  saveState(filePath) {
    const state = {
      alertHistory: this.alertHistory,
      lastAlerts: Array.from(this.lastAlerts.entries()),
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
  }

  /**
   * Load monitoring state
   */
  loadState(filePath) {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    this.alertHistory = state.alertHistory || [];
    this.lastAlerts = new Map(state.lastAlerts || []);
  }
}

module.exports = UsageMonitor;

// CLI usage
if (require.main === module) {
  const accountsPath = process.argv[2] || path.join(__dirname, 'accounts.json');

  try {
    const data = JSON.parse(fs.readFileSync(accountsPath, 'utf8'));
    const monitor = new UsageMonitor();

    (async () => {
      console.log('GitHub Copilot Usage Monitor\n');
      console.log('━'.repeat(60));

      const results = await monitor.checkAccounts(data.accounts);

      console.log(`\n📊 SUMMARY (${results.timestamp})`);
      console.log(`   Total Accounts: ${results.totalAccounts}`);
      console.log(`   Active: ${results.activeAccounts}`);
      console.log(`   ✓ Healthy: ${results.healthyAccounts}`);
      console.log(`   ⚠ Warning: ${results.warningAccounts}`);
      console.log(`   ‼ Critical: ${results.criticalAccounts}`);
      console.log(`   ✗ Exhausted: ${results.exhaustedAccounts}`);

      if (results.alerts.length > 0) {
        console.log(`\n🚨 ALERTS (${results.alerts.length})`);
        results.alerts.forEach(alert => {
          const icon = {
            exhausted: '✗',
            critical: '‼',
            warning: '⚠',
            info: 'ℹ'
          }[alert.level] || '•';

          console.log(`   ${icon} [${alert.level.toUpperCase()}] ${alert.username}`);
          console.log(`     ${alert.message}`);
          if (alert.usage !== null) {
            console.log(`     Usage: ${alert.usage.toFixed(1)}% (${alert.used}/${alert.limit})`);
          }
        });
      }

      if (results.recommendations.length > 0) {
        console.log(`\n💡 RECOMMENDATIONS`);
        results.recommendations.forEach(rec => {
          console.log(`   ${rec.username}:`);
          rec.recommendations.forEach(r => {
            console.log(`     → ${r}`);
          });
        });
      }

      console.log('\n' + '━'.repeat(60));

      // Auto-management
      const updates = monitor.autoManageAccounts(data.accounts);
      
      if (updates.length > 0) {
        console.log(`\n🔧 AUTO-MANAGEMENT SUGGESTIONS (${updates.length})`);
        updates.forEach(update => {
          console.log(`   ${update.action.toUpperCase()}: ${update.username}`);
          console.log(`   Reason: ${update.reason}`);
        });
      }

    })();

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
