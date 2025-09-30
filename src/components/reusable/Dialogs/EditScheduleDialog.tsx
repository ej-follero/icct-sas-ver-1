"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Users, MapPin, BookOpen, GraduationCap, X, Loader2, Search, Info } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  subjectSchedId: number;
  subject: { subjectName: string; subjectCode: string; subjectId: number };
  section: { sectionName: string; sectionId: number };
  instructor: { firstName: string; lastName: string; instructorId: number };
  room: { roomNo: string; roomId: number; roomCapacity: number };
  day: string;
  startTime: string;
  endTime: string;
  slots: number;
  scheduleType: string;
  status: string;
  semester: { semesterName: string; semesterId: number };
  academicYear: string;
  maxStudents: number;
  currentEnrollment: number;
  notes?: string;
  conflicts?: string[];
}

interface EditScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  onScheduleUpdated?: (schedule: Schedule) => void;
}

export function EditScheduleDialog({ open, onOpenChange, schedule, onScheduleUpdated }: EditScheduleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    sectionId: '',
    instructorId: '',
    roomId: '',
    day: '',
    startTime: '',
    endTime: '',
    scheduleType: 'REGULAR',
    status: 'ACTIVE',
    maxStudents: '',
    semesterId: '',
    academicYear: '',
    notes: ''
  });

  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  
  // Search states for filters
  const [subjectSearch, setSubjectSearch] = useState("");
  const [sectionSearch, setSectionSearch] = useState("");
  const [instructorSearch, setInstructorSearch] = useState("");
  const [roomSearch, setRoomSearch] = useState("");

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const scheduleTypes = ['REGULAR', 'MAKEUP', 'SPECIAL', 'LABORATORY'];
  const statusOptions = ['ACTIVE', 'CANCELLED', 'POSTPONED', 'COMPLETED', 'CONFLICT'];

  // Filtered options based on search
  const filteredSubjects = subjects.filter(subject =>
    subject.subjectName.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    subject.subjectCode.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  const filteredSections = sections.filter(section =>
    section.sectionName.toLowerCase().includes(sectionSearch.toLowerCase())
  );

  const filteredInstructors = instructors.filter(instructor =>
    instructor.firstName.toLowerCase().includes(instructorSearch.toLowerCase()) ||
    instructor.lastName.toLowerCase().includes(instructorSearch.toLowerCase())
  );

  const filteredRooms = rooms.filter(room =>
    room.roomNo.toLowerCase().includes(roomSearch.toLowerCase())
  );

  useEffect(() => {
    if (open && schedule) {
      // Populate form with schedule data
      setFormData({
        subjectId: schedule.subject.subjectId.toString(),
        sectionId: schedule.section.sectionId.toString(),
        instructorId: schedule.instructor.instructorId.toString(),
        roomId: schedule.room.roomId.toString(),
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        scheduleType: schedule.scheduleType,
        status: schedule.status,
        maxStudents: schedule.maxStudents.toString(),
        semesterId: schedule.semester.semesterId.toString(),
        academicYear: schedule.academicYear,
        notes: schedule.notes || ''
      });

      // Load dropdown data
      loadSubjects();
      loadSections();
      loadInstructors();
      loadRooms();
      loadSemesters();
    }
  }, [open, schedule]);

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadSections = async () => {
    try {
      const response = await fetch('/api/sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data || []);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  const loadInstructors = async () => {
    try {
      const response = await fetch('/api/instructors');
      if (response.ok) {
        const data = await response.json();
        setInstructors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load instructors:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data || []);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const loadSemesters = async () => {
    try {
      const response = await fetch('/api/semesters');
      if (response.ok) {
        const data = await response.json();
        setSemesters(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load semesters:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Safe focus handler to prevent null reference errors
  const handleSafeFocus = (e: React.FocusEvent) => {
    try {
      e.stopPropagation();
    } catch (error) {
      console.warn('Focus event handling error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/schedules/${schedule.subjectSchedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxStudents: parseInt(formData.maxStudents) || 0,
          semesterId: parseInt(formData.semesterId) || 0,
        }),
      });

      if (response.ok) {
        const updatedSchedule = await response.json();
        toast.success('Schedule updated successfully');
        onScheduleUpdated?.(updatedSchedule);
        onOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[600px] sm:mx-4 sm:my-1 md:max-w-[750px] md:mx-6 md:my-1 lg:max-w-[900px] lg:mx-8 lg:my-1 flex flex-col">
        {/* Visually hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          Edit Schedule
        </DialogTitle>
        
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close dialog"
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                Edit Schedule
              </h2>
              <p className="text-blue-100 text-sm">
                Update schedule information for the academic system
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
            {/* Info: All fields required */}
            <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded border border-blue-100 text-blue-700 text-sm mb-6">
              <Info className="h-4 w-4 text-blue-600" />
              <span>All fields marked with <span className="font-bold">*</span> are required</span>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-md font-semibold text-blue-900">Basic Information</h3>
                  </div>
                </div>
                <div className="h-px bg-blue-100 w-full mb-4"></div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subjectId" className="text-sm text-blue-900">
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.subjectId} onValueChange={(value) => handleInputChange('subjectId', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                      <SelectContent className="max-h-80">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search subjects..."
                              value={subjectSearch}
                              onChange={(e) => setSubjectSearch(e.target.value)}
                              className="w-full pl-7 pr-8 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                              onFocus={handleSafeFocus}
                              onBlur={handleSafeFocus}
                            />
                            {subjectSearch && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSubjectSearch("");
                                }}
                                className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredSubjects.length > 0 ? (
                            filteredSubjects.map((subject) => (
                              <SelectItem key={subject.subjectId} value={subject.subjectId.toString()}>
                                {subject.subjectName} ({subject.subjectCode})
                              </SelectItem>
                            ))
                          ) : subjectSearch ? (
                            <div className="px-2 py-1 text-xs text-gray-500 text-center">
                              No subjects found for "{subjectSearch}"
                            </div>
                          ) : null}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor="sectionId" className="text-sm text-blue-900">
                        Section <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.sectionId} onValueChange={(value) => handleInputChange('sectionId', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      <SelectContent className="max-h-80">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search sections..."
                              value={sectionSearch}
                              onChange={(e) => setSectionSearch(e.target.value)}
                              className="w-full pl-7 pr-8 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                              onFocus={handleSafeFocus}
                              onBlur={handleSafeFocus}
                            />
                            {sectionSearch && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSectionSearch("");
                                }}
                                className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredSections.length > 0 ? (
                            filteredSections.map((section) => (
                              <SelectItem key={section.sectionId} value={section.sectionId.toString()}>
                                {section.sectionName}
                              </SelectItem>
                            ))
                          ) : sectionSearch ? (
                            <div className="px-2 py-1 text-xs text-gray-500 text-center">
                              No sections found for "{sectionSearch}"
                            </div>
                          ) : null}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instructorId" className="text-sm text-blue-900">
                        Instructor <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.instructorId} onValueChange={(value) => handleInputChange('instructorId', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded">
                          <SelectValue placeholder="Select instructor" />
                        </SelectTrigger>
                      <SelectContent className="max-h-80">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search instructors..."
                              value={instructorSearch}
                              onChange={(e) => setInstructorSearch(e.target.value)}
                              className="w-full pl-7 pr-8 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                              onFocus={handleSafeFocus}
                              onBlur={handleSafeFocus}
                            />
                            {instructorSearch && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setInstructorSearch("");
                                }}
                                className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredInstructors.length > 0 ? (
                            filteredInstructors.map((instructor) => (
                              <SelectItem key={instructor.instructorId} value={instructor.instructorId.toString()}>
                                {instructor.firstName} {instructor.lastName}
                              </SelectItem>
                            ))
                          ) : instructorSearch ? (
                            <div className="px-2 py-1 text-xs text-gray-500 text-center">
                              No instructors found for "{instructorSearch}"
                            </div>
                          ) : null}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor="roomId" className="text-sm text-blue-900">
                        Room <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.roomId} onValueChange={(value) => handleInputChange('roomId', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded">
                          <SelectValue placeholder="Select room" />
                        </SelectTrigger>
                      <SelectContent className="max-h-80">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search rooms..."
                              value={roomSearch}
                              onChange={(e) => setRoomSearch(e.target.value)}
                              className="w-full pl-7 pr-8 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                              onClick={(e) => e.stopPropagation()}
                              onFocus={handleSafeFocus}
                              onBlur={handleSafeFocus}
                            />
                            {roomSearch && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setRoomSearch("");
                                }}
                                className="absolute right-2 top-2.5 h-3 w-3 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredRooms.length > 0 ? (
                            filteredRooms.map((room) => (
                              <SelectItem key={room.roomId} value={room.roomId.toString()}>
                                {room.roomNo} (Capacity: {room.roomCapacity})
                              </SelectItem>
                            ))
                          ) : roomSearch ? (
                            <div className="px-2 py-1 text-xs text-gray-500 text-center">
                              No rooms found for "{roomSearch}"
                            </div>
                          ) : null}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semesterId" className="text-sm text-blue-900">
                        Semester <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.semesterId} onValueChange={(value) => handleInputChange('semesterId', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester.semesterId} value={semester.semesterId.toString()}>
                            {semester.year} - {semester.semesterType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor="academicYear" className="text-sm text-blue-900">
                        Academic Year <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="academicYear"
                        type="text"
                        value={formData.academicYear}
                        onChange={(e) => handleInputChange('academicYear', e.target.value)}
                        placeholder="e.g., 2024-2025"
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-md font-semibold text-blue-900">Schedule Details</h3>
                  </div>
                </div>
                <div className="h-px bg-blue-100 w-full mb-4"></div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="day" className="text-sm text-blue-900">
                        Day <span className="text-red-500">*</span>
                      </Label>
                      <Select value={formData.day} onValueChange={(value) => handleInputChange('day', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem key={day} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="text-sm text-blue-900">
                        Start Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="text-sm text-blue-900">
                        End Time <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                        required
                      />
                    </div>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduleType" className="text-sm text-blue-900">
                        Schedule Type
                      </Label>
                      <Select value={formData.scheduleType} onValueChange={(value) => handleInputChange('scheduleType', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      <SelectContent>
                        {scheduleTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type === 'REGULAR' ? 'Regular' : 
                             type === 'MAKEUP' ? 'Make-up' : 
                             type === 'SPECIAL' ? 'Special' : 
                             type === 'LABORATORY' ? 'Laboratory' : type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm text-blue-900">
                        Status
                      </Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status === 'ACTIVE' ? 'Active' : 
                             status === 'CANCELLED' ? 'Cancelled' : 
                             status === 'POSTPONED' ? 'Postponed' : 
                             status === 'COMPLETED' ? 'Completed' : 
                             status === 'CONFLICT' ? 'Conflict' : status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxStudents" className="text-sm text-blue-900">
                        Max Students
                      </Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        min="1"
                        value={formData.maxStudents}
                        onChange={(e) => handleInputChange('maxStudents', e.target.value)}
                        placeholder="Enter max students"
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-md font-semibold text-blue-900">Additional Information</h3>
                  </div>
                </div>
                <div className="h-px bg-blue-100 w-full mb-4"></div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm text-blue-900">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Enter any additional notes or special instructions..."
                      rows={3}
                      className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between pt-6 border-t border-blue-200 flex-shrink-0 px-6 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-600">
                * Required fields
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 rounded"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Schedule'
                )}
              </Button>
            </div>
          </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
