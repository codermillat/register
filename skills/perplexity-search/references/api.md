# Perplexity API Reference

Complete API documentation for the Perplexity AI search service.

## Base URL
```
https://api.perplexity.ai
```

## Authentication

**Method:** Bearer Token

```bash
curl https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Get API Key:** https://www.perplexity.ai/settings/api

## Endpoints

### POST /chat/completions

Main endpoint for search and research queries.

**Request:**
```json
{
  "model": "sonar",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "What is quantum computing?"
    }
  ],
  "max_tokens": 1000,
  "temperature": 0.2,
  "return_citations": true,
  "return_images": false,
  "search_recency_filter": "month"
}
```

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "sonar",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Quantum computing is..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 150,
    "total_tokens": 170
  },
  "citations": [
    "https://en.wikipedia.org/wiki/Quantum_computing",
    "https://www.ibm.com/quantum-computing"
  ]
}
```

## Parameters

### Required

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | string | Model to use (see Models section) |
| `messages` | array | Array of message objects |

### Optional

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_tokens` | integer | 1024 | Max tokens in response |
| `temperature` | float | 0.2 | Sampling temperature (0.0-2.0) |
| `top_p` | float | 0.9 | Nucleus sampling |
| `return_citations` | boolean | false | Include source URLs |
| `return_images` | boolean | false | Include images in response |
| `search_recency_filter` | string | null | Time filter: "day", "week", "month", "year" |
| `search_domain_filter` | array | [] | Limit to specific domains |
| `frequency_penalty` | float | 1.0 | Penalize repeated tokens |
| `presence_penalty` | float | 0.0 | Penalize new topics |
| `stream` | boolean | false | Enable streaming |

## Models

### Available Models

| Model | Speed | Citations | Cost (per 1K tokens) | Best For |
|-------|-------|-----------|----------------------|----------|
| **sonar** | Fast | Basic | $0.002 | Quick searches, general queries |
| **sonar-pro** | Medium | Enhanced | $0.01 | Research, detailed analysis |
| **sonar-reasoning** | Slow | Detailed | $0.02 | Complex reasoning, deep analysis |
| **sonar-online** | Fast | Web-only | $0.002 | Real-time web search |

### Model Selection Guide

**Use `sonar` when:**
- You need quick answers
- Cost is a concern
- Simple fact lookups

**Use `sonar-pro` when:**
- Citations are important
- Research quality matters
- Willing to pay 5x more

**Use `sonar-reasoning` when:**
- Complex analysis needed
- Deep reasoning required
- Best possible quality

## Message Roles

### System
Sets the assistant's behavior and context.

```json
{
  "role": "system",
  "content": "You are an expert in EdTech. Provide detailed, cited answers."
}
```

### User
The actual query or question.

```json
{
  "role": "user",
  "content": "What are the latest trends in online education?"
}
```

### Assistant
Previous assistant responses (for multi-turn conversations).

```json
{
  "role": "assistant",
  "content": "The latest trends include..."
}
```

## Advanced Features

### Search Recency Filter

Limit results to recent content:

```json
{
  "search_recency_filter": "week"
}
```

Options: `"day"`, `"week"`, `"month"`, `"year"`

### Domain Filtering

Restrict search to specific domains:

```json
{
  "search_domain_filter": [
    "wikipedia.org",
    "nature.com",
    "sciencedirect.com"
  ]
}
```

### Streaming

For real-time responses:

```json
{
  "stream": true
}
```

Response will be sent as Server-Sent Events (SSE).

## Rate Limits

### Free Tier
- **Requests:** ~10 per minute
- **Daily limit:** Based on $5 credit
- **Burst:** Up to 20 requests

### Pro Tier
- **Requests:** Higher limits (contact support)
- **Pay-as-you-go:** No daily cap

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify API key |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry after delay |
| 503 | Service Unavailable | Try again later |

### Error Response Format

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

## Usage Tracking

### Check Usage via API

Not directly available. Track client-side:
- Log `usage.total_tokens` from each response
- Calculate cost based on model pricing
- Store in local usage file

### Our Implementation

See `~/.config/perplexity/usage.json`:
```json
{
  "total_queries": 143,
  "total_tokens": 89432,
  "estimated_cost": 0.18,
  "last_reset": "2026-01-01T00:00:00Z",
  "queries": [
    {
      "timestamp": "2026-01-15T10:30:00Z",
      "query": "AI trends",
      "tokens": 250,
      "cost": 0.0005
    }
  ]
}
```

## Best Practices

### 1. Use Appropriate Models
- Start with `sonar` for most queries
- Upgrade to `sonar-pro` only when citations are critical

### 2. Optimize Token Usage
- Keep queries concise
- Set reasonable `max_tokens` limits
- Use system prompts to guide responses

### 3. Handle Errors Gracefully
```javascript
try {
  const result = await makeRequest();
} catch (err) {
  if (err.code === 429) {
    // Rate limited, wait 60s
    await sleep(60000);
    return retry();
  }
  throw err;
}
```

### 4. Cache Results
Cache responses for repeated queries to save costs:
```bash
query_hash=$(echo "$query" | md5sum | cut -d' ' -f1)
cache_file="~/.cache/perplexity/$query_hash.json"

if [ -f "$cache_file" ]; then
  cat "$cache_file"
else
  result=$(api_request "$query")
  echo "$result" > "$cache_file"
  echo "$result"
fi
```

### 5. Use Search Filters
Improve relevance and reduce tokens:
```json
{
  "search_recency_filter": "month",  // Recent results only
  "search_domain_filter": ["edu", "gov"]  // Authoritative sources
}
```

## Code Examples

### Bash (curl)
```bash
curl -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "sonar",
    "messages": [
      {"role": "system", "content": "Be concise."},
      {"role": "user", "content": "What is AI?"}
    ],
    "max_tokens": 500,
    "return_citations": true
  }'
```

### Node.js
```javascript
const https = require('https');

function query(text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'user', content: text }
      ],
      max_tokens: 1000,
      return_citations: true
    });

    const options = {
      hostname: 'api.perplexity.ai',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Usage
const result = await query('What is quantum computing?');
console.log(result.choices[0].message.content);
```

### Python
```python
import requests
import os

def search(query):
    url = "https://api.perplexity.ai/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.environ['PERPLEXITY_API_KEY']}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "sonar",
        "messages": [
            {"role": "user", "content": query}
        ],
        "max_tokens": 1000,
        "return_citations": True
    }
    
    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Usage
result = search("What is machine learning?")
print(result['choices'][0]['message']['content'])
```

## Cost Calculation

### Formula
```
cost = (total_tokens / 1000) * model_rate
```

### Examples

**sonar (1000 tokens):**
```
(1000 / 1000) * $0.002 = $0.002
```

**sonar-pro (5000 tokens):**
```
(5000 / 1000) * $0.01 = $0.05
```

**Free tier capacity:**
- $5 credit / $0.002 per query = ~2500 queries (sonar)
- $5 credit / $0.01 per query = ~500 queries (sonar-pro)

## Comparison with Alternatives

| Feature | Perplexity | OpenAI GPT-4 | Brave Search |
|---------|------------|--------------|--------------|
| Citations | ✅ Built-in | ❌ No | ✅ URLs only |
| Cost (1K tok) | $0.002-0.02 | $0.03 | Free |
| Real-time data | ✅ Yes | ❌ Cutoff | ✅ Yes |
| Reasoning | ✅ Advanced | ✅ Best | ❌ None |
| Speed | Fast | Medium | Fastest |

## Changelog

### 2026-01 (Current)
- Added `sonar-reasoning` model
- Improved citation extraction
- Enhanced search recency filters

### 2025-12
- Launched `sonar-pro` model
- Added domain filtering
- Increased rate limits for paid tiers

### 2025-11
- Initial API release
- `sonar` model available
- Basic citation support

---

For latest updates, see: https://docs.perplexity.ai
