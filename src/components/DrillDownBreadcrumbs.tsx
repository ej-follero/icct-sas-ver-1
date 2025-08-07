'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DrillDownBreadcrumbsProps {
  breadcrumbs: string[];
  onNavigate: (index: number) => void;
}

export function DrillDownBreadcrumbs({ breadcrumbs, onNavigate }: DrillDownBreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(-1)}
        className="text-gray-600 hover:text-gray-800"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(index)}
            className="text-blue-600 hover:text-blue-800"
          >
            {crumb}
          </Button>
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
          )}
        </div>
      ))}
    </div>
  );
} 