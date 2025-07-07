import { Card, CardContent } from './ui/card';
import { Home, ChevronRight } from 'lucide-react';
import React from 'react';

interface AttendanceHeaderProps {
  title: string;
  subtitle: string;
  currentSection: string;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({ title, subtitle, currentSection }) => (
  <Card className="bg-gradient-to-r from-[#1e40af] via-[#1e40af] to-[#3b82f6] rounded-3xl border-0 shadow-xl mb-2 mt-3 relative overflow-hidden">
    <CardContent className="p-8 px-6 border-0">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white rounded-full opacity-50"></div>
      </div>
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm text-blue-200 mb-6 relative z-10">
        <div className="flex items-center gap-2 bg-blue-800/30 rounded-lg px-3 py-2 backdrop-blur-sm border border-blue-700/30">
          <Home className="h-4 w-4 text-blue-300" />
          <ChevronRight className="h-3 w-3 mx-1 text-blue-400" />
          <span className="text-blue-200">Dashboard</span>
          <ChevronRight className="h-3 w-3 mx-1 text-blue-400" />
          <span className="text-blue-200">Attendance</span>
          <ChevronRight className="h-3 w-3 mx-1 text-blue-400" />
          <span className="text-white font-medium bg-blue-600 px-2 py-1 rounded-md">{currentSection}</span>
        </div>
      </nav>
      {/* Main Header */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 leading-tight">{title}</h1>
              <p className="text-blue-200 text-lg leading-relaxed">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AttendanceHeader; 