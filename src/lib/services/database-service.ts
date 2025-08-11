import { monitorQuery, withPerformanceMonitoring, performanceMonitor } from '@/lib/performance-monitor';

// Sample database service with performance monitoring
export class DatabaseService {
  
  @monitorQuery({ table: 'users', operation: 'SELECT' })
  async findUsers(filters: any = {}) {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    return { users: [], total: 0 };
  }

  @monitorQuery({ table: 'attendance', operation: 'SELECT' })
  async getAttendanceRecords(date: string, userId?: string) {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    return { records: [], total: 0 };
  }

  @monitorQuery({ table: 'courses', operation: 'SELECT' })
  async getCourses() {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75));
    return { courses: [] };
  }

  @monitorQuery({ table: 'users', operation: 'INSERT' })
  async createUser(userData: any) {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
    return { id: 'new-user-id', ...userData };
  }

  @monitorQuery({ table: 'attendance', operation: 'UPDATE' })
  async updateAttendance(recordId: string, data: any) {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 250 + 150));
    return { id: recordId, ...data };
  }

  @monitorQuery({ table: 'users', operation: 'DELETE' })
  async deleteUser(userId: string) {
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 300));
    return { deleted: true, userId };
  }

  // Using higher-order function for complex queries
  async complexQuery() {
    const monitoredQuery = withPerformanceMonitoring(
      async () => {
        // Simulate complex database operation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
        return { result: 'complex query result' };
      },
      { name: 'complex_query', table: 'multiple_tables', operation: 'SELECT' }
    );

    return monitoredQuery();
  }

  // Get performance statistics
  getPerformanceStats() {
    return performanceMonitor.getStats();
  }

  // Get alerts
  getAlerts() {
    return performanceMonitor.getAlerts();
  }

  // Enable/disable monitoring
  enableMonitoring() {
    performanceMonitor.enable();
  }

  disableMonitoring() {
    performanceMonitor.disable();
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
