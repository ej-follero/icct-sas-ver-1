

// Enhanced data interfaces
export interface AttendanceData {
  id: string;
  name: string;
  department: string;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  attendanceRate: number;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  lastAttendance: Date;
  status: 'active' | 'inactive';
  subjects: string[];
  weeklyData: WeeklyData[];
  // Instructor-specific fields
  classesTaught?: number;
  classesMissed?: number;
  complianceScore?: number;
  notificationCount?: number;
  teachingLoad?: number;
  substituteRequired?: boolean;
  // Student-specific fields
  parentNotifications?: number;
  attendanceStreak?: number;
}

export interface WeeklyData {
  week: string;
  attendanceRate: number;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface RiskLevelData {
  level: 'none' | 'low' | 'medium' | 'high';
  count: number;
  percentage: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

export interface DepartmentStats {
  name: string;
  code: string;
  totalClasses: number;
  attendedClasses: number;
  attendanceRate: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface AnalyticsData {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  riskLevels: Record<string, number>;
  weeklyData: WeeklyData[];
  riskLevelData: RiskLevelData[];
  departmentStats: DepartmentStats[];
  historicalData: any[];
  timeOfDayData: any[];
  comparativeData: any[];
  subjectPerformance: any[];
  goalTracking: any[];
  performanceRanking: any[];
  drillDownData: Record<string, any>;
  crossFilterData: Record<string, any>;
  // Instructor-specific analytics
  totalClassesTaught?: number;
  totalClassesMissed?: number;
  averageComplianceScore?: number;
  totalNotificationsSent?: number;
  substituteRequiredCount?: number;
  teachingLoadDistribution?: Record<string, number>;
  complianceTrends?: WeeklyData[];
  // Student-specific analytics
  totalParentNotifications?: number;
  attendanceStreakData?: Record<string, number>;
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dataQuality: number;
}

export const calculateAttendanceRate = (attended: number, total: number): number => {
  return total > 0 ? (attended / total) * 100 : 0;
};

export const getRiskLevelColor = (level: string): string => {
  const colors = {
    none: '#10b981',
    low: '#3b82f6',
    medium: '#f59e0b',
    high: '#ef4444'
  };
  return colors[level as keyof typeof colors] || '#6b7280';
};

export const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return 'up';
    case 'down': return 'down';
    default: return 'stable';
  }
};

export const calculateWeeklyAttendanceData = (data: AttendanceData[]): WeeklyData[] => {
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];
  return weeks.map((week, index) => {
    const weekData = data.filter(item => 
      item.weeklyData && item.weeklyData[index]
    );
    
    const totalClasses = weekData.reduce((sum, item) => sum + (item.weeklyData[index]?.totalClasses || 0), 0);
    const attendedClasses = weekData.reduce((sum, item) => sum + (item.weeklyData[index]?.attendedClasses || 0), 0);
    const absentClasses = weekData.reduce((sum, item) => sum + (item.weeklyData[index]?.absentClasses || 0), 0);
    const lateClasses = weekData.reduce((sum, item) => sum + (item.weeklyData[index]?.lateClasses || 0), 0);
    
    const attendanceRate = calculateAttendanceRate(attendedClasses, totalClasses);
    
    return {
      week,
      attendanceRate,
      totalClasses,
      attendedClasses,
      absentClasses,
      lateClasses,
      trend: index > 0 ? (attendanceRate > 85 ? 'up' : attendanceRate < 75 ? 'down' : 'stable') : 'stable',
      change: index > 0 ? attendanceRate - 85 : 0
    };
  });
};

export const validateAttendanceData = (data: AttendanceData[]): DataValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let dataQuality = 100;

  if (!data || data.length === 0) {
    errors.push('No data provided');
    dataQuality = 0;
  }

  data.forEach((item, index) => {
    if (!item.name) {
      errors.push(`Item ${index}: Missing name`);
      dataQuality -= 10;
    }
    if (item.attendanceRate < 0 || item.attendanceRate > 100) {
      warnings.push(`Item ${index}: Attendance rate out of valid range`);
      dataQuality -= 5;
    }
    if (item.totalClasses < item.attendedClasses) {
      errors.push(`Item ${index}: Invalid attendance data`);
      dataQuality -= 15;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    dataQuality: Math.max(0, dataQuality)
  };
};

export const processRealTimeData = (data: AttendanceData[], type: 'instructor' | 'student' = 'student'): AnalyticsData => {
  const validation = validateAttendanceData(data);
  
  if (!validation.isValid) {
    console.warn('Data validation failed:', validation.errors);
  }

  const totalCount = data.length;
  const activeCount = data.filter(item => item.status === 'active').length;
  const inactiveCount = totalCount - activeCount;
  
  const attendedClasses = data.reduce((sum, item) => sum + item.attendedClasses, 0);
  const absentClasses = data.reduce((sum, item) => sum + item.absentClasses, 0);
  const lateClasses = data.reduce((sum, item) => sum + item.lateClasses, 0);
  
  const riskLevels = data.reduce((acc, item) => {
    acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const weeklyData = calculateWeeklyAttendanceData(data);
  
  const riskLevelData: RiskLevelData[] = Object.entries(riskLevels).map(([level, count]) => ({
    level: level as 'none' | 'low' | 'medium' | 'high',
    count,
    percentage: (count / totalCount) * 100,
    color: getRiskLevelColor(level),
    trend: count > 5 ? 'up' : count < 2 ? 'down' : 'stable'
  }));

  const departmentStats = Object.entries(
    data.reduce((acc, item) => {
      if (!acc[item.department]) {
        acc[item.department] = {
          totalClasses: 0,
          attendedClasses: 0,
          count: 0
        };
      }
      acc[item.department].totalClasses += item.totalClasses;
      acc[item.department].attendedClasses += item.attendedClasses;
      acc[item.department].count += 1;
      return acc;
    }, {} as Record<string, any>)
  ).map(([name, dept]) => {
    // Extract department code from the department field (format: "CODE - NAME")
    const codeMatch = name.match(/^([A-Z0-9]+)\s*-\s*(.+)$/);
    const code = codeMatch ? codeMatch[1] : name;
    const displayName = codeMatch ? codeMatch[2] : name;
    
    return {
      name: displayName,
      code,
      totalClasses: dept.totalClasses,
      attendedClasses: dept.attendedClasses,
      attendanceRate: calculateAttendanceRate(dept.attendedClasses, dept.totalClasses),
      count: dept.count,
      trend: (dept.attendanceRate > 85 ? 'up' : dept.attendanceRate < 75 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      change: dept.attendanceRate - 85
    };
  });

  // Base analytics data
  const baseAnalytics: AnalyticsData = {
    totalCount,
    activeCount,
    inactiveCount,
    attendedClasses,
    absentClasses,
    lateClasses,
    riskLevels,
    weeklyData,
    riskLevelData,
    departmentStats,
    historicalData: [],
    timeOfDayData: [],
    comparativeData: [],
    subjectPerformance: [],
    goalTracking: [],
    performanceRanking: [],
    drillDownData: {},
    crossFilterData: {}
  };

  // Add instructor-specific analytics
  if (type === 'instructor') {
    const totalClassesTaught = data.reduce((sum, item) => sum + (item.classesTaught || 0), 0);
    const totalClassesMissed = data.reduce((sum, item) => sum + (item.classesMissed || 0), 0);
    const averageComplianceScore = data.reduce((sum, item) => sum + (item.complianceScore || 0), 0) / totalCount;
    const totalNotificationsSent = data.reduce((sum, item) => sum + (item.notificationCount || 0), 0);
    const substituteRequiredCount = data.filter(item => item.substituteRequired).length;

    const teachingLoadDistribution = data.reduce((acc, item) => {
      const load = item.teachingLoad || 0;
      if (load > 0) {
        acc[item.department] = (acc[item.department] || 0) + load;
      }
      return acc;
    }, {} as Record<string, number>);

    const complianceTrends = weeklyData.map((week, index) => ({
      ...week,
      complianceScore: Math.max(0, 100 - (week.absentClasses / week.totalClasses) * 100)
    }));

    return {
      ...baseAnalytics,
      totalClassesTaught,
      totalClassesMissed,
      averageComplianceScore,
      totalNotificationsSent,
      substituteRequiredCount,
      teachingLoadDistribution,
      complianceTrends
    };
  }

  // Add student-specific analytics
  if (type === 'student') {
    const totalParentNotifications = data.reduce((sum, item) => sum + (item.parentNotifications || 0), 0);
    const attendanceStreakData = data.reduce((acc, item) => {
      const streak = item.attendanceStreak || 0;
      const streakKey = streak > 10 ? '10+ days' : streak > 5 ? '5-10 days' : streak > 0 ? '1-5 days' : '0 days';
      acc[streakKey] = (acc[streakKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...baseAnalytics,
      totalParentNotifications,
      attendanceStreakData
    };
  }

  return baseAnalytics;
}; 