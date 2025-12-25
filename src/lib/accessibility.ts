/**
 * Accessibility utilities and helpers
 * Provides functions for WCAG compliance, reduced motion, and a11y features
 */

import { useEffect, useState } from 'react';

// Color contrast ratio calculation (WCAG AA standard requires 4.5:1 for normal text)
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Calculate relative luminance
    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

// Check if color combination meets WCAG standards
export const meetsWCAGStandard = (
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
};

// Hook to detect user's reduced motion preference
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};
// Hook to detect user's high contrast preference
export const useHighContrast = (): boolean => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersHighContrast;
};

// Generate accessible color alternatives
export const getAccessibleColor = (
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): string => {
  let currentRatio = getContrastRatio(foreground, background);
  
  if (currentRatio >= targetRatio) {
    return foreground;
  }
  
  // Try darkening or lightening the color
  const hex = foreground.replace('#', '');
  let r = parseInt(hex.substr(0, 2), 16);
  let g = parseInt(hex.substr(2, 2), 16);
  let b = parseInt(hex.substr(4, 2), 16);
  
  // Determine if we should darken or lighten based on background
  const shouldDarken = getContrastRatio('#000000', background) > getContrastRatio('#FFFFFF', background);
  
  let attempts = 0;
  const maxAttempts = 25; // Prevent infinite loops
  
  while (currentRatio < targetRatio && attempts < maxAttempts) {
    const adjustment = shouldDarken ? -10 : 10;
    r = Math.max(0, Math.min(255, r + adjustment));
    g = Math.max(0, Math.min(255, g + adjustment));
    b = Math.max(0, Math.min(255, b + adjustment));
    
    const adjustedColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    currentRatio = getContrastRatio(adjustedColor, background);
    attempts++;
    
    // If we've reached the limits, return the best we can do
    if ((shouldDarken && r === 0 && g === 0 && b === 0) || 
        (!shouldDarken && r === 255 && g === 255 && b === 255)) {
      return adjustedColor;
    }
    
    if (currentRatio >= targetRatio) {
      return adjustedColor;
    }
  }
  
  // If we can't achieve the target ratio, return black or white based on background
  return shouldDarken ? '#000000' : '#FFFFFF';
};

// ARIA label helpers
export const generateAriaLabel = (
  element: string,
  state?: string,
  description?: string
): string => {
  let label = element;
  if (state) label += `, ${state}`;
  if (description) label += `. ${description}`;
  return label;
};

// Screen reader only text utility
export const srOnlyStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  border: '0',
};

// Focus management utilities
export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  firstElement?.focus();
  
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Keyboard navigation helpers
export const handleKeyboardNavigation = (
  event: React.KeyboardEvent,
  onEnter?: () => void,
  onSpace?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) => {
  switch (event.key) {
    case 'Enter':
      onEnter?.();
      break;
    case ' ':
      event.preventDefault();
      onSpace?.();
      break;
    case 'Escape':
      onEscape?.();
      break;
    case 'ArrowUp':
      event.preventDefault();
      onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      onArrowDown?.();
      break;
    case 'ArrowLeft':
      onArrowLeft?.();
      break;
    case 'ArrowRight':
      onArrowRight?.();
      break;
  }
};

// Animation preferences
export const getAnimationPreferences = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return {
    duration: prefersReducedMotion ? 0 : undefined,
    transition: prefersReducedMotion ? 'none' : undefined,
    animate: !prefersReducedMotion,
  };
};

// Accessible color palette generator
export const generateAccessiblePalette = (baseColor: string, background: string = '#FFFFFF') => {
  return {
    primary: getAccessibleColor(baseColor, background, 4.5),
    primaryLight: getAccessibleColor(baseColor, background, 3.0),
    primaryDark: getAccessibleColor(baseColor, background, 7.0),
    onPrimary: getContrastRatio('#FFFFFF', baseColor) >= 4.5 ? '#FFFFFF' : '#000000',
  };
};