"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, AlertTriangle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Schedule } from "@/types/schedule";

interface DeleteScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  onScheduleDeleted?: (scheduleId: number) => void;
}

export function DeleteScheduleDialog({ open, onOpenChange, schedule, onScheduleDeleted }: DeleteScheduleDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!schedule) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/schedules/${schedule.subjectSchedId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Schedule deleted successfully');
        onScheduleDeleted?.(schedule.subjectSchedId);
        onOpenChange(false);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false);
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Delete Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. This will permanently delete the schedule and remove all associated data.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-gray-900">Schedule Details:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Subject:</strong> {schedule.subject.subjectName} ({schedule.subject.subjectCode})</p>
              <p><strong>Section:</strong> {schedule.section.sectionName}</p>
              <p><strong>Instructor:</strong> {schedule.instructor ? `${schedule.instructor.firstName} ${schedule.instructor.lastName}` : 'No instructor assigned'}</p>
              <p><strong>Room:</strong> {schedule.room.roomNo}</p>
              <p><strong>Day:</strong> {schedule.day}</p>
              <p><strong>Time:</strong> {schedule.startTime} - {schedule.endTime}</p>
              <p><strong>Type:</strong> {schedule.scheduleType}</p>
              <p><strong>Status:</strong> {schedule.status}</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this schedule? This action cannot be undone.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Schedule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
