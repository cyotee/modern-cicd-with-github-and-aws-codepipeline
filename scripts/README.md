# Local Development Scripts

This directory contains utility scripts for managing local development services.

## Port Conflict Checker (`check-ports.js`)

Checks if required ports are available before starting local development services.

### Usage

```bash
# Check all ports (default)
npm run check:ports
node scripts/check-ports.js
node scripts/check-ports.js --all

# Check specific ports
node scripts/check-ports.js --backend
node scripts/check-ports.js --frontend
node scripts/check-ports.js --dynamodb
node scripts/check-ports.js --backend --frontend
```

### Ports Checked

- **8000**: DynamoDB Local
- **3000**: Backend API (SAM Local)
- **5173**: Frontend (Vite)

### Exit Codes

- **0**: All ports are available
- **1**: One or more ports are in use

### Example Output

**When all ports are available:**
```
🔍 Checking port availability...

✓ Port 8000 (DynamoDB Local): Available
✓ Port 3000 (Backend API (SAM Local)): Available
✓ Port 5173 (Frontend (Vite)): Available

✅ All ports are available!
```

**When a port is in use:**
```
🔍 Checking port availability...

✗ Port 3000 (Backend API (SAM Local)): IN USE
✓ Port 5173 (Frontend (Vite)): Available

❌ Port conflicts detected!

Port 3000 is already in use by another process.
Service: Backend API (SAM Local)

To resolve this issue:

1. Find the process using the port:
   lsof -i :3000
   # or on some systems:
   netstat -ano | grep 3000

2. Kill the process:
   kill -9 <PID>
   # Replace <PID> with the process ID from step 1

3. Or stop all local services:
   npm run stop:local

4. Then try starting the services again:
   npm run setup:local
```

## Health Check (`health-check.js`)

Checks if all local development services are running and healthy.

### Usage

```bash
# Check health of all services
npm run health
node scripts/health-check.js
```

### What It Checks

1. **DynamoDB Local** (port 8000)
   - Verifies Docker container is running
   - Checks if port is listening

2. **Backend API** (port 3000)
   - Checks if port is listening
   - Verifies `/api/config` endpoint responds

3. **Frontend** (port 5173)
   - Checks if port is listening
   - Verifies Vite dev server responds

### Exit Codes

- **0**: All services are healthy
- **1**: One or more services are not healthy

### Example Output

**When all services are healthy:**
```
🏥 Local Development Health Check

Checking all services...

✓ DynamoDB Local: HEALTHY (Port 8000)
✓ Backend API (SAM Local): HEALTHY (Port 3000)
✓ Frontend (Vite): HEALTHY (Port 5173)

Service Details
===============

DynamoDB Local:
  Port: 8000
  Listening: Yes
  Responding: Yes
  Process: docker (PID: 12345)

Backend API (SAM Local):
  Port: 3000
  Listening: Yes
  Responding: Yes
  Process: sam (PID: 12346)

Frontend (Vite):
  Port: 5173
  Listening: Yes
  Responding: Yes
  Process: node (PID: 12347)


Summary
=======

✅ All services are healthy! (3/3)
Your local development environment is ready to use.

Access your application at:
  → Frontend: http://localhost:5173
  → Backend API: http://localhost:3000/api
```

**When services are not running:**
```
🏥 Local Development Health Check

Checking all services...

✗ DynamoDB Local: NOT RUNNING
✗ Backend API (SAM Local): NOT RUNNING
✗ Frontend (Vite): NOT RUNNING

Service Details
===============

DynamoDB Local:
  Port: 8000
  Listening: No
  Responding: No

Backend API (SAM Local):
  Port: 3000
  Listening: No
  Responding: No

Frontend (Vite):
  Port: 5173
  Listening: No
  Responding: No


Troubleshooting Tips
====================

DynamoDB Local (Port 8000):
  → Service is not running
  → Start services with: npm run setup:local

Backend API (SAM Local) (Port 3000):
  → Service is not running
  → Start services with: npm run setup:local

Frontend (Vite) (Port 5173):
  → Service is not running
  → Start services with: npm run setup:local

For more help, see the troubleshooting guide in the workshop documentation.


Summary
=======

❌ Some services are not healthy (0/3 healthy)
Please check the troubleshooting tips above.
```

### Use Cases

- **After starting services**: Verify everything is running correctly
- **Troubleshooting**: Quickly identify which service is having issues
- **Workshop participants**: Confirm their environment is ready
- **CI/CD**: Automated health checks in scripts

## Stop Local Services (`stop-local.sh`)

Cleanly stops all local development services.

### Usage

```bash
# Stop all local services
npm run stop:local
bash scripts/stop-local.sh
```

### What It Does

1. **Stops Frontend (Vite)** - Kills processes on port 5173
2. **Stops Backend (SAM Local)** - Kills processes on port 3000 and any `sam local` processes
3. **Stops DynamoDB Local** - Stops the Docker container

### Example Output

```
🛑 Stopping local development services...

Checking for processes on port 5173 (Frontend/Vite)...
Found process 12345 on port 5173, stopping...
✓ Successfully stopped process on port 5173

Checking for processes on port 3000 (Backend/SAM Local)...
✓ No process found on port 3000

Checking for SAM Local processes...
✓ No SAM Local processes found

Stopping DynamoDB Local (Docker)...
✓ DynamoDB Local stopped

✅ All local development services stopped!
```

## Integration with npm Scripts

These scripts are automatically integrated into the main npm scripts:

### `npm run setup:local`
- **Checks all ports** before starting services
- If any port is in use, shows error and exits
- If all ports are available, starts all services

### `npm run dev`
- **Checks backend and frontend ports** before starting
- Skips DynamoDB check (assumes it's already running)

### `npm run stop:local`
- **Stops all services** cleanly
- Frees up all ports

### `npm run health`
- **Checks health** of all running services
- Provides detailed status and troubleshooting tips
- Useful for verifying setup after starting services

## Troubleshooting

### Port Already in Use

If you see a "port already in use" error:

1. **Use the stop script:**
   ```bash
   npm run stop:local
   ```

2. **Or manually find and kill the process:**
   ```bash
   # Find the process
   lsof -i :3000
   
   # Kill the process
   kill -9 <PID>
   ```

3. **Then try starting again:**
   ```bash
   npm run setup:local
   ```

### Docker Not Running

If you see "Cannot connect to the Docker daemon":

1. Start Docker Desktop (macOS/Windows)
2. Or start Docker daemon (Linux):
   ```bash
   sudo systemctl start docker
   ```

### Permission Denied

If you see "Permission denied" when running scripts:

```bash
# Make scripts executable
chmod +x scripts/stop-local.sh
```

## Development Workflow

### Starting Development

```bash
# 1. Check if ports are available
npm run check:ports

# 2. Start all services
npm run setup:local

# 3. Verify all services are healthy
npm run health

# 4. Access the app at your CloudFront URL
```

### Verifying Services

```bash
# Check if all services are running and healthy
npm run health
```

### Stopping Development

```bash
# Stop all services
npm run stop:local
```

### Restarting Services

```bash
# Stop and start
npm run stop:local && npm run setup:local

# Verify health after restart
npm run health
```

## Notes

- Port checking is **automatic** when using `npm run setup:local` or `npm run dev`
- The scripts provide **clear error messages** with resolution steps
- All scripts use **color-coded output** for better readability
- Exit codes allow for **script chaining** and error handling
