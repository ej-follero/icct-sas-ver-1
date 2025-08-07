"use client";

import { cn } from "@/utils";

interface ProgressBarProps {
  progress: number; // 0-100
  status?: string;
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
  emphasized?: boolean; // New prop for emphasized styling
}

export default function ProgressBar({ 
  progress, 
  status, 
  className,
  showPercentage = true,
  animated = true,
  emphasized = false
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-3">
        {status && (
          <span className={cn(
            "font-medium",
            emphasized ? "text-sm text-blue-900" : "text-sm text-gray-700"
          )}>
            {status}
          </span>
        )}
        {showPercentage && (
          <span className={cn(
            "font-semibold",
            emphasized ? "text-sm text-blue-800" : "text-sm text-gray-500"
          )}>
            {clampedProgress}%
          </span>
        )}
      </div>
      <div className={cn(
        "w-full rounded-full overflow-hidden",
        emphasized ? "h-3 bg-blue-100 border border-blue-200" : "h-2 bg-gray-200"
      )}>
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out relative",
            emphasized 
              ? "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg" 
              : "bg-gradient-to-r from-blue-500 to-blue-600",
            animated && emphasized && "animate-pulse",
            animated && !emphasized && "animate-pulse"
          )}
          style={{ width: `${clampedProgress}%` }}
        >
          {emphasized && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
          )}
        </div>
      </div>
      {emphasized && (
        <div className="flex items-center justify-between mt-2 text-xs text-blue-600">
          <span>Processing files...</span>
          <span>{clampedProgress}% complete</span>
        </div>
      )}
    </div>
  );
} 