/**
 * Bundle Size and Loading Performance Optimization
 * Provides utilities for code splitting, lazy loading, and performance optimization
 */

import React, { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { performanceMonitor } from './performanceMonitor';

// Lazy loading configuration
export interface LazyLoadConfig {
  fallback?: ReactNode;
  delay?: number;
  retryCount?: number;
  preload?: boolean;
  chunkName?: string;
}

// Resource loading priorities
export type LoadingPriority = 'high' | 'medium' | 'low' | 'idle';

// Bundle analysis data
export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  loadTime: number;
  cacheHitRate: number;
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  loadTime: number;
  isAsync: boolean;
  dependencies: string[];
}

export interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  isTreeShakeable: boolean;
  usageCount: number;
}

// Code splitting utilities
export class CodeSplitter {
  private static loadedChunks = new Set<string>();
  private static loadingChunks = new Map<string, Promise<any>>();
  private static preloadedChunks = new Set<string>();

  // Enhanced lazy loading with retry logic and performance monitoring
  static createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    config: LazyLoadConfig = {}
  ): ComponentType<any> {
    const {
      fallback = null,
      delay = 0,
      retryCount = 3,
      preload = false,
      chunkName = 'unknown',
    } = config;

    // Create retry wrapper
    const importWithRetry = async (): Promise<{ default: T }> => {
      const startTime = performance.now();
      
      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          performanceMonitor.startAnimationTracking(`chunk-load-${chunkName}`);
          
          const module = await importFn();
          
          const loadTime = performance.now() - startTime;
          performanceMonitor.endAnimationTracking(`chunk-load-${chunkName}`);
          
          // Record successful load
          this.loadedChunks.add(chunkName);
          console.log(`Chunk ${chunkName} loaded successfully in ${loadTime.toFixed(2)}ms`);
          
          return module;
        } catch (error) {
          console.warn(`Chunk load attempt ${attempt} failed for ${chunkName}:`, error);
          
          if (attempt === retryCount) {
            performanceMonitor.recordInteraction({
              type: 'click', // Generic interaction type for chunk loading
              startTime,
              successful: false,
            });
            throw error;
          }
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
      
      throw new Error(`Failed to load chunk ${chunkName} after ${retryCount} attempts`);
    };

    // Add delay if specified
    const delayedImport = delay > 0 
      ? () => new Promise<{ default: T }>(resolve => {
          setTimeout(() => resolve(importWithRetry()), delay);
        })
      : importWithRetry;

    const LazyComponent = lazy(delayedImport);

    // Preload if requested
    if (preload) {
      this.preloadChunk(chunkName, delayedImport);
    }

    // Return wrapped component with suspense
    const WrappedComponent = (props: any) => React.createElement(
      Suspense,
      { fallback },
      React.createElement(LazyComponent, props)
    );

    WrappedComponent.displayName = `Lazy(${chunkName})`;
    WrappedComponent.preload = () => this.preloadChunk(chunkName, delayedImport);
    
    return WrappedComponent;
  }

  // Preload chunks for better performance
  static async preloadChunk(chunkName: string, importFn: () => Promise<any>): Promise<void> {
    if (this.preloadedChunks.has(chunkName) || this.loadedChunks.has(chunkName)) {
      return;
    }

    if (this.loadingChunks.has(chunkName)) {
      return this.loadingChunks.get(chunkName);
    }

    const loadPromise = importFn().then(() => {
      this.preloadedChunks.add(chunkName);
      this.loadingChunks.delete(chunkName);
    }).catch(error => {
      console.warn(`Preload failed for chunk ${chunkName}:`, error);
      this.loadingChunks.delete(chunkName);
    });

    this.loadingChunks.set(chunkName, loadPromise);
    return loadPromise;
  }

  // Preload multiple chunks based on priority
  static preloadChunks(chunks: Array<{ name: string; importFn: () => Promise<any>; priority: LoadingPriority }>): void {
    // Sort by priority
    const sortedChunks = chunks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, idle: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    sortedChunks.forEach(({ name, importFn, priority }) => {
      if (priority === 'idle') {
        // Use requestIdleCallback for low priority chunks
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => this.preloadChunk(name, importFn));
        } else {
          setTimeout(() => this.preloadChunk(name, importFn), 0);
        }
      } else {
        this.preloadChunk(name, importFn);
      }
    });
  }

  // Get loading statistics
  static getStats(): { loaded: number; preloaded: number; loading: number } {
    return {
      loaded: this.loadedChunks.size,
      preloaded: this.preloadedChunks.size,
      loading: this.loadingChunks.size,
    };
  }
}

// Resource loading optimization
export class ResourceLoader {
  private static cache = new Map<string, any>();
  private static loadingPromises = new Map<string, Promise<any>>();

  // Load resources with caching and priority
  static async loadResource<T>(
    key: string,
    loader: () => Promise<T>,
    priority: LoadingPriority = 'medium',
    ttl?: number
  ): Promise<T> {
    // Check cache first
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (!ttl || Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
    }

    // Check if already loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // Start loading
    const loadPromise = this.executeLoad(key, loader, priority);
    this.loadingPromises.set(key, loadPromise);

    try {
      const result = await loadPromise;
      
      // Cache result
      this.cache.set(key, {
        data: result,
        timestamp: Date.now(),
      });
      
      return result;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  private static async executeLoad<T>(
    key: string,
    loader: () => Promise<T>,
    priority: LoadingPriority
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      performanceMonitor.startAnimationTracking(`resource-load-${key}`);
      
      let result: T;
      
      if (priority === 'idle') {
        // Use scheduler for idle priority
        result = await new Promise<T>((resolve, reject) => {
          const executeLoad = () => {
            loader().then(resolve).catch(reject);
          };
          
          if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
            (window as any).scheduler.postTask(executeLoad, { priority: 'background' });
          } else if ('requestIdleCallback' in window) {
            requestIdleCallback(executeLoad);
          } else {
            setTimeout(executeLoad, 0);
          }
        });
      } else {
        result = await loader();
      }
      
      const loadTime = performance.now() - startTime;
      performanceMonitor.endAnimationTracking(`resource-load-${key}`);
      
      console.log(`Resource ${key} loaded in ${loadTime.toFixed(2)}ms`);
      return result;
      
    } catch (error) {
      performanceMonitor.recordInteraction({
        type: 'click',
        startTime,
        successful: false,
      });
      throw error;
    }
  }

  // Preload resources
  static preloadResource<T>(
    key: string,
    loader: () => Promise<T>,
    priority: LoadingPriority = 'low'
  ): void {
    if (!this.cache.has(key) && !this.loadingPromises.has(key)) {
      this.loadResource(key, loader, priority).catch(error => {
        console.warn(`Preload failed for resource ${key}:`, error);
      });
    }
  }

  // Clear cache
  static clearCache(pattern?: RegExp): void {
    if (pattern) {
      Array.from(this.cache.keys()).forEach(key => {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  // Get cache statistics
  static getCacheStats(): { size: number; hitRate: number } {
    // This would need to be implemented with actual hit/miss tracking
    return {
      size: this.cache.size,
      hitRate: 0.85, // Placeholder
    };
  }
}

// Image optimization utilities
export class ImageOptimizer {
  private static observer?: IntersectionObserver;
  private static loadedImages = new Set<string>();

  // Lazy load images with intersection observer
  static setupLazyLoading(): void {
    if (this.observer || typeof window === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      }
    );
  }

  private static loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (!src || this.loadedImages.has(src)) return;

    const startTime = performance.now();
    performanceMonitor.startAnimationTracking(`image-load-${src}`);

    img.onload = () => {
      const loadTime = performance.now() - startTime;
      performanceMonitor.endAnimationTracking(`image-load-${src}`);
      
      img.classList.add('loaded');
      this.loadedImages.add(src);
      
      console.log(`Image loaded in ${loadTime.toFixed(2)}ms:`, src);
    };

    img.onerror = () => {
      performanceMonitor.recordInteraction({
        type: 'click',
        startTime,
        successful: false,
      });
      
      img.classList.add('error');
      console.error('Failed to load image:', src);
    };

    img.src = src;
  }

  // Register image for lazy loading
  static registerImage(img: HTMLImageElement): void {
    if (!this.observer) {
      this.setupLazyLoading();
    }
    
    this.observer?.observe(img);
  }

  // Preload critical images
  static preloadImages(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(url => new Promise<void>((resolve, reject) => {
        if (this.loadedImages.has(url)) {
          resolve();
          return;
        }

        const img = new Image();
        img.onload = () => {
          this.loadedImages.add(url);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      }))
    );
  }
}

// Bundle analysis utilities
export class BundleAnalyzer {
  // Analyze current bundle performance
  static async analyzeBundlePerformance(): Promise<BundleAnalysis> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // Analyze JavaScript chunks
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const chunks: ChunkInfo[] = jsResources.map(resource => ({
      name: this.extractChunkName(resource.name),
      size: resource.transferSize || 0,
      gzippedSize: resource.encodedBodySize || 0,
      loadTime: resource.responseEnd - resource.requestStart,
      isAsync: resource.name.includes('chunk'),
      dependencies: [], // Would need build-time analysis
    }));

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);
    const loadTime = navigation.loadEventEnd - navigation.navigationStart;

    return {
      totalSize,
      gzippedSize,
      chunks,
      dependencies: [], // Would need build-time analysis
      loadTime,
      cacheHitRate: ResourceLoader.getCacheStats().hitRate,
    };
  }

  private static extractChunkName(url: string): string {
    const match = url.match(/\/([^\/]+)\.js$/);
    return match ? match[1] : 'unknown';
  }

  // Get performance recommendations
  static getOptimizationRecommendations(analysis: BundleAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.totalSize > 1024 * 1024) { // 1MB
      recommendations.push('Bundle size is large. Consider code splitting.');
    }

    if (analysis.loadTime > 3000) { // 3 seconds
      recommendations.push('Load time is slow. Consider preloading critical resources.');
    }

    if (analysis.cacheHitRate < 0.8) {
      recommendations.push('Cache hit rate is low. Optimize caching strategy.');
    }

    const largeChunks = analysis.chunks.filter(chunk => chunk.size > 256 * 1024); // 256KB
    if (largeChunks.length > 0) {
      recommendations.push(`Large chunks detected: ${largeChunks.map(c => c.name).join(', ')}`);
    }

    return recommendations;
  }
}

// React hooks for optimization
export const useLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config?: LazyLoadConfig
) => {
  return React.useMemo(
    () => CodeSplitter.createLazyComponent(importFn, config),
    [importFn, config]
  );
};

export const useResourceLoader = <T>(
  key: string,
  loader: () => Promise<T>,
  priority: LoadingPriority = 'medium'
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);

    ResourceLoader.loadResource(key, loader, priority)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [key, loader, priority]);

  return { data, loading, error };
};

export const useImageLazyLoading = (ref: React.RefObject<HTMLImageElement>) => {
  React.useEffect(() => {
    if (ref.current) {
      ImageOptimizer.registerImage(ref.current);
    }
  }, [ref]);
};

// Initialize optimizations
export const initializeOptimizations = () => {
  // Setup lazy loading
  ImageOptimizer.setupLazyLoading();
  
  // Start performance monitoring
  performanceMonitor.startMonitoring();
  
  console.log('Bundle optimizations initialized');
};

