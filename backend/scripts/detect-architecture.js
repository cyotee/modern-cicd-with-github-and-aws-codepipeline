#!/usr/bin/env node

/**
 * Auto-detect system architecture for SAM Local development
 * Returns the appropriate Lambda architecture based on the system
 */

const os = require('os');

function detectArchitecture() {
  const arch = os.arch();
  
  // Map Node.js architecture names to Lambda architecture names
  const archMap = {
    'x64': 'x86_64',
    'x86': 'x86_64',
    'arm64': 'arm64',
    'arm': 'arm64'
  };
  
  const lambdaArch = archMap[arch] || 'x86_64'; // Default to x86_64 if unknown
  
  console.log(lambdaArch);
  return lambdaArch;
}

if (require.main === module) {
  detectArchitecture();
}

module.exports = { detectArchitecture };