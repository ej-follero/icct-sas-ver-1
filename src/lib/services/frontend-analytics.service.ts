export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: number;
  courseId?: number;
  yearLevel?: string;
  limit?: number;
}

export interface TrendsData {
  period: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
  uniqueStudents: number;
  attendanceRate: number;
}

export interface ComparisonData {
  id: string | number;
  name: string;
  code?: string;
  department?: string;
  course?: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
  uniqueStudents: number;
  attendanceRate: number;
}

export interface BreakdownData {
  status?: string;
  riskLevel?: string;
  label: string;
  count: number;
  uniqueStudents?: number;
  percentage: number;
  color: string;
  bgColor: string;
  students?: any[];
}

export interface RankingData {
  rank?: number;
  studentId?: number;
  name?: string;
  studentIdNum?: string;
  yearLevel?: string;
  department?: string;
  course?: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
  attendanceRate: number;
  performance?: number;
}

export interface SubjectData {
  subjectId?: number;
  subjectName: string;
  subjectCode?: string;
  department?: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
  uniqueStudents: number;
  attendanceRate: number;
}

export class FrontendAnalyticsService {
  private baseUrl = '/api/attendance/analytics';

  // Generic fetch method with error handling
  private async fetchAnalytics<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`, window.location.origin);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error(`Error fetching analytics from ${endpoint}:`, error);
      throw error;
    }
  }

  // Trends Analytics
  async getTrends(
    type: 'weekly' | 'monthly' | 'yearly' | 'timeOfDay' | 'dayOfWeek',
    filters: AnalyticsFilters = {}
  ): Promise<TrendsData[]> {
    return this.fetchAnalytics<TrendsData[]>('/trends', {
      type,
      ...filters
    });
  }

  // Comparisons Analytics
  async getComparisons(
    type: 'department' | 'course' | 'yearLevel' | 'section',
    filters: AnalyticsFilters = {}
  ): Promise<ComparisonData[]> {
    return this.fetchAnalytics<ComparisonData[]>('/comparisons', {
      type,
      ...filters
    });
  }

  // Breakdown Analytics
  async getBreakdown(
    type: 'attendance' | 'riskLevel',
    filters: AnalyticsFilters = {}
  ): Promise<BreakdownData[]> {
    return this.fetchAnalytics<BreakdownData[]>('/breakdown', {
      type,
      ...filters
    });
  }

  // Rankings Analytics
  async getRankings(
    type: 'performance' | 'goalAchievement' | 'statistical',
    filters: AnalyticsFilters = {}
  ): Promise<RankingData[] | any> {
    return this.fetchAnalytics<any>('/rankings', {
      type,
      ...filters
    });
  }

  // Subject Analytics
  async getSubjectAnalytics(
    type: 'performance' | 'trends' | 'timeAnalysis' | 'comparison' | 'riskAnalysis' | 'patterns',
    filters: AnalyticsFilters = {}
  ): Promise<SubjectData[] | any> {
    return this.fetchAnalytics<any>('/subjects', {
      type,
      ...filters
    });
  }

  // Batch analytics for dashboard
  async getDashboardAnalytics(filters: AnalyticsFilters = {}) {
    try {
      const [
        weeklyTrends,
        departmentComparison,
        attendanceBreakdown,
        performanceRanking,
        subjectPerformance
      ] = await Promise.all([
        this.getTrends('weekly', filters),
        this.getComparisons('department', { ...filters, limit: 5 }),
        this.getBreakdown('attendance', filters),
        this.getRankings('performance', { ...filters, limit: 10 }),
        this.getSubjectAnalytics('performance', { ...filters, limit: 5 })
      ]);

      return {
        weeklyTrends,
        departmentComparison,
        attendanceBreakdown,
        performanceRanking,
        subjectPerformance,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }

  // Get all analytics for a specific tab
  async getTabAnalytics(tabName: string, filters: AnalyticsFilters = {}) {
    try {
      switch (tabName) {
        case 'trends':
          const [weekly, monthly, timeOfDay, dayOfWeek] = await Promise.all([
            this.getTrends('weekly', filters),
            this.getTrends('monthly', filters),
            this.getTrends('timeOfDay', filters),
            this.getTrends('dayOfWeek', filters)
          ]);
          return { weekly, monthly, timeOfDay, dayOfWeek };

        case 'comparison':
          const [department, course, yearLevel, section] = await Promise.all([
            this.getComparisons('department', filters),
            this.getComparisons('course', filters),
            this.getComparisons('yearLevel', filters),
            this.getComparisons('section', filters)
          ]);
          return { department, course, yearLevel, section };

        case 'breakdown':
          const [attendance, riskLevel] = await Promise.all([
            this.getBreakdown('attendance', filters),
            this.getBreakdown('riskLevel', filters)
          ]);
          return { attendance, riskLevel };

        case 'subjects':
          const [performance, trends, timeAnalysis, comparison, riskAnalysis, patterns] = await Promise.all([
            this.getSubjectAnalytics('performance', filters),
            this.getSubjectAnalytics('trends', filters),
            this.getSubjectAnalytics('timeAnalysis', filters),
            this.getSubjectAnalytics('comparison', filters),
            this.getSubjectAnalytics('riskAnalysis', filters),
            this.getSubjectAnalytics('patterns', filters)
          ]);
          return { performance, trends, timeAnalysis, comparison, riskAnalysis, patterns };

        default:
          throw new Error(`Unknown tab: ${tabName}`);
      }
    } catch (error) {
      console.error(`Error fetching ${tabName} analytics:`, error);
      throw error;
    }
  }

  // Real-time analytics (if implemented)
  async getRealTimeStats(filters: AnalyticsFilters = {}) {
    try {
      const response = await fetch('/api/attendance/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
      throw error;
    }
  }

  // Utility methods for data transformation
  transformTrendsForChart(data: TrendsData[]) {
    return data.map(item => ({
      name: typeof item.period === 'string' ? item.period : new Date(item.period).toLocaleDateString(),
      present: item.present,
      late: item.late,
      absent: item.absent,
      excused: item.excused,
      total: item.total,
      rate: item.attendanceRate
    }));
  }

  transformComparisonsForChart(data: ComparisonData[]) {
    return data.map(item => ({
      name: item.name,
      rate: item.attendanceRate,
      present: item.present,
      late: item.late,
      absent: item.absent,
      excused: item.excused,
      total: item.total
    }));
  }

  transformBreakdownForChart(data: BreakdownData[]) {
    return data.map(item => ({
      name: item.label,
      value: item.count,
      percentage: item.percentage,
      color: item.color,
      bgColor: item.bgColor
    }));
  }

  transformRankingsForChart(data: RankingData[]) {
    return data.map(item => ({
      name: item.name || `Student ${item.studentId}`,
      rate: item.attendanceRate,
      rank: item.rank,
      present: item.present,
      late: item.late,
      absent: item.absent,
      excused: item.excused
    }));
  }

  transformSubjectsForChart(data: SubjectData[]) {
    return data.map(item => ({
      name: item.subjectName,
      rate: item.attendanceRate,
      present: item.present,
      late: item.late,
      absent: item.absent,
      excused: item.excused,
      total: item.total
    }));
  }

  // Error handling and fallback data
  getFallbackData(type: string) {
    const fallbackData = {
      trends: [
        { name: 'Week 1', present: 0, late: 0, absent: 0, excused: 0, total: 0, rate: 0 },
        { name: 'Week 2', present: 0, late: 0, absent: 0, excused: 0, total: 0, rate: 0 }
      ],
      comparisons: [
        { name: 'No Data', rate: 0, present: 0, late: 0, absent: 0, excused: 0, total: 0 }
      ],
      breakdown: [
        { name: 'No Data', value: 0, percentage: 0, color: '#6b7280', bgColor: '#f3f4f6' }
      ],
      rankings: [
        { name: 'No Data', rate: 0, rank: 0, present: 0, late: 0, absent: 0, excused: 0 }
      ],
      subjects: [
        { name: 'No Data', rate: 0, present: 0, late: 0, absent: 0, excused: 0, total: 0 }
      ]
    };

    return fallbackData[type as keyof typeof fallbackData] || [];
  }
}

// Export singleton instance
export const frontendAnalyticsService = new FrontendAnalyticsService(); 