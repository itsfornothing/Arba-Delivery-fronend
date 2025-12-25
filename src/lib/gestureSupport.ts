/**
 * Gesture Support System for Mobile Interactions
 * Provides swipe, pinch, long-press, and other touch gesture recognition
 */

import { performanceMonitor } from './performanceMonitor';

// Gesture types
export type GestureType = 'swipe' | 'pinch' | 'longpress' | 'tap' | 'doubletap' | 'pan' | 'rotate';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

// Gesture configuration
export interface GestureConfig {
  swipe?: {
    threshold?: number; // Minimum distance in pixels
    velocity?: number; // Minimum velocity
    maxTime?: number; // Maximum time for swipe
  };
  pinch?: {
    threshold?: number; // Minimum scale change
    center?: boolean; // Track center point
  };
  longpress?: {
    duration?: number; // Minimum press duration in ms
    threshold?: number; // Maximum movement allowed
  };
  tap?: {
    maxTime?: number; // Maximum tap duration
    threshold?: number; // Maximum movement allowed
  };
  doubletap?: {
    maxTime?: number; // Maximum time between taps
    threshold?: number; // Maximum distance between taps
  };
  pan?: {
    threshold?: number; // Minimum movement to start pan
  };
  rotate?: {
    threshold?: number; // Minimum rotation in degrees
  };
}

// Gesture event data
export interface GestureEvent {
  type: GestureType;
  originalEvent: TouchEvent | MouseEvent;
  target: EventTarget | null;
  timestamp: number;
  
  // Position data
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  
  // Gesture-specific data
  direction?: SwipeDirection;
  distance?: number;
  velocity?: number;
  scale?: number;
  rotation?: number;
  duration?: number;
  
  // Multi-touch data
  touches?: Touch[];
  center?: { x: number; y: number };
}

// Touch point tracking
interface TouchPoint {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
}

// Gesture state
interface GestureState {
  isActive: boolean;
  type: GestureType | null;
  touches: Map<number, TouchPoint>;
  startTime: number;
  lastTapTime: number;
  lastTapPosition: { x: number; y: number } | null;
}

export class GestureRecognizer {
  private element: HTMLElement;
  private config: Required<GestureConfig>;
  private state: GestureState;
  private listeners: Map<GestureType, ((event: GestureEvent) => void)[]>;
  private rafId?: number;

  constructor(element: HTMLElement, config: GestureConfig = {}) {
    this.element = element;
    this.config = this.mergeConfig(config);
    this.state = this.createInitialState();
    this.listeners = new Map();
    
    this.bindEvents();
  }

  private mergeConfig(config: GestureConfig): Required<GestureConfig> {
    return {
      swipe: {
        threshold: 50,
        velocity: 0.3,
        maxTime: 1000,
        ...config.swipe,
      },
      pinch: {
        threshold: 0.1,
        center: true,
        ...config.pinch,
      },
      longpress: {
        duration: 500,
        threshold: 10,
        ...config.longpress,
      },
      tap: {
        maxTime: 300,
        threshold: 10,
        ...config.tap,
      },
      doubletap: {
        maxTime: 300,
        threshold: 30,
        ...config.doubletap,
      },
      pan: {
        threshold: 10,
        ...config.pan,
      },
      rotate: {
        threshold: 5,
        ...config.rotate,
      },
    };
  }

  private createInitialState(): GestureState {
    return {
      isActive: false,
      type: null,
      touches: new Map(),
      startTime: 0,
      lastTapTime: 0,
      lastTapPosition: null,
    };
  }

  private bindEvents(): void {
    // Touch events
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));

    // Mouse events for desktop testing
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Prevent default behaviors that might interfere
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleTouchStart(event: TouchEvent): void {
    const now = Date.now();
    this.state.startTime = now;
    this.state.isActive = true;

    // Track all touches
    Array.from(event.touches).forEach(touch => {
      this.state.touches.set(touch.identifier, {
        id: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: now,
      });
    });

    // Start performance monitoring
    performanceMonitor.recordInteraction({
      type: 'touch',
      startTime: now,
      successful: true,
    });

    // Detect gesture type based on number of touches
    if (event.touches.length === 1) {
      this.detectSingleTouchGestures(event);
    } else if (event.touches.length === 2) {
      this.detectMultiTouchGestures(event);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.state.isActive) return;

    // Update touch positions
    Array.from(event.touches).forEach(touch => {
      const touchPoint = this.state.touches.get(touch.identifier);
      if (touchPoint) {
        touchPoint.currentX = touch.clientX;
        touchPoint.currentY = touch.clientY;
      }
    });

    // Process gesture based on current type
    if (this.state.type === 'pan') {
      this.processPan(event);
    } else if (this.state.type === 'pinch') {
      this.processPinch(event);
    } else if (this.state.type === 'rotate') {
      this.processRotate(event);
    }

    // Check if movement exceeds long press threshold
    if (this.state.type === 'longpress') {
      const touch = Array.from(this.state.touches.values())[0];
      if (touch) {
        const distance = this.calculateDistance(
          touch.startX, touch.startY,
          touch.currentX, touch.currentY
        );
        if (distance > this.config.longpress.threshold) {
          this.cancelGesture();
        }
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.state.isActive) return;

    const now = Date.now();
    const duration = now - this.state.startTime;

    // Remove ended touches
    const remainingTouches = Array.from(event.touches).map(t => t.identifier);
    this.state.touches.forEach((_, id) => {
      if (!remainingTouches.includes(id)) {
        this.state.touches.delete(id);
      }
    });

    // Process gesture completion
    if (this.state.touches.size === 0) {
      this.completeGesture(event, duration);
      this.resetState();
    }
  }

  private handleTouchCancel(event: TouchEvent): void {
    this.cancelGesture();
    this.resetState();
  }

  // Mouse event handlers for desktop testing
  private handleMouseDown(event: MouseEvent): void {
    const touchEvent = this.createTouchEventFromMouse(event, 'touchstart');
    this.handleTouchStart(touchEvent);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.state.isActive) return;
    const touchEvent = this.createTouchEventFromMouse(event, 'touchmove');
    this.handleTouchMove(touchEvent);
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.state.isActive) return;
    const touchEvent = this.createTouchEventFromMouse(event, 'touchend');
    this.handleTouchEnd(touchEvent);
  }

  private handleMouseLeave(event: MouseEvent): void {
    this.cancelGesture();
    this.resetState();
  }

  private createTouchEventFromMouse(event: MouseEvent, type: string): TouchEvent {
    const touch = {
      identifier: 0,
      clientX: event.clientX,
      clientY: event.clientY,
      target: event.target,
    } as Touch;

    return {
      type,
      touches: type === 'touchend' ? [] : [touch],
      changedTouches: [touch],
      targetTouches: [touch],
      preventDefault: () => event.preventDefault(),
      target: event.target,
    } as TouchEvent;
  }

  private detectSingleTouchGestures(event: TouchEvent): void {
    const touch = event.touches[0];
    
    // Check for double tap
    if (this.state.lastTapTime && this.state.lastTapPosition) {
      const timeDiff = Date.now() - this.state.lastTapTime;
      const distance = this.calculateDistance(
        touch.clientX, touch.clientY,
        this.state.lastTapPosition.x, this.state.lastTapPosition.y
      );
      
      if (timeDiff < this.config.doubletap.maxTime && distance < this.config.doubletap.threshold) {
        this.state.type = 'doubletap';
        this.emitGestureEvent('doubletap', event);
        this.state.lastTapTime = 0;
        this.state.lastTapPosition = null;
        return;
      }
    }

    // Start long press detection
    this.state.type = 'longpress';
    setTimeout(() => {
      if (this.state.type === 'longpress' && this.state.isActive) {
        this.emitGestureEvent('longpress', event);
      }
    }, this.config.longpress.duration);
  }

  private detectMultiTouchGestures(event: TouchEvent): void {
    if (event.touches.length === 2) {
      this.state.type = 'pinch';
    }
  }

  private processPan(event: TouchEvent): void {
    const touch = Array.from(this.state.touches.values())[0];
    if (!touch) return;

    const deltaX = touch.currentX - touch.startX;
    const deltaY = touch.currentY - touch.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.config.pan.threshold) {
      this.emitGestureEvent('pan', event);
    }
  }

  private processPinch(event: TouchEvent): void {
    const touches = Array.from(this.state.touches.values());
    if (touches.length !== 2) return;

    const [touch1, touch2] = touches;
    
    // Calculate initial distance
    const initialDistance = this.calculateDistance(
      touch1.startX, touch1.startY,
      touch2.startX, touch2.startY
    );
    
    // Calculate current distance
    const currentDistance = this.calculateDistance(
      touch1.currentX, touch1.currentY,
      touch2.currentX, touch2.currentY
    );
    
    const scale = currentDistance / initialDistance;
    
    if (Math.abs(scale - 1) > this.config.pinch.threshold) {
      this.emitGestureEvent('pinch', event, { scale });
    }
  }

  private processRotate(event: TouchEvent): void {
    const touches = Array.from(this.state.touches.values());
    if (touches.length !== 2) return;

    const [touch1, touch2] = touches;
    
    // Calculate initial angle
    const initialAngle = Math.atan2(
      touch2.startY - touch1.startY,
      touch2.startX - touch1.startX
    );
    
    // Calculate current angle
    const currentAngle = Math.atan2(
      touch2.currentY - touch1.currentY,
      touch2.currentX - touch1.currentX
    );
    
    const rotation = (currentAngle - initialAngle) * (180 / Math.PI);
    
    if (Math.abs(rotation) > this.config.rotate.threshold) {
      this.emitGestureEvent('rotate', event, { rotation });
    }
  }

  private completeGesture(event: TouchEvent, duration: number): void {
    const touch = Array.from(this.state.touches.values())[0];
    if (!touch) return;

    const deltaX = touch.currentX - touch.startX;
    const deltaY = touch.currentY - touch.startY;
    const distance = this.calculateDistance(
      touch.startX, touch.startY,
      touch.currentX, touch.currentY
    );
    const velocity = distance / duration;

    // Determine gesture type if not already set
    if (!this.state.type || this.state.type === 'longpress') {
      if (distance > this.config.swipe.threshold && velocity > this.config.swipe.velocity) {
        this.state.type = 'swipe';
      } else if (duration < this.config.tap.maxTime && distance < this.config.tap.threshold) {
        this.state.type = 'tap';
      }
    }

    // Emit appropriate gesture event
    switch (this.state.type) {
      case 'swipe':
        const direction = this.getSwipeDirection(deltaX, deltaY);
        this.emitGestureEvent('swipe', event, { direction, distance, velocity });
        break;
        
      case 'tap':
        this.emitGestureEvent('tap', event);
        this.state.lastTapTime = Date.now();
        this.state.lastTapPosition = { x: touch.currentX, y: touch.currentY };
        break;
        
      default:
        // Gesture was already emitted during processing
        break;
    }
  }

  private getSwipeDirection(deltaX: number, deltaY: number): SwipeDirection {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private emitGestureEvent(type: GestureType, originalEvent: TouchEvent, extra: any = {}): void {
    const touch = Array.from(this.state.touches.values())[0];
    if (!touch) return;

    const gestureEvent: GestureEvent = {
      type,
      originalEvent,
      target: originalEvent.target,
      timestamp: Date.now(),
      startX: touch.startX,
      startY: touch.startY,
      currentX: touch.currentX,
      currentY: touch.currentY,
      deltaX: touch.currentX - touch.startX,
      deltaY: touch.currentY - touch.startY,
      duration: Date.now() - this.state.startTime,
      touches: Array.from(originalEvent.touches),
      ...extra,
    };

    // Calculate center for multi-touch gestures
    if (originalEvent.touches.length > 1) {
      const centerX = Array.from(originalEvent.touches).reduce((sum, t) => sum + t.clientX, 0) / originalEvent.touches.length;
      const centerY = Array.from(originalEvent.touches).reduce((sum, t) => sum + t.clientY, 0) / originalEvent.touches.length;
      gestureEvent.center = { x: centerX, y: centerY };
    }

    // Emit to listeners
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(listener => {
      try {
        listener(gestureEvent);
      } catch (error) {
        console.error('Gesture listener error:', error);
      }
    });
  }

  private cancelGesture(): void {
    this.state.type = null;
  }

  private resetState(): void {
    this.state.isActive = false;
    this.state.type = null;
    this.state.touches.clear();
    this.state.startTime = 0;
  }

  // Public API
  on(type: GestureType, listener: (event: GestureEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    const listeners = this.listeners.get(type)!;
    listeners.push(listener);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  off(type: GestureType, listener?: (event: GestureEvent) => void): void {
    if (!listener) {
      this.listeners.delete(type);
      return;
    }
    
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  destroy(): void {
    // Remove all event listeners
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Clear state and listeners
    this.resetState();
    this.listeners.clear();
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

// React hook for gesture recognition
export const useGestures = (
  ref: React.RefObject<HTMLElement>,
  config: GestureConfig = {}
) => {
  const [recognizer, setRecognizer] = React.useState<GestureRecognizer | null>(null);
  
  React.useEffect(() => {
    if (ref.current) {
      const gestureRecognizer = new GestureRecognizer(ref.current, config);
      setRecognizer(gestureRecognizer);
      
      return () => {
        gestureRecognizer.destroy();
      };
    }
  }, [ref, config]);
  
  const on = React.useCallback((type: GestureType, listener: (event: GestureEvent) => void) => {
    return recognizer?.on(type, listener) || (() => {});
  }, [recognizer]);
  
  const off = React.useCallback((type: GestureType, listener?: (event: GestureEvent) => void) => {
    recognizer?.off(type, listener);
  }, [recognizer]);
  
  return { on, off, recognizer };
};

// Higher-order component for adding gesture support
export function withGestures<P extends object>(
  Component: React.ComponentType<P>,
  config?: GestureConfig
) {
  const WrappedComponent = React.forwardRef<HTMLElement, P>((props, ref) => {
    const internalRef = React.useRef<HTMLElement>(null);
    const elementRef = (ref as React.RefObject<HTMLElement>) || internalRef;
    
    useGestures(elementRef, config);
    
    return React.createElement(Component, { ...props, ref: elementRef });
  });
  
  WrappedComponent.displayName = `withGestures(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// React import
import React from 'react';