import { cacheService } from './cache.service';

export interface PerformanceMetrics {
  timestamp: Date;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  activeConnections: number;
  slowQueries: number;
  errorRate: number;
}

export interface QueryPerformance {
  query: string;
  averageTime: number;
  maxTime: number;
  minTime: number;
  callCount: number;
  lastCalled: Date;
}

export class PerformanceMonitorService {
  private metrics: PerformanceMetrics[] = [];
  private queryPerformance: Map<string, QueryPerformance> = new Map();
  private maxMetricsHistory = 1000;

  /**
   * Record a performance metric
   */
  recordMetric(metric: Partial<PerformanceMetrics>): void {
    const fullMetric: PerformanceMetrics = {
      timestamp: new Date(),
      responseTime: metric.responseTime || 0,
      memoryUsage: metric.memoryUsage || 0,
      cpuUsage: metric.cpuUsage || 0,
      cacheHitRate: metric.cacheHitRate || 0,
      activeConnections: metric.activeConnections || 0,
      slowQueries: metric.slowQueries || 0,
      errorRate: metric.errorRate || 0,
      ...metric,
    };

    this.metrics.push(fullMetric);

    // Keep only the last N metrics to prevent memory issues
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * Record query performance
   */
  recordQuery(query: string, executionTime: number): void {
    const existing = this.queryPerformance.get(query);
    
    if (existing) {
      const newCallCount = existing.callCount + 1;
      const newAverageTime = (existing.averageTime * existing.callCount + executionTime) / newCallCount;
      
      this.queryPerformance.set(query, {
        query,
        averageTime: newAverageTime,
        maxTime: Math.max(existing.maxTime, executionTime),
        minTime: Math.min(existing.minTime, executionTime),
        callCount: newCallCount,
        lastCalled: new Date(),
      });
    } else {
      this.queryPerformance.set(query, {
        query,
        averageTime: executionTime,
        maxTime: executionTime,
        minTime: executionTime,
        callCount: 1,
        lastCalled: new Date(),
      });
    }
  }

  /**
   * Get current performance metrics
   */
  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    try {
      const cacheStats = await cacheService.getStats();
      
      return {
        timestamp: new Date(),
        responseTime: this.getAverageResponseTime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
        cacheHitRate: cacheStats.hitRate,
        activeConnections: 0, // This would need to be tracked separately
        slowQueries: this.getSlowQueriesCount(),
        errorRate: this.getErrorRate(),
      };
    } catch (error) {
      console.error('Error getting current metrics:', error);
      // Return default metrics on error
      return {
        timestamp: new Date(),
        responseTime: 0,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        cpuUsage: process.cpuUsage().user / 1000000,
        cacheHitRate: 0,
        activeConnections: 0,
        slowQueries: 0,
        errorRate: 0,
      };
    }
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(hours: number = 24): PerformanceMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Get slow queries
   */
  getSlowQueries(threshold: number = 1000): QueryPerformance[] {
    return Array.from(this.queryPerformance.values())
      .filter(query => query.averageTime > threshold)
      .sort((a, b) => b.averageTime - a.averageTime);
  }

  /**
   * Get query performance summary
   */
  getQueryPerformanceSummary(): {
    totalQueries: number;
    averageTime: number;
    slowQueries: number;
    topSlowQueries: QueryPerformance[];
  } {
    const queries = Array.from(this.queryPerformance.values());
    const totalQueries = queries.reduce((sum, q) => sum + q.callCount, 0);
    const averageTime = queries.length > 0 
      ? queries.reduce((sum, q) => sum + q.averageTime, 0) / queries.length 
      : 0;
    const slowQueries = queries.filter(q => q.averageTime > 1000).length;
    const topSlowQueries = queries
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      totalQueries,
      averageTime: Math.round(averageTime * 100) / 100,
      slowQueries,
      topSlowQueries,
    };
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts(): Array<{
    type: 'warning' | 'error' | 'critical';
    message: string;
    value: number;
    threshold: number;
  }> {
    const alerts: Array<{
      type: 'warning' | 'error' | 'critical';
      message: string;
      value: number;
      threshold: number;
    }> = [];
    const currentMetrics = this.metrics[this.metrics.length - 1];
    
    if (!currentMetrics) return alerts;

    // Response time alerts
    if (currentMetrics.responseTime > 5000) {
      alerts.push({
        type: 'critical',
        message: 'Response time is critically high',
        value: currentMetrics.responseTime,
        threshold: 5000,
      });
    } else if (currentMetrics.responseTime > 2000) {
      alerts.push({
        type: 'warning',
        message: 'Response time is high',
        value: currentMetrics.responseTime,
        threshold: 2000,
      });
    }

    // Memory usage alerts
    if (currentMetrics.memoryUsage > 500) {
      alerts.push({
        type: 'critical',
        message: 'Memory usage is critically high',
        value: currentMetrics.memoryUsage,
        threshold: 500,
      });
    } else if (currentMetrics.memoryUsage > 200) {
      alerts.push({
        type: 'warning',
        message: 'Memory usage is high',
        value: currentMetrics.memoryUsage,
        threshold: 200,
      });
    }

    // Cache hit rate alerts
    if (currentMetrics.cacheHitRate < 50) {
      alerts.push({
        type: 'warning',
        message: 'Cache hit rate is low',
        value: currentMetrics.cacheHitRate,
        threshold: 50,
      });
    }

    // Error rate alerts
    if (currentMetrics.errorRate > 10) {
      alerts.push({
        type: 'critical',
        message: 'Error rate is critically high',
        value: currentMetrics.errorRate,
        threshold: 10,
      });
    } else if (currentMetrics.errorRate > 5) {
      alerts.push({
        type: 'warning',
        message: 'Error rate is high',
        value: currentMetrics.errorRate,
        threshold: 5,
      });
    }

    return alerts;
  }

  /**
   * Get performance recommendations
   */
  getPerformanceRecommendations(): Array<{
    category: string;
    recommendation: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  }> {
    const recommendations: Array<{
      category: string;
      recommendation: string;
      impact: 'low' | 'medium' | 'high';
      effort: 'low' | 'medium' | 'high';
    }> = [];
    const currentMetrics = this.metrics[this.metrics.length - 1];
    
    if (!currentMetrics) return recommendations;

    // Response time recommendations
    if (currentMetrics.responseTime > 2000) {
      recommendations.push({
        category: 'Database',
        recommendation: 'Add database indexes for frequently queried fields',
        impact: 'high',
        effort: 'medium',
      });
      
      recommendations.push({
        category: 'Caching',
        recommendation: 'Implement Redis caching for frequently accessed data',
        impact: 'high',
        effort: 'medium',
      });
    }

    // Memory usage recommendations
    if (currentMetrics.memoryUsage > 200) {
      recommendations.push({
        category: 'Memory',
        recommendation: 'Implement pagination for large data sets',
        impact: 'medium',
        effort: 'low',
      });
      
      recommendations.push({
        category: 'Memory',
        recommendation: 'Optimize data fetching to reduce memory usage',
        impact: 'medium',
        effort: 'medium',
      });
    }

    // Cache recommendations
    if (currentMetrics.cacheHitRate < 70) {
      recommendations.push({
        category: 'Caching',
        recommendation: 'Increase cache TTL for stable data',
        impact: 'medium',
        effort: 'low',
      });
      
      recommendations.push({
        category: 'Caching',
        recommendation: 'Implement cache warming strategies',
        impact: 'medium',
        effort: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Clear performance data
   */
  clearMetrics(): void {
    this.metrics = [];
    this.queryPerformance.clear();
  }

  // Private helper methods
  private getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const recentMetrics = this.metrics.slice(-10); // Last 10 metrics
    const totalTime = recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0);
    return Math.round((totalTime / recentMetrics.length) * 100) / 100;
  }

  private getSlowQueriesCount(): number {
    return Array.from(this.queryPerformance.values())
      .filter(query => query.averageTime > 1000).length;
  }

  private getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const recentMetrics = this.metrics.slice(-10);
    const totalErrors = recentMetrics.reduce((sum, metric) => sum + metric.errorRate, 0);
    return Math.round((totalErrors / recentMetrics.length) * 100) / 100;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitorService();
