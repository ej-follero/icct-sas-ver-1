"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  X,
  Clock,
  User,
  Database,
  Activity,
  Shield,
  FileText,
  Calendar,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG' | 'CRITICAL';
  module: string;
  action: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  severity?: string;
  eventType?: string;
  resolved?: boolean;
  message?: string;
}

interface LogViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logType?: 'system' | 'security' | 'rfid' | 'backup';
}

export default function SystemLogViewer({ open, onOpenChange, logType = 'system' }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: ""
  });

  const logTypes = [
    { id: 'system', label: 'System Logs', icon: <Database className="w-4 h-4" /> },
    { id: 'security', label: 'Security Logs', icon: <Shield className="w-4 h-4" /> },
    { id: 'rfid', label: 'RFID Logs', icon: <Activity className="w-4 h-4" /> },
    { id: 'backup', label: 'Backup Logs', icon: <FileText className="w-4 h-4" /> }
  ];

  const levels = [
    { value: 'all', label: 'All Levels', icon: <Info className="w-4 h-4" /> },
    { value: 'INFO', label: 'Info', icon: <Info className="w-4 h-4 text-blue-500" /> },
    { value: 'WARNING', label: 'Warning', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" /> },
    { value: 'ERROR', label: 'Error', icon: <X className="w-4 h-4 text-red-500" /> },
    { value: 'DEBUG', label: 'Debug', icon: <Info className="w-4 h-4 text-gray-500" /> },
    { value: 'CRITICAL', label: 'Critical', icon: <AlertTriangle className="w-4 h-4 text-red-600" /> }
  ];

  const modules = [
    { value: 'all', label: 'All Modules' },
    { value: 'auth', label: 'Authentication' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'rfid', label: 'RFID System' },
    { value: 'backup', label: 'Backup System' },
    { value: 'api', label: 'API' },
    { value: 'database', label: 'Database' }
  ];

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchTerm,
        level: selectedLevel,
        module: selectedModule,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      let endpoint = '';
      switch (logType) {
        case 'system':
          endpoint = '/api/system-logs';
          break;
        case 'security':
          endpoint = '/api/security/logs';
          break;
        case 'rfid':
          endpoint = '/api/rfid/logs';
          break;
        case 'backup':
          endpoint = '/api/backup/logs';
          break;
        default:
          endpoint = '/api/system-logs';
      }

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.data || data.logs || []);
      setTotalPages(Math.ceil((data.total || 0) / 20));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch logs');
      
      // Fallback to mock data
      setLogs(generateMockLogs());
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const generateMockLogs = (): LogEntry[] => {
    const mockLogs: LogEntry[] = [];
    const actions = ['User login', 'Database query', 'RFID scan', 'Backup created', 'Error occurred', 'System check'];
    const modules = ['auth', 'attendance', 'rfid', 'backup', 'api', 'database'];
    const levels: Array<'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'> = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];

    for (let i = 0; i < 20; i++) {
      mockLogs.push({
        id: `log-${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        module: modules[Math.floor(Math.random() * modules.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        userId: `user-${Math.floor(Math.random() * 100)}`,
        userEmail: `user${Math.floor(Math.random() * 100)}@example.com`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: `Mock log entry ${i + 1} for testing purposes`,
        severity: levels[Math.floor(Math.random() * levels.length)],
        eventType: 'LOG_ENTRY',
        resolved: Math.random() > 0.5
      });
    }

    return mockLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  useEffect(() => {
    if (open) {
      fetchLogs(1);
    }
  }, [open, logType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm || selectedLevel !== 'all' || selectedModule !== 'all' || dateRange.startDate || dateRange.endDate) {
        fetchLogs(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedLevel, selectedModule, dateRange]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CRITICAL':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'INFO':
        return <Info className="w-4 h-4" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4" />;
      case 'ERROR':
        return <X className="w-4 h-4" />;
      case 'DEBUG':
        return <Info className="w-4 h-4" />;
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        format,
        search: searchTerm,
        level: selectedLevel,
        module: selectedModule,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });

      let endpoint = '';
      switch (logType) {
        case 'system':
          endpoint = '/api/system-logs/export';
          break;
        case 'security':
          endpoint = '/api/security/logs/export';
          break;
        case 'rfid':
          endpoint = '/api/rfid/logs/export';
          break;
        case 'backup':
          endpoint = '/api/backup/logs/export';
          break;
        default:
          endpoint = '/api/system-logs/export';
      }

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${logType}-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Logs exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLevel("all");
    setSelectedModule("all");
    setDateRange({ startDate: "", endDate: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0 rounded-xl">
        <DialogHeader className="p-0">
          {/* Blue Gradient Header */}
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
            <div className="py-4 sm:py-6">
              <div className="flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">System Log Viewer</h3>
                    <p className="text-blue-100 text-sm">Monitor and analyze system logs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Header with filters */}
          <div className="space-y-4 p-4 border-b">
            <div className="flex items-center justify-between">
              <Tabs value={logType} onValueChange={(value) => onOpenChange(true)}>
                <TabsList>
                  {logTypes.map(type => (
                    <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-2">
                      {type.icon}
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(currentPage)}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('json')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-2">
              <div className="lg:col-span-2">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      <span className="flex items-center gap-2">
                        {level.icon}
                        {level.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map(module => (
                    <SelectItem key={module.value} value={module.value}>
                      {module.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Start Date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />

              <Input
                type="date"
                placeholder="End Date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            {(searchTerm || selectedLevel !== 'all' || selectedModule !== 'all' || dateRange.startDate || dateRange.endDate) && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Filter className="w-3 h-3 mr-1" />
                  Filters Active
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Logs Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2">Loading logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No logs found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search terms</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {logs.map((log) => (
                  <Card key={log.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Badge className={getLevelColor(log.level)}>
                            {getLevelIcon(log.level)}
                            <span className="ml-1">{log.level}</span>
                          </Badge>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{log.action}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.module}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                              {log.userEmail && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {log.userEmail}
                                </span>
                              )}
                              {log.ipAddress && (
                                <span className="flex items-center gap-1">
                                  <Database className="w-3 h-3" />
                                  {log.ipAddress}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedLog(log);
                              setShowLogDetails(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchLogs(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Log Details Dialog */}
        <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Log Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Level</label>
                    <div className="mt-1">
                      <Badge className={getLevelColor(selectedLog.level)}>
                        {getLevelIcon(selectedLog.level)}
                        <span className="ml-1">{selectedLog.level}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Module</label>
                    <p className="mt-1 text-sm">{selectedLog.module}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Action</label>
                    <p className="mt-1 text-sm">{selectedLog.action}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Timestamp</label>
                    <p className="mt-1 text-sm">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                  </div>
                  
                  {selectedLog.userEmail && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">User</label>
                      <p className="mt-1 text-sm">{selectedLog.userEmail}</p>
                    </div>
                  )}
                  
                  {selectedLog.ipAddress && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">IP Address</label>
                      <p className="mt-1 text-sm">{selectedLog.ipAddress}</p>
                    </div>
                  )}
                </div>
                
                {selectedLog.details && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Details</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <pre className="text-sm whitespace-pre-wrap">{selectedLog.details}</pre>
                    </div>
                  </div>
                )}
                
                {selectedLog.userAgent && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">User Agent</label>
                    <p className="mt-1 text-sm text-gray-600">{selectedLog.userAgent}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
