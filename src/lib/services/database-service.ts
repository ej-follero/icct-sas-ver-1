import { monitorQuery, withPerformanceMonitoring, performanceMonitor } from '@/lib/performance-monitor';

// Sample database service with performance monitoring
export class DatabaseService {
  
  async findUsers(filters: Record<string, any> = {}): Promise<{ users: any[]; total: number }> {
    try {
      const monitoredQuery = withPerformanceMonitoring(
        async () => {
          // Simulate database query
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
          return { users: [], total: 0 };
        },
        { name: 'findUsers', table: 'users', operation: 'SELECT' }
      );
      return await monitoredQuery();
    } catch (error) {
      console.error('Error finding users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async getAttendanceRecords(date: string, userId?: string): Promise<{ records: any[]; total: number }> {
    try {
      const monitoredQuery = withPerformanceMonitoring(
        async () => {
          // Simulate database query
          await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
          return { records: [], total: 0 };
        },
        { name: 'getAttendanceRecords', table: 'attendance', operation: 'SELECT' }
      );
      return await monitoredQuery();
    } catch (error) {
      console.error('Error getting attendance records:', error);
      throw new Error('Failed to fetch attendance records');
    }
  }

  async getCourses(): Promise<{ courses: any[] }> {
    try {
      const monitoredQuery = withPerformanceMonitoring(
        async () => {
          // Simulate database query
          await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 75));
          return { courses: [] };
        },
        { name: 'getCourses', table: 'courses', operation: 'SELECT' }
      );
      return await monitoredQuery();
    } catch (error) {
      console.error('Error getting courses:', error);
      throw new Error('Failed to fetch courses');
    }
  }

  async createUser(userData: Record<string, any>): Promise<{ id: string } & Record<string, any>> {
    try {
      const monitoredQuery = withPerformanceMonitoring(
        async () => {
          // Simulate database query
          await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 200));
          return { id: 'new-user-id', ...userData };
        },
        { name: 'createUser', table: 'users', operation: 'INSERT' }
      );
      return await monitoredQuery();
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateAttendance(recordId: string, data: Record<string, any>): Promise<{ id: string } & Record<string, any>> {
    try {
      const monitoredQuery = withPerformanceMonitoring(
        async () => {
          // Simulate database query
          await new Promise(resolve => setTimeout(resolve, Math.random() * 250 + 150));
          return { id: recordId, ...data };
        },
        { name: 'updateAttendance', table: 'attendance', operation: 'UPDATE' }
      );
      return await monitoredQuery();
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw new Error('Failed to update attendance');
    }
  }

  async deleteUser(userId: string): Promise<{ deleted: boolean; userId: string }> {
    try {
      const monitoredQuery = withPerformanceMonitoring(
        async () => {
          // Simulate database query
          await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 300));
          return { deleted: true, userId };
        },
        { name: 'deleteUser', table: 'users', operation: 'DELETE' }
      );
      return await monitoredQuery();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  // Using higher-order function for complex queries
  async complexQuery(): Promise<{ result: string }> {
    try {
      const monitoredQuery = withPerformanceMonitoring(
        async () => {
          // Simulate complex database operation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
          return { result: 'complex query result' };
        },
        { name: 'complex_query', table: 'multiple_tables', operation: 'SELECT' }
      );

      return await monitoredQuery();
    } catch (error) {
      console.error('Error in complex query:', error);
      throw new Error('Failed to execute complex query');
    }
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
