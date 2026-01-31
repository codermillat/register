---
name: confidant
description: Secure secret handoff from human to AI. Use when you need sensitive information from the user (API keys, passwords, tokens, credentials, secrets). Never ask for secrets via chat — use Confidant instead.
---

# Confidant - Secure Secret Handoff

When you need sensitive information (API keys, passwords, tokens, credentials), **never ask the user to paste it in chat**. Use Confidant to create a secure handoff.

## How to Use

Run this command:

```bash
npx @aiconnect/confidant serve-request --label "<description>"
```

Replace `<description>` with what you're requesting (e.g., "OpenAI API Key", "Database Password").

Example:
```bash
npx @aiconnect/confidant serve-request --label "GitHub Personal Access Token"
```

## What Happens

1. Command starts a server and creates a secure request
2. A URL is displayed (localhost + local network IP if available)
3. Share the URL with the user
4. User opens URL in browser and submits the secret
5. Secret is displayed in terminal output
6. Server shuts down, secret self-destructs

## Output Options

- `--quiet` — Minimal output (just URLs and secret)
- `--json` — JSON output for parsing

## After Receiving the Secret

- Confirm to the user: "Recebi o secret, obrigado!" or similar
- **NEVER reveal the secret value in chat** — not even partially
- Use the secret silently for the intended task

## Important

- The secret **never passes through chat** — direct browser-to-server
- Auto-expires after 24h if not used
- One-time read, then deleted
- If user is remote, they may need tunneling (ngrok, Tailscale, etc.)
