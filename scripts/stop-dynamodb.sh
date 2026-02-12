#!/bin/bash

# Script to stop DynamoDB Local using either Docker or Finch

set -e

CONTAINER_NAME="hotel-app-dynamodb-local"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to stop container
stop_container() {
    local runtime=$1
    
    echo -e "${YELLOW}🛑 Stopping DynamoDB Local with ${runtime}...${NC}"
    
    if $runtime ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}" 2>/dev/null | grep -q "${CONTAINER_NAME}"; then
        $runtime stop ${CONTAINER_NAME} 2>/dev/null || true
        $runtime rm ${CONTAINER_NAME} 2>/dev/null || true
        echo -e "${GREEN}✅ DynamoDB Local stopped${NC}"
    else
        echo -e "${YELLOW}ℹ️  DynamoDB Local is not running${NC}"
    fi
}

# Detect and use available runtime
# Check if user specified a preference via environment variable
if [ -n "$CONTAINER_RUNTIME" ]; then
    if [ "$CONTAINER_RUNTIME" = "docker" ] && command -v docker &> /dev/null; then
        stop_container "docker"
    elif [ "$CONTAINER_RUNTIME" = "finch" ] && command -v finch &> /dev/null; then
        stop_container "finch"
    else
        echo -e "${RED}❌ Specified runtime '$CONTAINER_RUNTIME' not found${NC}"
        exit 1
    fi
# Auto-detect: prefer Finch if available
elif command -v finch &> /dev/null; then
    stop_container "finch"
elif command -v docker &> /dev/null; then
    stop_container "docker"
else
    echo -e "${RED}❌ Neither Docker nor Finch found${NC}"
    exit 1
fi
