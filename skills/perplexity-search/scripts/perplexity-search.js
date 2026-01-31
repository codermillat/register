#!/usr/bin/env node
/**
 * Perplexity Search - Node.js API
 * Programmatic interface for OpenClaw and other tools
 */

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

class PerplexitySearch {
  constructor(options = {}) {
    this.loadConfig();
    
    // Override with options
    if (options.apiKey) this.apiKey = options.apiKey;
    if (options.model) this.model = options.model;
    if (options.maxTokens) this.maxTokens = options.maxTokens;
    if (options.temperature) this.temperature = options.temperature;
    
    this.baseUrl = 'api.perplexity.ai';
    this.usageFile = path.join(os.homedir(), '.config/perplexity/usage.json');
  }

  loadConfig() {
    const configPath = path.join(os.homedir(), '.config/perplexity/credentials.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      this.apiKey = config.api_key;
      this.model = config.model || 'sonar';
      this.maxTokens = config.max_tokens || 1000;
      this.temperature = config.temperature || 0.2;
    } else if (process.env.PERPLEXITY_API_KEY) {
      this.apiKey = process.env.PERPLEXITY_API_KEY;
      this.model = 'sonar';
      this.maxTokens = 1000;
      this.temperature = 0.2;
    } else {
      throw new Error('No Perplexity API key found. Run: ./scripts/setup.sh');
    }
  }

  async makeRequest(messages, model = null) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        model: model || this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        return_citations: true,
        return_images: false
      });

      const options = {
        hostname: this.baseUrl,
        port: 443,
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            
            if (response.error) {
              reject(new Error(response.error.message || response.error));
            } else {
              resolve(response);
            }
          } catch (err) {
            reject(new Error(`Failed to parse response: ${err.message}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(payload);
      req.end();
    });
  }

  trackUsage(tokens, cost, query) {
    try {
      let usage = { total_queries: 0, total_tokens: 0, estimated_cost: 0, queries: [] };
      
      if (fs.existsSync(this.usageFile)) {
        usage = JSON.parse(fs.readFileSync(this.usageFile, 'utf8'));
      }
      
      usage.total_queries += 1;
      usage.total_tokens += tokens;
      usage.estimated_cost += cost;
      usage.queries.push({
        timestamp: new Date().toISOString(),
        query: query.substring(0, 100),
        tokens: tokens,
        cost: cost
      });
      
      // Keep only last 100 queries
      if (usage.queries.length > 100) {
        usage.queries = usage.queries.slice(-100);
      }
      
      fs.writeFileSync(this.usageFile, JSON.stringify(usage, null, 2));
    } catch (err) {
      // Silently fail on usage tracking errors
      console.error('Warning: Failed to track usage:', err.message);
    }
  }

  calculateCost(tokens, model) {
    const rates = {
      'sonar': 0.002,
      'sonar-pro': 0.01,
      'sonar-reasoning': 0.02
    };
    
    const rate = rates[model] || 0.002;
    return (tokens * rate) / 1000;
  }

  async search(query, options = {}) {
    const messages = [
      {
        role: 'system',
        content: options.systemPrompt || 'You are a helpful search assistant. Provide accurate, concise answers with citations when available.'
      },
      {
        role: 'user',
        content: query
      }
    ];

    const response = await this.makeRequest(messages, options.model);
    
    const result = {
      answer: response.choices[0].message.content,
      citations: response.citations || [],
      usage: response.usage || { total_tokens: 0 }
    };
    
    const tokens = result.usage.total_tokens || 0;
    const cost = this.calculateCost(tokens, options.model || this.model);
    
    this.trackUsage(tokens, cost, query);
    
    result.tokens = tokens;
    result.cost = cost;
    
    return result;
  }

  async research(query, options = {}) {
    const systemPrompt = 'You are a research assistant. Provide comprehensive, well-cited answers. Include multiple sources and cite them inline using [1], [2], etc. format. After your answer, list all citations with full URLs.';
    
    return this.search(query, {
      ...options,
      systemPrompt: systemPrompt,
      model: options.model || 'sonar-pro'
    });
  }

  async factCheck(query, options = {}) {
    const systemPrompt = 'You are a fact-checker. Verify the claim and provide: 1) TRUE/FALSE/MIXED verdict, 2) explanation with evidence, 3) credible sources. Be objective and cite authoritative sources.';
    
    const result = await this.search(`Fact-check this claim: ${query}`, {
      ...options,
      systemPrompt: systemPrompt
    });
    
    // Try to extract verdict
    const content = result.answer.toLowerCase();
    if (content.includes('true') && !content.includes('false')) {
      result.verdict = 'TRUE';
    } else if (content.includes('false') && !content.includes('true')) {
      result.verdict = 'FALSE';
    } else {
      result.verdict = 'MIXED';
    }
    
    return result;
  }

  async compare(query, options = {}) {
    const systemPrompt = 'You are a comparison analyst. Provide a balanced comparison covering: 1) key differences, 2) pros/cons of each, 3) use cases, 4) recommendation based on context. Use a clear structure with citations.';
    
    return this.search(query, {
      ...options,
      systemPrompt: systemPrompt,
      model: options.model || 'sonar-pro'
    });
  }

  getUsage() {
    if (!fs.existsSync(this.usageFile)) {
      return {
        total_queries: 0,
        total_tokens: 0,
        estimated_cost: 0,
        queries: []
      };
    }
    
    return JSON.parse(fs.readFileSync(this.usageFile, 'utf8'));
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: perplexity-search.js <command> <query>');
    console.log('');
    console.log('Commands:');
    console.log('  search <query>      - Basic search');
    console.log('  research <query>    - Research with citations');
    console.log('  fact <query>        - Fact-check a claim');
    console.log('  compare <query>     - Compare A vs B');
    console.log('  usage               - Show usage stats');
    process.exit(0);
  }
  
  const command = args[0];
  const query = args.slice(1).join(' ');
  
  const pplx = new PerplexitySearch();
  
  (async () => {
    try {
      switch (command) {
        case 'search':
          const searchResult = await pplx.search(query);
          console.log(JSON.stringify(searchResult, null, 2));
          break;
          
        case 'research':
          const researchResult = await pplx.research(query);
          console.log(JSON.stringify(researchResult, null, 2));
          break;
          
        case 'fact':
          const factResult = await pplx.factCheck(query);
          console.log(JSON.stringify(factResult, null, 2));
          break;
          
        case 'compare':
          const compareResult = await pplx.compare(query);
          console.log(JSON.stringify(compareResult, null, 2));
          break;
          
        case 'usage':
          const usage = pplx.getUsage();
          console.log(JSON.stringify(usage, null, 2));
          break;
          
        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  })();
}

module.exports = PerplexitySearch;
