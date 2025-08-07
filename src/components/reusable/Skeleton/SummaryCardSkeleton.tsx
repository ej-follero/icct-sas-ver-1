import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardSkeletonProps {
  count?: number;
  className?: string;
}

export function SummaryCardSkeleton({ 
  count = 4, 
  className = "" 
}: SummaryCardSkeletonProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:gap-8 w-full ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-white rounded-xl p-6 border border-blue-200 shadow-sm animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-2/3 rounded mb-2" />
          <Skeleton className="h-6 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
} 