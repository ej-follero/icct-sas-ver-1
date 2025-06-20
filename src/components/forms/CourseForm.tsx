"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  School,
  Building2,
  Info,
  FileText,
  BadgeInfo,
  RotateCcw,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "react-hot-toast";
import { DialogFooter } from "@/components/ui/dialog";

// Define the course schema
const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string()
    .min(2, "Course code must be at least 2 characters")
    .max(10, "Course code must be less than 10 characters")
    .regex(/^[A-Z0-9]+$/, "Course code must contain only uppercase letters and numbers"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  units: z.coerce.number()
    .min(1, "Units must be at least 1")
    .max(999, "Units cannot exceed 999"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "PENDING_REVIEW", "DRAFT"]),
  courseType: z.enum(["MANDATORY", "ELECTIVE"]).default("MANDATORY"),
});

type Course = z.infer<typeof courseSchema>;

interface CourseFormProps {
  type: "create" | "update" | "delete" | "view";
  data?: Course;
  id?: string;
  onSuccess?: () => void;
}

// Mock data for departments - replace with actual API call later
const departments = [
  { id: "1", name: "College of Information Technology" },
  { id: "2", name: "College of Engineering" },
  { id: "3", name: "College of Education" },
];

const defaultValues: Course = {
  name: "",
  code: "",
  department: "",
  description: "",
  units: 0,
  status: "ACTIVE",
  courseType: "MANDATORY",
};

export default function CourseForm({ type, data, id, onSuccess }: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<Course>({
    resolver: zodResolver(courseSchema),
    defaultValues: data || defaultValues,
  });

  // If in view mode, don't render the form submission logic
  if (type === "view") {
    return (
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Basic Information</h3>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm text-blue-900">Course Name</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {data?.name}
              </div>
            </div>
            <div>
              <Label htmlFor="code" className="text-sm text-blue-900">Course Code</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {data?.code}
              </div>
            </div>
            <div>
              <Label htmlFor="units" className="text-sm text-blue-900">Units</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {data?.units}
              </div>
            </div>
          </div>
        </div>

        {/* Department Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Department</h3>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="department" className="text-sm text-blue-900">Department</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {data?.department}
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Description</h3>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description" className="text-sm text-blue-900">Course Description</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700 min-h-[100px]">
                {data?.description || "No description provided"}
              </div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Status</h3>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status" className="text-sm text-blue-900">Course Status</Label>
              <div className="mt-1">
                <Badge variant={data?.status === "ACTIVE" ? "success" : "destructive"}>
                  {data?.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : "Unknown"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-blue-100">
          <Button
            variant="outline"
            onClick={() => onSuccess?.()}
            className="w-32 border border-blue-300 text-blue-500"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (formData: Course) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // No need to transform status case since we're using the correct case in the form
      const normalizedData = {
        ...formData,
        // Ensure department is sent as an ID
        department: parseInt(formData.department),
      };

      let response;
      if (type === "create") {
        response = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedData),
        });
      } else if (type === "update" && id) {
        response = await fetch(`/api/courses/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedData),
        });
      }

      if (!response?.ok) {
        const errorData = await response?.json();
        throw new Error(errorData?.error || "Failed to save course");
      }

      toast.success(type === "create" ? "Course created successfully" : "Course updated successfully");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!id) throw new Error("No course ID provided");

      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to delete course");
      }

      toast.success("Course deleted successfully");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset(data || defaultValues);
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      setError(null);

      const formData = watch();
      const normalizedData = {
        ...formData,
        department: parseInt(formData.department),
        status: "DRAFT",
      };

      let response;
      if (type === "create") {
        response = await fetch("/api/courses/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedData),
        });
      } else if (type === "update" && id) {
        response = await fetch(`/api/courses/${id}/draft`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedData),
        });
      }

      if (!response?.ok) {
        const errorData = await response?.json();
        throw new Error(errorData?.error || "Failed to save draft");
      }

      toast.success("Draft saved successfully");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  if (type === "delete") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-blue-900">Delete Course</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete this course? This action cannot be undone.
          </p>
        </div>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            disabled={isSubmitting}
            className="w-32 border border-blue-300 text-blue-500"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="w-32"
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Info: All fields required */}
      <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm">
        <Info className="h-5 w-5" />
        <span>All fields marked with <span className="font-bold">*</span> are required</span>
      </div>
      {/* Basic Information Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Basic Information</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm text-blue-900">
              Course Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.name ? "border-red-500" : ""}`}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="code" className="text-sm text-blue-900">
              Course Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              {...register("code")}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.code ? "border-red-500" : ""}`}
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? "code-error" : undefined}
            />
            {errors.code && (
              <p id="code-error" className="text-sm text-red-600 mt-1">{errors.code.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="units" className="text-sm text-blue-900">
              Units <span className="text-red-500">*</span>
            </Label>
            <Input
              id="units"
              type="number"
              min={1}
              {...register("units", { valueAsNumber: true })}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.units ? "border-red-500" : ""}`}
              aria-invalid={!!errors.units}
              aria-describedby={errors.units ? "units-error" : undefined}
            />
            {errors.units && (
              <p id="units-error" className="text-sm text-red-600 mt-1">{errors.units.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Department Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Department</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="department" className="text-sm text-blue-900">
              Department <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("department")}
              onValueChange={(value) => setValue("department", value)}
              required
            >
              <SelectTrigger id="department" className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="text-sm text-red-600 mt-1">{errors.department.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Description</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description" className="text-sm text-blue-900">Course Description</Label>
            <Textarea
              id="description"
              rows={4}
              {...register("description")}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.description ? "border-red-500" : ""}`}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {errors.description && (
              <p id="description-error" className="text-sm text-red-600 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Status</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="status" className="text-sm text-blue-900">
              Course Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("status")}
              onValueChange={(value) => setValue("status", value as Course["status"])}
              required
            >
              <SelectTrigger id="status" className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Course Type Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Course Type</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="courseType" className="text-sm text-blue-900">
              Course Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("courseType")}
              onValueChange={(value) => setValue("courseType", value as Course["courseType"])}
              required
            >
              <SelectTrigger id="courseType" className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select course type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANDATORY">Mandatory</SelectItem>
                <SelectItem value="ELECTIVE">Elective</SelectItem>
              </SelectContent>
            </Select>
            {errors.courseType && (
              <p className="text-sm text-red-600 mt-1">{errors.courseType.message}</p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <DialogFooter className="flex items-center justify-end pt-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={handleReset}
            disabled={isSubmitting || !isDirty}
            className="w-32 border border-blue-300 text-blue-500"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isSavingDraft || !isDirty}
            className="w-32 border border-blue-300 text-blue-500"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isSavingDraft}
            className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting
              ? type === "update"
                ? "Saving..."
                : "Saving..."
              : type === "update"
                ? "Update Course"
                : "Create Course"}
          </Button>
        </div>
      </DialogFooter>
    </form>
  );
}