# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

## 🔧 Installed Skills Configuration

### 📧 Email (Gmail)
```bash
# Gmail App Password Setup:
# 1. Go to: https://myaccount.google.com/apppasswords
# 2. Generate app-specific password
# 3. Add to environment:
export EMAIL_IMAP_HOST="imap.gmail.com"
export EMAIL_IMAP_USER="your-email@gmail.com"
export EMAIL_IMAP_PASSWORD="your-app-password"
export EMAIL_SMTP_HOST="smtp.gmail.com"
export EMAIL_SMTP_PORT="587"
```

### 📅 Calendar (Google Calendar)
```bash
# OAuth Setup Required
# 1. Create project at: https://console.cloud.google.com
# 2. Enable Google Calendar API
# 3. Create OAuth credentials
# 4. Get refresh token
export GOOGLE_CALENDAR_CLIENT_ID="your-client-id"
export GOOGLE_CALENDAR_CLIENT_SECRET="your-secret"
export GOOGLE_CALENDAR_REFRESH_TOKEN="your-token"
```

### 🔧 n8n Automation
```bash
# Self-hosted or n8n Cloud
export N8N_API_URL="https://your-n8n-instance.com"
export N8N_API_KEY="your-api-key"
# Get API key from: n8n Settings → API
```

### 💬 Slack (macOS only)
```bash
# Install CLI first:
brew install slack-cli
# Then authenticate:
slk login
# Workspace: [Your workspace name]
```

### 🐦 X/Twitter
```bash
# Create app at: https://developer.twitter.com
# Get API keys from: Apps → Keys and tokens
export TWITTER_API_KEY="your-api-key"
export TWITTER_API_SECRET="your-api-secret"
export TWITTER_ACCESS_TOKEN="your-access-token"
export TWITTER_ACCESS_SECRET="your-access-secret"
```

### 📈 Yahoo Finance
✅ No configuration needed - works out of the box!

### 🧠 Memory Manager
✅ No configuration needed - stores locally

### 📺 YouTube Transcript
✅ No configuration needed - uses residential proxy

### 🎓 Deep Research Agent
✅ No configuration needed - works out of the box

---

## 🆕 Newly Installed Skills (2026-01-31)

### 📰 Blogwatcher
✅ Installed: `blogwatcher` CLI (Go)
- Track RSS/Atom feeds for updates
- Commands: `blogwatcher add`, `blogwatcher scan`, `blogwatcher articles`
- No API key needed

### 🧩 Coding Agent
✅ Skill installed (framework for Codex/Claude Code/OpenCode/Pi)
- Requires one of: `codex`, `claude`, `opencode`, or `pi` CLI
- Currently: No coding agent CLI installed (optional)
- Use for background coding tasks

### ♊️ Gemini CLI
✅ Installed: `gemini` v0.26.0
- One-shot Q&A, summaries, generation
- Auth: Run `gemini` once interactively to login
- Or set `GEMINI_API_KEY` environment variable

### 📄 GitHub CLI
✅ Installed: `gh` v2.43.1
- Issues, PRs, CI runs, API queries
- Auth: Run `gh auth login`
- Always use `--repo owner/repo` when not in git dir

### 📄 nano-pdf
✅ Installed: `nano-pdf` CLI (Python/uv)
- Edit PDFs with natural language
- Requires: `GEMINI_API_KEY` or similar LLM key
- Example: `nano-pdf edit doc.pdf 1 "Fix the title"`

### 🎙️ OpenAI Whisper (Local)
✅ Installed: `whisper` CLI (Python/uv)
- Local speech-to-text (no API key!)
- Models download to `~/.cache/whisper` on first run
- Example: `whisper audio.mp3 --model medium --output_format txt`

### 🧾 Summarize
✅ Installed: `summarize` v1.0.0
- Summarize URLs, files, YouTube, PDFs
- Requires: API key for your chosen model
- Set `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`
- Example: `summarize "https://example.com" --model google/gemini-3-flash-preview`

### 🌤️ Weather
✅ Built-in OpenClaw skill
- No configuration needed
- Works out of the box

### ❌ Not Found on ClawHub
- `session-logs` - Not available
- `sherpa-onnx-tts` - Not available (consider `edge-tts` or `openai-tts` alternatives)

---

## 🔑 API Keys Summary

| Skill | Key | Required |
|-------|-----|----------|
| Gemini CLI | `GEMINI_API_KEY` | Yes (or login) |
| nano-pdf | `GEMINI_API_KEY` (or other) | Yes |
| Summarize | `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Yes |
| GitHub | `gh auth login` | Yes |
| Whisper | None | No (local) |
| Blogwatcher | None | No |
| Weather | None | No |

---

## 💡 Quick Setup Tips

### Priority 1: Email & Calendar
These are the most valuable for daily productivity. Set these up first.

### Priority 2: n8n Automation
If you're using n8n for workflows, this unlocks voice/chat control of your automations.

### Priority 3: Social/Communication
Slack and Twitter are optional but useful if you're active on these platforms.

### Environment Variables Location
Add to `~/.bashrc` or `~/.zshrc`:
```bash
# OpenClaw Skills Configuration
export EMAIL_IMAP_HOST="imap.gmail.com"
export EMAIL_IMAP_USER="millat@example.com"
# ... etc
```

Then reload: `source ~/.bashrc`

---

## 🎯 EdTech-Specific Workflows

### Student Communication Automation
- Email skill for student/parent communication
- Calendar for class scheduling
- n8n for automated reminders

### Content Creation Pipeline
- YouTube Transcript for extracting educational content
- Deep Research for curriculum development
- Memory Manager for saving best practices

### Market Research
- Yahoo Finance for EdTech company tracking
- X/Twitter for industry trends
- Deep Research for competitive analysis

---

Add whatever helps you do your job. This is your cheat sheet.
