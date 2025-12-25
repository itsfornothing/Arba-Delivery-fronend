'use client';

import { useState, useEffect } from 'react';
import { defaultTheme } from './theme';

type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

const breakpointValues = {
  mobile: parseInt(defaultTheme.breakpoints.mobile),
  tablet: parseInt(defaultTheme.breakpoints.tablet),
  desktop: parseInt(defaultTheme.breakpoints.desktop),
  wide: parseInt(defaultTheme.breakpoints.wide),
};

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      if (width >= breakpointValues.wide) {
        setBreakpoint('wide');
      } else if (width >= breakpointValues.desktop) {
        setBreakpoint('desktop');
      } else if (width >= breakpointValues.tablet) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('mobile');
      }
    };

    // Set initial breakpoint
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isBreakpoint = (bp: Breakpoint) => {
    const currentValue = breakpointValues[breakpoint];
    const targetValue = breakpointValues[bp];
    return currentValue >= targetValue;
  };

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet' || isMobile;
  const isDesktop = breakpoint === 'desktop' || isTablet;
  const isWide = breakpoint === 'wide' || isDesktop;

  return {
    breakpoint,
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isBreakpoint,
  };
};