# System Safeguards & Automatic Cleanup

## Overview
Automatic cleanup system to prevent resource exhaustion without damaging critical files/processes.

## Scripts Created

### 1. `browser-cleanup.sh`
**Purpose:** Close all browser tabs to free RAM  
**Safety:** Only touches browser tabs, nothing else  
**Usage:** Run after any browser operation  
**Impact:** ~100-200MB RAM per tab closed

### 2. `system-cleanup.sh`
**Purpose:** Comprehensive system cleanup when RAM < 500MB  
**Safety:** Multiple safeguards (see below)  
**Usage:** Automatic via cron (every 6 hours)  
**Impact:** 1-3GB RAM typically freed

### 3. `browser-monitor.sh`
**Purpose:** Alert and auto-close if > 5 tabs open  
**Safety:** Only affects browser  
**Usage:** Heartbeat check  
**Impact:** Prevents tab accumulation

## Safeguards Built-In

### Protected Processes (NEVER touched)
- `openclaw-gateway` (core service)
- `systemd` (system init)
- `sshd` (remote access)
- `init` (system process)

### Protected Directories (NEVER touched)
- `~/.openclaw/workspace` (source code, files)
- `~/.ssh` (SSH keys)
- `~/.config/moltbook` (API credentials)
- `~/.config/bird` (X/Twitter credentials)
- `~/.git` (git repositories)
- `/etc`, `/boot`, `/sys`, `/proc` (system dirs)

### What Gets Cleaned (ALL REGENERABLE)
✅ npm cache (regenerates on install)  
✅ UV cache (Python packages, rebuilds on use)  
✅ Go build cache (rebuilds on compile)  
✅ Browser tabs (can reopen if needed)  
✅ /tmp files older than 2 days  
✅ Stuck Kiro CLI processes (known to hang)

### Safety Checks
1. **RAM threshold:** Only runs if < 500MB available
2. **User restriction:** Only touches `openclaw` user files
3. **Age restriction:** /tmp cleanup only affects files >2 days old
4. **Process check:** Verifies process exists before killing
5. **Logging:** All actions logged to `/tmp/system-cleanup-*.log`

## Cron Jobs

### System Cleanup - RAM Monitor
- **Schedule:** Every 6 hours
- **Action:** Check RAM, run cleanup if needed
- **Trigger:** When available RAM < 500MB
- **Impact:** Automatic resource management

## Heartbeat Checks

### Browser Tab Monitoring
- **Check:** Count open browser tabs
- **Limit:** 5 tabs maximum
- **Action:** Auto-close all tabs if exceeded
- **Frequency:** Every heartbeat (~30 min)

### RAM Health
- **Check:** Available RAM
- **Alert:** If < 500MB
- **Action:** Run system-cleanup.sh
- **Frequency:** Every heartbeat (~30 min)

## Manual Usage

### Close all browser tabs now:
```bash
bash ~/.openclaw/workspace/scripts/browser-cleanup.sh
```

### Force system cleanup now:
```bash
bash ~/.openclaw/workspace/scripts/system-cleanup.sh
```

### Check browser tab count:
```bash
bash ~/.openclaw/workspace/scripts/browser-monitor.sh
```

### View cleanup logs:
```bash
ls -lh /tmp/system-cleanup-*.log
tail -f /tmp/system-cleanup-$(date +%Y%m%d)-*.log
```

## Testing

All scripts tested and verified:
- ✅ Browser cleanup: Works, closes all tabs
- ✅ Browser monitor: Detects tab count, auto-cleans if > 5
- ✅ System cleanup: Safeguards verified, logs created
- ✅ Cron job: Scheduled for every 6 hours

## Recovery

If something goes wrong:

1. **Caches deleted?** No problem, they regenerate automatically
2. **Browser closed accidentally?** Just reopen needed tabs
3. **Cleanup too aggressive?** Adjust thresholds in scripts:
   - `MIN_RAM_MB=500` in system-cleanup.sh
   - `MAX_TABS=5` in browser-monitor.sh

## What WON'T Be Cleaned

❌ Source code (workspace/)  
❌ Credentials (.ssh/, .config/)  
❌ Git repositories (.git/)  
❌ Active sessions  
❌ OpenClaw gateway  
❌ System files (/etc, /boot)  
❌ Databases  
❌ User documents

## Performance Impact

**Before safeguards:** 42 tabs = 3.7GB RAM used, 210MB available (5%)  
**After safeguards:** 0 tabs = 1.0GB RAM used, 2.8GB available (74%)  
**Automatic prevention:** Tabs capped at 5, cleanup every 6 hours

## Maintenance

- Scripts are in `~/.openclaw/workspace/scripts/`
- Logs rotate automatically (cleanup deletes >2 day old logs)
- Cron jobs managed via OpenClaw cron tool
- Heartbeat checks in HEARTBEAT.md

## Created
2026-02-02 10:00 UTC  
After critical RAM exhaustion incident (210MB available)

## Last Updated
2026-02-02 10:05 UTC
