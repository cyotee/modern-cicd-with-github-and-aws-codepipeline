#!/bin/bash

# Configure which container runtime to use (Docker or Finch)
# This script stops the unused runtime to ensure SAM CLI uses the preferred one

set -e

RUNTIME=${1:-finch}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

if [ "$RUNTIME" != "docker" ] && [ "$RUNTIME" != "finch" ]; then
    echo -e "${RED}❌ Invalid runtime: $RUNTIME${NC}"
    echo "Usage: $0 [docker|finch]"
    exit 1
fi

echo -e "${YELLOW}🔧 Configuring container runtime preference: ${RUNTIME}${NC}"

if [ "$RUNTIME" = "finch" ]; then
    # Prefer Finch: stop Docker service
    if systemctl is-active --quiet docker 2>/dev/null; then
        echo -e "${YELLOW}Stopping Docker service to prefer Finch...${NC}"
        sudo systemctl stop docker
        sudo systemctl disable docker
    fi
    
    # Ensure Finch VM is running
    if command -v finch &> /dev/null; then
        if ! finch vm status | grep -q "Running"; then
            echo -e "${YELLOW}Starting Finch VM...${NC}"
            finch vm start
        fi
        echo -e "${GREEN}✓ Finch is configured as the preferred runtime${NC}"
        finch --version
    else
        echo -e "${RED}❌ Finch is not installed${NC}"
        exit 1
    fi
    
elif [ "$RUNTIME" = "docker" ]; then
    # Prefer Docker: stop Finch VM
    if command -v finch &> /dev/null; then
        if finch vm status | grep -q "Running"; then
            echo -e "${YELLOW}Stopping Finch VM to prefer Docker...${NC}"
            finch vm stop
        fi
    fi
    
    # Ensure Docker service is running
    if command -v docker &> /dev/null; then
        if ! systemctl is-active --quiet docker 2>/dev/null; then
            echo -e "${YELLOW}Starting Docker service...${NC}"
            sudo systemctl enable docker
            sudo systemctl start docker
        fi
        echo -e "${GREEN}✓ Docker is configured as the preferred runtime${NC}"
        docker --version
    else
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Container runtime configured successfully${NC}"
