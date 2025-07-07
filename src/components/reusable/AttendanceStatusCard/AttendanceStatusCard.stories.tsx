import type { Meta, StoryObj } from '@storybook/react';
import { AttendanceStatusCard, PresentStudentsCard, AbsentStudentsCard, LateStudentsCard, TotalStudentsCard } from './AttendanceStatusCard';
import { Users, UserCheck, Clock, AlertTriangle, BookOpen } from 'lucide-react';

const meta: Meta<typeof AttendanceStatusCard> = {
  title: 'Attendance System/AttendanceStatusCard',
  component: AttendanceStatusCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A specialized status card component for displaying attendance metrics with visual indicators, trends, and interactive features.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['present', 'absent', 'late', 'excused', 'total'],
      description: 'The attendance status type which determines color theming',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size variant of the card',
    },
    interactive: {
      control: 'boolean',
      description: 'Enable hover effects and click interaction',
    },
    title: {
      control: 'text',
      description: 'Main title text for the card',
    },
    count: {
      control: 'number',
      description: 'Primary numeric value to display',
    },
    total: {
      control: 'number',
      description: 'Total value for percentage calculation',
    },
    percentage: {
      control: 'number',
      description: 'Manual percentage override',
    },
    subtitle: {
      control: 'text',
      description: 'Secondary descriptive text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Examples
export const Default: Story = {
  args: {
    status: 'present',
    title: 'Present Students',
    count: 342,
    total: 400,
    subtitle: 'Students in attendance today',
  },
};

export const WithTrend: Story = {
  args: {
    status: 'present',
    title: 'Present Students',
    count: 342,
    total: 400,
    subtitle: 'Students in attendance today',
    trend: {
      value: 5.2,
      direction: 'up',
      period: 'yesterday',
    },
  },
};

export const Interactive: Story = {
  args: {
    status: 'absent',
    title: 'Absent Students',
    count: 28,
    total: 400,
    subtitle: 'Students not present today',
    interactive: true,
    trend: {
      value: 2.1,
      direction: 'down',
      period: 'yesterday',
    },
  },
};

// All Status Types
export const AllStatusTypes: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AttendanceStatusCard
        status="present"
        title="Present"
        count={342}
        total={400}
        subtitle="In attendance"
      />
      <AttendanceStatusCard
        status="absent"
        title="Absent"
        count={28}
        total={400}
        subtitle="Not present"
      />
      <AttendanceStatusCard
        status="late"
        title="Late"
        count={15}
        total={400}
        subtitle="Arrived late"
      />
      <AttendanceStatusCard
        status="excused"
        title="Excused"
        count={12}
        total={400}
        subtitle="Valid excuse"
      />
      <AttendanceStatusCard
        status="total"
        title="Total"
        count={400}
        subtitle="Enrolled students"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available status types with their respective color themes and default icons.',
      },
    },
  },
};

// Size Variations
export const SizeVariations: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Small Size</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AttendanceStatusCard
            status="present"
            size="sm"
            title="Present"
            count={342}
          />
          <AttendanceStatusCard
            status="absent"
            size="sm"
            title="Absent"
            count={28}
          />
          <AttendanceStatusCard
            status="late"
            size="sm"
            title="Late"
            count={15}
          />
          <AttendanceStatusCard
            status="excused"
            size="sm"
            title="Excused"
            count={12}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Medium Size (Default)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AttendanceStatusCard
            status="present"
            title="Present Students"
            count={342}
            total={400}
            subtitle="Students in attendance"
          />
          <AttendanceStatusCard
            status="absent"
            title="Absent Students"
            count={28}
            total={400}
            subtitle="Students not present"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Large Size</h3>
        <AttendanceStatusCard
          status="total"
          size="lg"
          title="Weekly Attendance Summary"
          count={1687}
          total={2000}
          subtitle="Total attendance across all classes this week"
          trend={{
            value: 4.2,
            direction: 'up',
            period: 'last week',
          }}
          icon={<BookOpen className="w-6 h-6" />}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different size variants: small for compact displays, medium for standard use, and large for featured metrics.',
      },
    },
  },
};

// Convenience Components
export const ConvenienceComponents: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <TotalStudentsCard
        title="Total Students"
        count={1247}
        subtitle="Enrolled this semester"
        trend={{
          value: 5.2,
          direction: 'up',
          period: 'last month',
        }}
        interactive
      />
      
      <PresentStudentsCard
        title="Present Today"
        count={1156}
        total={1247}
        subtitle="Students in attendance"
        trend={{
          value: 2.3,
          direction: 'up',
          period: 'yesterday',
        }}
        interactive
      />
      
      <AbsentStudentsCard
        title="Absent Today"
        count={91}
        total={1247}
        subtitle="Students not present"
        trend={{
          value: 1.2,
          direction: 'down',
          period: 'yesterday',
        }}
        interactive
      />
      
      <LateStudentsCard
        title="Late Arrivals"
        count={34}
        total={1247}
        subtitle="Students arrived late"
        trend={{
          value: 0.5,
          direction: 'neutral',
          period: 'yesterday',
        }}
        interactive
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pre-configured convenience components for common attendance scenarios. These components have predefined status types and are optimized for specific use cases.',
      },
    },
  },
};

// Real-world Dashboard Example
export const DashboardExample: Story = {
  render: () => (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Today's Attendance Overview</h2>
        <p className="text-gray-600">Real-time attendance metrics for all departments</p>
      </div>
      
      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TotalStudentsCard
          title="Total Students"
          count={1247}
          subtitle="Enrolled this semester"
          trend={{ value: 2.1, direction: 'up', period: 'last week' }}
          interactive
        />
        
        <PresentStudentsCard
          title="Present Today"
          count={1156}
          total={1247}
          subtitle="In attendance"
          trend={{ value: 3.2, direction: 'up', period: 'yesterday' }}
          interactive
        />
        
        <AbsentStudentsCard
          title="Absent Today"
          count={57}
          total={1247}
          subtitle="Not present"
          trend={{ value: 1.8, direction: 'down', period: 'yesterday' }}
          interactive
        />
        
        <LateStudentsCard
          title="Late Arrivals"
          count={34}
          total={1247}
          subtitle="Arrived after start time"
          trend={{ value: 0.5, direction: 'neutral', period: 'yesterday' }}
          interactive
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AttendanceStatusCard
          status="excused"
          title="Excused Absences"
          count={23}
          total={1247}
          subtitle="With valid documentation"
          icon={<Users className="w-5 h-5" />}
        />
        
        <AttendanceStatusCard
          status="present"
          title="Attendance Rate"
          count={93}
          subtitle="Overall percentage today"
          icon={<UserCheck className="w-5 h-5" />}
          trend={{ value: 2.1, direction: 'up', period: 'last week' }}
        />
        
        <AttendanceStatusCard
          status="total"
          title="Active Classes"
          count={28}
          subtitle="Currently in session"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A complete dashboard example showing how attendance status cards work together to provide a comprehensive overview of attendance metrics.',
      },
    },
  },
};

// Trend Directions
export const TrendDirections: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AttendanceStatusCard
        status="present"
        title="Improving Trend"
        count={342}
        total={400}
        subtitle="Attendance is up"
        trend={{
          value: 5.2,
          direction: 'up',
          period: 'last week',
        }}
      />
      
      <AttendanceStatusCard
        status="absent"
        title="Declining Trend"
        count={28}
        total={400}
        subtitle="Absences are down"
        trend={{
          value: 2.1,
          direction: 'down',
          period: 'last week',
        }}
      />
      
      <AttendanceStatusCard
        status="total"
        title="Stable Trend"
        count={400}
        subtitle="No significant change"
        trend={{
          value: 0.1,
          direction: 'neutral',
          period: 'last week',
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of different trend directions with appropriate color coding and icons.',
      },
    },
  },
};

// Custom Icons
export const CustomIcons: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <AttendanceStatusCard
        status="present"
        title="Check-ins"
        count={342}
        icon={<UserCheck className="w-5 h-5" />}
        subtitle="Successful entries"
      />
      
      <AttendanceStatusCard
        status="late"
        title="Late Entries"
        count={15}
        icon={<Clock className="w-5 h-5" />}
        subtitle="After start time"
      />
      
      <AttendanceStatusCard
        status="absent"
        title="Missing"
        count={28}
        icon={<AlertTriangle className="w-5 h-5" />}
        subtitle="No check-in recorded"
      />
      
      <AttendanceStatusCard
        status="total"
        title="Registered"
        count={400}
        icon={<Users className="w-5 h-5" />}
        subtitle="Total enrollment"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Custom icons can be provided to override the default status icons.',
      },
    },
  },
}; 