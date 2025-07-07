"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Database,
  Shield,
  Download
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";
import ReportGenerator from "@/components/ReportGenerator";

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  module: string;
  action: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  details: string;
}

const mockSystemLogs: SystemLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    level: 'INFO',
    module: 'Authentication',
    action: 'User Login',
    userId: 'admin-001',
    userEmail: 'admin@icct.edu',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    details: 'Successful login from admin panel'
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:00Z',
    level: 'WARNING',
    module: 'RFID System',
    action: 'Reader Offline',
    userId: 'system',
    userEmail: 'system@icct.edu',
    ipAddress: '192.168.1.50',
    userAgent: 'RFID-Reader-1.0',
    details: 'RFID reader in Room 101 went offline'
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    level: 'ERROR',
    module: 'Database',
    action: 'Connection Failed',
    userId: 'system',
    userEmail: 'system@icct.edu',
    ipAddress: '192.168.1.1',
    userAgent: 'Database-Service',
    details: 'Database connection timeout after 30 seconds'
  }
];

const getLogLevelColor = (level: string) => {
  switch (level) {
    case 'ERROR':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'INFO':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'DEBUG':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getLogLevelIcon = (level: string) => {
  switch (level) {
    case 'ERROR':
      return <AlertTriangle className="w-4 h-4" />;
    case 'WARNING':
      return <AlertTriangle className="w-4 h-4" />;
    case 'INFO':
      return <CheckCircle className="w-4 h-4" />;
    case 'DEBUG':
      return <Activity className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

export default function SystemLogsPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  const filteredLogs = mockSystemLogs.filter(log => {
    if (selectedLevel !== 'all' && log.level !== selectedLevel) return false;
    if (selectedModule !== 'all' && log.module !== selectedModule) return false;
    return true;
  });

  const modules = [...new Set(mockSystemLogs.map(log => log.module))];
  const levels = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-1">Monitor system activity and troubleshoot issues</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            System Online
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-blue-800">{mockSystemLogs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Info Logs</p>
                <p className="text-2xl font-bold text-green-800">
                  {mockSystemLogs.filter(log => log.level === 'INFO').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {mockSystemLogs.filter(log => log.level === 'WARNING').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-800">
                  {mockSystemLogs.filter(log => log.level === 'ERROR').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Report Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Activity Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Log Level</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Levels</option>
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Module</label>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Modules</option>
                    {modules.map(module => (
                      <option key={module} value={module}>{module}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="space-y-3">
                {filteredLogs.map(log => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getLogLevelColor(log.level)}`}>
                          {getLogLevelIcon(log.level)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={getLogLevelColor(log.level)}>
                              {log.level}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">{log.module}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-600">{log.action}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{log.details}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.userEmail}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              {log.ipAddress}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <ReportGenerator
            title="System Logs Report"
            description="Generate comprehensive system activity reports"
            data={filteredLogs}
            columns={[
              { key: 'timestamp', label: 'Timestamp', type: 'date' },
              { key: 'level', label: 'Level', type: 'status' },
              { key: 'module', label: 'Module' },
              { key: 'action', label: 'Action' },
              { key: 'userEmail', label: 'User' },
              { key: 'ipAddress', label: 'IP Address' },
              { key: 'details', label: 'Details' }
            ]}
            exportFormats={['csv', 'pdf']}
          />
        </div>
      </div>
    </div>
  );
} 