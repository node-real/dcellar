#!/usr/bin/env node

const { execSync } = require('child_process');

const args = process.argv.slice(2);

let port = 3200; // Default port is 3200

// Parsing command line arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-p' || arg === '--port') {
    const nextArg = args[i + 1];
    if (nextArg && !isNaN(nextArg)) {
      port = parseInt(nextArg, 10);
    } else {
      console.error('Invalid port number. Please provide a valid port number.');
      process.exit(1);
    }
  }
}

function getNextAvailablePort(port) {
  const command = `lsof -ti:${port}`;
  try {
    execSync(command);
    return getNextAvailablePort(port + 1);
  } catch (error) {
    return port;
  }
}

function startNextServer(port) {
  const command = `next dev -p ${port}`;
  console.log(`Starting Next.js server on port ${port}`);
  execSync(command, { stdio: 'inherit' });
}

const availablePort = getNextAvailablePort(port);
startNextServer(availablePort);
