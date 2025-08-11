"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, User, Building, BookOpen, Clock, CheckCircle, X, Plus, Copy, Printer } from "lucide-react";
import { toast } from "sonner";

interface InstructorData {
  instructorId: string;
  instructorName: string;
  employeeId: string;
  email: string;
  department: string;
  instructorType: string;
  status: string;
  subjects: string[];
}

interface EditInstructorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: InstructorData | null;
  departments: string[];
  subjects: string[];
  onSave?: (data: any) => void;
  showCopyButton?: boolean;
  showPrintButton?: boolean;
}

export default function EditInstructorDialog({
  open,
  onOpenChange,
  instructor,
  departments = [],
  subjects = [],
  onSave,
  showCopyButton = true,
  showPrintButton = true
}: EditInstructorDialogProps) {
  const [formData, setFormData] = useState({
    instructorName: "",
    employeeId: "",
    email: "",
    phone: "",
    department: "",
    instructorType: "",
    status: "",
    subjects: [] as string[]
  });

  // Update form data when instructor changes
  useState(() => {
    if (instructor) {
      setFormData({
        instructorName: instructor.instructorName,
        employeeId: instructor.employeeId,
        email: instructor.email,
        phone: "",
        department: instructor.department,
        instructorType: instructor.instructorType,
        status: instructor.status,
        subjects: instructor.subjects
      });
    }
  });

  if (!instructor) return null;

  // Helper functions
  const copyToClipboard = async (text: string, fieldLabel: string) => {
    try {
      await navigator.clipboard.writeText(text.toString());
      toast.success(`${fieldLabel} copied to clipboard`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handlePrint = () => {
    toast.success('Print dialog opened');
  };

  const handleSubjectAdd = (subject: string) => {
    if (subject && !formData.subjects.includes(subject)) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, subject]
      }));
    }
  };

  const handleSubjectRemove = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(formData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-orange-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[800px] sm:mx-4 sm:my-1 md:max-w-[1000px] md:mx-6 md:my-1 lg:max-w-[1200px] lg:mx-8 lg:my-1 flex flex-col h-full">
        {/* Header with gradient background - ViewDialog style */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-700 to-orange-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
              <Edit className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-white text-2xl font-bold">
                  Edit Instructor
                </DialogTitle>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-orange-100 text-lg font-medium">{instructor.instructorName}</p>
                <p className="text-orange-200 text-sm">{instructor.employeeId} • {instructor.department}</p>
              </div>
            </div>
          </div>
          
          {/* Header Action Buttons */}
          <div className="absolute top-6 right-6 flex items-center gap-2">
            {showCopyButton && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 hover:text-white rounded flex items-center gap-1"
                onClick={() => copyToClipboard(instructor.instructorName, 'Instructor Name')}
              >
                <Copy className="w-4 h-4" />
                Copy
              </Button>
            )}
            {showPrintButton && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 hover:text-white rounded flex items-center gap-1"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
            )}
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
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-8">
            
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.instructorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter employee ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Department & Position Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-green-600" />
                Department & Position
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    value={formData.instructorType}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructorType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="ADJUNCT">Adjunct</option>
                    <option value="VISITING">Visiting</option>
                    <option value="SUBSTITUTE">Substitute</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subject Assignments */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Subject Assignments
              </h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject, index) => (
                    <div key={index} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                      <span className="text-sm">{subject}</span>
                      <button 
                        type="button"
                        onClick={() => handleSubjectRemove(subject)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleSubjectAdd(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">Add Subject</option>
                    {subjects.filter(s => !formData.subjects.includes(s)).map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Attendance Settings Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Attendance Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grace Period (minutes)</label>
                  <input
                    type="number"
                    defaultValue="15"
                    min="0"
                    max="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="15"
                  />
                  <p className="text-xs text-gray-500 mt-1">Time allowed before marking as late</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notification Preferences</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">SMS notifications</span>
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
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleSave}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
