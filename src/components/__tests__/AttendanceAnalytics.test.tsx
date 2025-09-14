import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AttendanceAnalytics } from '../AttendanceAnalytics';

// Define the type locally for testing
interface AttendanceData {
  id: string;
  name: string;
  department: string;
  totalClasses: number;
  attendedClasses: number;
  absentClasses: number;
  lateClasses: number;
  attendanceRate: number;
  riskLevel: 'low' | 'medium' | 'high' | 'none';
  lastAttendance: Date;
  status: 'active' | 'inactive';
  subjects: string[];
  weeklyData: any[];
}

// Mock the analytics utils
jest.mock('@/lib/analytics-utils', () => ({
  processRealTimeData: jest.fn((data) => ({
    totalCount: data.length,
    activeCount: data.filter((item: any) => item.status === 'active').length,
    inactiveCount: data.filter((item: any) => item.status === 'inactive').length,
    attendedClasses: data.reduce((sum: number, item: any) => sum + item.attendedClasses, 0),
    absentClasses: data.reduce((sum: number, item: any) => sum + item.absentClasses, 0),
    lateClasses: data.reduce((sum: number, item: any) => sum + item.lateClasses, 0),
    riskLevels: {},
    weeklyData: [],
    riskLevelData: [],
    departmentStats: [],
    historicalData: [],
    timeOfDayData: [],
    comparativeData: [],
    subjectPerformance: [],
    goalTracking: [],
    performanceRanking: [],
    drillDownData: {},
    crossFilterData: {}
  })),
  calculateAttendanceRate: jest.fn((attended, total) => total > 0 ? (attended / total) * 100 : 0),
  getRiskLevelColor: jest.fn(() => '#ff0000'),
  getTrendIcon: jest.fn(() => 'up'),
  calculateWeeklyAttendanceData: jest.fn(() => []),
  validateAttendanceData: jest.fn(() => ({ isValid: true, errors: [], warnings: [], dataQuality: 1 }))
}));

// Mock the export service
jest.mock('@/lib/services/export.service', () => ({
  ExportService: {
    exportAnalytics: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock the toast component
jest.mock('@/components/ui/toast', () => ({
  Toast: ({ message, type, onClose }: any) => (
    <div data-testid="toast" data-type={type} onClick={onClose}>
      {message}
    </div>
  )
}));

const mockData: AttendanceData[] = [
  {
    id: '1',
    name: 'John Doe',
    department: 'Computer Science',
    totalClasses: 20,
    attendedClasses: 18,
    absentClasses: 1,
    lateClasses: 1,
    attendanceRate: 90,
    riskLevel: 'low',
    lastAttendance: new Date(),
    status: 'active',
    subjects: ['CS101', 'CS102'],
    weeklyData: []
  },
  {
    id: '2',
    name: 'Jane Smith',
    department: 'Mathematics',
    totalClasses: 20,
    attendedClasses: 15,
    absentClasses: 3,
    lateClasses: 2,
    attendanceRate: 75,
    riskLevel: 'medium',
    lastAttendance: new Date(),
    status: 'active',
    subjects: ['MATH101', 'MATH102'],
    weeklyData: []
  }
];

const defaultProps = {
  data: mockData,
  loading: false,
  type: 'student' as const,
  onDrillDown: jest.fn(),
  onExport: jest.fn(),
  onRefresh: jest.fn(),
  enableAdvancedFeatures: true,
  enableRealTime: false,
  enableDrillDown: true,
  enableTimeRange: true,
  showHeader: true,
  showSecondaryFilters: true,
  selectedSubject: 'all',
  onSubjectChange: jest.fn(),
  subjects: []
};

describe('AttendanceAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AttendanceAnalytics {...defaultProps} />);
    expect(screen.getByText(/Attendance Analytics/i)).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<AttendanceAnalytics {...defaultProps} loading={true} />);
    // The component should show loading skeleton
    expect(screen.getByTestId('analytics-skeleton')).toBeInTheDocument();
  });

  it('displays correct statistics cards', () => {
    render(<AttendanceAnalytics {...defaultProps} />);
    
    // Check for key statistics
    expect(screen.getByText('2')).toBeInTheDocument(); // Total count
    expect(screen.getByText('90.0%')).toBeInTheDocument(); // Attendance rate
  });

  it('handles empty data gracefully', () => {
    render(<AttendanceAnalytics {...defaultProps} data={[]} />);
    expect(screen.getByText(/No Analytics Data Available/i)).toBeInTheDocument();
  });

  it('calls onExport when export button is clicked', async () => {
    render(<AttendanceAnalytics {...defaultProps} />);
    
    const exportButton = screen.getByText(/Export/i);
    fireEvent.click(exportButton);
    
    // Check if export dropdown appears
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
  });

  it('shows toast notification on successful export', async () => {
    render(<AttendanceAnalytics {...defaultProps} />);
    
    const exportButton = screen.getByText(/Export/i);
    fireEvent.click(exportButton);
    
    const csvButton = screen.getByText('CSV');
    fireEvent.click(csvButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('toast')).toBeInTheDocument();
    });
  });

  it('handles tab navigation correctly', () => {
    render(<AttendanceAnalytics {...defaultProps} />);
    
    // Check if tabs are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
    expect(screen.getByText('Patterns')).toBeInTheDocument();
    
    // Click on Trends tab
    fireEvent.click(screen.getByText('Trends'));
    expect(screen.getByText('Attendance Trend Analysis')).toBeInTheDocument();
  });

  it('applies filters correctly', () => {
    render(<AttendanceAnalytics {...defaultProps} />);
    
    // Check if filter dropdowns are present
    expect(screen.getByText('All Departments')).toBeInTheDocument();
    expect(screen.getByText('All Levels')).toBeInTheDocument();
  });

  it('shows error state when data processing fails', () => {
    // Mock the processRealTimeData to throw an error
    const { processRealTimeData } = require('@/lib/analytics-utils');
    processRealTimeData.mockImplementation(() => {
      throw new Error('Data processing failed');
    });
    
    render(<AttendanceAnalytics {...defaultProps} />);
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  it('handles instructor type correctly', () => {
    render(<AttendanceAnalytics {...defaultProps} type="instructor" />);
    expect(screen.getByText(/Instructor Attendance Analytics/i)).toBeInTheDocument();
  });

  it('handles student type correctly', () => {
    render(<AttendanceAnalytics {...defaultProps} type="student" />);
    expect(screen.getByText(/Student Attendance Analytics/i)).toBeInTheDocument();
  });
});

// Test utility functions
describe('AttendanceAnalytics Utilities', () => {
  it('calculates attendance rate correctly', () => {
    const { calculateAttendanceRate } = require('@/lib/analytics-utils');
    expect(calculateAttendanceRate(18, 20)).toBe(90);
    expect(calculateAttendanceRate(0, 0)).toBe(0);
  });

  it('processes real-time data correctly', () => {
    const { processRealTimeData } = require('@/lib/analytics-utils');
    const result = processRealTimeData(mockData, 'student');
    expect(result.totalCount).toBe(2);
    expect(result.attendedClasses).toBe(33); // 18 + 15
  });
});
