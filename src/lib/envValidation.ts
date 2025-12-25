/**
 * Environment validation utilities for deployment
 * Ensures required environment variables are present and valid
 */

export interface EnvironmentConfig {
  apiUrl: string;
  wsUrl: string;
  mediaUrl: string;
  nodeEnv: string;
}

export class EnvironmentValidationError extends Error {
  constructor(message: string, public missingVars: string[]) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validates required environment variables
 * @returns Validated environment configuration
 * @throws EnvironmentValidationError if validation fails
 */
export function validateEnvironment(): EnvironmentConfig {
  const requiredVars = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_WS_URL', 
    'NEXT_PUBLIC_MEDIA_URL'
  ];

  const missingVars = requiredVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.trim() === '';
  });

  if (missingVars.length > 0) {
    throw new EnvironmentValidationError(
      `Missing required environment variables: ${missingVars.join(', ')}`,
      missingVars
    );
  }

  // Validate URL formats
  const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL!;
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL!;

  try {
    new URL(apiUrl);
    new URL(wsUrl.replace('ws://', 'http://').replace('wss://', 'https://'));
    new URL(mediaUrl);
  } catch (error) {
    throw new EnvironmentValidationError(
      'Invalid URL format in environment variables',
      []
    );
  }

  return {
    apiUrl,
    wsUrl,
    mediaUrl,
    nodeEnv: process.env.NODE_ENV || 'development'
  };
}

/**
 * Gets environment configuration with fallbacks for development
 * @returns Environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  try {
    return validateEnvironment();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // Provide fallbacks for development
      console.warn('Using fallback environment configuration for development');
      return {
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
        wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
        mediaUrl: process.env.NEXT_PUBLIC_MEDIA_URL || 'http://localhost:8000',
        nodeEnv: process.env.NODE_ENV || 'development'
      };
    }
    throw error;
  }
}

/**
 * Validates environment at build time
 * Used in Next.js configuration
 */
export function validateBuildEnvironment(): void {
  if (process.env.NODE_ENV === 'production') {
    try {
      validateEnvironment();
      console.log('✅ Environment validation passed');
    } catch (error) {
      console.error('❌ Environment validation failed:', error);
      process.exit(1);
    }
  }
}