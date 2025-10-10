import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock authentication for API routes
interface AuthSession {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

async function getServerSession(): Promise<AuthSession | null> {
  // Mock session for development
  return {
    user: {
      id: '1',
      email: 'admin@icct.edu.ph',
      role: 'SUPER_ADMIN'
    }
  };
}

interface WebSocketMetrics {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  messagesPerSecond: number;
  averageLatency: number;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}

interface ConnectionInfo {
  id: string;
  ip: string;
  userAgent: string;
  connectedAt: string;
  lastHeartbeat: string;
  isAlive: boolean;
  room?: string;
  userId?: string;
}

interface WebSocketStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: WebSocketMetrics;
  connections: ConnectionInfo[];
  connectionStats: {
    total: number;
    active: number;
    inactive: number;
    averageAge: number;
    byRoom: Record<string, number>;
  };
  lastCheck: string;
}

export async function GET(request: NextRequest) {
  try {
    // JWT Authentication - Admin only
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = Number((decoded as any)?.userId);
    if (!Number.isFinite(userId)) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { userId }, select: { status: true, role: true } });
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 401 });
    }
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Try to connect to WebSocket server to get metrics
    let websocketStatus: WebSocketStatus;
    
    try {
      // In a real implementation, you would connect to the WebSocket server
      // For now, we'll simulate the data
      const mockMetrics: WebSocketMetrics = {
        totalConnections: Math.floor(Math.random() * 50) + 10,
        activeConnections: Math.floor(Math.random() * 30) + 5,
        totalMessages: Math.floor(Math.random() * 1000) + 500,
        messagesPerSecond: Math.random() * 10 + 2,
        averageLatency: Math.random() * 50 + 10,
        uptime: Date.now() - (Date.now() - 86400000), // 24 hours ago
        memoryUsage: {
          rss: Math.floor(Math.random() * 100) + 50,
          heapTotal: Math.floor(Math.random() * 80) + 40,
          heapUsed: Math.floor(Math.random() * 60) + 20,
          external: Math.floor(Math.random() * 20) + 5
        },
        cpuUsage: {
          user: Math.random() * 100 + 50,
          system: Math.random() * 50 + 10
        }
      };

      const mockConnections: ConnectionInfo[] = Array.from({ length: mockMetrics.activeConnections }, (_, i) => ({
        id: `conn-${i + 1}`,
        ip: `192.168.1.${100 + i}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        connectedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time within last hour
        lastHeartbeat: new Date().toISOString(),
        isAlive: Math.random() > 0.1, // 90% alive
        room: Math.random() > 0.3 ? `room-${Math.floor(Math.random() * 5) + 1}` : undefined,
        userId: Math.random() > 0.2 ? `user-${Math.floor(Math.random() * 100) + 1}` : undefined
      }));

      const connectionStats = {
        total: mockConnections.length,
        active: mockConnections.filter(c => c.isAlive).length,
        inactive: mockConnections.filter(c => !c.isAlive).length,
        averageAge: mockConnections.length > 0 
          ? mockConnections.reduce((sum, c) => sum + (Date.now() - new Date(c.connectedAt).getTime()), 0) / mockConnections.length
          : 0,
        byRoom: mockConnections.reduce((acc, c) => {
          if (c.room) {
            acc[c.room] = (acc[c.room] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      };

      // Determine status based on metrics
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (mockMetrics.activeConnections === 0) {
        status = 'unhealthy';
      } else if (mockMetrics.messagesPerSecond > 50 || mockMetrics.averageLatency > 100) {
        status = 'degraded';
      }

      websocketStatus = {
        status,
        metrics: mockMetrics,
        connections: mockConnections,
        connectionStats,
        lastCheck: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      
      // Return unhealthy status if we can't connect
      websocketStatus = {
        status: 'unhealthy',
        metrics: {
          totalConnections: 0,
          activeConnections: 0,
          totalMessages: 0,
          messagesPerSecond: 0,
          averageLatency: 0,
          uptime: 0,
          memoryUsage: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 },
          cpuUsage: { user: 0, system: 0 }
        },
        connections: [],
        connectionStats: {
          total: 0,
          active: 0,
          inactive: 0,
          averageAge: 0,
          byRoom: {}
        },
        lastCheck: new Date().toISOString()
      };
    }

    return NextResponse.json(websocketStatus);

  } catch (error) {
    console.error('Error fetching WebSocket status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WebSocket status' },
      { status: 500 }
    );
  }
}
