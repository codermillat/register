#!/usr/bin/env python3
"""
Binance WebSocket Price Monitor
Real-time cryptocurrency price monitoring using Binance WebSocket API

Usage:
    python3 websocket_monitor.py [symbols] [--interval N]
    
Examples:
    python3 websocket_monitor.py BTC ETH SOL           # Monitor BTC, ETH, SOL
    python3 websocket_monitor.py BTC ETH --interval 5  # Update every 5 seconds
    python3 websocket_monitor.py                       # Monitor top 10 by default
"""

import asyncio
import aiohttp
import json
import sys
import argparse
from datetime import datetime
from collections import OrderedDict

# Configuration
BINANCE_WS_BASE = "wss://stream.binance.com:9443/ws"
DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", 
                   "DOGEUSDT", "ADAUSDT", "MATICUSDT", "LTCUSDT", "DOTUSDT"]

# Store latest prices
price_cache = OrderedDict()


def format_price(price: float) -> str:
    """Format price based on typical tick size"""
    if price >= 1000:
        return f"{price:,.2f}"
    elif price >= 1:
        return f"{price:,.4f}"
    elif price >= 0.01:
        return f"{price:,.6f}"
    else:
        return f"{price:,.10f}"


def get_price_change_color(change: float) -> str:
    """Get color for price change"""
    if change > 0:
        return "🟢"
    elif change < 0:
        return "🔴"
    else:
        return "⚪"


async def connect_websocket(symbols: list, interval: int = 2):
    """Connect to Binance WebSocket and stream prices"""
    
    # Build streams list
    streams = [f"{symbol.lower()}@ticker" for symbol in symbols]
    ws_url = f"{BINANCE_WS_BASE}/{'/'.join(streams)}"
    
    print(f"\n{'='*70}")
    print(f"  Binance WebSocket Price Monitor")
    print(f"{'='*70}")
    print(f"  📡 Connecting to: {len(symbols)} symbols")
    print(f"  ⏱️  Update interval: {interval}s")
    print(f"  🔗 Stream: {ws_url[:80]}...")
    print(f"{'='*70}\n")
    
    async with aiohttp.ClientSession() as session:
        async with session.ws_connect(ws_url) as ws:
            print(f"{'Symbol':<12} {'Price':<18} {'24h Change':<12} {'24h High':<16} {'24h Low':<16} {'Volume'}")
            print("-" * 90)
            
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    try:
                        data = json.loads(msg.data)
                        
                        symbol = data.get('s', '')  # Symbol
                        price = float(data.get('c', 0))  # Current price
                        price_change = float(data.get('P', 0))  # Price change percent
                        high_24h = float(data.get('h', 0))  # 24h high
                        low_24h = float(data.get('l', 0))  # 24h low
                        volume = float(data.get('v', 0))  # Volume
                        
                        # Store in cache
                        price_cache[symbol] = {
                            'price': price,
                            'change': price_change,
                            'high': high_24h,
                            'low': low_24h,
                            'volume': volume,
                            'time': datetime.now().isoformat()
                        }
                        
                        # Get cached data for display
                        cache_data = price_cache.get(symbol, {})
                        display_price = format_price(cache_data.get('price', price))
                        display_change = f"{cache_data.get('change', price_change):.2f}%"
                        display_high = format_price(cache_data.get('high', high_24h))
                        display_low = format_price(cache_data.get('low', low_24h))
                        display_volume = f"{cache_data.get('volume', volume):,.0f}"
                        
                        color = get_price_change_color(cache_data.get('change', price_change))
                        
                        # Clear line and print updated price
                        sys.stdout.write(f"\r{color} {symbol:<10} ${display_price:<16} {display_change:<11} ${display_high:<15} ${display_low:<15} {display_volume}")
                        sys.stdout.flush()
                        
                    except Exception as e:
                        print(f"\nError processing message: {e}")
                        continue


async def get_rest_prices(symbols: list):
    """Get initial prices via REST API (fallback if WebSocket fails)"""
    base_url = "https://api.binance.com/api/v3/ticker/24hr"
    
    async with aiohttp.ClientSession() as session:
        results = []
        for symbol in symbols:
            try:
                async with session.get(f"{base_url}?symbol={symbol}") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        results.append(data)
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
        return results


def print_price_table(prices: list):
    """Print prices in table format"""
    if not prices:
        print("No price data available")
        return
    
    print(f"\n{'='*90}")
    print(f"  Binance 24-Hour Price Summary")
    print(f"{'='*90}")
    print(f"\n{'Symbol':<12} {'Last Price':<16} {'Change %':<12} {'High':<14} {'Low':<14} {'Volume':<16}")
    print("-" * 90)
    
    for data in prices:
        symbol = data.get('symbol', '')
        price = float(data.get('lastPrice', 0))
        change = float(data.get('priceChangePercent', 0))
        high = float(data.get('highPrice', 0))
        low = float(data.get('lowPrice', 0))
        volume = float(data.get('quoteVolume', 0))
        
        color = get_price_change_color(change)
        print(f"{color} {symbol:<10} ${format_price(price):<14} {change:>+9.2f}%   ${format_price(high):<13} ${format_price(low):<13} {volume:>14,.0f}")
    
    print("-" * 90)
    return prices


async def main():
    parser = argparse.ArgumentParser(description='Binance WebSocket Price Monitor')
    parser.add_argument('symbols', nargs='*', help='Trading pairs (e.g., BTCUSDT ETHUSDT)')
    parser.add_argument('--interval', '-i', type=int, default=2, help='Update interval in seconds')
    parser.add_argument('--table', '-t', action='store_true', help='Show table format (REST API)')
    parser.add_argument('--list', '-l', action='store_true', help='List supported trading pairs')
    
    args = parser.parse_args()
    
    if args.list:
        print("\n📋 Popular Trading Pairs on Binance:")
        print("-" * 40)
        pairs = [
            ("BTCUSDT", "Bitcoin"), ("ETHUSDT", "Ethereum"), ("BNBUSDT", "BNB"),
            ("SOLUSDT", "Solana"), ("XRPUSDT", "Ripple"), ("ADAUSDT", "Cardano"),
            ("DOGEUSDT", "Dogecoin"), ("MATICUSDT", "Polygon"), ("LTCUSDT", "Litecoin"),
            ("DOTUSDT", "Polkadot"), ("LINKUSDT", "Chainlink"), ("AVAXUSDT", "Avalanche"),
            ("UNIUSDT", "Uniswap"), ("ATOMUSDT", "Cosmos"), ("NEARUSDT", "Near"),
            ("MKRUSDT", "Maker"), ("AAVEUSDT", "Aave"), ("DOTUSDT", "Polkadot"),
            ("FILUSDT", "Filecoin"), ("ICPUSDT", "Internet Computer"),
            ("TRUMPUSDT", "Official Trump"), ("PEPEUSDT", "Pepe"), ("WIFUSDT", "Dogwifhat")
        ]
        for pair, name in pairs:
            print(f"  {pair:<12} - {name}")
        print()
        return
    
    symbols = [s.upper() for s in args.symbols] if args.symbols else DEFAULT_SYMBOLS
    interval = max(1, args.interval)  # Minimum 1 second
    
    if args.table:
        # Use REST API for one-time snapshot
        prices = await get_rest_prices(symbols)
        print_price_table(prices)
        print("\n💡 Use without --table for continuous real-time updates via WebSocket")
    else:
        # Use WebSocket for real-time updates
        await connect_websocket(symbols, interval)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Monitor stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
