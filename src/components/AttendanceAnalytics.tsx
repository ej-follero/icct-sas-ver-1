'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  BarChart3,
  Target,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  CartesianGrid, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { InstructorAttendance, RiskLevel, InstructorStatus } from '@/types/instructor-attendance';

interface AttendanceAnalyticsProps {
  instructors: InstructorAttendance[];
  loading?: boolean;
}

export function AttendanceAnalytics({ instructors, loading = false }: AttendanceAnalyticsProps) {
  const analytics = useMemo(() => {
    if (!instructors.length) return null;

    const totalInstructors = instructors.length;
    const activeInstructors = instructors.filter(i => i.status === InstructorStatus.ACTIVE).length;
    const inactiveInstructors = totalInstructors - activeInstructors;

    // Attendance metrics
    const totalClasses = instructors.reduce((sum, i) => sum + i.totalScheduledClasses, 0);
    const attendedClasses = instructors.reduce((sum, i) => sum + i.attendedClasses, 0);
    const absentClasses = instructors.reduce((sum, i) => sum + i.absentClasses, 0);
    const lateClasses = instructors.reduce((sum, i) => sum + i.lateClasses, 0);
    const onLeaveClasses = instructors.reduce((sum, i) => sum + i.onLeaveClasses, 0);

    const overallAttendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;
    const averageAttendanceRate = instructors.reduce((sum, i) => sum + i.attendanceRate, 0) / totalInstructors;

    // Risk level distribution
    const riskLevels = {
      none: instructors.filter(i => i.riskLevel === RiskLevel.NONE).length,
      low: instructors.filter(i => i.riskLevel === RiskLevel.LOW).length,
      medium: instructors.filter(i => i.riskLevel === RiskLevel.MEDIUM).length,
      high: instructors.filter(i => i.riskLevel === RiskLevel.HIGH).length,
    };

    // Department breakdown
    const departmentStats = instructors.reduce((acc, instructor) => {
      const dept = instructor.department;
      if (!acc[dept]) {
        acc[dept] = {
          name: dept,
          instructors: 0,
          totalClasses: 0,
          attendedClasses: 0,
          attendanceRate: 0
        };
      }
      acc[dept].instructors++;
      acc[dept].totalClasses += instructor.totalScheduledClasses;
      acc[dept].attendedClasses += instructor.attendedClasses;
      acc[dept].attendanceRate = acc[dept].totalClasses > 0 
        ? (acc[dept].attendedClasses / acc[dept].totalClasses) * 100 
        : 0;
      return acc;
    }, {} as Record<string, any>);

    const departmentData = Object.values(departmentStats).map((dept: any) => ({
      name: dept.name,
      attendanceRate: parseFloat(dept.attendanceRate.toFixed(1)),
      instructors: dept.instructors
    }));

    // Weekly pattern (aggregate)
    const weeklyPattern = {
      monday: instructors.reduce((sum, i) => sum + i.weeklyPattern.monday, 0) / totalInstructors,
      tuesday: instructors.reduce((sum, i) => sum + i.weeklyPattern.tuesday, 0) / totalInstructors,
      wednesday: instructors.reduce((sum, i) => sum + i.weeklyPattern.wednesday, 0) / totalInstructors,
      thursday: instructors.reduce((sum, i) => sum + i.weeklyPattern.thursday, 0) / totalInstructors,
      friday: instructors.reduce((sum, i) => sum + i.weeklyPattern.friday, 0) / totalInstructors,
      saturday: instructors.reduce((sum, i) => sum + i.weeklyPattern.saturday, 0) / totalInstructors,
      sunday: instructors.reduce((sum, i) => sum + i.weeklyPattern.sunday, 0) / totalInstructors,
    };

    const weeklyData = [
      { day: 'Mon', rate: parseFloat(weeklyPattern.monday.toFixed(1)) },
      { day: 'Tue', rate: parseFloat(weeklyPattern.tuesday.toFixed(1)) },
      { day: 'Wed', rate: parseFloat(weeklyPattern.wednesday.toFixed(1)) },
      { day: 'Thu', rate: parseFloat(weeklyPattern.thursday.toFixed(1)) },
      { day: 'Fri', rate: parseFloat(weeklyPattern.friday.toFixed(1)) },
      { day: 'Sat', rate: parseFloat(weeklyPattern.saturday.toFixed(1)) },
      { day: 'Sun', rate: parseFloat(weeklyPattern.sunday.toFixed(1)) },
    ];

    // Risk level pie chart data
    const riskLevelData = [
      { name: 'No Risk', value: riskLevels.none, color: '#10b981' },
      { name: 'Low Risk', value: riskLevels.low, color: '#3b82f6' },
      { name: 'Medium Risk', value: riskLevels.medium, color: '#f59e0b' },
      { name: 'High Risk', value: riskLevels.high, color: '#ef4444' },
    ].filter(item => item.value > 0);

    return {
      totalInstructors,
      activeInstructors,
      inactiveInstructors,
      totalClasses,
      attendedClasses,
      absentClasses,
      lateClasses,
      onLeaveClasses,
      overallAttendanceRate: parseFloat(overallAttendanceRate.toFixed(1)),
      averageAttendanceRate: parseFloat(averageAttendanceRate.toFixed(1)),
      riskLevels,
      departmentData,
      weeklyData,
      riskLevelData
    };
  }, [instructors]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border border-blue-200">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="border border-blue-200">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No data available for analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Instructors</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalInstructors}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.activeInstructors} active, {analytics.inactiveInstructors} inactive
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overallAttendanceRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.attendedClasses} of {analytics.totalClasses} classes
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageAttendanceRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  Per instructor average
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.riskLevels.high}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Need attention
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Attendance Pattern */}
        <Card className="border border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Attendance Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                  labelFormatter={(label) => `${label}day`}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card className="border border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Department Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                />
                <Bar dataKey="attendanceRate" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Risk Level Distribution */}
      {analytics.riskLevelData.length > 0 && (
        <Card className="border border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Risk Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.riskLevelData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.riskLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 