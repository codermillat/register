#!/bin/bash

###############################################################################
# GitHub Copilot Sync System - Test Suite
# 
# Comprehensive tests for all components
###############################################################################

WORKSPACE_DIR="$HOME/.openclaw/workspace"
cd "$WORKSPACE_DIR" || exit 1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Print section header
section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Print test result
test_result() {
    local name=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "pass" ]; then
        echo -e "  ${GREEN}✓${NC} $name"
        [ -n "$message" ] && echo -e "    ${message}"
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}✗${NC} $name"
        [ -n "$message" ] && echo -e "    ${RED}$message${NC}"
        ((TESTS_FAILED++))
    fi
}

# Run test command
run_test() {
    local name=$1
    local command=$2
    
    if eval "$command" > /dev/null 2>&1; then
        test_result "$name" "pass"
    else
        test_result "$name" "fail" "Command failed: $command"
    fi
}

###############################################################################
# Test 1: File Existence
###############################################################################

section "TEST 1: File Existence"

for file in \
    "github-api-client.js" \
    "account-rotator.js" \
    "usage-monitor.js" \
    "github-copilot-sync.js" \
    "openclaw-integration.js" \
    "sync-daemon.sh" \
    "SYNC-SYSTEM.md" \
    "accounts.json"; do
    
    if [ -f "$file" ]; then
        test_result "File exists: $file" "pass"
    else
        test_result "File exists: $file" "fail" "File not found"
    fi
done

# Check daemon is executable
if [ -x "sync-daemon.sh" ]; then
    test_result "sync-daemon.sh is executable" "pass"
else
    test_result "sync-daemon.sh is executable" "fail"
fi

###############################################################################
# Test 2: Node.js Syntax Check
###############################################################################

section "TEST 2: Node.js Syntax Check"

for file in \
    "github-api-client.js" \
    "account-rotator.js" \
    "usage-monitor.js" \
    "github-copilot-sync.js" \
    "openclaw-integration.js"; do
    
    if node -c "$file" 2>/dev/null; then
        test_result "Syntax check: $file" "pass"
    else
        test_result "Syntax check: $file" "fail" "Syntax error detected"
    fi
done

###############################################################################
# Test 3: Module Loading
###############################################################################

section "TEST 3: Module Loading"

# Test GitHubAPIClient
if node -e "const G = require('./github-api-client'); new G();" 2>/dev/null; then
    test_result "Load GitHubAPIClient" "pass"
else
    test_result "Load GitHubAPIClient" "fail"
fi

# Test AccountRotator
if node -e "const A = require('./account-rotator'); new A();" 2>/dev/null; then
    test_result "Load AccountRotator" "pass"
else
    test_result "Load AccountRotator" "fail"
fi

# Test UsageMonitor
if node -e "const U = require('./usage-monitor'); new U();" 2>/dev/null; then
    test_result "Load UsageMonitor" "pass"
else
    test_result "Load UsageMonitor" "fail"
fi

# Test GitHubCopilotSync
if node -e "const S = require('./github-copilot-sync'); new S();" 2>/dev/null; then
    test_result "Load GitHubCopilotSync" "pass"
else
    test_result "Load GitHubCopilotSync" "fail"
fi

# Test OpenClawIntegration
if node -e "const O = require('./openclaw-integration'); new O();" 2>/dev/null; then
    test_result "Load OpenClawIntegration" "pass"
else
    test_result "Load OpenClawIntegration" "fail"
fi

###############################################################################
# Test 4: CLI Help/Usage
###############################################################################

section "TEST 4: CLI Help/Usage"

# Test main sync CLI
if node github-copilot-sync.js help 2>&1 | grep -q "Usage"; then
    test_result "github-copilot-sync.js help" "pass"
else
    test_result "github-copilot-sync.js help" "fail"
fi

# Test daemon CLI
if ./sync-daemon.sh 2>&1 | grep -q "Usage"; then
    test_result "sync-daemon.sh help" "pass"
else
    test_result "sync-daemon.sh help" "fail"
fi

###############################################################################
# Test 5: Account Rotator Logic
###############################################################################

section "TEST 5: Account Rotator Logic"

echo "Running account rotation test..."
if node account-rotator.js accounts.json claude-sonnet-4.5 medium > /tmp/rotation-test.txt 2>&1; then
    
    # Check if output contains expected elements
    if grep -q "Selected Account" /tmp/rotation-test.txt && \
       grep -q "Score" /tmp/rotation-test.txt && \
       grep -q "Account Status Summary" /tmp/rotation-test.txt; then
        test_result "Account rotation algorithm" "pass" "Selected account successfully"
    else
        test_result "Account rotation algorithm" "fail" "Missing expected output"
    fi
else
    test_result "Account rotation algorithm" "fail" "Command failed"
fi

rm -f /tmp/rotation-test.txt

###############################################################################
# Test 6: Usage Monitor
###############################################################################

section "TEST 6: Usage Monitor"

echo "Running usage monitor test..."
if node usage-monitor.js accounts.json > /tmp/monitor-test.txt 2>&1; then
    
    # Check if output contains expected elements
    if grep -q "SUMMARY" /tmp/monitor-test.txt && \
       grep -q "Total Accounts" /tmp/monitor-test.txt; then
        test_result "Usage monitoring" "pass" "Generated health report"
    else
        test_result "Usage monitoring" "fail" "Missing expected output"
    fi
else
    test_result "Usage monitoring" "fail" "Command failed"
fi

rm -f /tmp/monitor-test.txt

###############################################################################
# Test 7: Main Sync CLI
###############################################################################

section "TEST 7: Main Sync CLI"

# Test status command
echo "Testing status command..."
if node github-copilot-sync.js status > /tmp/status-test.json 2>&1; then
    
    # Validate JSON output
    if jq . /tmp/status-test.json > /dev/null 2>&1; then
        test_result "Status command (JSON output)" "pass"
    else
        test_result "Status command (JSON output)" "fail" "Invalid JSON"
    fi
else
    test_result "Status command" "fail" "Command failed"
fi

rm -f /tmp/status-test.json

# Test select command
echo "Testing select command..."
if node github-copilot-sync.js select --model claude-sonnet-4.5 --complexity medium > /tmp/select-test.json 2>&1; then
    
    # Validate JSON output
    if jq . /tmp/select-test.json > /dev/null 2>&1; then
        test_result "Select command (JSON output)" "pass"
    else
        test_result "Select command (JSON output)" "fail" "Invalid JSON"
    fi
else
    test_result "Select command" "fail" "Command failed"
fi

rm -f /tmp/select-test.json

# Test test-rotation command
echo "Testing test-rotation command..."
if node github-copilot-sync.js test-rotation claude-sonnet-4.5 > /tmp/test-rotation.txt 2>&1; then
    
    if grep -q "SIMPLE Task" /tmp/test-rotation.txt && \
       grep -q "MEDIUM Task" /tmp/test-rotation.txt && \
       grep -q "COMPLEX Task" /tmp/test-rotation.txt; then
        test_result "Test rotation command" "pass"
    else
        test_result "Test rotation command" "fail" "Missing expected output"
    fi
else
    test_result "Test rotation command" "fail" "Command failed"
fi

rm -f /tmp/test-rotation.txt

###############################################################################
# Test 8: Daemon Operations
###############################################################################

section "TEST 8: Daemon Operations"

# Test daemon status (should not be running)
if ./sync-daemon.sh status 2>&1 | grep -q "not running"; then
    test_result "Daemon status (not running)" "pass"
else
    test_result "Daemon status (not running)" "fail"
fi

# Note: We won't actually start the daemon in tests to avoid background processes

###############################################################################
# Test 9: Data Validation
###############################################################################

section "TEST 9: Data Validation"

# Check accounts.json structure
if jq . accounts.json > /dev/null 2>&1; then
    test_result "accounts.json is valid JSON" "pass"
else
    test_result "accounts.json is valid JSON" "fail"
fi

# Check required fields
if jq -e '.accounts | length > 0' accounts.json > /dev/null 2>&1; then
    test_result "accounts.json has accounts array" "pass"
else
    test_result "accounts.json has accounts array" "fail"
fi

# Check first account structure
if jq -e '.accounts[0] | has("id") and has("username") and has("token")' accounts.json > /dev/null 2>&1; then
    test_result "Account has required fields" "pass"
else
    test_result "Account has required fields" "fail"
fi

###############################################################################
# Test 10: Integration Test
###############################################################################

section "TEST 10: Integration Test"

echo "Testing OpenClaw integration..."
if node openclaw-integration.js > /tmp/integration-test.txt 2>&1; then
    
    if grep -q "Selected:" /tmp/integration-test.txt && \
       grep -q "Usage:" /tmp/integration-test.txt; then
        test_result "OpenClaw integration" "pass" "Successfully selected and tracked usage"
    else
        test_result "OpenClaw integration" "fail" "Missing expected output"
    fi
else
    test_result "OpenClaw integration" "fail" "Command failed"
fi

rm -f /tmp/integration-test.txt

###############################################################################
# Test Summary
###############################################################################

section "TEST SUMMARY"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
PASS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo "  Total Tests: $TOTAL_TESTS"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo -e "  Pass Rate: ${PASS_RATE}%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
