export interface RFIDDashboardStats {
  totalReaders: number;
  activeReaders: number;
  totalTags: number;
  activeTags: number;
  totalScans: number;
  todayScans: number;
  weeklyScans: number;
  monthlyScans: number;
}

export interface RFIDScanLog {
  id: string;
  readerId: string;
  readerName: string;
  tagId: string;
  tagNumber: string;
  timestamp: string;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  location: string;
  studentName?: string;
  scanType?: string;
}

export interface RFIDChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface RFIDDashboardData {
  stats: RFIDDashboardStats;
  recentScans: RFIDScanLog[];
  readerStatusChart: RFIDChartData[];
  tagActivityChart: RFIDChartData[];
  scanTrendsChart: RFIDChartData[];
  locationActivityChart: RFIDChartData[];
}

class RFIDDashboardService {
  private baseUrl = '/api/rfid/dashboard';

  async getDashboardData(filters?: {
    from?: string;
    to?: string;
    status?: string[];
    location?: string[];
    readerId?: string;
    tagId?: string;
    period?: 'daily' | 'weekly' | 'monthly';
  }): Promise<RFIDDashboardData> {
    try {
      const url = new URL(this.baseUrl, window.location.origin);
      if (filters) {
        if (filters.from) url.searchParams.set('from', filters.from);
        if (filters.to) url.searchParams.set('to', filters.to);
        if (filters.status && filters.status.length) url.searchParams.set('status', filters.status.join(','));
        if (filters.location && filters.location.length) url.searchParams.set('location', filters.location.join(','));
        if (filters.readerId) url.searchParams.set('readerId', filters.readerId);
        if (filters.tagId) url.searchParams.set('tagId', filters.tagId);
        if (filters.period) url.searchParams.set('period', filters.period);
      }
      console.log('Making request to:', url.toString());
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Request timeout - aborting');
        controller.abort('Request timeout');
      }, 30000); // 30 second timeout
      
      const response = await fetch(url.toString(), {
        signal:controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Dashboard data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching RFID dashboard data:', error);
      
      // Handle AbortError specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted - likely due to timeout');
        console.log('Falling back to mock data');
        return this.getMockDashboardData();
      }
      
      // For other errors, also fall back to mock data
      console.log('API request failed, falling back to mock data');
      return this.getMockDashboardData();
    }
  }

  async getStats(): Promise<RFIDDashboardStats> {
    try {
      const response = await fetch(`${this.baseUrl}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching RFID stats:', error);
      throw error;
    }
  }

  async getRecentScans(limit: number = 10): Promise<RFIDScanLog[]> {
    try {
      const response = await fetch(`${this.baseUrl}/scans?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching recent scans:', error);
      throw error;
    }
  }

  async getReaderStatusChart(): Promise<RFIDChartData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/charts/reader-status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching reader status chart data:', error);
      throw error;
    }
  }

  async getTagActivityChart(): Promise<RFIDChartData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/charts/tag-activity`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching tag activity chart data:', error);
      throw error;
    }
  }

  async getScanTrendsChart(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<RFIDChartData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/charts/scan-trends?period=${period}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching scan trends chart data:', error);
      throw error;
    }
  }

  async getLocationActivityChart(): Promise<RFIDChartData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/charts/location-activity`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching location activity chart data:', error);
      throw error;
    }
  }

  async downloadExport(type: 'all' | 'scans' | 'stats' | 'charts', format: 'csv' | 'excel', filters?: {
    from?: string;
    to?: string;
    status?: string[];
    location?: string[];
    readerId?: string;
    tagId?: string;
  }): Promise<void> {
    const url = new URL('/api/rfid/dashboard/export', window.location.origin);
    url.searchParams.set('type', type);
    url.searchParams.set('format', format);
    if (filters) {
      if (filters.from) url.searchParams.set('from', filters.from);
      if (filters.to) url.searchParams.set('to', filters.to);
      if (filters.status && filters.status.length) url.searchParams.set('status', filters.status.join(','));
      if (filters.location && filters.location.length) url.searchParams.set('location', filters.location.join(','));
      if (filters.readerId) url.searchParams.set('readerId', filters.readerId);
      if (filters.tagId) url.searchParams.set('tagId', filters.tagId);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Failed to export: ${response.status} ${text}`);
    }
    const blob = await response.blob();
    const link = document.createElement('a');
    const href = URL.createObjectURL(blob);
    link.href = href;
    link.download = `rfid-${type}-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'json'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
  }

  // Fallback method that returns mock data
  async getMockDashboardData(): Promise<RFIDDashboardData> {
    console.log('Returning mock dashboard data');
    return {
      stats: {
        totalReaders: 5,
        activeReaders: 3,
        totalTags: 150,
        activeTags: 142,
        totalScans: 1250,
        todayScans: 45,
        weeklyScans: 320,
        monthlyScans: 1250
      },
      recentScans: [
        {
          id: '1',
          readerId: 'READER001',
          readerName: 'Main Entrance',
          tagId: 'TAG001',
          tagNumber: '001',
          timestamp: new Date().toISOString(),
          status: 'SUCCESS' as const,
          location: 'Main Entrance',
          studentName: 'John Doe',
          scanType: 'attendance'
        },
        {
          id: '2',
          readerId: 'READER002',
          readerName: 'Library',
          tagId: 'TAG002',
          tagNumber: '002',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          status: 'SUCCESS' as const,
          location: 'Library',
          studentName: 'Jane Smith',
          scanType: 'attendance'
        }
      ],
      readerStatusChart: [
        { name: 'ACTIVE', value: 3 },
        { name: 'INACTIVE', value: 2 }
      ],
      tagActivityChart: [
        { name: 'ACTIVE', value: 142 },
        { name: 'INACTIVE', value: 8 }
      ],
      scanTrendsChart: [
        { name: '2024-01-01', value: 45 },
        { name: '2024-01-02', value: 52 },
        { name: '2024-01-03', value: 38 },
        { name: '2024-01-04', value: 61 },
        { name: '2024-01-05', value: 48 },
        { name: '2024-01-06', value: 55 },
        { name: '2024-01-07', value: 42 }
      ],
      locationActivityChart: [
        { name: 'Main Entrance', value: 450 },
        { name: 'Library', value: 320 },
        { name: 'Cafeteria', value: 280 },
        { name: 'Lab A', value: 150 },
        { name: 'Gym', value: 50 }
      ]
    };
  }
}

export const rfidDashboardService = new RFIDDashboardService();
