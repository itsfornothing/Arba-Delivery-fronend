/**
 * Responsive Design Enhancement Utilities
 * Ensures mobile responsiveness for all enhanced components
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { enhancedTheme } from './theme';

// Touch target size constants (WCAG 2.1 AA compliance)
export const TOUCH_TARGETS = {
  MINIMUM: 44, // Minimum touch target size in pixels
  RECOMMENDED: 48, // Recommended touch target size
  LARGE: 52, // Large touch target for primary actions
} as const;

// Responsive breakpoints from theme
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Typography scale adjustments for mobile
export const MOBILE_TYPOGRAPHY_SCALE = {
  h1: { mobile: 'text-3xl', desktop: 'text-5xl' },
  h2: { mobile: 'text-2xl', desktop: 'text-4xl' },
  h3: { mobile: 'text-xl', desktop: 'text-3xl' },
  h4: { mobile: 'text-lg', desktop: 'text-2xl' },
  h5: { mobile: 'text-base', desktop: 'text-xl' },
  h6: { mobile: 'text-sm', desktop: 'text-lg' },
  body1: { mobile: 'text-sm', desktop: 'text-base' },
  body2: { mobile: 'text-xs', desktop: 'text-sm' },
  caption: { mobile: 'text-xs', desktop: 'text-xs' },
  overline: { mobile: 'text-xs', desktop: 'text-xs' },
} as const;

// Spacing adjustments for mobile
export const MOBILE_SPACING = {
  container: {
    mobile: 'px-4',
    tablet: 'px-6',
    desktop: 'px-8',
  },
  section: {
    mobile: 'py-6',
    tablet: 'py-8',
    desktop: 'py-12',
  },
  component: {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8',
  },
} as const;

// Button size configurations with proper touch targets
export const BUTTON_SIZES = {
  sm: {
    mobile: {
      height: 'min-h-[44px]', // WCAG compliant
      padding: 'px-3 py-2',
      text: 'text-sm',
      icon: 'w-4 h-4',
    },
    desktop: {
      height: 'min-h-[32px]',
      padding: 'px-3 py-1.5',
      text: 'text-sm',
      icon: 'w-4 h-4',
    },
  },
  md: {
    mobile: {
      height: 'min-h-[44px]',
      padding: 'px-4 py-2.5',
      text: 'text-base',
      icon: 'w-5 h-5',
    },
    desktop: {
      height: 'min-h-[40px]',
      padding: 'px-4 py-2',
      text: 'text-base',
      icon: 'w-5 h-5',
    },
  },
  lg: {
    mobile: {
      height: 'min-h-[48px]',
      padding: 'px-6 py-3',
      text: 'text-lg',
      icon: 'w-6 h-6',
    },
    desktop: {
      height: 'min-h-[48px]',
      padding: 'px-6 py-3',
      text: 'text-lg',
      icon: 'w-6 h-6',
    },
  },
} as const;

// Input size configurations with proper touch targets
export const INPUT_SIZES = {
  sm: {
    mobile: {
      height: 'h-11', // 44px minimum
      padding: 'px-3',
      text: 'text-base', // Prevent zoom on iOS
      icon: 'w-4 h-4',
    },
    desktop: {
      height: 'h-9', // 36px on desktop
      padding: 'px-3',
      text: 'text-sm',
      icon: 'w-4 h-4',
    },
  },
  md: {
    mobile: {
      height: 'h-12', // 48px
      padding: 'px-4',
      text: 'text-base',
      icon: 'w-5 h-5',
    },
    desktop: {
      height: 'h-11', // 44px
      padding: 'px-4',
      text: 'text-base',
      icon: 'w-5 h-5',
    },
  },
  lg: {
    mobile: {
      height: 'h-14', // 56px
      padding: 'px-5',
      text: 'text-lg',
      icon: 'w-6 h-6',
    },
    desktop: {
      height: 'h-12', // 48px
      padding: 'px-5',
      text: 'text-lg',
      icon: 'w-6 h-6',
    },
  },
} as const;

// Grid system for responsive layouts
export const GRID_SYSTEMS = {
  container: {
    mobile: 'max-w-full px-4',
    tablet: 'max-w-3xl px-6 mx-auto',
    desktop: 'max-w-7xl px-8 mx-auto',
  },
  columns: {
    single: 'grid-cols-1',
    double: 'grid-cols-1 md:grid-cols-2',
    triple: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    quad: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    responsive: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },
  gaps: {
    mobile: 'gap-4',
    tablet: 'gap-6',
    desktop: 'gap-8',
  },
} as const;

// Card responsive configurations
export const CARD_RESPONSIVE = {
  padding: {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8',
  },
  spacing: {
    mobile: 'space-y-4',
    tablet: 'space-y-6',
    desktop: 'space-y-8',
  },
} as const;

// Utility functions for responsive design

/**
 * Get responsive classes for touch targets
 */
export const getTouchTargetClasses = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const config = BUTTON_SIZES[size];
  return {
    mobile: `${config.mobile.height} ${config.mobile.padding}`,
    desktop: `md:${config.desktop.height.replace('min-h-[', 'min-h-[')} md:${config.desktop.padding}`,
    combined: `${config.mobile.height} ${config.mobile.padding} md:${config.desktop.height.replace('min-h-[', 'min-h-[')} md:${config.desktop.padding}`,
  };
};

/**
 * Get responsive typography classes
 */
export const getResponsiveTypography = (variant: keyof typeof MOBILE_TYPOGRAPHY_SCALE) => {
  const scale = MOBILE_TYPOGRAPHY_SCALE[variant];
  return `${scale.mobile} md:${scale.desktop}`;
};

/**
 * Get responsive spacing classes
 */
export const getResponsiveSpacing = (type: keyof typeof MOBILE_SPACING) => {
  const spacing = MOBILE_SPACING[type];
  return `${spacing.mobile} md:${spacing.tablet} lg:${spacing.desktop}`;
};

/**
 * Get responsive grid classes
 */
export const getResponsiveGrid = (columns: keyof typeof GRID_SYSTEMS.columns) => {
  return GRID_SYSTEMS.columns[columns];
};

/**
 * Check if current viewport is mobile
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
};

/**
 * Check if current viewport is tablet
 */
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg;
};

/**
 * Check if current viewport is desktop
 */
export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
};

/**
 * Get current breakpoint
 */
export const getCurrentBreakpoint = (): keyof typeof BREAKPOINTS | 'xs' => {
  if (typeof window === 'undefined') return 'md';
  
  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.sm) return 'xs';
  if (width < BREAKPOINTS.md) return 'sm';
  if (width < BREAKPOINTS.lg) return 'md';
  if (width < BREAKPOINTS.xl) return 'lg';
  if (width < BREAKPOINTS['2xl']) return 'xl';
  return '2xl';
};

/**
 * Hook for responsive behavior
 */
export const useResponsive = () => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      breakpoint: 'lg' as const,
    };
  }

  return {
    isMobile: isMobile(),
    isTablet: isTablet(),
    isDesktop: isDesktop(),
    breakpoint: getCurrentBreakpoint(),
  };
};

/**
 * Responsive image sizes for different breakpoints
 */
export const getResponsiveImageSizes = () => {
  return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
};

/**
 * Get responsive font size that prevents zoom on iOS
 */
export const getIOSFriendlyFontSize = (size: 'sm' | 'md' | 'lg' = 'md') => {
  // iOS Safari zooms when font-size is less than 16px
  const sizes = {
    sm: 'text-base', // 16px minimum for iOS
    md: 'text-base',
    lg: 'text-lg',
  };
  
  return `${sizes[size]} md:text-${size}`;
};

/**
 * Responsive modal/dialog positioning
 */
export const getResponsiveModalClasses = () => {
  return {
    container: 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4',
    content: 'w-full max-w-lg bg-white rounded-t-xl sm:rounded-xl shadow-strong max-h-[90vh] overflow-hidden',
    overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm',
  };
};

/**
 * Responsive navigation classes
 */
export const getResponsiveNavClasses = () => {
  return {
    desktop: 'hidden lg:flex lg:items-center lg:space-x-6',
    mobile: 'lg:hidden',
    mobileMenu: 'absolute top-full left-0 right-0 bg-white shadow-medium border-t border-neutral-200',
  };
};

/**
 * Responsive table classes for mobile-first design
 */
export const getResponsiveTableClasses = () => {
  return {
    container: 'overflow-x-auto -mx-4 sm:mx-0',
    table: 'min-w-full divide-y divide-neutral-200',
    mobileCard: 'block sm:hidden space-y-4',
    desktopTable: 'hidden sm:table',
  };
};

// Export all utilities
export default {
  TOUCH_TARGETS,
  BREAKPOINTS,
  MOBILE_TYPOGRAPHY_SCALE,
  MOBILE_SPACING,
  BUTTON_SIZES,
  INPUT_SIZES,
  GRID_SYSTEMS,
  CARD_RESPONSIVE,
  getTouchTargetClasses,
  getResponsiveTypography,
  getResponsiveSpacing,
  getResponsiveGrid,
  isMobile,
  isTablet,
  isDesktop,
  getCurrentBreakpoint,
  useResponsive,
  getResponsiveImageSizes,
  getIOSFriendlyFontSize,
  getResponsiveModalClasses,
  getResponsiveNavClasses,
  getResponsiveTableClasses,
};