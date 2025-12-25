/**
 * **Feature: frontend-deployment-fix, Property 4: Environment Configuration Validation**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 * 
 * Property: For any deployment environment, all required environment variables should be loaded, 
 * validated, and used correctly for API connectivity
 */

import * as fc from 'fast-check';
import { 
  validateEnvironment, 
  getEnvironmentConfig, 
  EnvironmentValidationError,
  EnvironmentConfig 
} from '../envValidation';

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

// Generators for environment configuration testing
const validUrlArb = fc.oneof(
  fc.webUrl(),
  fc.record({
    protocol: fc.constantFrom('http:', 'https:'),
    hostname: fc.domain(),
    port: fc.option(fc.integer({ min: 1000, max: 9999 })),
    pathname: fc.option(fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s}`))
  }).map(({ protocol, hostname, port, pathname }) => 
    `${protocol}//${hostname}${port ? `:${port}` : ''}${pathname || ''}`
  )
);

const validWsUrlArb = fc.oneof(
  fc.record({
    protocol: fc.constantFrom('ws:', 'wss:'),
    hostname: fc.domain(),
    port: fc.option(fc.integer({ min: 1000, max: 9999 })),
    pathname: fc.option(fc.string({ minLength: 1, maxLength: 50 }).map(s => `/${s}`))
  }).map(({ protocol, hostname, port, pathname }) => 
    `${protocol}//${hostname}${port ? `:${port}` : ''}${pathname || ''}`
  )
);

const invalidUrlArb = fc.oneof(
  fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('://')),
  fc.constant(''),
  fc.constant('   '),
  fc.constant('invalid-url'),
  fc.constant('http://'),
  fc.constant('://missing-protocol')
);

const nodeEnvArb = fc.constantFrom('development', 'production', 'test', 'staging');

const validEnvironmentArb = fc.record({
  NEXT_PUBLIC_API_URL: validUrlArb,
  NEXT_PUBLIC_WS_URL: validWsUrlArb,
  NEXT_PUBLIC_MEDIA_URL: validUrlArb,
  NODE_ENV: fc.option(nodeEnvArb)
});

const partialEnvironmentArb = fc.record({
  NEXT_PUBLIC_API_URL: fc.option(validUrlArb, { nil: undefined }),
  NEXT_PUBLIC_WS_URL: fc.option(validWsUrlArb, { nil: undefined }),
  NEXT_PUBLIC_MEDIA_URL: fc.option(validUrlArb, { nil: undefined }),
  NODE_ENV: fc.option(nodeEnvArb, { nil: undefined })
});

const invalidEnvironmentArb = fc.record({
  NEXT_PUBLIC_API_URL: fc.option(fc.oneof(validUrlArb, invalidUrlArb), { nil: undefined }),
  NEXT_PUBLIC_WS_URL: fc.option(fc.oneof(validWsUrlArb, invalidUrlArb), { nil: undefined }),
  NEXT_PUBLIC_MEDIA_URL: fc.option(fc.oneof(validUrlArb, invalidUrlArb), { nil: undefined }),
  NODE_ENV: fc.option(nodeEnvArb, { nil: undefined })
}).filter(env => 
  // Ensure at least one URL is invalid or missing
  !env.NEXT_PUBLIC_API_URL || 
  !env.NEXT_PUBLIC_WS_URL || 
  !env.NEXT_PUBLIC_MEDIA_URL ||
  (env.NEXT_PUBLIC_API_URL && !isValidUrl(env.NEXT_PUBLIC_API_URL)) ||
  (env.NEXT_PUBLIC_WS_URL && !isValidWsUrl(env.NEXT_PUBLIC_WS_URL)) ||
  (env.NEXT_PUBLIC_MEDIA_URL && !isValidUrl(env.NEXT_PUBLIC_MEDIA_URL))
);

// Helper functions
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidWsUrl = (url: string): boolean => {
  try {
    // Convert WebSocket URL to HTTP for validation
    const httpUrl = url.replace('ws://', 'http://').replace('wss://', 'https://');
    new URL(httpUrl);
    return url.startsWith('ws://') || url.startsWith('wss://');
  } catch {
    return false;
  }
};

const setEnvironmentVariables = (env: Record<string, string | undefined>) => {
  // Clear existing environment variables
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.NEXT_PUBLIC_WS_URL;
  delete process.env.NEXT_PUBLIC_MEDIA_URL;
  
  // Set new environment variables (skip null/undefined values)
  Object.entries(env).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      process.env[key] = value;
    }
  });
};

const isValidEnvironmentConfig = (config: EnvironmentConfig): boolean => {
  return (
    typeof config === 'object' &&
    typeof config.apiUrl === 'string' &&
    typeof config.wsUrl === 'string' &&
    typeof config.mediaUrl === 'string' &&
    typeof config.nodeEnv === 'string' &&
    isValidUrl(config.apiUrl) &&
    isValidWsUrl(config.wsUrl) &&
    isValidUrl(config.mediaUrl) &&
    config.nodeEnv.length > 0
  );
};

describe('Environment Configuration Validation Property Tests', () => {
  it('Property 4.1: Valid environment variables produce valid configuration', () => {
    fc.assert(
      fc.property(
        validEnvironmentArb,
        (env) => {
          setEnvironmentVariables(env);
          
          // Should not throw for valid environment
          expect(() => validateEnvironment()).not.toThrow();
          
          const config = validateEnvironment();
          
          // Verify configuration structure
          expect(isValidEnvironmentConfig(config)).toBe(true);
          
          // Verify URLs match environment variables
          expect(config.apiUrl).toBe(env.NEXT_PUBLIC_API_URL);
          expect(config.wsUrl).toBe(env.NEXT_PUBLIC_WS_URL);
          expect(config.mediaUrl).toBe(env.NEXT_PUBLIC_MEDIA_URL);
          expect(config.nodeEnv).toBe(env.NODE_ENV || process.env.NODE_ENV || 'development');
          
          // Verify URLs are actually valid
          expect(isValidUrl(config.apiUrl)).toBe(true);
          expect(isValidWsUrl(config.wsUrl)).toBe(true);
          expect(isValidUrl(config.mediaUrl)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4.2: Missing or invalid environment variables throw EnvironmentValidationError', () => {
    fc.assert(
      fc.property(
        invalidEnvironmentArb,
        (env) => {
          setEnvironmentVariables(env);
          
          // Should throw EnvironmentValidationError for invalid/missing environment
          expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
          
          try {
            validateEnvironment();
          } catch (error) {
            expect(error).toBeInstanceOf(EnvironmentValidationError);
            expect(error.name).toBe('EnvironmentValidationError');
            expect(typeof error.message).toBe('string');
            expect(error.message.length).toBeGreaterThan(0);
            
            // Verify missing variables are tracked
            if (error.missingVars) {
              expect(Array.isArray(error.missingVars)).toBe(true);
              
              // Check that missing variables are actually missing
              error.missingVars.forEach((varName: string) => {
                const value = process.env[varName];
                expect(!value || value.trim() === '').toBe(true);
              });
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4.3: getEnvironmentConfig provides fallbacks in development mode', () => {
    fc.assert(
      fc.property(
        partialEnvironmentArb,
        (env) => {
          // Set to development mode explicitly - this is what we're testing
          const originalNodeEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = 'development';
          
          // Don't set NODE_ENV from the generated env since we're controlling it
          const envWithoutNodeEnv = { ...env };
          delete envWithoutNodeEnv.NODE_ENV;
          setEnvironmentVariables(envWithoutNodeEnv);
          
          try {
            // Should not throw in development mode
            expect(() => getEnvironmentConfig()).not.toThrow();
            
            const config = getEnvironmentConfig();
            
            // Verify configuration is valid
            expect(isValidEnvironmentConfig(config)).toBe(true);
            
            // Verify fallbacks are used when variables are missing
            if (!env.NEXT_PUBLIC_API_URL) {
              expect(config.apiUrl).toBe('http://localhost:8000/api');
            } else {
              expect(config.apiUrl).toBe(env.NEXT_PUBLIC_API_URL);
            }
            
            if (!env.NEXT_PUBLIC_WS_URL) {
              expect(config.wsUrl).toBe('ws://localhost:8000/ws');
            } else {
              expect(config.wsUrl).toBe(env.NEXT_PUBLIC_WS_URL);
            }
            
            if (!env.NEXT_PUBLIC_MEDIA_URL) {
              expect(config.mediaUrl).toBe('http://localhost:8000');
            } else {
              expect(config.mediaUrl).toBe(env.NEXT_PUBLIC_MEDIA_URL);
            }
            
            expect(config.nodeEnv).toBe('development');
          } finally {
            // Restore original NODE_ENV
            if (originalNodeEnv !== undefined) {
              process.env.NODE_ENV = originalNodeEnv;
            } else {
              delete process.env.NODE_ENV;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4.4: getEnvironmentConfig throws in production mode with invalid environment', () => {
    fc.assert(
      fc.property(
        invalidEnvironmentArb,
        (env) => {
          // Set to production mode explicitly
          const originalNodeEnv = process.env.NODE_ENV;
          process.env.NODE_ENV = 'production';
          
          // Don't set NODE_ENV from the generated env since we're controlling it
          const envWithoutNodeEnv = { ...env };
          delete envWithoutNodeEnv.NODE_ENV;
          setEnvironmentVariables(envWithoutNodeEnv);
          
          try {
            // Should throw in production mode with invalid environment
            // Only test if environment is actually invalid (has missing or invalid URLs)
            const hasMissingVars = !env.NEXT_PUBLIC_API_URL || !env.NEXT_PUBLIC_WS_URL || !env.NEXT_PUBLIC_MEDIA_URL;
            const hasInvalidUrls = 
              (env.NEXT_PUBLIC_API_URL && !isValidUrl(env.NEXT_PUBLIC_API_URL)) ||
              (env.NEXT_PUBLIC_WS_URL && !isValidWsUrl(env.NEXT_PUBLIC_WS_URL)) ||
              (env.NEXT_PUBLIC_MEDIA_URL && !isValidUrl(env.NEXT_PUBLIC_MEDIA_URL));
            
            if (hasMissingVars || hasInvalidUrls) {
              expect(() => getEnvironmentConfig()).toThrow(EnvironmentValidationError);
            }
          } finally {
            // Restore original NODE_ENV
            if (originalNodeEnv !== undefined) {
              process.env.NODE_ENV = originalNodeEnv;
            } else {
              delete process.env.NODE_ENV;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4.5: URL validation correctly identifies valid and invalid URLs', () => {
    fc.assert(
      fc.property(
        fc.oneof(validUrlArb, invalidUrlArb),
        (url) => {
          const actuallyValid = isValidUrl(url);
          
          if (actuallyValid) {
            // If URL is actually valid, environment validation should accept it
            process.env.NEXT_PUBLIC_API_URL = url;
            process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8000/ws';
            process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';
            
            expect(() => validateEnvironment()).not.toThrow();
            
            const config = validateEnvironment();
            expect(config.apiUrl).toBe(url);
          } else {
            // If URL is invalid, environment validation should reject it
            process.env.NEXT_PUBLIC_API_URL = url;
            process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8000/ws';
            process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';
            
            expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4.6: WebSocket URL validation correctly handles ws:// and wss:// protocols', () => {
    fc.assert(
      fc.property(
        fc.oneof(validWsUrlArb, invalidUrlArb),
        (wsUrl) => {
          const actuallyValidWs = isValidWsUrl(wsUrl);
          
          if (actuallyValidWs) {
            // If WebSocket URL is valid, environment validation should accept it
            process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api';
            process.env.NEXT_PUBLIC_WS_URL = wsUrl;
            process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';
            
            expect(() => validateEnvironment()).not.toThrow();
            
            const config = validateEnvironment();
            expect(config.wsUrl).toBe(wsUrl);
          } else {
            // If WebSocket URL is invalid, environment validation should reject it
            process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api';
            process.env.NEXT_PUBLIC_WS_URL = wsUrl;
            process.env.NEXT_PUBLIC_MEDIA_URL = 'http://localhost:8000';
            
            expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4.7: Environment configuration maintains consistency across validation functions', () => {
    fc.assert(
      fc.property(
        validEnvironmentArb,
        (env) => {
          setEnvironmentVariables(env);
          
          // Both validation functions should produce identical results for valid environment
          const directConfig = validateEnvironment();
          const getterConfig = getEnvironmentConfig();
          
          expect(directConfig).toEqual(getterConfig);
          
          // Both should be valid configurations
          expect(isValidEnvironmentConfig(directConfig)).toBe(true);
          expect(isValidEnvironmentConfig(getterConfig)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4.8: Environment validation error messages are informative and actionable', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_WS_URL', 'NEXT_PUBLIC_MEDIA_URL'), { minLength: 1, maxLength: 3 }).map(arr => [...new Set(arr)]), // Remove duplicates
        (missingVars) => {
          // Clear all environment variables
          delete process.env.NEXT_PUBLIC_API_URL;
          delete process.env.NEXT_PUBLIC_WS_URL;
          delete process.env.NEXT_PUBLIC_MEDIA_URL;
          
          // Set only the variables not in missingVars
          const allVars = ['NEXT_PUBLIC_API_URL', 'NEXT_PUBLIC_WS_URL', 'NEXT_PUBLIC_MEDIA_URL'];
          const validValues = {
            'NEXT_PUBLIC_API_URL': 'http://localhost:8000/api',
            'NEXT_PUBLIC_WS_URL': 'ws://localhost:8000/ws',
            'NEXT_PUBLIC_MEDIA_URL': 'http://localhost:8000'
          };
          
          allVars.forEach(varName => {
            if (!missingVars.includes(varName)) {
              process.env[varName] = validValues[varName as keyof typeof validValues];
            }
          });
          
          try {
            validateEnvironment();
            // Should not reach here if variables are actually missing
            expect(missingVars.length).toBe(0);
          } catch (error) {
            expect(error).toBeInstanceOf(EnvironmentValidationError);
            
            // Error message should mention missing variables
            expect(error.message).toContain('Missing required environment variables');
            missingVars.forEach(varName => {
              expect(error.message).toContain(varName);
            });
            
            // Missing variables should be tracked correctly (no duplicates)
            expect(error.missingVars).toEqual(expect.arrayContaining(missingVars));
            expect(error.missingVars.length).toBe(missingVars.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4.9: Environment configuration handles edge cases gracefully', () => {
    fc.assert(
      fc.property(
        fc.record({
          apiUrl: fc.oneof(validUrlArb, fc.constant(''), fc.constant('   ')),
          wsUrl: fc.oneof(validWsUrlArb, fc.constant(''), fc.constant('   ')),
          mediaUrl: fc.oneof(validUrlArb, fc.constant(''), fc.constant('   '))
        }),
        (urls) => {
          process.env.NEXT_PUBLIC_API_URL = urls.apiUrl;
          process.env.NEXT_PUBLIC_WS_URL = urls.wsUrl;
          process.env.NEXT_PUBLIC_MEDIA_URL = urls.mediaUrl;
          
          const hasEmptyOrWhitespace = 
            !urls.apiUrl.trim() || 
            !urls.wsUrl.trim() || 
            !urls.mediaUrl.trim();
          
          const hasInvalidUrls = 
            (urls.apiUrl.trim() && !isValidUrl(urls.apiUrl)) ||
            (urls.wsUrl.trim() && !isValidWsUrl(urls.wsUrl)) ||
            (urls.mediaUrl.trim() && !isValidUrl(urls.mediaUrl));
          
          if (hasEmptyOrWhitespace || hasInvalidUrls) {
            expect(() => validateEnvironment()).toThrow(EnvironmentValidationError);
          } else {
            expect(() => validateEnvironment()).not.toThrow();
            const config = validateEnvironment();
            expect(isValidEnvironmentConfig(config)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4.10: Environment configuration supports different deployment environments', () => {
    fc.assert(
      fc.property(
        nodeEnvArb,
        validEnvironmentArb,
        (nodeEnv, env) => {
          const originalNodeEnv = process.env.NODE_ENV;
          
          // Set the NODE_ENV we want to test
          process.env.NODE_ENV = nodeEnv;
          
          // Don't set NODE_ENV in the env object since we're setting it directly
          const envWithoutNodeEnv = { ...env };
          delete envWithoutNodeEnv.NODE_ENV;
          setEnvironmentVariables(envWithoutNodeEnv);
          
          try {
            // Should work in any valid environment
            expect(() => validateEnvironment()).not.toThrow();
            
            const config = validateEnvironment();
            expect(config.nodeEnv).toBe(nodeEnv);
            expect(isValidEnvironmentConfig(config)).toBe(true);
            
            // Configuration should be consistent regardless of NODE_ENV
            expect(config.apiUrl).toBe(env.NEXT_PUBLIC_API_URL);
            expect(config.wsUrl).toBe(env.NEXT_PUBLIC_WS_URL);
            expect(config.mediaUrl).toBe(env.NEXT_PUBLIC_MEDIA_URL);
          } finally {
            // Restore original NODE_ENV
            if (originalNodeEnv !== undefined) {
              process.env.NODE_ENV = originalNodeEnv;
            } else {
              delete process.env.NODE_ENV;
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});