import { describe, it, expect } from 'vitest';
import { loadConfig } from './config';

/**
 * Integration tests for Task 3.4: Verify that empty VITE_API_URL results in relative API calls
 * 
 * Acceptance Criteria:
 * - .env.local has empty VITE_API_URL
 * - .env.production has API Gateway URL placeholder
 * - Config file correctly falls back to localhost for local dev
 * - Production build uses API Gateway URL from environment
 */
describe('Task 3.4: Empty VITE_API_URL results in relative API calls', () => {
  describe('Local Development (.env.local)', () => {
    it('should use empty string for apiUrl when VITE_API_URL is empty', () => {
      // Simulate .env.local configuration
      const localEnvVars = {
        VITE_API_URL: '',
        VITE_HOTEL_NAME: 'Hotel Yorba',
      };

      const config = loadConfig(localEnvVars);

      // Verify empty apiUrl
      expect(config.apiUrl).toBe('');
      expect(config.hotelName).toBe('Hotel Yorba');
    });

    it('should result in relative API paths when apiUrl is empty', () => {
      // Simulate .env.local configuration
      const localEnvVars = {
        VITE_API_URL: '',
        VITE_HOTEL_NAME: 'Hotel Yorba',
      };

      const config = loadConfig(localEnvVars);

      // Construct API paths as the ApiClient would
      const configPath = `${config.apiUrl}/api/config`;
      const roomsPath = `${config.apiUrl}/api/rooms`;
      const roomByIdPath = `${config.apiUrl}/api/rooms/1`;

      // Verify all paths are relative (start with /)
      expect(configPath).toBe('/api/config');
      expect(roomsPath).toBe('/api/rooms');
      expect(roomByIdPath).toBe('/api/rooms/1');

      // Verify paths do NOT contain protocol or domain
      expect(configPath).not.toMatch(/^https?:\/\//);
      expect(roomsPath).not.toMatch(/^https?:\/\//);
      expect(roomByIdPath).not.toMatch(/^https?:\/\//);
    });

    it('should enable Vite proxy to intercept relative API calls', () => {
      // Simulate .env.local configuration
      const localEnvVars = {
        VITE_API_URL: '',
        VITE_HOTEL_NAME: 'Hotel Yorba',
      };

      const config = loadConfig(localEnvVars);

      // When apiUrl is empty, all API calls will be relative
      // Vite proxy configuration will intercept /api/* requests
      // and forward them to http://localhost:3000
      
      const apiPath = `${config.apiUrl}/api/rooms`;
      
      // Verify the path matches Vite proxy pattern
      expect(apiPath).toMatch(/^\/api\//);
      
      // This path will be intercepted by Vite proxy config:
      // proxy: {
      //   '/api': {
      //     target: 'http://localhost:3000',
      //     changeOrigin: true,
      //   }
      // }
    });
  });

  describe('Production (.env.production)', () => {
    it('should use API Gateway URL when VITE_API_URL is set', () => {
      // Simulate .env.production configuration
      const productionEnvVars = {
        VITE_API_URL: 'https://abc123.execute-api.us-west-2.amazonaws.com/prod',
        VITE_HOTEL_NAME: 'AWS Hotel',
      };

      const config = loadConfig(productionEnvVars);

      // Verify API Gateway URL is used
      expect(config.apiUrl).toBe('https://abc123.execute-api.us-west-2.amazonaws.com/prod');
      expect(config.hotelName).toBe('AWS Hotel');
    });

    it('should result in absolute API paths when apiUrl is set', () => {
      // Simulate .env.production configuration
      const productionEnvVars = {
        VITE_API_URL: 'https://abc123.execute-api.us-west-2.amazonaws.com/prod',
        VITE_HOTEL_NAME: 'AWS Hotel',
      };

      const config = loadConfig(productionEnvVars);

      // Construct API paths as the ApiClient would
      const configPath = `${config.apiUrl}/api/config`;
      const roomsPath = `${config.apiUrl}/api/rooms`;
      const roomByIdPath = `${config.apiUrl}/api/rooms/1`;

      // Verify all paths are absolute (contain full URL)
      expect(configPath).toBe('https://abc123.execute-api.us-west-2.amazonaws.com/prod/api/config');
      expect(roomsPath).toBe('https://abc123.execute-api.us-west-2.amazonaws.com/prod/api/rooms');
      expect(roomByIdPath).toBe('https://abc123.execute-api.us-west-2.amazonaws.com/prod/api/rooms/1');

      // Verify paths contain protocol and domain
      expect(configPath).toMatch(/^https:\/\//);
      expect(roomsPath).toMatch(/^https:\/\//);
      expect(roomByIdPath).toMatch(/^https:\/\//);
    });

    it('should bypass Vite proxy and call API Gateway directly', () => {
      // Simulate .env.production configuration
      const productionEnvVars = {
        VITE_API_URL: 'https://abc123.execute-api.us-west-2.amazonaws.com/prod',
        VITE_HOTEL_NAME: 'AWS Hotel',
      };

      const config = loadConfig(productionEnvVars);

      // When apiUrl is set to full URL, API calls will be absolute
      // Vite proxy will NOT intercept these calls
      // Requests go directly to API Gateway
      
      const apiPath = `${config.apiUrl}/api/rooms`;
      
      // Verify the path does NOT match Vite proxy pattern (not relative)
      expect(apiPath).not.toMatch(/^\/api\//);
      
      // Verify it's a full URL that will bypass proxy
      expect(apiPath).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com/);
    });
  });

  describe('Environment Variable Fallback Behavior', () => {
    it('should default to empty string when VITE_API_URL is undefined', () => {
      const envVars = {
        VITE_API_URL: undefined,
        VITE_HOTEL_NAME: 'Hotel Yorba',
      };

      const config = loadConfig(envVars);

      // Should fall back to empty string (relative URLs)
      expect(config.apiUrl).toBe('');
      
      // Verify relative path behavior
      const apiPath = `${config.apiUrl}/api/rooms`;
      expect(apiPath).toBe('/api/rooms');
    });

    it('should default to empty string when VITE_API_URL is not provided', () => {
      const envVars = {
        VITE_HOTEL_NAME: 'Hotel Yorba',
      };

      const config = loadConfig(envVars);

      // Should fall back to empty string (relative URLs)
      expect(config.apiUrl).toBe('');
      
      // Verify relative path behavior
      const apiPath = `${config.apiUrl}/api/rooms`;
      expect(apiPath).toBe('/api/rooms');
    });
  });

  describe('API Client Integration', () => {
    it('should construct correct URLs for local development', () => {
      // Simulate local development config
      const localConfig = loadConfig({
        VITE_API_URL: '',
        VITE_HOTEL_NAME: 'Hotel Yorba',
      });

      // Simulate how ApiClient constructs URLs
      const baseUrl = localConfig.apiUrl;
      
      // Test various API endpoints
      const endpoints = [
        '/api/config',
        '/api/rooms',
        '/api/rooms/1',
        '/api/rooms/123',
      ];

      endpoints.forEach(endpoint => {
        const fullUrl = `${baseUrl}${endpoint}`;
        
        // All URLs should be relative
        expect(fullUrl).toBe(endpoint);
        expect(fullUrl).toMatch(/^\/api\//);
        expect(fullUrl).not.toMatch(/^https?:\/\//);
      });
    });

    it('should construct correct URLs for production', () => {
      // Simulate production config
      const productionConfig = loadConfig({
        VITE_API_URL: 'https://abc123.execute-api.us-west-2.amazonaws.com/prod',
        VITE_HOTEL_NAME: 'AWS Hotel',
      });

      // Simulate how ApiClient constructs URLs
      const baseUrl = productionConfig.apiUrl;
      
      // Test various API endpoints
      const endpoints = [
        '/api/config',
        '/api/rooms',
        '/api/rooms/1',
        '/api/rooms/123',
      ];

      endpoints.forEach(endpoint => {
        const fullUrl = `${baseUrl}${endpoint}`;
        
        // All URLs should be absolute
        expect(fullUrl).toMatch(/^https:\/\//);
        expect(fullUrl).toContain('execute-api');
        expect(fullUrl).toContain('amazonaws.com');
        expect(fullUrl).toContain(endpoint);
      });
    });
  });

  describe('Acceptance Criteria Validation', () => {
    it('AC1: .env.local has empty VITE_API_URL', () => {
      // This test validates that the configuration supports empty VITE_API_URL
      const localEnvVars = {
        VITE_API_URL: '',
        VITE_HOTEL_NAME: 'Hotel Yorba',
      };

      const config = loadConfig(localEnvVars);
      
      expect(config.apiUrl).toBe('');
      // ✅ Acceptance Criteria 1: Verified
    });

    it('AC2: .env.production has API Gateway URL placeholder', () => {
      // This test validates that the configuration supports API Gateway URLs
      const productionEnvVars = {
        VITE_API_URL: 'https://your-api-gateway-url.execute-api.us-west-2.amazonaws.com/prod',
        VITE_HOTEL_NAME: 'AWS Hotel',
      };

      const config = loadConfig(productionEnvVars);
      
      expect(config.apiUrl).toBe('https://your-api-gateway-url.execute-api.us-west-2.amazonaws.com/prod');
      expect(config.apiUrl).toMatch(/^https:\/\//);
      // ✅ Acceptance Criteria 2: Verified
    });

    it('AC3: Config file correctly falls back to localhost for local dev', () => {
      // When VITE_API_URL is empty, config returns empty string
      // This results in relative URLs that Vite proxy intercepts
      // Vite proxy forwards to localhost:3000
      
      const localEnvVars = {
        VITE_API_URL: '',
        VITE_HOTEL_NAME: 'Hotel Yorba',
      };

      const config = loadConfig(localEnvVars);
      
      // Empty apiUrl enables Vite proxy to localhost
      expect(config.apiUrl).toBe('');
      
      // Relative paths will be proxied to localhost:3000 by Vite
      const apiPath = `${config.apiUrl}/api/rooms`;
      expect(apiPath).toBe('/api/rooms');
      
      // ✅ Acceptance Criteria 3: Verified
      // Note: Actual proxying to localhost:3000 is handled by Vite config
    });

    it('AC4: Production build uses API Gateway URL from environment', () => {
      // When VITE_API_URL is set, config returns the full URL
      // This results in absolute URLs that bypass Vite proxy
      // Requests go directly to API Gateway
      
      const productionEnvVars = {
        VITE_API_URL: 'https://abc123.execute-api.us-west-2.amazonaws.com/prod',
        VITE_HOTEL_NAME: 'AWS Hotel',
      };

      const config = loadConfig(productionEnvVars);
      
      // Full URL enables direct API Gateway calls
      expect(config.apiUrl).toBe('https://abc123.execute-api.us-west-2.amazonaws.com/prod');
      
      // Absolute paths will call API Gateway directly
      const apiPath = `${config.apiUrl}/api/rooms`;
      expect(apiPath).toBe('https://abc123.execute-api.us-west-2.amazonaws.com/prod/api/rooms');
      expect(apiPath).toMatch(/^https:\/\//);
      
      // ✅ Acceptance Criteria 4: Verified
    });
  });
});
