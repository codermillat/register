#!/usr/bin/env python3
"""
Binance Price Alert System
Set price alerts and get notified when targets are hit

Usage:
    python3 set_price_alert.py <symbol> <above|below> <price>
    python3 set_price_alert.py --list
    python3 set_price_alert.py --remove <symbol>
"""

import json
import os
import sys
from datetime import datetime

ALERTS_FILE = "/tmp/binance_price_alerts.json"

def load_alerts():
    """Load existing alerts"""
    if os.path.exists(ALERTS_FILE):
        with open(ALERTS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_alerts(alerts):
    """Save alerts to file"""
    with open(ALERTS_FILE, 'w') as f:
        json.dump(alerts, f, indent=2)

def add_alert(symbol: str, direction: str, target_price: float):
    """Add a new price alert"""
    alerts = load_alerts()
    
    symbol = symbol.upper()
    alerts[symbol] = {
        'direction': direction,  # 'above' or 'below'
        'target_price': target_price,
        'created_at': datetime.now().isoformat(),
        'triggered': False
    }
    
    save_alerts(alerts)
    direction_text = "↑ above" if direction == 'above' else "↓ below"
    print(f"✅ Alert set: {symbol} - Notify when price goes {direction_text} ${target_price:,.2f}")

def remove_alert(symbol: str):
    """Remove an alert"""
    alerts = load_alerts()
    symbol = symbol.upper()
    
    if symbol in alerts:
        del alerts[symbol]
        save_alerts(alerts)
        print(f"✅ Alert removed: {symbol}")
    else:
        print(f"⚠️ No alert found for {symbol}")

def list_alerts():
    """List all active alerts"""
    alerts = load_alerts()
    
    if not alerts:
        print("📭 No price alerts configured")
        return
    
    print("\n📊 Active Price Alerts:")
    print("-" * 60)
    for symbol, data in alerts.items():
        direction = "↑" if data['direction'] == 'above' else "↓"
        status = "🔔 TRIGGERED" if data['triggered'] else "⏳ Active"
        print(f"  {direction} {symbol:<10} ${data['target_price']:<14} {status}")
    print("-" * 60)

def check_alerts(current_prices: dict):
    """Check if any alerts should trigger"""
    alerts = load_alerts()
    triggered = []
    
    for symbol, data in alerts.items():
        if data['triggered']:
            continue
            
        if symbol not in current_prices:
            continue
        
        current_price = current_prices[symbol]
        target_price = data['target_price']
        
        if data['direction'] == 'above' and current_price >= target_price:
            data['triggered'] = True
            triggered.append((symbol, current_price, target_price))
        elif data['direction'] == 'below' and current_price <= target_price:
            data['triggered'] = True
            triggered.append((symbol, current_price, target_price))
    
    if triggered:
        save_alerts(alerts)
        for symbol, current, target in triggered:
            print(f"\n🔔 PRICE ALERT: {symbol} is now ${current:,.2f} (target: ${target:,.2f})")
    
    return triggered

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    if sys.argv[1] == '--list':
        list_alerts()
    elif sys.argv[1] == '--remove':
        if len(sys.argv) < 3:
            print("Usage: --remove <symbol>")
            sys.exit(1)
        remove_alert(sys.argv[2])
    elif len(sys.argv) >= 4:
        symbol = sys.argv[1]
        direction = sys.argv[2].lower()
        try:
            price = float(sys.argv[3])
            if direction not in ['above', 'below']:
                raise ValueError
            add_alert(symbol, direction, price)
        except ValueError:
            print("Usage: <symbol> <above|below> <price>")
            sys.exit(1)
    else:
        print(__doc__)
