import { performance } from 'perf_hooks';

// Performance monitoring interfaces
export interface QueryMetrics {
  queryId: string;
  query: string;
  duration: number;
  timestamp: string;
  success: boolean;
  error?: string;
  table?: string;
  operation?: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER';
  rowsAffected?: number;
  executionPlan?: any;
  parameters?: any[];
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

export interface PerformanceStats {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  errorQueries: number;
  queriesByTable: Record<string, number>;
  queriesByOperation: Record<string, number>;
  topSlowQueries: QueryMetrics[];
  recentQueries: QueryMetrics[];
  performanceScore: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'slow_query' | 'error_rate' | 'connection_pool' | 'memory_usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  metrics: any;
}

// Performance monitoring class
class PerformanceMonitor {
  private queries: QueryMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private slowQueryThreshold: number = 1000; // 1 second
  private errorRateThreshold: number = 0.05; // 5%
  private maxQueriesToStore: number = 1000;
  public isEnabled: boolean = true;

  // Enable/disable monitoring
  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  // Record a query
  recordQuery(metrics: Omit<QueryMetrics, 'queryId' | 'timestamp'>): string {
    if (!this.isEnabled) return '';

    const queryId = this.generateQueryId();
    const timestamp = new Date().toISOString();
    
    const queryMetric: QueryMetrics = {
      ...metrics,
      queryId,
      timestamp
    };

    this.queries.push(queryMetric);

    // Keep only the latest queries
    if (this.queries.length > this.maxQueriesToStore) {
      this.queries = this.queries.slice(-this.maxQueriesToStore);
    }

    // Check for slow queries
    if (metrics.duration > this.slowQueryThreshold) {
      this.createAlert({
        type: 'slow_query',
        severity: metrics.duration > 5000 ? 'critical' : metrics.duration > 2000 ? 'high' : 'medium',
        message: `Slow query detected: ${metrics.query.substring(0, 100)}... (${metrics.duration}ms)`,
        metrics: queryMetric
      });
    }

    // Check for errors
    if (!metrics.success) {
      this.createAlert({
        type: 'error_rate',
        severity: 'high',
        message: `Query error: ${metrics.error}`,
        metrics: queryMetric
      });
    }

    return queryId;
  }

  // Get performance statistics
  getStats(): PerformanceStats {
    if (this.queries.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        errorQueries: 0,
        queriesByTable: {},
        queriesByOperation: {},
        topSlowQueries: [],
        recentQueries: [],
        performanceScore: 100
      };
    }

    const totalQueries = this.queries.length;
    const averageQueryTime = this.queries.reduce((sum, q) => sum + q.duration, 0) / totalQueries;
    const slowQueries = this.queries.filter(q => q.duration > this.slowQueryThreshold).length;
    const errorQueries = this.queries.filter(q => !q.success).length;

    // Group by table
    const queriesByTable = this.queries.reduce((acc, q) => {
      if (q.table) {
        acc[q.table] = (acc[q.table] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Group by operation
    const queriesByOperation = this.queries.reduce((acc, q) => {
      if (q.operation) {
        acc[q.operation] = (acc[q.operation] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Top slow queries
    const topSlowQueries = [...this.queries]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Recent queries
    const recentQueries = [...this.queries]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    // Calculate performance score (0-100)
    const errorRate = errorQueries / totalQueries;
    const slowQueryRate = slowQueries / totalQueries;
    const avgTimeScore = Math.max(0, 100 - (averageQueryTime / 100));
    const errorScore = Math.max(0, 100 - (errorRate * 1000));
    const slowQueryScore = Math.max(0, 100 - (slowQueryRate * 100));
    
    const performanceScore = Math.round((avgTimeScore + errorScore + slowQueryScore) / 3);

    return {
      totalQueries,
      averageQueryTime,
      slowQueries,
      errorQueries,
      queriesByTable,
      queriesByOperation,
      topSlowQueries,
      recentQueries,
      performanceScore
    };
  }

  // Get alerts
  getAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  // Create an alert
  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: PerformanceAlert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.push(newAlert);

    // Keep only the latest alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  // Resolve an alert
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  // Clear old data
  clearOldData(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    this.queries = this.queries.filter(q => new Date(q.timestamp) > cutoff);
    this.alerts = this.alerts.filter(a => new Date(a.timestamp) > cutoff);
  }

  // Generate unique IDs
  private generateQueryId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `a_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get queries by time range
  getQueriesByTimeRange(startTime: Date, endTime: Date): QueryMetrics[] {
    return this.queries.filter(q => {
      const queryTime = new Date(q.timestamp);
      return queryTime >= startTime && queryTime <= endTime;
    });
  }

  // Get queries by table
  getQueriesByTable(table: string): QueryMetrics[] {
    return this.queries.filter(q => q.table === table);
  }

  // Get queries by operation
  getQueriesByOperation(operation: string): QueryMetrics[] {
    return this.queries.filter(q => q.operation === operation);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Decorator for database queries
export function monitorQuery(options: {
  table?: string;
  operation?: QueryMetrics['operation'];
  userId?: string;
  sessionId?: string;
  requestId?: string;
} = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      if (!performanceMonitor.isEnabled) {
        return method.apply(this, args);
      }

      const startTime = performance.now();
      let success = true;
      let error: string | undefined;
      let result: any;

      try {
        result = await method.apply(this, args);
        return result;
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : String(err);
        throw err;
      } finally {
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Extract query from method name or arguments
        let query = propertyName;
        if (args.length > 0 && typeof args[0] === 'string') {
          query = args[0];
        }

        performanceMonitor.recordQuery({
          query,
          duration,
          success,
          error,
          table: options.table,
          operation: options.operation,
          userId: options.userId,
          sessionId: options.sessionId,
          requestId: options.requestId
        });
      }
    };

    return descriptor;
  };
}

// Higher-order function for monitoring any async function
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    name?: string;
    table?: string;
    operation?: QueryMetrics['operation'];
    userId?: string;
    sessionId?: string;
    requestId?: string;
  } = {}
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!performanceMonitor.isEnabled) {
      return fn(...args);
    }

    const startTime = performance.now();
    let success = true;
    let error: string | undefined;
    let result: ReturnType<T>;

    try {
      result = await fn(...args);
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const endTime = performance.now();
      const duration = endTime - startTime;

      performanceMonitor.recordQuery({
        query: options.name || fn.name || 'anonymous_function',
        duration,
        success,
        error,
        table: options.table,
        operation: options.operation,
        userId: options.userId,
        sessionId: options.sessionId,
        requestId: options.requestId
      });
    }
  }) as T;
}

// Utility function to extract table name from SQL query
export function extractTableFromQuery(query: string): string | undefined {
  const tableMatch = query.match(/(?:FROM|UPDATE|INSERT INTO|DELETE FROM)\s+(\w+)/i);
  return tableMatch ? tableMatch[1] : undefined;
}

// Utility function to extract operation type from SQL query
export function extractOperationFromQuery(query: string): QueryMetrics['operation'] | undefined {
  const upperQuery = query.toUpperCase().trim();
  if (upperQuery.startsWith('SELECT')) return 'SELECT';
  if (upperQuery.startsWith('INSERT')) return 'INSERT';
  if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
  if (upperQuery.startsWith('DELETE')) return 'DELETE';
  if (upperQuery.startsWith('CREATE')) return 'CREATE';
  if (upperQuery.startsWith('DROP')) return 'DROP';
  if (upperQuery.startsWith('ALTER')) return 'ALTER';
  return undefined;
}


