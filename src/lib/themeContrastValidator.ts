/**
 * Theme-specific Color Contrast Validator
 * Validates the enhanced theme colors for WCAG compliance
 */

import { enhancedTheme, darkTheme, EnhancedThemeConfig } from './theme';
import { 
  validateColorContrast, 
  validateColorCombinations, 
  ContrastResult,
  THEME_COLOR_TESTS 
} from './colorContrast';

export interface ThemeValidationResult {
  theme: 'light' | 'dark';
  totalCombinations: number;
  accessibleCombinations: number;
  failedCombinations: Array<{
    name: string;
    foreground: string;
    background: string;
    result: ContrastResult;
  }>;
  warnings: Array<{
    name: string;
    foreground: string;
    background: string;
    result: ContrastResult;
  }>;
}

/**
 * Validate all color combinations in a theme
 */
export function validateTheme(theme: EnhancedThemeConfig, themeName: 'light' | 'dark' = 'light'): ThemeValidationResult {
  const combinations = [
    // Primary combinations
    { name: 'Primary Button (White on Primary)', foreground: theme.colors.neutral[50], background: theme.colors.primary[500] },
    { name: 'Primary Text (Primary on White)', foreground: theme.colors.primary[500], background: theme.colors.neutral[50] },
    { name: 'Primary Link (Primary on Light)', foreground: theme.colors.primary[600], background: theme.colors.neutral[100] },
    
    // Secondary combinations
    { name: 'Secondary Button (White on Secondary)', foreground: theme.colors.neutral[50], background: theme.colors.secondary[500] },
    { name: 'Secondary Text (Secondary on White)', foreground: theme.colors.secondary[500], background: theme.colors.neutral[50] },
    
    // Status color combinations
    { name: 'Success Alert (Success Dark on Success Light)', foreground: theme.colors.success[700], background: theme.colors.success[50] },
    { name: 'Warning Alert (Warning Dark on Warning Light)', foreground: theme.colors.warning[700], background: theme.colors.warning[50] },
    { name: 'Error Alert (Error Dark on Error Light)', foreground: theme.colors.error[700], background: theme.colors.error[50] },
    { name: 'Info Alert (Info Dark on Info Light)', foreground: theme.colors.info[700], background: theme.colors.info[50] },
    
    // Text combinations
    { name: 'Body Text (Dark on White)', foreground: theme.colors.neutral[700], background: theme.colors.neutral[50] },
    { name: 'Heading Text (Darker on White)', foreground: theme.colors.neutral[900], background: theme.colors.neutral[50] },
    { name: 'Muted Text (Medium on White)', foreground: theme.colors.neutral[500], background: theme.colors.neutral[50] },
    { name: 'Placeholder Text (Light on White)', foreground: theme.colors.neutral[400], background: theme.colors.neutral[50] },
    
    // Card and surface combinations
    { name: 'Card Text (Dark on Card)', foreground: theme.colors.neutral[700], background: theme.colors.neutral[100] },
    { name: 'Elevated Card Text (Dark on Elevated)', foreground: theme.colors.neutral[700], background: theme.colors.neutral[200] },
    
    // Interactive element combinations
    { name: 'Link Hover (Primary Dark on White)', foreground: theme.colors.primary[700], background: theme.colors.neutral[50] },
    { name: 'Button Secondary (Primary on Light)', foreground: theme.colors.primary[600], background: theme.colors.neutral[100] },
    
    // Border and outline combinations (for focus states)
    { name: 'Focus Ring (Primary on White)', foreground: theme.colors.primary[500], background: theme.colors.neutral[50] },
    
    // Navigation combinations
    { name: 'Nav Active (White on Primary)', foreground: theme.colors.neutral[50], background: theme.colors.primary[600] },
    { name: 'Nav Inactive (Medium on Light)', foreground: theme.colors.neutral[600], background: theme.colors.neutral[100] },
  ];

  const results = validateColorCombinations(
    combinations.map(({ name, foreground, background }) => ({
      foreground,
      background,
      label: name
    }))
  );

  const failedCombinations: ThemeValidationResult['failedCombinations'] = [];
  const warnings: ThemeValidationResult['warnings'] = [];
  let accessibleCount = 0;

  results.forEach((result) => {
    if (result.isAccessible) {
      accessibleCount++;
      
      // Add to warnings if it's only AA level (could be improved to AAA)
      if (result.level === 'AA' || result.level === 'A') {
        warnings.push({
          name: result.label || 'Unknown',
          foreground: result.foreground,
          background: result.background,
          result
        });
      }
    } else {
      failedCombinations.push({
        name: result.label || 'Unknown',
        foreground: result.foreground,
        background: result.background,
        result
      });
    }
  });

  return {
    theme: themeName,
    totalCombinations: combinations.length,
    accessibleCombinations: accessibleCount,
    failedCombinations,
    warnings
  };
}

/**
 * Validate both light and dark themes
 */
export function validateAllThemes(): {
  light: ThemeValidationResult;
  dark: ThemeValidationResult;
  summary: {
    totalCombinations: number;
    lightAccessible: number;
    darkAccessible: number;
    overallAccessibilityScore: number;
  };
} {
  const lightResult = validateTheme(enhancedTheme, 'light');
  const darkResult = validateTheme(darkTheme, 'dark');

  const totalCombinations = lightResult.totalCombinations + darkResult.totalCombinations;
  const totalAccessible = lightResult.accessibleCombinations + darkResult.accessibleCombinations;

  return {
    light: lightResult,
    dark: darkResult,
    summary: {
      totalCombinations,
      lightAccessible: lightResult.accessibleCombinations,
      darkAccessible: darkResult.accessibleCombinations,
      overallAccessibilityScore: Math.round((totalAccessible / totalCombinations) * 100)
    }
  };
}

/**
 * Generate a detailed accessibility report
 */
export function generateAccessibilityReport(): string {
  const validation = validateAllThemes();
  
  let report = '# Theme Accessibility Report\n\n';
  
  // Summary
  report += '## Summary\n\n';
  report += `- Overall Accessibility Score: ${validation.summary.overallAccessibilityScore}%\n`;
  report += `- Light Theme: ${validation.light.accessibleCombinations}/${validation.light.totalCombinations} combinations accessible\n`;
  report += `- Dark Theme: ${validation.dark.accessibleCombinations}/${validation.dark.totalCombinations} combinations accessible\n\n`;
  
  // Light theme details
  report += '## Light Theme\n\n';
  if (validation.light.failedCombinations.length > 0) {
    report += '### ❌ Failed Combinations\n\n';
    validation.light.failedCombinations.forEach(({ name, foreground, background, result }) => {
      report += `- **${name}**: ${foreground} on ${background} (${result.ratio}:1 - ${result.level})\n`;
      if (result.recommendation) {
        report += `  - ${result.recommendation}\n`;
      }
    });
    report += '\n';
  }
  
  if (validation.light.warnings.length > 0) {
    report += '### ⚠️ Warnings (Could be improved)\n\n';
    validation.light.warnings.forEach(({ name, foreground, background, result }) => {
      report += `- **${name}**: ${foreground} on ${background} (${result.ratio}:1 - ${result.level})\n`;
      if (result.recommendation) {
        report += `  - ${result.recommendation}\n`;
      }
    });
    report += '\n';
  }
  
  // Dark theme details
  report += '## Dark Theme\n\n';
  if (validation.dark.failedCombinations.length > 0) {
    report += '### ❌ Failed Combinations\n\n';
    validation.dark.failedCombinations.forEach(({ name, foreground, background, result }) => {
      report += `- **${name}**: ${foreground} on ${background} (${result.ratio}:1 - ${result.level})\n`;
      if (result.recommendation) {
        report += `  - ${result.recommendation}\n`;
      }
    });
    report += '\n';
  }
  
  if (validation.dark.warnings.length > 0) {
    report += '### ⚠️ Warnings (Could be improved)\n\n';
    validation.dark.warnings.forEach(({ name, foreground, background, result }) => {
      report += `- **${name}**: ${foreground} on ${background} (${result.ratio}:1 - ${result.level})\n`;
      if (result.recommendation) {
        report += `  - ${result.recommendation}\n`;
      }
    });
    report += '\n';
  }
  
  // Recommendations
  report += '## Recommendations\n\n';
  report += '1. **WCAG 2.1 AA Compliance**: Ensure all color combinations meet at least 4.5:1 contrast ratio for normal text and 3:1 for large text.\n';
  report += '2. **AAA Level**: Consider improving combinations to 7:1 ratio for better accessibility.\n';
  report += '3. **Testing**: Use automated tools and manual testing with screen readers.\n';
  report += '4. **User Testing**: Test with users who have visual impairments.\n\n';
  
  return report;
}

/**
 * Log theme validation results to console (development only)
 */
export function logThemeValidation(): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const validation = validateAllThemes();
  
  console.group('🎨 Theme Accessibility Validation');
  
  console.log(`Overall Score: ${validation.summary.overallAccessibilityScore}%`);
  console.log(`Light Theme: ${validation.light.accessibleCombinations}/${validation.light.totalCombinations} accessible`);
  console.log(`Dark Theme: ${validation.dark.accessibleCombinations}/${validation.dark.totalCombinations} accessible`);
  
  if (validation.light.failedCombinations.length > 0) {
    console.group('❌ Light Theme Failures');
    validation.light.failedCombinations.forEach(({ name, result }) => {
      console.warn(`${name}: ${result.ratio}:1 (${result.level}) - ${result.recommendation}`);
    });
    console.groupEnd();
  }
  
  if (validation.dark.failedCombinations.length > 0) {
    console.group('❌ Dark Theme Failures');
    validation.dark.failedCombinations.forEach(({ name, result }) => {
      console.warn(`${name}: ${result.ratio}:1 (${result.level}) - ${result.recommendation}`);
    });
    console.groupEnd();
  }
  
  if (validation.light.warnings.length > 0 || validation.dark.warnings.length > 0) {
    console.group('⚠️ Improvement Opportunities');
    [...validation.light.warnings, ...validation.dark.warnings].forEach(({ name, result }) => {
      console.info(`${name}: ${result.ratio}:1 (${result.level}) - ${result.recommendation}`);
    });
    console.groupEnd();
  }
  
  console.groupEnd();
}

/**
 * Validate specific component color combinations
 */
export function validateComponentColors(
  componentName: string,
  colorCombinations: Array<{
    name: string;
    foreground: string;
    background: string;
    fontSize?: number;
    fontWeight?: number;
  }>
): Array<ContrastResult & { combinationName: string }> {
  const results = colorCombinations.map(({ name, foreground, background, fontSize, fontWeight }) => {
    const result = validateColorContrast(foreground, background, {
      fontSize,
      fontWeight,
      isLargeText: fontSize ? fontSize >= 18 : false
    });

    if (process.env.NODE_ENV === 'development' && !result.isAccessible) {
      console.warn(
        `🚨 ${componentName} - ${name}: Poor contrast ${result.ratio}:1 (${result.level})\n` +
        `   ${result.recommendation}`
      );
    }

    return {
      ...result,
      combinationName: name
    };
  });

  return results;
}

// Auto-validate themes on import in development
if (process.env.NODE_ENV === 'development') {
  // Use setTimeout to avoid blocking the main thread
  setTimeout(() => {
    logThemeValidation();
  }, 100);
}