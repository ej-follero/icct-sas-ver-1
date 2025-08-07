import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ 
  count = 3, 
  className = "" 
}: CardSkeletonProps) {
  return (
    <div className={`block xl:hidden w-full space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl shadow p-3 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-16 h-5 rounded" />
          </div>
          <Skeleton className="h-6 w-2/3 rounded mb-1" />
          <Skeleton className="h-5 w-1/3 rounded" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
          </div>
          <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-blue-100">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
} 