#!/usr/bin/env node

/**
 * Port Conflict Checker
 * 
 * Checks if required ports are available before starting local development services.
 * Provides clear error messages with instructions on how to resolve port conflicts.
 */

const tcpPortUsed = require('tcp-port-used');

// Ports used by the application
const PORTS = {
  DYNAMODB: 8000,
  BACKEND: 3000,
  FRONTEND: 5173,
};

// ANSI color codes for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

/**
 * Check if a port is in use
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is in use
 */
async function isPortInUse(port) {
  try {
    return await tcpPortUsed.check(port, '127.0.0.1');
  } catch (error) {
    console.error(`${colors.red}Error checking port ${port}: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Get the service name for a port
 * @param {number} port - Port number
 * @returns {string} - Service name
 */
function getServiceName(port) {
  switch (port) {
    case PORTS.DYNAMODB:
      return 'DynamoDB Local';
    case PORTS.BACKEND:
      return 'Backend API (SAM Local)';
    case PORTS.FRONTEND:
      return 'Frontend (Vite)';
    default:
      return 'Unknown Service';
  }
}

/**
 * Get instructions for freeing a port
 * @param {number} port - Port number
 * @returns {string} - Instructions
 */
function getPortInstructions(port) {
  const serviceName = getServiceName(port);
  return `
${colors.yellow}Port ${port} is already in use by another process.${colors.reset}
${colors.blue}Service:${colors.reset} ${serviceName}

${colors.blue}To resolve this issue:${colors.reset}

1. Find the process using the port:
   ${colors.green}lsof -i :${port}${colors.reset}
   ${colors.green}# or on some systems:${colors.reset}
   ${colors.green}netstat -ano | grep ${port}${colors.reset}

2. Kill the process:
   ${colors.green}kill -9 <PID>${colors.reset}
   ${colors.green}# Replace <PID> with the process ID from step 1${colors.reset}

3. Or stop all local services:
   ${colors.green}npm run stop:local${colors.reset}

4. Then try starting the services again:
   ${colors.green}npm run setup:local${colors.reset}
`;
}

/**
 * Check all required ports
 * @param {number[]} portsToCheck - Array of port numbers to check
 * @returns {Promise<Object>} - Object with results
 */
async function checkPorts(portsToCheck) {
  const results = {
    allAvailable: true,
    conflicts: [],
  };

  console.log(`${colors.blue}🔍 Checking port availability...${colors.reset}\n`);

  for (const port of portsToCheck) {
    const inUse = await isPortInUse(port);
    const serviceName = getServiceName(port);

    if (inUse) {
      console.log(`${colors.red}✗ Port ${port} (${serviceName}): IN USE${colors.reset}`);
      results.allAvailable = false;
      results.conflicts.push(port);
    } else {
      console.log(`${colors.green}✓ Port ${port} (${serviceName}): Available${colors.reset}`);
    }
  }

  return results;
}

/**
 * Main function
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const portsToCheck = [];

  // Determine which ports to check based on arguments
  if (args.length === 0 || args.includes('--all')) {
    // Check all ports
    portsToCheck.push(PORTS.DYNAMODB, PORTS.BACKEND, PORTS.FRONTEND);
  } else {
    // Check specific ports
    if (args.includes('--dynamodb')) portsToCheck.push(PORTS.DYNAMODB);
    if (args.includes('--backend')) portsToCheck.push(PORTS.BACKEND);
    if (args.includes('--frontend')) portsToCheck.push(PORTS.FRONTEND);
  }

  if (portsToCheck.length === 0) {
    console.error(`${colors.red}Error: No ports specified to check${colors.reset}`);
    console.log(`
Usage: node scripts/check-ports.js [options]

Options:
  --all         Check all ports (default)
  --dynamodb    Check DynamoDB port (8000)
  --backend     Check backend port (3000)
  --frontend    Check frontend port (5173)

Examples:
  node scripts/check-ports.js
  node scripts/check-ports.js --all
  node scripts/check-ports.js --backend --frontend
`);
    process.exit(1);
  }

  // Check ports
  const results = await checkPorts(portsToCheck);

  console.log(''); // Empty line for spacing

  // Report results
  if (results.allAvailable) {
    console.log(`${colors.green}✅ All ports are available!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Port conflicts detected!${colors.reset}\n`);

    // Show instructions for each conflicting port
    for (const port of results.conflicts) {
      console.log(getPortInstructions(port));
    }

    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
  process.exit(1);
});
