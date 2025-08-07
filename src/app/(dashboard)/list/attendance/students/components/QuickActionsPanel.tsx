import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Download, 
  Bell, 
  FileText, 
  Settings, 
  CheckCircle,
  RefreshCw,
  ChevronRight,
  Minimize2,
  Maximize2,
  Zap
} from 'lucide-react';

export default function QuickActionsPanel() {
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);

  return (
    <Card className="border border-blue-200 shadow-lg rounded-xl overflow-hidden h-fit p-0">
      {/* Quick Actions Header */}
      <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Quick Actions</h3>
              <p className="text-blue-100 text-sm">Essential tools and shortcuts</p>
            </div>
          </div>
          
          {/* Minimize Quick Actions Button */}
          <button
            onClick={() => setQuickActionsExpanded(!quickActionsExpanded)}
            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-xl transition-all hover:scale-105"
            title={quickActionsExpanded ? "Minimize quick actions" : "Expand quick actions"}
          >
            {quickActionsExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Quick Actions Content */}
      {quickActionsExpanded && (
        <div className="p-6">
          <div className="space-y-3">
            {/* Auto Refresh */}
            <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border border-blue-200 transition-all duration-300 hover:shadow-md group">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-blue-900">Auto Refresh</div>
                <div className="text-xs text-blue-600">Toggle live updates</div>
              </div>
              <div className="w-12 h-6 bg-blue-300 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform transform translate-x-6"></div>
              </div>
            </button>

            {/* Export Data */}
            <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl border border-purple-200 transition-all duration-300 hover:shadow-md group">
              <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-purple-900">Export Data</div>
                <div className="text-xs text-purple-600">Download reports</div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-600" />
            </button>

            {/* Send Notifications */}
            <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl border border-orange-200 transition-all duration-300 hover:shadow-md group">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-orange-900">Send Notifications</div>
                <div className="text-xs text-orange-600">Alert parents/students</div>
              </div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            </button>

            {/* Generate Reports */}
            <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl border border-emerald-200 transition-all duration-300 hover:shadow-md group">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-emerald-900">Generate Reports</div>
                <div className="text-xs text-emerald-600">Custom analytics</div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-600" />
            </button>

            {/* Mark Attendance */}
            <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 rounded-xl border border-teal-200 transition-all duration-300 hover:shadow-md group">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-teal-900">Mark Attendance</div>
                <div className="text-xs text-teal-600">Manual entry</div>
              </div>
              <ChevronRight className="w-4 h-4 text-teal-600" />
            </button>

            {/* System Settings */}
            <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl border border-gray-200 transition-all duration-300 hover:shadow-md group">
              <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">System Settings</div>
                <div className="text-xs text-gray-600">Configure attendance</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Quick Stats Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Last action: <span className="font-semibold text-gray-700">2 minutes ago</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
} 