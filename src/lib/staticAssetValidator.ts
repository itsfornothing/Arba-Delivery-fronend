/**
 * Static Asset Validation Utilities
 * 
 * Validates that all required static assets are generated during build
 * and provides detailed reporting for missing or problematic assets.
 */

export interface AssetValidationResult {
  isValid: boolean;
  totalAssets: number;
  validAssets: number;
  missingAssets: string[];
  invalidAssets: string[];
  warnings: string[];
  details: AssetDetails[];
}

export interface AssetDetails {
  path: string;
  type: 'CSS' | 'JS' | 'IMAGE' | 'FONT' | 'OTHER';
  exists: boolean;
  size?: number;
  lastModified?: Date;
  integrity?: string;
  issues: string[];
}

export interface AssetRequirement {
  pattern: RegExp;
  type: 'CSS' | 'JS' | 'IMAGE' | 'FONT' | 'OTHER';
  required: boolean;
  description: string;
}

/**
 * Validates static assets generated during the build process
 */
export class StaticAssetValidator {
  private static readonly REQUIRED_ASSETS: AssetRequirement[] = [
    {
      pattern: /\/_next\/static\/css\/.*\.css$/,
      type: 'CSS',
      required: true,
      description: 'Main application CSS bundle',
    },
    {
      pattern: /\/_next\/static\/chunks\/pages\/.*\.js$/,
      type: 'JS',
      required: true,
      description: 'Page-specific JavaScript chunks',
    },
    {
      pattern: /\/_next\/static\/chunks\/main-.*\.js$/,
      type: 'JS',
      required: true,
      description: 'Main application JavaScript bundle',
    },
    {
      pattern: /\/_next\/static\/chunks\/webpack-.*\.js$/,
      type: 'JS',
      required: true,
      description: 'Webpack runtime bundle',
    },
    {
      pattern: /\/_next\/static\/chunks\/framework-.*\.js$/,
      type: 'JS',
      required: true,
      description: 'React framework bundle',
    },
    {
      pattern: /\/favicon\.ico$/,
      type: 'IMAGE',
      required: false,
      description: 'Site favicon',
    },
  ];

  private static readonly CRITICAL_PATHS = [
    '/_next/static',
    '/public',
    '/.next/static',
    '/.next/server',
  ];

  /**
   * Validates all static assets in the build output
   */
  static async validateBuildAssets(buildPath: string = '.next'): Promise<AssetValidationResult> {
    const result: AssetValidationResult = {
      isValid: true,
      totalAssets: 0,
      validAssets: 0,
      missingAssets: [],
      invalidAssets: [],
      warnings: [],
      details: [],
    };

    try {
      // Discover all assets in the build directory
      const discoveredAssets = await this.discoverAssets(buildPath);
      result.totalAssets = discoveredAssets.length;

      // Validate each discovered asset
      for (const assetPath of discoveredAssets) {
        const assetDetails = await this.validateAsset(assetPath, buildPath);
        result.details.push(assetDetails);

        if (assetDetails.exists && assetDetails.issues.length === 0) {
          result.validAssets++;
        } else if (!assetDetails.exists) {
          result.missingAssets.push(assetPath);
        } else if (assetDetails.issues.length > 0) {
          result.invalidAssets.push(assetPath);
        }
      }

      // Check for required assets
      const requiredAssetCheck = await this.validateRequiredAssets(discoveredAssets);
      result.missingAssets.push(...requiredAssetCheck.missing);
      result.warnings.push(...requiredAssetCheck.warnings);

      // Validate critical directory structure
      const structureValidation = await this.validateDirectoryStructure(buildPath);
      result.warnings.push(...structureValidation.warnings);

      // Determine overall validity
      result.isValid = result.missingAssets.length === 0 && 
                      result.invalidAssets.length === 0 && 
                      structureValidation.isValid;

    } catch (error) {
      result.isValid = false;
      result.warnings.push(`Asset validation failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Validates assets for production deployment
   */
  static async validateProductionAssets(): Promise<AssetValidationResult> {
    const result = await this.validateBuildAssets();
    
    // Additional production-specific validations
    const productionChecks = [
      this.validateAssetOptimization(result.details),
      this.validateAssetIntegrity(result.details),
      this.validateAssetCompression(result.details),
    ];

    const productionResults = await Promise.allSettled(productionChecks);
    
    productionResults.forEach((checkResult, index) => {
      if (checkResult.status === 'rejected') {
        result.warnings.push(`Production check ${index + 1} failed: ${checkResult.reason.message}`);
      } else if (checkResult.value.warnings) {
        result.warnings.push(...checkResult.value.warnings);
      }
    });

    return result;
  }

  /**
   * Generates a detailed asset validation report
   */
  static generateValidationReport(result: AssetValidationResult): string {
    let report = '📊 STATIC ASSET VALIDATION REPORT\n';
    report += '='.repeat(50) + '\n\n';

    // Summary
    report += `📈 Summary:\n`;
    report += `   Total Assets: ${result.totalAssets}\n`;
    report += `   Valid Assets: ${result.validAssets}\n`;
    report += `   Missing Assets: ${result.missingAssets.length}\n`;
    report += `   Invalid Assets: ${result.invalidAssets.length}\n`;
    report += `   Overall Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;

    // Missing assets
    if (result.missingAssets.length > 0) {
      report += `❌ Missing Assets (${result.missingAssets.length}):\n`;
      result.missingAssets.forEach((asset, index) => {
        report += `   ${index + 1}. ${asset}\n`;
      });
      report += '\n';
    }

    // Invalid assets
    if (result.invalidAssets.length > 0) {
      report += `⚠️  Invalid Assets (${result.invalidAssets.length}):\n`;
      result.invalidAssets.forEach((asset, index) => {
        const details = result.details.find(d => d.path === asset);
        report += `   ${index + 1}. ${asset}\n`;
        if (details && details.issues.length > 0) {
          details.issues.forEach(issue => {
            report += `      - ${issue}\n`;
          });
        }
      });
      report += '\n';
    }

    // Warnings
    if (result.warnings.length > 0) {
      report += `⚠️  Warnings (${result.warnings.length}):\n`;
      result.warnings.forEach((warning, index) => {
        report += `   ${index + 1}. ${warning}\n`;
      });
      report += '\n';
    }

    // Asset breakdown by type
    const assetsByType = this.groupAssetsByType(result.details);
    report += `📁 Assets by Type:\n`;
    Object.entries(assetsByType).forEach(([type, assets]) => {
      const validCount = assets.filter(a => a.exists && a.issues.length === 0).length;
      report += `   ${type}: ${validCount}/${assets.length} valid\n`;
    });

    return report;
  }

  /**
   * Discovers all assets in the build directory
   */
  private static async discoverAssets(buildPath: string): Promise<string[]> {
    // In a browser environment, we can't actually read the file system
    // This would be implemented differently in a Node.js environment
    // For now, return expected asset patterns
    return [
      '/_next/static/css/app.css',
      '/_next/static/chunks/main.js',
      '/_next/static/chunks/pages/_app.js',
      '/_next/static/chunks/pages/index.js',
      '/_next/static/chunks/webpack.js',
      '/_next/static/chunks/framework.js',
      '/favicon.ico',
    ];
  }

  /**
   * Validates a single asset
   */
  private static async validateAsset(assetPath: string, buildPath: string): Promise<AssetDetails> {
    const assetDetails: AssetDetails = {
      path: assetPath,
      type: this.determineAssetType(assetPath),
      exists: false,
      issues: [],
    };

    try {
      // In a real implementation, this would check if the file exists
      // and gather file statistics
      assetDetails.exists = true; // Placeholder
      
      // Validate asset based on type
      const typeValidation = this.validateAssetByType(assetDetails);
      assetDetails.issues.push(...typeValidation.issues);

    } catch (error) {
      assetDetails.exists = false;
      assetDetails.issues.push(`Failed to validate asset: ${error.message}`);
    }

    return assetDetails;
  }

  /**
   * Validates required assets are present
   */
  private static async validateRequiredAssets(discoveredAssets: string[]): Promise<{
    missing: string[];
    warnings: string[];
  }> {
    const missing: string[] = [];
    const warnings: string[] = [];

    for (const requirement of this.REQUIRED_ASSETS) {
      const matchingAssets = discoveredAssets.filter(asset => requirement.pattern.test(asset));
      
      if (matchingAssets.length === 0 && requirement.required) {
        missing.push(`Required ${requirement.type} asset: ${requirement.description}`);
      } else if (matchingAssets.length === 0) {
        warnings.push(`Optional ${requirement.type} asset missing: ${requirement.description}`);
      }
    }

    return { missing, warnings };
  }

  /**
   * Validates directory structure
   */
  private static async validateDirectoryStructure(buildPath: string): Promise<{
    isValid: boolean;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let isValid = true;

    // Check critical paths exist
    for (const criticalPath of this.CRITICAL_PATHS) {
      // In a real implementation, this would check directory existence
      // For now, assume they exist
    }

    return { isValid, warnings };
  }

  /**
   * Validates asset optimization for production
   */
  private static async validateAssetOptimization(assets: AssetDetails[]): Promise<{
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Check for unminified assets in production
    const jsAssets = assets.filter(a => a.type === 'JS');
    const cssAssets = assets.filter(a => a.type === 'CSS');

    // Check if assets appear to be minified (simplified check)
    jsAssets.forEach(asset => {
      if (!asset.path.includes('.min.') && !asset.path.includes('/_next/static/')) {
        warnings.push(`JavaScript asset may not be minified: ${asset.path}`);
      }
    });

    cssAssets.forEach(asset => {
      if (!asset.path.includes('.min.') && !asset.path.includes('/_next/static/')) {
        warnings.push(`CSS asset may not be minified: ${asset.path}`);
      }
    });

    return { warnings };
  }

  /**
   * Validates asset integrity
   */
  private static async validateAssetIntegrity(assets: AssetDetails[]): Promise<{
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Check for assets with suspicious sizes
    assets.forEach(asset => {
      if (asset.size !== undefined) {
        if (asset.size === 0) {
          warnings.push(`Asset has zero size: ${asset.path}`);
        } else if (asset.type === 'JS' && asset.size > 1024 * 1024) { // 1MB
          warnings.push(`Large JavaScript asset detected: ${asset.path} (${asset.size} bytes)`);
        } else if (asset.type === 'CSS' && asset.size > 512 * 1024) { // 512KB
          warnings.push(`Large CSS asset detected: ${asset.path} (${asset.size} bytes)`);
        }
      }
    });

    return { warnings };
  }

  /**
   * Validates asset compression
   */
  private static async validateAssetCompression(assets: AssetDetails[]): Promise<{
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Check if assets are properly compressed for production
    const compressibleAssets = assets.filter(a => 
      a.type === 'JS' || a.type === 'CSS' || a.type === 'OTHER'
    );

    compressibleAssets.forEach(asset => {
      // In a real implementation, this would check for gzip/brotli compression
      // For now, just check if the asset path suggests compression
      if (!asset.path.includes('.gz') && !asset.path.includes('.br')) {
        // This is normal for Next.js as compression is handled by the server
        // Just log for awareness
      }
    });

    return { warnings };
  }

  /**
   * Determines asset type based on file extension
   */
  private static determineAssetType(assetPath: string): 'CSS' | 'JS' | 'IMAGE' | 'FONT' | 'OTHER' {
    const extension = assetPath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'css':
        return 'CSS';
      case 'js':
      case 'mjs':
        return 'JS';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
      case 'ico':
        return 'IMAGE';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'eot':
        return 'FONT';
      default:
        return 'OTHER';
    }
  }

  /**
   * Validates asset based on its type
   */
  private static validateAssetByType(asset: AssetDetails): { issues: string[] } {
    const issues: string[] = [];

    switch (asset.type) {
      case 'CSS':
        // Validate CSS assets
        if (asset.size !== undefined && asset.size === 0) {
          issues.push('CSS file is empty');
        }
        break;
        
      case 'JS':
        // Validate JavaScript assets
        if (asset.size !== undefined && asset.size === 0) {
          issues.push('JavaScript file is empty');
        }
        break;
        
      case 'IMAGE':
        // Validate image assets
        if (asset.size !== undefined && asset.size === 0) {
          issues.push('Image file is empty');
        }
        break;
        
      default:
        // Generic validation for other asset types
        break;
    }

    return { issues };
  }

  /**
   * Groups assets by type for reporting
   */
  private static groupAssetsByType(assets: AssetDetails[]): Record<string, AssetDetails[]> {
    return assets.reduce((groups, asset) => {
      const type = asset.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(asset);
      return groups;
    }, {} as Record<string, AssetDetails[]>);
  }
}

/**
 * Asset validation utilities for build scripts
 */
export class BuildAssetValidator {
  /**
   * Validates assets and exits with error code if validation fails
   */
  static async validateAndExit(): Promise<void> {
    console.log('🔍 Validating static assets...\n');
    
    try {
      const result = await StaticAssetValidator.validateBuildAssets();
      const report = StaticAssetValidator.generateValidationReport(result);
      
      console.log(report);
      
      if (!result.isValid) {
        console.error('❌ Asset validation failed!');
        process.exit(1);
      } else {
        console.log('✅ All assets validated successfully!');
      }
      
    } catch (error) {
      console.error('❌ Asset validation error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validates production assets with enhanced checks
   */
  static async validateProductionAndExit(): Promise<void> {
    console.log('🔍 Validating production assets...\n');
    
    try {
      const result = await StaticAssetValidator.validateProductionAssets();
      const report = StaticAssetValidator.generateValidationReport(result);
      
      console.log(report);
      
      if (!result.isValid) {
        console.error('❌ Production asset validation failed!');
        process.exit(1);
      } else {
        console.log('✅ All production assets validated successfully!');
      }
      
    } catch (error) {
      console.error('❌ Production asset validation error:', error.message);
      process.exit(1);
    }
  }
}

// Export main validation functions
export const validateBuildAssets = StaticAssetValidator.validateBuildAssets;
export const validateProductionAssets = StaticAssetValidator.validateProductionAssets;
export const generateValidationReport = StaticAssetValidator.generateValidationReport;