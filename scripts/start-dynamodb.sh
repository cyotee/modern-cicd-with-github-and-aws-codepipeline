#!/bin/bash

# Script to start DynamoDB Local using Docker

set -e

CONTAINER_NAME="hotel-app-dynamodb-local"
IMAGE="amazon/dynamodb-local:latest"
PORT="8000"
NETWORK="hotel-app-network"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if container is running
is_container_running() {
    local runtime=$1
    $runtime ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}" 2>/dev/null | grep -q "${CONTAINER_NAME}"
}

# Function to check if network exists
network_exists() {
    local runtime=$1
    $runtime network ls --format "{{.Name}}" 2>/dev/null | grep -q "^${NETWORK}$"
}

# Function to create network
create_network() {
    local runtime=$1
    if ! network_exists "$runtime"; then
        echo -e "${YELLOW}📡 Creating network ${NETWORK}...${NC}"
        $runtime network create ${NETWORK} 2>/dev/null || true
    fi
}

# Function to start DynamoDB with specified runtime
start_dynamodb() {
    local runtime=$1
    
    echo -e "${GREEN}📦 Using ${runtime} to start DynamoDB Local...${NC}"
    
    # Check if already running
    if is_container_running "$runtime"; then
        echo -e "${GREEN}✅ DynamoDB Local is already running${NC}"
        return 0
    fi
    
    # Create network if needed
    create_network "$runtime"
    
    # Pull image if not present
    echo -e "${YELLOW}🔍 Checking for DynamoDB Local image...${NC}"
    $runtime pull ${IMAGE} 2>/dev/null || true
    
    # Start container
    echo -e "${YELLOW}🚀 Starting DynamoDB Local container...${NC}"
    $runtime run -d \
        --name ${CONTAINER_NAME} \
        --network ${NETWORK} \
        -p ${PORT}:${PORT} \
        ${IMAGE} \
        -jar DynamoDBLocal.jar -sharedDb -inMemory -cors "*"
    
    # Wait for container to be ready
    echo -e "${YELLOW}⏳ Waiting for DynamoDB Local to be ready...${NC}"
    sleep 3
    
    # Verify it's running
    if is_container_running "$runtime"; then
        echo -e "${GREEN}✅ DynamoDB Local started successfully on port ${PORT}${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to start DynamoDB Local${NC}"
        return 1
    fi
}

# Detect container runtime
echo -e "${YELLOW}🔍 Detecting container runtime...${NC}"

# Use Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓ Found Docker${NC}"
    RUNTIME="docker"
else
    echo -e "${RED}❌ Error: Docker is not installed${NC}"
    echo -e "${YELLOW}Please install Docker to run DynamoDB Local${NC}"
    echo -e "${YELLOW}Docker: https://www.docker.com/get-started${NC}"
    exit 1
fi

# Start DynamoDB with detected runtime
start_dynamodb "$RUNTIME"
