import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, ChevronRight } from 'lucide-react';

interface DepartmentBreakdownProps {
  departmentBreakdown: Array<{
    name: string;
    present: number;
    late: number;
    absent: number;
    total: number;
    rate: number;
  }>;
  departmentDrilldown: string | null;
  setDepartmentDrilldown: (department: string | null) => void;
  setFilters: (filters: any) => void;
}

export default function DepartmentBreakdown({
  departmentBreakdown,
  departmentDrilldown,
  setDepartmentDrilldown,
  setFilters
}: DepartmentBreakdownProps) {
  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-700 bg-green-100 border-green-200';
    if (rate >= 75) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  return (
    <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Department Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {departmentBreakdown.map((dept) => (
            <div
              key={dept.name}
              className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                if (departmentDrilldown === dept.name) {
                  setDepartmentDrilldown(null);
                  setFilters({ departments: [] });
                } else {
                  setDepartmentDrilldown(dept.name);
                  setFilters({ departments: [dept.name] });
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                    {departmentDrilldown === dept.name && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Present: {dept.present}</span>
                    <span>Late: {dept.late}</span>
                    <span>Absent: {dept.absent}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getAttendanceRateColor(dept.rate)}`}>
                    {dept.rate}%
                  </span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                    departmentDrilldown === dept.name ? 'rotate-90' : ''
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 