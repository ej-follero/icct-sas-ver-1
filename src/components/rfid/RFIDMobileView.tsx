"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  RefreshCw,
  Download,
  Filter,
  Search,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import DataChart from "@/components/DataChart";
// Local copy of filter options since Advanced Filters were removed
export interface RFIDFilterOptions {
  dateRange: { from: Date | undefined; to: Date | undefined };
  status: string[];
  location: string[];
  readerId: string;
  tagId: string;
  studentName: string;
}

interface RFIDMobileViewProps {
  stats: any;
  tagStatusData: any[];
  readerStatusData: any[];
  scanTrendsData: any[];
  recentLogs: any[];
  filters: RFIDFilterOptions;
  onFiltersChange: (filters: RFIDFilterOptions) => void;
  onRefresh: () => void;
  onExport: (type: string, format: string) => void;
  isLoading?: boolean;
}

export default function RFIDMobileView({
  stats,
  tagStatusData,
  readerStatusData,
  scanTrendsData,
  recentLogs,
  filters,
  onFiltersChange,
  onRefresh,
  onExport,
  isLoading = false
}: RFIDMobileViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleCardExpansion = useCallback((cardId: string) => {
    setExpandedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const isCardExpanded = useCallback((cardId: string) => expandedCards.includes(cardId), [expandedCards]);

  const handleChartClick = useCallback((data: any, index: number) => {
    console.log('Chart data point clicked:', data, index);
    // Handle chart interaction for mobile
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setError(null);
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh data');
    }
  }, [onRefresh]);

  const handleExport = useCallback(async (type: string, format: string) => {
    try {
      setError(null);
      await onExport(type, format);
    } catch (error) {
      console.error('Export error:', error);
      setError(error instanceof Error ? error.message : 'Failed to export data');
    }
  }, [onExport]);

  const handleFiltersChange = useCallback((newFilters: RFIDFilterOptions) => {
    try {
      setError(null);
      onFiltersChange(newFilters);
    } catch (error) {
      console.error('Filter change error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update filters');
    }
  }, [onFiltersChange]);

  // Memoized stats for better performance
  const memoizedStats = useMemo(() => ({
    totalTags: stats?.totalTags || 0,
    activeReaders: stats?.activeReaders || 0,
    todayScans: stats?.todayScans || 0,
    totalScans: stats?.totalScans || 0
  }), [stats]);

  // Memoized recent logs for better performance
  const memoizedRecentLogs = useMemo(() => 
    recentLogs?.slice(0, 5) || [], 
    [recentLogs]
  );

  // Reset error when component mounts
  useEffect(() => {
    setError(null);
  }, []);

  // Validate props
  if (!onFiltersChange || !onRefresh || !onExport) {
    console.error('RFIDMobileView: Missing required props');
    return null;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Mobile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">RFID Dashboard</h1>
          <p className="text-sm text-gray-600">Mobile View</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="charts" className="text-xs">Charts</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Total Tags</p>
                  <p className="text-2xl font-bold text-blue-600">{memoizedStats.totalTags}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Active Readers</p>
                  <p className="text-2xl font-bold text-green-600">{memoizedStats.activeReaders}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Today&apos;s Scans</p>
                  <p className="text-2xl font-bold text-purple-600">{memoizedStats.todayScans}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardContent className="p-0">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Total Scans</p>
                  <p className="text-2xl font-bold text-orange-600">{memoizedStats.totalScans}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleExport('all', 'csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setActiveTab('charts')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Charts
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setActiveTab('activity')}
              >
                <Activity className="h-4 w-4 mr-2" />
                Recent Activity
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {/* Tag Status Chart */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleCardExpansion('tag-status')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Tag Status
                </CardTitle>
                {isCardExpanded('tag-status') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {isCardExpanded('tag-status') && (
              <CardContent>
                <DataChart
                  type="pie"
                  data={tagStatusData}
                  height={200}
                  title="Tag Status Distribution"
                />
              </CardContent>
            )}
          </Card>

          {/* Reader Status Chart */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleCardExpansion('reader-status')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Reader Status
                </CardTitle>
                {isCardExpanded('reader-status') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {isCardExpanded('reader-status') && (
              <CardContent>
                <DataChart
                  type="pie"
                  data={readerStatusData}
                  height={200}
                  colors={["#22c55e", "#ef4444"]}
                  title="Reader Status Distribution"
                />
              </CardContent>
            )}
          </Card>

          {/* Scan Trends Chart */}
          <Card>
            <CardHeader 
              className="pb-2 cursor-pointer"
              onClick={() => toggleCardExpansion('scan-trends')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Scan Trends
                </CardTitle>
                {isCardExpanded('scan-trends') ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            {isCardExpanded('scan-trends') && (
              <CardContent>
                <DataChart
                  type="bar"
                  data={scanTrendsData}
                  height={200}
                  colors={["#3b82f6"]}
                  title="Scan Trends Over Time"
                />
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          {/* Recent Activity List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent RFID Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memoizedRecentLogs.map((log, index) => (
                  <div key={log.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={log.status === 'SUCCESS' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {log.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-1">
                        {log.studentName || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {log.location} • {log.tagId}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {memoizedRecentLogs.length > 5 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => console.log('View all activity')}
                >
                  View All Activity
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mobile Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search RFID logs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                value={filters.studentName || ''}
                onChange={(e) => handleFiltersChange({
                  ...filters,
                  studentName: e.target.value
                })}
              />
            </div>

            {/* Mobile Filter Options */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['SUCCESS', 'ERROR', 'TIMEOUT'].map((status) => (
                    <Badge
                      key={status}
                      variant={filters.status.includes(status) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const newStatus = filters.status.includes(status)
                          ? filters.status.filter((s: string) => s !== status)
                          : [...filters.status, status];
                        handleFiltersChange({ ...filters, status: newStatus });
                      }}
                    >
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Location</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Room 101', 'Room 102', 'Library', 'Lab', 'Unknown'].map((location) => (
                    <Badge
                      key={location}
                      variant={filters.location.includes(location) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const newLocation = filters.location.includes(location)
                          ? filters.location.filter((l: string) => l !== location)
                          : [...filters.location, location];
                        handleFiltersChange({ ...filters, location: newLocation });
                      }}
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleFiltersChange({
                  dateRange: { from: undefined, to: undefined },
                  status: [],
                  location: [],
                  readerId: '',
                  tagId: '',
                  studentName: ''
                });
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
