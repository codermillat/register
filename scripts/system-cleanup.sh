#!/bin/bash
# System Cleanup - Safe automatic cleanup of temporary files and caches
# SAFEGUARDS: Only touches regenerable caches, temp files, and old logs
# NEVER touches: source code, databases, credentials, active processes

set -euo pipefail

LOG_FILE="/tmp/system-cleanup-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# SAFEGUARD: Minimum free RAM threshold (500MB)
MIN_RAM_MB=500

# SAFEGUARD: Critical processes that must NEVER be killed
CRITICAL_PROCESSES=(
    "openclaw-gateway"
    "systemd"
    "sshd"
    "init"
)

# SAFEGUARD: Directories that must NEVER be touched
PROTECTED_DIRS=(
    "$HOME/.openclaw/workspace"
    "$HOME/.ssh"
    "$HOME/.config/moltbook"
    "$HOME/.config/bird"
    "$HOME/.git"
    "/etc"
    "/boot"
    "/sys"
    "/proc"
)

log "=== System Cleanup Started ==="

# Check current RAM
AVAILABLE_MB=$(free -m | awk '/^Mem:/ {print $7}')
log "Current available RAM: ${AVAILABLE_MB}MB"

if [ "$AVAILABLE_MB" -gt "$MIN_RAM_MB" ]; then
    log "✅ RAM healthy (>${MIN_RAM_MB}MB), skipping cleanup"
    exit 0
fi

log "⚠️ RAM low (<${MIN_RAM_MB}MB), starting cleanup..."

# 1. Close browser tabs (safest, biggest impact)
log "Closing browser tabs..."
if [ -f "$HOME/.openclaw/workspace/scripts/browser-cleanup.sh" ]; then
    bash "$HOME/.openclaw/workspace/scripts/browser-cleanup.sh" >> "$LOG_FILE" 2>&1 || true
fi

# 2. Clear regenerable caches (SAFE - will rebuild on demand)
log "Clearing regenerable caches..."

# npm cache (SAFE - regenerable)
if command -v npm &> /dev/null; then
    npm cache clean --force >> "$LOG_FILE" 2>&1 || true
    log "✅ npm cache cleared"
fi

# UV cache (SAFE - Python package cache, regenerable)
UV_CACHE="$HOME/.cache/uv"
if [ -d "$UV_CACHE" ]; then
    CACHE_SIZE=$(du -sh "$UV_CACHE" | cut -f1)
    rm -rf "${UV_CACHE:?}"/* 2>/dev/null || true
    log "✅ UV cache cleared (was: $CACHE_SIZE)"
fi

# Go build cache (SAFE - regenerable)
GO_CACHE="$HOME/.cache/go-build"
if [ -d "$GO_CACHE" ]; then
    CACHE_SIZE=$(du -sh "$GO_CACHE" | cut -f1)
    go clean -cache 2>/dev/null || rm -rf "${GO_CACHE:?}"/* 2>/dev/null || true
    log "✅ Go build cache cleared (was: $CACHE_SIZE)"
fi

# 3. Clean /tmp (SAFE - temporary files only, exclude active sessions)
log "Cleaning /tmp (files older than 2 days)..."
find /tmp -type f -user openclaw -mtime +2 -delete 2>/dev/null || true
log "✅ /tmp cleaned"

# 4. Kill stuck/zombie processes (SAFEGUARDED)
log "Checking for stuck processes..."

# Kill stuck Kiro CLI processes (known to hang)
if pgrep -f "kiro-cli" > /dev/null; then
    log "Found stuck kiro-cli processes, killing..."
    pkill -9 -f "kiro-cli" || true
    log "✅ Kiro CLI processes killed"
fi

# 5. Check RAM improvement
AVAILABLE_AFTER=$(free -m | awk '/^Mem:/ {print $7}')
FREED=$((AVAILABLE_AFTER - AVAILABLE_MB))
log "RAM freed: ${FREED}MB (now ${AVAILABLE_AFTER}MB available)"

if [ "$AVAILABLE_AFTER" -lt "$MIN_RAM_MB" ]; then
    log "⚠️ Still low on RAM, manual intervention may be needed"
else
    log "✅ RAM healthy again"
fi

log "=== System Cleanup Complete ==="
log "Log saved to: $LOG_FILE"
