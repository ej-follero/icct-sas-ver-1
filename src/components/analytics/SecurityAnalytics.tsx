"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw,
  AlertTriangle,
  Shield,
  Activity,
  Users,
  Globe,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SecurityAnalytics {
  eventTypeDistribution: Record<string, number>;
  severityDistribution: Record<string, number>;
  dailyEvents: Array<{ date: string; count: number }>;
  topSuspiciousIPs: Array<{ ipAddress: string; count: number }>;
  failedLoginUsers: Array<{ userId: number; userName: string; email: string; failedAttempts: number }>;
  recentEvents: Array<{
    id: number;
    eventType: string;
    severity: string;
    description: string;
    timestamp: string;
    ipAddress: string | null;
    user: { userId: number; userName: string; email: string } | null;
  }>;
  summary: {
    totalEvents: number;
    highSeverityEvents: number;
    criticalSeverityEvents: number;
    suspiciousActivities: number;
    failedLogins: number;
  };
}

export default function SecurityAnalytics() {
  const [analytics, setAnalytics] = useState<SecurityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      console.log('Fetching security analytics...');
      const response = await fetch(`/api/security/analytics?days=${timeRange}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Analytics data:', data);
        setAnalytics(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch analytics:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'LOGIN_FAILED': return 'text-red-600';
      case 'SUSPICIOUS_ACTIVITY': return 'text-orange-600';
      case 'SECURITY_ALERT': return 'text-yellow-600';
      case 'LOGIN_SUCCESS': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };



  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2 rounded">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" disabled className="transition-all duration-200">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Loading security data...</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load security analytics</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 rounded">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700" 
                  onClick={fetchAnalytics}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh security analytics data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>



             {/* Tabs for Detailed Analysis */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
         <TabsList className="grid w-full grid-cols-4 rounded">
          <TabsTrigger value="overview" className="flex items-center gap-2 rounded">
            <Activity className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="threats" className="flex items-center gap-2 rounded">
            <Shield className="w-4 h-4" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 rounded">
            <Users className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2 rounded">
            <Clock className="w-4 h-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Type Distribution */}
            <Card className="bg-white rounded-xl shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Event Type Distribution
                </CardTitle>
                <CardDescription>Security events by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.eventTypeDistribution).map(([eventType, count]) => (
                    <div key={eventType} className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${getEventTypeColor(eventType)}`}>
                        {eventType.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Severity Distribution */}
            <Card className="bg-white rounded-xl shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Severity Distribution
                </CardTitle>
                <CardDescription>Events by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.severityDistribution).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`}></div>
                        <span className="text-sm font-medium">{severity}</span>
                      </div>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Threats Tab */}
        <TabsContent value="threats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Suspicious IPs */}
            <Card className="bg-white rounded-xl shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Top Suspicious IPs
                </CardTitle>
                <CardDescription>IP addresses with suspicious activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topSuspiciousIPs && analytics.topSuspiciousIPs.length > 0 ? (
                    analytics.topSuspiciousIPs.map((ip, index) => (
                      <div key={ip.ipAddress} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{ip.ipAddress}</span>
                        </div>
                        <Badge variant="destructive">{ip.count} events</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No suspicious IPs found</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Failed Logins by User */}
            <Card className="bg-white rounded-xl shadow-md border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Failed Logins by User
                </CardTitle>
                <CardDescription>Users with most failed login attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.failedLoginUsers && analytics.failedLoginUsers.length > 0 ? (
                    analytics.failedLoginUsers.map((user) => (
                      <div key={user.userId} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="destructive">{user.failedAttempts} attempts</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No failed login attempts found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card className="bg-white rounded-xl shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                User Security Analysis
              </CardTitle>
              <CardDescription>Detailed user security metrics and behavior patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Failed Login Users */}
                <div>
                  <h4 className="font-semibold mb-3">Failed Login Attempts</h4>
                  <div className="space-y-2">
                    {analytics.failedLoginUsers && analytics.failedLoginUsers.length > 0 ? (
                      analytics.failedLoginUsers.map((user) => (
                        <div key={user.userId} className="flex items-center justify-between p-3 bg-red-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{user.userName}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">{user.failedAttempts} attempts</Badge>
                            <XCircle className="w-4 h-4 text-red-500" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No failed login attempts found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card className="bg-white rounded-xl shadow-md border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Recent Security Events
              </CardTitle>
              <CardDescription>Latest security events timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recentEvents && analytics.recentEvents.length > 0 ? (
                  analytics.recentEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 rounded border-l-4 border-l-gray-200 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getSeverityColor(event.severity)}`}></div>
                        <div>
                          <p className="text-sm font-medium">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.user?.userName || 'Unknown'} • {event.ipAddress || 'Unknown IP'} • {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                                             <Badge 
                         variant="outline" 
                         className={`${getEventTypeColor(event.eventType)} bg-opacity-10 border-current`}
                         style={{
                           backgroundColor: getEventTypeColor(event.eventType).includes('red') ? 'rgba(239, 68, 68, 0.1)' :
                           getEventTypeColor(event.eventType).includes('orange') ? 'rgba(249, 115, 22, 0.1)' :
                           getEventTypeColor(event.eventType).includes('yellow') ? 'rgba(234, 179, 8, 0.1)' :
                           getEventTypeColor(event.eventType).includes('green') ? 'rgba(34, 197, 94, 0.1)' :
                           'rgba(59, 130, 246, 0.1)'
                         }}
                       >
                         {event.eventType.replace('_', ' ')}
                       </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No security events found</p>
                    <p className="text-sm text-gray-400">Security logs will appear here when events occur</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 