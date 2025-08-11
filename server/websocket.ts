import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { EventEmitter } from 'events';

interface ConnectionInfo {
  id: string;
  ip: string;
  userAgent: string;
  connectedAt: Date;
  lastHeartbeat: Date;
  isAlive: boolean;
  room?: string;
  userId?: string;
}

interface SystemMetrics {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  messagesPerSecond: number;
  averageLatency: number;
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

class WebSocketMonitor extends EventEmitter {
  private connections: Map<string, ConnectionInfo> = new Map();
  private metrics: SystemMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    uptime: 0,
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };
  private startTime: number = Date.now();
  private messageCount = 0;
  private lastMessageTime = Date.now();

  constructor() {
    super();
    this.startMetricsCollection();
  }

  private startMetricsCollection() {
    setInterval(() => {
      this.updateMetrics();
      this.emit('metrics-updated', this.metrics);
    }, 5000); // Update every 5 seconds
  }

  private updateMetrics() {
    const now = Date.now();
    this.metrics.uptime = now - this.startTime;
    this.metrics.memoryUsage = process.memoryUsage();
    this.metrics.cpuUsage = process.cpuUsage();
    
    // Calculate messages per second
    const timeDiff = (now - this.lastMessageTime) / 1000;
    this.metrics.messagesPerSecond = timeDiff > 0 ? this.messageCount / timeDiff : 0;
    
    this.metrics.activeConnections = this.connections.size;
    
    // Reset counters
    this.messageCount = 0;
    this.lastMessageTime = now;
  }

  addConnection(id: string, info: Omit<ConnectionInfo, 'id'>) {
    this.connections.set(id, { id, ...info });
    this.metrics.totalConnections++;
    this.emit('connection-added', { id, info });
  }

  removeConnection(id: string) {
    this.connections.delete(id);
    this.emit('connection-removed', { id });
  }

  updateHeartbeat(id: string) {
    const connection = this.connections.get(id);
    if (connection) {
      connection.lastHeartbeat = new Date();
      connection.isAlive = true;
    }
  }

  recordMessage() {
    this.messageCount++;
    this.metrics.totalMessages++;
  }

  getConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getConnectionStats() {
    const connections = this.getConnections();
    const now = new Date();
    
    return {
      total: connections.length,
      active: connections.filter(c => c.isAlive).length,
      inactive: connections.filter(c => !c.isAlive).length,
      averageAge: connections.length > 0 
        ? connections.reduce((sum, c) => sum + (now.getTime() - c.connectedAt.getTime()), 0) / connections.length
        : 0,
      byRoom: connections.reduce((acc, c) => {
        if (c.room) {
          acc[c.room] = (acc[c.room] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

class AttendanceWebSocketServer {
  private wss: WebSocketServer;
  private monitor: WebSocketMonitor;
  private rooms: Map<string, Set<string>> = new Map();

  constructor(port: number = 3001) {
    this.monitor = new WebSocketMonitor();
    this.wss = new WebSocketServer({ port });
    
    this.setupEventHandlers();
    this.setupMonitoring();
    
    console.log(`WebSocket server started on port ${port}`);
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      const connectionId = this.generateConnectionId();
      const ip = req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Add to monitor
      this.monitor.addConnection(connectionId, {
        ip,
        userAgent,
        connectedAt: new Date(),
        lastHeartbeat: new Date(),
        isAlive: true
      });

      // Store connection info
      (ws as any).connectionId = connectionId;

      console.log(`Client connected: ${connectionId} from ${ip}`);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
          this.monitor.recordMessage();
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        this.monitor.removeConnection(connectionId);
        this.removeFromAllRooms(connectionId);
        console.log(`Client disconnected: ${connectionId}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${connectionId}:`, error);
        this.monitor.removeConnection(connectionId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        connectionId,
        timestamp: new Date().toISOString()
      }));
    });
  }

  private setupMonitoring() {
    this.monitor.on('metrics-updated', (metrics) => {
      // Broadcast metrics to all connected clients
      this.broadcast({
        type: 'system-metrics',
        data: metrics,
        timestamp: new Date().toISOString()
      });
    });

    this.monitor.on('connection-added', ({ id }) => {
      console.log(`Connection added to monitor: ${id}`);
    });

    this.monitor.on('connection-removed', ({ id }) => {
      console.log(`Connection removed from monitor: ${id}`);
    });
  }

  private handleMessage(ws: WebSocket, message: any) {
    const connectionId = (ws as any).connectionId;

    switch (message.type) {
      case 'heartbeat':
        this.monitor.updateHeartbeat(connectionId);
        ws.send(JSON.stringify({
          type: 'heartbeat-ack',
          timestamp: new Date().toISOString()
        }));
        break;

      case 'join-room':
        this.joinRoom(connectionId, message.room);
        ws.send(JSON.stringify({
          type: 'room-joined',
          room: message.room,
          timestamp: new Date().toISOString()
        }));
        break;

      case 'leave-room':
        this.leaveRoom(connectionId, message.room);
        ws.send(JSON.stringify({
          type: 'room-left',
          room: message.room,
          timestamp: new Date().toISOString()
        }));
        break;

      case 'attendance-update':
        this.broadcastToRoom(message.room, {
          type: 'attendance-updated',
          data: message.data,
          timestamp: new Date().toISOString()
        });
        break;

      case 'get-metrics':
        ws.send(JSON.stringify({
          type: 'metrics',
          data: this.monitor.getMetrics(),
          timestamp: new Date().toISOString()
        }));
        break;

      case 'get-connections':
        ws.send(JSON.stringify({
          type: 'connections',
          data: this.monitor.getConnections(),
          timestamp: new Date().toISOString()
        }));
        break;

      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private joinRoom(connectionId: string, room: string) {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(connectionId);
    
    const connection = this.monitor.getConnections().find(c => c.id === connectionId);
    if (connection) {
      connection.room = room;
    }
  }

  private leaveRoom(connectionId: string, room: string) {
    const roomSet = this.rooms.get(room);
    if (roomSet) {
      roomSet.delete(connectionId);
      if (roomSet.size === 0) {
        this.rooms.delete(room);
      }
    }
    
    const connection = this.monitor.getConnections().find(c => c.id === connectionId);
    if (connection && connection.room === room) {
      connection.room = undefined;
    }
  }

  private removeFromAllRooms(connectionId: string) {
    for (const [room, connections] of this.rooms.entries()) {
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  private broadcast(message: any) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  private broadcastToRoom(room: string, message: any) {
    const roomConnections = this.rooms.get(room);
    if (roomConnections) {
      this.wss.clients.forEach((client) => {
        const connectionId = (client as any).connectionId;
        if (client.readyState === WebSocket.OPEN && roomConnections.has(connectionId)) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  private generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Public methods for external access
  getMetrics() {
    return this.monitor.getMetrics();
  }

  getConnections() {
    return this.monitor.getConnections();
  }

  getConnectionStats() {
    return this.monitor.getConnectionStats();
  }

  broadcastAttendanceUpdate(room: string, data: any) {
    this.broadcastToRoom(room, {
      type: 'attendance-updated',
      data,
      timestamp: new Date().toISOString()
    });
  }

  broadcastSystemAlert(alert: any) {
    this.broadcast({
      type: 'system-alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
  }
}

// Create and export the server instance
const server = new AttendanceWebSocketServer(3001);

// Export for use in other parts of the application
export { server as WebSocketServer, WebSocketMonitor };
export default server;
