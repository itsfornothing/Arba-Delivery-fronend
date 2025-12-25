/**
 * Enhanced Design System Theme Configuration
 * Comprehensive theme system with complete color palettes, typography, spacing, and animation tokens
 * Migrated from delivery-management-ui for professional visual styling
 */

export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface StatusColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface TypographySystem {
  fontFamily: {
    sans: string[];
    display: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
    '8xl': string;
    '9xl': string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

export interface SpacingSystem {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '18': string;
  '88': string;
  '128': string;
  '144': string;
  scale: string[];
  unit: number;
}

export interface ShadowSystem {
  soft: string;
  medium: string;
  strong: string;
  'inner-soft': string;
}

export interface BorderRadiusSystem {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface AnimationSystem {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
    smooth: string;
  };
}

export interface EnhancedThemeConfig {
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
    neutral: ColorPalette;
    success: ColorPalette;
    warning: ColorPalette;
    error: ColorPalette;
    info: ColorPalette;
    status: StatusColors;
  };
  typography: TypographySystem;
  spacing: SpacingSystem;
  shadows: ShadowSystem;
  borderRadius: BorderRadiusSystem;
  animations: AnimationSystem;
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

// Enhanced theme configuration with complete color palettes
export const enhancedTheme: EnhancedThemeConfig = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    secondary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    status: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      display: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '18': '4.5rem',
    '88': '22rem',
    '128': '32rem',
    '144': '36rem',
    scale: [
      '0',
      '0.25rem',
      '0.5rem',
      '0.75rem',
      '1rem',
      '1.25rem',
      '1.5rem',
      '1.75rem',
      '2rem',
      '2.25rem',
      '2.5rem',
      '2.75rem',
      '3rem',
      '3.5rem',
      '4rem',
      '5rem',
      '6rem',
      '8rem',
      '10rem',
      '12rem',
      '16rem',
    ],
    unit: 4,
  },
  shadows: {
    soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
    medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    strong: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
    'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Dark theme variant with adjusted colors for dark mode
export const darkTheme: EnhancedThemeConfig = {
  ...enhancedTheme,
  colors: {
    ...enhancedTheme.colors,
    neutral: {
      50: '#020617',
      100: '#0f172a',
      200: '#1e293b',
      300: '#334155',
      400: '#475569',
      500: '#64748b',
      600: '#94a3b8',
      700: '#cbd5e1',
      800: '#e2e8f0',
      900: '#f1f5f9',
      950: '#f8fafc',
    },
  },
};

// CSS Custom Properties for runtime theme switching
export const cssVariables = {
  // Primary colors
  '--color-primary-50': enhancedTheme.colors.primary[50],
  '--color-primary-100': enhancedTheme.colors.primary[100],
  '--color-primary-200': enhancedTheme.colors.primary[200],
  '--color-primary-300': enhancedTheme.colors.primary[300],
  '--color-primary-400': enhancedTheme.colors.primary[400],
  '--color-primary-500': enhancedTheme.colors.primary[500],
  '--color-primary-600': enhancedTheme.colors.primary[600],
  '--color-primary-700': enhancedTheme.colors.primary[700],
  '--color-primary-800': enhancedTheme.colors.primary[800],
  '--color-primary-900': enhancedTheme.colors.primary[900],
  '--color-primary-950': enhancedTheme.colors.primary[950],
  
  // Secondary colors
  '--color-secondary-50': enhancedTheme.colors.secondary[50],
  '--color-secondary-100': enhancedTheme.colors.secondary[100],
  '--color-secondary-200': enhancedTheme.colors.secondary[200],
  '--color-secondary-300': enhancedTheme.colors.secondary[300],
  '--color-secondary-400': enhancedTheme.colors.secondary[400],
  '--color-secondary-500': enhancedTheme.colors.secondary[500],
  '--color-secondary-600': enhancedTheme.colors.secondary[600],
  '--color-secondary-700': enhancedTheme.colors.secondary[700],
  '--color-secondary-800': enhancedTheme.colors.secondary[800],
  '--color-secondary-900': enhancedTheme.colors.secondary[900],
  '--color-secondary-950': enhancedTheme.colors.secondary[950],
  
  // Neutral colors
  '--color-neutral-50': enhancedTheme.colors.neutral[50],
  '--color-neutral-100': enhancedTheme.colors.neutral[100],
  '--color-neutral-200': enhancedTheme.colors.neutral[200],
  '--color-neutral-300': enhancedTheme.colors.neutral[300],
  '--color-neutral-400': enhancedTheme.colors.neutral[400],
  '--color-neutral-500': enhancedTheme.colors.neutral[500],
  '--color-neutral-600': enhancedTheme.colors.neutral[600],
  '--color-neutral-700': enhancedTheme.colors.neutral[700],
  '--color-neutral-800': enhancedTheme.colors.neutral[800],
  '--color-neutral-900': enhancedTheme.colors.neutral[900],
  '--color-neutral-950': enhancedTheme.colors.neutral[950],
  
  // Typography
  '--font-family-sans': enhancedTheme.typography.fontFamily.sans.join(', '),
  '--font-family-display': enhancedTheme.typography.fontFamily.display.join(', '),
  '--font-family-mono': enhancedTheme.typography.fontFamily.mono.join(', '),
  
  // Shadows
  '--shadow-soft': enhancedTheme.shadows.soft,
  '--shadow-medium': enhancedTheme.shadows.medium,
  '--shadow-strong': enhancedTheme.shadows.strong,
} as const;

// Helper function to get color from palette
export const getColor = (
  palette: keyof EnhancedThemeConfig['colors'],
  shade: keyof ColorPalette,
  theme: EnhancedThemeConfig = enhancedTheme
): string => {
  const colorPalette = theme.colors[palette];
  if (typeof colorPalette === 'object' && 'status' in colorPalette) {
    return theme.colors.status[palette as keyof StatusColors];
  }
  return (colorPalette as ColorPalette)[shade];
};

// Helper function to get spacing value
export const getSpacing = (
  size: keyof SpacingSystem,
  theme: EnhancedThemeConfig = enhancedTheme
): string => {
  return theme.spacing[size];
};

// Helper function to get responsive breakpoint
export const getBreakpoint = (
  size: keyof EnhancedThemeConfig['breakpoints'],
  theme: EnhancedThemeConfig = enhancedTheme
): string => {
  return `@media (min-width: ${theme.breakpoints[size]})`;
};

// Enhanced animation helper functions
export const fadeIn = (duration: number = enhancedTheme.animations.duration.normal) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: duration / 1000, ease: enhancedTheme.animations.easing.easeOut },
});

export const slideUp = (duration: number = enhancedTheme.animations.duration.normal) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: duration / 1000, ease: enhancedTheme.animations.easing.easeOut },
});

export const slideDown = (duration: number = enhancedTheme.animations.duration.normal) => ({
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: duration / 1000, ease: enhancedTheme.animations.easing.easeOut },
});

export const slideLeft = (duration: number = enhancedTheme.animations.duration.normal) => ({
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: duration / 1000, ease: enhancedTheme.animations.easing.easeOut },
});

export const slideRight = (duration: number = enhancedTheme.animations.duration.normal) => ({
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: duration / 1000, ease: enhancedTheme.animations.easing.easeOut },
});

export const scaleIn = (duration: number = enhancedTheme.animations.duration.fast) => ({
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: duration / 1000, ease: enhancedTheme.animations.easing.easeOut },
});

export const bounceIn = (duration: number = enhancedTheme.animations.duration.slow) => ({
  initial: { opacity: 0, scale: 0.3 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: duration / 1000, ease: enhancedTheme.animations.easing.bounce },
});

// Export the enhanced theme as default for backward compatibility
export const defaultTheme = enhancedTheme;
export type Theme = EnhancedThemeConfig;