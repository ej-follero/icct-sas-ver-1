"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  ScanLine,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";

interface RFIDLog {
  id: string;
  tagId: string;
  readerId: string;
  studentId?: string;
  studentName?: string;
  location: string;
  timestamp: string;
  status: 'success' | 'error' | 'unauthorized' | 'timeout';
  scanType: 'entry' | 'exit' | 'attendance' | 'access';
  duration?: number; // in minutes
  notes?: string;
}

export default function RFIDLogsPage() {
  const [logs, setLogs] = useState<RFIDLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scanTypeFilter, setScanTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    // Mock data - replace with actual API calls
    setLogs([
      {
        id: '1',
        tagId: 'RFID-001',
        readerId: 'Reader-101',
        studentId: 'STU001',
        studentName: 'John Doe',
        location: 'Room 101',
        timestamp: '2024-01-15 14:30:25',
        status: 'success',
        scanType: 'attendance',
        duration: 90,
      },
      {
        id: '2',
        tagId: 'RFID-002',
        readerId: 'Reader-102',
        studentId: 'STU002',
        studentName: 'Jane Smith',
        location: 'Room 102',
        timestamp: '2024-01-15 14:29:18',
        status: 'success',
        scanType: 'attendance',
        duration: 90,
      },
      {
        id: '3',
        tagId: 'RFID-003',
        readerId: 'Reader-103',
        studentId: 'STU003',
        studentName: 'Mike Johnson',
        location: 'Room 103',
        timestamp: '2024-01-15 14:28:45',
        status: 'error',
        scanType: 'attendance',
        notes: 'Tag not recognized',
      },
      {
        id: '4',
        tagId: 'RFID-004',
        readerId: 'Reader-104',
        studentId: 'STU004',
        studentName: 'Sarah Wilson',
        location: 'Library',
        timestamp: '2024-01-15 14:25:30',
        status: 'success',
        scanType: 'entry',
      },
      {
        id: '5',
        tagId: 'RFID-005',
        readerId: 'Reader-105',
        location: 'Computer Lab',
        timestamp: '2024-01-15 14:20:15',
        status: 'unauthorized',
        scanType: 'access',
        notes: 'Access denied - restricted area',
      },
    ]);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.readerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesScanType = scanTypeFilter === "all" || log.scanType === scanTypeFilter;
    
    const matchesDate = !dateFilter || log.timestamp.startsWith(dateFilter);
    
    return matchesSearch && matchesStatus && matchesScanType && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default">Success</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'unauthorized': return <Badge variant="destructive">Unauthorized</Badge>;
      case 'timeout': return <Badge variant="secondary">Timeout</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getScanTypeBadge = (type: string) => {
    switch (type) {
      case 'entry': return <Badge variant="outline">Entry</Badge>;
      case 'exit': return <Badge variant="outline">Exit</Badge>;
      case 'attendance': return <Badge variant="secondary">Attendance</Badge>;
      case 'access': return <Badge variant="outline">Access</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'unauthorized': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'timeout': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    errors: logs.filter(l => l.status === 'error').length,
    unauthorized: logs.filter(l => l.status === 'unauthorized').length,
    today: logs.filter(l => l.timestamp.startsWith('2024-01-15')).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RFID Access Logs</h1>
          <p className="text-muted-foreground">
            View and analyze RFID scan history and access records
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.success}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unauthorized</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unauthorized}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Access Logs</CardTitle>
          <CardDescription>Search and filter RFID access logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tag ID, student name, reader ID, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="unauthorized">Unauthorized</option>
              <option value="timeout">Timeout</option>
            </select>
            <select
              value={scanTypeFilter}
              onChange={(e) => setScanTypeFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md"
            >
              <option value="all">All Types</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="attendance">Attendance</option>
              <option value="access">Access</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md"
            />
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Logs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Tag ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Reader</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{log.tagId}</TableCell>
                    <TableCell>
                      {log.studentName ? (
                        <div>
                          <div className="font-medium">{log.studentName}</div>
                          <div className="text-sm text-muted-foreground">{log.studentId}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ScanLine className="w-3 h-3" />
                        <span className="text-sm">{log.readerId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="text-sm">{log.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getScanTypeBadge(log.scanType)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-sm">{log.timestamp}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.duration ? (
                        <span className="text-sm">{log.duration} min</span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.notes ? (
                        <span className="text-sm text-muted-foreground">{log.notes}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No RFID logs found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 