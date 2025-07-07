"use client";

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const attendanceStatusCardVariants = cva(
  "transition-all duration-200 hover:shadow-md",
  {
    variants: {
      status: {
        present: "border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
        absent: "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
        late: "border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20",
        excused: "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
        total: "border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] hover:shadow-lg",
        false: "",
      },
    },
    defaultVariants: {
      status: "present",
      size: "md",
      interactive: false,
    },
  }
);

interface AttendanceStatusCardProps extends VariantProps<typeof attendanceStatusCardVariants> {
  title: string;
  count: number;
  total?: number;
  percentage?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  className?: string;
  testId?: string;
  onClick?: () => void;
}

const AttendanceStatusCard = React.forwardRef<HTMLDivElement, AttendanceStatusCardProps>(
  ({
    status,
    size,
    interactive,
    title,
    count,
    total,
    percentage,
    subtitle,
    icon,
    trend,
    className,
    testId,
    onClick,
    ...props
  }, ref) => {
    // Calculate percentage if not provided but total is available
    const calculatedPercentage = percentage ?? (total ? Math.round((count / total) * 100) : undefined);
    
    // Status configuration
    const statusConfig = {
      present: { 
        color: "text-green-700 dark:text-green-400", 
        bgColor: "bg-green-500",
        defaultIcon: "✅"
      },
      absent: { 
        color: "text-red-700 dark:text-red-400", 
        bgColor: "bg-red-500",
        defaultIcon: "❌"
      },
      late: { 
        color: "text-yellow-700 dark:text-yellow-400", 
        bgColor: "bg-yellow-500",
        defaultIcon: "⏰"
      },
      excused: { 
        color: "text-blue-700 dark:text-blue-400", 
        bgColor: "bg-blue-500",
        defaultIcon: "📋"
      },
      total: { 
        color: "text-purple-700 dark:text-purple-400", 
        bgColor: "bg-purple-500",
        defaultIcon: "👥"
      },
    };

    const config = statusConfig[status || 'present'];

    // Trend display
    const getTrendDisplay = () => {
      if (!trend) return null;
      
      const trendColor = {
        up: "text-green-600 dark:text-green-400",
        down: "text-red-600 dark:text-red-400",
        neutral: "text-gray-600 dark:text-gray-400",
      }[trend.direction];
      
      const trendIcon = {
        up: "↗️",
        down: "↘️", 
        neutral: "→",
      }[trend.direction];
      
      return (
        <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
          <span>{trendIcon}</span>
          <span className="font-medium">{Math.abs(trend.value)}%</span>
          <span className="text-muted-foreground">vs {trend.period}</span>
        </div>
      );
    };

    return (
      <Card
        ref={ref}
        className={cn(attendanceStatusCardVariants({ status, size, interactive }), className)}
        onClick={interactive ? onClick : undefined}
        data-testid={testId}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              {icon || <span className="text-lg">{config.defaultIcon}</span>}
              <h3 className={cn("font-medium text-sm", config.color)}>{title}</h3>
            </div>
            
            {/* Main Count */}
            <div className="mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{count.toLocaleString()}</span>
                {calculatedPercentage !== undefined && (
                  <span className={cn("text-lg font-semibold", config.color)}>
                    ({calculatedPercentage}%)
                  </span>
                )}
              </div>
              
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
              
              {total && (
                <p className="text-xs text-muted-foreground">
                  out of {total.toLocaleString()} total
                </p>
              )}
            </div>

            {/* Trend */}
            {getTrendDisplay()}
          </div>

          {/* Progress Ring (if percentage available) */}
          {calculatedPercentage !== undefined && (
            <div className="flex-shrink-0 ml-4">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="100, 100"
                    className="text-muted-foreground/20"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${calculatedPercentage}, 100`}
                    className={config.color}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-xs font-bold", config.color)}>
                    {calculatedPercentage}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

AttendanceStatusCard.displayName = "AttendanceStatusCard";

// Convenience components for specific use cases
export const PresentStudentsCard: React.FC<Omit<AttendanceStatusCardProps, 'status'>> = (props) => (
  <AttendanceStatusCard status="present" {...props} />
);

export const AbsentStudentsCard: React.FC<Omit<AttendanceStatusCardProps, 'status'>> = (props) => (
  <AttendanceStatusCard status="absent" {...props} />
);

export const LateStudentsCard: React.FC<Omit<AttendanceStatusCardProps, 'status'>> = (props) => (
  <AttendanceStatusCard status="late" {...props} />
);

export const TotalStudentsCard: React.FC<Omit<AttendanceStatusCardProps, 'status'>> = (props) => (
  <AttendanceStatusCard status="total" {...props} />
);

export { AttendanceStatusCard, type AttendanceStatusCardProps }; 