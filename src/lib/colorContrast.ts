/**
 * Color Contrast Validation Utilities
 * WCAG 2.1 AA compliant contrast ratio calculations and validation
 * Provides development-time warnings for poor contrast combinations
 */

export interface ContrastResult {
  ratio: number;
  level: 'AAA' | 'AA' | 'A' | 'FAIL';
  isAccessible: boolean;
  recommendation?: string;
}

export interface ColorValidationOptions {
  fontSize?: number;
  fontWeight?: number;
  isLargeText?: boolean;
  strictMode?: boolean;
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Validate hex format
  if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return null;
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Convert RGB to relative luminance according to WCAG formula
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  // Normalize RGB values to 0-1 range
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance using WCAG formula
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Please use hex colors (e.g., #ffffff)');
  }
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  // Ensure lighter color is in numerator
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Determine if text is considered large according to WCAG
 */
export function isLargeText(fontSize: number, fontWeight: number = 400): boolean {
  // Large text is 18pt (24px) or larger, or 14pt (18.66px) or larger if bold (700+)
  const fontSizePx = fontSize;
  
  if (fontWeight >= 700) {
    return fontSizePx >= 18.66; // 14pt bold
  }
  
  return fontSizePx >= 24; // 18pt regular
}

/**
 * Get WCAG compliance level for a contrast ratio
 */
export function getComplianceLevel(ratio: number, isLarge: boolean = false): ContrastResult['level'] {
  if (isLarge) {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AAA'; // Large text AAA is 4.5:1
    if (ratio >= 3) return 'AA';    // Large text AA is 3:1
  } else {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'A';
  }
  
  return 'FAIL';
}

/**
 * Validate color contrast and provide detailed results
 */
export function validateColorContrast(
  foreground: string,
  background: string,
  options: ColorValidationOptions = {}
): ContrastResult {
  const {
    fontSize = 16,
    fontWeight = 400,
    isLargeText: forceLargeText = false,
    strictMode = false
  } = options;
  
  try {
    const ratio = calculateContrastRatio(foreground, background);
    const isLarge = forceLargeText || isLargeText(fontSize, fontWeight);
    const level = getComplianceLevel(ratio, isLarge);
    
    // Determine if accessible based on WCAG AA standards
    const minRatio = isLarge ? 3 : 4.5;
    const isAccessible = strictMode ? ratio >= 7 : ratio >= minRatio;
    
    let recommendation: string | undefined;
    
    if (!isAccessible) {
      if (isLarge) {
        recommendation = `Increase contrast ratio to at least 3:1 for large text (current: ${ratio.toFixed(2)}:1)`;
      } else {
        recommendation = `Increase contrast ratio to at least 4.5:1 for normal text (current: ${ratio.toFixed(2)}:1)`;
      }
    } else if (level === 'A' || level === 'AA') {
      recommendation = `Consider improving contrast to AAA level (7:1) for better accessibility`;
    }
    
    return {
      ratio: Math.round(ratio * 100) / 100, // Round to 2 decimal places
      level,
      isAccessible,
      recommendation
    };
  } catch (error) {
    throw new Error(`Color contrast validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch validate multiple color combinations
 */
export function validateColorCombinations(
  combinations: Array<{
    foreground: string;
    background: string;
    label?: string;
    options?: ColorValidationOptions;
  }>
): Array<ContrastResult & { label?: string; foreground: string; background: string }> {
  return combinations.map(({ foreground, background, label, options }) => {
    const result = validateColorContrast(foreground, background, options);
    return {
      ...result,
      label,
      foreground,
      background
    };
  });
}

/**
 * Development-time warning system for poor contrast
 */
export function warnPoorContrast(
  foreground: string,
  background: string,
  context: string = 'Unknown component',
  options: ColorValidationOptions = {}
): void {
  if (process.env.NODE_ENV === 'production') {
    return; // Skip warnings in production
  }
  
  try {
    const result = validateColorContrast(foreground, background, options);
    
    if (!result.isAccessible) {
      console.warn(
        `🚨 Accessibility Warning: Poor color contrast detected in ${context}\n` +
        `   Foreground: ${foreground}\n` +
        `   Background: ${background}\n` +
        `   Contrast Ratio: ${result.ratio}:1 (${result.level})\n` +
        `   ${result.recommendation}\n` +
        `   WCAG 2.1 AA requires ${options.isLargeText || isLargeText(options.fontSize || 16, options.fontWeight || 400) ? '3:1' : '4.5:1'} minimum`
      );
    } else if (result.level === 'A' || result.level === 'AA') {
      console.info(
        `ℹ️ Accessibility Info: ${context} meets minimum requirements but could be improved\n` +
        `   Contrast Ratio: ${result.ratio}:1 (${result.level})\n` +
        `   ${result.recommendation}`
      );
    }
  } catch (error) {
    console.error(`Color contrast validation error in ${context}:`, error);
  }
}

/**
 * Get suggested color adjustments to improve contrast
 */
export function getSuggestedColors(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): {
  adjustedForeground?: string;
  adjustedBackground?: string;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  
  // Check for invalid colors first
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    return { suggestions: ['Invalid color format provided'] };
  }
  
  try {
    const currentRatio = calculateContrastRatio(foreground, background);
    
    if (currentRatio >= targetRatio) {
      return { suggestions: ['Current colors already meet the target contrast ratio'] };
    }
    
    // Simple suggestions based on luminance
    const fgLuminance = getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
    
    if (fgLuminance > bgLuminance) {
      suggestions.push('Consider lightening the foreground color');
      suggestions.push('Consider darkening the background color');
    } else {
      suggestions.push('Consider darkening the foreground color');
      suggestions.push('Consider lightening the background color');
    }
    
    suggestions.push(`Target contrast ratio: ${targetRatio}:1 (current: ${currentRatio.toFixed(2)}:1)`);
    
    return { suggestions };
  } catch (error) {
    return { suggestions: ['Error calculating color adjustments'] };
  }
}

/**
 * Utility to check if a color combination meets WCAG standards
 */
export function meetsWCAGStandards(
  foreground: string,
  background: string,
  level: 'A' | 'AA' | 'AAA' = 'AA',
  isLarge: boolean = false
): boolean {
  try {
    const ratio = calculateContrastRatio(foreground, background);
    
    switch (level) {
      case 'AAA':
        return ratio >= (isLarge ? 4.5 : 7);
      case 'AA':
        return ratio >= (isLarge ? 3 : 4.5);
      case 'A':
        return ratio >= 3;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Create a contrast validation hook for React components
 */
export function createContrastValidator(componentName: string) {
  return (
    foreground: string,
    background: string,
    options: ColorValidationOptions = {}
  ) => {
    warnPoorContrast(foreground, background, componentName, options);
    return validateColorContrast(foreground, background, options);
  };
}

// Pre-defined color combinations from the theme for quick validation
export const THEME_COLOR_TESTS = {
  primaryOnWhite: { foreground: '#0ea5e9', background: '#ffffff' },
  primaryOnNeutral: { foreground: '#0ea5e9', background: '#f8fafc' },
  whiteOnPrimary: { foreground: '#ffffff', background: '#0ea5e9' },
  secondaryOnWhite: { foreground: '#22c55e', background: '#ffffff' },
  errorOnWhite: { foreground: '#ef4444', background: '#ffffff' },
  warningOnWhite: { foreground: '#f59e0b', background: '#ffffff' },
  neutralTextOnWhite: { foreground: '#334155', background: '#ffffff' },
  neutralTextOnLight: { foreground: '#334155', background: '#f1f5f9' },
} as const;

/**
 * Validate all theme color combinations
 */
export function validateThemeColors(): Array<ContrastResult & { combination: string }> {
  return Object.entries(THEME_COLOR_TESTS).map(([key, { foreground, background }]) => {
    const result = validateColorContrast(foreground, background);
    return {
      ...result,
      combination: key
    };
  });
}