"use client";

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================
// PATTERN 1: DATA VISUALIZATION COMPONENT
// ============================================

const chartVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all",
  {
    variants: {
      type: {
        bar: "p-4",
        line: "p-4", 
        pie: "p-6",
        donut: "p-6",
        area: "p-4",
        attendance: "p-4 border-l-4 border-l-blue-500",
      },
      size: {
        sm: "h-48 w-full",
        md: "h-64 w-full",
        lg: "h-80 w-full",
        xl: "h-96 w-full",
      },
      interactive: {
        true: "hover:shadow-lg cursor-pointer transform hover:scale-[1.02]",
        false: "",
      },
    },
    defaultVariants: {
      type: "bar",
      size: "md",
      interactive: false,
    },
  }
);

interface ChartProps extends VariantProps<typeof chartVariants> {
  title: string;
  data: any[];
  className?: string;
  onInteract?: (data: any) => void;
  showLegend?: boolean;
  children?: React.ReactNode;
}

const Chart: React.FC<ChartProps> = ({
  type,
  size,
  interactive,
  title,
  data,
  className,
  onInteract,
  showLegend = true,
  children,
}) => {
  return (
    <div 
      className={cn(chartVariants({ type, size, interactive }), className)}
      onClick={interactive ? () => onInteract?.(data) : undefined}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {showLegend && (
          <div className="flex gap-2">
            <Badge variant="outline">Live Data</Badge>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex items-center justify-center min-h-[200px] bg-muted/20 rounded">
        {children || (
          <div className="text-center text-muted-foreground">
            <div className="text-2xl mb-2">📊</div>
            <p>Chart visualization would render here</p>
            <p className="text-xs mt-1">Data points: {data.length}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// PATTERN 2: NOTIFICATION SYSTEM
// ============================================

const notificationVariants = cva(
  "flex items-start gap-3 p-4 rounded-lg border transition-all duration-300",
  {
    variants: {
      type: {
        info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100",
        success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100",
        error: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100",
        attendance: "bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-100",
        system: "bg-gray-50 border-gray-200 text-gray-900 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-100",
      },
      position: {
        "top-right": "fixed top-4 right-4 z-50",
        "top-left": "fixed top-4 left-4 z-50",
        "bottom-right": "fixed bottom-4 right-4 z-50",
        "bottom-left": "fixed bottom-4 left-4 z-50",
        inline: "relative",
      },
      animation: {
        none: "",
        slide: "animate-in slide-in-from-right-full",
        fade: "animate-in fade-in",
        bounce: "animate-in bounce-in",
      },
    },
    defaultVariants: {
      type: "info",
      position: "inline",
      animation: "none",
    },
  }
);

interface NotificationProps extends VariantProps<typeof notificationVariants> {
  title: string;
  message: string;
  timestamp?: Date;
  dismissible?: boolean;
  onDismiss?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  position,
  animation,
  title,
  message,
  timestamp,
  dismissible = true,
  onDismiss,
  actions,
  className,
}) => {
  const typeIcons = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    attendance: "👥",
    system: "⚙️",
  };

  return (
    <div className={cn(notificationVariants({ type, position, animation }), className)}>
      <div className="flex-shrink-0 text-xl">
        {typeIcons[type || 'info']}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-sm opacity-90 mt-1">{message}</p>
            {timestamp && (
              <p className="text-xs opacity-70 mt-2">
                {timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          {dismissible && (
            <button
              onClick={onDismiss}
              className="ml-2 text-sm opacity-70 hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          )}
        </div>
        
        {actions && (
          <div className="mt-3 flex gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// PATTERN 3: METRIC CARD COMPONENT
// ============================================

const metricCardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm transition-all p-6",
  {
    variants: {
      trend: {
        up: "border-l-4 border-l-green-500",
        down: "border-l-4 border-l-red-500", 
        neutral: "border-l-4 border-l-gray-500",
        none: "",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: "hover:shadow-lg cursor-pointer",
        false: "",
      },
      emphasis: {
        high: "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
        medium: "bg-muted/50",
        low: "",
      },
    },
    defaultVariants: {
      trend: "none",
      size: "md",
      interactive: false,
      emphasis: "low",
    },
  }
);

interface MetricCardProps extends VariantProps<typeof metricCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    period: string;
  };
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  trend,
  size,
  interactive,
  emphasis,
  title,
  value,
  subtitle,
  change,
  icon,
  className,
  onClick,
}) => {
  const getTrendColor = () => {
    if (!change) return "";
    if (change.value > 0) return "text-green-600";
    if (change.value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = () => {
    if (!change) return "";
    if (change.value > 0) return "↗️";
    if (change.value < 0) return "↘️";
    return "→";
  };

  return (
    <Card 
      className={cn(metricCardVariants({ trend, size, interactive, emphasis }), className)}
      onClick={interactive ? onClick : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-2xl font-bold">{value}</h3>
            {change && (
              <span className={cn("text-sm font-medium", getTrendColor())}>
                {getTrendIcon()} {Math.abs(change.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {change && (
            <p className="text-xs text-muted-foreground mt-1">
              vs {change.period}
            </p>
          )}
        </div>
        
        {icon && (
          <div className="text-2xl opacity-70">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// ============================================
// PATTERN 4: TIMELINE COMPONENT
// ============================================

const timelineVariants = cva(
  "relative",
  {
    variants: {
      orientation: {
        vertical: "space-y-4",
        horizontal: "flex space-x-4 overflow-x-auto pb-4",
      },
      dense: {
        true: "space-y-2",
        false: "space-y-4",
      },
    },
    defaultVariants: {
      orientation: "vertical",
      dense: false,
    },
  }
);

const timelineItemVariants = cva(
  "relative flex gap-4 transition-all",
  {
    variants: {
      status: {
        completed: "opacity-100",
        current: "opacity-100",
        pending: "opacity-60",
        cancelled: "opacity-40 line-through",
      },
      emphasis: {
        true: "bg-muted/30 p-4 rounded-lg",
        false: "",
      },
    },
    defaultVariants: {
      status: "pending",
      emphasis: false,
    },
  }
);

interface TimelineItemProps extends VariantProps<typeof timelineItemVariants> {
  title: string;
  description?: string;
  timestamp: Date;
  user?: string;
  icon?: React.ReactNode;
  className?: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  status,
  emphasis,
  title,
  description,
  timestamp,
  user,
  icon,
  className,
}) => {
  const statusColors = {
    completed: "bg-green-500",
    current: "bg-blue-500 animate-pulse",
    pending: "bg-gray-300",
    cancelled: "bg-red-500",
  };

  return (
    <div className={cn(timelineItemVariants({ status, emphasis }), className)}>
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "w-3 h-3 rounded-full border-2 border-background",
          statusColors[status || 'pending']
        )}>
          {icon && (
            <div className="text-xs text-white flex items-center justify-center h-full">
              {icon}
            </div>
          )}
        </div>
        <div className="w-0.5 h-8 bg-border mt-2 last:hidden" />
      </div>
      
      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-sm">{title}</h4>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <time className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString()}
          </time>
        </div>
        {user && (
          <p className="text-xs text-muted-foreground mt-2">by {user}</p>
        )}
      </div>
    </div>
  );
};

interface TimelineProps extends VariantProps<typeof timelineVariants> {
  items: TimelineItemProps[];
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({
  orientation,
  dense,
  items,
  className,
}) => {
  return (
    <div className={cn(timelineVariants({ orientation, dense }), className)}>
      {items.map((item, index) => (
        <TimelineItem key={index} {...item} />
      ))}
    </div>
  );
};

// ============================================
// USAGE EXAMPLES
// ============================================

export const ComponentPatternsExamples = () => {
  const [notifications, setNotifications] = React.useState<any[]>([
    {
      id: 1,
      type: "attendance",
      title: "High Absenteeism Alert",
      message: "CS101 has 30% absenteeism today",
      timestamp: new Date(),
    },
    {
      id: 2,
      type: "system",
      title: "RFID Scanner Offline",
      message: "Building A - Scanner #3 requires maintenance",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
  ]);

  const timelineItems: TimelineItemProps[] = [
    {
      title: "Class Started",
      description: "CS101 - Introduction to Programming",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      user: "Dr. Smith",
      status: "completed",
      icon: "🎓",
    },
    {
      title: "Attendance Taken",
      description: "42 students present, 3 absent",
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
      user: "System",
      status: "completed",
      icon: "✅",
    },
    {
      title: "Late Arrival",
      description: "Student ID: 12345 marked late",
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      user: "RFID Scanner",
      status: "current",
      icon: "⏰",
    },
    {
      title: "Class End",
      description: "Scheduled for 3:00 PM",
      timestamp: new Date(Date.now() + 1000 * 60 * 30),
      user: "System",
      status: "pending",
      icon: "🏁",
    },
  ];

  const chartData = [
    { day: "Mon", present: 95, absent: 5 },
    { day: "Tue", present: 92, absent: 8 },
    { day: "Wed", present: 98, absent: 2 },
    { day: "Thu", present: 89, absent: 11 },
    { day: "Fri", present: 94, absent: 6 },
  ];

  return (
    <div className="space-y-12 p-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold mb-2">Component Patterns Guide</h1>
        <p className="text-muted-foreground">
          Learn how to create new components following established patterns and conventions.
        </p>
      </header>

      {/* Section 1: Chart Components */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">1. Data Visualization Components</h2>
          <p className="text-muted-foreground mb-4">
            Charts and graphs for displaying attendance analytics and system metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Chart
            type="attendance"
            title="Weekly Attendance"
            data={chartData}
            interactive
            onInteract={(data) => console.log("Chart clicked:", data)}
          />
          
          <Chart
            type="pie"
            title="Department Distribution"
            data={[]}
            size="md"
          />
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Pattern Structure:</h4>
          <pre className="text-sm text-muted-foreground overflow-x-auto">
{`// 1. Define variants with CVA
const chartVariants = cva("base-classes", {
  variants: {
    type: { bar: "...", line: "...", attendance: "..." },
    size: { sm: "...", md: "...", lg: "..." },
    interactive: { true: "hover:...", false: "" }
  }
});

// 2. Create TypeScript interface
interface ChartProps extends VariantProps<typeof chartVariants> {
  title: string;
  data: any[];
  onInteract?: (data: any) => void;
}

// 3. Implement component with forwarded refs
const Chart = React.forwardRef<HTMLDivElement, ChartProps>(...);`}
          </pre>
        </div>
      </section>

      {/* Section 2: Notification System */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">2. Notification System</h2>
          <p className="text-muted-foreground mb-4">
            Real-time notifications for attendance alerts and system updates.
          </p>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <Notification
              key={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              timestamp={notification.timestamp}
              onDismiss={() => setNotifications(prev => 
                prev.filter(n => n.id !== notification.id)
              )}
              actions={
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">View Details</Button>
                  <Button size="sm">Acknowledge</Button>
                </div>
              }
            />
          ))}
        </div>
      </section>

      {/* Section 3: Metric Cards */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">3. Metric Cards</h2>
          <p className="text-muted-foreground mb-4">
            Key performance indicators and statistics display.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Students"
            value="1,234"
            subtitle="Enrolled this semester"
            trend="up"
            change={{ value: 5.2, period: "last week" }}
            icon="👥"
            emphasis="high"
            interactive
          />
          
          <MetricCard
            title="Attendance Rate"
            value="94.2%"
            subtitle="This week average"
            trend="down"
            change={{ value: -2.1, period: "last week" }}
            icon="📊"
            emphasis="medium"
          />
          
          <MetricCard
            title="Active RFID Tags"
            value="1,187"
            subtitle="Devices online"
            trend="neutral"
            icon="🏷️"
          />
          
          <MetricCard
            title="System Uptime"
            value="99.8%"
            subtitle="Last 30 days"
            trend="up"
            change={{ value: 0.3, period: "last month" }}
            icon="⚡"
            emphasis="low"
          />
        </div>
      </section>

      {/* Section 4: Timeline */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">4. Timeline Components</h2>
          <p className="text-muted-foreground mb-4">
            Activity feeds and event sequences for tracking attendance events.
          </p>
        </div>

        <div className="max-w-2xl">
          <Timeline
            items={timelineItems}
            orientation="vertical"
            dense={false}
          />
        </div>
      </section>

      {/* Section 5: Implementation Guide */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">5. Implementation Steps</h2>
          <p className="text-muted-foreground mb-4">
            Follow these steps to create new components using established patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Step 1: Define Variants</h3>
            <div className="space-y-2 text-sm">
              <p>• Use CVA for styling variants</p>
              <p>• Include semantic variants (e.g., 'attendance', 'rfid')</p>
              <p>• Add size, state, and interaction variants</p>
              <p>• Define compound variants for combinations</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Step 2: TypeScript Interface</h3>
            <div className="space-y-2 text-sm">
              <p>• Extend VariantProps for variants</p>
              <p>• Add required props (title, data, etc.)</p>
              <p>• Include optional props (className, testId)</p>
              <p>• Define callback functions</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Step 3: Component Logic</h3>
            <div className="space-y-2 text-sm">
              <p>• Use forwardRef for DOM access</p>
              <p>• Implement state management</p>
              <p>• Add event handlers</p>
              <p>• Include accessibility attributes</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Step 4: Export & Document</h3>
            <div className="space-y-2 text-sm">
              <p>• Add to reusable components index</p>
              <p>• Create usage examples</p>
              <p>• Write JSDoc comments</p>
              <p>• Add to Storybook (if available)</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default ComponentPatternsExamples; 