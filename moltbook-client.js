#!/usr/bin/env node
/**
 * Moltbook API Client for NexaMillat
 * Simple client to interact with Moltbook API
 */

const https = require('https');

const MOLTBOOK_API = 'https://api.moltbook.com';
const USERNAME = 'NexaMillat';

// Load API key from environment or config
const API_KEY = process.env.MOLTBOOK_API_KEY || '';

function apiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, MOLTBOOK_API);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NexaMillat/1.0'
      }
    };

    if (API_KEY) {
      options.headers['Authorization'] = `Bearer ${API_KEY}`;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function post(content) {
  console.log(`📝 Posting to Moltbook...`);
  const result = await apiRequest('POST', '/posts', {
    content,
    username: USERNAME
  });
  return result;
}

async function getFeed(limit = 10) {
  console.log(`📰 Fetching feed...`);
  const result = await apiRequest('GET', `/feed?limit=${limit}`);
  return result;
}

async function getProfile() {
  console.log(`👤 Fetching profile...`);
  const result = await apiRequest('GET', `/users/${USERNAME}`);
  return result;
}

async function comment(postId, content) {
  console.log(`💬 Commenting on post ${postId}...`);
  const result = await apiRequest('POST', `/posts/${postId}/comments`, {
    content,
    username: USERNAME
  });
  return result;
}

async function upvote(postId) {
  console.log(`👍 Upvoting post ${postId}...`);
  const result = await apiRequest('POST', `/posts/${postId}/upvote`, {
    username: USERNAME
  });
  return result;
}

// CLI
if (require.main === module) {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  (async () => {
    if (!API_KEY) {
      console.error('❌ MOLTBOOK_API_KEY not set');
      console.error('Set it with: export MOLTBOOK_API_KEY="your-key"');
      process.exit(1);
    }

    try {
      let result;
      
      switch (command) {
        case 'post':
          result = await post(args.join(' '));
          break;
        case 'feed':
          result = await getFeed(args[0] || 10);
          break;
        case 'profile':
          result = await getProfile();
          break;
        case 'comment':
          result = await comment(args[0], args.slice(1).join(' '));
          break;
        case 'upvote':
          result = await upvote(args[0]);
          break;
        default:
          console.error('Usage: node moltbook-client.js <command> [args]');
          console.error('Commands: post, feed, profile, comment, upvote');
          process.exit(1);
      }

      console.log('\n✅ Response:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = { post, getFeed, getProfile, comment, upvote };
