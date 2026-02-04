#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * Checks if all local development services are running and healthy:
 * - DynamoDB Local (port 8000)
 * - Backend API (port 3000)
 * - Frontend Dev Server (port 5173)
 * 
 * This script is useful for:
 * - Verifying setup after running `npm run setup:local`
 * - Troubleshooting when services aren't responding
 * - Workshop participants to confirm their environment is ready
 */

const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Service configuration
const SERVICES = {
  DYNAMODB: {
    name: 'DynamoDB Local',
    port: 8000,
    healthCheck: async () => {
      // Check if DynamoDB Local is running via Docker
      try {
        const { stdout } = await execAsync('docker ps --filter "name=dynamodb-local" --format "{{.Names}}"');
        return stdout.trim().includes('dynamodb-local');
      } catch (error) {
        return false;
      }
    },
    healthEndpoint: null, // DynamoDB doesn't have a simple HTTP health endpoint
  },
  BACKEND: {
    name: 'Backend API (SAM Local)',
    port: 3000,
    healthCheck: async () => {
      return await checkHttpEndpoint('http://localhost:3000/api/config');
    },
    healthEndpoint: '/api/config',
  },
  FRONTEND: {
    name: 'Frontend (Vite)',
    port: 5173,
    healthCheck: async () => {
      return await checkHttpEndpoint('http://localhost:5173');
    },
    healthEndpoint: '/',
  },
};

// ANSI color codes for terminal output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

/**
 * Check if an HTTP endpoint is responding
 * @param {string} url - URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} - True if endpoint is responding
 */
function checkHttpEndpoint(url, timeout = 3000) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'GET',
      timeout: timeout,
    };

    const req = http.request(options, (res) => {
      // Any response (even 404) means the server is running
      resolve(res.statusCode < 500);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Check if a port is listening
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - True if port is listening
 */
async function isPortListening(port) {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -sTCP:LISTEN -t`);
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get process information for a port
 * @param {number} port - Port number
 * @returns {Promise<string>} - Process information
 */
async function getPortProcessInfo(port) {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -sTCP:LISTEN | tail -n 1`);
    const parts = stdout.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} (PID: ${parts[1]})`;
    }
    return 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Print a status line
 * @param {string} service - Service name
 * @param {boolean} healthy - Health status
 * @param {string} details - Additional details
 */
function printStatus(service, healthy, details = '') {
  const icon = healthy ? '✓' : '✗';
  const color = healthy ? colors.green : colors.red;
  const status = healthy ? 'HEALTHY' : 'NOT RUNNING';
  
  console.log(`${color}${icon} ${service}: ${status}${colors.reset}${details ? ` ${colors.cyan}(${details})${colors.reset}` : ''}`);
}

/**
 * Print a section header
 * @param {string} title - Section title
 */
function printHeader(title) {
  console.log(`\n${colors.bold}${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(title.length)}${colors.reset}\n`);
}

/**
 * Print troubleshooting tips
 * @param {Object} results - Health check results
 */
function printTroubleshooting(results) {
  const unhealthyServices = Object.entries(results).filter(([_, status]) => !status.healthy);
  
  if (unhealthyServices.length === 0) {
    return;
  }

  printHeader('Troubleshooting Tips');

  for (const [serviceKey, status] of unhealthyServices) {
    const service = SERVICES[serviceKey];
    console.log(`${colors.yellow}${service.name} (Port ${service.port}):${colors.reset}`);
    
    if (!status.portListening) {
      console.log(`  ${colors.cyan}→${colors.reset} Service is not running`);
      console.log(`  ${colors.cyan}→${colors.reset} Start services with: ${colors.green}npm run setup:local${colors.reset}`);
    } else if (!status.responding) {
      console.log(`  ${colors.cyan}→${colors.reset} Service is running but not responding`);
      console.log(`  ${colors.cyan}→${colors.reset} Check logs for errors`);
      console.log(`  ${colors.cyan}→${colors.reset} Try restarting: ${colors.green}npm run stop:local && npm run setup:local${colors.reset}`);
    }
    
    console.log('');
  }

  console.log(`${colors.yellow}For more help, see the troubleshooting guide in the workshop documentation.${colors.reset}\n`);
}

/**
 * Print summary
 * @param {Object} results - Health check results
 */
function printSummary(results) {
  const totalServices = Object.keys(results).length;
  const healthyServices = Object.values(results).filter(s => s.healthy).length;
  const allHealthy = healthyServices === totalServices;

  printHeader('Summary');

  if (allHealthy) {
    console.log(`${colors.green}${colors.bold}✅ All services are healthy! (${healthyServices}/${totalServices})${colors.reset}`);
    console.log(`${colors.green}Your local development environment is ready to use.${colors.reset}\n`);
    console.log(`${colors.cyan}Access your application at:${colors.reset}`);
    console.log(`  ${colors.blue}→${colors.reset} Frontend: ${colors.green}http://localhost:5173${colors.reset}`);
    console.log(`  ${colors.blue}→${colors.reset} Backend API: ${colors.green}http://localhost:3000/api${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bold}❌ Some services are not healthy (${healthyServices}/${totalServices} healthy)${colors.reset}`);
    console.log(`${colors.yellow}Please check the troubleshooting tips above.${colors.reset}\n`);
  }
}

/**
 * Check health of a single service
 * @param {string} serviceKey - Service key
 * @param {Object} service - Service configuration
 * @returns {Promise<Object>} - Health check result
 */
async function checkServiceHealth(serviceKey, service) {
  const result = {
    name: service.name,
    port: service.port,
    portListening: false,
    responding: false,
    healthy: false,
    processInfo: null,
  };

  // Check if port is listening
  result.portListening = await isPortListening(service.port);

  if (result.portListening) {
    result.processInfo = await getPortProcessInfo(service.port);
  }

  // Run service-specific health check
  if (service.healthCheck) {
    result.responding = await service.healthCheck();
  } else {
    result.responding = result.portListening;
  }

  // Service is healthy if it's responding
  result.healthy = result.responding;

  return result;
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.bold}${colors.magenta}🏥 Local Development Health Check${colors.reset}\n`);
  console.log(`${colors.cyan}Checking all services...${colors.reset}\n`);

  // Check all services
  const results = {};
  
  for (const [serviceKey, service] of Object.entries(SERVICES)) {
    const result = await checkServiceHealth(serviceKey, service);
    results[serviceKey] = result;

    // Print status
    const details = result.portListening ? `Port ${result.port}` : '';
    printStatus(service.name, result.healthy, details);
  }

  // Print detailed information
  printHeader('Service Details');
  
  for (const [serviceKey, result] of Object.entries(results)) {
    console.log(`${colors.bold}${result.name}:${colors.reset}`);
    console.log(`  Port: ${result.port}`);
    console.log(`  Listening: ${result.portListening ? colors.green + 'Yes' + colors.reset : colors.red + 'No' + colors.reset}`);
    console.log(`  Responding: ${result.responding ? colors.green + 'Yes' + colors.reset : colors.red + 'No' + colors.reset}`);
    
    if (result.processInfo) {
      console.log(`  Process: ${result.processInfo}`);
    }
    
    console.log('');
  }

  // Print troubleshooting tips if needed
  printTroubleshooting(results);

  // Print summary
  printSummary(results);

  // Exit with appropriate code
  const allHealthy = Object.values(results).every(r => r.healthy);
  process.exit(allHealthy ? 0 : 1);
}

// Run the script
main().catch((error) => {
  console.error(`${colors.red}${colors.bold}Unexpected error: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});
