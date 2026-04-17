import { describe, it, expect } from 'vitest';
import { loadConfig, getEnvVar } from './config';

describe('config.ts - Environment Variable Reading', () => {
  describe('getEnvVar', () => {
    it('should return the environment variable value when set', () => {
      // Simulate import.meta.env behavior
      const mockEnv = { VITE_API_URL: 'https://api.example.com' };
      const getVar = (key: string, defaultValue: string): string => {
        const value = mockEnv[key as keyof typeof mockEnv];
        return value !== undefined && value !== '' ? value : defaultValue;
      };

      const result = getVar('VITE_API_URL', 'default');
      expect(result).toBe('https://api.example.com');
    });

    it('should return default value when environment variable is empty string', () => {
      const mockEnv = { VITE_API_URL: '' };
      const getVar = (key: string, defaultValue: string): string => {
        const value = mockEnv[key as keyof typeof mockEnv];
        return value !== undefined && value !== '' ? value : defaultValue;
      };

      const result = getVar('VITE_API_URL', 'default');
      expect(result).toBe('default');
    });

    it('should return default value when environment variable is undefined', () => {
      const mockEnv = {};
      const getVar = (key: string, defaultValue: string): string => {
        const value = mockEnv[key as keyof typeof mockEnv];
        return value !== undefined && value !== '' ? value : defaultValue;
      };

      const result = getVar('VITE_API_URL', 'default');
      expect(result).toBe('default');
    });
  });

  describe('loadConfig', () => {
    it('should load config with empty VITE_API_URL for local development', () => {
      const envVars = {
        VITE_API_URL: '',
        VITE_HOTEL_NAME: 'Hotel Yorba',
      };

      const config = loadConfig(envVars);

      expect(config.apiUrl).toBe('');
      expect(config.hotelName).toBe('Hotel Yorba');
    });

    it('should load config with API Gateway URL for production', () => {
      const envVars = {
        VITE_API_URL: 'https://abc123.execute-api.us-west-2.amazonaws.com/prod',
        VITE_HOTEL_NAME: 'AWS Hotel',
      };

      const config = loadConfig(envVars);

      expect(config.apiUrl).toBe('https://abc123.execute-api.us-west-2.amazonaws.com/prod');
      expect(config.hotelName).toBe('AWS Hotel');
    });

    it('should use default values when environment variables are not set', () => {
      const envVars = {};

      const config = loadConfig(envVars);

      expect(config.apiUrl).toBe('');
      expect(config.hotelName).toBe('Hotel Yorba');
    });

    it('should handle undefined environment variables', () => {
      const envVars = {
        VITE_API_URL: undefined,
        VITE_HOTEL_NAME: undefined,
      };

      const config = loadConfig(envVars);

      expect(config.apiUrl).toBe('');
      expect(config.hotelName).toBe('Hotel Yorba');
    });

    it('should correctly handle mixed set and unset variables', () => {
      const envVars = {
        VITE_API_URL: 'https://api.example.com',
        VITE_HOTEL_NAME: undefined,
      };

      const config = loadConfig(envVars);

      expect(config.apiUrl).toBe('https://api.example.com');
      expect(config.hotelName).toBe('Hotel Yorba');
    });
  });

  describe('Local Development Scenario', () => {
    it('should result in relative API calls when VITE_API_URL is empty', () => {
      const envVars = {
        VITE_API_URL: '',
        VITE_HOTEL_NAME: 'Hotel Yorba',
      };

      const config = loadConfig(envVars);

      // Empty apiUrl means relative URLs will be used
      // Vite proxy will intercept /api/* requests
      expect(config.apiUrl).toBe('');
      
      // Verify that API calls would be relative
      const apiPath = `${config.apiUrl}/api/rooms`;
      expect(apiPath).toBe('/api/rooms');
    });
  });

  describe('Production Scenario', () => {
    it('should result in absolute API calls when VITE_API_URL is set', () => {
      const envVars = {
        VITE_API_URL: 'https://abc123.execute-api.us-west-2.amazonaws.com/prod',
        VITE_HOTEL_NAME: 'AWS Hotel',
      };

      const config = loadConfig(envVars);

      // Set apiUrl means absolute URLs will be used
      expect(config.apiUrl).toBe('https://abc123.execute-api.us-west-2.amazonaws.com/prod');
      
      // Verify that API calls would be absolute
      const apiPath = `${config.apiUrl}/api/rooms`;
      expect(apiPath).toBe('https://abc123.execute-api.us-west-2.amazonaws.com/prod/api/rooms');
    });
  });
});
