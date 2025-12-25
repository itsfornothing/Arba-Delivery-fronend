/**
 * Performance Monitoring System for Animations and Interactions
 * Tracks frame rates, animation performance, and user interaction metrics
 */

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  animationDuration: number;
  interactionLatency: number;
  memoryUsage?: number;
  timestamp: number;
}

interface AnimationPerformanceData {
  animationId: string;
  startTime: number;
  endTime?: number;
  frameCount: number;
  droppedFrames: number;
  averageFps: number;
  peakMemory?: number;
}

interface InteractionMetrics {
  type: 'click' | 'hover' | 'scroll' | 'touch' | 'gesture';
  startTime: number;
  responseTime: number;
  element?: string;
  successful: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private animationData: Map<string, AnimationPerformanceData> = new Map();
  private interactionMetrics: InteractionMetrics[] = [];
  private frameCount = 0;
  private lastFrameTime = 0;
  private isMonitoring = false;
  private rafId?: number;
  private observers: ((metrics: PerformanceMetrics) => void)[] = [];

  constructor() {
    this.bindMethods();
    this.setupPerformanceObserver();
  }

  private bindMethods() {
    this.measureFrame = this.measureFrame.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  private setupPerformanceObserver() {
    // Monitor long tasks that could affect animation performance
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'longtask') {
              console.warn('Long task detected:', entry.duration, 'ms');
              this.recordInteraction({
                type: 'scroll', // Generic type for long tasks
                startTime: entry.startTime,
                responseTime: entry.duration,
                successful: false,
              });
            }
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('PerformanceObserver not fully supported:', error);
      }
    }

    // Monitor visibility changes to pause/resume monitoring
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange() {
    if (typeof document !== 'undefined' && document.hidden) {
      this.stopMonitoring();
    } else if (this.isMonitoring) {
      this.startMonitoring();
    }
  }

  private measureFrame(timestamp: number) {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = timestamp;
      this.rafId = requestAnimationFrame(this.measureFrame);
      return;
    }

    const frameTime = timestamp - this.lastFrameTime;
    const fps = 1000 / frameTime;
    
    this.frameCount++;
    this.lastFrameTime = timestamp;

    // Record metrics every 60 frames (approximately 1 second at 60fps)
    if (this.frameCount % 60 === 0) {
      const metrics: PerformanceMetrics = {
        fps: Math.round(fps),
        frameTime: Math.round(frameTime * 100) / 100,
        animationDuration: 0, // Will be updated by specific animations
        interactionLatency: this.getAverageInteractionLatency(),
        memoryUsage: this.getMemoryUsage(),
        timestamp: Date.now(),
      };

      this.metrics.push(metrics);
      this.notifyObservers(metrics);

      // Keep only last 300 metrics (approximately 5 minutes)
      if (this.metrics.length > 300) {
        this.metrics = this.metrics.slice(-300);
      }
    }

    if (this.isMonitoring) {
      this.rafId = requestAnimationFrame(this.measureFrame);
    }
  }

  private getMemoryUsage(): number | undefined {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100; // MB
    }
    return undefined;
  }

  private getAverageInteractionLatency(): number {
    if (this.interactionMetrics.length === 0) return 0;
    
    const recentMetrics = this.interactionMetrics.slice(-10); // Last 10 interactions
    const totalLatency = recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return Math.round(totalLatency / recentMetrics.length * 100) / 100;
  }

  private notifyObservers(metrics: PerformanceMetrics) {
    this.observers.forEach(observer => {
      try {
        observer(metrics);
      } catch (error) {
        console.error('Performance observer error:', error);
      }
    });
  }

  // Public API
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.rafId = requestAnimationFrame(this.measureFrame);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }

  startAnimationTracking(animationId: string): void {
    const data: AnimationPerformanceData = {
      animationId,
      startTime: typeof window !== 'undefined' ? performance.now() : Date.now(),
      frameCount: 0,
      droppedFrames: 0,
      averageFps: 0,
    };
    
    this.animationData.set(animationId, data);
  }

  endAnimationTracking(animationId: string): AnimationPerformanceData | null {
    const data = this.animationData.get(animationId);
    if (!data) return null;

    data.endTime = performance.now();
    const duration = data.endTime - data.startTime;
    data.averageFps = Math.round((data.frameCount / duration) * 1000);

    this.animationData.delete(animationId);
    return data;
  }

  recordInteraction(interaction: Omit<InteractionMetrics, 'responseTime'> & { responseTime?: number }): void {
    const completeInteraction: InteractionMetrics = {
      ...interaction,
      responseTime: interaction.responseTime || 0,
    };
    
    this.interactionMetrics.push(completeInteraction);
    
    // Keep only last 100 interactions
    if (this.interactionMetrics.length > 100) {
      this.interactionMetrics = this.interactionMetrics.slice(-100);
    }
  }

  measureInteractionLatency<T>(
    interactionType: InteractionMetrics['type'],
    operation: () => Promise<T> | T,
    element?: string
  ): Promise<T> {
    const startTime = performance.now();
    
    const handleResult = (result: T, successful: boolean) => {
      const responseTime = performance.now() - startTime;
      this.recordInteraction({
        type: interactionType,
        startTime,
        responseTime,
        element,
        successful,
      });
      return result;
    };

    try {
      const result = operation();
      
      if (result instanceof Promise) {
        return result
          .then(res => handleResult(res, true))
          .catch(error => {
            handleResult(error, false);
            throw error;
          });
      } else {
        return Promise.resolve(handleResult(result, true));
      }
    } catch (error) {
      handleResult(error, false);
      throw error;
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAnimationMetrics(): AnimationPerformanceData[] {
    return Array.from(this.animationData.values());
  }

  getInteractionMetrics(): InteractionMetrics[] {
    return [...this.interactionMetrics];
  }

  getAverageMetrics(timeWindow?: number): Partial<PerformanceMetrics> {
    let metricsToAnalyze = this.metrics;
    
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      metricsToAnalyze = this.metrics.filter(m => m.timestamp > cutoff);
    }

    if (metricsToAnalyze.length === 0) {
      return {};
    }

    const totals = metricsToAnalyze.reduce(
      (acc, metric) => ({
        fps: acc.fps + metric.fps,
        frameTime: acc.frameTime + metric.frameTime,
        interactionLatency: acc.interactionLatency + metric.interactionLatency,
        memoryUsage: acc.memoryUsage + (metric.memoryUsage || 0),
      }),
      { fps: 0, frameTime: 0, interactionLatency: 0, memoryUsage: 0 }
    );

    const count = metricsToAnalyze.length;
    return {
      fps: Math.round(totals.fps / count),
      frameTime: Math.round((totals.frameTime / count) * 100) / 100,
      interactionLatency: Math.round((totals.interactionLatency / count) * 100) / 100,
      memoryUsage: Math.round((totals.memoryUsage / count) * 100) / 100,
    };
  }

  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.push(observer);
    
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  // Performance optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const avgMetrics = this.getAverageMetrics(30000); // Last 30 seconds

    if (avgMetrics.fps && avgMetrics.fps < 30) {
      suggestions.push('Low frame rate detected. Consider reducing animation complexity.');
    }

    if (avgMetrics.frameTime && avgMetrics.frameTime > 33) {
      suggestions.push('High frame time detected. Optimize rendering performance.');
    }

    if (avgMetrics.interactionLatency && avgMetrics.interactionLatency > 100) {
      suggestions.push('High interaction latency. Consider debouncing or optimizing event handlers.');
    }

    if (avgMetrics.memoryUsage && avgMetrics.memoryUsage > 100) {
      suggestions.push('High memory usage detected. Check for memory leaks in animations.');
    }

    return suggestions;
  }

  // Clean up resources
  destroy(): void {
    this.stopMonitoring();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.observers = [];
    this.metrics = [];
    this.animationData.clear();
    this.interactionMetrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for using performance monitoring
export const usePerformanceMonitoring = (autoStart = true) => {
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  const [metrics, setMetrics] = React.useState<PerformanceMetrics[]>([]);

  React.useEffect(() => {
    if (autoStart) {
      performanceMonitor.startMonitoring();
      setIsMonitoring(true);
    }

    const unsubscribe = performanceMonitor.subscribe((newMetrics) => {
      setMetrics(performanceMonitor.getMetrics());
    });

    return () => {
      unsubscribe();
      if (autoStart) {
        performanceMonitor.stopMonitoring();
        setIsMonitoring(false);
      }
    };
  }, [autoStart]);

  const startMonitoring = () => {
    performanceMonitor.startMonitoring();
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    performanceMonitor.stopMonitoring();
    setIsMonitoring(false);
  };

  return {
    isMonitoring,
    metrics,
    startMonitoring,
    stopMonitoring,
    getAverageMetrics: performanceMonitor.getAverageMetrics.bind(performanceMonitor),
    getOptimizationSuggestions: performanceMonitor.getOptimizationSuggestions.bind(performanceMonitor),
  };
};

// React import for the hook
import React from 'react';