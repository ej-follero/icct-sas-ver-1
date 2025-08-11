'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Mail, Phone, User, BookOpen, AlertTriangle, CheckCircle, Edit, Send, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  StudentAttendance, 
  StudentDetailModalProps, 
  ManualAttendanceOverride, 
  NotificationData,
  AttendanceStatus,
  RiskLevel 
} from '@/types/student-attendance';


export default function StudentDetailModal({ student, isOpen, onClose, onUpdate, onSendNotification }: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [manualAttendance, setManualAttendance] = useState<ManualAttendanceOverride>({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    status: AttendanceStatus.PRESENT,
    notes: ''
  });
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<NotificationData['type']>('absence');
  const [showRFIDLogs, setShowRFIDLogs] = useState(false);
  const [rfidLogs, setRFIDLogs] = useState<{ timestamp: string; reader: string }[]>([]);
  const [rfidLoading, setRFIDLoading] = useState(false);

  useEffect(() => {
    if (student?.rfidTag) {
      setRFIDLoading(true);
      fetch(`/api/rfid/logs?tag=${student.rfidTag}`)
        .then(res => res.json())
        .then(data => setRFIDLogs(data.logs || []))
        .finally(() => setRFIDLoading(false));
    } else {
      setRFIDLogs([]);
    }
  }, [student]);

  if (!student) return null;

  const getRiskBadgeColor = (risk: RiskLevel | string) => {
    switch (risk) {
      case RiskLevel.HIGH:
      case 'high': 
        return 'bg-red-100 text-red-800 border-red-200';
      case RiskLevel.MEDIUM:
      case 'medium': 
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case RiskLevel.LOW:
      case 'low': 
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case RiskLevel.NONE:
      case 'none':
      default: 
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const handleSendNotification = () => {
    onSendNotification(student.id, notificationType, notificationMessage);
    setNotificationMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatarUrl} />
              <AvatarFallback>{student.studentName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{student.studentName}</h2>
              <p className="text-sm text-gray-500">{student.studentId} • {student.course} - {student.yearLevel}</p>
            </div>
            <div className="ml-auto flex gap-2">
              <Badge className={getRiskBadgeColor(student.riskLevel || RiskLevel.NONE)}>
                {student.riskLevel === RiskLevel.NONE || student.riskLevel === 'none' || !student.riskLevel ? 'No Risk' : student.riskLevel}
              </Badge>
              <Badge variant={student.attendanceRate >= 90 ? 'default' : 'destructive'}>
                {student.attendanceRate.toFixed(1)}% Attendance
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="communicate">Communicate</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{student.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{student.phoneNumber || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{student.department}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Attendance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{student.presentDays}</div>
                        <div className="text-xs text-gray-500">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{student.absentDays}</div>
                        <div className="text-xs text-gray-500">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{student.lateDays}</div>
                        <div className="text-xs text-gray-500">Late</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{student.totalDays}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Attendance Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-500">Recent attendance records are not available.</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    RFID Scan Logs
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-auto"
                      onClick={() => setShowRFIDLogs(v => !v)}
                    >
                      {showRFIDLogs ? 'Hide' : 'Show'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                {showRFIDLogs && (
                  <CardContent>
                    {rfidLoading ? (
                      <div>Loading...</div>
                    ) : rfidLogs.length === 0 ? (
                      <div className="text-gray-500">No RFID logs found.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr>
                              <th className="text-left">Timestamp</th>
                              <th className="text-left">Reader</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rfidLogs.map((log, i) => (
                              <tr key={i}>
                                <td>{new Date(log.timestamp).toLocaleString()}</td>
                                <td>{log.reader}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Subject Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(student.subjectAttendance || {}).map(([subject, data]) => (
                        <div key={subject} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{subject}</div>
                            <div className="text-xs text-gray-500">
                              {data.presentCount}/{data.totalSessions} sessions
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{data.attendanceRate.toFixed(1)}%</div>
                            <div className="text-xs text-gray-500">
                              L: {data.lateCount} | A: {data.absentCount}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Academic Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {student.attendanceRate.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">Attendance Rate</div>
              </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {student.academicInfo?.totalSubjects || 0}
                        </div>
                        <div className="text-xs text-gray-500">Subjects</div>
                      </div>
                    </div>
                    
                    {student.guardianInfo && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium mb-2">Guardian Information</div>
                        <div className="space-y-1 text-xs">
                          <div><strong>Name:</strong> {student.guardianInfo.name}</div>
                          <div><strong>Email:</strong> {student.guardianInfo.email}</div>
                          <div><strong>Phone:</strong> {student.guardianInfo.phone}</div>
                          <div><strong>Relationship:</strong> {student.guardianInfo.relationship}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {student.attendanceStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Attendance Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {student.attendanceStats.presentPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Present</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {student.attendanceStats.latePercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Late</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {student.attendanceStats.absentPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Absent</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {student.attendanceStats.excusedPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Excused</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="manage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Manual Attendance Override
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={manualAttendance.date}
                        onChange={(e) => setManualAttendance(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={manualAttendance.subject} onValueChange={(value) => setManualAttendance(prev => ({ ...prev, subject: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {student.subjects.map((subject) => (
                            <SelectItem key={subject.subjectCode} value={subject.subjectName}>{subject.subjectName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={manualAttendance.status} onValueChange={(value) => setManualAttendance(prev => ({ ...prev, status: value as AttendanceStatus }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={AttendanceStatus.PRESENT}>Present</SelectItem>
                        <SelectItem value={AttendanceStatus.ABSENT}>Absent</SelectItem>
                        <SelectItem value={AttendanceStatus.LATE}>Late</SelectItem>
                        <SelectItem value={AttendanceStatus.EXCUSED}>Excused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Override Attendance</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communicate" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Parent Notification System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notification-type">Notification Type</Label>
                    <Select value={notificationType} onValueChange={(value) => setNotificationType(value as NotificationData['type'])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="absence">Absence Alert</SelectItem>
                        <SelectItem value="tardiness">Tardiness Notice</SelectItem>
                        <SelectItem value="improvement">Attendance Improvement</SelectItem>
                        <SelectItem value="concern">Attendance Concern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Enter your message..."
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSendNotification} className="flex-1">
                      Send Email
                    </Button>
                    <Button variant="outline" onClick={handleSendNotification} className="flex-1">
                      Send Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflow" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Follow-up Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <div>
                          <div className="font-medium">3+ Consecutive Absences</div>
                          <div className="text-sm text-gray-500">Trigger intervention protocol</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Schedule Meeting</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="font-medium">Improvement Noted</div>
                          <div className="text-sm text-gray-500">Attendance improved by 10%</div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Send Praise</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 