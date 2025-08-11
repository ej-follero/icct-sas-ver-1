"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, X, CheckCircle, Trash2, Copy, Printer } from "lucide-react";
import { toast } from "sonner";

interface InstructorData {
  instructorId: string;
  instructorName: string;
  employeeId: string;
  department: string;
  attendanceRate: number;
  subjects: string[];
  totalScheduledClasses: number;
  avatarUrl?: string;
}

interface DeactivateInstructorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor: InstructorData | null;
  onDeactivate?: (instructorId: string, reason?: string) => void;
  onArchive?: (instructorId: string, reason?: string) => void;
  showCopyButton?: boolean;
  showPrintButton?: boolean;
}

export default function DeactivateInstructorDialog({
  open,
  onOpenChange,
  instructor,
  onDeactivate,
  onArchive,
  showCopyButton = true,
  showPrintButton = true
}: DeactivateInstructorDialogProps) {
  const [deactivationType, setDeactivationType] = useState("immediate");
  const [reason, setReason] = useState("");

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

  const handleDeactivate = () => {
    if (onDeactivate) {
      onDeactivate(instructor.instructorId, reason);
    }
    onOpenChange(false);
  };

  const handleArchive = () => {
    if (onArchive) {
      onArchive(instructor.instructorId, reason);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-red-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[600px] sm:mx-4 sm:my-1 md:max-w-[750px] md:mx-6 md:my-1 lg:max-w-[900px] lg:mx-8 lg:my-1 flex flex-col h-full">
        {/* Header with gradient background - ViewDialog style */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
              <div className="relative">
                <Avatar className="h-10 w-10 ring-2 ring-white/30">
                  <AvatarImage src={instructor.avatarUrl} />
                  <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                    {instructor.instructorName.split(' ').map(name => name.charAt(0)).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-white text-2xl font-bold flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Deactivate Instructor
                </DialogTitle>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-red-100 text-lg font-medium">{instructor.instructorName}</p>
                <p className="text-red-200 text-sm">{instructor.employeeId} • {instructor.department}</p>
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
          <div className="p-6 space-y-6">

            {/* Instructor Summary Card */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className="flex gap-2 mt-1">
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {instructor.attendanceRate}% Attendance
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {instructor.subjects.length} Subjects
                </Badge>
              </div>
            </div>

          {/* Warning Message */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-medium text-yellow-800">Are you sure you want to deactivate this instructor?</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  This action will mark the instructor as inactive and affect their current assignments.
                </p>
              </div>
            </div>

            {/* Impact Information */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 className="font-medium text-red-800 mb-3">Impact Assessment:</h5>
              <div className="space-y-2 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  <span>{instructor.totalScheduledClasses} active classes will need reassignment</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  <span>Students in {instructor.subjects.length} different subjects will be affected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Historical attendance data will be preserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Can be reactivated later if needed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Deactivation Options:</h5>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input 
                  type="radio" 
                  name="deactivation-type" 
                  value="immediate"
                  checked={deactivationType === "immediate"}
                  onChange={(e) => setDeactivationType(e.target.value)}
                  className="mt-1" 
                />
                <div>
                  <div className="font-medium text-gray-900">Immediate Deactivation</div>
                  <div className="text-sm text-gray-600">Deactivate now and reassign classes immediately</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input 
                  type="radio" 
                  name="deactivation-type" 
                  value="end-semester"
                  checked={deactivationType === "end-semester"}
                  onChange={(e) => setDeactivationType(e.target.value)}
                  className="mt-1" 
                />
                <div>
                  <div className="font-medium text-gray-900">End of Semester</div>
                  <div className="text-sm text-gray-600">Complete current semester before deactivation</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input 
                  type="radio" 
                  name="deactivation-type" 
                  value="transfer-first"
                  checked={deactivationType === "transfer-first"}
                  onChange={(e) => setDeactivationType(e.target.value)}
                  className="mt-1" 
                />
                <div>
                  <div className="font-medium text-gray-900">Transfer Classes First</div>
                  <div className="text-sm text-gray-600">Assign a replacement instructor before deactivating</div>
                </div>
              </label>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Deactivation (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={3}
              placeholder="Enter reason for deactivation..."
            />
          </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="text-blue-600 border-blue-600 hover:bg-blue-50"
              onClick={handleArchive}
            >
              Archive Only
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeactivate}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deactivate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
