"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar, MapPin, Users, Clock, Mail, Phone, Image, FileText, Save, X } from "lucide-react";
import { EventType, EventStatus, Priority } from "@prisma/client";

interface Event {
  id: number;
  title: string;
  description: string;
  eventType: string;
  eventDate: string;
  endDate?: string;
  location?: string;
  capacity?: number;
  isPublic: boolean;
  requiresRegistration: boolean;
  priority: string;
  status: string;
  imageUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onEventUpdated?: (event: Event) => void;
}

export function EditEventDialog({ open, onOpenChange, event, onEventUpdated }: EditEventDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "",
    eventDate: "",
    endDate: "",
    location: "",
    capacity: "",
    isPublic: true,
    requiresRegistration: false,
    priority: "NORMAL",
    status: "DRAFT",
    imageUrl: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const eventTypes = [
    { value: "ACADEMIC", label: "Academic" },
    { value: "SOCIAL", label: "Social" },
    { value: "SPORTS", label: "Sports" },
    { value: "ORIENTATION", label: "Orientation" },
    { value: "GRADUATION", label: "Graduation" },
    { value: "MEETING", label: "Meeting" },
    { value: "WORKSHOP", label: "Workshop" },
    { value: "SEMINAR", label: "Seminar" },
    { value: "OTHER", label: "Other" },
  ];

  const priorities = [
    { value: "LOW", label: "Low" },
    { value: "NORMAL", label: "Normal" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ];

  const statuses = [
    { value: "DRAFT", label: "Draft" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "ONGOING", label: "Ongoing" },
    { value: "COMPLETED", label: "Completed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "POSTPONED", label: "Postponed" },
  ];

  // Update form data when event changes
  useEffect(() => {
    if (event) {
      // Helper function to safely convert date to ISO string
      const safeDateToISO = (dateValue: any) => {
        if (!dateValue) return "";
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return "";
          return date.toISOString().slice(0, 16);
        } catch (error) {
          console.warn("Invalid date value:", dateValue);
          return "";
        }
      };

      setFormData({
        title: event.title || "",
        description: event.description || "",
        eventType: event.eventType || "",
        eventDate: safeDateToISO(event.eventDate),
        endDate: safeDateToISO(event.endDate),
        location: event.location || "",
        capacity: event.capacity?.toString() || "",
        isPublic: event.isPublic ?? true,
        requiresRegistration: event.requiresRegistration ?? false,
        priority: event.priority || "NORMAL",
        status: event.status || "DRAFT",
        imageUrl: event.imageUrl || "",
        contactEmail: event.contactEmail || "",
        contactPhone: event.contactPhone || "",
      });
    }
  }, [event]);

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

    if (!formData.eventType) {
      newErrors.eventType = "Event type is required";
    }

    if (!formData.eventDate) {
      newErrors.eventDate = "Event date is required";
    }

    if (formData.endDate && formData.eventDate) {
      const startDate = new Date(formData.eventDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (formData.capacity && parseInt(formData.capacity) < 1) {
      newErrors.capacity = "Capacity must be at least 1";
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!event || !validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update event");
      }

      const updatedEvent = await response.json();
      onEventUpdated?.(updatedEvent);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating event:", error);
      setErrors({ submit: error instanceof Error ? error.message : "Failed to update event" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden rounded-xl flex flex-col p-0">
        <DialogHeader className="p-0 flex-shrink-0">
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6 rounded-t-xl relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Save className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  Edit Event
                </DialogTitle>
                <p className="text-blue-100 text-sm mt-1">
                  Update event details and settings
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-10 w-10 rounded-full hover:bg-white/20 text-white"
              onClick={() => onOpenChange(false)}
              aria-label="Close dialog"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-blue-900">

                    Basic Information
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter event title"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select value={formData.eventType} onValueChange={(value) => handleInputChange("eventType", value)}>
                  <SelectTrigger className={errors.eventType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.eventType && <p className="text-sm text-red-500">{errors.eventType}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter event description"
                rows={3}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>
          </div>

              {/* Date & Time */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-blue-900">
                    Date & Time
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Start Date & Time *</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange("eventDate", e.target.value)}
                  className={errors.eventDate ? "border-red-500" : ""}
                />
                {errors.eventDate && <p className="text-sm text-red-500">{errors.eventDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={errors.endDate ? "border-red-500" : ""}
                />
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate}</p>}
              </div>
            </div>
          </div>

              {/* Location & Capacity */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-blue-900">
                    Location & Capacity
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Enter event location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  placeholder="Enter capacity"
                  className={errors.capacity ? "border-red-500" : ""}
                />
                {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
              </div>
            </div>
          </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-blue-900">
                    Settings
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                  placeholder="Enter image URL"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
                />
                <Label htmlFor="isPublic">Public Event</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requiresRegistration"
                  checked={formData.requiresRegistration}
                  onCheckedChange={(checked) => handleInputChange("requiresRegistration", checked)}
                />
                <Label htmlFor="requiresRegistration">Requires Registration</Label>
              </div>
            </div>
          </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-blue-900">
                    Contact Information
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  placeholder="Enter contact email"
                  className={errors.contactEmail ? "border-red-500" : ""}
                />
                {errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                  placeholder="Enter contact phone"
                />
              </div>
            </div>
          </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="flex items-center justify-between pt-6 border-t border-gray-200 flex-shrink-0 px-6 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Fields marked with * are required
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isLoading}
                className="rounded"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 rounded"
              >
                {isLoading ? "Updating..." : "Update Event"}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
