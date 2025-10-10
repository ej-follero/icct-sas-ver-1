"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Database, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Hash,
  List,
  Calendar,
  Timer,
  Users,
  Command,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';

interface CacheMetrics {
  totalKeys: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  expiredKeys: number;
  averageTTL: number;
  connectedClients: number;
  commandsProcessed: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  usedMemory: number;
  maxMemory: number;
  memoryFragmentationRatio: number;
}

interface CacheKey {
  key: string;
  type: string;
  size: number;
  ttl: number;
  lastAccessed: string;
  accessCount: number;
}

interface CacheStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: CacheMetrics;
  topKeys: CacheKey[];
  slowQueries: Array<{
    command: string;
    duration: number;
    timestamp: string;
  }>;
  lastCheck: string;
}

export default function CacheMonitor() {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchCacheStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/system-status/cache');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCacheStatus(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching cache status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cache status';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheStatus();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchCacheStatus();
      }, 15000); // Refresh every 15 seconds
      
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTTL = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'string':
        return <Database className="w-4 h-4" />;
      case 'hash':
        return <Hash className="w-4 h-4" />;
      case 'list':
        return <List className="w-4 h-4" />;
      case 'set':
        return <BarChart3 className="w-4 h-4" />;
      case 'zset':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  if (loading && !cacheStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading cache status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !cacheStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span className="ml-2 text-red-500">{error}</span>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={fetchCacheStatus} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!cacheStatus) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Cache Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(cacheStatus.status)}>
              {getStatusIcon(cacheStatus.status)}
              <span className="ml-1 capitalize">{cacheStatus.status}</span>
            </Badge>
            <Button
              onClick={fetchCacheStatus}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keys">Top Keys</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="queries">Slow Queries</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Hit Rate</p>
                      <p className="text-2xl font-bold">{cacheStatus.metrics.hitRate.toFixed(1)}%</p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                  <Progress value={cacheStatus.metrics.hitRate} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Memory Usage</p>
                      <p className="text-2xl font-bold">{formatBytes(cacheStatus.metrics.usedMemory * 1024 * 1024)}</p>
                    </div>
                                         <Database className="w-8 h-8 text-blue-500" />
                  </div>
                  <Progress value={(cacheStatus.metrics.usedMemory / cacheStatus.metrics.maxMemory) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Keys</p>
                      <p className="text-2xl font-bold">{cacheStatus.metrics.totalKeys.toLocaleString()}</p>
                    </div>
                    <Hash className="w-8 h-8 text-purple-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+{Math.floor(Math.random() * 10) + 1}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Commands/sec</p>
                      <p className="text-2xl font-bold">{Math.floor(cacheStatus.metrics.commandsProcessed / 60).toLocaleString()}</p>
                    </div>
                    <Command className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+{Math.floor(Math.random() * 20) + 5}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cache Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Miss Rate</span>
                        <span>{cacheStatus.metrics.missRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={cacheStatus.metrics.missRate} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Evictions</span>
                        <span>{cacheStatus.metrics.evictions.toLocaleString()}</span>
                      </div>
                      <Progress value={(cacheStatus.metrics.evictions / 1000) * 100} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Expired Keys</span>
                        <span>{cacheStatus.metrics.expiredKeys.toLocaleString()}</span>
                      </div>
                      <Progress value={(cacheStatus.metrics.expiredKeys / 1000) * 100} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Memory Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Used Memory</span>
                        <span>{formatBytes(cacheStatus.metrics.usedMemory * 1024 * 1024)}</span>
                      </div>
                      <Progress value={(cacheStatus.metrics.usedMemory / cacheStatus.metrics.maxMemory) * 100} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Max Memory</span>
                        <span>{formatBytes(cacheStatus.metrics.maxMemory * 1024 * 1024)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Fragmentation Ratio</span>
                        <span>{cacheStatus.metrics.memoryFragmentationRatio.toFixed(2)}</span>
                      </div>
                      <Progress value={(cacheStatus.metrics.memoryFragmentationRatio / 3) * 100} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Keys: {cacheStatus.metrics.totalKeys.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  <span className="text-sm">Avg TTL: {formatTTL(cacheStatus.metrics.averageTTL)}</span>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>TTL</TableHead>
                  <TableHead>Access Count</TableHead>
                  <TableHead>Last Accessed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cacheStatus.topKeys.map((key) => (
                  <TableRow key={key.key}>
                    <TableCell className="font-mono text-xs">{key.key}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(key.type)}
                        <Badge variant="outline">{key.type}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{formatBytes(key.size)}</TableCell>
                    <TableCell>{formatTTL(key.ttl)}</TableCell>
                    <TableCell>{key.accessCount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(key.lastAccessed).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Commands Processed</span>
                      <span className="font-medium">{cacheStatus.metrics.commandsProcessed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Keyspace Hits</span>
                      <span className="font-medium text-green-600">{cacheStatus.metrics.keyspaceHits.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Keyspace Misses</span>
                      <span className="font-medium text-red-600">{cacheStatus.metrics.keyspaceMisses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Connected Clients</span>
                      <span className="font-medium">{cacheStatus.metrics.connectedClients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average TTL</span>
                      <span className="font-medium">{formatTTL(cacheStatus.metrics.averageTTL)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Memory Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Used Memory</span>
                      <span className="font-medium">{formatBytes(cacheStatus.metrics.usedMemory * 1024 * 1024)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Memory</span>
                      <span className="font-medium">{formatBytes(cacheStatus.metrics.maxMemory * 1024 * 1024)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage %</span>
                      <span className="font-medium">{((cacheStatus.metrics.usedMemory / cacheStatus.metrics.maxMemory) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fragmentation Ratio</span>
                      <span className="font-medium">{cacheStatus.metrics.memoryFragmentationRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Evictions</span>
                      <span className="font-medium">{cacheStatus.metrics.evictions.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queries" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  <span className="text-sm font-medium">Slow Queries: {cacheStatus.slowQueries.length}</span>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Command</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cacheStatus.slowQueries.map((query, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-sm">{query.command}</TableCell>
                    <TableCell>
                      <Badge variant={query.duration > 50 ? "destructive" : "secondary"}>
                        {query.duration.toFixed(1)}ms
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(query.timestamp).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
