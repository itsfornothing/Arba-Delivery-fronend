# Color Contrast Validation System

This directory contains a comprehensive color contrast validation system that ensures WCAG 2.1 AA compliance for the Mohamedo delivery platform frontend.

## Overview

The color contrast validation system provides:

- **WCAG 2.1 AA compliant contrast ratio calculations**
- **Development-time warnings for poor contrast**
- **React hooks and HOCs for automatic validation**
- **Theme-wide validation utilities**
- **Comprehensive testing suite**

## Files

### Core Utilities

- **`colorContrast.ts`** - Core WCAG contrast calculations and validation functions
- **`contrastValidator.ts`** - React integration utilities (hooks, HOCs)
- **`themeContrastValidator.ts`** - Theme-specific validation and reporting

### Examples and Tests

- **`examples/contrastValidationExample.tsx`** - Comprehensive usage examples
- **`__tests__/colorContrast.test.ts`** - Core utility tests
- **`__tests__/themeContrastValidator.test.ts`** - Theme validation tests

## Quick Start

### 1. Basic Contrast Validation

```typescript
import { validateColorContrast } from './lib/colorContrast';

const result = validateColorContrast('#000000', '#ffffff');
console.log(result.ratio); // 21
console.log(result.level); // 'AAA'
console.log(result.isAccessible); // true
```

### 2. React Hook Integration

```typescript
import { useContrastValidation } from './lib/contrastValidator';

const MyButton = ({ variant }) => {
  const colors = getColorsForVariant(variant);
  
  // Automatically warns in development if contrast is poor
  useContrastValidation(
    colors.foreground,
    colors.background,
    'MyButton',
    { fontSize: 16, fontWeight: 500 }
  );
  
  return <button style={{ color: colors.foreground, backgroundColor: colors.background }}>
    Click me
  </button>;
};
```

### 3. Theme Validation

```typescript
import { validateTheme, logThemeValidation } from './lib/themeContrastValidator';

// Validate entire theme
const results = validateTheme(enhancedTheme, 'light');
console.log(`${results.accessibleCombinations}/${results.totalCombinations} combinations accessible`);

// Log detailed validation to console (development only)
logThemeValidation();
```

## API Reference

### Core Functions

#### `calculateContrastRatio(color1: string, color2: string): number`

Calculates the WCAG contrast ratio between two hex colors.

#### `validateColorContrast(foreground: string, background: string, options?: ColorValidationOptions): ContrastResult`

Validates a color combination and returns detailed results including accessibility status and recommendations.

#### `meetsWCAGStandards(foreground: string, background: string, level?: 'A' | 'AA' | 'AAA', isLarge?: boolean): boolean`

Quick check if a color combination meets specific WCAG standards.

### React Integration

#### `useContrastValidation(foreground: string, background: string, componentName: string, options?: ColorValidationOptions): ContrastResult | null`

React hook that validates colors and shows development warnings.

#### `withContrastValidation<P>(Component: React.ComponentType<P>, getColors: (props: P) => { foreground: string; background: string }, options?: ColorValidationOptions)`

Higher-order component for automatic contrast validation.

### Theme Validation

#### `validateTheme(theme: EnhancedThemeConfig, themeName?: 'light' | 'dark'): ThemeValidationResult`

Validates all color combinations in a theme configuration.

#### `generateAccessibilityReport(): string`

Generates a detailed markdown accessibility report for both light and dark themes.

## Development Warnings

The system automatically provides development-time warnings when poor contrast is detected:

```
🚨 Accessibility Warning: Poor color contrast detected in MyButton
   Foreground: #cccccc
   Background: #ffffff
   Contrast Ratio: 1.61:1 (FAIL)
   Increase contrast ratio to at least 4.5:1 for normal text
   WCAG 2.1 AA requires 4.5:1 minimum
```

## WCAG 2.1 Standards

The system implements WCAG 2.1 contrast requirements:

- **Normal text**: 4.5:1 minimum (AA), 7:1 enhanced (AAA)
- **Large text** (18pt+ or 14pt+ bold): 3:1 minimum (AA), 4.5:1 enhanced (AAA)
- **Non-text elements**: 3:1 minimum for UI components and graphics

## Configuration Options

```typescript
interface ColorValidationOptions {
  fontSize?: number;        // Font size in pixels
  fontWeight?: number;      // Font weight (400, 500, 600, 700, etc.)
  isLargeText?: boolean;    // Force large text treatment
  strictMode?: boolean;     // Require AAA level (7:1) instead of AA (4.5:1)
}
```

## Best Practices

### 1. Use in Development Only

Most validation functions automatically skip in production to avoid performance impact:

```typescript
if (process.env.NODE_ENV === 'development') {
  warnPoorContrast(foreground, background, 'MyComponent');
}
```

### 2. Validate Early and Often

- Use hooks in components during development
- Run theme validation in CI/CD pipelines
- Include contrast checks in design system documentation

### 3. Handle Edge Cases

```typescript
try {
  const result = validateColorContrast(userColor, backgroundColor);
  // Handle result
} catch (error) {
  // Handle invalid color formats gracefully
  console.error('Invalid color format:', error);
}
```

### 4. Provide Fallbacks

```typescript
const isAccessible = meetsWCAGStandards(textColor, bgColor);
if (!isAccessible) {
  // Use high-contrast fallback colors
  textColor = theme.colors.neutral[900];
  bgColor = theme.colors.neutral[50];
}
```

## Integration with Design System

The validation system is integrated with the enhanced theme:

```typescript
import { enhancedTheme } from './lib/theme';
import { validateTheme } from './lib/themeContrastValidator';

// Validate theme on startup (development only)
if (process.env.NODE_ENV === 'development') {
  const results = validateTheme(enhancedTheme);
  if (results.failedCombinations.length > 0) {
    console.warn('Theme has accessibility issues that need attention');
  }
}
```

## Testing

The system includes comprehensive tests:

```bash
# Run all contrast validation tests
npm test -- --testPathPattern=colorContrast

# Run theme validation tests
npm test -- --testPathPattern=themeContrastValidator
```

## Contributing

When adding new color combinations to the theme:

1. Run the theme validator to check accessibility
2. Fix any failing combinations before committing
3. Add tests for new validation scenarios
4. Update documentation with new patterns

## Troubleshooting

### Common Issues

1. **"Invalid color format" errors**: Ensure colors are in hex format (#ffffff)
2. **Performance in production**: Validation is automatically disabled in production
3. **False positives**: Check if large text options should be used
4. **Theme validation failures**: Review color palette choices and adjust as needed

### Getting Help

- Check the examples in `examples/contrastValidationExample.tsx`
- Review test files for usage patterns
- Run `generateAccessibilityReport()` for detailed analysis