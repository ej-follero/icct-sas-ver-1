"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Calendar, X } from "lucide-react";

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onBulkEdit: (data: any) => void;
}

export function BulkEditDialog({ open, onOpenChange, selectedCount, onBulkEdit }: BulkEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    scheduleType: '',
    status: '',
    maxStudents: '',
    academicYear: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Filter out empty values
      const updateData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '')
      );

      if (Object.keys(updateData).length === 0) {
        throw new Error('Please select at least one field to update');
      }

      await onBulkEdit(updateData);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        scheduleType: '',
        status: '',
        maxStudents: '',
        academicYear: '',
        notes: ''
      });
    } catch (error) {
      console.error('Bulk edit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setFormData({
        scheduleType: '',
        status: '',
        maxStudents: '',
        academicYear: '',
        notes: ''
      });
    }
  };

  const scheduleTypes = [
    { value: 'REGULAR', label: 'Regular' },
    { value: 'MAKEUP', label: 'Makeup' },
    { value: 'SPECIAL', label: 'Special' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'EXAM', label: 'Exam' }
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'POSTPONED', label: 'Postponed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Bulk Edit Schedules</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Update {selectedCount} selected schedule(s)
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="scheduleType" className="text-sm font-medium">
                Schedule Type
              </Label>
              <Select value={formData.scheduleType} onValueChange={(value) => handleInputChange('scheduleType', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {scheduleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxStudents" className="text-sm font-medium">
                Max Students
              </Label>
              <Input
                id="maxStudents"
                type="number"
                value={formData.maxStudents}
                onChange={(e) => handleInputChange('maxStudents', e.target.value)}
                placeholder="Enter max students (optional)"
                className="mt-1"
                min="1"
                max="100"
              />
            </div>

            <div>
              <Label htmlFor="academicYear" className="text-sm font-medium">
                Academic Year
              </Label>
              <Input
                id="academicYear"
                type="text"
                value={formData.academicYear}
                onChange={(e) => handleInputChange('academicYear', e.target.value)}
                placeholder="e.g., 2024-2025 (optional)"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Input
                id="notes"
                type="text"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter notes (optional)"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Schedules'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

