---
name: binance-price-monitor
description: Real-time cryptocurrency price monitoring via Binance REST API (pure Bash + cURL, no dependencies)
metadata: {"clawdbot":{"emoji":"📊","always":true,"requires":{"bins":["curl","bc","sed"]}}}
---

# Binance Price Monitor 📊

Real-time cryptocurrency price monitoring using Binance REST API. **No Python or aiohttp required!**

## Features

- 📈 **Live prices** - 24hr ticker data from Binance
- 🎨 **Color-coded** - Green for gains, red for losses
- ⚡ **Lightweight** - Pure Bash + cURL, no dependencies
- 🔄 **Auto-refresh** - Configurable update interval
- 📊 **Multi-coin** - Monitor multiple coins simultaneously

## Requirements

| Tool | Status |
|------|--------|
| `curl` | ✅ Required (for API calls) |
| `bc` | ✅ Required (for math) |
| `sed` | ✅ Required (for formatting) |
| `python3` | ❌ Not required |

All tools are pre-installed on macOS/Linux.

## Usage

### Quick Start

```bash
# Make executable
chmod +x {baseDir}/scripts/price-monitor.sh

# Monitor default coins (BTC, ETH, BNB, SOL, XRP)
python3 {baseDir}/scripts/price-monitor.sh

# Monitor specific coins
python3 {baseDir}/scripts/price-monitor.sh BTC ETH SOL

# Monitor with slower updates (5 seconds)
python3 {baseDir}/scripts/price-monitor.sh BTC --interval 5
```

### Output Example

```
╔════════════════════════════════════════════════════════════════════════╗
║                  Binance Price Monitor (Bash + cURL)                   ║
║                         2025-01-31 14:30:00                            ║
╚════════════════════════════════════════════════════════════════════════╝
Monitoring: BTCUSDT ETHUSDT BNBUSDT SOLUSDT XRPUSDT
Update every: 2s

Press Ctrl+C to stop

Symbol       Price             24h Change    High             Low              Volume
────────────────────────────────────────────────────────────────────────────
BTCUSDT      $103,666.00       ▲ +1.23%      $104,500.00      $102,000.00      45,234,567,890
ETHUSDT      $17,680.00        ▼ -7.07%      $18,500.00       $17,000.00       12,345,678,901
BNBUSDT      $5,621.00         ▲ +0.50%      $5,700.00        $5,500.00        1,234,567,890
SOLUSDT      $759.03           ▼ -6.50%      $800.00          $720.00          345,678,901
XRPUSDT      $11.43            ▼ -7.43%      $12.50           $10.80           205,410,000

Last update: 14:30:02 | Press Ctrl+C to stop
```

---

## Supported Trading Pairs

| Symbol | Name |
|--------|------|
| BTCUSDT | Bitcoin |
| ETHUSDT | Ethereum |
| BNBUSDT | BNB |
| SOLUSDT | Solana |
| XRPUSDT | Ripple |
| ADAUSDT | Cardano |
| DOGEUSDT | Dogecoin |
| MATICUSDT | Polygon |
| LTCUSDT | Litecoin |
| DOTUSDT | Polkadot |
| LINKUSDT | Chainlink |
| AVAXUSDT | Avalanche |
| UNIUSDT | Uniswap |
| NEARUSDT | NEAR Protocol |
| TRUMPUSDT | Official Trump |
| PEPEUSDT | Pepe |
| WIFUSDT | Dogwifhat |

Add any other Binance trading pair (e.g., `BTCUSDT`, `ETHUSDT`).

---

## Command Options

| Option | Description |
|--------|-------------|
| `symbols` | Trading pairs to monitor (space-separated) |
| `--interval, -i` | Update interval in seconds (default: 2) |
| `--help, -h` | Show help |

**Examples:**
```bash
# Monitor single coin
./price-monitor.sh BTC

# Monitor multiple coins
./price-monitor.sh BTC ETH SOL ADA

# Faster updates (1 second)
./price-monitor.sh BTC ETH --interval 1

# Slower updates (10 seconds)
./price-monitor.sh BTC --interval 10
```

---

## API Used

- **Endpoint:** `https://api.binance.com/api/v3/ticker/24hr?symbol=<SYMBOL>`
- **Rate Limit:** 1200 requests/minute (generous)
- **Data:** 24-hour price statistics (price, change, high, low, volume)

---

## Files

| File | Description |
|------|-------------|
| `scripts/price-monitor.sh` | Main monitoring script (Bash) |

---

## Advanced: Price Alerts (Cron)

Schedule periodic price checks with cron:

```bash
# Run every 15 minutes and log to file
*/15 * * * * cd /path/to/skill && ./scripts/price-monitor.sh BTC ETH --interval 1 >> /tmp/crypto_prices.log 2>&1
```

Or create a simple alert script:

```bash
#!/bin/bash
# check_btc_alert.sh
PRICE=$(curl -s "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT" | grep -o '"lastPrice":"[^"]*"' | sed 's/"lastPrice":"//;s/"//')
TARGET=100000

if (( $(echo "$PRICE > $TARGET" | bc -l) )); then
    echo "🚨 BTC is above \$$TARGET: \$$PRICE"
fi
```

Add to cron for monitoring:
```bash
# Check BTC every 5 minutes
*/5 * * * * /path/to/check_btc_alert.sh >> /tmp/btc_alerts.log
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "command not found: curl" | Install curl: `brew install curl` |
| "command not found: bc" | Install bc: `brew install bc` |
| No price data | Check internet connection |
| Rate limiting | Increase `--interval` value |

---

## Comparison: Bash vs Python

| Feature | Bash Version | Python Version |
|---------|--------------|----------------|
| Dependencies | None (curl, bc, sed) | python3, aiohttp |
| Real-time | Polling (REST API) | WebSocket streaming |
| CPU usage | Low | Very low |
| Cross-platform | ✅ | ✅ |
| Best for | Simple monitoring, no deps | Advanced features, alerts |

---

## License

MIT License - Free to use and modify.

## Links

- [Binance API Docs](https://binance-docs.github.io/apidocs/spot/)
- [Binance Trading Pairs](https://www.binance.com/en/trade)
- [OpenClaw Docs](https://docs.openclaw.ai)
