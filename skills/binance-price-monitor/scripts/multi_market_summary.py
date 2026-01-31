#!/usr/bin/env python3
"""
Binance Multi-Market Summary
Get price summary across multiple exchanges and markets

Features:
- Binance Spot prices
- Binance Futures prices  
- Cross-exchange comparison
- Market dominance analysis
"""

import asyncio
import aiohttp
import json
from datetime import datetime

EXCHANGES = {
    'binance_spot': 'https://api.binance.com/api/v3/ticker/24hr',
    'binance_futures': 'https://fapi.binance.com/fapi/v1/ticker/24hr'
}

TOP_PAIRS = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
    'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'LTCUSDT', 'DOTUSDT'
]

async def fetch_binance_spot(session, symbol: str):
    """Fetch Binance spot price"""
    try:
        async with session.get(
            f"{EXCHANGES['binance_spot']}?symbol={symbol}"
        ) as resp:
            if resp.status == 200:
                return await resp.json()
    except:
        pass
    return None

async def fetch_binance_futures(session, symbol: str):
    """Fetch Binance futures price"""
    try:
        async with session.get(
            f"{EXCHANGES['binance_futures']}?symbol={symbol}"
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                if isinstance(data, list):
                    for item in data:
                        if item.get('symbol') == symbol:
                            return item
                return data
    except:
        pass
    return None

async def get_market_summary():
    """Get comprehensive market summary"""
    
    print(f"\n{'='*80}")
    print(f"  Binance Market Summary - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}\n")
    
    async with aiohttp.ClientSession() as session:
        # Fetch all data concurrently
        tasks = []
        for pair in TOP_PAIRS:
            tasks.append(fetch_binance_spot(session, pair))
            tasks.append(fetch_binance_futures(session, pair.replace('USDT', 'USDT')))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Organize results
    spot_data = {}
    futures_data = {}
    
    for i, result in enumerate(results):
        if isinstance(result, dict) and result:
            pair = result.get('symbol', '')
            if 'USDT' in pair and len(pair) <= 12:
                if i % 2 == 0:
                    spot_data[pair] = result
                else:
                    futures_data[pair] = result
    
    # Print Spot Market Summary
    print("📈 SPOT MARKET")
    print("-" * 80)
    print(f"{'Symbol':<12} {'Price':<16} {'24h Change':<12} {'High':<14} {'Low':<14} {'Volume (USDT)'}")
    print("-" * 80)
    
    gainers = []
    losers = []
    
    for pair in TOP_PAIRS:
        if pair in spot_data:
            data = spot_data[pair]
            price = float(data.get('lastPrice', 0))
            change = float(data.get('priceChangePercent', 0))
            high = float(data.get('highPrice', 0))
            low = float(data.get('lowPrice', 0))
            volume = float(data.get('quoteVolume', 0))
            
            emoji = "🟢" if change > 0 else "🔴" if change < 0 else "⚪"
            print(f"{emoji} {pair:<10} ${price:>14,.2f}   {change:>+9.2f}%   ${high:<13,.2f} ${low:<13,.2f}   {volume:>14,.0f}")
            
            if change > 3:
                gainers.append((pair, change, price))
            elif change < -3:
                losers.append((pair, change, price))
    
    print("-" * 80)
    
    # Top Gainers & Losers
    print("\n🚀 TOP GAINERS (24h > +3%):")
    if gainers:
        gainers.sort(key=lambda x: x[1], reverse=True)
        for pair, change, price in gainers[:5]:
            print(f"   {pair:<10} {change:>+8.2f}%  @ ${price:,.2f}")
    else:
        print("   None")
    
    print("\n📉 TOP LOSERS (24h < -3%):")
    if losers:
        losers.sort(key=lambda x: x[1])
        for pair, change, price in losers[:5]:
            print(f"   {pair:<10} {change:>8.2f}%  @ ${price:,.2f}")
    else:
        print("   None")
    
    # Market Stats
    total_volume = sum(float(d.get('quoteVolume', 0)) for d in spot_data.values())
    avg_change = sum(float(d.get('priceChangePercent', 0)) for d in spot_data.values()) / len(spot_data) if spot_data else 0
    
    print(f"\n📊 MARKET STATS:")
    print(f"   Total 24h Volume: ${total_volume:,.0f}")
    print(f"   Average Change:   {avg_change:+.2f}%")
    print(f"   Tracked Pairs:    {len(spot_data)}/{len(TOP_PAIRS)}")
    
    print(f"\n💡 Analysis:")
    if avg_change > 2:
        print("   Market is BULLISH - Consider buying dips")
    elif avg_change < -2:
        print("   Market is BEARISH - Caution advised, look for support")
    else:
        print("   Market is NEUTRAL - Sideways movement expected")
    
    print()
    
    return {'spot': spot_data, 'futures': futures_data}

if __name__ == "__main__":
    asyncio.run(get_market_summary())
