import React, { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { 
  User, Mail, Phone, MapPin, Clock, BookOpen, TrendingUp, TrendingDown, 
  Calendar as CalendarIcon, Activity, Shield, AlertTriangle, CheckCircle,
  X, Building, GraduationCap, Target, Zap, Users, BarChart3, Eye
} from 'lucide-react';
// Instructor attendance types removed
import { getAttendanceRateColor } from '@/lib/colors';

interface InstructorDetailModalProps {
  instructor: any;
  isOpen: boolean;
  onClose: () => void;
}

const InstructorDetailModal: React.FC<InstructorDetailModalProps> = ({
  instructor,
  isOpen,
  onClose
}) => {
  // Validate props
  if (!onClose) {
    console.error('InstructorDetailModal: Missing required props');
    return null;
  }

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  if (!instructor) return null;

  // View-only: remove copy/print helpers

  const getRiskBadgeColor = useCallback((risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusBadgeColor = useCallback((status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const WeeklyPatternChart = React.memo(({ pattern }: { pattern: any }) => {
    const days = useMemo(() => [
      { key: 'monday', label: 'Mon', value: pattern.monday },
      { key: 'tuesday', label: 'Tue', value: pattern.tuesday },
      { key: 'wednesday', label: 'Wed', value: pattern.wednesday },
      { key: 'thursday', label: 'Thu', value: pattern.thursday },
      { key: 'friday', label: 'Fri', value: pattern.friday },
      { key: 'saturday', label: 'Sat', value: pattern.saturday },
      { key: 'sunday', label: 'Sun', value: pattern.sunday }
    ], [pattern]);

    return (
      <div className="space-y-3">
        {days.map(day => (
          <div key={day.key} className="flex items-center gap-3">
            <span className="w-12 text-sm font-medium">{day.label}</span>
            <div className="flex-1">
              <Progress value={day.value} className="h-2" />
            </div>
            <span className="w-12 text-sm text-gray-600">{day.value}%</span>
          </div>
        ))}
      </div>
    );
  });
  WeeklyPatternChart.displayName = 'WeeklyPatternChart';

  const ScheduleCard = React.memo(({ schedule }: { schedule: any }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-semibold text-sm">{schedule.subjectName}</h4>
            <p className="text-xs text-gray-600">{schedule.subjectCode}</p>
          </div>
          <Badge variant="outline" className={getAttendanceRateColor(schedule.attendanceRate).bg}>
            {schedule.attendanceRate}%
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div>Section: {schedule.sectionName}</div>
          <div>Room: {schedule.roomNumber}</div>
          <div>Day: {schedule.dayOfWeek}</div>
          <div>Time: {schedule.startTime} - {schedule.endTime}</div>
        </div>
      </CardContent>
    </Card>
  ));
  ScheduleCard.displayName = 'ScheduleCard';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full w-full max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[800px] sm:mx-4 sm:my-1 md:max-w-[1000px] md:mx-6 md:my-1 lg:max-w-[1200px] lg:mx-8 lg:my-1 flex flex-col h-full">
        {/* Header with gradient background - ViewDialog style */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                Instructor Details
                <Badge className="bg-white/20 text-white border-white/30">
                  {instructor.status}
                </Badge>
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1 font-medium">{instructor.instructorName} • {instructor.employeeId} • {instructor.department}</p>
            </div>
          </div>
          
          {/* Action buttons in header - Right side */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
          {/* Header Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={instructor.avatarUrl} />
                  <AvatarFallback className="text-lg">
                    {useMemo(() => 
                      instructor.instructorName.split(' ').map((n: string) => n[0]).join(''), 
                      [instructor.instructorName]
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{instructor.instructorName}</h2>
                    <Badge className={getStatusBadgeColor(instructor.status)}>
                      {instructor.status}
                    </Badge>
                    <Badge className={getRiskBadgeColor(instructor.riskLevel)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {instructor.riskLevel} Risk
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>ID: {instructor.employeeId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span>{instructor.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-gray-500" />
                      <span>{instructor.instructorType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span>{instructor.specialization || 'General'}</span>
                    </div>
                  </div>

                  {/* Simplified header: omit KPIs to avoid redundancy with expandable row */}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Tabs defaultValue="analytics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Teaching Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {instructor.schedules?.length > 0 ? (
                      instructor.schedules.map((schedule: any, index: number) => (
                        <ScheduleCard key={index} schedule={schedule} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No schedules found
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={useCallback((date: Date | undefined) => date && setSelectedDate(date), [])}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span>{instructor.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <span>{instructor.phoneNumber}</span>
                    </div>
                    {instructor.officeLocation && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <span>{instructor.officeLocation}</span>
                      </div>
                    )}
                    {instructor.officeHours && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <span>{instructor.officeHours}</span>
                      </div>
                    )}
                    {instructor.rfidTag && (
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-gray-500" />
                        <span>RFID Tag: {instructor.rfidTag}</span>
                      </div>
                    )}
                  </div>

                  {/* View-only: no action buttons in contact tab */}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructorDetailModal; 