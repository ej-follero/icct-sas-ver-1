'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RefreshCw, Users, Clock, AlertCircle, CheckCircle, MapPin, Wifi, WifiOff } from 'lucide-react';

interface RealTimeStatus {
  id: string;
  studentName: string;
  studentId: string;
  avatarUrl?: string;
  currentStatus: 'in-class' | 'on-campus' | 'absent' | 'late' | 'early-dismissal';
  location?: string;
  lastSeen: Date;
  expectedClass?: string;
  nextClass?: string;
  isRFIDActive: boolean;
}

interface SystemStatus {
  totalStudents: number;
  currentlyPresent: number;
  inClass: number;
  onCampus: number;
  rfidReadersOnline: number;
  totalRfidReaders: number;
  lastUpdate: Date;
}

const mockRealtimeData: RealTimeStatus[] = [
  {
    id: '1',
    studentName: 'John Doe',
    studentId: 'STU-2024-001',
    currentStatus: 'in-class',
    location: 'Room 101 - Computer Lab',
    lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    expectedClass: 'Web Development',
    nextClass: 'Database Systems (2:00 PM)',
    isRFIDActive: true
  },
  {
    id: '2',
    studentName: 'Jane Smith',
    studentId: 'STU-2024-002',
    currentStatus: 'on-campus',
    location: 'Library',
    lastSeen: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    expectedClass: 'Network Security',
    nextClass: 'Cybersecurity (3:00 PM)',
    isRFIDActive: true
  },
  {
    id: '3',
    studentName: 'Mike Johnson',
    studentId: 'STU-2024-003',
    currentStatus: 'late',
    location: 'Main Entrance',
    lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    expectedClass: 'Programming Fundamentals',
    isRFIDActive: true
  },
  {
    id: '4',
    studentName: 'Sarah Wilson',
    studentId: 'STU-2024-004',
    currentStatus: 'absent',
    lastSeen: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    expectedClass: 'Software Engineering',
    isRFIDActive: false
  }
];

const mockSystemStatus: SystemStatus = {
  totalStudents: 1250,
  currentlyPresent: 847,
  inClass: 623,
  onCampus: 224,
  rfidReadersOnline: 47,
  totalRfidReaders: 50,
  lastUpdate: new Date()
};

export default function AttendanceStatusIndicators() {
  const [realtimeData, setRealtimeData] = useState<RealTimeStatus[]>(mockRealtimeData);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(mockSystemStatus);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'in-class' | 'on-campus' | 'late' | 'absent'>('all');

  // Auto-refresh functionality
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      // Simulate real-time updates
      setRealtimeData(prev => prev.map(student => ({
        ...student,
        lastSeen: new Date(student.lastSeen.getTime() + 60 * 1000) // Add 1 minute
      })));
      setLastRefresh(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleRefresh = () => {
    // Simulate data refresh
    setLastRefresh(new Date());
    // In real implementation, this would fetch fresh data from API
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-class': return 'bg-green-100 text-green-800 border-green-200';
      case 'on-campus': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'late': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      case 'early-dismissal': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-class': return <CheckCircle className="h-4 w-4" />;
      case 'on-campus': return <MapPin className="h-4 w-4" />;
      case 'late': return <Clock className="h-4 w-4" />;
      case 'absent': return <AlertCircle className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const filteredData = realtimeData.filter(student => 
    selectedFilter === 'all' || student.currentStatus === selectedFilter
  );

  const attendanceRate = ((systemStatus.currentlyPresent / systemStatus.totalStudents) * 100).toFixed(1);
  const systemHealth = ((systemStatus.rfidReadersOnline / systemStatus.totalRfidReaders) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Currently Present</p>
                <p className="text-2xl font-bold text-green-800">{systemStatus.currentlyPresent}</p>
                <p className="text-xs text-green-600">{attendanceRate}% of total</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">In Class</p>
                <p className="text-2xl font-bold text-blue-800">{systemStatus.inClass}</p>
                <p className="text-xs text-blue-600">Active sessions</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">On Campus</p>
                <p className="text-2xl font-bold text-orange-800">{systemStatus.onCampus}</p>
                <p className="text-xs text-orange-600">Outside classrooms</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-${systemStatus.rfidReadersOnline === systemStatus.totalRfidReaders ? 'green' : 'red'}-200 bg-${systemStatus.rfidReadersOnline === systemStatus.totalRfidReaders ? 'green' : 'red'}-50`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm text-${systemStatus.rfidReadersOnline === systemStatus.totalRfidReaders ? 'green' : 'red'}-600 font-medium`}>System Health</p>
                <p className={`text-2xl font-bold text-${systemStatus.rfidReadersOnline === systemStatus.totalRfidReaders ? 'green' : 'red'}-800`}>{systemHealth}%</p>
                <p className={`text-xs text-${systemStatus.rfidReadersOnline === systemStatus.totalRfidReaders ? 'green' : 'red'}-600`}>
                  {systemStatus.rfidReadersOnline}/{systemStatus.totalRfidReaders} readers online
                </p>
              </div>
              {systemStatus.rfidReadersOnline === systemStatus.totalRfidReaders ? (
                <Wifi className="h-8 w-8 text-green-600" />
              ) : (
                <WifiOff className="h-8 w-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Real-time Status Feed
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Last updated: {formatTimeAgo(lastRefresh)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              <Button
                variant={isAutoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              >
                {isAutoRefresh ? 'Auto ON' : 'Auto OFF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'in-class', 'on-campus', 'late', 'absent'].map((filter) => (
              <Button
                key={filter}
                variant={selectedFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter as any)}
                className="capitalize"
              >
                {filter === 'all' ? 'All' : filter.replace('-', ' ')}
                {filter !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({realtimeData.filter(s => s.currentStatus === filter).length})
                  </span>
                )}
              </Button>
            ))}
          </div>

          {/* Student Status List */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredData.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatarUrl} />
                      <AvatarFallback>{student.studentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{student.studentName}</div>
                      <div className="text-sm text-gray-500">{student.studentId}</div>
                      {student.location && (
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {student.location}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(student.currentStatus)}>
                        {getStatusIcon(student.currentStatus)}
                        <span className="ml-1 capitalize">{student.currentStatus.replace('-', ' ')}</span>
                      </Badge>
                      {!student.isRFIDActive && (
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          <WifiOff className="h-3 w-3 mr-1" />
                          RFID Off
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last seen: {formatTimeAgo(student.lastSeen)}
                    </div>
                    {student.expectedClass && (
                      <div className="text-xs text-blue-600">
                        Expected: {student.expectedClass}
                      </div>
                    )}
                    {student.nextClass && (
                      <div className="text-xs text-green-600">
                        Next: {student.nextClass}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 