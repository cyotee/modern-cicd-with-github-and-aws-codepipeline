# Container Runtime Support (Docker & Finch)

This project supports both Docker and Finch for running DynamoDB Local. The setup automatically detects which container runtime you have installed and uses it.

## Supported Runtimes

### Docker
The traditional container runtime. If you have Docker installed, it will be used automatically.

**Installation**: https://www.docker.com/get-started

### Finch
An open-source container runtime from AWS, designed as a lightweight alternative to Docker Desktop.

**Installation**: https://github.com/runfinch/finch

**macOS (Homebrew)**:
```bash
brew install finch
finch vm init
```

## How It Works

When you run `npm start`, the project:

1. Checks if `CONTAINER_RUNTIME` environment variable is set (docker or finch)
2. If set, uses the specified runtime (if available)
3. If not set, auto-detects: prefers Finch if available, otherwise uses Docker
4. Starts DynamoDB Local using the selected runtime
5. Creates necessary networks and containers

**Default behavior**: Finch is preferred if both are installed (AWS-native, open source, no licensing concerns)

## Runtime Selection

### Auto-detection (default)
```bash
# Uses Finch if available, otherwise Docker
npm start
```

### Force Docker
```bash
# Always use Docker even if Finch is installed
CONTAINER_RUNTIME=docker npm start
```

### Force Finch
```bash
# Always use Finch even if Docker is installed
CONTAINER_RUNTIME=finch npm start
```

### Set permanently (optional)
```bash
# Add to your ~/.zshrc or ~/.bashrc
export CONTAINER_RUNTIME=docker  # or finch
```

## Commands

All commands work with both Docker and Finch:

```bash
# Start the full development environment (auto-detects runtime)
npm start

# Start just DynamoDB Local
npm run dynamodb:start

# Stop DynamoDB Local
npm run dynamodb:stop

# Stop all local services
npm run stop:local
```

## Manual Runtime Selection

If you want to use a specific runtime, you can run the scripts directly:

```bash
# Using Finch
finch run -d --name hotel-app-dynamodb-local -p 8000:8000 amazon/dynamodb-local:latest -jar DynamoDBLocal.jar -sharedDb -inMemory -cors "*"

# Using Docker
docker run -d --name hotel-app-dynamodb-local -p 8000:8000 amazon/dynamodb-local:latest -jar DynamoDBLocal.jar -sharedDb -inMemory -cors "*"
```

## Troubleshooting

### Finch VM Not Initialized
If you get an error about Finch VM not being initialized:
```bash
finch vm init
finch vm start
```

### Port Already in Use
If port 8000 is already in use:
```bash
# Stop the existing container
npm run dynamodb:stop

# Or manually
finch stop hotel-app-dynamodb-local
finch rm hotel-app-dynamodb-local
```

### Container Runtime Not Found
If neither Docker nor Finch is installed, you'll see:
```
❌ Error: Neither Docker nor Finch is installed
```

Install either Docker or Finch using the links above.

## Benefits of Finch

- Lightweight alternative to Docker Desktop
- No licensing concerns for enterprise use
- Native integration with AWS services
- Compatible with Docker CLI commands
- Open source and community-driven

## Migration Notes

The project still includes `docker-compose.yml` for reference, but the npm scripts now use the runtime-agnostic shell scripts. You can still use docker-compose directly if preferred:

```bash
docker-compose up -d dynamodb-local
```

Or with Finch:

```bash
finch compose up -d dynamodb-local
```
