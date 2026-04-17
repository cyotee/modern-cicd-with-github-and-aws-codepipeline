# Local Development Scripts

This document describes the local development scripts available in this project.

## Available Scripts

### Starting Services

#### `npm run setup:local` (or `npm start`)
Starts all local development services in the correct order:

1. **Port Check**: Verifies that required ports (3000, 5173, 8000) are available
2. **DynamoDB Local**: Starts DynamoDB Local in Docker (port 8000)
3. **Database Setup**: Creates tables and seeds sample data
4. **Backend API**: Starts SAM Local API server (port 3000)
5. **Frontend**: Starts Vite dev server (port 5173)

```bash
npm run setup:local
# or
npm start
```

**What happens:**
- If any port is in use, the script will fail with clear error messages
- Services start in parallel after DynamoDB is ready
- Frontend waits 8 seconds for backend to initialize

### Stopping Services

#### `npm run stop:local`
Cleanly stops all local development services:

1. Stops Vite dev server (port 5173)
2. Stops SAM Local API server (port 3000)
3. Stops any remaining SAM Local processes
4. Stops DynamoDB Local Docker container (port 8000)

```bash
npm run stop:local
```

**Features:**
- Checks each port and kills processes if found
- Provides clear feedback for each step
- Handles cases where services are already stopped
- Uses `kill -9` to ensure processes are terminated

### Port Checking

#### `npm run check:ports`
Checks if required ports are available without starting services:

```bash
npm run check:ports
# or with specific ports
node scripts/check-ports.js --backend --frontend
```

**Options:**
- `--all`: Check all ports (default)
- `--dynamodb`: Check DynamoDB port (8000)
- `--backend`: Check backend port (3000)
- `--frontend`: Check frontend port (5173)

## Port Conflict Resolution

If you encounter port conflicts, the error message will show:

```
❌ Port conflicts detected!

Port 3000 is already in use by another process.
Service: Backend API (SAM Local)

To resolve this issue:

1. Find the process using the port:
   lsof -i :3000

2. Kill the process:
   kill -9 <PID>

3. Or stop all local services:
   npm run stop:local

4. Then try starting the services again:
   npm run setup:local
```

## Troubleshooting

### Services won't start
1. Run `npm run stop:local` to clean up any existing processes
2. Run `npm run check:ports` to verify ports are available
3. Try starting again with `npm run setup:local`

### Docker errors
If you see Docker connection errors:
1. Ensure Docker Desktop is running
2. Check Docker daemon status: `docker ps`
3. Restart Docker if needed

### Backend not responding
1. Check if SAM Local is running: `ps aux | grep sam`
2. Check backend logs in the terminal
3. Verify DynamoDB Local is running: `docker ps | grep dynamodb`

### Frontend not loading
1. Check if Vite is running: `ps aux | grep vite`
2. Verify port 5173 is accessible: `curl http://localhost:5173`
3. Check browser console for errors

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Local Development                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (Vite)          Backend (SAM Local)               │
│  Port: 5173               Port: 3000                        │
│       │                        │                            │
│       │  /api/* requests       │                            │
│       └───────────────────────>│                            │
│                                │                            │
│                                ▼                            │
│                         DynamoDB Local                      │
│                         Port: 8000                          │
│                         (Docker)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Dependencies

- **tcp-port-used**: Used by `check-ports.js` to verify port availability
- **npm-run-all**: Used to run multiple scripts in parallel
- **Docker**: Required for DynamoDB Local
- **SAM CLI**: Required for running Lambda functions locally

## Related Files

- `scripts/check-ports.js`: Port availability checker
- `scripts/stop-local.sh`: Service shutdown script
- `scripts/health-check.js`: Service health verification
- `docker-compose.yml`: DynamoDB Local configuration
- `backend/env.json`: Backend environment variables
- `frontend/.env.local`: Frontend environment variables
