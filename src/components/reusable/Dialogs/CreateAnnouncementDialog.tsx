"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, FileText, Tag, Calendar, AlertCircle, X } from "lucide-react";
import { AnnouncementStatus } from "@/types/announcement";
import { cn } from "@/lib/utils";

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnnouncementCreated?: (announcement: any) => void;
}

export function CreateAnnouncementDialog({ open, onOpenChange, onAnnouncementCreated }: CreateAnnouncementDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    class: "",
    status: "normal" as AnnouncementStatus,
    date: new Date().toISOString().split('T')[0],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = [
    { value: "normal", label: "Normal" },
    { value: "important", label: "Important" },
    { value: "archived", label: "Archived" },
  ];

  const classOptions = [
    "All Classes",
    "Computer Science",
    "Information Technology",
    "Computer Engineering",
    "Data Science",
    "Cybersecurity",
    "Software Engineering",
    "Network Administration",
    "Database Management",
    "Web Development",
    "Mobile Development",
    "Artificial Intelligence",
    "Machine Learning",
    "Cloud Computing",
    "DevOps",
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.class) {
      newErrors.class = "Class is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create announcement");
      }

      const newAnnouncement = await response.json();
      onAnnouncementCreated?.(newAnnouncement);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        class: "",
        status: "normal",
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error("Error creating announcement:", error);
      setErrors({ submit: error instanceof Error ? error.message : "Failed to create announcement" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:mx-4 sm:my-1 md:mx-6 md:my-1 lg:mx-8 lg:my-1 flex flex-col h-full">
        {/* Blue Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                Create New Announcement
              </DialogTitle>
              <p className="text-blue-100 text-sm mt-1 font-medium">Add a new announcement to the system</p>
            </div>
          </div>
          {/* Close button in header */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
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
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2 text-blue-900">
                <FileText className="w-4 h-4 text-blue-600" />
                Basic Information
              </h3>
            
            <div className="space-y-2">
              <Label htmlFor="title" className="text-blue-900 font-medium">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter announcement title"
                className={cn(
                  "border-blue-200 focus:border-blue-400 focus:ring-blue-200",
                  errors.title ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""
                )}
              />
              {errors.title && <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-blue-900 font-medium">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter announcement description"
                rows={4}
                className={cn(
                  "border-blue-200 focus:border-blue-400 focus:ring-blue-200",
                  errors.description ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""
                )}
              />
              {errors.description && <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description}
              </p>}
            </div>
          </div>

            {/* Class and Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2 text-blue-900">
                <Tag className="w-4 h-4 text-blue-600" />
                Classification
              </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class" className="text-blue-900 font-medium">Class *</Label>
                <Select value={formData.class} onValueChange={(value) => handleInputChange("class", value)}>
                  <SelectTrigger className={cn(
                    "border-blue-200 focus:border-blue-400 focus:ring-blue-200",
                    errors.class ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""
                  )}>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((classOption) => (
                      <SelectItem key={classOption} value={classOption}>
                        {classOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.class && <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.class}
                </p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-blue-900 font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-200">
                    <SelectValue />
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
            </div>
          </div>

            {/* Date */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2 text-blue-900">
                <Calendar className="w-4 h-4 text-blue-600" />
                Date Information
              </h3>
            
            <div className="space-y-2">
              <Label htmlFor="date" className="text-blue-900 font-medium">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className={cn(
                  "border-blue-200 focus:border-blue-400 focus:ring-blue-200",
                  errors.date ? "border-red-500 focus:border-red-500 focus:ring-red-200" : ""
                )}
              />
              {errors.date && <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.date}
              </p>}
            </div>
          </div>

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with actions - Fixed */}
        <DialogFooter className="!flex !justify-end gap-3 p-6 flex-shrink-0 border-t-2 border-blue-300 bg-blue-50/80 rounded-b-2xl shadow-inner">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
            className="gap-2 rounded-xl border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Megaphone className="w-4 h-4" />
            {isLoading ? "Creating..." : "Create Announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
