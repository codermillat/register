#!/bin/bash
# Perplexity AI Setup Script

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CONFIG_DIR="$HOME/.config/perplexity"
CONFIG_FILE="$CONFIG_DIR/credentials.json"

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Perplexity AI Setup Wizard         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Check if already configured
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}⚠️  Configuration already exists at:${NC}"
    echo "   $CONFIG_FILE"
    echo ""
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Get API key
echo -e "${BLUE}Step 1: API Key${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Get your API key from:"
echo -e "${GREEN}https://www.perplexity.ai/settings/api${NC}"
echo ""
echo "New users get \$5 free credit (~2500 queries)"
echo ""

read -p "Enter your Perplexity API key: " api_key

if [ -z "$api_key" ]; then
    echo -e "${RED}❌ API key cannot be empty${NC}"
    exit 1
fi

# Validate format
if [[ ! "$api_key" =~ ^pplx- ]]; then
    echo -e "${YELLOW}⚠️  Warning: API key should start with 'pplx-'${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Choose model
echo ""
echo -e "${BLUE}Step 2: Default Model${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Available models:"
echo "  1) sonar           - Fast, cheap, good for most searches"
echo "  2) sonar-pro       - Enhanced reasoning with better citations"
echo "  3) sonar-reasoning - Deep analysis (slowest, most expensive)"
echo ""
read -p "Choose default model (1-3) [1]: " model_choice

case "${model_choice:-1}" in
    1)
        model="sonar"
        ;;
    2)
        model="sonar-pro"
        ;;
    3)
        model="sonar-reasoning"
        ;;
    *)
        echo -e "${YELLOW}Invalid choice, using sonar${NC}"
        model="sonar"
        ;;
esac

# Advanced options
echo ""
echo -e "${BLUE}Step 3: Advanced Options${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "Max tokens per request [1000]: " max_tokens
max_tokens="${max_tokens:-1000}"

read -p "Temperature (0.0-1.0) [0.2]: " temperature
temperature="${temperature:-0.2}"

# Create config
echo ""
echo -e "${BLUE}Creating configuration...${NC}"

mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_FILE" <<EOF
{
  "api_key": "$api_key",
  "model": "$model",
  "max_tokens": $max_tokens,
  "temperature": $temperature
}
EOF

chmod 600 "$CONFIG_FILE"

echo -e "${GREEN}✅ Configuration saved to:${NC}"
echo "   $CONFIG_FILE"
echo ""

# Test connection
echo -e "${BLUE}Testing API connection...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if "$SCRIPT_DIR/perplexity.sh" test > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful!${NC}"
else
    echo -e "${RED}❌ Connection failed. Please check your API key.${NC}"
    exit 1
fi

# Show usage
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup Complete!                     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo "Try it out:"
echo ""
echo -e "  ${BLUE}./scripts/perplexity.sh search \"latest AI news\"${NC}"
echo -e "  ${BLUE}./scripts/perplexity.sh research \"EdTech trends\"${NC}"
echo -e "  ${BLUE}./scripts/perplexity.sh fact \"Earth is flat\"${NC}"
echo ""
echo "Check usage:"
echo -e "  ${BLUE}./scripts/perplexity.sh usage${NC}"
echo ""
echo "For help:"
echo -e "  ${BLUE}./scripts/perplexity.sh${NC}"
echo ""
