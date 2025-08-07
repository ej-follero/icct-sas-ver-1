import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useTrends, 
  useComparisons, 
  useBreakdown, 
  useRankings, 
  useSubjectAnalytics,
  useRealTimeStats,
  useAnalyticsCache,
  AnalyticsFilters 
} from '@/hooks/useAnalytics';
import { RefreshCw, TrendingUp, BarChart3, PieChart, Trophy, BookOpen, Activity } from 'lucide-react';

interface AnalyticsDemoProps {
  filters?: AnalyticsFilters;
}

export function AnalyticsDemo({ filters = {} }: AnalyticsDemoProps) {
  const { clearCache, getCacheStats } = useAnalyticsCache();

  // Example usage of different analytics hooks
  const weeklyTrends = useTrends('weekly', filters, {
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
    onError: (error) => console.error('Weekly trends error:', error)
  });

  const departmentComparisons = useComparisons('department', filters, {
    autoRefresh: false,
    onError: (error) => console.error('Department comparisons error:', error)
  });

  const attendanceBreakdown = useBreakdown('attendance', filters, {
    autoRefresh: false,
    onError: (error) => console.error('Attendance breakdown error:', error)
  });

  const performanceRankings = useRankings('performance', filters, {
    autoRefresh: false,
    onError: (error) => console.error('Performance rankings error:', error)
  });

  const subjectPerformance = useSubjectAnalytics('performance', filters, {
    autoRefresh: false,
    onError: (error) => console.error('Subject performance error:', error)
  });

  const realTimeStats = useRealTimeStats(filters, {
    refreshInterval: 30000, // 30 seconds
    onError: (error) => console.error('Real-time stats error:', error)
  });

  const handleRefreshAll = () => {
    weeklyTrends.refresh();
    departmentComparisons.refresh();
    attendanceBreakdown.refresh();
    performanceRankings.refresh();
    subjectPerformance.refresh();
    realTimeStats.refresh();
  };

  const handleClearCache = () => {
    clearCache();
    console.log('Cache cleared');
  };

  const cacheStats = getCacheStats();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Demo</h2>
          <p className="text-gray-600">Demonstrating backend analytics integration</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefreshAll} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Button onClick={handleClearCache} variant="outline" size="sm">
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Cache Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Cache Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Cache Size:</span> {cacheStats.size}/{cacheStats.maxSize}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {cacheStats.duration / 1000}s
            </div>
            <div>
              <span className="font-medium">Status:</span> 
              <Badge variant={cacheStats.size > 0 ? "default" : "secondary"} className="ml-2">
                {cacheStats.size > 0 ? "Active" : "Empty"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Real-time Statistics
            {realTimeStats.loading && <RefreshCw className="w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {realTimeStats.error ? (
            <div className="text-red-600">Error: {realTimeStats.error.message}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{realTimeStats.data.totalStudents}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{realTimeStats.data.presentToday}</div>
                <div className="text-sm text-gray-600">Present Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{realTimeStats.data.lateToday}</div>
                <div className="text-sm text-gray-600">Late Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{realTimeStats.data.attendanceRate}%</div>
                <div className="text-sm text-gray-600">Attendance Rate</div>
              </div>
            </div>
          )}
          {realTimeStats.lastUpdated && (
            <div className="text-xs text-gray-500 mt-2">
              Last updated: {realTimeStats.lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Trends
              {weeklyTrends.loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyTrends.error ? (
              <div className="text-red-600">Error: {weeklyTrends.error.message}</div>
            ) : (
              <div className="space-y-2">
                {weeklyTrends.data.slice(0, 3).map((trend: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{trend.period}</span>
                    <Badge variant="outline">{trend.attendanceRate}%</Badge>
                  </div>
                ))}
                {weeklyTrends.data.length === 0 && (
                  <div className="text-gray-500 text-sm">No data available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Comparisons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Department Comparisons
              {departmentComparisons.loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departmentComparisons.error ? (
              <div className="text-red-600">Error: {departmentComparisons.error.message}</div>
            ) : (
              <div className="space-y-2">
                {departmentComparisons.data.slice(0, 3).map((dept: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{dept.dept}</span>
                    <Badge variant="outline">{dept.current}%</Badge>
                  </div>
                ))}
                {departmentComparisons.data.length === 0 && (
                  <div className="text-gray-500 text-sm">No data available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Attendance Breakdown
              {attendanceBreakdown.loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceBreakdown.error ? (
              <div className="text-red-600">Error: {attendanceBreakdown.error.message}</div>
            ) : (
              <div className="space-y-2">
                {attendanceBreakdown.data.slice(0, 3).map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="outline">{item.percentage}%</Badge>
                  </div>
                ))}
                {attendanceBreakdown.data.length === 0 && (
                  <div className="text-gray-500 text-sm">No data available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Performance Rankings
              {performanceRankings.loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performanceRankings.error ? (
              <div className="text-red-600">Error: {performanceRankings.error.message}</div>
            ) : (
              <div className="space-y-2">
                {performanceRankings.data.slice(0, 3).map((ranking: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{ranking.name}</span>
                    <Badge variant="outline">{ranking.attendanceRate}%</Badge>
                  </div>
                ))}
                {performanceRankings.data.length === 0 && (
                  <div className="text-gray-500 text-sm">No data available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Subject Performance
              {subjectPerformance.loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectPerformance.error ? (
              <div className="text-red-600">Error: {subjectPerformance.error.message}</div>
            ) : (
              <div className="space-y-2">
                {subjectPerformance.data.slice(0, 3).map((subject: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{subject.subject}</span>
                    <Badge variant="outline">{subject.attendanceRate}%</Badge>
                  </div>
                ))}
                {subjectPerformance.data.length === 0 && (
                  <div className="text-gray-500 text-sm">No data available</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">1. Import the hooks:</h4>
              <pre className="bg-gray-100 p-2 rounded mt-1">
                {`import { useTrends, useComparisons, useBreakdown } from '@/hooks/useAnalytics';`}
              </pre>
            </div>
            <div>
              <h4 className="font-medium">2. Use in your component:</h4>
              <pre className="bg-gray-100 p-2 rounded mt-1">
                {`const trends = useTrends('weekly', filters, {
  autoRefresh: true,
  refreshInterval: 60000
});`}
              </pre>
            </div>
            <div>
              <h4 className="font-medium">3. Access data and states:</h4>
              <pre className="bg-gray-100 p-2 rounded mt-1">
                {`const { data, loading, error, refresh } = trends;`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 