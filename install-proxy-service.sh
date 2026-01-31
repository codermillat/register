#!/bin/bash
# Install GitHub Copilot Rotation Proxy as systemd service

set -e

echo "Installing GitHub Copilot Rotation Proxy service..."

# Copy service file
sudo cp /home/openclaw/.openclaw/workspace/copilot-proxy.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service
sudo systemctl enable copilot-proxy.service

# Stop existing proxy if running
fuser -k 11435/tcp 2>/dev/null || true
sleep 2

# Start service
sudo systemctl start copilot-proxy.service

# Check status
sudo systemctl status copilot-proxy.service --no-pager

echo ""
echo "✓ Service installed and started"
echo ""
echo "Commands:"
echo "  sudo systemctl status copilot-proxy   # Check status"
echo "  sudo systemctl restart copilot-proxy  # Restart proxy"
echo "  sudo systemctl stop copilot-proxy     # Stop proxy"
echo "  sudo journalctl -u copilot-proxy -f   # View logs"
echo ""
