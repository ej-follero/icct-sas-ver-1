import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({ 
  columns, 
  rows = 5, 
  className = "" 
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <TableRow key={`skeleton-row-${idx}`} className={className}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <TableCell key={`skeleton-cell-${idx}-${colIdx}`}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
} 