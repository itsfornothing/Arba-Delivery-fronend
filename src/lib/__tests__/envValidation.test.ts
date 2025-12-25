import { validateEnvironment, getEnvironmentConfig, EnvironmentValidationError } from '../envValidation';

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Environment Validation', () => {
  describe('validateEnvironment', () => {
    it('should pass when all required environment variables are set', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api';
      process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8000/ws';
      process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';

      expect(() => validateEnvironment()).not.toThrow();
      
      const config = validateEnvironment();
      expect(config.apiUrl).toBe('http://localhost:8000/api');
      expect(config.wsUrl).toBe('ws://localhost:8000/ws');
      expect(config.mediaUrl).toBe('http://localhost:8000');
    });

    it('should throw EnvironmentValidationError when required variables are missing', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_WS_URL;
      delete process.env.NEXT_PUBLIC_MEDIA_URL;

      expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
    });

    it('should throw EnvironmentValidationError when variables are empty strings', () => {
      process.env.NEXT_PUBLIC_API_URL = '';
      process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8000/ws';
      process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';

      expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
    });

    it('should throw EnvironmentValidationError for invalid URL formats', () => {
      process.env.NEXT_PUBLIC_API_URL = 'invalid-url';
      process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8000/ws';
      process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';

      expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
    });

    it('should validate WebSocket URLs correctly', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api';
      process.env.NEXT_PUBLIC_WS_URL = 'wss://localhost:8000/ws';
      process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';

      expect(() => validateEnvironment()).not.toThrow();
    });
  });

  describe('getEnvironmentConfig', () => {
    it('should return validated config when all variables are set', () => {
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api';
      process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8000/ws';
      process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';

      const config = getEnvironmentConfig();
      expect(config.apiUrl).toBe('http://localhost:8000/api');
      expect(config.wsUrl).toBe('ws://localhost:8000/ws');
      expect(config.mediaUrl).toBe('http://localhost:8000');
    });

    it('should return fallback config in development when variables are missing', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_WS_URL;
      delete process.env.NEXT_PUBLIC_MEDIA_URL;

      const config = getEnvironmentConfig();
      expect(config.apiUrl).toBe('http://localhost:8000/api');
      expect(config.wsUrl).toBe('ws://localhost:8000/ws');
      expect(config.mediaUrl).toBe('http://localhost:8000');
    });

    it('should throw error in production when variables are missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_WS_URL;
      delete process.env.NEXT_PUBLIC_MEDIA_URL;

      expect(() => getEnvironmentConfig()).toThrow(EnvironmentValidationError);
    });
  });

  describe('EnvironmentValidationError', () => {
    it('should include missing variables in error details', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_WS_URL;
      process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';

      try {
        validateEnvironment();
      } catch (error) {
        expect(error).toBeInstanceOf(EnvironmentValidationError);
        expect(error.missingVars).toContain('NEXT_PUBLIC_API_URL');
        expect(error.missingVars).toContain('NEXT_PUBLIC_WS_URL');
        expect(error.missingVars).not.toContain('NEXT_PUBLIC_MEDIA_URL');
      }
    });
  });
});