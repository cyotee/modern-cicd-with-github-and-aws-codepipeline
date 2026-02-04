# Environment-Agnostic Development Setup

This application works seamlessly in multiple environments without code changes.

## Architecture Overview

### Local Development
```
Browser → Vite Dev Server (5173) → Vite Proxy → Backend (3000)
```

### CloudFront/EC2 Workshop Environment
```
Browser → CloudFront → Nginx Reverse Proxy → Vite Dev Server (5173)
                                           → Backend API (3000)
```

## How It Works

### 1. Frontend Configuration (`frontend/src/config.ts`)
- Uses **empty `apiUrl`** by default: `VITE_API_URL=`
- This makes all API calls use **relative URLs** (`/api/*`)
- Works in both environments without changes

### 2. Local Development (Vite Proxy)
When running locally:
- Frontend makes requests to `/api/*`
- Vite proxy (configured in `vite.config.ts`) forwards to `http://localhost:3000/api/*`
- No CORS issues, seamless development

### 3. CloudFront/EC2 Environment (Nginx Proxy)
When accessed via CloudFront:
- Frontend makes requests to `/api/*`
- Nginx (configured in CloudFormation) proxies to `http://localhost:3000/api/*`
- Same relative URLs work automatically

## Configuration Files

### `frontend/vite.config.ts`
```typescript
server: {
  port: 5173,
  host: '0.0.0.0',              // Allow external connections
  allowedHosts: 'all',          // Accept CloudFront domains
  hmr: {
    clientPort: 5173,           // HMR works through CloudFront
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### `frontend/.env.local`
```bash
VITE_API_URL=                   # Empty = use relative URLs
VITE_HOTEL_NAME=Hotel Yorba
```

### Nginx Configuration (in CloudFormation)
```nginx
location /api {
  proxy_pass http://localhost:3000/api;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location ~ ^/(src/|@vite/|@react-refresh|@fs/|node_modules/) {
  proxy_pass http://localhost:5173;
  # ... HMR and asset handling
}

location /frontend/ {
  rewrite ^/frontend/(.*) /$1 break;
  proxy_pass http://localhost:5173/;
  # ... frontend routing
}
```

## Running the Application

### Local Development
```bash
# Terminal 1: Start DynamoDB
npm run dynamodb:start
npm run dynamodb:setup

# Terminal 2: Start Backend
npm run dev:backend

# Terminal 3: Start Frontend
npm run dev:frontend
```

Access at: `http://localhost:5173`

### CloudFront/EC2 Environment
Same commands, but access via CloudFront URL:
```
https://d39gkdk6qwrf1l.cloudfront.net/frontend/
```

## Key Benefits

✅ **No environment detection needed** - relative URLs work everywhere
✅ **No code changes** between environments
✅ **No CORS issues** - proxies handle everything
✅ **HMR works** through CloudFront with proper configuration
✅ **Single configuration** for all environments

## Troubleshooting

### "Missing Authentication Token" Error
- This means you're hitting `/` instead of `/api/*`
- Use proper endpoints: `/api/config`, `/api/rooms`, etc.

### "Blocked request" Error
- Already fixed with `allowedHosts: 'all'` in vite.config.ts
- Restart frontend dev server after config changes

### API Not Responding
- Ensure backend is running on port 3000
- Check backend logs for errors
- Verify DynamoDB is running (local) or accessible (AWS)

### Frontend Not Loading Through CloudFront
- Access via `/frontend/` path: `https://your-cloudfront.net/frontend/`
- Check nginx logs on EC2 instance
- Verify security groups allow CloudFront access
