import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  GraduationCap, 
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import { StudentAttendance, StudentStatus } from '@/types/student-attendance';

interface StudentDetailModalProps {
  student: StudentAttendance;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function StudentDetailModal({ 
  student, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete 
}: StudentDetailModalProps) {
  if (!student) return null;

  const getStatusColor = (status: StudentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'NONE':
        return 'bg-green-100 text-green-800';
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 rounded-xl flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-xl p-6 flex-shrink-0">
          <DialogTitle asChild>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{student.studentName}</h2>
                <p className="text-blue-100 text-sm">{student.studentIdNum}</p>
                <div className="flex gap-3 mt-3">
                  <Badge className={`${getStatusColor(student.status)} px-3 py-1 bg-white/20 text-white border-white/30`}>
                    {student.status}
                  </Badge>
                  <Badge className={`${getRiskColor(student.riskLevel)} px-3 py-1 bg-white/20 text-white border-white/30`}>
                    Risk: {student.riskLevel}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{student.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{student.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{student.department}</span>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{student.course} - {student.yearLevel.replace('_', ' ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Birth Date</span>
                    <div className="font-medium">{student.birthDate ? new Date(student.birthDate).toLocaleDateString() : 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Gender</span>
                    <div className="font-medium">{student.gender}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Nationality</span>
                    <div className="font-medium">{student.nationality || 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Student Type</span>
                    <div className="font-medium">{student.studentType}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Email Address</span>
                    <div className="font-medium">{student.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Phone Number</span>
                    <div className="font-medium">{student.phoneNumber}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 col-span-1 md:col-span-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600">Address</span>
                    <div className="font-medium">{student.address || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enrolled Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {student.schedules?.map((schedule, index) => (
                  <Badge key={`${schedule.scheduleId}-${schedule.subjectCode}-${index}`} variant="outline" className="text-xs">
                    {schedule.subjectName} ({schedule.subjectCode})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Course</span>
                    <div className="font-medium">{student.course}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Department</span>
                    <div className="font-medium">{student.department}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Year Level</span>
                    <div className="font-medium">{student.yearLevel.replace('_', ' ')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Student Type</span>
                    <div className="font-medium">{student.studentType}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guardian Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Guardian Name</span>
                    <div className="font-medium">{student.guardianName || 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Guardian Email</span>
                    <div className="font-medium">{student.guardianEmail || 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Guardian Phone</span>
                    <div className="font-medium">{student.guardianPhone || 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <span className="text-sm text-gray-600">Guardian Type</span>
                    <div className="font-medium">{student.guardianType || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-200 p-4 rounded-b-xl flex-shrink-0">
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="rounded px-6 py-2 border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
            {onEdit && (
              <Button 
                onClick={onEdit}
                className="rounded px-6 py-2 bg-blue-600 hover:bg-blue-700"
              >
                Edit Student
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="destructive" 
                onClick={onDelete}
                className="rounded px-6 py-2 bg-red-600 hover:bg-red-700"
              >
                Delete Student
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}