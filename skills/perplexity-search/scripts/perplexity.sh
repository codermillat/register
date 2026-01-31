#!/bin/bash
# Perplexity AI Search Tool
# Usage: ./perplexity.sh <command> <query> [options]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$HOME/.config/perplexity/credentials.json"
USAGE_FILE="$HOME/.config/perplexity/usage.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load configuration
load_config() {
    if [ -f "$CONFIG_FILE" ]; then
        API_KEY=$(jq -r '.api_key' "$CONFIG_FILE")
        MODEL=$(jq -r '.model // "sonar"' "$CONFIG_FILE")
        MAX_TOKENS=$(jq -r '.max_tokens // 1000' "$CONFIG_FILE")
        TEMPERATURE=$(jq -r '.temperature // 0.2' "$CONFIG_FILE")
    elif [ -n "${PERPLEXITY_API_KEY:-}" ]; then
        API_KEY="$PERPLEXITY_API_KEY"
        MODEL="sonar"
        MAX_TOKENS=1000
        TEMPERATURE=0.2
    else
        echo -e "${RED}❌ No API key found${NC}"
        echo ""
        echo "Run: ./scripts/setup.sh"
        echo "Or set: export PERPLEXITY_API_KEY=\"pplx-...\""
        exit 1
    fi
}

# Initialize usage tracking
init_usage() {
    if [ ! -f "$USAGE_FILE" ]; then
        mkdir -p "$(dirname "$USAGE_FILE")"
        cat > "$USAGE_FILE" <<EOF
{
  "total_queries": 0,
  "total_tokens": 0,
  "estimated_cost": 0.0,
  "last_reset": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "queries": []
}
EOF
    fi
}

# Track usage
track_usage() {
    local tokens="$1"
    local cost="$2"
    local query="$3"
    
    local total_queries=$(jq -r '.total_queries' "$USAGE_FILE")
    local total_tokens=$(jq -r '.total_tokens' "$USAGE_FILE")
    local estimated_cost=$(jq -r '.estimated_cost' "$USAGE_FILE")
    
    total_queries=$((total_queries + 1))
    total_tokens=$((total_tokens + tokens))
    estimated_cost=$(echo "$estimated_cost + $cost" | bc -l)
    
    # Update usage file
    jq --arg tokens "$tokens" \
       --arg cost "$cost" \
       --arg query "$query" \
       --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.total_queries += 1 |
        .total_tokens += ($tokens | tonumber) |
        .estimated_cost += ($cost | tonumber) |
        .queries += [{
          "timestamp": $timestamp,
          "query": $query,
          "tokens": ($tokens | tonumber),
          "cost": ($cost | tonumber)
        }]' "$USAGE_FILE" > "$USAGE_FILE.tmp"
    
    mv "$USAGE_FILE.tmp" "$USAGE_FILE"
    
    # Alert if nearing limit (80% of $5)
    if (( $(echo "$estimated_cost > 4.0" | bc -l) )); then
        echo -e "${YELLOW}⚠️  Warning: Estimated cost $${estimated_cost} (80% of free tier)${NC}" >&2
    fi
}

# Make API request
api_request() {
    local query="$1"
    local system_prompt="${2:-You are a helpful search assistant. Provide accurate, cited information.}"
    local use_model="${3:-$MODEL}"
    
    local payload=$(jq -n \
        --arg model "$use_model" \
        --arg system "$system_prompt" \
        --arg query "$query" \
        --arg max_tokens "$MAX_TOKENS" \
        --arg temp "$TEMPERATURE" \
        '{
            model: $model,
            messages: [
                {role: "system", content: $system},
                {role: "user", content: $query}
            ],
            max_tokens: ($max_tokens | tonumber),
            temperature: ($temp | tonumber),
            return_citations: true,
            return_images: false
        }')
    
    local response=$(curl -s -X POST "https://api.perplexity.ai/chat/completions" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    # Check for errors
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        local error_msg=$(echo "$response" | jq -r '.error.message // .error')
        echo -e "${RED}❌ API Error: $error_msg${NC}" >&2
        exit 1
    fi
    
    echo "$response"
}

# Calculate cost based on model
calculate_cost() {
    local tokens="$1"
    local model="$2"
    
    case "$model" in
        sonar)
            echo "scale=6; $tokens * 0.002 / 1000" | bc -l
            ;;
        sonar-pro)
            echo "scale=6; $tokens * 0.01 / 1000" | bc -l
            ;;
        sonar-reasoning)
            echo "scale=6; $tokens * 0.02 / 1000" | bc -l
            ;;
        *)
            echo "0.002"
            ;;
    esac
}

# Command: search
cmd_search() {
    local query="$*"
    
    if [ -z "$query" ]; then
        echo "Usage: $0 search <query>"
        exit 1
    fi
    
    echo -e "${BLUE}🔍 Searching: $query${NC}" >&2
    
    local response=$(api_request "$query" "You are a helpful search assistant. Provide accurate, concise answers with citations when available.")
    
    local answer=$(echo "$response" | jq -r '.choices[0].message.content')
    local citations=$(echo "$response" | jq -r '.citations // []')
    local tokens=$(echo "$response" | jq -r '.usage.total_tokens // 0')
    
    local cost=$(calculate_cost "$tokens" "$MODEL")
    track_usage "$tokens" "$cost" "$query"
    
    if [ "${OUTPUT_JSON:-false}" = "true" ]; then
        echo "$response" | jq '{answer: .choices[0].message.content, citations: .citations, usage: .usage}'
    else
        echo ""
        echo "$answer"
        echo ""
        
        if [ "$citations" != "[]" ] && [ "$citations" != "null" ] && [ "${SHOW_CITATIONS:-false}" = "true" ]; then
            echo -e "${GREEN}📚 Citations:${NC}"
            echo "$citations" | jq -r '.[] | "  - \(.)"'
            echo ""
        fi
        
        echo -e "${YELLOW}📊 Tokens: $tokens | Cost: ~\$$cost${NC}" >&2
    fi
}

# Command: research (with enhanced citations)
cmd_research() {
    local query="$*"
    
    if [ -z "$query" ]; then
        echo "Usage: $0 research <query>"
        exit 1
    fi
    
    echo -e "${BLUE}🔬 Researching: $query${NC}" >&2
    
    local system_prompt="You are a research assistant. Provide comprehensive, well-cited answers. Include multiple sources and cite them inline using [1], [2], etc. format. After your answer, list all citations with full URLs."
    
    local response=$(api_request "$query" "$system_prompt" "${RESEARCH_MODEL:-sonar-pro}")
    
    local answer=$(echo "$response" | jq -r '.choices[0].message.content')
    local citations=$(echo "$response" | jq -r '.citations // []')
    local tokens=$(echo "$response" | jq -r '.usage.total_tokens // 0')
    
    local cost=$(calculate_cost "$tokens" "${RESEARCH_MODEL:-sonar-pro}")
    track_usage "$tokens" "$cost" "$query"
    
    if [ "${OUTPUT_JSON:-false}" = "true" ]; then
        echo "$response" | jq '{answer: .choices[0].message.content, citations: .citations, usage: .usage, mode: "research"}'
    else
        echo ""
        echo "$answer"
        echo ""
        
        if [ "$citations" != "[]" ] && [ "$citations" != "null" ]; then
            echo -e "${GREEN}📚 Sources:${NC}"
            echo "$citations" | jq -r 'to_entries | .[] | "  [\((.key + 1))] \(.value)"'
            echo ""
        fi
        
        echo -e "${YELLOW}📊 Tokens: $tokens | Cost: ~\$$cost${NC}" >&2
    fi
}

# Command: fact (fact-checking mode)
cmd_fact() {
    local query="$*"
    
    if [ -z "$query" ]; then
        echo "Usage: $0 fact <query>"
        exit 1
    fi
    
    echo -e "${BLUE}✓ Fact-checking: $query${NC}" >&2
    
    local system_prompt="You are a fact-checker. Verify the claim and provide: 1) TRUE/FALSE/MIXED verdict, 2) explanation with evidence, 3) credible sources. Be objective and cite authoritative sources."
    
    local response=$(api_request "Fact-check this claim: $query" "$system_prompt")
    
    local answer=$(echo "$response" | jq -r '.choices[0].message.content')
    local citations=$(echo "$response" | jq -r '.citations // []')
    local tokens=$(echo "$response" | jq -r '.usage.total_tokens // 0')
    
    local cost=$(calculate_cost "$tokens" "$MODEL")
    track_usage "$tokens" "$cost" "$query"
    
    echo ""
    echo "$answer"
    echo ""
    
    if [ "$citations" != "[]" ] && [ "$citations" != "null" ]; then
        echo -e "${GREEN}🔗 Sources:${NC}"
        echo "$citations" | jq -r '.[] | "  - \(.)"'
        echo ""
    fi
    
    echo -e "${YELLOW}📊 Tokens: $tokens | Cost: ~\$$cost${NC}" >&2
}

# Command: compare (A vs B analysis)
cmd_compare() {
    local query="$*"
    
    if [ -z "$query" ]; then
        echo "Usage: $0 compare <query>"
        exit 1
    fi
    
    echo -e "${BLUE}⚖️  Comparing: $query${NC}" >&2
    
    local system_prompt="You are a comparison analyst. Provide a balanced comparison covering: 1) key differences, 2) pros/cons of each, 3) use cases, 4) recommendation based on context. Use a clear structure with citations."
    
    local response=$(api_request "$query" "$system_prompt" "${RESEARCH_MODEL:-sonar-pro}")
    
    local answer=$(echo "$response" | jq -r '.choices[0].message.content')
    local citations=$(echo "$response" | jq -r '.citations // []')
    local tokens=$(echo "$response" | jq -r '.usage.total_tokens // 0')
    
    local cost=$(calculate_cost "$tokens" "${RESEARCH_MODEL:-sonar-pro}")
    track_usage "$tokens" "$cost" "$query"
    
    echo ""
    echo "$answer"
    echo ""
    
    if [ "$citations" != "[]" ] && [ "$citations" != "null" ]; then
        echo -e "${GREEN}📚 References:${NC}"
        echo "$citations" | jq -r '.[] | "  - \(.)"'
        echo ""
    fi
    
    echo -e "${YELLOW}📊 Tokens: $tokens | Cost: ~\$$cost${NC}" >&2
}

# Command: usage (show usage stats)
cmd_usage() {
    if [ ! -f "$USAGE_FILE" ]; then
        echo "No usage data yet."
        exit 0
    fi
    
    local total_queries=$(jq -r '.total_queries' "$USAGE_FILE")
    local total_tokens=$(jq -r '.total_tokens' "$USAGE_FILE")
    local estimated_cost=$(jq -r '.estimated_cost' "$USAGE_FILE")
    local last_reset=$(jq -r '.last_reset' "$USAGE_FILE")
    
    echo -e "${BLUE}📊 Perplexity Usage Stats${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Queries:        ${GREEN}$total_queries${NC}"
    echo -e "Total Tokens:   ${GREEN}$total_tokens${NC}"
    echo -e "Estimated Cost: ${GREEN}\$$estimated_cost${NC}"
    echo -e "Since:          ${YELLOW}$last_reset${NC}"
    echo ""
    echo -e "Free Tier:      ${GREEN}\$5.00${NC}"
    echo -e "Remaining:      ${GREEN}\$$(echo "5 - $estimated_cost" | bc -l)${NC}"
    echo -e "Usage:          ${GREEN}$(echo "scale=1; $estimated_cost / 5 * 100" | bc -l)%${NC}"
    echo ""
    
    if (( $(echo "$estimated_cost > 4.0" | bc -l) )); then
        echo -e "${YELLOW}⚠️  Warning: Nearing free tier limit!${NC}"
    fi
}

# Command: test
cmd_test() {
    echo -e "${BLUE}🧪 Testing Perplexity API connection...${NC}"
    
    local response=$(api_request "Hello, respond with 'OK' if you can read this." "Respond concisely.")
    
    if echo "$response" | jq -e '.choices[0].message.content' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connection successful!${NC}"
        echo ""
        echo "Response: $(echo "$response" | jq -r '.choices[0].message.content')"
    else
        echo -e "${RED}❌ Connection failed${NC}"
        echo "$response"
        exit 1
    fi
}

# Main
main() {
    # Check dependencies
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required. Install: apt install jq / brew install jq${NC}"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl is required${NC}"
        exit 1
    fi
    
    if [ $# -eq 0 ]; then
        echo "Usage: $0 <command> [args]"
        echo ""
        echo "Commands:"
        echo "  search <query>      - Basic search"
        echo "  research <query>    - Research with citations"
        echo "  fact <query>        - Fact-check a claim"
        echo "  compare <query>     - Compare A vs B"
        echo "  usage               - Show usage stats"
        echo "  test                - Test API connection"
        echo ""
        echo "Options:"
        echo "  --json              - Output as JSON"
        echo "  --citations         - Show citations"
        echo "  --model <model>     - Override model"
        exit 1
    fi
    
    local command="$1"
    shift
    
    # Parse options
    OUTPUT_JSON=false
    SHOW_CITATIONS=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --json)
                OUTPUT_JSON=true
                shift
                ;;
            --citations)
                SHOW_CITATIONS=true
                shift
                ;;
            --model)
                MODEL="$2"
                shift 2
                ;;
            *)
                break
                ;;
        esac
    done
    
    # Load config and init usage
    if [ "$command" != "test" ]; then
        load_config
        init_usage
    fi
    
    # Route command
    case "$command" in
        search)
            cmd_search "$@"
            ;;
        research)
            cmd_research "$@"
            ;;
        fact)
            cmd_fact "$@"
            ;;
        compare)
            cmd_compare "$@"
            ;;
        usage)
            cmd_usage
            ;;
        test)
            load_config
            cmd_test
            ;;
        setup)
            exec "$SCRIPT_DIR/setup.sh"
            ;;
        *)
            echo -e "${RED}Unknown command: $command${NC}"
            exit 1
            ;;
    esac
}

main "$@"
