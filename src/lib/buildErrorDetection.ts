/**
 * Build Error Detection and Reporting Utilities
 * 
 * Provides enhanced error detection and diagnostic information for common build failures,
 * particularly focusing on path-related issues that can occur during deployment.
 */

export interface BuildError {
  type: 'PATH_ERROR' | 'DEPENDENCY_ERROR' | 'ENVIRONMENT_ERROR' | 'ASSET_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  details: string;
  suggestions: string[];
  context?: Record<string, any>;
}

export interface PathDiagnostic {
  expectedPath: string;
  actualPath: string;
  exists: boolean;
  isDirectory: boolean;
  permissions?: string;
}

/**
 * Detects and categorizes build errors with enhanced diagnostic information
 */
export class BuildErrorDetector {
  private static readonly COMMON_PATH_PATTERNS = [
    /ENOENT.*package\.json/i,
    /Cannot find module.*package\.json/i,
    /No such file or directory.*package\.json/i,
    /npm error path.*package\.json/i,
    /Error: Cannot resolve.*src\/frontend/i,
    /Module not found.*frontend/i,
  ];

  private static readonly DEPENDENCY_PATTERNS = [
    /npm ERR! peer dep missing/i,
    /Module not found: Can't resolve/i,
    /Cannot resolve dependency/i,
    /npm ERR! missing script/i,
    /npm ERR! code ELIFECYCLE/i,
  ];

  private static readonly ENVIRONMENT_PATTERNS = [
    /Missing required environment variable/i,
    /Environment variable.*not defined/i,
    /Invalid environment configuration/i,
    /NODE_ENV.*not set/i,
  ];

  /**
   * Analyzes an error and provides detailed diagnostic information
   */
  static analyzeError(error: Error | string): BuildError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? '' : error.stack || '';
    
    // Check for path-related errors
    if (this.isPathError(errorMessage)) {
      return this.createPathError(errorMessage, errorStack);
    }
    
    // Check for dependency errors
    if (this.isDependencyError(errorMessage)) {
      return this.createDependencyError(errorMessage, errorStack);
    }
    
    // Check for environment errors
    if (this.isEnvironmentError(errorMessage)) {
      return this.createEnvironmentError(errorMessage, errorStack);
    }
    
    // Default to unknown error with general suggestions
    return this.createUnknownError(errorMessage, errorStack);
  }

  /**
   * Generates diagnostic information for path-related issues
   */
  static generatePathDiagnostics(suspectedPaths: string[]): PathDiagnostic[] {
    const diagnostics: PathDiagnostic[] = [];
    
    // Common problematic paths in deployment environments
    const commonPaths = [
      '/opt/render/project/src/frontend/package.json',
      '/opt/render/project/frontend/package.json',
      './src/frontend/package.json',
      './frontend/package.json',
      'package.json',
    ];
    
    const pathsToCheck = [...new Set([...suspectedPaths, ...commonPaths])];
    
    pathsToCheck.forEach(path => {
      diagnostics.push({
        expectedPath: path,
        actualPath: this.resolveActualPath(path),
        exists: this.pathExists(path),
        isDirectory: this.isDirectory(path),
        permissions: this.getPermissions(path),
      });
    });
    
    return diagnostics;
  }

  /**
   * Creates detailed error messages with actionable suggestions
   */
  static createDetailedErrorMessage(buildError: BuildError): string {
    let message = `🚨 Build Error Detected: ${buildError.type}\n\n`;
    message += `📋 Error: ${buildError.message}\n\n`;
    message += `🔍 Details: ${buildError.details}\n\n`;
    
    if (buildError.suggestions.length > 0) {
      message += `💡 Suggested Solutions:\n`;
      buildError.suggestions.forEach((suggestion, index) => {
        message += `   ${index + 1}. ${suggestion}\n`;
      });
      message += '\n';
    }
    
    if (buildError.context) {
      message += `📊 Additional Context:\n`;
      Object.entries(buildError.context).forEach(([key, value]) => {
        message += `   ${key}: ${JSON.stringify(value)}\n`;
      });
    }
    
    return message;
  }

  private static isPathError(message: string): boolean {
    return this.COMMON_PATH_PATTERNS.some(pattern => pattern.test(message));
  }

  private static isDependencyError(message: string): boolean {
    return this.DEPENDENCY_PATTERNS.some(pattern => pattern.test(message));
  }

  private static isEnvironmentError(message: string): boolean {
    return this.ENVIRONMENT_PATTERNS.some(pattern => pattern.test(message));
  }

  private static createPathError(message: string, stack: string): BuildError {
    const pathMatch = message.match(/(?:path|file|directory)[\s:]*([^\s]+)/i);
    const suspectedPath = pathMatch ? pathMatch[1] : '';
    
    return {
      type: 'PATH_ERROR',
      message: 'Build failed due to incorrect file or directory path',
      details: `The build process cannot locate the required file or directory. Original error: ${message}`,
      suggestions: [
        'Verify the repository directory structure matches the expected layout',
        'Check if the build command is running from the correct working directory',
        'Ensure package.json exists in the expected location',
        'Update render.yaml buildCommand to use the correct directory path',
        'Verify file permissions allow read access to the required files',
      ],
      context: {
        suspectedPath,
        commonSolutions: {
          renderDeployment: 'Update render.yaml: cd frontend && npm ci && npm run build',
          localDevelopment: 'Ensure you are running commands from the project root',
          pathResolution: 'Check if frontend/ directory exists at project root',
        },
        diagnostics: this.generatePathDiagnostics([suspectedPath]),
      },
    };
  }

  private static createDependencyError(message: string, stack: string): BuildError {
    return {
      type: 'DEPENDENCY_ERROR',
      message: 'Build failed due to dependency resolution issues',
      details: `There was an issue installing or resolving project dependencies. Original error: ${message}`,
      suggestions: [
        'Run "npm ci" to install exact dependency versions from package-lock.json',
        'Verify package.json and package-lock.json are in sync',
        'Check if all required dependencies are listed in package.json',
        'Clear node_modules and reinstall: rm -rf node_modules && npm install',
        'Verify Node.js version compatibility with project dependencies',
      ],
      context: {
        recommendedCommands: [
          'npm ci --only=production',
          'npm install --frozen-lockfile',
          'npm audit fix',
        ],
      },
    };
  }

  private static createEnvironmentError(message: string, stack: string): BuildError {
    return {
      type: 'ENVIRONMENT_ERROR',
      message: 'Build failed due to environment configuration issues',
      details: `Required environment variables or configuration are missing or invalid. Original error: ${message}`,
      suggestions: [
        'Verify all required environment variables are set in render.yaml',
        'Check environment variable names for typos or case sensitivity',
        'Ensure environment variables have valid values',
        'Validate environment configuration in next.config.js',
        'Check if environment variables are accessible during build time',
      ],
      context: {
        requiredEnvVars: [
          'NEXT_PUBLIC_API_URL',
          'NEXT_PUBLIC_WS_URL',
          'NODE_ENV',
        ],
        configFiles: [
          'render.yaml',
          'next.config.js',
          '.env.local',
          '.env.production',
        ],
      },
    };
  }

  private static createUnknownError(message: string, stack: string): BuildError {
    return {
      type: 'UNKNOWN_ERROR',
      message: 'Build failed with an unrecognized error',
      details: `An unexpected error occurred during the build process. Original error: ${message}`,
      suggestions: [
        'Check the full build logs for additional context',
        'Verify all build dependencies are properly installed',
        'Ensure the build environment meets all requirements',
        'Try running the build locally to reproduce the issue',
        'Check for recent changes that might have introduced the error',
      ],
      context: {
        errorMessage: message,
        stackTrace: stack,
        troubleshootingSteps: [
          'Review recent commits for breaking changes',
          'Compare working vs failing build configurations',
          'Check system resources and build timeouts',
        ],
      },
    };
  }

  // Utility methods for path diagnostics (simplified for build environment)
  private static resolveActualPath(path: string): string {
    // In a build environment, we can't actually resolve paths
    // This would be implemented differently in a Node.js runtime environment
    return path;
  }

  private static pathExists(path: string): boolean {
    // Placeholder - would use fs.existsSync in Node.js environment
    return false;
  }

  private static isDirectory(path: string): boolean {
    // Placeholder - would use fs.statSync in Node.js environment
    return false;
  }

  private static getPermissions(path: string): string | undefined {
    // Placeholder - would use fs.statSync in Node.js environment
    return undefined;
  }
}

/**
 * Enhanced error reporting for build processes
 */
export class BuildErrorReporter {
  /**
   * Reports a build error with enhanced diagnostics
   */
  static reportError(error: Error | string, context?: Record<string, any>): void {
    const buildError = BuildErrorDetector.analyzeError(error);
    
    if (context) {
      buildError.context = { ...buildError.context, ...context };
    }
    
    const detailedMessage = BuildErrorDetector.createDetailedErrorMessage(buildError);
    
    // Log to console with enhanced formatting
    console.error('\n' + '='.repeat(80));
    console.error(detailedMessage);
    console.error('='.repeat(80) + '\n');
    
    // In a production environment, you might also want to:
    // - Send error reports to monitoring services
    // - Write to log files
    // - Trigger alerts for critical errors
  }

  /**
   * Validates build environment and reports potential issues
   */
  static validateBuildEnvironment(): BuildError[] {
    const issues: BuildError[] = [];
    
    // Check for common environment issues
    if (typeof process !== 'undefined') {
      // Check Node.js version
      const nodeVersion = process.version;
      if (!this.isNodeVersionSupported(nodeVersion)) {
        issues.push({
          type: 'ENVIRONMENT_ERROR',
          message: `Unsupported Node.js version: ${nodeVersion}`,
          details: 'The current Node.js version may not be compatible with this project',
          suggestions: [
            'Update Node.js to version 18.17.0 or higher',
            'Check package.json engines field for version requirements',
            'Verify render.yaml specifies the correct Node.js version',
          ],
          context: { currentVersion: nodeVersion, recommendedVersion: '18.17.0' },
        });
      }
      
      // Check environment variables
      const requiredEnvVars = ['NODE_ENV'];
      const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      if (missingEnvVars.length > 0) {
        issues.push({
          type: 'ENVIRONMENT_ERROR',
          message: `Missing required environment variables: ${missingEnvVars.join(', ')}`,
          details: 'Required environment variables are not set',
          suggestions: [
            'Set missing environment variables in render.yaml',
            'Verify environment variable names are correct',
            'Check if variables are available during build time',
          ],
          context: { missingVariables: missingEnvVars },
        });
      }
    }
    
    return issues;
  }

  private static isNodeVersionSupported(version: string): boolean {
    // Extract major version number
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
    return majorVersion >= 18;
  }
}

// Export utility functions for easy access
export const detectBuildError = BuildErrorDetector.analyzeError;
export const reportBuildError = BuildErrorReporter.reportError;
export const validateBuildEnvironment = BuildErrorReporter.validateBuildEnvironment;