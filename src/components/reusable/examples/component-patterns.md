# Component Patterns Guide

This guide shows how to add more components following the established patterns in your reusable component system.

## 🏗️ Architecture Principles

### 1. Variant-First Design
Every component should use the CVA (class-variance-authority) pattern:

```typescript
const componentVariants = cva(
  "base-classes", // Always applied
  {
    variants: {
      variant: {
        default: "default-styles",
        primary: "primary-styles",
        attendance: "attendance-specific-styles",
      },
      size: {
        sm: "small-size-styles",
        md: "medium-size-styles", 
        lg: "large-size-styles",
      },
      state: {
        default: "",
        loading: "loading-styles",
        error: "error-styles",
      },
    },
    compoundVariants: [
      {
        variant: "primary",
        size: "lg",
        class: "special-large-primary-styles",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      state: "default",
    },
  }
);
```

### 2. TypeScript-First
Always define comprehensive interfaces:

```typescript
interface ComponentProps extends VariantProps<typeof componentVariants> {
  // Required props
  title: string;
  
  // Optional props with defaults
  className?: string;
  testId?: string;
  children?: React.ReactNode;
  
  // Event handlers
  onClick?: () => void;
  onChange?: (value: any) => void;
  
  // Specific to your domain
  attendanceData?: AttendanceRecord[];
}
```

### 3. ForwardRef Pattern
Use forwardRef for DOM access:

```typescript
const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ variant, size, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size }), className)}
        {...props}
      >
        {/* Component content */}
      </div>
    );
  }
);

Component.displayName = "Component";
```

## 📊 Example: Creating a Dashboard Widget

Let's create a comprehensive dashboard widget component:

### Step 1: Define the Variants

```typescript
const dashboardWidgetVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all p-6",
  {
    variants: {
      type: {
        metric: "border-l-4 border-l-blue-500",
        chart: "p-4",
        status: "border-l-4 border-l-green-500",
        alert: "border-l-4 border-l-red-500 bg-red-50/50",
        attendance: "border-l-4 border-l-purple-500 bg-purple-50/50",
        rfid: "border-l-4 border-l-orange-500 bg-orange-50/50",
      },
      size: {
        sm: "p-4 min-h-[120px]",
        md: "p-6 min-h-[160px]",
        lg: "p-8 min-h-[200px]",
        xl: "p-10 min-h-[240px]",
      },
      interactive: {
        true: "hover:shadow-lg cursor-pointer transform hover:scale-[1.02]",
        false: "",
      },
      loading: {
        true: "animate-pulse pointer-events-none",
        false: "",
      },
    },
    compoundVariants: [
      {
        type: "alert",
        interactive: true,
        class: "hover:bg-red-100/70",
      },
      {
        type: "attendance",
        size: "lg",
        class: "bg-gradient-to-br from-purple-50 to-purple-100/50",
      },
    ],
    defaultVariants: {
      type: "metric",
      size: "md",
      interactive: false,
      loading: false,
    },
  }
);
```

### Step 2: Create the Interface

```typescript
interface DashboardWidgetProps extends VariantProps<typeof dashboardWidgetVariants> {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  testId?: string;
  
  // Analytics props
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  
  // Attendance-specific props
  attendanceData?: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  
  // Event handlers
  onClick?: () => void;
  onRefresh?: () => void;
}
```

### Step 3: Implement the Component

```typescript
const DashboardWidget = React.forwardRef<HTMLDivElement, DashboardWidgetProps>(
  ({
    type,
    size,
    interactive,
    loading,
    title,
    value,
    subtitle,
    icon,
    actions,
    children,
    className,
    testId,
    trend,
    attendanceData,
    onClick,
    onRefresh,
    ...props
  }, ref) => {
    // Helper function for trend display
    const getTrendDisplay = () => {
      if (!trend) return null;
      
      const trendColor = {
        up: "text-green-600",
        down: "text-red-600", 
        neutral: "text-gray-600",
      }[trend.direction];
      
      const trendIcon = {
        up: "↗️",
        down: "↘️",
        neutral: "→",
      }[trend.direction];
      
      return (
        <span className={cn("text-sm font-medium", trendColor)}>
          {trendIcon} {Math.abs(trend.value)}% vs {trend.period}
        </span>
      );
    };

    // Helper function for attendance display
    const getAttendanceDisplay = () => {
      if (!attendanceData) return null;
      
      const percentage = ((attendanceData.present / attendanceData.total) * 100).toFixed(1);
      
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Present: {attendanceData.present}</span>
            <span>Absent: {attendanceData.absent}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {percentage}% attendance rate
          </p>
        </div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(dashboardWidgetVariants({ type, size, interactive, loading }), className)}
        onClick={interactive ? onClick : undefined}
        data-testid={testId}
        {...props}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-muted-foreground">{title}</h3>
            {value && (
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold">{value}</span>
                {getTrendDisplay()}
              </div>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {icon && <div className="text-2xl opacity-70">{icon}</div>}
            {onRefresh && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
                }}
                className="text-xs opacity-70 hover:opacity-100 transition-opacity"
              >
                🔄
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {children}
          {attendanceData && getAttendanceDisplay()}
        </div>

        {/* Actions */}
        {actions && (
          <div className="mt-4 pt-4 border-t border-border">
            {actions}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </div>
    );
  }
);

DashboardWidget.displayName = "DashboardWidget";
```

### Step 4: Add Convenience Components

```typescript
// Attendance-specific widget
export const AttendanceWidget: React.FC<Omit<DashboardWidgetProps, 'type'>> = (props) => (
  <DashboardWidget type="attendance" {...props} />
);

// RFID system widget
export const RFIDWidget: React.FC<Omit<DashboardWidgetProps, 'type'>> = (props) => (
  <DashboardWidget type="rfid" {...props} />
);

// Metric widget with trend
export const MetricWidget: React.FC<DashboardWidgetProps & { showTrend?: boolean }> = ({ 
  showTrend = true, 
  ...props 
}) => (
  <DashboardWidget 
    type="metric" 
    interactive={showTrend}
    {...props} 
  />
);
```

## 🔧 Advanced Patterns

### 1. Compound Components
For complex components with multiple parts:

```typescript
const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
};

// Usage:
<Card.Root>
  <Card.Header>
    <Card.Title>Attendance Summary</Card.Title>
  </Card.Header>
  <Card.Content>
    <AttendanceChart />
  </Card.Content>
  <Card.Footer>
    <Button>View Details</Button>
  </Card.Footer>
</Card.Root>
```

### 2. Render Props Pattern
For flexible content rendering:

```typescript
interface DataTableProps<T> {
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

const DataTable = <T,>({ data, renderRow, renderHeader, renderEmpty }: DataTableProps<T>) => {
  if (data.length === 0) {
    return renderEmpty?.() || <EmptyState scenario="search" />;
  }
  
  return (
    <div className="space-y-2">
      {renderHeader?.()}
      {data.map((item, index) => renderRow(item, index))}
    </div>
  );
};
```

### 3. Context-Based Components
For sharing state across component tree:

```typescript
const AttendanceContext = React.createContext<{
  filters: AttendanceFilters;
  setFilters: (filters: AttendanceFilters) => void;
  data: AttendanceRecord[];
  loading: boolean;
}>({} as any);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<AttendanceFilters>({});
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  return (
    <AttendanceContext.Provider value={{ filters, setFilters, data, loading }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
};
```

## 📁 File Organization

### Directory Structure
```
src/components/reusable/
├── index.ts                 # Main exports
├── types.ts                # Shared types
├── README.md               # Documentation
├── ComponentName/          # Component directory
│   ├── ComponentName.tsx   # Main component
│   ├── ComponentName.test.tsx
│   ├── ComponentName.stories.tsx
│   └── index.ts           # Component exports
└── examples/              # Usage examples
    ├── basic-examples.tsx
    ├── advanced-examples.tsx
    └── complete-examples.tsx
```

### Export Pattern
```typescript
// components/reusable/DashboardWidget/index.ts
export { DashboardWidget, AttendanceWidget, RFIDWidget, MetricWidget } from './DashboardWidget';
export type { DashboardWidgetProps } from './DashboardWidget';

// components/reusable/index.ts
export * from './DashboardWidget';
export * from './DataTable';
export * from './StatusIndicator';
// ... other exports
```

## ✅ Checklist for New Components

### Design Phase
- [ ] Define the component's purpose and use cases
- [ ] Identify required and optional props
- [ ] Design variant structure (type, size, state, etc.)
- [ ] Plan compound variants for special combinations
- [ ] Consider accessibility requirements

### Implementation Phase
- [ ] Create CVA variants with semantic naming
- [ ] Define comprehensive TypeScript interface
- [ ] Implement component with forwardRef
- [ ] Add proper event handling
- [ ] Include loading and error states
- [ ] Add accessibility attributes (aria-*, role, etc.)

### Documentation Phase
- [ ] Write JSDoc comments for props and component
- [ ] Create usage examples (basic and advanced)
- [ ] Add to Storybook if available
- [ ] Update component index exports
- [ ] Test component in different scenarios

### Integration Phase
- [ ] Add to design system documentation
- [ ] Create convenience components if needed
- [ ] Test with existing components
- [ ] Validate responsiveness and theming
- [ ] Performance testing for complex components

## 🎯 Attendance System Specific Components

Here are component ideas specific to your attendance system:

### 1. AttendanceCalendar
```typescript
interface AttendanceCalendarProps {
  month: Date;
  attendanceData: Record<string, AttendanceStatus>;
  onDateClick?: (date: Date) => void;
  highlightToday?: boolean;
  showLegend?: boolean;
}
```

### 2. RFIDScanner
```typescript
interface RFIDScannerProps {
  status: 'idle' | 'scanning' | 'success' | 'error';
  onScan?: (tagId: string) => void;
  timeout?: number;
  showAnimation?: boolean;
}
```

### 3. StudentCard
```typescript
interface StudentCardProps {
  student: Student;
  attendanceRecord?: AttendanceRecord;
  showPhoto?: boolean;
  actions?: React.ReactNode;
  variant?: 'default' | 'compact' | 'detailed';
}
```

### 4. AttendanceChart
```typescript
interface AttendanceChartProps {
  data: AttendanceData[];
  type: 'line' | 'bar' | 'pie';
  period: 'daily' | 'weekly' | 'monthly';
  department?: string;
  interactive?: boolean;
}
```

This guide provides a comprehensive foundation for extending your component system while maintaining consistency and following best practices. 