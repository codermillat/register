# HEARTBEAT.md - Periodic Health Checks

## Browser Tab Monitoring
Check and auto-close tabs if > 5 open:
```bash
bash ~/.openclaw/workspace/scripts/browser-monitor.sh
```

## RAM Health Check
Monitor available RAM, alert if < 500MB:
```bash
AVAILABLE_MB=$(free -m | awk '/^Mem:/ {print $7}')
if [ "$AVAILABLE_MB" -lt 500 ]; then
    echo "⚠️ RAM low: ${AVAILABLE_MB}MB available. Running cleanup..."
    bash ~/.openclaw/workspace/scripts/system-cleanup.sh
fi
```

# Keep heartbeat tasks MINIMAL to avoid token burn
# Heavy checks run via cron (system-cleanup every 6 hours)
