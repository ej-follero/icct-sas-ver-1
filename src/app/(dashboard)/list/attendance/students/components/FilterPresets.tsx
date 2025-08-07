import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Building, GraduationCap } from 'lucide-react';

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  filters: any;
}

interface FilterPresetsProps {
  filterPresets: FilterPreset[];
  applyFilterPreset: (preset: FilterPreset) => void;
  isPresetActive: (preset: FilterPreset) => boolean;
}

export default function FilterPresets({
  filterPresets,
  applyFilterPreset,
  isPresetActive
}: FilterPresetsProps) {
  return (
    <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-600" />
          Quick Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filterPresets.map((preset) => {
            const Icon = preset.icon;
            const isActive = isPresetActive(preset);
            
            return (
              <Button
                key={preset.id}
                variant={isActive ? "default" : "outline"}
                className={`justify-start h-auto p-3 ${
                  isActive 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                }`}
                onClick={() => applyFilterPreset(preset)}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${
                    isActive ? 'text-white' : 'text-blue-600'
                  }`} />
                  <div className="text-left">
                    <div className="font-medium">{preset.name}</div>
                    <div className={`text-xs ${
                      isActive ? 'text-blue-100' : 'text-blue-600'
                    }`}>
                      {preset.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 