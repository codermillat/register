---
name: coding-agent
description: Run Kiro CLI, Cursor Agent, Gemini CLI, GitHub Copilot, Codex, Claude Code, or Pi via background process for programmatic control.
metadata: {"clawdbot":{"emoji":"🧩","requires":{"anyBins":["kiro-cli","agent","gemini","copilot","claude","codex","opencode","pi"]}}}
---

# Coding Agent (background-first)

Use **bash background mode** for non-interactive coding work. For interactive coding sessions, use the **tmux** skill.

## ⚠️ PTY Mode Required for Interactive Agents!

Coding agents are **interactive terminal applications** that need a pseudo-terminal (PTY) to work correctly.

```bash
# ✅ Correct - with PTY for interactive agents
bash pty:true command:"kiro-cli chat"

# ✅ OK without PTY - for one-shot/print modes
bash command:"gemini 'Quick question'"
bash command:"agent --print 'Non-interactive task'"
```

---

## Available Agents (Millat's Setup)

| Agent | Command | Version | Status | Best For |
|-------|---------|---------|--------|----------|
| 🚀 **Kiro CLI** | `kiro-cli` | v1.24.1 | ✅ Installed | Spec-driven dev, AWS, NL→shell |
| 📝 **Cursor Agent** | `agent` | 2026.01.28 | ✅ Installed | Full coding tasks, file editing |
| ♊️ **Gemini CLI** | `gemini` | v0.26.0 | ✅ Installed | Quick Q&A, code review |
| 🤖 **GitHub Copilot** | `copilot` | v0.0.400 | ✅ Installed | Code suggestions, explain |
| 💻 Codex | `codex` | — | ❌ Not installed | OpenAI coding agent |
| 🧠 Claude Code | `claude` | — | ❌ Not installed | Anthropic coding agent |
| 🔷 OpenCode | `opencode` | — | ❌ Not installed | Open source agent |
| 🥧 Pi | `pi` | — | ❌ Not installed | Lightweight agent |

---

## The Pattern: workdir + background

```bash
# Create temp space for scratch work
SCRATCH=$(mktemp -d)

# Start agent in target directory
bash pty:true workdir:$SCRATCH background:true command:"<agent command>"
# Returns sessionId for tracking

# Monitor progress
process action:log sessionId:XXX

# Check if done  
process action:poll sessionId:XXX

# Send input (if agent asks a question)
process action:write sessionId:XXX data:"y"

# Submit with Enter
process action:submit sessionId:XXX data:"yes"

# Kill if needed
process action:kill sessionId:XXX
```

---

## 🚀 Kiro CLI (Amazon)

Amazon's spec-driven AI coding agent. Great for structured development, AWS, and enterprise workflows.

### Commands
```bash
kiro-cli chat              # AI assistant in terminal (interactive)
kiro-cli translate "desc"  # Natural language → shell command
kiro-cli agent             # Manage AI agents
kiro-cli mcp               # Model Context Protocol
kiro-cli inline            # Inline shell completions
kiro-cli doctor            # Fix common issues
kiro-cli settings          # Customize appearance
kiro-cli whoami            # Check account/credits
```

### Quick usage
```bash
# Interactive chat (needs PTY)
bash pty:true command:"kiro-cli chat"

# Natural language to shell (one-shot)
kiro-cli translate "find all python files modified in the last 24 hours"

# Start with specific agent
kiro-cli --agent my-agent

# Background mode
bash pty:true background:true command:"kiro-cli chat"
```

### Account
- Free tier: 50 credits/month + 500 bonus credits
- Login: `kiro-cli login`
- Check usage: `kiro-cli whoami`

---

## 📝 Cursor Agent

Headless AI coding assistant from Cursor.

### Commands
```bash
agent "prompt"              # Interactive mode (opens TUI)
agent --print "prompt"      # Non-interactive, prints to console
agent --plan "prompt"       # Read-only planning mode
agent --mode ask "prompt"   # Q&A mode for explanations
agent --resume [chatId]     # Resume previous session
```

### Quick usage
```bash
# One-shot (non-interactive, no PTY needed)
agent --print "Explain this code: $(cat main.py)"

# Interactive (needs PTY)
bash pty:true command:"agent 'Build a REST API with FastAPI'"

# Plan mode (read-only analysis)
agent --plan "Review this codebase and suggest improvements"

# Background mode
bash pty:true workdir:~/project background:true command:"agent --print 'Refactor utils folder'"
```

### Flags
| Flag | Effect |
|------|--------|
| `--print` / `-p` | Non-interactive, prints to console |
| `--plan` | Read-only planning mode |
| `--mode ask` | Q&A mode for explanations |
| `--cloud` / `-c` | Cloud mode (composer picker) |
| `--resume [chatId]` | Resume previous session |
| `--output-format` | text \| json \| stream-json |
| `--api-key` | Custom API key |

---

## ♊️ Gemini CLI

Fast one-shot queries using Google's Gemini models.

### Quick usage
```bash
# Simple question (no PTY needed)
gemini "What is the time complexity of quicksort?"

# Code review
gemini "Review this function for bugs: $(cat utils.py)"

# With specific model
gemini --model gemini-2.0-flash "Explain async/await in Python"

# JSON output
gemini --output-format json "List 5 Python best practices"

# Background mode
bash background:true command:"gemini 'Analyze codebase' > /tmp/analysis.txt"
```

### Auth
- Run `gemini` once interactively to login via OAuth
- Or set `GEMINI_API_KEY` environment variable

---

## 🤖 GitHub Copilot CLI

AI-powered coding assistant from GitHub.

### Quick usage
```bash
# Interactive session (needs PTY)
bash pty:true command:"copilot"

# Explain code
copilot explain "$(cat complex_function.py)"

# Suggest improvements
copilot suggest "How to optimize this database query?"

# As MCP server
copilot --acp
```

### Flags
| Flag | Effect |
|------|--------|
| `--acp` | Start as Agent Client Protocol server |
| `--add-dir <dir>` | Add directory to allowed list |
| `--add-github-mcp-tool <tool>` | Enable specific MCP tools |

---

## 💻 Codex CLI (Not Installed)

OpenAI's coding agent. Install with: `npm i -g @openai/codex`

### Usage (if installed)
```bash
# Quick one-shot (needs PTY + git repo)
SCRATCH=$(mktemp -d) && cd $SCRATCH && git init
bash pty:true command:"codex exec 'Your prompt'"

# Flags
codex exec --full-auto "prompt"  # Auto-approve in sandbox
codex --yolo "prompt"            # No sandbox, no approvals (dangerous!)
codex review --base main         # Review PR
```

---

## 🧠 Claude Code (Not Installed)

Anthropic's coding agent. Install with: `npm i -g @anthropic-ai/claude-code`

### Usage (if installed)
```bash
bash pty:true workdir:~/project command:"claude 'Your task'"
```

---

## 🔷 OpenCode (Not Installed)

Open source coding agent.

### Usage (if installed)
```bash
bash pty:true workdir:~/project command:"opencode run 'Your task'"
```

---

## 🥧 Pi Coding Agent (Not Installed)

Lightweight coding agent. Install with: `npm i -g @mariozechner/pi-coding-agent`

### Usage (if installed)
```bash
bash pty:true workdir:~/project command:"pi 'Your task'"

# Non-interactive
pi -p "Summarize src/"

# Different provider
pi --provider openai --model gpt-4o-mini -p "Your task"
```

---

## Choosing the Right Agent

| Task | Best Agent | Command |
|------|------------|---------|
| Quick code question | Gemini | `gemini "question"` |
| Explain code | Copilot | `copilot explain "code"` |
| Shell command help | Kiro | `kiro-cli translate "description"` |
| Build feature | Cursor | `agent --print "task"` |
| Spec-driven development | Kiro | `kiro-cli chat` |
| Code review | Gemini | `gemini "review..."` |
| Refactor files | Cursor | `agent "refactor..."` |
| AWS/Terraform work | Kiro | `kiro-cli chat` |
| Debug issue | Cursor | `agent --mode ask "why?"` |
| Interactive coding | Kiro or Copilot | `kiro-cli chat` or `copilot` |

---

## Parallel Tasks with Background Mode

```bash
# Run multiple agents in parallel
bash pty:true background:true command:"agent --print 'Fix the login bug'" 
bash background:true command:"gemini 'Review auth.py' > /tmp/review.txt"
bash pty:true background:true command:"kiro-cli translate 'optimize docker build'"

# Monitor all
process action:list

# Get results
process action:log sessionId:XXX
```

---

## Project Workflow Example

```bash
# 1. Clone project
git clone https://github.com/user/repo.git /tmp/myproject
cd /tmp/myproject

# 2. Quick shell commands with Kiro
kiro-cli translate "show git log for last week"

# 3. Analyze with Gemini (fast)
gemini "Summarize what this project does based on the README"

# 4. Plan changes with Cursor (read-only)
agent --plan "How would you add user authentication?"

# 5. Implement with Cursor
agent "Add JWT authentication to the FastAPI app"

# 6. Review with Gemini
gemini "Review the changes in git diff for security issues"

# 7. Commit and push
git add -A && git commit -m "feat: add JWT authentication"
git push
```

---

## Bash Tool Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `command` | string | The shell command to run |
| `pty` | boolean | **Use for interactive agents!** Allocates pseudo-terminal |
| `workdir` | string | Working directory (agent sees only this folder) |
| `background` | boolean | Run in background, returns sessionId |
| `timeout` | number | Timeout in seconds |
| `elevated` | boolean | Run on host instead of sandbox |

## Process Tool Actions

| Action | Description |
|--------|-------------|
| `list` | List all running/recent sessions |
| `poll` | Check if session is still running |
| `log` | Get session output (with offset/limit) |
| `write` | Send raw data to stdin |
| `submit` | Send data + newline (Enter) |
| `send-keys` | Send key tokens or hex bytes |
| `paste` | Paste text (with optional bracketed mode) |
| `kill` | Terminate the session |

---

## ⚠️ Rules

1. **Always use pty:true for interactive agents** — Kiro, Copilot, Codex need a terminal
2. **Respect tool choice** — if user asks for Kiro, use Kiro
3. **Be patient** — don't kill sessions prematurely
4. **Monitor with process:log** — check progress without interfering
5. **Use --print for scripts** — non-interactive mode for Cursor
6. **Parallel is OK** — run multiple agents at once
7. **Isolate work directories** — don't run agents in the OpenClaw workspace

---

## Environment Variables

```bash
# Add to ~/.bashrc
export GEMINI_API_KEY="your-gemini-key"      # For Gemini CLI
export CURSOR_API_KEY="your-cursor-key"      # Optional for Cursor
export PATH=$HOME/.local/bin:$HOME/.npm-global/bin:$PATH
```

---

## Troubleshooting

### Agent not found
```bash
# Check PATH
which kiro-cli agent gemini copilot

# Add to PATH
export PATH=$HOME/.local/bin:$HOME/.npm-global/bin:$PATH
```

### Kiro issues
```bash
kiro-cli doctor     # Diagnose issues
kiro-cli login      # Re-authenticate
kiro-cli whoami     # Check account status
```

### Gemini auth issues
```bash
gemini  # Follow OAuth flow to re-login
```

### Copilot not working
```bash
gh auth status  # Check GitHub auth
```

### Codex won't run
```bash
# Codex needs a git repo!
cd $(mktemp -d) && git init
codex exec "Your prompt"
```

---

## Installing Missing Agents

```bash
# Codex (OpenAI)
npm i -g @openai/codex

# Claude Code (Anthropic)
npm i -g @anthropic-ai/claude-code

# Pi Coding Agent
npm i -g @mariozechner/pi-coding-agent

# OpenCode
go install github.com/opencode-ai/opencode@latest
```
