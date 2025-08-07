import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  valueClassName?: string;
  sublabel?: string; // New prop for the sublabel/description
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
  loading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  label,
  value,
  valueClassName = "text-blue-900",
  sublabel,
  trend,
  onClick,
  loading = false
}) => {
  return (
    <Card
      className={cn(
        "relative bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden",
        onClick && "cursor-pointer hover:shadow-lg"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0.5 pb-1 min-h-[72px] flex flex-col justify-between">
        {/* Top Row: Label and Icon */}
        <div className="flex items-start justify-between mb-0.5">
          <span className="text-sm font-semibold text-blue-800 leading-tight mt-0.5">{label}</span>
          <span className="w-3 h-3 flex items-center justify-center text-blue-500/80 mt-0.5 mr-0.5">{icon}</span>
        </div>
        {/* Divider */}
        <div className="h-px bg-gray-200 mb-1 mt-0.5 w-full" />
        {/* Value */}
        {loading ? (
          <div className="h-5 w-10 bg-gray-200 rounded animate-pulse mb-0.5 mt-0.5"></div>
        ) : (
          <p className={cn(
            "text-lg font-bold text-blue-900 mb-0.5 mt-0.5",
            valueClassName
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        )}
        {/* Sublabel/Description */}
        {sublabel && (
          <p className="text-xs text-gray-500 mt-0.5 mb-0.5">{sublabel}</p>
        )}
        {/* Trend Indicator (optional, if needed) */}
        {trend && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium mt-0.5",
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            <span>{trend.isPositive ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
