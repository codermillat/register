---
name: coding-agent
description: Run Cursor Agent, Gemini CLI, GitHub Copilot, Codex, Claude Code, or Pi via background process for programmatic control.
metadata: {"clawdbot":{"emoji":"🧩","requires":{"anyBins":["agent","gemini","copilot","claude","codex","opencode","pi"]}}}
---

# Coding Agent (background-first)

Use **bash background mode** for non-interactive coding work. For interactive coding sessions, use the **tmux** skill.

## Available Agents (Millat's Setup)

| Agent | Command | Status | Best For |
|-------|---------|--------|----------|
| 📝 **Cursor Agent** | `agent` | ✅ Installed | Full coding tasks, file editing |
| ♊️ **Gemini CLI** | `gemini` | ✅ Installed | Quick Q&A, code review |
| 🤖 **GitHub Copilot** | `copilot` | ✅ Installed | Code suggestions, explain |
| 💻 Codex | `codex` | ❌ Not installed | — |
| 🧠 Claude | `claude` | ❌ Not installed | — |
| 🥧 Pi | `pi` | ❌ Not installed | — |

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

## 📝 Cursor Agent (Primary)

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

### With API key
```bash
agent --api-key $CURSOR_API_KEY "Your task"
# Or set env: export CURSOR_API_KEY="your-key"
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

### Useful flags
- `--add-dir <dir>`: Add directory to allowed list
- `--add-github-mcp-tool <tool>`: Enable specific MCP tools
- Use `"*"` for all tools

---

## Choosing the Right Agent

| Task | Best Agent | Command |
|------|------------|---------|
| Quick code question | Gemini | `gemini "question"` |
| Explain code | Copilot | `copilot explain "code"` |
| Build feature | Cursor | `agent --print "task"` |
| Code review | Gemini or Cursor | `gemini "review..."` or `agent --plan` |
| Refactor files | Cursor | `agent "refactor..."` |
| Debug issue | Cursor | `agent --mode ask "why is X failing?"` |

---

## Parallel Tasks with Background Mode

```bash
# Run multiple agents in parallel
exec background:true command:"agent --print 'Fix the login bug'" 
exec background:true command:"gemini 'Review auth.py for security issues' > /tmp/review.txt"
exec background:true command:"copilot suggest 'Optimize database queries'"

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

# 2. Analyze with Gemini (fast)
gemini "Summarize what this project does based on the README and structure"

# 3. Plan changes with Cursor (read-only)
agent --plan "How would you add user authentication to this app?"

# 4. Implement with Cursor
agent "Add JWT authentication to the FastAPI app. Create auth routes and middleware."

# 5. Review with Gemini
gemini "Review the changes in git diff for security issues"

# 6. Commit and push
git add -A && git commit -m "feat: add JWT authentication"
git push
```

---

## ⚠️ Rules

1. **Respect tool choice** — if user asks for Cursor, use Cursor
2. **Be patient** — don't kill sessions prematurely
3. **Monitor with process:log** — check progress without interfering
4. **Use --print for scripts** — non-interactive mode for automation
5. **Parallel is OK** — run multiple agents at once
6. **Isolate work directories** — don't run agents in the OpenClaw workspace

---

## Environment Variables

```bash
# Add to ~/.bashrc
export CURSOR_API_KEY="your-cursor-key"      # Optional for Cursor
export GEMINI_API_KEY="your-gemini-key"      # For Gemini CLI
export PATH=$HOME/.local/bin:$HOME/.npm-global/bin:$PATH
```

---

## Troubleshooting

### Agent not found
```bash
# Check PATH
which agent gemini copilot

# Add to PATH
export PATH=$HOME/.local/bin:$HOME/.npm-global/bin:$PATH
```

### Gemini auth issues
```bash
# Re-login
gemini  # Follow OAuth flow
```

### Copilot not working
```bash
# Check GitHub auth
gh auth status
```
