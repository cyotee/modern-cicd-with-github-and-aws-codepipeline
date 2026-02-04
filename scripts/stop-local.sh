#!/bin/bash

# Stop Local Development Services
# 
# This script cleanly stops all local development services:
# - DynamoDB Local (Docker)
# - Backend API (SAM Local)
# - Frontend (Vite)

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping local development services...${NC}\n"

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    local service_name=$2
    
    echo -e "${YELLOW}Checking for processes on port ${port} (${service_name})...${NC}"
    
    # Find process using the port
    local pid=$(lsof -ti :${port} 2>/dev/null)
    
    if [ -z "$pid" ]; then
        echo -e "${GREEN}✓ No process found on port ${port}${NC}"
    else
        echo -e "${YELLOW}Found process ${pid} on port ${port}, stopping...${NC}"
        kill -9 $pid 2>/dev/null
        
        # Wait a moment and verify
        sleep 1
        local check_pid=$(lsof -ti :${port} 2>/dev/null)
        
        if [ -z "$check_pid" ]; then
            echo -e "${GREEN}✓ Successfully stopped process on port ${port}${NC}"
        else
            echo -e "${RED}✗ Failed to stop process on port ${port}${NC}"
        fi
    fi
    echo ""
}

# Stop frontend (Vite) - Port 5173
kill_port 5173 "Frontend/Vite"

# Stop backend (SAM Local) - Port 3000
kill_port 3000 "Backend/SAM Local"

# Also kill any sam local processes by name
echo -e "${YELLOW}Checking for SAM Local processes...${NC}"
if pgrep -f "sam local" > /dev/null; then
    echo -e "${YELLOW}Found SAM Local processes, stopping...${NC}"
    pkill -9 -f "sam local" 2>/dev/null
    sleep 1
    echo -e "${GREEN}✓ SAM Local processes stopped${NC}"
else
    echo -e "${GREEN}✓ No SAM Local processes found${NC}"
fi
echo ""

# Stop DynamoDB Local (Docker) - Port 8000
echo -e "${YELLOW}Stopping DynamoDB Local (Docker)...${NC}"
if docker ps | grep -q dynamodb-local; then
    docker-compose down 2>/dev/null
    echo -e "${GREEN}✓ DynamoDB Local stopped${NC}"
else
    echo -e "${GREEN}✓ DynamoDB Local is not running${NC}"
fi
echo ""

echo -e "${GREEN}✅ All local development services stopped!${NC}\n"
