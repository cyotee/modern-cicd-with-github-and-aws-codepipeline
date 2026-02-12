#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

// Detect which container runtime is being used
let usingFinch = false;
try {
  // Check if CONTAINER_RUNTIME env var is set
  if (process.env.CONTAINER_RUNTIME === 'finch') {
    usingFinch = true;
  } else if (process.env.CONTAINER_RUNTIME === 'docker') {
    usingFinch = false;
  } else {
    // Auto-detect: prefer Finch if available, fallback to Docker
    try {
      execSync('finch ps', { stdio: 'ignore' });
      usingFinch = true;
    } catch {
      try {
        execSync('docker ps', { stdio: 'ignore' });
        usingFinch = false;
      } catch {
        // Neither is running, default to Finch
        usingFinch = true;
      }
    }
  }
} catch {
  // Default to checking OS
  usingFinch = os.platform() === 'darwin';
}

// Finch on macOS and potentially Linux needs host.docker.internal
// Docker with docker-compose uses container name resolution
const dynamodbEndpoint = usingFinch
  ? 'http://host.docker.internal:8000'
  : 'http://dynamodb-local:8000';

const envConfig = {
  ApiFunction: {
    DYNAMODB_ENDPOINT: dynamodbEndpoint,
    DYNAMODB_TABLE_NAME: 'Rooms-local',
    AWS_REGION: 'us-west-2',
    AWS_ACCESS_KEY_ID: 'fakeMyKeyId',
    AWS_SECRET_ACCESS_KEY: 'fakeSecretAccessKey',
    HOTEL_NAME: 'AWS Hotel'
  }
};

const envJsonPath = path.join(__dirname, '..', 'env.json');
fs.writeFileSync(envJsonPath, JSON.stringify(envConfig, null, 2));

const runtime = usingFinch ? 'Finch' : 'Docker';
console.log(`✓ Generated env.json for ${runtime}`);
console.log(`  DynamoDB endpoint: ${dynamodbEndpoint}`);
