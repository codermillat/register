#!/bin/bash
# Perplexity Search Test Suite
# Run this to verify the skill works correctly

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED=$((PASSED + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED=$((FAILED + 1))
}

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Perplexity Search Test Suite       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

cd "$SKILL_DIR"

# Test 1: Check dependencies
log_test "Checking dependencies..."
if command -v jq &> /dev/null; then
    log_pass "jq is installed"
else
    log_fail "jq is not installed"
fi

if command -v curl &> /dev/null; then
    log_pass "curl is installed"
else
    log_fail "curl is not installed"
fi

# Test 2: Check configuration
log_test "Checking configuration..."
if [ -f "$HOME/.config/perplexity/credentials.json" ]; then
    log_pass "Config file exists"
    
    api_key=$(jq -r '.api_key' "$HOME/.config/perplexity/credentials.json")
    if [[ "$api_key" =~ ^pplx- ]]; then
        log_pass "API key format is valid"
    else
        log_fail "API key format is invalid"
    fi
elif [ -n "${PERPLEXITY_API_KEY:-}" ]; then
    log_pass "API key found in environment"
else
    log_fail "No API key found"
fi

# Test 3: API connection
log_test "Testing API connection..."
if ./scripts/perplexity.sh test &> /dev/null; then
    log_pass "API connection successful"
else
    log_fail "API connection failed"
fi

# Test 4: Basic search
log_test "Testing basic search..."
result=$(./scripts/perplexity.sh search "what is 2+2" 2>&1)
if echo "$result" | grep -q "4"; then
    log_pass "Basic search works"
else
    log_fail "Basic search failed"
fi

# Test 5: JSON output
log_test "Testing JSON output..."
result=$(./scripts/perplexity.sh search "test" --json 2>&1)
if echo "$result" | jq -e '.answer' &> /dev/null; then
    log_pass "JSON output works"
else
    log_fail "JSON output failed"
fi

# Test 6: Research mode
log_test "Testing research mode..."
result=$(./scripts/perplexity.sh research "OpenClaw" 2>&1)
if [ -n "$result" ]; then
    log_pass "Research mode works"
else
    log_fail "Research mode failed"
fi

# Test 7: Fact-check mode
log_test "Testing fact-check mode..."
result=$(./scripts/perplexity.sh fact "the sky is blue" 2>&1)
if echo "$result" | grep -qiE "(true|yes|correct)"; then
    log_pass "Fact-check mode works"
else
    log_fail "Fact-check mode failed"
fi

# Test 8: Compare mode
log_test "Testing compare mode..."
result=$(./scripts/perplexity.sh compare "apples vs oranges" 2>&1)
if [ -n "$result" ]; then
    log_pass "Compare mode works"
else
    log_fail "Compare mode failed"
fi

# Test 9: Usage tracking
log_test "Testing usage tracking..."
./scripts/perplexity.sh search "test query" &> /dev/null
if [ -f "$HOME/.config/perplexity/usage.json" ]; then
    log_pass "Usage tracking works"
else
    log_fail "Usage tracking failed"
fi

# Test 10: Node.js API
log_test "Testing Node.js API..."
if node -e "const P = require('./scripts/perplexity-search.js'); new P();" &> /dev/null; then
    log_pass "Node.js API loads"
else
    log_fail "Node.js API failed"
fi

# Test 11: Error handling
log_test "Testing error handling..."
result=$(./scripts/perplexity.sh search "" 2>&1 || true)
if echo "$result" | grep -q "Usage"; then
    log_pass "Error handling works"
else
    log_fail "Error handling failed"
fi

# Test 12: Scripts are executable
log_test "Checking script permissions..."
if [ -x "./scripts/perplexity.sh" ]; then
    log_pass "perplexity.sh is executable"
else
    log_fail "perplexity.sh is not executable"
fi

if [ -x "./scripts/setup.sh" ]; then
    log_pass "setup.sh is executable"
else
    log_fail "setup.sh is not executable"
fi

if [ -x "./scripts/perplexity-search.js" ]; then
    log_pass "perplexity-search.js is executable"
else
    log_fail "perplexity-search.js is not executable"
fi

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Skill is ready to use:"
    echo "  ./scripts/perplexity.sh search \"your query\""
    exit 0
else
    echo ""
    echo -e "${RED}❌ Some tests failed.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Run: ./scripts/setup.sh"
    echo "  - Install: apt install jq curl"
    echo "  - Check API key at: perplexity.ai/settings/api"
    exit 1
fi
