import { Card, CardContent } from '@/components/ui/card';
import { Home, ChevronRight } from 'lucide-react';
import React from 'react';
// import Link from 'next/link'; // No longer needed

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AttendanceHeaderProps {
  title: string;
  subtitle: string;
  breadcrumbs: BreadcrumbItem[];
}

const PageHeader: React.FC<AttendanceHeaderProps> = ({ title, subtitle, breadcrumbs }) => (
  <Card className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-2xl border-0 shadow-lg mb-4 relative overflow-hidden">
    <CardContent className="p-6 border-0">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white rounded-full opacity-50"></div>
      </div>
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-sm text-blue-200 mb-4 relative z-10">
        <div className="flex items-center gap-2 bg-blue-800/30 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-blue-700/30">
          <Home className="h-4 w-4 text-blue-300" />
          {breadcrumbs && breadcrumbs.length > 0 && (
            <>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="h-3 w-3 mx-1 text-blue-400" />
                  {idx < breadcrumbs.length - 1 ? (
                    <span className="text-blue-200">{crumb.label}</span>
                  ) : (
                    <span className="text-white font-medium bg-blue-600 px-2 py-0.5 rounded text-xs">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </nav>
      {/* Main Header */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Home className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 leading-tight">{title}</h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">{subtitle}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default PageHeader; 