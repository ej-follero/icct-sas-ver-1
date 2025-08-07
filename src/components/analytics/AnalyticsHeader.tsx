'use client';

import { Button } from '@/components/ui/button';
import { CardHeader } from '@/components/ui/card';
import { BarChart3, Download, Eye, EyeOff } from 'lucide-react';

interface AnalyticsHeaderProps {
  type: 'instructor' | 'student';
  showDetails: boolean;
  onToggleDetails: () => void;
  onExport: (format: 'pdf' | 'csv' | 'excel') => void;
}

export function AnalyticsHeader({ 
  type, 
  showDetails, 
  onToggleDetails, 
  onExport 
}: AnalyticsHeaderProps) {
  return (
    <CardHeader className="p-0">
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {type === 'instructor' ? 'Instructor' : 'Student'} Attendance Analytics
              </h3>
              <p className="text-blue-100 text-sm">Real-time attendance insights and trends</p>
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
  );
} 