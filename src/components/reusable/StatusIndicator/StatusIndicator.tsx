"use client";

import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  LucideIcon 
} from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { BaseComponentProps, StatusConfig } from '../types';

// Status icon mapping
const statusIcons: Record<StatusConfig['status'], LucideIcon> = {
  online: Wifi,
  offline: WifiOff,
  pending: Clock,
  error: XCircle,
  success: CheckCircle,
  warning: AlertCircle,
};

// Status variants
const statusVariants = cva(
  "inline-flex items-center gap-2 font-medium transition-colors",
  {
    variants: {
      status: {
        online: "text-green-700",
        offline: "text-gray-500",
        pending: "text-yellow-700",
        error: "text-red-700",
        success: "text-green-700",
        warning: "text-orange-700",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
      variant: {
        default: "",
        badge: "px-2 py-1 rounded-full",
        card: "p-3 rounded-lg border",
        subtle: "opacity-75",
      },
    },
    compoundVariants: [
      // Badge variants with background colors
      {
        variant: "badge",
        status: "online",
        class: "bg-green-100 text-green-800",
      },
      {
        variant: "badge",
        status: "offline",
        class: "bg-gray-100 text-gray-800",
      },
      {
        variant: "badge",
        status: "pending",
        class: "bg-yellow-100 text-yellow-800",
      },
      {
        variant: "badge",
        status: "error",
        class: "bg-red-100 text-red-800",
      },
      {
        variant: "badge",
        status: "success",
        class: "bg-green-100 text-green-800",
      },
      {
        variant: "badge",
        status: "warning",
        class: "bg-orange-100 text-orange-800",
      },
      // Card variants
      {
        variant: "card",
        status: "online",
        class: "bg-green-50 border-green-200",
      },
      {
        variant: "card",
        status: "offline",
        class: "bg-gray-50 border-gray-200",
      },
      {
        variant: "card",
        status: "pending",
        class: "bg-yellow-50 border-yellow-200",
      },
      {
        variant: "card",
        status: "error",
        class: "bg-red-50 border-red-200",
      },
      {
        variant: "card",
        status: "success",
        class: "bg-green-50 border-green-200",
      },
      {
        variant: "card",
        status: "warning",
        class: "bg-orange-50 border-orange-200",
      },
    ],
    defaultVariants: {
      status: "success",
      size: "md",
      variant: "default",
    },
  }
);

const dotVariants = cva(
  "rounded-full animate-pulse",
  {
    variants: {
      status: {
        online: "bg-green-500",
        offline: "bg-gray-400",
        pending: "bg-yellow-500",
        error: "bg-red-500",
        success: "bg-green-500",
        warning: "bg-orange-500",
      },
      size: {
        xs: "w-1.5 h-1.5",
        sm: "w-2 h-2",
        md: "w-2.5 h-2.5",
        lg: "w-3 h-3",
        xl: "w-4 h-4",
      },
    },
    defaultVariants: {
      status: "success",
      size: "md",
    },
  }
);

const iconVariants = cva(
  "flex-shrink-0",
  {
    variants: {
      size: {
        xs: "w-3 h-3",
        sm: "w-4 h-4",
        md: "w-4 h-4",
        lg: "w-5 h-5",
        xl: "w-6 h-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// Component Props
export interface StatusIndicatorProps 
  extends BaseComponentProps,
          VariantProps<typeof statusVariants>,
          Partial<StatusConfig> {
  // Optional overrides
  icon?: React.ReactNode;
  animated?: boolean;
  onClick?: () => void;
  href?: string;
}

// Status message mapping for default labels
const statusMessages: Record<StatusConfig['status'], string> = {
  online: "Online",
  offline: "Offline", 
  pending: "Pending",
  error: "Error",
  success: "Success",
  warning: "Warning",
};

// Main Component
const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ 
    className,
    children,
    testId,
    status = "success",
    size = "md",
    variant = "default",
    label,
    showDot = false,
    icon,
    animated = false,
    onClick,
    href,
    ...props 
  }, ref) => {
    // Get appropriate icon
    const StatusIcon = statusIcons[status];
    const displayIcon = icon || <StatusIcon className={cn(iconVariants({ size }))} />;
    const displayLabel = label || statusMessages[status];

    // Animation classes
    const animationClasses = animated ? {
      online: "animate-pulse",
      pending: "animate-spin",
      error: "animate-bounce",
      success: "animate-pulse",
      warning: "animate-pulse",
      offline: "",
    }[status] : "";

    // Render content
    const content = (
      <>
        {/* Status dot */}
        {showDot && (
          <span 
            className={cn(
              dotVariants({ status, size }),
              animated && "animate-pulse"
            )} 
          />
        )}
        
        {/* Icon */}
        <span className={cn(animationClasses)}>
          {displayIcon}
        </span>
        
        {/* Label */}
        {displayLabel && (
          <span className="flex-1 min-w-0 truncate">
            {displayLabel}
          </span>
        )}
        
        {/* Custom children */}
        {children}
      </>
    );

    // If it's a link
    if (href) {
      return (
        <a
          href={href}
          ref={ref as any}
          className={cn(
            statusVariants({ status, size, variant }),
            "hover:opacity-75 cursor-pointer",
            className
          )}
          data-testid={testId}
          {...props}
        >
          {content}
        </a>
      );
    }

    // If it's clickable
    if (onClick) {
      return (
        <button
          ref={ref as any}
          onClick={onClick}
          className={cn(
            statusVariants({ status, size, variant }),
            "hover:opacity-75 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            className
          )}
          data-testid={testId}
          {...props}
        >
          {content}
        </button>
      );
    }

    // Default div
    return (
      <div
        ref={ref}
        className={cn(statusVariants({ status, size, variant }), className)}
        data-testid={testId}
        {...props}
      >
        {content}
      </div>
    );
  }
);

StatusIndicator.displayName = "StatusIndicator";

// Convenience components for common use cases
export const OnlineStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = (props) => (
  <StatusIndicator status="online" {...props} />
);

export const OfflineStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = (props) => (
  <StatusIndicator status="offline" {...props} />
);

export const PendingStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = (props) => (
  <StatusIndicator status="pending" animated {...props} />
);

export const ErrorStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = (props) => (
  <StatusIndicator status="error" {...props} />
);

export const SuccessStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = (props) => (
  <StatusIndicator status="success" {...props} />
);

export const WarningStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = (props) => (
  <StatusIndicator status="warning" {...props} />
);

export default StatusIndicator; 