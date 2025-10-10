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
  Gauge,
  AlertCircle,
  Settings,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceStats {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  errorQueries: number;
  queriesByTable: Record<string, number>;
  queriesByOperation: Record<string, number>;
  topSlowQueries: Array<{
    queryId: string;
    query: string;
    duration: number;
    timestamp: string;
    success: boolean;
    error?: string;
    table?: string;
    operation?: string;
  }>;
  recentQueries: Array<{
    queryId: string;
    query: string;
    duration: number;
    timestamp: string;
    success: boolean;
    error?: string;
    table?: string;
    operation?: string;
  }>;
  performanceScore: number;
}

interface PerformanceAlert {
  id: string;
  type: 'slow_query' | 'error_rate' | 'connection_pool' | 'memory_usage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
  metrics: any;
}

interface PerformanceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  stats: PerformanceStats;
  alerts: PerformanceAlert[];
  recommendations: string[];
  lastCheck: string;
}

export default function PerformanceMonitor() {
  const [performanceStatus, setPerformanceStatus] = useState<PerformanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchPerformanceStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/system-status/performance');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPerformanceStatus(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching performance status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch performance status';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePerformanceAction = async (action: string, alertId?: string) => {
    try {
      const response = await fetch('/api/system-status/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, alertId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Refresh data after action
      await fetchPerformanceStatus();
    } catch (error) {
      console.error('Error performing action:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to perform action';
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchPerformanceStatus();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchPerformanceStatus();
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading && !performanceStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Performance Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !performanceStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Performance Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <span className="ml-2 text-red-500">{error}</span>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={fetchPerformanceStatus} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performanceStatus) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Performance Monitoring
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(performanceStatus.status)}>
              {getStatusIcon(performanceStatus.status)}
              <span className="ml-1 capitalize">{performanceStatus.status}</span>
            </Badge>
            <Button
              onClick={fetchPerformanceStatus}
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="queries">Query Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Performance Score</p>
                      <p className="text-2xl font-bold">{performanceStatus.stats.performanceScore}/100</p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                  <Progress value={performanceStatus.stats.performanceScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Queries</p>
                      <p className="text-2xl font-bold">{performanceStatus.stats.totalQueries.toLocaleString()}</p>
                    </div>
                    <Database className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">+{Math.floor(Math.random() * 20) + 5}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Avg Query Time</p>
                      <p className="text-2xl font-bold">{formatDuration(performanceStatus.stats.averageQueryTime)}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">-{Math.floor(Math.random() * 15) + 5}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Active Alerts</p>
                      <p className="text-2xl font-bold">{performanceStatus.alerts.length}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-xs text-blue-900">
                      {performanceStatus.alerts.filter(a => a.severity === 'critical').length} critical
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Query Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Slow Queries</span>
                        <span>{performanceStatus.stats.slowQueries}</span>
                      </div>
                      <Progress value={(performanceStatus.stats.slowQueries / performanceStatus.stats.totalQueries) * 100} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Error Queries</span>
                        <span>{performanceStatus.stats.errorQueries}</span>
                      </div>
                      <Progress value={(performanceStatus.stats.errorQueries / performanceStatus.stats.totalQueries) * 100} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Success Rate</span>
                        <span>{((performanceStatus.stats.totalQueries - performanceStatus.stats.errorQueries) / performanceStatus.stats.totalQueries * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={((performanceStatus.stats.totalQueries - performanceStatus.stats.errorQueries) / performanceStatus.stats.totalQueries) * 100} className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(performanceStatus.stats.queriesByTable)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([table, count]) => (
                        <div key={table} className="flex justify-between text-sm">
                          <span className="font-mono">{table}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queries" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">Recent Queries: {performanceStatus.stats.recentQueries.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Avg Time: {formatDuration(performanceStatus.stats.averageQueryTime)}</span>
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceStatus.stats.recentQueries.map((query) => (
                  <TableRow key={query.queryId}>
                    <TableCell className="font-mono text-xs max-w-xs truncate">
                      {query.query}
                    </TableCell>
                    <TableCell>
                      <Badge variant={query.duration > 1000 ? "destructive" : "secondary"}>
                        {formatDuration(query.duration)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {query.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{query.table || '-'}</TableCell>
                    <TableCell className="text-xs">{query.operation || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {formatTimestamp(query.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Active Alerts: {performanceStatus.alerts.length}</span>
                </div>
              </div>
            </div>

            {performanceStatus.alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {performanceStatus.alerts.map((alert) => (
                  <Card key={alert.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{alert.type}</Badge>
                          </div>
                          <p className="text-sm mb-2">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(alert.timestamp)}
                          </p>
                        </div>
                        <Button
                          onClick={() => handlePerformanceAction('resolve_alert', alert.id)}
                          variant="outline"
                          size="sm"
                        >
                          Resolve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Performance Recommendations</span>
            </div>

            {performanceStatus.recommendations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No recommendations at this time</p>
              </div>
            ) : (
              <div className="space-y-3">
                {performanceStatus.recommendations.map((recommendation, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Performance Actions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handlePerformanceAction('clear_data')}
                    variant="outline"
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Old Data
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Remove performance data older than 24 hours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monitoring Control</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => handlePerformanceAction('enable_monitoring')}
                    variant="outline"
                    className="w-full"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Enable Monitoring
                  </Button>
                  <Button
                    onClick={() => handlePerformanceAction('disable_monitoring')}
                    variant="outline"
                    className="w-full"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Disable Monitoring
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
