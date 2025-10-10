"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Wifi, 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  Cpu,
  HardDrive,
  MessageSquare,
  Signal,
  Globe,
  User,
  Calendar,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

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

export default function WebSocketMonitor() {
  const [websocketStatus, setWebsocketStatus] = useState<WebSocketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchWebSocketStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/system-status/websocket');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setWebsocketStatus(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching WebSocket status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch WebSocket status';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebSocketStatus();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchWebSocketStatus();
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && !websocketStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            WebSocket Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading WebSocket status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !websocketStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            WebSocket Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span className="ml-2 text-red-500">{error}</span>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={fetchWebSocketStatus} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!websocketStatus) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            WebSocket Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(websocketStatus.status)}>
              {getStatusIcon(websocketStatus.status)}
              <span className="ml-1 capitalize">{websocketStatus.status}</span>
            </Badge>
            <Button
              onClick={fetchWebSocketStatus}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        {lastRefresh && (
          <p className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Active Connections</p>
                      <p className="text-2xl font-bold">{websocketStatus.metrics.activeConnections}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <Progress 
                    value={(websocketStatus.metrics.activeConnections / Math.max(websocketStatus.metrics.totalConnections, 1)) * 100} 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Messages/sec</p>
                      <p className="text-2xl font-bold">{websocketStatus.metrics.messagesPerSecond.toFixed(1)}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+2.5%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Avg Latency</p>
                      <p className="text-2xl font-bold">{websocketStatus.metrics.averageLatency.toFixed(1)}ms</p>
                    </div>
                    <Signal className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">-1.2ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Uptime</p>
                      <p className="text-2xl font-bold">{formatUptime(websocketStatus.metrics.uptime)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-blue-900 mt-2">Since last restart</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>RSS</span>
                        <span>{formatBytes(websocketStatus.metrics.memoryUsage.rss * 1024 * 1024)}</span>
                      </div>
                      <Progress value={(websocketStatus.metrics.memoryUsage.rss / 200) * 100} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Heap Used</span>
                        <span>{formatBytes(websocketStatus.metrics.memoryUsage.heapUsed * 1024 * 1024)}</span>
                      </div>
                      <Progress value={(websocketStatus.metrics.memoryUsage.heapUsed / websocketStatus.metrics.memoryUsage.heapTotal) * 100} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CPU Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>User</span>
                        <span>{websocketStatus.metrics.cpuUsage.user.toFixed(1)}ms</span>
                      </div>
                      <Progress value={(websocketStatus.metrics.cpuUsage.user / 1000) * 100} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>System</span>
                        <span>{websocketStatus.metrics.cpuUsage.system.toFixed(1)}ms</span>
                      </div>
                      <Progress value={(websocketStatus.metrics.cpuUsage.system / 500) * 100} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Total: {websocketStatus.connectionStats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Active: {websocketStatus.connectionStats.active}</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">Inactive: {websocketStatus.connectionStats.inactive}</span>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead>Last Heartbeat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {websocketStatus.connections.map((connection) => (
                  <TableRow key={connection.id}>
                    <TableCell className="font-mono text-xs">{connection.id}</TableCell>
                    <TableCell className="font-mono text-xs">{connection.ip}</TableCell>
                    <TableCell>
                      <Badge variant={connection.isAlive ? "default" : "destructive"}>
                        {connection.isAlive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {connection.room ? (
                        <Badge variant="outline">{connection.room}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(connection.connectedAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(connection.lastHeartbeat).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connection Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Connections</span>
                      <span className="font-medium">{websocketStatus.metrics.totalConnections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Connections</span>
                      <span className="font-medium text-green-600">{websocketStatus.metrics.activeConnections}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Messages</span>
                      <span className="font-medium">{websocketStatus.metrics.totalMessages.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Messages per Second</span>
                      <span className="font-medium">{websocketStatus.metrics.messagesPerSecond.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Latency</span>
                      <span className="font-medium">{websocketStatus.metrics.averageLatency.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Connection Age</span>
                      <span className="font-medium">{formatUptime(websocketStatus.connectionStats.averageAge)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Room Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(websocketStatus.connectionStats.byRoom).map(([room, count]) => (
                      <div key={room} className="flex justify-between items-center">
                        <span className="text-sm">{room}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                    {Object.keys(websocketStatus.connectionStats.byRoom).length === 0 && (
                      <p className="text-muted-foreground text-sm">No rooms active</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
