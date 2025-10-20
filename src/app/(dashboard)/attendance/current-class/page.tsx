"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Wifi, 
  WifiOff,
  RefreshCw,
  UserCheck,
  UserX,
  Clock3,
  GraduationCap,
  MapPin,
  Calendar,
  Timer
} from 'lucide-react';

interface StudentAttendance {
  studentId: number;
  studentIdNum: string;
  firstName: string;
  lastName: string;
  email: string;
  rfidTag: string;
  department: string;
  course: string;
  attendanceStatus: string;
  attendanceType: string | null;
  timestamp: string | null;
  verification: string;
  rfidReader: string | null;
  room: string | null;
  location: string | null;
  isLate: boolean;
  isPresent: boolean;
}

interface ClassInfo {
  startTime: string;
  endTime: string;
  day: string;
  isCurrentlyActive: boolean;
  timeRemaining: string;
}

interface CurrentClassData {
  schedule: {
    subjectSchedId: number;
    subject: {
      subjectCode: string;
      subjectName: string;
    };
    section: {
      sectionName: string;
    };
    instructor: {
      firstName: string;
      lastName: string;
    };
    room: {
      roomNo: string;
      roomBuildingLoc: string;
      roomFloorLoc: string;
    };
  };
  students: StudentAttendance[];
  statistics: {
    totalEnrolled: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
  };
  classInfo: ClassInfo;
}

export default function CurrentClassAttendance() {
  const [data, setData] = useState<CurrentClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);

  // Fetch current class data
  const fetchCurrentClass = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/attendance/current-class');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.message || 'No active class found');
      }
    } catch (err) {
      setError('Network error');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time stream
  useEffect(() => {
    if (!data?.schedule) return;

    const eventSource = new EventSource(`/api/attendance/stream?subjectSchedId=${data.schedule.subjectSchedId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setStreamConnected(true);
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data);
        
        if (eventData.type === 'attendance-update' && eventData.records) {
          // Update student attendance status
          setData(prevData => {
            if (!prevData) return prevData;
            
            const updatedStudents = prevData.students.map(student => {
              const updatedRecord = eventData.records.find((r: any) => r.studentId === student.studentId);
              if (updatedRecord) {
                return {
                  ...student,
                  attendanceStatus: updatedRecord.status,
                  timestamp: updatedRecord.timestamp,
                  isPresent: updatedRecord.status === 'PRESENT',
                  isLate: updatedRecord.status === 'LATE',
                  rfidReader: updatedRecord.rfidReader,
                  room: updatedRecord.room,
                  location: updatedRecord.location
                };
              }
              return student;
            });

            // Recalculate statistics
            const newStats = {
              totalEnrolled: updatedStudents.length,
              present: updatedStudents.filter(s => s.isPresent).length,
              late: updatedStudents.filter(s => s.isLate).length,
              absent: updatedStudents.filter(s => s.attendanceStatus === 'ABSENT').length,
              excused: updatedStudents.filter(s => s.attendanceStatus === 'EXCUSED').length
            };

            return {
              ...prevData,
              students: updatedStudents,
              statistics: newStats
            };
          });
        }
      } catch (err) {
        console.error('Error parsing stream data:', err);
      }
    };

    eventSource.onerror = () => {
      setStreamConnected(false);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [data?.schedule]);

  // Initial data fetch
  useEffect(() => {
    fetchCurrentClass();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'LATE':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'EXCUSED':
        return <Clock3 className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'PRESENT': 'default',
      'LATE': 'secondary',
      'ABSENT': 'destructive',
      'EXCUSED': 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleManualOverride = async (studentId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/attendance/manual-override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          subjectSchedId: data?.schedule.subjectSchedId,
          status: newStatus,
          reason: 'Manual override by instructor',
          notes: `Status changed to ${newStatus}`
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh data to show updated status
        fetchCurrentClass();
      } else {
        console.error('Manual override failed:', result.error);
      }
    } catch (err) {
      console.error('Manual override error:', err);
    }
  };

  // Filter students based on search and status
  const filteredStudents = data?.students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentIdNum.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      student.attendanceStatus.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading current class...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <GraduationCap className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">No Active Class</h2>
          <p className="text-gray-500 mb-4">{error || 'No class is currently scheduled'}</p>
          <Button onClick={fetchCurrentClass} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Current Class Attendance</h1>
          <p className="text-muted-foreground">
            Live monitoring for {data.schedule.subject.subjectName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchCurrentClass} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Alert className={isConnected ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <div className="flex items-center">
          {isConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <AlertDescription className="ml-2">
            {isConnected 
              ? "Connected to live feed - receiving real-time updates" 
              : "Disconnected from live feed - showing cached data"
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Class Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{data.schedule.subject.subjectCode}</p>
                <p className="text-xs text-muted-foreground">{data.schedule.subject.subjectName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">{data.schedule.section.sectionName}</p>
                <p className="text-xs text-muted-foreground">Section</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">{data.schedule.room.roomNo}</p>
                <p className="text-xs text-muted-foreground">{data.schedule.room.roomBuildingLoc} F{data.schedule.room.roomFloorLoc}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">{data.classInfo.timeRemaining}</p>
                <p className="text-xs text-muted-foreground">{data.classInfo.startTime} - {data.classInfo.endTime}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{data.statistics.totalEnrolled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Present</p>
                <p className="text-2xl font-bold">{data.statistics.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Late</p>
                <p className="text-2xl font-bold">{data.statistics.late}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold">{data.statistics.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock3 className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Excused</p>
                <p className="text-2xl font-bold">{data.statistics.excused}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Students</Label>
              <Input
                id="search"
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label htmlFor="status">Filter by Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div key={student.studentId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(student.attendanceStatus)}
                  <div>
                    <p className="font-medium">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.studentIdNum} • {student.department}
                    </p>
                    {student.timestamp && (
                      <p className="text-xs text-muted-foreground">
                        Checked in: {formatTime(student.timestamp)}
                        {student.rfidReader && ` via ${student.rfidReader}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(student.attendanceStatus)}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManualOverride(student.studentId, 'PRESENT')}
                      disabled={student.attendanceStatus === 'PRESENT'}
                    >
                      <UserCheck className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManualOverride(student.studentId, 'ABSENT')}
                      disabled={student.attendanceStatus === 'ABSENT'}
                    >
                      <UserX className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
