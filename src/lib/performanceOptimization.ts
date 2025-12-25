/**
 * Performance Optimization Utilities
 * 
 * This module provides utilities for monitoring and optimizing the performance
 * of the enhanced UI system, ensuring that visual improvements don't impact
 * application speed or bundle size.
 */

// Bundle size thresholds (in KB)
export const BUNDLE_SIZE_THRESHOLDS = {
  // Main bundle should not exceed 250KB gzipped
  MAIN_BUNDLE_MAX: 250 * 1024,
  // Vendor bundle should not exceed 500KB gzipped
  VENDOR_BUNDLE_MAX: 500 * 1024,
  // UI components bundle should not exceed 100KB gzipped
  UI_COMPONENTS_MAX: 100 * 1024,
  // CSS bundle should not exceed 50KB gzipped
  CSS_BUNDLE_MAX: 50 * 1024,
} as const;

// Performance timing thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  // First Contentful Paint should be under 1.5s
  FCP_MAX: 1500,
  // Largest Contentful Paint should be under 2.5s
  LCP_MAX: 2500,
  // First Input Delay should be under 100ms
  FID_MAX: 100,
  // Cumulative Layout Shift should be under 0.1
  CLS_MAX: 0.1,
  // Time to Interactive should be under 3.5s
  TTI_MAX: 3500,
} as const;

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  tti?: number; // Time to Interactive
  
  // Bundle metrics
  bundleSize?: {
    main: number;
    vendor: number;
    css: number;
    total: number;
  };
  
  // Runtime metrics
  componentRenderTime?: number;
  interactionTime?: number;
  memoryUsage?: number;
  
  // Timestamp
  timestamp: number;
}

/**
 * Performance monitor class for tracking metrics
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observer?: PerformanceObserver;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObserver();
    }
  }

  /**
   * Initialize performance observer for Web Vitals
   */
  private initializeObserver(): void {
    try {
      // Observe Core Web Vitals
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry);
        }
      });

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.warn('Performance Observer not supported:', error);
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(entry: PerformanceEntry): void {
    const metric: Partial<PerformanceMetrics> = {
      timestamp: Date.now(),
    };

    switch (entry.entryType) {
      case 'paint':
        if (entry.name === 'first-contentful-paint') {
          metric.fcp = entry.startTime;
        }
        break;
      case 'largest-contentful-paint':
        metric.lcp = entry.startTime;
        break;
      case 'first-input':
        metric.fid = (entry as any).processingStart - entry.startTime;
        break;
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          metric.cls = (entry as any).value;
        }
        break;
    }

    this.metrics.push(metric as PerformanceMetrics);
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get latest metrics summary
   */
  public getLatestMetrics(): PerformanceMetrics | null {
    if (this.metrics.length === 0) return null;
    
    // Combine latest metrics of each type
    const latest: Partial<PerformanceMetrics> = {
      timestamp: Date.now(),
    };

    // Get the most recent value for each metric type
    for (let i = this.metrics.length - 1; i >= 0; i--) {
      const metric = this.metrics[i];
      if (metric.fcp && !latest.fcp) latest.fcp = metric.fcp;
      if (metric.lcp && !latest.lcp) latest.lcp = metric.lcp;
      if (metric.fid && !latest.fid) latest.fid = metric.fid;
      if (metric.cls && !latest.cls) latest.cls = metric.cls;
      if (metric.tti && !latest.tti) latest.tti = metric.tti;
    }

    return latest as PerformanceMetrics;
  }

  /**
   * Check if performance meets thresholds
   */
  public validatePerformance(): {
    passed: boolean;
    failures: string[];
    metrics: PerformanceMetrics | null;
  } {
    const latest = this.getLatestMetrics();
    const failures: string[] = [];

    if (!latest) {
      return {
        passed: false,
        failures: ['No performance metrics available'],
        metrics: null,
      };
    }

    // Check Core Web Vitals thresholds
    if (latest.fcp && latest.fcp > PERFORMANCE_THRESHOLDS.FCP_MAX) {
      failures.push(`FCP (${latest.fcp}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.FCP_MAX}ms)`);
    }

    if (latest.lcp && latest.lcp > PERFORMANCE_THRESHOLDS.LCP_MAX) {
      failures.push(`LCP (${latest.lcp}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.LCP_MAX}ms)`);
    }

    if (latest.fid && latest.fid > PERFORMANCE_THRESHOLDS.FID_MAX) {
      failures.push(`FID (${latest.fid}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.FID_MAX}ms)`);
    }

    if (latest.cls && latest.cls > PERFORMANCE_THRESHOLDS.CLS_MAX) {
      failures.push(`CLS (${latest.cls}) exceeds threshold (${PERFORMANCE_THRESHOLDS.CLS_MAX})`);
    }

    if (latest.tti && latest.tti > PERFORMANCE_THRESHOLDS.TTI_MAX) {
      failures.push(`TTI (${latest.tti}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.TTI_MAX}ms)`);
    }

    return {
      passed: failures.length === 0,
      failures,
      metrics: latest,
    };
  }

  /**
   * Measure component render time
   */
  public measureComponentRender<T>(
    componentName: string,
    renderFn: () => T
  ): T {
    const startTime = performance.now();
    const result = renderFn();
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    
    // Record the measurement
    this.metrics.push({
      componentRenderTime: renderTime,
      timestamp: Date.now(),
    });

    // Warn if render time is excessive (>16ms for 60fps)
    if (renderTime > 16) {
      console.warn(`Component ${componentName} render time (${renderTime.toFixed(2)}ms) may impact 60fps target`);
    }

    return result;
  }

  /**
   * Measure interaction time
   */
  public measureInteraction<T>(
    interactionName: string,
    interactionFn: () => T
  ): T {
    const startTime = performance.now();
    const result = interactionFn();
    const endTime = performance.now();
    
    const interactionTime = endTime - startTime;
    
    // Record the measurement
    this.metrics.push({
      interactionTime,
      timestamp: Date.now(),
    });

    // Warn if interaction time is excessive (>100ms for good UX)
    if (interactionTime > 100) {
      console.warn(`Interaction ${interactionName} time (${interactionTime.toFixed(2)}ms) may impact user experience`);
    }

    return result;
  }

  /**
   * Clean up observer
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Bundle size analyzer utilities
 */
export class BundleSizeAnalyzer {
  /**
   * Validate bundle sizes against thresholds
   */
  public static validateBundleSize(bundleStats: {
    main: number;
    vendor: number;
    css: number;
    total: number;
  }): {
    passed: boolean;
    failures: string[];
    stats: typeof bundleStats;
  } {
    const failures: string[] = [];

    if (bundleStats.main > BUNDLE_SIZE_THRESHOLDS.MAIN_BUNDLE_MAX) {
      failures.push(
        `Main bundle (${(bundleStats.main / 1024).toFixed(1)}KB) exceeds threshold (${(BUNDLE_SIZE_THRESHOLDS.MAIN_BUNDLE_MAX / 1024).toFixed(1)}KB)`
      );
    }

    if (bundleStats.vendor > BUNDLE_SIZE_THRESHOLDS.VENDOR_BUNDLE_MAX) {
      failures.push(
        `Vendor bundle (${(bundleStats.vendor / 1024).toFixed(1)}KB) exceeds threshold (${(BUNDLE_SIZE_THRESHOLDS.VENDOR_BUNDLE_MAX / 1024).toFixed(1)}KB)`
      );
    }

    if (bundleStats.css > BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX) {
      failures.push(
        `CSS bundle (${(bundleStats.css / 1024).toFixed(1)}KB) exceeds threshold (${(BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX / 1024).toFixed(1)}KB)`
      );
    }

    return {
      passed: failures.length === 0,
      failures,
      stats: bundleStats,
    };
  }

  /**
   * Get recommendations for bundle optimization
   */
  public static getBundleOptimizationRecommendations(bundleStats: {
    main: number;
    vendor: number;
    css: number;
    total: number;
  }): string[] {
    const recommendations: string[] = [];

    if (bundleStats.main > BUNDLE_SIZE_THRESHOLDS.MAIN_BUNDLE_MAX * 0.8) {
      recommendations.push('Consider code splitting for main bundle');
      recommendations.push('Review and remove unused imports');
      recommendations.push('Consider lazy loading for non-critical components');
    }

    if (bundleStats.vendor > BUNDLE_SIZE_THRESHOLDS.VENDOR_BUNDLE_MAX * 0.8) {
      recommendations.push('Review vendor dependencies for unused packages');
      recommendations.push('Consider using lighter alternatives for heavy dependencies');
      recommendations.push('Enable tree shaking for vendor packages');
    }

    if (bundleStats.css > BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX * 0.8) {
      recommendations.push('Review Tailwind CSS purging configuration');
      recommendations.push('Remove unused CSS classes and styles');
      recommendations.push('Consider CSS-in-JS for component-specific styles');
    }

    return recommendations;
  }
}

/**
 * CSS optimization utilities
 */
export class CSSOptimizer {
  /**
   * Validate Tailwind CSS purging effectiveness
   */
  public static validateCSSPurging(
    originalSize: number,
    purgedSize: number
  ): {
    passed: boolean;
    reductionPercentage: number;
    message: string;
  } {
    const reductionPercentage = ((originalSize - purgedSize) / originalSize) * 100;
    const passed = reductionPercentage >= 70; // Expect at least 70% reduction

    return {
      passed,
      reductionPercentage,
      message: passed
        ? `CSS purging effective: ${reductionPercentage.toFixed(1)}% reduction`
        : `CSS purging ineffective: only ${reductionPercentage.toFixed(1)}% reduction (expected ≥70%)`,
    };
  }

  /**
   * Get CSS optimization recommendations
   */
  public static getCSSOptimizationRecommendations(cssSize: number): string[] {
    const recommendations: string[] = [];

    if (cssSize > BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX) {
      recommendations.push('Enable Tailwind CSS purging in production');
      recommendations.push('Review content paths in Tailwind configuration');
      recommendations.push('Remove unused custom CSS classes');
      recommendations.push('Consider critical CSS extraction');
      recommendations.push('Use CSS minification in production builds');
    }

    return recommendations;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy();
  });
}