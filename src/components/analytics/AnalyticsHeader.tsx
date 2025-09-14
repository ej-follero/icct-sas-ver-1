'use client';

import { Button } from '@/components/ui/button';
import { CardHeader } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { BarChart3, Download, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface AnalyticsHeaderProps {
  type: 'instructor' | 'student';
  showDetails: boolean;
  onToggleDetails: () => void;
  onExport: (format: 'pdf' | 'csv' | 'excel') => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function AnalyticsHeader({ 
  type, 
  showDetails, 
  onToggleDetails, 
  onExport,
  onRefresh,
  loading = false
}: AnalyticsHeaderProps) {
  return (
    <CardHeader className="p-0">
      {/* Blue Gradient Header - flush to card edge, no rounded corners */}
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {type === 'instructor' ? 'Instructor' : 'Student'} Attendance Analytics
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm">Real-time attendance insights and trends</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onRefresh}
                      disabled={loading}
                      aria-label="Refresh analytics"
                      className="h-9 w-9 p-0 rounded-full text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 disabled:opacity-60"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Refresh analytics</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  );
} 