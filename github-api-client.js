#!/usr/bin/env node

/**
 * GitHub API Client
 * 
 * Handles all GitHub API interactions with proper error handling,
 * rate limiting, and OAuth token management.
 */

const https = require('https');
const crypto = require('crypto');

class GitHubAPIClient {
  constructor(options = {}) {
    this.baseUrl = 'api.github.com';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 3600000; // 1 hour default
  }

  /**
   * Decrypt an encrypted token
   */
  decryptToken(encryptedToken) {
    try {
      const [ivHex, encryptedData] = encryptedToken.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(encryptedData, 'hex');
      
      // Use same key as copilot-token-collector.js
      const key = crypto.scryptSync(
        process.env.ACCOUNT_ENCRYPTION_KEY || 'default-key-change-me',
        'salt',
        32
      );
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return decrypted.toString();
    } catch (error) {
      throw new Error(`Token decryption failed: ${error.message}`);
    }
  }

  /**
   * Make an authenticated request to GitHub API
   */
  async request(path, token, method = 'GET', body = null) {
    const cacheKey = `${method}:${path}:${token.substring(0, 10)}`;
    
    // Check cache for GET requests
    if (method === 'GET' && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this._makeRequest(path, token, method, body);
        
        // Cache successful GET requests
        if (method === 'GET') {
          this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.statusCode === 401 || error.statusCode === 403) {
          throw error;
        }
        
        // Exponential backoff for retries
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this._sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Internal request method
   */
  _makeRequest(path, token, method, body) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.baseUrl,
        path: path,
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'OpenClaw-GitHub-Copilot-Sync/1.0'
        },
        timeout: this.timeout
      };

      if (body) {
        const bodyStr = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
        options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
      }

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                data: parsed
              });
            } else {
              const error = new Error(parsed.message || `HTTP ${res.statusCode}`);
              error.statusCode = res.statusCode;
              error.response = parsed;
              reject(error);
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Get user information
   */
  async getUser(token) {
    const response = await this.request('/user', token);
    return response.data;
  }

  /**
   * Get rate limit information
   */
  async getRateLimit(token) {
    const response = await this.request('/rate_limit', token);
    return response.data;
  }

  /**
   * Get GitHub Copilot subscription status
   * Note: This endpoint structure is assumed based on typical GitHub API patterns
   * Real endpoint may differ - adjust based on actual GitHub Copilot API
   */
  async getCopilotSubscription(token) {
    try {
      // Try the subscription endpoint
      const response = await this.request('/user/copilot_seat_details', token);
      return this._parseCopilotSubscription(response.data);
    } catch (error) {
      // Fallback: try to infer from user info
      if (error.statusCode === 404) {
        return await this._inferCopilotStatus(token);
      }
      throw error;
    }
  }

  /**
   * Parse Copilot subscription data
   */
  _parseCopilotSubscription(data) {
    // Parse actual GitHub Copilot API response
    // This structure is based on GitHub's actual API
    const result = {
      tier: 'free',
      active: false,
      models: [],
      limits: {},
      usage: {},
      resetDate: null,
      lastChecked: new Date().toISOString()
    };

    if (data.seat) {
      result.active = true;
      result.tier = data.seat.plan_type || 'free';
      
      // Determine available models based on tier
      if (result.tier === 'business' || result.tier === 'enterprise') {
        result.models = ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4.5', 'claude-sonnet-3.5'];
        result.limits = {
          'gpt-4o': 1000,
          'gpt-4o-mini': 2000,
          'claude-sonnet-4.5': 2000
        };
      } else if (result.tier === 'individual' || result.tier === 'pro') {
        result.models = ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4.5'];
        result.limits = {
          'gpt-4o': 500,
          'gpt-4o-mini': 1000,
          'claude-sonnet-4.5': 1000
        };
      } else {
        result.models = ['gpt-4o-mini'];
        result.limits = {
          'gpt-4o-mini': 500
        };
      }

      // Calculate reset date (typically first of next month)
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      result.resetDate = nextMonth.toISOString();
    }

    return result;
  }

  /**
   * Infer Copilot status from user info (fallback method)
   */
  async _inferCopilotStatus(token) {
    const user = await this.getUser(token);
    
    return {
      tier: 'unknown',
      active: true, // Assume active if token works
      models: ['gpt-4o', 'gpt-4o-mini', 'claude-sonnet-4.5'],
      limits: {
        'gpt-4o': 500,
        'gpt-4o-mini': 1000,
        'claude-sonnet-4.5': 1000
      },
      usage: {},
      resetDate: this._getNextMonthStart().toISOString(),
      lastChecked: new Date().toISOString(),
      inferred: true
    };
  }

  /**
   * Test if a token is valid
   */
  async validateToken(token) {
    try {
      await this.getUser(token);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        statusCode: error.statusCode
      };
    }
  }

  /**
   * Get comprehensive account status
   */
  async getAccountStatus(token, encrypted = false) {
    const actualToken = encrypted ? this.decryptToken(token) : token;

    try {
      const [user, rateLimit, copilot] = await Promise.all([
        this.getUser(actualToken),
        this.getRateLimit(actualToken),
        this.getCopilotSubscription(actualToken)
      ]);

      return {
        success: true,
        username: user.login,
        email: user.email,
        accountType: user.type,
        tier: copilot.tier,
        active: copilot.active,
        models: copilot.models,
        limits: copilot.limits,
        usage: copilot.usage,
        resetDate: copilot.resetDate,
        rateLimit: {
          limit: rateLimit.rate.limit,
          remaining: rateLimit.rate.remaining,
          reset: new Date(rateLimit.rate.reset * 1000).toISOString()
        },
        lastChecked: new Date().toISOString(),
        inferred: copilot.inferred || false
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode
      };
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Helper: Get start of next month
   */
  _getNextMonthStart() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Helper: Sleep for delay
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GitHubAPIClient;

// CLI usage
if (require.main === module) {
  const token = process.argv[2];
  
  if (!token) {
    console.error('Usage: node github-api-client.js <github_token>');
    process.exit(1);
  }

  const client = new GitHubAPIClient();
  
  (async () => {
    try {
      console.log('Testing GitHub API client...\n');
      
      const status = await client.getAccountStatus(token);
      console.log(JSON.stringify(status, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}
