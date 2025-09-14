# AttendanceAnalytics Component API Documentation

## Overview

The `AttendanceAnalytics` component is a comprehensive analytics dashboard for displaying attendance data for both instructors and students. It provides interactive charts, filtering capabilities, export functionality, and real-time data processing.

## Props Interface

```typescript
interface AttendanceAnalyticsProps {
  // Core Data
  data: AttendanceData[];
  loading?: boolean;
  type: 'instructor' | 'student';
  
  // Event Handlers
  onDrillDown?: (filter: { type: string; value: string }) => void;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
  onRefresh?: () => void;
  
  // Feature Flags
  enableAdvancedFeatures?: boolean;
  enableRealTime?: boolean;
  enableDrillDown?: boolean;
  enableTimeRange?: boolean;
  showHeader?: boolean;
  showSecondaryFilters?: boolean;
  
  // Filtering
  selectedSubject?: string;
  onSubjectChange?: (value: string) => void;
  subjects?: Array<{ id: string; name: string }>;
}
```

## Props Description

### Core Data Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `AttendanceData[]` | Yes | Array of attendance data records |
| `loading` | `boolean` | No | Shows loading state when true |
| `type` | `'instructor' \| 'student'` | Yes | Determines the type of analytics to display |

### Event Handler Props

| Prop | Type | Description |
|------|------|-------------|
| `onDrillDown` | `(filter: { type: string; value: string }) => void` | Called when user clicks on chart elements for drill-down |
| `onExport` | `(format: 'pdf' \| 'csv' \| 'excel') => void` | Called when user exports data |
| `onRefresh` | `() => void` | Called when user clicks refresh button |

### Feature Flag Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableAdvancedFeatures` | `boolean` | `true` | Enables pattern analysis and streak analysis |
| `enableRealTime` | `boolean` | `false` | Enables real-time data updates |
| `enableDrillDown` | `boolean` | `true` | Enables drill-down functionality |
| `enableTimeRange` | `boolean` | `true` | Enables time range filtering |
| `showHeader` | `boolean` | `true` | Shows the analytics header |
| `showSecondaryFilters` | `boolean` | `true` | Shows secondary filter options |

### Filtering Props

| Prop | Type | Description |
|------|------|-------------|
| `selectedSubject` | `string` | Currently selected subject filter |
| `onSubjectChange` | `(value: string) => void` | Called when subject filter changes |
| `subjects` | `Array<{ id: string; name: string }>` | Available subjects for filtering |

## Data Structure

### AttendanceData Interface

```typescript
interface AttendanceData {
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
```

## Features

### 1. Dashboard Overview
- **Statistics Cards**: Total count, attendance rate, departments, high risk cases
- **Attendance Distribution**: Pie chart showing present/late/absent breakdown
- **Department Performance**: Bar chart comparing department attendance rates

### 2. Trend Analysis
- **Weekly Trends**: Line chart showing attendance trends over time
- **Late Arrival Trends**: Analysis of late arrival patterns
- **Comparison Mode**: Compare current period with previous period

### 3. Advanced Analytics (when `enableAdvancedFeatures` is true)
- **Pattern Analysis**: Moving averages and peak/valley detection
- **Streak Analysis**: Consecutive days of good/poor attendance

### 4. Interactive Features
- **Drill-down Navigation**: Click on chart elements to explore deeper
- **Time Range Filtering**: Filter data by today, week, month, quarter, year, or custom range
- **Department/Risk Level Filtering**: Filter by specific departments or risk levels
- **Subject Filtering**: Filter by specific subjects

### 5. Export Functionality
- **PDF Export**: Generate PDF reports with charts and data
- **CSV Export**: Export raw data in CSV format
- **Excel Export**: Export data with multiple sheets and formatting

## Usage Examples

### Basic Usage

```tsx
import { AttendanceAnalytics } from '@/components/AttendanceAnalytics';

function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <AttendanceAnalytics
      data={data}
      loading={loading}
      type="student"
      onExport={(format) => console.log('Export:', format)}
      onRefresh={() => fetchData()}
    />
  );
}
```

### Advanced Usage with Custom Filters

```tsx
function AdvancedAnalytics() {
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [subjects, setSubjects] = useState([
    { id: 'cs101', name: 'Computer Science 101' },
    { id: 'math101', name: 'Mathematics 101' }
  ]);

  return (
    <AttendanceAnalytics
      data={attendanceData}
      type="instructor"
      enableAdvancedFeatures={true}
      enableRealTime={true}
      selectedSubject={selectedSubject}
      onSubjectChange={setSelectedSubject}
      subjects={subjects}
      onDrillDown={(filter) => {
        console.log('Drill down:', filter);
        // Handle drill-down logic
      }}
      onExport={async (format) => {
        // Custom export handling
        await exportData(format);
      }}
    />
  );
}
```

## Styling

The component uses Tailwind CSS classes and follows the design system. Key styling features:

- **Responsive Design**: Adapts to different screen sizes
- **Dark/Light Mode Support**: Compatible with theme switching
- **Accessibility**: ARIA labels and keyboard navigation support
- **Loading States**: Skeleton loaders and progress indicators
- **Error States**: User-friendly error messages and retry options

## Performance Considerations

- **Memoization**: Expensive calculations are memoized with `useMemo`
- **Virtual Scrolling**: Large datasets are handled efficiently
- **Lazy Loading**: Charts and modals are loaded on demand
- **Data Caching**: Processed data is cached to avoid recalculation

## Error Handling

The component handles various error scenarios:

- **Invalid Data**: Validates input data and shows appropriate messages
- **Network Errors**: Displays error states with retry options
- **Export Failures**: Shows toast notifications for export success/failure
- **Empty States**: Graceful handling of empty or filtered data

## Accessibility

- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full keyboard support for all features
- **Screen Reader Support**: Semantic HTML and proper heading structure
- **Color Contrast**: Meets WCAG 2.1 AA standards

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Support**: Responsive design for mobile devices
- **Export Compatibility**: PDF and Excel exports work in supported browsers

## Dependencies

- **React**: 18+ (uses hooks and modern patterns)
- **Recharts**: For chart rendering
- **Lucide React**: For icons
- **jsPDF**: For PDF export
- **xlsx**: For Excel export
- **Tailwind CSS**: For styling

## Testing

The component includes comprehensive unit tests covering:

- **Rendering**: Basic component rendering
- **Interactions**: User interactions and event handling
- **Data Processing**: Analytics calculations and data transformations
- **Error States**: Error handling and edge cases
- **Accessibility**: ARIA labels and keyboard navigation

Run tests with:
```bash
npm test AttendanceAnalytics
```

## Troubleshooting

### Common Issues

1. **Charts not rendering**: Ensure data is properly formatted
2. **Export not working**: Check browser compatibility and file permissions
3. **Performance issues**: Consider reducing data size or enabling virtualization
4. **Styling issues**: Verify Tailwind CSS is properly configured

### Debug Mode

Enable debug mode by setting the environment variable:
```bash
NEXT_PUBLIC_DEBUG_ANALYTICS=true
```

This will log detailed information about data processing and component state.
