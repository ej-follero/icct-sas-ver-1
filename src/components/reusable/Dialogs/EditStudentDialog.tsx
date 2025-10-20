"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Clock, CheckCircle, X, Info, User } from "lucide-react";

interface StudentData {
  studentId: string;
  studentName: string;
  studentIdNum: string;
  email: string;
  department: string;
  course: string;
  yearLevel: string;
  status: string;
  phoneNumber: string;
}

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentData | null;
  onSave?: (data: any) => Promise<void>;
}

export default function EditStudentDialog({
  open,
  onOpenChange,
  student,
  onSave,
}: EditStudentDialogProps) {
  // Form state aligned to prisma schema
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studentIdNum: "",
    email: "",
    phoneNumber: "",
    department: "",
    course: "",
    yearLevel: "",
    status: "",
  });

  // Parse full name into first and last name
  const parseFullName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  };

  // Load student data when dialog opens
  useEffect(() => {
    if (!open || !student) return;
    
    const { firstName, lastName } = parseFullName(student.studentName || "");
    setFormData({
      firstName,
      lastName,
      studentIdNum: student.studentIdNum || "",
      email: student.email || "",
      phoneNumber: student.phoneNumber || "",
      department: student.department || "",
      course: student.course || "",
      yearLevel: student.yearLevel || "",
      status: student.status || "",
    });
  }, [open, student]);

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    const fields = [
      formData.firstName,
      formData.lastName,
      formData.studentIdNum,
      formData.email,
      formData.phoneNumber,
      formData.department,
      formData.course,
      formData.yearLevel,
      formData.status,
    ];
    const filledFields = fields.filter(field => field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  }, [formData]);

  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState<Array<{ sectionId: number; sectionName: string; courseName?: string; academicYear?: string; semester?: string; currentEnrollment?: number; sectionCapacity?: number }>>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [courses, setCourses] = useState<Array<{ id: string; name: string; code: string; department: string }>>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'info';
    onClose?: () => void;
  }>({ open: false, title: '' });

  // Precompute allowed courseIds for the selected department to filter sections by department
  const courseIdsForSelectedDept = useMemo(() => {
    if (!selectedDepartmentId) return null;
    const ids = courses
      .filter(c => c.department === selectedDepartmentId)
      .map(c => Number(c.id));
    return new Set(ids);
  }, [courses, selectedDepartmentId]);

  // Load sections when dialog opens
  useEffect(() => {
    const loadSections = async () => {
      if (!open) return;
      setSectionsLoading(true);
      try {
        const res = await fetch('/api/sections', { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
          throw new Error(`Failed to load sections (HTTP ${res.status})`);
        }
        const json = await res.json();
        // Normalize various API response shapes to a consistent array
        const items = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.sections)
              ? json.sections
              : [];
        // Ensure fields we rely on exist with consistent names/types
        const normalized = (items as Array<any>).map((s) => ({
          sectionId: Number(s.sectionId ?? s.id),
          sectionName: String(s.sectionName ?? s.name ?? ''),
          courseId: Number(s.courseId ?? s.Course?.courseId ?? 0),
          courseName: s.courseName ?? s.Course?.courseName,
          academicYear: s.academicYear,
          semester: s.semester,
          yearLevel: Number(s.yearLevel ?? 0),
          currentEnrollment: Number(s.currentEnrollment ?? 0),
          sectionCapacity: Number(s.sectionCapacity ?? s.capacity ?? 0),
        }));
        setSections(normalized);
      } catch (e) {
        // non-blocking; keep list empty
        console.warn('Failed to fetch sections', e);
        setSections([]);
      } finally {
        setSectionsLoading(false);
      }
    };
    loadSections();
  }, [open]);

  // Load departments and courses when dialog opens
  useEffect(() => {
    if (!open) return;
    // Departments
    (async () => {
      setDepartmentsLoading(true);
      try {
        const res = await fetch('/api/departments');
        if (res.ok) {
          const json = await res.json();
          // Normalize to id/name
          const items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
          const mapped = (items as Array<any>).map((d: any) => ({ id: String(d.departmentId ?? d.id), name: d.departmentName ?? d.name }));
          setDepartments(mapped);
          // Preselect from student data
          if (formData.department) {
            const found = mapped.find(d => (d.name || '').toLowerCase() === formData.department.toLowerCase());
            if (found) setSelectedDepartmentId(found.id);
          }
        } else {
          setDepartments([]);
        }
      } catch {
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    })();
    // Courses
    (async () => {
      setCoursesLoading(true);
      try {
        const res = await fetch('/api/courses');
        if (res.ok) {
          const items = await res.json();
          const mapped = Array.isArray(items)
            ? items.map((c: any) => ({ id: String(c.id ?? c.courseId), name: c.name ?? c.courseName, code: c.code ?? c.courseCode, department: String(c.department ?? c.departmentId ?? '') }))
            : [];
          setCourses(mapped);
          // Preselect from student data
          if (formData.course) {
            const found = mapped.find((c: any) => (c.name || '').toLowerCase() === formData.course.toLowerCase() || (c.code || '').toLowerCase() === formData.course.toLowerCase());
            if (found) {
              setSelectedCourseId(found.id);
              if (found.department) setSelectedDepartmentId(found.department);
            }
          }
        } else {
          setCourses([]);
        }
      } catch {
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    })();
  }, [open, formData.department, formData.course]);

  // Helpers to map year level to numeric
  const getYearLevelNumber = (yl: string) => {
    switch (yl) {
      case 'FIRST_YEAR': return 1;
      case 'SECOND_YEAR': return 2;
      case 'THIRD_YEAR': return 3;
      case 'FOURTH_YEAR': return 4;
      default: return undefined;
    }
  };

  const handleSave = async () => {
    if (!student?.studentId) return;
    
    setIsSaving(true);
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentIdNum: formData.studentIdNum,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        course: formData.course,
        yearLevel: formData.yearLevel,
        status: formData.status,
      };
      // Prefer sending IDs to avoid name-matching issues on the server
      if (selectedDepartmentId) payload.departmentId = Number(selectedDepartmentId);
      if (selectedCourseId) payload.courseId = Number(selectedCourseId);

      if (onSave) {
        await onSave(payload);
      } else {
        // Default save behavior
        const res = await fetch(`/api/students/${student.studentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `Failed to update student (HTTP ${res.status})`);
        }
      }

      // If a section was selected, enroll the student
      if (selectedSectionId) {
        const enrollRes = await fetch(`/api/students/${student.studentId}/sections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sectionId: Number(selectedSectionId) })
        });
        if (!enrollRes.ok) {
          const err = await enrollRes.json().catch(() => ({}));
          throw new Error(err?.error || `Failed to enroll to section (HTTP ${enrollRes.status})`);
        }
      }

      setFeedback({
        open: true,
        title: 'Student updated successfully',
        description: selectedSectionId ? 'Profile saved and section enrollment updated.' : 'The student information has been saved.',
        variant: 'success',
        onClose: () => {
          setFeedback({ open: false, title: '' });
          onOpenChange(false);
        }
      });
    } catch (error) {
      console.error('Error updating student:', error);
      setFeedback({
        open: true,
        title: 'Failed to update student',
        description: error instanceof Error ? error.message : 'An error occurred while saving.',
        variant: 'error',
        onClose: () => setFeedback({ open: false, title: '' })
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToStudent = () => {
    if (!student) return;
    const { firstName, lastName } = parseFullName(student.studentName || "");
    setFormData({
      firstName,
      lastName,
      studentIdNum: student.studentIdNum || "",
      email: student.email || "",
      phoneNumber: student.phoneNumber || "",
      department: student.department || "",
      course: student.course || "",
      yearLevel: student.yearLevel || "",
      status: student.status || "",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full w-full max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[800px] sm:mx-4 sm:my-1 md:max-w-[1000px] md:mx-6 md:my-1 lg:max-w-[1200px] lg:mx-8 lg:my-1 flex flex-col h-full">
          {/* Header with gradient background and progress */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
            <div className="flex items-start gap-4 pr-24">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <DialogTitle className="text-white text-2xl font-bold">
                    Edit Student Profile
                  </DialogTitle>
                </div>
                <p className="text-white/80 text-sm">
                  Update student information and academic details
                </p>
              </div>
            </div>
            
            {/* Header Action Buttons */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-white/20 text-white"
                onClick={() => onOpenChange(false)}
                aria-label="Close dialog"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <div
                className="h-full bg-green-400 transition-all duration-300"
                style={{ width: `${formProgress}%` }}
              />
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-6 space-y-8">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200 text-blue-700 text-sm">
                <Info className="w-4 h-4 text-blue-600" />
                <span>
                  All fields marked with <span className="font-bold">*</span> are required
                </span>
              </div>
              
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentIdNum" className="text-sm font-medium text-gray-700">
                    Student ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="studentIdNum"
                    value={formData.studentIdNum}
                    onChange={(e) => setFormData(prev => ({ ...prev, studentIdNum: e.target.value }))}
                    className="w-full"
                    placeholder="Enter student ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full"
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                  Academic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedDepartmentId}
                      onValueChange={(value) => {
                        setSelectedDepartmentId(value);
                        const dept = departments.find(d => d.id === value);
                        setFormData(prev => ({ ...prev, department: dept?.name || '' }));
                        // Clear downstream selections
                        setSelectedCourseId("");
                        setSelectedSectionId("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={departmentsLoading ? 'Loading departments...' : 'Select department'} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-sm font-medium text-gray-700">
                      Course <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedCourseId}
                      onValueChange={(value) => {
                        setSelectedCourseId(value);
                        const course = courses.find(c => c.id === value);
                        setFormData(prev => ({ ...prev, course: course ? (course.name || course.code) : '' }));
                        // Clear downstream selection
                        setSelectedSectionId("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={coursesLoading ? 'Loading courses...' : (selectedDepartmentId ? 'Select course' : 'Select department first')} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses
                          .filter(c => !selectedDepartmentId || c.department === selectedDepartmentId)
                          .map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Section Enrollment */}
                <div className="space-y-2">
                  <Label htmlFor="section" className="text-sm font-medium text-gray-700">
                    Section (Enroll)
                  </Label>
                  <Select value={selectedSectionId} onValueChange={(value) => setSelectedSectionId(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={sectionsLoading ? 'Loading sections...' : 'Select section (optional)'} />
                    </SelectTrigger>
                    <SelectContent>
                      {sections
                        .filter(s => {
                          // 1) Year-level filter (primary)
                          const ylNum = getYearLevelNumber(formData.yearLevel);
                          const byYear = ylNum ? Number((s as any).yearLevel) === ylNum : true;
                          if (!byYear) return false;

                          // 2) Department filter via courseId mapping
                          const courseIdNum = Number((s as any).courseId ?? 0);
                          const byDept = courseIdsForSelectedDept ? courseIdsForSelectedDept.has(courseIdNum) : true;
                          if (!byDept) return false;

                          // 3) Specific course filter (if chosen)
                          const byCourse = selectedCourseId ? String(courseIdNum) === selectedCourseId : true;
                          return byCourse;
                        })
                        .map(s => (
                          <SelectItem key={s.sectionId} value={String(s.sectionId)}>
                            {s.sectionName} {s.courseName ? `• ${s.courseName}` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Selecting a section will enroll the student to that section on save.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearLevel" className="text-sm font-medium text-gray-700">
                      Year Level <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.yearLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, yearLevel: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select year level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIRST_YEAR">First Year</SelectItem>
                        <SelectItem value="SECOND_YEAR">Second Year</SelectItem>
                        <SelectItem value="THIRD_YEAR">Third Year</SelectItem>
                        <SelectItem value="FOURTH_YEAR">Fourth Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToStudent}
                className="text-gray-600 hover:text-gray-800 rounded"
              >
                Reset
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="px-6 rounded"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.firstName || !formData.lastName || !formData.studentIdNum || !formData.email}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                {isSaving ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      {feedback.open && (
        <Dialog open={feedback.open} onOpenChange={() => feedback.onClose?.()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {feedback.variant === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {feedback.variant === 'error' && <X className="w-5 h-5 text-red-600" />}
                {feedback.variant === 'info' && <Info className="w-5 h-5 text-blue-600" />}
                {feedback.title}
              </DialogTitle>
            </DialogHeader>
            {feedback.description && (
              <p className="text-gray-600">{feedback.description}</p>
            )}
            <div className="flex justify-end">
              <Button onClick={() => feedback.onClose?.()}>
                {feedback.variant === 'success' ? 'Continue' : 'Close'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
