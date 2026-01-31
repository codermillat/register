#!/bin/bash

###############################################################################
# GitHub Copilot Account Sync Daemon
# 
# Runs continuous monitoring and syncing in the background
# Usage: ./sync-daemon.sh [start|stop|status|restart]
###############################################################################

WORKSPACE_DIR="$HOME/.openclaw/workspace"
SYNC_SCRIPT="$WORKSPACE_DIR/github-copilot-sync.js"
PID_FILE="$WORKSPACE_DIR/.sync-daemon.pid"
LOG_FILE="$WORKSPACE_DIR/logs/sync-daemon.log"
SYNC_INTERVAL=14400  # 4 hours in seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check if daemon is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Start daemon
start_daemon() {
    if is_running; then
        echo -e "${YELLOW}Daemon is already running (PID: $(cat "$PID_FILE"))${NC}"
        return 1
    fi

    echo -e "${GREEN}Starting GitHub Copilot Sync Daemon...${NC}"
    
    # Start background process
    (
        log "Daemon started (PID: $$)"
        
        while true; do
            log "Running sync..."
            
            if node "$SYNC_SCRIPT" sync --quiet >> "$LOG_FILE" 2>&1; then
                log "Sync completed successfully"
            else
                log "Sync failed with error code $?"
            fi
            
            log "Sleeping for $SYNC_INTERVAL seconds..."
            sleep "$SYNC_INTERVAL"
        done
    ) &
    
    DAEMON_PID=$!
    echo "$DAEMON_PID" > "$PID_FILE"
    
    echo -e "${GREEN}✓ Daemon started (PID: $DAEMON_PID)${NC}"
    echo "  Log file: $LOG_FILE"
    echo "  Sync interval: $(($SYNC_INTERVAL / 3600)) hours"
}

# Stop daemon
stop_daemon() {
    if ! is_running; then
        echo -e "${YELLOW}Daemon is not running${NC}"
        [ -f "$PID_FILE" ] && rm "$PID_FILE"
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    echo -e "${YELLOW}Stopping daemon (PID: $PID)...${NC}"
    
    kill "$PID"
    
    # Wait for process to stop
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            break
        fi
        sleep 0.5
    done
    
    # Force kill if still running
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "Process didn't stop gracefully, forcing..."
        kill -9 "$PID"
    fi
    
    rm "$PID_FILE"
    log "Daemon stopped"
    echo -e "${GREEN}✓ Daemon stopped${NC}"
}

# Show daemon status
show_status() {
    if is_running; then
        PID=$(cat "$PID_FILE")
        echo -e "${GREEN}✓ Daemon is running${NC}"
        echo "  PID: $PID"
        echo "  Log file: $LOG_FILE"
        echo "  Sync interval: $(($SYNC_INTERVAL / 3600)) hours"
        
        # Show last sync info
        if [ -f "$LOG_FILE" ]; then
            echo ""
            echo "Last 5 log entries:"
            tail -n 5 "$LOG_FILE" | sed 's/^/  /'
        fi
    else
        echo -e "${RED}✗ Daemon is not running${NC}"
        [ -f "$PID_FILE" ] && rm "$PID_FILE"
    fi
}

# Restart daemon
restart_daemon() {
    echo "Restarting daemon..."
    stop_daemon
    sleep 1
    start_daemon
}

# Main command handler
case "${1:-start}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    status)
        show_status
        ;;
    restart)
        restart_daemon
        ;;
    logs)
        if [ -f "$LOG_FILE" ]; then
            tail -f "$LOG_FILE"
        else
            echo "No log file found"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart|logs}"
        exit 1
        ;;
esac
