"use client";

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatusIndicator } from '@/components/reusable';

// Example: Custom Button with Extended Variants
const customButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // 🎨 Custom attendance-specific variants
        attendance: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg",
        success: "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg shadow-yellow-500/25",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25",
        neon: "bg-black text-green-400 border border-green-400 hover:bg-green-400 hover:text-black shadow-[0_0_20px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)]",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        spin: "animate-spin",
      },
    },
    compoundVariants: [
      {
        variant: "attendance",
        size: "lg",
        class: "shadow-xl transform hover:scale-105",
      },
      {
        variant: "neon",
        animation: "pulse",
        class: "animate-pulse",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      animation: "none",
    },
  }
);

// Custom Alert Component
const alertVariants = cva(
  "relative w-full rounded-lg border p-4 transition-all",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-border",
        destructive: "border-red-500/50 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-400",
        warning: "border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-400",
        success: "border-green-500/50 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-400",
        info: "border-blue-500/50 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-400",
        attendance: "border-purple-500/50 bg-purple-50 text-purple-900 dark:bg-purple-950 dark:text-purple-400",
        rfid: "border-orange-500/50 bg-orange-50 text-orange-900 dark:bg-orange-950 dark:text-orange-400",
      },
      size: {
        sm: "p-2 text-sm",
        md: "p-4 text-base",
        lg: "p-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

// Attendance Status Variants
const attendanceStatusVariants = cva(
  "inline-flex items-center gap-2 font-medium transition-all",
  {
    variants: {
      status: {
        present: "text-green-700 dark:text-green-400",
        absent: "text-red-700 dark:text-red-400",
        late: "text-yellow-700 dark:text-yellow-400",
        excused: "text-blue-700 dark:text-blue-400",
        scanning: "text-purple-700 dark:text-purple-400",
        authenticated: "text-green-700 dark:text-green-400",
        denied: "text-red-700 dark:text-red-400",
      },
      variant: {
        default: "",
        badge: "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
        card: "p-3 rounded-lg border shadow-sm",
        pill: "px-4 py-2 rounded-full text-sm",
        minimal: "text-sm",
        emphasis: "px-3 py-2 rounded-lg border-l-4 bg-opacity-10",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },
    },
    compoundVariants: [
      // Attendance emphasis variants
      {
        variant: "emphasis",
        status: "present",
        class: "border-l-green-500 bg-green-500/10",
      },
      {
        variant: "emphasis",
        status: "absent",
        class: "border-l-red-500 bg-red-500/10",
      },
      {
        variant: "emphasis",
        status: "late",
        class: "border-l-yellow-500 bg-yellow-500/10",
      },
      {
        variant: "emphasis",
        status: "excused",
        class: "border-l-blue-500 bg-blue-500/10",
      },
      // Badge variants with status colors
      {
        variant: "badge",
        status: "present",
        class: "bg-green-500 text-white",
      },
      {
        variant: "badge",
        status: "absent",
        class: "bg-red-500 text-white",
      },
      {
        variant: "badge",
        status: "late",
        class: "bg-yellow-500 text-white",
      },
    ],
    defaultVariants: {
      status: "present",
      variant: "default",
      size: "md",
    },
  }
);

interface CustomAlertProps extends VariantProps<typeof alertVariants> {
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  variant,
  size,
  title,
  children,
  className,
  icon,
}) => {
  return (
    <div className={cn(alertVariants({ variant, size }), className)}>
      <div className="flex gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <div className="flex-1">
          {title && <h5 className="mb-2 font-semibold">{title}</h5>}
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
};

interface AttendanceStatusProps extends VariantProps<typeof attendanceStatusVariants> {
  label?: string;
  count?: number;
  className?: string;
  showDot?: boolean;
}

const AttendanceStatus: React.FC<AttendanceStatusProps> = ({
  status,
  variant,
  size,
  label,
  count,
  className,
  showDot = true,
}) => {
  const statusConfig = {
    present: { color: "bg-green-500", label: label || "Present" },
    absent: { color: "bg-red-500", label: label || "Absent" },
    late: { color: "bg-yellow-500", label: label || "Late" },
    excused: { color: "bg-blue-500", label: label || "Excused" },
    scanning: { color: "bg-purple-500 animate-pulse", label: label || "Scanning" },
    authenticated: { color: "bg-green-500", label: label || "Authenticated" },
    denied: { color: "bg-red-500", label: label || "Access Denied" },
  };

  const config = statusConfig[status || 'present'];

  return (
    <div className={cn(attendanceStatusVariants({ status, variant, size }), className)}>
      {showDot && <span className={`w-2 h-2 rounded-full ${config.color}`} />}
      <span>{config.label}</span>
      {count !== undefined && (
        <span className="ml-1 font-bold">({count})</span>
      )}
    </div>
  );
};

export const StylingCustomizationExamples = () => {
  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Styling Customization Guide</h1>
        <p className="text-muted-foreground">
          Learn how to customize and extend the variant system for your attendance system components.
        </p>
      </header>

      {/* Section 1: Basic Variant Customization */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Custom Button Variants</h2>
        <p className="text-muted-foreground mb-4">
          Extended button variants with attendance-specific styling and animations.
        </p>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Button className={cn(customButtonVariants({ variant: "attendance", size: "md" }))}>
            Attendance Portal
          </Button>
          <Button className={cn(customButtonVariants({ variant: "success", size: "md" }))}>
            Mark Present
          </Button>
          <Button className={cn(customButtonVariants({ variant: "warning", size: "md" }))}>
            Late Entry
          </Button>
          <Button className={cn(customButtonVariants({ variant: "danger", size: "md" }))}>
            Mark Absent
          </Button>
          <Button className={cn(customButtonVariants({ variant: "neon", size: "md" }))}>
            RFID Scanner
          </Button>
          <Button className={cn(customButtonVariants({ variant: "ghost", size: "lg" }))}>
            View Reports
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Implementation:</h4>
          <pre className="text-sm overflow-x-auto text-muted-foreground">
{`const customButtonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        attendance: "bg-gradient-to-r from-blue-500 to-indigo-600...",
        success: "bg-green-500 text-white hover:bg-green-600...",
        // Add more variants
      }
    }
  }
);`}
          </pre>
        </div>
      </section>

      {/* Section 2: Alert Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">2. Custom Alert Components</h2>
        <p className="text-muted-foreground mb-4">
          Contextual alerts for different attendance system scenarios.
        </p>

        <div className="space-y-4">
          <CustomAlert 
            variant="attendance" 
            title="Daily Attendance Summary"
            icon={<span className="text-purple-500">📊</span>}
          >
            Today's attendance rate: 94.2% (423/449 students present)
          </CustomAlert>

          <CustomAlert 
            variant="rfid" 
            title="RFID System Alert"
            icon={<span className="text-orange-500">🏷️</span>}
          >
            Scanner #3 in Building A requires maintenance. Last successful scan: 2 hours ago.
          </CustomAlert>

          <CustomAlert 
            variant="success" 
            title="Backup Completed"
            icon={<span className="text-green-500">✅</span>}
          >
            Weekly attendance backup has been successfully completed and stored.
          </CustomAlert>

          <CustomAlert 
            variant="warning" 
            title="High Absenteeism Detected"
            icon={<span className="text-yellow-500">⚠️</span>}
          >
            Computer Science department has 23% absenteeism rate this week, above the 15% threshold.
          </CustomAlert>
        </div>
      </section>

      {/* Section 3: Attendance Status Indicators */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">3. Attendance Status System</h2>
        <p className="text-muted-foreground mb-4">
          Comprehensive status indicators for different attendance states.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Statuses */}
          <div className="space-y-3">
            <h4 className="font-medium">Basic Status Indicators</h4>
            <div className="space-y-2">
              <AttendanceStatus status="present" count={342} />
              <AttendanceStatus status="absent" count={28} />
              <AttendanceStatus status="late" count={15} />
              <AttendanceStatus status="excused" count={8} />
            </div>
          </div>

          {/* Badge Variants */}
          <div className="space-y-3">
            <h4 className="font-medium">Badge Variants</h4>
            <div className="flex flex-wrap gap-2">
              <AttendanceStatus status="present" variant="badge" showDot={false} />
              <AttendanceStatus status="absent" variant="badge" showDot={false} />
              <AttendanceStatus status="late" variant="badge" showDot={false} />
              <AttendanceStatus status="excused" variant="badge" showDot={false} />
            </div>
          </div>

          {/* Emphasis Variants */}
          <div className="space-y-3 md:col-span-2">
            <h4 className="font-medium">Emphasis Cards</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <AttendanceStatus 
                status="present" 
                variant="emphasis" 
                label="Students Present Today"
                count={342}
              />
              <AttendanceStatus 
                status="absent" 
                variant="emphasis" 
                label="Students Absent Today"
                count={28}
              />
              <AttendanceStatus 
                status="late" 
                variant="emphasis" 
                label="Late Arrivals"
                count={15}
              />
              <AttendanceStatus 
                status="excused" 
                variant="emphasis" 
                label="Excused Absences"
                count={8}
              />
            </div>
          </div>

          {/* RFID Statuses */}
          <div className="space-y-3 md:col-span-2">
            <h4 className="font-medium">RFID System Statuses</h4>
            <div className="flex flex-wrap gap-3">
              <AttendanceStatus status="scanning" variant="pill" />
              <AttendanceStatus status="authenticated" variant="pill" />
              <AttendanceStatus status="denied" variant="pill" />
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Responsive Design */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">4. Responsive Variants</h2>
        <p className="text-muted-foreground mb-4">
          Components that adapt to different screen sizes and contexts.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button className="w-full sm:w-auto">Mobile Responsive</Button>
            <Button variant="outline" className="w-full sm:w-auto">Tablet Optimized</Button>
            <Button variant="secondary" className="hidden lg:block">Desktop Only</Button>
            <Button variant="ghost" className="w-full lg:w-auto">Adaptive Width</Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Resize your browser to see how these buttons adapt to different screen sizes.
          </div>
        </div>
      </section>

      {/* Section 5: Dark Mode Support */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">5. Dark Mode Variants</h2>
        <p className="text-muted-foreground mb-4">
          Components that work seamlessly in both light and dark themes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg bg-background">
            <h4 className="font-medium mb-3">Light Theme</h4>
            <div className="space-y-2">
              <AttendanceStatus status="present" variant="emphasis" />
              <StatusIndicator status="success" variant="badge" label="System Online" />
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-slate-900 text-white">
            <h4 className="font-medium mb-3 text-white">Dark Theme</h4>
            <div className="space-y-2">
              <div className="border-l-4 border-l-green-400 bg-green-400/10 px-3 py-2 rounded-lg text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full inline-block mr-2"></span>
                Present
              </div>
              <div className="px-3 py-1 bg-green-400/20 text-green-400 rounded-full text-xs font-semibold">
                SYSTEM ONLINE
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StylingCustomizationExamples; 