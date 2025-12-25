/**
 * Advanced Page Transitions with Shared Elements
 * Provides smooth transitions between pages with shared element animations
 */

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { create } from 'zustand';
import { performanceMonitor } from './performanceMonitor';

// Transition types
export type TransitionType = 
  | 'fade' 
  | 'slide' 
  | 'scale' 
  | 'flip' 
  | 'shared-element'
  | 'custom';

export type TransitionDirection = 'up' | 'down' | 'left' | 'right';

// Shared element configuration
export interface SharedElementConfig {
  id: string;
  element: HTMLElement;
  bounds: DOMRect;
  styles: CSSStyleDeclaration;
}

// Transition configuration
export interface TransitionConfig {
  type: TransitionType;
  direction?: TransitionDirection;
  duration?: number;
  easing?: string;
  sharedElements?: string[];
  customVariants?: Variants;
}

// Page transition store
interface PageTransitionStore {
  isTransitioning: boolean;
  currentTransition: TransitionConfig | null;
  sharedElements: Map<string, SharedElementConfig>;
  transitionHistory: string[];
  setTransitioning: (transitioning: boolean) => void;
  setCurrentTransition: (transition: TransitionConfig | null) => void;
  registerSharedElement: (id: string, config: SharedElementConfig) => void;
  unregisterSharedElement: (id: string) => void;
  getSharedElement: (id: string) => SharedElementConfig | undefined;
  addToHistory: (route: string) => void;
  getLastRoute: () => string | undefined;
}

export const usePageTransitionStore = create<PageTransitionStore>((set, get) => ({
  isTransitioning: false,
  currentTransition: null,
  sharedElements: new Map(),
  transitionHistory: [],
  
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  
  setCurrentTransition: (transition) => set({ currentTransition: transition }),
  
  registerSharedElement: (id, config) => {
    const { sharedElements } = get();
    const newMap = new Map(sharedElements);
    newMap.set(id, config);
    set({ sharedElements: newMap });
  },
  
  unregisterSharedElement: (id) => {
    const { sharedElements } = get();
    const newMap = new Map(sharedElements);
    newMap.delete(id);
    set({ sharedElements: newMap });
  },
  
  getSharedElement: (id) => {
    return get().sharedElements.get(id);
  },
  
  addToHistory: (route) => {
    const { transitionHistory } = get();
    const newHistory = [...transitionHistory, route];
    // Keep only last 10 routes
    if (newHistory.length > 10) {
      newHistory.shift();
    }
    set({ transitionHistory: newHistory });
  },
  
  getLastRoute: () => {
    const { transitionHistory } = get();
    return transitionHistory[transitionHistory.length - 2];
  },
}));

// Predefined transition variants
export const transitionVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  
  slideUp: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
  },
  
  slideDown: {
    initial: { opacity: 0, y: -50 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 50 },
  },
  
  slideLeft: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  },
  
  slideRight: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  },
  
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  
  flip: {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    exit: { opacity: 0, rotateY: 90 },
  },
};

// Get transition variants based on configuration
export const getTransitionVariants = (config: TransitionConfig): Variants => {
  if (config.customVariants) {
    return config.customVariants;
  }
  
  const baseKey = config.type === 'slide' ? `slide${config.direction || 'Up'}` : config.type;
  return transitionVariants[baseKey] || transitionVariants.fade;
};

// Transition timing configuration
export const getTransitionTiming = (config: TransitionConfig) => ({
  duration: config.duration || 0.3,
  ease: config.easing || 'easeInOut',
});

// Shared element transition utilities
export class SharedElementTransition {
  private static instance: SharedElementTransition;
  private activeTransitions = new Map<string, Animation>();
  
  static getInstance(): SharedElementTransition {
    if (!SharedElementTransition.instance) {
      SharedElementTransition.instance = new SharedElementTransition();
    }
    return SharedElementTransition.instance;
  }
  
  async animateSharedElement(
    fromElement: HTMLElement,
    toElement: HTMLElement,
    duration = 300
  ): Promise<void> {
    const fromBounds = fromElement.getBoundingClientRect();
    const toBounds = toElement.getBoundingClientRect();
    
    // Calculate transform values
    const deltaX = fromBounds.left - toBounds.left;
    const deltaY = fromBounds.top - toBounds.top;
    const scaleX = fromBounds.width / toBounds.width;
    const scaleY = fromBounds.height / toBounds.height;
    
    // Create clone for animation
    const clone = fromElement.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.top = `${fromBounds.top}px`;
    clone.style.left = `${fromBounds.left}px`;
    clone.style.width = `${fromBounds.width}px`;
    clone.style.height = `${fromBounds.height}px`;
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    
    document.body.appendChild(clone);
    
    // Hide original elements
    fromElement.style.opacity = '0';
    toElement.style.opacity = '0';
    
    try {
      // Animate the clone
      const animation = clone.animate([
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
        },
        {
          transform: 'translate(0px, 0px) scale(1, 1)',
        },
      ], {
        duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards',
      });
      
      await animation.finished;
      
    } finally {
      // Clean up
      document.body.removeChild(clone);
      fromElement.style.opacity = '';
      toElement.style.opacity = '';
    }
  }
  
  cancelAllTransitions(): void {
    this.activeTransitions.forEach(animation => animation.cancel());
    this.activeTransitions.clear();
  }
}

// Hook for managing page transitions
export const usePageTransition = () => {
  const router = useRouter();
  const store = usePageTransitionStore();
  
  const navigateWithTransition = async (
    href: string,
    config: TransitionConfig = { type: 'fade' }
  ) => {
    const transitionId = `transition-${Date.now()}`;
    
    try {
      // Start performance monitoring
      performanceMonitor.startAnimationTracking(transitionId);
      
      // Set transition state
      store.setTransitioning(true);
      store.setCurrentTransition(config);
      
      // Handle shared element transitions
      if (config.sharedElements && config.sharedElements.length > 0) {
        const sharedElementManager = SharedElementTransition.getInstance();
        
        // Animate shared elements
        for (const elementId of config.sharedElements) {
          const sharedElement = store.getSharedElement(elementId);
          if (sharedElement) {
            // Find target element in new page (this would need to be coordinated)
            // For now, we'll just track the transition
            console.log(`Animating shared element: ${elementId}`);
          }
        }
      }
      
      // Add current route to history
      store.addToHistory(window.location.pathname);
      
      // Navigate to new page
      router.push(href);
      
      // Wait for transition duration
      const timing = getTransitionTiming(config);
      await new Promise(resolve => setTimeout(resolve, timing.duration * 1000));
      
    } finally {
      // End performance monitoring
      const animationData = performanceMonitor.endAnimationTracking(transitionId);
      if (animationData) {
        console.log('Page transition performance:', animationData);
      }
      
      // Reset transition state
      store.setTransitioning(false);
      store.setCurrentTransition(null);
    }
  };
  
  return {
    navigateWithTransition,
    isTransitioning: store.isTransitioning,
    currentTransition: store.currentTransition,
  };
};

// Hook for registering shared elements
export const useSharedElement = (id: string, ref: React.RefObject<HTMLElement>) => {
  const store = usePageTransitionStore();
  
  React.useEffect(() => {
    if (ref.current) {
      const element = ref.current;
      const bounds = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      
      store.registerSharedElement(id, {
        id,
        element,
        bounds,
        styles,
      });
      
      return () => {
        store.unregisterSharedElement(id);
      };
    }
  }, [id, ref, store]);
  
  return {
    isSharedElement: true,
    sharedElementId: id,
  };
};

// Component for wrapping pages with transitions
interface PageTransitionWrapperProps {
  children: React.ReactNode;
  transitionKey: string;
  config?: TransitionConfig;
}

export const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({
  children,
  transitionKey,
  config = { type: 'fade' },
}) => {
  const variants = getTransitionVariants(config);
  const timing = getTransitionTiming(config);
  
  return React.createElement(
    AnimatePresence,
    { mode: 'wait' },
    React.createElement(
      motion.div,
      {
        key: transitionKey,
        initial: 'initial',
        animate: 'animate',
        exit: 'exit',
        variants,
        transition: timing,
        style: { width: '100%', height: '100%' }
      },
      children
    )
  );
};

// Higher-order component for adding transitions to pages
export function withPageTransition<P extends object>(
  Component: React.ComponentType<P>,
  config?: TransitionConfig
) {
  const WrappedComponent = (props: P) => {
    const transitionKey = typeof window !== 'undefined' ? window.location.pathname : 'ssr';
    
    return React.createElement(
      PageTransitionWrapper,
      { transitionKey, config },
      React.createElement(Component, props)
    );
  };
  
  WrappedComponent.displayName = `withPageTransition(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// React import
import React from 'react';