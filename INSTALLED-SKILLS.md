# Installed OpenClaw Skills

This document catalogs all installed skills, their purposes, configuration requirements, and usage examples.

---

## 📊 Statistics

- **Total Skills Installed:** 15
- **Date Last Updated:** 2026-01-31
- **Installation Method:** ClawHub NPX

---

## 🎯 HIGH PRIORITY SKILLS (Daily Use)

### 📅 Calendar
- **Path:** `~/.openclaw/workspace/skills/calendar`
- **Downloads:** 1,046 ⭐ Stars: 5
- **Purpose:** Calendar management and scheduling across multiple providers
- **Providers:** Google Calendar, Apple Calendar, Outlook
- **Configuration:** Requires API credentials for chosen provider
- **Use Cases:**
  - Schedule meetings and events
  - Check availability
  - Set reminders
  - Manage recurring events
- **Example Commands:**
  ```
  "Schedule meeting tomorrow at 2pm"
  "Show my calendar for this week"
  "Find free time for a 1-hour meeting"
  ```

### 📧 Email
- **Path:** `~/.openclaw/workspace/skills/email`
- **Downloads:** 914 ⭐ Stars: 5
- **Purpose:** Email management across Gmail, Outlook, IMAP/SMTP
- **Always Active:** Yes (heartbeat monitoring)
- **Configuration:** OAuth or IMAP/SMTP credentials
- **Use Cases:**
  - Send and read emails
  - Search inbox
  - Organize with labels/folders
  - Bulk email operations
- **Example Commands:**
  ```
  "Send email to user@example.com"
  "Show unread emails"
  "Search emails from last week about 'project'"
  ```

### 🔧 n8n Automation
- **Path:** `~/.openclaw/workspace/skills/n8n-automation`
- **Downloads:** 9
- **Purpose:** Manage n8n workflows from OpenClaw via REST API
- **Supports:** Self-hosted n8n and n8n Cloud
- **Configuration:**
  - `N8N_API_URL` - Your n8n instance URL
  - `N8N_API_KEY` - API authentication key
- **Use Cases:**
  - Trigger workflows remotely
  - List and manage automations
  - Debug workflow executions
  - Create new workflows
- **Example Commands:**
  ```
  "List my n8n workflows"
  "Trigger workflow 'daily-backup'"
  "Check n8n execution status"
  ```

### 🧠 Memory Manager
- **Path:** `~/.openclaw/workspace/skills/memory-manager`
- **Downloads:** 186 ⭐ Stars: 1
- **Purpose:** Local memory management with compression detection
- **Features:**
  - Auto-snapshots before memory loss
  - Semantic search across memories
  - Track memory usage patterns
  - Compression risk detection
- **Configuration:** No API keys needed (local)
- **Use Cases:**
  - Save context snapshots
  - Search historical conversations
  - Prevent context loss
- **Example Commands:**
  ```
  "Save current context"
  "Search memories for 'project deadline'"
  "Check memory usage"
  ```

---

## 🔬 RESEARCH & LEARNING

### 🎓 Deep Research Agent
- **Path:** `~/.openclaw/workspace/skills/deep-research`
- **Downloads:** 1,335 ⭐ Stars: 9
- **Purpose:** Complex multi-step research with planning and decomposition
- **Ideal For:** Academic research, market analysis, technical investigations
- **Configuration:** Works out of the box
- **Use Cases:**
  - Complex research tasks
  - Multi-source analysis
  - Long-context reasoning
  - Report generation
- **Example Commands:**
  ```
  "Research best practices for EdTech user engagement"
  "Analyze market trends in online education in Bangladesh"
  "Deep dive into learning management systems"
  ```

### 📺 YouTube Transcript
- **Path:** `~/.openclaw/workspace/skills/youtube-transcript`
- **Downloads:** 664 ⭐ Stars: 3
- **Purpose:** Fetch and summarize YouTube video transcripts
- **Features:** Bypasses YouTube cloud IP blocks with residential proxy
- **Configuration:** No API keys needed
- **Use Cases:**
  - Summarize educational videos
  - Extract key points from lectures
  - Convert video content to text
- **Example Commands:**
  ```
  "Summarize this YouTube video: [URL]"
  "Get transcript from [video]"
  "Extract key points from this tutorial"
  ```

---

## 💼 COMMUNICATION & SOCIAL

### 💬 Slack Personal (macOS)
- **Path:** `~/.openclaw/workspace/skills/slack-personal`
- **Downloads:** 21 ⭐ Stars: 1
- **Purpose:** Read and send Slack messages via slk CLI
- **Requirements:** macOS only, slk CLI installed
- **Configuration:**
  - Install slk CLI: `brew install slack-cli`
  - Authenticate with workspace
- **Use Cases:**
  - Check Slack messages
  - Send messages to channels
  - Search Slack history
  - Heartbeat Slack checks
- **Example Commands:**
  ```
  "Check slack"
  "Send on slack: [message]"
  "Search slack for 'meeting notes'"
  "Any slack messages?"
  ```

### 🐦 X/Twitter
- **Path:** `~/.openclaw/workspace/skills/x-twitter`
- **Downloads:** 84
- **Purpose:** Full Twitter/X interaction - read, post, search, engage
- **Configuration:** Twitter API credentials needed
- **Use Cases:**
  - Post tweets
  - Read timeline
  - Search tweets
  - Like, retweet, reply
- **Example Commands:**
  ```
  "Post tweet: [content]"
  "Check my Twitter mentions"
  "Search Twitter for #EdTech"
  ```

### 📖 Moltbook Interact
- **Path:** `~/.openclaw/workspace/skills/moltbook-interact`
- **Downloads:** 138
- **Purpose:** Social network for AI agents
- **Features:** Post, reply, browse, analyze engagement
- **Configuration:** Moltbook account
- **Use Cases:**
  - Engage with agent community
  - Share insights
  - Network with other AI agents
- **Example Commands:**
  ```
  "Post on Moltbook: [content]"
  "Check my Moltbook feed"
  "Reply to [post]"
  ```

---

## 💰 FINANCE & MARKETS

### 📈 Yahoo Finance
- **Path:** `~/.openclaw/workspace/skills/yahoofinance`
- **Downloads:** 424 ⭐ Stars: 1
- **Purpose:** Real-time stock data, company financials, crypto prices
- **Configuration:** No API key needed (free Yahoo Finance data)
- **Use Cases:**
  - Check stock prices
  - Get company financials
  - Monitor crypto prices
  - Market analysis
- **Example Commands:**
  ```
  "Get AAPL stock price"
  "Show crypto prices for BTC and ETH"
  "Company financials for Tesla"
  "Market news today"
  ```

---

## 🛠️ UTILITY & META SKILLS

### 🎯 ClawHub
- **Path:** `~/.openclaw/workspace/skills/clawhub`
- **Downloads:** 5,422 ⭐ Stars: 2
- **Purpose:** Manage skills directly from OpenClaw
- **Features:**
  - Search skills
  - Install/update skills
  - Publish new skills
  - Advanced caching
- **Configuration:** None needed
- **Use Cases:**
  - Install skills on the fly
  - Update existing skills
  - Browse ClawHub catalog
- **Example Commands:**
  ```
  "Search clawhub for calendar skills"
  "Install skill [name]"
  "Update all skills"
  ```

### 🔍 Skill Vetter
- **Path:** `~/.openclaw/workspace/skills/skill-vetter`
- **Downloads:** 65
- **Purpose:** Security-first skill vetting before installation
- **Features:** Checks for red flags, permission scope, suspicious patterns
- **Configuration:** None needed
- **Use Cases:**
  - Vet skills before installing
  - Security audits
  - Check permissions
- **Example Commands:**
  ```
  "Vet this skill: [URL or name]"
  "Check skill security: [name]"
  ```

### 🛡️ Indirect Prompt Injection Defense
- **Path:** `~/.openclaw/workspace/skills/indirect-prompt-injection`
- **Downloads:** 31 ⭐ Stars: 1
- **Purpose:** Detect prompt injection attacks in external content
- **Features:**
  - 20+ detection patterns
  - Homoglyph detection
  - Sanitization scripts
- **Configuration:** None needed
- **Use Cases:**
  - Process untrusted content safely
  - Detect manipulation attempts
  - Security hardening
- **Auto-activated:** Before processing external content

---

## 🎮 ENTERTAINMENT & EXPERIMENTS

### ♟️ Molt Chess
- **Path:** `~/.openclaw/workspace/skills/molt-chess`
- **Downloads:** 0
- **Purpose:** Play chess on molt.chess agent league
- **Features:** Registration, position analysis, move submission
- **Configuration:** molt.chess account
- **Use Cases:**
  - Play chess against other agents
  - Analyze positions
  - Join agent chess tournaments

### 🔊 Sonos CLI
- **Path:** `~/.openclaw/workspace/skills/sonoscli`
- **Pre-installed:** Yes
- **Purpose:** Control Sonos speakers
- **Configuration:** Sonos system on local network
- **Use Cases:**
  - Play music
  - Control volume
  - Group speakers

---

## 📋 CONFIGURATION CHECKLIST

### ✅ No Configuration Needed (Ready to Use)
- ✅ Memory Manager
- ✅ YouTube Transcript
- ✅ Yahoo Finance
- ✅ Deep Research Agent
- ✅ ClawHub
- ✅ Skill Vetter
- ✅ Indirect Prompt Injection Defense
- ✅ Molt Chess (needs account signup)

### ⚙️ Configuration Required

#### Calendar
```bash
# Google Calendar (recommended)
export GOOGLE_CALENDAR_CLIENT_ID="your-client-id"
export GOOGLE_CALENDAR_CLIENT_SECRET="your-secret"
export GOOGLE_CALENDAR_REFRESH_TOKEN="your-token"
```

#### Email
```bash
# Gmail (OAuth)
export GMAIL_CLIENT_ID="your-client-id"
export GMAIL_CLIENT_SECRET="your-secret"
export GMAIL_REFRESH_TOKEN="your-token"

# Or IMAP/SMTP
export EMAIL_IMAP_HOST="imap.gmail.com"
export EMAIL_IMAP_USER="your-email@gmail.com"
export EMAIL_IMAP_PASSWORD="your-app-password"
```

#### n8n Automation
```bash
export N8N_API_URL="https://your-n8n-instance.com"
export N8N_API_KEY="your-api-key"
```

#### Slack Personal (macOS only)
```bash
# Install CLI
brew install slack-cli
# Authenticate
slk login
```

#### X/Twitter
```bash
export TWITTER_API_KEY="your-api-key"
export TWITTER_API_SECRET="your-api-secret"
export TWITTER_ACCESS_TOKEN="your-access-token"
export TWITTER_ACCESS_SECRET="your-access-secret"
```

---

## 🎯 RECOMMENDED WORKFLOWS

### Morning Routine
1. **Email** - Check unread emails
2. **Calendar** - Review today's schedule
3. **Slack** - Check important messages
4. **Yahoo Finance** - Market overview

### EdTech Development
1. **Deep Research** - Investigate learning patterns
2. **YouTube Transcript** - Extract insights from educational content
3. **X/Twitter** - Share updates, engage with EdTech community
4. **Memory Manager** - Save research findings

### Automation Setup
1. **n8n Automation** - Create workflows for repetitive tasks
2. **ClawHub** - Install additional skills as needed
3. **Skill Vetter** - Audit new skills before installation

---

## 🔄 MAINTENANCE

### Update All Skills
```bash
cd ~/.openclaw/workspace
npx clawhub@latest update
```

### Check Installed Skills
```bash
ls -1 ~/.openclaw/workspace/skills/
```

### Remove Unused Skills
```bash
rm -rf ~/.openclaw/workspace/skills/[skill-name]
```

---

## 📚 RESOURCES

- **ClawHub:** https://clawhub.com/skills
- **Official Docs:** https://docs.openclaw.com
- **Community:** https://discord.gg/openclaw
- **Skill Creation Guide:** Check `advanced-skill-creator` if needed

---

## 🎓 SKILLS RELEVANT TO YOUR PROFILE

As an EdTech developer and automation enthusiast focused on Bangladesh-India education:

### Currently Installed & Useful
✅ **Deep Research** - Educational research and analysis  
✅ **YouTube Transcript** - Educational video content extraction  
✅ **n8n Automation** - Workflow automation  
✅ **Memory Manager** - Knowledge retention  
✅ **Email** - Communication with educators/students  
✅ **Calendar** - Schedule management  

### Consider Installing Later
- **Trello** - Project management (not yet in catalog)
- **CalDAV** - Advanced calendar sync (not yet in catalog)
- **Answer Overflow** - Discord search (if you use Discord)
- **Skiplagged Flights** - Travel between BD-India
- **Agent Development** - Create custom agents for EdTech

---

**Last Updated:** 2026-01-31 by Subagent skill-installer
