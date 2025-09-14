import React from "react";

export type StatusType = 'active' | 'inactive' | 'present' | 'absent' | 'late' | 'excused';

interface StatusBadgeProps {
  status: StatusType;
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-200' },
  inactive: { label: 'Inactive', color: 'bg-red-100 text-red-800 border-red-200' },
  present: { label: 'Present', color: 'bg-green-100 text-green-800 border-green-200' },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-800 border-red-200' },
  late: { label: 'Late', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  excused: { label: 'Excused', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  
};

export function StatusBadge({ status, showLabel = true, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase() as StatusType] || statusConfig.inactive;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.color} ${className}`}
    >
      {showLabel ? config.label : status}
    </span>
  );
} 