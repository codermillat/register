---
name: coding-agent
description: Run Kiro CLI, Cursor Agent, Gemini CLI, GitHub Copilot, or other coding agents via background process for programmatic control.
metadata: {"clawdbot":{"emoji":"🧩","requires":{"anyBins":["kiro-cli","agent","gemini","copilot","claude","codex","opencode","pi"]}}}
---

# Coding Agent (background-first)

Use **bash background mode** for non-interactive coding work. For interactive coding sessions, use the **tmux** skill.

## Available Agents (Millat's Setup)

| Agent | Command | Status | Best For |
|-------|---------|--------|----------|
| 🚀 **Kiro CLI** | `kiro-cli` | ✅ Installed (v1.24.1) | Spec-driven dev, AWS, complex features |
| 📝 **Cursor Agent** | `agent` | ✅ Installed | Full coding tasks, file editing |
| ♊️ **Gemini CLI** | `gemini` | ✅ Installed (v0.26.0) | Quick Q&A, code review |
| 🤖 **GitHub Copilot** | `copilot` | ✅ Installed (v0.0.400) | Code suggestions, explain |
| 💻 Codex | `codex` | ❌ Not installed | — |
| 🧠 Claude | `claude` | ❌ Not installed | — |

---

## The Pattern: workdir + background

```bash
# Create temp space for scratch work
SCRATCH=$(mktemp -d)

# Start agent in target directory
exec workdir:$SCRATCH background:true command:"<agent command>"
# Returns sessionId for tracking

# Monitor progress
process action:log sessionId:XXX

# Check if done  
process action:poll sessionId:XXX

# Send input (if agent asks a question)
process action:write sessionId:XXX data:"y"

# Kill if needed
process action:kill sessionId:XXX
```

**Why workdir matters:** Agent wakes up in a focused directory, doesn't wander off reading unrelated files.

---

## 🚀 Kiro CLI (Amazon) — NEW!

Kiro is Amazon's spec-driven AI coding agent. Great for structured development and enterprise workflows.

### Quick usage
```bash
# Start interactive chat
kiro-cli chat

# Chat with specific agent
kiro-cli --agent AGENT_NAME

# Natural language to shell
kiro-cli translate "find all python files modified today"

# Check account/credits
kiro-cli whoami
kiro-cli user
```

### Subcommands
```bash
kiro-cli chat          # AI assistant in terminal
kiro-cli agent         # Manage AI agents
kiro-cli translate     # Natural language → shell commands
kiro-cli mcp           # Model Context Protocol
kiro-cli inline        # Inline shell completions
kiro-cli doctor        # Fix common issues
kiro-cli settings      # Customize appearance
```

### Background mode
```bash
# Run Kiro task in background
exec background:true pty:true command:"kiro-cli chat"

# Monitor
process action:log sessionId:XXX
```

### Account
- Free tier: 50 credits/month + 500 bonus credits
- Login: `kiro-cli login`
- Check usage: `kiro-cli whoami`

---

## 📝 Cursor Agent

The Cursor Agent CLI (`agent`) is a headless AI coding assistant.

### One-shot (non-interactive)
```bash
# Quick task with --print flag
agent --print "Explain this code: $(cat main.py)"

# Background mode for longer tasks
exec workdir:~/project background:true command:"agent --print 'Refactor the utils folder for better organization'"
```

### Interactive mode
```bash
# Opens full TUI
agent "Build a REST API with FastAPI"

# Plan mode (read-only analysis)
agent --plan "Review this codebase and suggest improvements"

# Ask mode (Q&A)
agent --mode ask "How does the authentication work in this project?"
```

### Useful flags
- `--print` / `-p`: Non-interactive, prints to console
- `--plan`: Read-only planning mode
- `--mode ask`: Q&A mode for explanations
- `--cloud` / `-c`: Cloud mode (opens composer picker)
- `--resume [chatId]`: Resume previous session
- `--output-format <format>`: text | json | stream-json

---

## ♊️ Gemini CLI

Fast one-shot queries using Google's Gemini models.

### Quick usage
```bash
# Simple question
gemini "What is the time complexity of quicksort?"

# Code review
gemini "Review this function for bugs: $(cat utils.py)"

# With specific model
gemini --model gemini-2.0-flash "Explain async/await in Python"

# JSON output
gemini --output-format json "List 5 Python best practices"
```

### Background mode
```bash
exec background:true command:"gemini 'Analyze this codebase and list all TODO items' > /tmp/todos.txt"
```

### Auth
- Run `gemini` once interactively to login via OAuth
- Or set `GEMINI_API_KEY` environment variable

---

## 🤖 GitHub Copilot CLI

AI-powered coding assistant from GitHub.

### Quick usage
```bash
# Explain code
copilot explain "$(cat complex_function.py)"

# Suggest improvements
copilot suggest "How to optimize this database query?"

# Start interactive session
copilot
```

### As MCP server (advanced)
```bash
copilot --acp  # Start as Agent Client Protocol server
```

---

## Choosing the Right Agent

| Task | Best Agent | Command |
|------|------------|---------|
| Quick code question | Gemini | `gemini "question"` |
| Explain code | Copilot | `copilot explain "code"` |
| Shell command help | Kiro | `kiro-cli translate "description"` |
| Build feature | Cursor or Kiro | `agent --print "task"` |
| Spec-driven development | Kiro | `kiro-cli chat` |
| Code review | Gemini | `gemini "review..."` |
| Refactor files | Cursor | `agent "refactor..."` |
| AWS/Terraform | Kiro | `kiro-cli chat` |
| Debug issue | Cursor | `agent --mode ask "why?"` |

---

## Parallel Tasks with Background Mode

```bash
# Run multiple agents in parallel
exec background:true command:"agent --print 'Fix the login bug'" 
exec background:true command:"gemini 'Review auth.py for security issues' > /tmp/review.txt"
exec background:true pty:true command:"kiro-cli translate 'optimize docker build'"

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

# 5. Implement with Cursor or Kiro
agent "Add JWT authentication to the FastAPI app"

# 6. Review with Gemini
gemini "Review the changes in git diff for security issues"

# 7. Commit and push
git add -A && git commit -m "feat: add JWT authentication"
git push
```

---

## ⚠️ Rules

1. **Respect tool choice** — if user asks for Kiro, use Kiro
2. **Be patient** — don't kill sessions prematurely
3. **Monitor with process:log** — check progress without interfering
4. **Use --print for scripts** — non-interactive mode for automation
5. **Parallel is OK** — run multiple agents at once
6. **Isolate work directories** — don't run agents in the OpenClaw workspace

---

## Environment Variables

```bash
# Add to ~/.bashrc
export GEMINI_API_KEY="your-gemini-key"      # For Gemini CLI
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
