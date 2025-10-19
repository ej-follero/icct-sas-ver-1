"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, UserPlus, Loader2, AlertCircle, CheckCircle, XCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  studentIdNumber: string;
  yearLevel: number;
  email: string;
  status: string;
  departmentName?: string;
  courseName?: string;
  currentSections?: string[];
}

interface Section {
  sectionId: number;
  sectionName: string;
  sectionCapacity: number;
  currentEnrollment: number;
  yearLevel: number;
  courseName: string;
}

interface BulkAssignStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  onSuccess?: (assignedCount: number) => void;
}

export function BulkAssignStudentsDialog({
  open,
  onOpenChange,
  sections,
  onSuccess
}: BulkAssignStudentsDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearLevelFilter, setYearLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch students when dialog opens
  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/students?limit=1000');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search and filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentIdNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesYearLevel = yearLevelFilter === 'all' || 
        student.yearLevel.toString() === yearLevelFilter;

      const matchesStatus = statusFilter === 'all' || 
        student.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesYearLevel && matchesStatus;
    });
  }, [students, searchTerm, yearLevelFilter, statusFilter]);

  // Get available sections (filtered by year level if needed)
  const availableSections = useMemo(() => {
    if (selectedStudents.length === 0) return sections;
    
    // Get year levels of selected students
    const selectedStudentYearLevels = selectedStudents
      .map(id => students.find(s => s.studentId === id)?.yearLevel)
      .filter(Boolean);
    
    if (selectedStudentYearLevels.length === 0) return sections;
    
    // Filter sections that match the year levels of selected students
    // Only show sections where ALL selected students can be assigned
    const compatibleSections = sections.filter(section => {
      // Check if ALL selected students have matching year level
      return selectedStudentYearLevels.every(yearLevel => yearLevel === section.yearLevel);
    });
    
    return compatibleSections;
  }, [sections, selectedStudents, students]);

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.studentId));
    }
  };

  const handleAssign = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }
    if (!selectedSection) {
      toast.error('Please select a section');
      return;
    }

    const section = sections.find(s => s.sectionId.toString() === selectedSection);
    if (!section) {
      toast.error('Selected section not found');
      return;
    }

    // Check capacity
    const newEnrollment = section.currentEnrollment + selectedStudents.length;
    if (newEnrollment > section.sectionCapacity) {
      toast.error(`Section capacity exceeded. Current: ${section.currentEnrollment}, Capacity: ${section.sectionCapacity}, Trying to add: ${selectedStudents.length}`);
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      // Use the bulk assignment API endpoint
      const response = await fetch('/api/sections/bulk-assign-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedStudents,
          sectionId: parseInt(selectedSection)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to assign students (HTTP ${response.status})`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        if (onSuccess) {
          onSuccess(result.data.assignedCount);
        }
        // Reset form
        setSelectedStudents([]);
        setSelectedSection('');
        setSearchTerm('');
        setYearLevelFilter('all');
        setStatusFilter('all');
      } else {
        throw new Error(result.error || 'Assignment failed');
      }

    } catch (err) {
      console.error('Bulk assignment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign students. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const isAllSelected = selectedStudents.length === filteredStudents.length && filteredStudents.length > 0;
  const isIndeterminate = selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length;

  // Check for year level conflicts
  const selectedStudentYearLevels = selectedStudents
    .map(id => students.find(s => s.studentId === id)?.yearLevel)
    .filter(Boolean);
  
  const hasYearLevelConflict = selectedStudentYearLevels.length > 0 && 
    new Set(selectedStudentYearLevels).size > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 rounded-xl">
        <DialogHeader className="p-0">
          {/* Blue Gradient Header */}
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0 rounded-t-xl">
            <div className="py-4 sm:py-6">
              <div className="flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-white">Bulk Assign Students to Section</DialogTitle>
                    <p className="text-blue-100 text-sm">Select students and assign them to a section</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
                  disabled={assigning}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content with padding */}
        <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col gap-6">
          {/* Section Selection */}
          <div className="space-y-3">
            <Label htmlFor="section-select" className="text-sm font-medium text-gray-700">Target Section</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="w-full rounded">
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {availableSections.map(section => (
                  <SelectItem key={section.sectionId} value={section.sectionId.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{section.sectionName}</span>
                      <div className="flex items-center gap-2 ml-4 text-sm text-gray-500">
                        <span>{section.courseName}</span>
                        <span>•</span>
                        <span>Year {section.yearLevel}</span>
                        <span>•</span>
                        <span className="font-medium">{section.currentEnrollment}/{section.sectionCapacity}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year-filter" className="text-sm font-medium text-gray-700">Year Level</Label>
              <Select value={yearLevelFilter} onValueChange={setYearLevelFilter}>
                <SelectTrigger className="text-gray-700 rounded">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-gray-700 rounded">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm font-medium text-gray-700">
                  Select Students ({selectedStudents.length} selected)
                </Label>
              </div>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {filteredStudents.length} students found
              </Badge>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {hasYearLevelConflict && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <div className="text-sm text-orange-700">
                  <span className="font-medium">Year Level Conflict:</span> Selected students have different year levels. 
                  Only sections matching the same year level will be available.
                </div>
              </div>
            )}

            {selectedStudents.length > 0 && availableSections.length === 0 && !hasYearLevelConflict && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <div className="text-sm text-yellow-700">
                  <span className="font-medium">No Compatible Sections:</span> No sections are available for the selected students' year level.
                </div>
              </div>
            )}

            <ScrollArea className="h-64 border border-gray-200 rounded bg-white">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading students...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Users className="w-8 h-8 mb-2" />
                  <span>No students found</span>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.studentId}
                      className={`flex items-center gap-3 p-3 rounded border transition-colors ${
                        selectedStudents.includes(student.studentId)
                          ? 'bg-blue-50 border-blue-200 shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student.studentId)}
                        onCheckedChange={() => handleStudentToggle(student.studentId)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {student.firstName} {student.lastName}
                          </span>
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                            {student.studentIdNumber}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span>Year {student.yearLevel}</span>
                          {student.departmentName && (
                            <>
                              <span> • </span>
                              <span>{student.departmentName}</span>
                            </>
                          )}
                          {student.courseName && (
                            <>
                              <span> • </span>
                              <span>{student.courseName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            student.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}
                        >
                          {student.status}
                        </Badge>
                        {student.currentSections && student.currentSections.length > 0 && (
                          <div className="text-xs text-orange-600 font-medium">
                            Already in {student.currentSections.length} section(s)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-600">
            {selectedStudents.length > 0 && selectedSection && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium">
                  Ready to assign {selectedStudents.length} student(s) to{' '}
                  <span className="text-blue-600 font-semibold">
                    {sections.find(s => s.sectionId.toString() === selectedSection)?.sectionName}
                  </span>
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assigning}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedStudents.length === 0 || !selectedSection || assigning || hasYearLevelConflict}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign {selectedStudents.length} Student(s)
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
