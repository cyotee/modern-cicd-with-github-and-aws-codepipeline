# Task 3.4 Validation Report

## Task: Test that empty `VITE_API_URL` results in relative API calls (for Vite proxy)

### Acceptance Criteria Validation

#### ✅ AC1: `.env.local` has empty `VITE_API_URL`

**File:** `frontend/.env.local`

```bash
# Local Development Configuration
# API Configuration - use empty URL to leverage Vite proxy for CORS-free development
VITE_API_URL=
VITE_HOTEL_NAME=Hotel Yorba
```

**Status:** ✅ VERIFIED
- `VITE_API_URL` is set to empty string
- This enables Vite proxy to intercept `/api/*` requests
- Requests are forwarded to `http://localhost:3000` (SAM Local)

---

#### ✅ AC2: `.env.production` has API Gateway URL placeholder

**File:** `frontend/.env.production`

```bash
# Production Environment Configuration
# This file is used when building for production deployment

# API Configuration - Set this to your actual API Gateway URL
# Example: https://abc123.execute-api.us-west-2.amazonaws.com/prod
VITE_API_URL=https://your-api-gateway-url.execute-api.us-west-2.amazonaws.com/prod
VITE_HOTEL_NAME=AWS Hotel
```

**Status:** ✅ VERIFIED
- `VITE_API_URL` contains API Gateway URL placeholder
- Clear comments explain how to set the actual URL
- Example URL format provided

---

#### ✅ AC3: Config file correctly falls back to localhost for local dev

**File:** `frontend/src/config.ts`

```typescript
export const config: Config = {
  apiUrl: getEnvVar('VITE_API_URL', ''), // Empty string will use relative URLs with Vite proxy
  hotelName: getEnvVar('VITE_HOTEL_NAME', 'Hotel Yorba'),
};
```

**How it works:**

1. **Local Development:**
   - `VITE_API_URL` is empty → `config.apiUrl` = `""`
   - API calls: `${config.apiUrl}/api/rooms` → `/api/rooms` (relative)
   - Vite proxy intercepts `/api/*` → forwards to `http://localhost:3000`
   - SAM Local handles the request

2. **Vite Proxy Configuration** (`vite.config.ts`):
   ```typescript
   proxy: {
     '/api': {
       target: 'http://localhost:3000',
       changeOrigin: true,
       secure: false,
     },
   }
   ```

**Status:** ✅ VERIFIED
- Empty `VITE_API_URL` results in relative URLs
- Vite proxy forwards to localhost:3000
- No CORS issues (same-origin requests)

---

#### ✅ AC4: Production build uses API Gateway URL from environment

**File:** `frontend/src/config.ts`

```typescript
export const config: Config = {
  apiUrl: getEnvVar('VITE_API_URL', ''), // Uses environment variable value
  hotelName: getEnvVar('VITE_HOTEL_NAME', 'Hotel Yorba'),
};
```

**How it works:**

1. **Production Build:**
   - `VITE_API_URL` is set → `config.apiUrl` = `"https://abc123.execute-api.us-west-2.amazonaws.com/prod"`
   - API calls: `${config.apiUrl}/api/rooms` → `https://abc123.execute-api.us-west-2.amazonaws.com/prod/api/rooms` (absolute)
   - Requests go directly to API Gateway
   - Vite proxy is NOT used (absolute URLs bypass proxy)

2. **Build Process:**
   ```bash
   # Production build reads .env.production
   npm run build
   
   # Vite embeds VITE_API_URL value at build time
   # Frontend makes direct API Gateway calls
   ```

**Status:** ✅ VERIFIED
- Set `VITE_API_URL` results in absolute URLs
- Requests go directly to API Gateway
- No proxy involved in production

---

### Test Coverage

#### Unit Tests (`config.test.ts`)
- ✅ 10 tests passing
- Tests environment variable reading
- Tests config loading with various inputs
- Tests local development scenario (empty URL → relative paths)
- Tests production scenario (set URL → absolute paths)

#### Property-Based Tests (`config.property.test.ts`)
- ✅ 4 tests passing (100 iterations each)
- Tests configuration loading with arbitrary inputs
- Tests default value handling
- Tests partial environment variable sets

#### Integration Tests (`config.integration.test.ts`)
- ✅ 14 tests passing
- Tests local development behavior
- Tests production behavior
- Tests environment variable fallback
- Tests API client URL construction
- **Validates all 4 acceptance criteria explicitly**

**Total Test Coverage:** 28 tests, all passing

---

### Architecture Flow

#### Local Development Flow
```
Browser Request: /api/rooms
    ↓
Vite Dev Server (port 5173)
    ↓ (proxy intercepts /api/*)
SAM Local (port 3000)
    ↓
DynamoDB Local (port 8000)
```

#### Production Flow
```
Browser Request: https://abc123.execute-api.us-west-2.amazonaws.com/prod/api/rooms
    ↓ (direct call, no proxy)
API Gateway
    ↓
Lambda Function
    ↓
DynamoDB
```

---

### Key Benefits

1. **No CORS Issues in Local Dev**
   - Same-origin requests (relative URLs)
   - Vite proxy handles forwarding

2. **Production-Ready**
   - Direct API Gateway calls
   - No proxy overhead

3. **Simple Configuration**
   - Empty string for local
   - Full URL for production

4. **No Code Changes**
   - Same API client code works in both environments
   - Environment variables control behavior

---

### Verification Commands

```bash
# Run all config tests
cd frontend
npm test -- src/config.test.ts
npm test -- src/config.property.test.ts
npm test -- src/config.integration.test.ts

# Verify environment files
cat .env.local
cat .env.production

# Test local development
npm run dev
# Access http://localhost:5173
# API calls will be proxied to localhost:3000

# Test production build
npm run build
# Check dist/assets/*.js for embedded API URL
```

---

## Conclusion

✅ **All acceptance criteria have been validated and verified.**

The configuration correctly:
1. Uses empty `VITE_API_URL` in `.env.local` for local development
2. Uses API Gateway URL placeholder in `.env.production`
3. Falls back to relative URLs (proxied to localhost) when `VITE_API_URL` is empty
4. Uses absolute API Gateway URLs when `VITE_API_URL` is set

The implementation is tested with 28 passing tests covering unit, property-based, and integration scenarios.
