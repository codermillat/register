#!/bin/bash
#
# Binance Price Monitor (Pure Bash + cURL)
#
# Usage: ./price-monitor.sh [symbols] [--interval N]
#

BINANCE_API="https://api.binance.com/api/v3"
INTERVAL=3
SYMBOLS="BTCUSDT ETHUSDT SOLUSDT ADAUSDT DOGEUSDT DOTUSDT FILUSDT"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --interval|-i)
            INTERVAL="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [symbols...] [--interval N]"
            exit 0
            ;;
        *)
            SYMBOLS="$SYMBOLS ${1^^}"
            shift
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

get_price() {
    curl -s -m 5 "${BINANCE_API}/ticker/24hr?symbol=$1" 2>/dev/null
}

clear
echo -e "${CYAN}=============================================="
echo "   Binance Price Monitor"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "==============================================${NC}"
echo ""

printf "%-10s %-16s %-12s %-16s\n" "Symbol" "Price (USDT)" "24h Change" "24h Volume"
echo "----------------------------------------------"

trap 'echo ""; exit 0' INT

while true; do
    for symbol in $SYMBOLS; do
        data=$(get_price "$symbol")
        
        if [[ -n "$data" ]] && [[ "$data" != *"code"* ]]; then
            # Use grep -o to extract values
            price=$(echo "$data" | grep -o '"lastPrice":"[^"]*"' | cut -d'"' -f4)
            change=$(echo "$data" | grep -o '"priceChangePercent":"[^"]*"' | cut -d'"' -f4)
            volume=$(echo "$data" | grep -o '"quoteVolume":"[^"]*"' | cut -d'"' -f4)
            
            if [[ "$change" == *"-"* ]] || [[ $(echo "$change < 0" 2>/dev/null) == "1" ]]; then
                color=$RED
                arrow="▼"
            else
                color=$GREEN
                arrow="▲"
            fi
            
            printf "${color}%-8s \$%-15s %s %-9s %s${NC}\n" "${symbol/USDT/}" "$price" "$arrow" "${change}%" "$volume"
        else
            echo -e "${RED}Error: $symbol${NC}"
        fi
    done
    
    echo ""
    echo "Last update: $(date '+%H:%M:%S')  (Ctrl+C to stop)"
    sleep "$INTERVAL"
    echo -en "\033[8A"
done
