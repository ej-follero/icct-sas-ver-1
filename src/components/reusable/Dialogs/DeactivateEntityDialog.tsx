"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Trash2, Copy, Printer } from "lucide-react";
import { toast } from "sonner";

interface InstructorData {
  instructorId?: string;
  studentId?: string;
  instructorName?: string;
  studentName?: string;
  employeeId?: string;
  studentIdNum?: string;
  department: string;
  attendanceRate: number;
  subjects: string[];
  totalScheduledClasses: number;
  avatarUrl?: string;
}

interface DeactivateEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: InstructorData | null;
  onDeactivate?: (entityId: string, reason?: string) => void;
  onArchive?: (entityId: string, reason?: string) => void;
  showCopyButton?: boolean;
  showPrintButton?: boolean;
}

export default function DeactivateEntityDialog({
  open,
  onOpenChange,
  entity,
  onDeactivate,
  onArchive,
  showCopyButton = true,
  showPrintButton = true
}: DeactivateEntityDialogProps) {
  const [deactivationType, setDeactivationType] = useState("immediate");
  const [reason, setReason] = useState("");

  if (!entity) return null;

  // Determine if this is a student or instructor
  const isStudent = !!entity.studentId;
  const entityId = isStudent ? entity.studentId : entity.instructorId;
  const entityName = isStudent ? entity.studentName : entity.instructorName;
  const entityIdNum = isStudent ? entity.studentIdNum : entity.employeeId;
  const entityType = isStudent ? 'Student' : 'Instructor';

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
    if (onDeactivate && entityId) {
      onDeactivate(entityId, reason);
    }
    onOpenChange(false);
  };

  const handleArchive = () => {
    if (onArchive && entityId) {
      onArchive(entityId, reason);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full mx-auto p-0 flex flex-col h-[700px] rounded-xl">
        {/* Red Header */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-t-xl p-6 relative flex-shrink-0">
          <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-white/30">
                  <AvatarImage src={entity.avatarUrl} />
                  <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
                    {entityName?.split(' ').map(name => name.charAt(0)).join('').slice(0, 2) || '??'}
                  </AvatarFallback>
                </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-white text-xl font-bold">
                Deactivate {entityType}
              </DialogTitle>
              <p className="text-red-100 text-sm mt-1">
                This action will mark the {entityType.toLowerCase()} as inactive.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-white/20 text-white hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Entity Info */}
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-gray-900">{entityName}</p>
                <p className="text-sm text-gray-600">{entityIdNum} • {entity.department}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Badge variant="outline" className="text-xs">
                {entity.attendanceRate}% Attendance
              </Badge>
              <Badge variant="outline" className="text-xs">
                {entity.subjects.length} Subjects
              </Badge>
            </div>
          </div>


          {/* Impact Summary */}
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h5 className="font-medium text-red-800 mb-3">Impact Assessment:</h5>
            <div className="text-sm text-red-700 space-y-1">
              <p>• {entity.totalScheduledClasses} active classes will need reassignment</p>
              <p>• Students in {entity.subjects.length} subjects will be affected</p>
              <p>• Historical data will be preserved</p>
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Enter reason for deactivation..."
            />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-end gap-3 flex-shrink-0 rounded-b-xl">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded px-6 py-2 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 rounded"
            onClick={handleArchive}
          >
            Archive Only
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 rounded"
            onClick={handleDeactivate}
          >
            Deactivate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
