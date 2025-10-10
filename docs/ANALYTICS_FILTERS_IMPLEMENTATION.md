# Analytics Filters Implementation Guide

## Overview

This guide documents the implementation of cascading filters for the analytics section, enabling granular data analysis across Department → Course → Subject → Section levels.

## Architecture

### 1. **Cascading Filter Component** (`src/components/AnalyticsFilters.tsx`)

A reusable filter component that provides:
- **Primary Filters**: Department, Course, Subject (always visible)
- **Advanced Filters**: Section (collapsible, optional)
- **Cascading Logic**: Parent selection filters child options
- **Active Filters Display**: Shows currently applied filters with quick removal
- **Clear All**: Removes all filters at once

#### Key Features:
- Automatic dependency management (changing parent resets children)
- Active filter count badge
- Disabled state for dependent filters when parent is not selected
- Responsive grid layout (1-3 columns based on screen size)

### 2. **API Integration**

#### Filter Options API (`src/app/api/analytics/filter-options/route.ts`)

**Endpoint**: `GET /api/analytics/filter-options`

**Query Parameters**:
- `departmentId` (optional): Filter courses by department
- `courseId` (optional): Filter subjects by course
- `subjectId` (optional): Filter sections by subject

**Response Format**:
```json
{
  "departments": [{ "id": "1", "name": "Computer Science" }],
  "courses": [{ "id": "1", "name": "BSCS", "departmentId": "1" }],
  "subjects": [{ "id": "1", "name": "Data Structures", "courseId": "1" }],
  "sections": [{ "id": "1", "name": "Section A", "subjectId": "1" }]
}
```

#### Analytics API Updates (`src/app/api/attendance/analytics/route.ts`)

**New Query Parameters**:
- `courseId`: Filter by course
- `sectionId`: Filter by section

**Updated Cache Key**: Includes all filter parameters for proper caching

**Prisma Query Filters**:
```typescript
// Subject filter
if (subjectId && subjectId !== 'all') {
  attendanceWhere.subject = {
    subjectId: parseInt(subjectId)
  };
}

// Course filter
if (courseId && courseId !== 'all') {
  attendanceWhere.subject = {
    ...attendanceWhere.subject,
    courseOffering: {
      courseId: parseInt(courseId)
    }
  };
}

// Section filter
if (sectionId && sectionId !== 'all') {
  attendanceWhere.subject = {
    ...attendanceWhere.subject,
    subjectSchedule: {
      some: {
        sectionId: parseInt(sectionId)
      }
    }
  };
}
```

### 3. **Frontend Integration** (`src/components/AttendanceAnalytics.tsx`)

#### New Props:
```typescript
interface AttendanceAnalyticsProps {
  // ... existing props
  enableFilters?: boolean;  // Enable/disable filter UI
  filterOptions?: FilterOptions;  // Pre-fetched filter options
  onFiltersChange?: (filters: AnalyticsFilters) => void;  // Callback for filter changes
}
```

#### State Management:
```typescript
const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFiltersType>({});
const [filterOptions, setFilterOptions] = useState<FilterOptions>({
  departments: [],
  courses: [],
  subjects: [],
  sections: []
});
```

#### Data Fetching:
- Filters are included in the API request parameters
- Data is automatically refetched when filters change
- Cache is updated with filter-specific keys

## Usage

### Basic Usage (Page Level)

```typescript
import { AttendanceAnalytics } from '@/components/AttendanceAnalytics';
import { AnalyticsFilters as AnalyticsFiltersType } from '@/components/AnalyticsFilters';

function StudentAttendancePage() {
  const [filters, setFilters] = useState<AnalyticsFiltersType>({});

  const handleFiltersChange = (newFilters: AnalyticsFiltersType) => {
    setFilters(newFilters);
    // Optionally update URL params or trigger other actions
  };

  return (
    <div className="space-y-6">
      {/* Render the Analytics Filters */}
      <AnalyticsFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        filterOptions={filterOptions}  // Fetch from API
        loading={loading}
      />
      
      {/* Render the Analytics Component */}
      <AttendanceAnalytics
        data={data}
        loading={loading}
        type="student"
        enableFilters={true}
        // ... other props
      />
    </div>
  );
}
```

### Integration Steps:

1. **Import the Component**:
```typescript
import { AnalyticsFilters, FilterOptions, AnalyticsFilters as AnalyticsFiltersType } from '@/components/AnalyticsFilters';
```

2. **Add State for Filters**:
```typescript
const [filters, setFilters] = useState<AnalyticsFiltersType>({});
const [filterOptions, setFilterOptions] = useState<FilterOptions>({
  departments: [],
  courses: [],
  subjects: [],
  sections: []
});
```

3. **Fetch Filter Options**:
```typescript
useEffect(() => {
  async function fetchOptions() {
    const response = await fetch('/api/analytics/filter-options');
    const options = await response.json();
    setFilterOptions(options);
  }
  fetchOptions();
}, []);
```

4. **Add the Component to Your Page**:
```typescript
<AnalyticsFilters
  filters={filters}
  onFiltersChange={setFilters}
  filterOptions={filterOptions}
  loading={analyticsLoading}
/>
```

5. **Pass Filters to Analytics Component**:
The `AttendanceAnalytics` component already includes the filter state and will automatically apply filters when they change.

## UI/UX Features

### 1. **Cascading Behavior**
- Selecting a department filters available courses
- Selecting a course filters available subjects
- Selecting a subject filters available sections
- Changing a parent filter resets all child filters

### 2. **Visual Feedback**
- Active filter count badge shows number of applied filters
- Disabled appearance for dependent filters when parent is not selected
- Active filters displayed as removable badges below the filters
- "Clear All" button appears when filters are active

### 3. **Advanced Filters**
- Section filter is hidden in a collapsible "Advanced Filters" section
- Reduces visual clutter for users who don't need granular filtering
- Expandable with smooth animation

### 4. **Responsive Design**
- Mobile (1 column)
- Tablet (2 columns)
- Desktop (3 columns)
- Collapsible section for advanced filters

## Performance Optimizations

1. **API Caching**: Cache keys include all filter parameters
2. **Dependent Filtering**: Only fetch relevant options based on parent selection
3. **Debounced Updates**: Filter changes trigger data refetch with proper debouncing
4. **Memo optimization**: Filter options are memoized to prevent unnecessary re-renders

## Database Schema Requirements

The implementation assumes the following Prisma relations:

```prisma
model Department {
  departmentId   Int      @id
  departmentName String
  CourseOffering CourseOffering[]
}

model CourseOffering {
  courseId     Int        @id
  courseName   String
  departmentId Int
  Department   Department @relation(fields: [departmentId], references: [departmentId])
  Subjects     Subjects[]
}

model Subjects {
  subjectId      Int             @id
  subjectName    String
  courseOffering CourseOffering  @relation(fields: [courseId], references: [courseId])
  subjectSchedule SubjectSchedule[]
}

model Section {
  sectionId      Int             @id
  sectionName    String
  subjectSchedule SubjectSchedule[]
}

model SubjectSchedule {
  subjectSchedId Int      @id
  subjectId      Int
  sectionId      Int
  subject        Subjects @relation(fields: [subjectId], references: [subjectId])
  section        Section  @relation(fields: [sectionId], references: [sectionId])
}
```

## API Endpoints

### 1. Get Filter Options
```http
GET /api/analytics/filter-options
Query Parameters:
  - departmentId (optional)
  - courseId (optional)
  - subjectId (optional)
```

### 2. Get Analytics Data (Updated)
```http
GET /api/attendance/analytics
Query Parameters:
  - type (required): student | instructor
  - timeRange (required): today | week | month | quarter | year
  - departmentId (optional)
  - courseId (optional)
  - subjectId (optional)
  - sectionId (optional)
  - riskLevel (optional)
  - startDate (optional)
  - endDate (optional)
```

## Benefits

### For Users:
1. **Granular Analysis**: Filter data at multiple levels
2. **Intuitive UX**: Cascading filters guide users through logical filtering
3. **Quick Access**: Clear visual indication of active filters
4. **Flexibility**: Optional advanced filters for power users

### For Developers:
1. **Reusable Component**: Can be used in any analytics page
2. **Type-Safe**: Full TypeScript support
3. **Maintainable**: Clear separation of concerns
4. **Scalable**: Easy to add new filter types

### For Performance:
1. **Optimized Queries**: Filters applied at database level
2. **Smart Caching**: Separate cache for each filter combination
3. **Reduced Data**: Only fetch relevant data

## Future Enhancements

1. **Filter Presets**: Save and load common filter combinations
2. **URL Persistence**: Save filters in URL for sharing/bookmarking
3. **Filter History**: Remember last used filters
4. **Batch Operations**: Apply multiple filter changes at once
5. **Filter Analytics**: Track most-used filter combinations
6. **Export with Filters**: Include filter info in exported reports

## Troubleshooting

### Issue: Filters not cascading properly
**Solution**: Ensure filter options include the correct relationship IDs (`departmentId`, `courseId`, `subjectId`)

### Issue: Data not updating when filters change
**Solution**: Verify that the `analyticsFilters` dependency is included in the `fetchAnalyticsData` useCallback

### Issue: Filter options not loading
**Solution**: Check the `/api/analytics/filter-options` endpoint and ensure proper Prisma relations

### Issue: Performance degradation with filters
**Solution**: Add database indexes on filter fields (`departmentId`, `courseId`, `subjectId`, `sectionId`)

## Testing

### Manual Testing Checklist:
- [ ] Department filter shows all departments
- [ ] Course filter shows only courses from selected department
- [ ] Subject filter shows only subjects from selected course
- [ ] Section filter shows only sections from selected subject
- [ ] Changing parent filter resets child filters
- [ ] Active filters display correctly
- [ ] Clear all button removes all filters
- [ ] Analytics data updates when filters change
- [ ] Advanced filters section collapses/expands
- [ ] Filters work with time range selection
- [ ] Exported reports reflect filter selection

## Conclusion

The cascading filter implementation provides a powerful, user-friendly way to analyze attendance data at multiple granularity levels while maintaining excellent performance and code quality.
