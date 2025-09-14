"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSearchableSelectSearch } from "@/components/reusable/Search/SearchableSelect";
import { Edit, Clock, CheckCircle, X, Info } from "lucide-react";

interface InstructorData {
  instructorId: string;
  instructorName: string; // Full name from list context; will be parsed into first/middle/last
  employeeId: string;
  email: string;
  department: string; // Department name
  instructorType: string; // e.g., FULL_TIME | PART_TIME
  status: string; // ACTIVE | INACTIVE
  subjects: string[]; // Subject codes or names
}

interface EditInstructorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: InstructorData | null;
  onSave?: (data: any) => void;
}

export default function EditInstructorDialog({
  open,
  onOpenChange,
  instructor,
  onSave,
  
}: EditInstructorDialogProps) {
  // Options fetched from API to align with schema (IDs)
  const [deptOptions, setDeptOptions] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [subjectOptions, setSubjectOptions] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  // Form state aligned to prisma schema
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    employeeId: "",
    email: "",
    phoneNumber: "",
    gender: "" as "MALE" | "FEMALE" | "",
    departmentId: "", // keep as string for Select; convert to number on save
    instructorType: "" as "FULL_TIME" | "PART_TIME" | "",
    status: "" as "ACTIVE" | "INACTIVE" | "",
    rfidTag: "",
    subjectIds: [] as string[], // store as string IDs for UI, convert to numbers on save
  });
  const [formProgress, setFormProgress] = useState(0);

  // Fetch departments and subjects (IDs + labels)
  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      try {
        setOptionsLoading(true);
        const [deptRes, subjRes] = await Promise.all([
          fetch('/api/departments?page=1&pageSize=1000&status=ACTIVE'),
          fetch('/api/subjects?page=1&pageSize=1000&status=ACTIVE')
        ]);
        if (deptRes.ok) {
          const d = await deptRes.json();
          const list = (d?.departments || d?.data || []).map((x: any) => ({ id: x.departmentId ?? x.id, name: x.departmentName ?? x.name, code: x.departmentCode ?? x.code }));
          if (isMounted) setDeptOptions(list.filter((x: any) => x.id && x.name));
        }
        if (subjRes.ok) {
          const s = await subjRes.json();
          const list = (s?.subjects || s?.data || []).map((x: any) => ({ id: x.subjectId ?? x.id, code: x.subjectCode ?? x.code, name: x.subjectName ?? x.name }));
          if (isMounted) setSubjectOptions(list.filter((x: any) => x.id && x.code));
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setOptionsLoading(false);
      }
    };
    loadOptions();
    return () => { isMounted = false; };
  }, []);

  // Helper to parse full name into first/middle/last
  const parseFullName = (fullName: string) => {
    const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
    if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
    // 3+ parts: take first and last, middle is the rest
    return { firstName: parts[0], middleName: parts.slice(1, -1).join(' '), lastName: parts[parts.length - 1] };
  };

  // Prefill when instructor or options change
  useEffect(() => {
    if (!instructor) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/instructors/${instructor.instructorId}`);
        if (!res.ok) throw new Error(`Failed to load instructor details`);
        const { data } = await res.json();
        if (cancelled) return;
        setFormData(prev => ({
          ...prev,
          firstName: data.firstName || '',
          middleName: data.middleName || '',
          lastName: data.lastName || '',
          suffix: data.suffix || '',
          employeeId: data.employeeId || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          gender: data.gender || '',
          departmentId: data.departmentId ? String(data.departmentId) : '',
          instructorType: data.instructorType || '',
          status: data.status || '',
          rfidTag: data.rfidTag || '',
          subjectIds: Array.isArray(data.subjectIds) ? data.subjectIds.map((n: number) => String(n)) : [],
        }));
      } catch {
        // fallback to parsing if API fails
        const { firstName, middleName, lastName } = parseFullName(instructor.instructorName || "");
        const deptId = deptOptions.find(d => d.name === instructor.department || d.code === instructor.department)?.id;
        const subjIds = (instructor.subjects || []).map(codeOrName => {
          const found = subjectOptions.find(s => s.code === codeOrName || s.name === codeOrName);
          return found ? String(found.id) : '';
        }).filter(Boolean);
        if (cancelled) return;
        setFormData(prev => ({
          ...prev,
          firstName,
          middleName,
          lastName,
          suffix: "",
          employeeId: instructor.employeeId || "",
          email: instructor.email || "",
          phoneNumber: "",
          gender: "",
          departmentId: deptId ? String(deptId) : prev.departmentId,
          instructorType: (instructor.instructorType === 'FULL_TIME' || instructor.instructorType === 'PART_TIME') ? instructor.instructorType as any : "",
          status: (instructor.status === 'ACTIVE' || instructor.status === 'INACTIVE') ? instructor.status as any : "",
          rfidTag: "",
          subjectIds: subjIds.length > 0 ? subjIds : prev.subjectIds,
        }));
      }
    };
    load();
    return () => { cancelled = true; };
  }, [instructor, deptOptions, subjectOptions]);


  // Helper functions
  const resetToInstructor = () => {
    if (!instructor) return;
    const { firstName, middleName, lastName } = parseFullName(instructor.instructorName || "");
    const deptId = deptOptions.find(d => d.name === instructor.department || d.code === instructor.department)?.id;
    const subjIds = (instructor.subjects || []).map(codeOrName => {
      const found = subjectOptions.find(s => s.code === codeOrName || s.name === codeOrName);
      return found ? String(found.id) : '';
    }).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      firstName,
      middleName,
      lastName,
      suffix: "",
      employeeId: instructor.employeeId || "",
      email: instructor.email || "",
      phoneNumber: "",
      gender: "",
      departmentId: deptId ? String(deptId) : "",
      instructorType: (instructor.instructorType === 'FULL_TIME' || instructor.instructorType === 'PART_TIME') ? instructor.instructorType as any : "",
      status: (instructor.status === 'ACTIVE' || instructor.status === 'INACTIVE') ? instructor.status as any : "",
      rfidTag: "",
      subjectIds: subjIds,
    }));
  };

  const handleSubjectRemove = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjectIds: prev.subjectIds.filter(s => s !== subject)
    }));
  };

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error' | 'info';
    onClose?: () => void;
  }>({ open: false, title: '' });

  const handleSave = async () => {
    // Basic validation
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.middleName.trim()) errors.middleName = 'Middle name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Enter a valid email address';
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.departmentId) errors.departmentId = 'Department is required';
    if (!formData.instructorType.trim()) errors.instructorType = 'Employment type is required';
    if (!formData.status.trim()) errors.status = 'Status is required';
    if (!formData.rfidTag.trim()) errors.rfidTag = 'RFID tag is required';
    if (Object.keys(errors).length > 0) {
      setFeedback({
        open: true,
        title: 'Please fix validation errors',
        description: 'Fill all required fields and provide valid values.',
        variant: 'error'
      });
      return;
    }

    try {
      setIsSaving(true);
      if (onSave) {
        const payload = {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          suffix: formData.suffix || null,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          instructorType: formData.instructorType,
          status: formData.status,
          departmentId: Number(formData.departmentId),
          employeeId: formData.employeeId,
          rfidTag: formData.rfidTag,
          subjectIds: formData.subjectIds.map(id => Number(id)),
        };
        await Promise.resolve(onSave(payload));
        setFeedback({
          open: true,
          title: 'Instructor updated',
          description: 'Your changes have been saved successfully.',
          variant: 'success',
          onClose: () => onOpenChange(false)
        });
      } else {
        // Fallback: emit a console log so usage without onSave is still traceable
        console.log("EditInstructorDialog save:", formData);
        setFeedback({
          open: true,
          title: 'Ready to save',
          description: 'Changes prepared (no save handler wired).',
          variant: 'info',
          onClose: () => onOpenChange(false)
        });
      }
      try {
        const key = `instructorEditDraft-${instructor?.instructorId || 'new'}`;
        localStorage.removeItem(key);
      } catch {}
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setFeedback({
        open: true,
        title: 'Failed to save changes',
        description: errorMessage,
        variant: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Compute progress based on required fields
  useEffect(() => {
    const required: Array<[string, boolean]> = [
      ['firstName', formData.firstName.trim().length > 0],
      ['middleName', formData.middleName.trim().length > 0],
      ['lastName', formData.lastName.trim().length > 0],
      ['employeeId', formData.employeeId.trim().length > 0],
      ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)],
      ['phoneNumber', formData.phoneNumber.trim().length > 0],
      ['gender', !!formData.gender],
      ['departmentId', !!formData.departmentId],
      ['instructorType', !!formData.instructorType],
      ['status', !!formData.status],
      ['rfidTag', formData.rfidTag.trim().length > 0],
    ];
    const filled = required.filter(([, ok]) => ok).length;
    setFormProgress(Math.round((filled / required.length) * 100));
  }, [formData]);

  // Auto-load draft from localStorage when dialog opens
  const [draftInfo, setDraftInfo] = useState<{ savedAt?: string } | null>(null);
  useEffect(() => {
    if (!open) return;
    try {
      const key = `instructorEditDraft-${instructor?.instructorId || 'new'}`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      if (raw) {
        const parsed = JSON.parse(raw || '{}');
        const { savedAt, ...rest } = parsed || {};
        setFormData(prev => ({ ...prev, ...rest }));
        setDraftInfo({ savedAt });
      } else {
        setDraftInfo(null);
      }
    } catch {
      // ignore JSON/storage errors
    }
  }, [open, instructor]);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[800px] sm:mx-4 sm:my-1 md:max-w-[1000px] md:mx-6 md:my-1 lg:max-w-[1200px] lg:mx-8 lg:my-1 flex flex-col h-full">
        {/* Header with gradient background and progress */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <DialogTitle className="text-white text-2xl font-bold">
                  Edit Instructor
                </DialogTitle>
              </div>
              <p className="text-white/80 text-sm">
                Update instructor information and settings
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
            {draftInfo && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded border border-amber-200 text-amber-800 text-sm">
                <span>
                  Draft loaded{draftInfo.savedAt ? ` (${new Date(draftInfo.savedAt).toLocaleString()})` : ''}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 rounded"
                    onClick={() => {
                      try {
                        const key = `instructorEditDraft-${instructor?.instructorId || 'new'}`;
                        localStorage.removeItem(key);
                      } catch {}
                      resetToInstructor();
                      setDraftInfo(null);
                    }}
                  >
                    Discard Draft
                  </Button>
                </div>
              </div>
            )}
            
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">First Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 text-blue-700 placeholder:text-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Middle Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.middleName}
                    onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 text-blue-700 placeholder:text-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter middle name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 text-blue-700 placeholder:text-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Suffix</label>
                  <input
                    type="text"
                    value={formData.suffix}
                    onChange={(e) => setFormData(prev => ({ ...prev, suffix: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 text-blue-700 placeholder:text-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Jr., Sr., III"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Employee ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 text-blue-700 placeholder:text-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter employee ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-blue-300 text-blue-700 placeholder:text-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => {
                      // Basic phone number formatting
                      const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                      setFormData(prev => ({ ...prev, phoneNumber: value }));
                    }}
                    className="w-full px-3 py-2 border border-blue-300 text-blue-700 placeholder:text-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number (digits only)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Gender <span className="text-red-500">*</span></label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData(prev => ({ ...prev, gender: v as any }))}>
                    <SelectTrigger className="w-full text-sm text-blue-700 min-w-0 rounded border-blue-300 bg-white hover:bg-gray-50">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Department & Position Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                Department & Position
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Department <span className="text-red-500">*</span></label>
                  <Select value={formData.departmentId} onValueChange={(v) => setFormData(prev => ({ ...prev, departmentId: v }))}>
                    <SelectTrigger className="w-full text-sm text-blue-700 min-w-0 rounded border-blue-300 bg-white hover:bg-gray-50">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {deptOptions.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>{dept.code ? `${dept.code} - ${dept.name}` : dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Employment Type <span className="text-red-500">*</span></label>
                  <Select value={formData.instructorType} onValueChange={(v) => setFormData(prev => ({ ...prev, instructorType: v as any }))}>
                    <SelectTrigger className="w-full text-sm text-blue-700 min-w-0 rounded border-blue-300 bg-white hover:bg-gray-50">
                      <SelectValue placeholder="Select Employment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Full Time</SelectItem>
                      <SelectItem value="PART_TIME">Part Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Status <span className="text-red-500">*</span></label>
                  <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as any }))}>
                    <SelectTrigger className="w-full text-sm text-blue-700 min-w-0 rounded border-blue-300 bg-white hover:bg-gray-50">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">RFID Tag <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.rfidTag}
                    onChange={(e) => {
                      // RFID tag formatting (alphanumeric, max 20 chars)
                      const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20).toUpperCase();
                      setFormData(prev => ({ ...prev, rfidTag: value }));
                    }}
                    className="w-full px-3 py-2 border border-blue-300 text-blue-700 placeholder:text-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter RFID Tag (alphanumeric)"
                  />
                </div>
              </div>
            </div>

            {/* Subject Assignments */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                Subject Assignments
              </h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.subjectIds.map((id, index) => {
                    const s = subjectOptions.find(x => String(x.id) === id);
                    return (
                      <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        <span className="text-sm">{s ? `${s.code} - ${s.name}` : id}</span>
                      <button 
                        type="button"
                        onClick={() => handleSubjectRemove(id)}
                        className="text-blue-600 hover:text-blue-800 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <MultiSearchableSelectSearch
                    options={subjectOptions.map(s => ({ value: String(s.id), label: `${s.code} - ${s.name}` }))}
                    value={formData.subjectIds}
                    onChange={(vals) => setFormData(prev => ({ ...prev, subjectIds: vals }))}
                    placeholder="Search and add subjects..."
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Settings Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                Attendance Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Grace Period (minutes)</label>
                  <input
                    type="number"
                    defaultValue="15"
                    min="0"
                    max="60"
                    className="w-full px-3 py-2 border border-blue-300 text-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">Time allowed before marking as late</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">Notification Preferences</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm">Absence alerts</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer with Action Buttons */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between flex-shrink-0">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <div className="flex gap-3 rounded">
            <Button
              variant="outline"
              onClick={resetToInstructor}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded11"
            >
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                try {
                  const key = `instructorEditDraft-${instructor?.instructorId || 'new'}`;
                  localStorage.setItem(key, JSON.stringify({ ...formData, savedAt: new Date().toISOString() }));
                  setDraftInfo({ savedAt: new Date().toISOString() });
                } catch {}
              }}
              className="border-green-300 text-green-700 hover:bg-green-50 rounded"
            >
              Save Draft
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 rounded"
              onClick={handleSave}
              disabled={isSaving}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    {/* Feedback Dialog */}
    <Dialog
      open={feedback.open}
      onOpenChange={(open) => {
        if (!open) {
          const onClose = feedback.onClose;
          setFeedback({ open: false, title: '' });
          onClose?.();
        }
      }}
    >
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-xl">
        <div className="p-6">
          <div className="flex items-start gap-3">
            {feedback.variant === 'success' && (
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
            )}
            {feedback.variant === 'error' && (
              <X className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            {(!feedback.variant || feedback.variant === 'info') && (
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            )}
            <div>
              <DialogTitle className="text-base font-semibold">
                {feedback.title}
              </DialogTitle>
              {feedback.description && (
                <p className="text-sm text-slate-600 mt-1">{feedback.description}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              className="rounded bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                const onClose = feedback.onClose;
                setFeedback({ open: false, title: '' });
                onClose?.();
              }}
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
