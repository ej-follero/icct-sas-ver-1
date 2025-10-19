interface WebSocketHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  activeConnections: number;
  totalConnections: number;
  responseTime: string;
  lastCheck: string;
  uptime: string;
  messagesPerSecond: number;
  averageLatency: number;
}

class WebSocketService {
  private wsServer: any = null;
  private isConnected = false;
  private startTime = Date.now();

  constructor() {
    this.initializeWebSocket();
  }

  private async initializeWebSocket() {
    try {
      // Check if WebSocket server is running
      const response = await fetch('http://localhost:3002/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        this.isConnected = true;
        console.log('WebSocket server is running');
      } else {
        this.isConnected = false;
        console.log('WebSocket server is not responding');
      }
    } catch (error) {
      console.log('WebSocket server not available (this is normal if not started)');
      this.isConnected = false;
    }
  }

  async getHealthStatus(): Promise<WebSocketHealthStatus> {
    if (!this.isConnected) {
      return {
        status: 'unhealthy',
        activeConnections: 0,
        totalConnections: 0,
        responseTime: 'N/A',
        lastCheck: new Date().toISOString(),
        uptime: 'N/A',
        messagesPerSecond: 0,
        averageLatency: 0
      };
    }

    try {
      const startTime = Date.now();
      
      // Try to get WebSocket server status
      const response = await fetch('http://localhost:3002/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const uptime = Math.round((Date.now() - this.startTime) / 1000 / 60); // minutes

        return {
          status: 'healthy',
          activeConnections: data.activeConnections || 0,
          totalConnections: data.totalConnections || 0,
          responseTime: `${responseTime}ms`,
          lastCheck: new Date().toISOString(),
          uptime: `${uptime} minutes`,
          messagesPerSecond: data.messagesPerSecond || 0,
          averageLatency: data.averageLatency || 0
        };
      } else {
        return {
          status: 'degraded',
          activeConnections: 0,
          totalConnections: 0,
          responseTime: `${responseTime}ms`,
          lastCheck: new Date().toISOString(),
          uptime: 'N/A',
          messagesPerSecond: 0,
          averageLatency: 0
        };
      }
    } catch (error) {
      // Don't log errors for WebSocket connection failures as they're expected
      return {
        status: 'unhealthy',
        activeConnections: 0,
        totalConnections: 0,
        responseTime: 'timeout',
        lastCheck: new Date().toISOString(),
        uptime: 'N/A',
        messagesPerSecond: 0,
        averageLatency: 0
      };
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3002/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
