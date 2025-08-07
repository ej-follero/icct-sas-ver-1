# API Integration Guide for Attendance Filters

This guide explains how to integrate real API data with the attendance filters in the Unified Attendance Dashboard.

## Overview

The attendance system now supports real API data integration for all filter options. The system automatically fetches filter options from the API and falls back to mock data if the API is unavailable.

## API Endpoints

### 1. Filter Options API
**Endpoint:** `/api/attendance/filters`
**Method:** GET
**Description:** Fetches all available filter options for the attendance dashboard

**Response Structure:**
```json
{
  "students": [
    {
      "id": "1",
      "studentName": "John Doe",
      "course": "Computer Science",
      "yearLevel": "2nd Year"
    }
  ],
  "courses": [
    {
      "id": "1",
      "name": "BS Computer Science"
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Section A",
      "course": "BS Computer Science"
    }
  ],
  "subjects": [
    {
      "id": "1",
      "name": "Programming Fundamentals"
    }
  ],
  "instructors": [
    {
      "id": "1",
      "name": "Dr. Jane Smith"
    }
  ]
}
```

### 2. Students Data API
**Endpoint:** `/api/attendance/students`
**Method:** GET
**Description:** Fetches student attendance data with filtering

**Query Parameters:**
- `departmentCode` - Filter by department code (e.g., "CS", "IT", "CE")
- `departmentId` - Filter by department ID (fallback)
- `courseId` - Filter by course ID
- `yearLevel` - Filter by year level
- `status` - Filter by student status
- `startDate` - Start date for attendance records
- `endDate` - End date for attendance records
- `search` - Search query for student names/IDs

**Response Structure:**
```json
{
  "students": [
    {
      "id": "1",
      "studentName": "John Doe",
      "studentId": "2021-0001",
      "department": "CS - Computer Science",
      "course": "BS Computer Science",
      "yearLevel": "2nd Year",
      "attendanceRate": 85.5,
      "status": "ACTIVE",
      "subjects": [
        {
          "subjectName": "Programming",
          "subjectCode": "CS101",
          "instructor": "Dr. Jane Smith",
          "room": "Room 101",
          "schedule": {
            "dayOfWeek": "Monday",
            "startTime": "8:00 AM",
            "endTime": "9:00 AM"
          }
        }
      ]
    }
  ],
  "total": 150,
  "filters": {
    "departmentId": "1",
    "courseId": "2",
    "yearLevel": "2nd Year"
  }
}
```

### 3. Dashboard Data API
**Endpoint:** `/api/attendance/dashboard`
**Method:** GET
**Description:** Fetches dashboard summary and analytics data

**Query Parameters:**
- `date` - Date for dashboard data (YYYY-MM-DD)
- `groupBy` - Grouping method (department, year, course, section, subject)

**Response Structure:**
```json
{
  "summary": {
    "totalStudents": 150,
    "totalPresent": 120,
    "totalLate": 15,
    "totalAbsent": 15,
    "overallAttendanceRate": 85.5
  },
  "departments": [
    {
      "id": "Computer Science",
      "name": "Computer Science",
      "present": 45,
      "total": 50,
      "rate": 90.0
    }
  ]
}
```

## Implementation Details

### 1. Filter Options State Management

The system maintains a `filterOptions` state that stores all available filter options:

```typescript
const [filterOptions, setFilterOptions] = useState<{
  departments: string[];
  courses: string[];
  sections: string[];
  subjects: string[];
  instructors: string[];
  yearLevels: string[];
  riskLevels: string[];
  studentStatuses: string[];
  studentTypes: string[];
  enrollmentStatuses: string[];
  attendanceRates: string[];
  subjectInstructors: string[];
  subjectRooms: string[];
  subjectScheduleDays: string[];
  subjectScheduleTimes: string[];
}>({
  // Initial empty state
});
```

### 2. API Data Fetching

The system automatically fetches filter options on component mount:

```typescript
const fetchFilterOptions = useCallback(async () => {
  try {
    setFilterOptionsLoading(true);
    
    const response = await fetch('/api/attendance/filters');
    if (!response.ok) {
      throw new Error('Failed to fetch filter options');
    }
    
    const data = await response.json();
    
    // Transform API data to match filter structure
    const transformedOptions = {
      departments: [...new Set(data.students.map((s: any) => s.course).filter(Boolean))].map(String),
      courses: data.courses.map((c: any) => String(c.name)),
      // ... other transformations
    };
    
    setFilterOptions(transformedOptions);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    // Fallback to mock data
  } finally {
    setFilterOptionsLoading(false);
  }
}, []);
```

### 3. Enhanced Student Data Fetching

Student data is fetched with filter parameters:

```typescript
const fetchStudentsDataWithAPI = useCallback(async () => {
  try {
    setStudentsLoading(true);
    
    // Build query parameters from filters
    const params = new URLSearchParams();
    
    if (filters.departments.length > 0) {
      params.append('departmentId', filters.departments[0]);
    }
    if (filters.courses.length > 0) {
      params.append('courseId', filters.courses[0]);
    }
    // ... other filter parameters
    
    const response = await fetch(`/api/attendance/students?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to fetch students data');
    }
    
    const data = await response.json();
    setStudentsData(data.students || []);
    
  } catch (error) {
    console.error('Error fetching students data:', error);
    // Fallback to existing fetchStudentsData
  } finally {
    setStudentsLoading(false);
  }
}, [filters, searchQuery, fetchStudentsData]);
```

### 4. Filter Options Integration

The filter options are used in the useMemo hook with fallback to derived data:

```typescript
const { departments, courses, yearLevels, ... } = useMemo(() => {
  // Use API filter options if available, otherwise fallback to derived from studentsData
  if (filterOptions.departments.length > 0) {
    return {
      departments: filterOptions.departments,
      courses: filterOptions.courses,
      // ... other options
    };
  }
  
  // Fallback to deriving from studentsData if API options not loaded yet
  return {
    departments: [...new Set(studentsData.map(s => s.department))],
    courses: [...new Set(studentsData.map(s => s.course))],
    // ... other derived options
  };
}, [studentsData, filterOptions]);
```

## Filter Categories

### Quick Filters
- **Time Range** - Today, This Week, This Month
- **Department** - Fetched from API (displays as "CS - Computer Science")
- **Subject** - Fetched from API
- **Year Level** - Fetched from API
- **Attendance Rate** - Predefined ranges

### Advanced Filters

#### Academic Filters
- **Course** - Fetched from API
- **Section** - Fetched from API
- **Subject Instructor** - Fetched from API
- **Room** - Fetched from API
- **Schedule Day/Time** - Fetched from API

#### Student Filters
- **Student Status** - ACTIVE, INACTIVE, SUSPENDED, GRADUATED
- **Student Type** - REGULAR, IRREGULAR, TRANSFER, RETURNEE
- **Risk Level** - HIGH, MEDIUM, LOW, NONE

#### Attendance Filters
- **Attendance Status** - Present, Late, Absent, Excused
- **Time of Day** - Morning, Afternoon, Evening, Night
- **Attendance Trend** - Improving, Declining, Stable, Fluctuating
- **Date Range** - Custom date picker

## Error Handling

The system includes comprehensive error handling:

1. **API Unavailable** - Falls back to mock data
2. **Network Errors** - Logs errors and continues with existing data
3. **Invalid Data** - Uses type-safe transformations with String() conversion
4. **Loading States** - Shows loading indicators during API calls

## Performance Considerations

1. **Caching** - Filter options are cached in state and only refetched on mount
2. **Debouncing** - Search queries are debounced to prevent excessive API calls
3. **Pagination** - Large datasets are paginated to improve performance
4. **Memoization** - Filter options are memoized to prevent unnecessary re-renders

## Testing

To test the API integration:

1. **Start the development server** - `npm run dev`
2. **Ensure database is running** - Check Prisma connection
3. **Verify API endpoints** - Test `/api/attendance/filters` and `/api/attendance/students`
4. **Check filter functionality** - Apply filters and verify data updates
5. **Test error scenarios** - Disconnect database to test fallback behavior

## Troubleshooting

### Common Issues

1. **Filter options not loading**
   - Check API endpoint availability
   - Verify database connection
   - Check browser console for errors

2. **Filters not working**
   - Ensure API returns correct data structure
   - Check filter parameter mapping
   - Verify state updates are triggering re-renders

3. **Performance issues**
   - Check for excessive API calls
   - Verify memoization is working
   - Consider implementing pagination

### Debug Mode

Enable debug logging by adding to the component:

```typescript
const DEBUG = process.env.NODE_ENV === 'development';

// In fetchFilterOptions
if (DEBUG) {
  console.log('Fetching filter options...');
  console.log('API response:', data);
  console.log('Transformed options:', transformedOptions);
}
```

## Future Enhancements

1. **Real-time Updates** - WebSocket integration for live data
2. **Advanced Analytics** - More sophisticated filtering and reporting
3. **Export Integration** - Direct API export functionality
4. **Caching Layer** - Redis or similar for better performance
5. **Offline Support** - Service worker for offline functionality 