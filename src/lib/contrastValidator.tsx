/**
 * Development-time Color Contrast Validator
 * React integration utilities for automatic contrast validation
 */

import { useEffect } from 'react';
import { 
  validateColorContrast, 
  warnPoorContrast, 
  ColorValidationOptions,
  ContrastResult 
} from './colorContrast';

/**
 * React hook for validating color contrast in components
 */
export function useContrastValidation(
  foreground: string,
  background: string,
  componentName: string,
  options: ColorValidationOptions = {}
): ContrastResult | null {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      warnPoorContrast(foreground, background, componentName, options);
    }
  }, [foreground, background, componentName, options]);

  // Only validate in development to avoid performance impact in production
  if (process.env.NODE_ENV === 'development') {
    try {
      return validateColorContrast(foreground, background, options);
    } catch (error) {
      console.error(`Contrast validation error in ${componentName}:`, error);
      return null;
    }
  }

  return null;
}

/**
 * Higher-order component for automatic contrast validation
 */
export function withContrastValidation<P extends object>(
  Component: React.ComponentType<P>,
  getColors: (props: P) => { foreground: string; background: string },
  options: ColorValidationOptions = {}
) {
  const WrappedComponent = (props: P) => {
    const { foreground, background } = getColors(props);
    const componentName = Component.displayName || Component.name || 'Unknown Component';
    
    useContrastValidation(foreground, background, componentName, options);
    
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withContrastValidation(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Utility for validating theme color combinations at build time
 */
export function validateThemeContrast(theme: Record<string, any>): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const combinations = [
    { fg: theme.colors?.primary?.[500], bg: theme.colors?.neutral?.[50], name: 'Primary on Light Background' },
    { fg: theme.colors?.neutral?.[50], bg: theme.colors?.primary?.[500], name: 'Light Text on Primary' },
    { fg: theme.colors?.secondary?.[500], bg: theme.colors?.neutral?.[50], name: 'Secondary on Light Background' },
    { fg: theme.colors?.error?.[500], bg: theme.colors?.neutral?.[50], name: 'Error on Light Background' },
    { fg: theme.colors?.warning?.[500], bg: theme.colors?.neutral?.[50], name: 'Warning on Light Background' },
    { fg: theme.colors?.neutral?.[700], bg: theme.colors?.neutral?.[50], name: 'Dark Text on Light Background' },
  ];

  combinations.forEach(({ fg, bg, name }) => {
    if (fg && bg) {
      try {
        warnPoorContrast(fg, bg, `Theme: ${name}`);
      } catch (error) {
        console.error(`Theme validation error for ${name}:`, error);
      }
    }
  });
}

/**
 * Component prop validator for color contrast
 */
export function validateComponentColors(
  props: Record<string, any>,
  componentName: string,
  colorMappings: Array<{
    foregroundProp: string;
    backgroundProp: string;
    options?: ColorValidationOptions;
  }>
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  colorMappings.forEach(({ foregroundProp, backgroundProp, options = {} }) => {
    const foreground = props[foregroundProp];
    const background = props[backgroundProp];

    if (foreground && background) {
      warnPoorContrast(
        foreground,
        background,
        `${componentName} (${foregroundProp} on ${backgroundProp})`,
        options
      );
    }
  });
}

/**
 * CSS-in-JS style validator
 */
export function validateStyles(
  styles: Record<string, any>,
  componentName: string
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  Object.entries(styles).forEach(([className, style]) => {
    if (style && typeof style === 'object') {
      const { color, backgroundColor, background } = style;
      
      if (color && (backgroundColor || background)) {
        const bg = backgroundColor || background;
        // Handle simple color values (not gradients or images)
        if (typeof bg === 'string' && bg.startsWith('#')) {
          warnPoorContrast(
            color,
            bg,
            `${componentName}.${className}`
          );
        }
      }
    }
  });
}

/**
 * Tailwind class validator (basic implementation)
 */
export function validateTailwindClasses(
  className: string,
  componentName: string,
  theme: Record<string, any>
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  // Basic implementation - could be extended with full Tailwind parsing
  const classes = className.split(' ');
  let textColor: string | undefined;
  let bgColor: string | undefined;

  classes.forEach(cls => {
    // Match text color classes like text-primary-500
    const textMatch = cls.match(/^text-(\w+)-(\d+)$/);
    if (textMatch && theme.colors?.[textMatch[1]]?.[textMatch[2]]) {
      textColor = theme.colors[textMatch[1]][textMatch[2]];
    }

    // Match background color classes like bg-neutral-50
    const bgMatch = cls.match(/^bg-(\w+)-(\d+)$/);
    if (bgMatch && theme.colors?.[bgMatch[1]]?.[bgMatch[2]]) {
      bgColor = theme.colors[bgMatch[1]][bgMatch[2]];
    }
  });

  if (textColor && bgColor) {
    warnPoorContrast(textColor, bgColor, `${componentName} (Tailwind: ${className})`);
  }
}

/**
 * Batch validation utility for multiple components
 */
export function validateComponentLibrary(
  components: Array<{
    name: string;
    foreground: string;
    background: string;
    options?: ColorValidationOptions;
  }>
): Array<ContrastResult & { componentName: string }> {
  return components.map(({ name, foreground, background, options = {} }) => {
    const result = validateColorContrast(foreground, background, options);
    
    if (process.env.NODE_ENV === 'development' && !result.isAccessible) {
      console.warn(`Component Library Validation: ${name} has poor contrast`);
    }
    
    return {
      ...result,
      componentName: name
    };
  });
}