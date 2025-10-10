import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  valueClassName?: string;
  sublabel?: string; // New prop for the sublabel/description
  loading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  label,
  value,
  valueClassName = "text-blue-900",
  sublabel,
  loading = false
}) => {
  return (
    <Card className="bg-white rounded-xl shadow-md border-0 p-0">
      <CardContent className="p-5 flex flex-col gap-2 min-h-[120px]">
        {/* Top Row: Label and Icon */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-base font-semibold text-blue-900 tracking-tight">{label}</span>
          <span className="w-5 h-5 flex items-center justify-center text-blue-500/80">{icon}</span>
        </div>
        {/* Divider */}
        <div className="h-px bg-gray-200 w-full mb-1" />
        {/* Value */}
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mb-1 mt-1"></div>
        ) : (
          <p className={cn(
            "text-3xl font-bold leading-tight text-blue-900 mb-0 mt-0",
            valueClassName
          )}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        )}
        {/* Sublabel/Description */}
        {sublabel && (
          <p className="text-sm text-blue-900 mt-0.5 mb-0">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
