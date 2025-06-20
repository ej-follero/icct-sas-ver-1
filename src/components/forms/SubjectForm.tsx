"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { School, Book, Layers, Loader2, FileDiff, Info, RotateCcw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type SubjectFormData = {
  name: string;
  description: string;
  code: string;
  type: "lecture" | "laboratory" | "both";
  lecture_units?: number;
  laboratory_units?: number;
  units?: number;
  semester: "1st" | "2nd" | "3rd";
  year_level: "1st" | "2nd" | "3rd" | "4th";
  department: string;
  prerequisites: string[];
  instructors: string[];
  status: "active" | "inactive";
};

const schema = z.object({
  name: z.string().min(1, "Subject name is required"),
  description: z.string().min(1, "Description is required"),
  code: z.string().min(1, "Subject code is required"),
  type: z.enum(["lecture", "laboratory", "both"], { message: "Invalid subject type" }),
  lecture_units: z.number().optional(),
  laboratory_units: z.number().optional(),
  units: z.number().optional(),
  semester: z.enum(["1st", "2nd", "3rd"], { message: "Invalid semester" }),
  year_level: z.enum(["1st", "2nd", "3rd", "4th"], { message: "Invalid year level" }),
  department: z.string().min(1, "Department is required"),
  prerequisites: z.array(z.string()).default([]),
  instructors: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive"]).default("active"),
}).superRefine((data, ctx) => {
  if (data.type === "both") {
    if (data.lecture_units === undefined || data.lecture_units < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lecture_units"],
        message: "Lecture units is required and must be at least 1",
      });
    } else if (data.lecture_units > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lecture_units"],
        message: "Lecture units cannot exceed 3",
      });
    }
    if (data.laboratory_units === undefined || data.laboratory_units < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["laboratory_units"],
        message: "Laboratory units is required and must be at least 1",
      });
    } else if (data.laboratory_units > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["laboratory_units"],
        message: "Laboratory units cannot exceed 3",
      });
    }
  } else {
    if (data.units === undefined || data.units < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["units"],
        message: "Units is required and must be at least 1",
      });
    } else if (data.units > 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["units"],
        message: "Units cannot exceed 6",
      });
    }
  }
});

type Props = {
  type: "create" | "update" | "delete" | "view";
  data?: SubjectFormData;
  id?: string;
  onSuccess?: () => void;
};

// Mock data for departments - replace with actual API call later
const departments = [
  { id: "1", name: "College of Information Technology" },
  { id: "2", name: "College of Engineering" },
  { id: "3", name: "College of Education" },
];

// Mock data for instructors - replace with actual API call later
const instructors = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Alice Johnson" },
];

export default function SubjectForm({ type, data, id, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultValues: SubjectFormData = {
    name: "",
    code: "",
    description: "",
    type: "lecture",
    lecture_units: 0,
    laboratory_units: 0,
    units: 0,
    semester: "1st",
    year_level: "1st",
    department: "",
    prerequisites: [],
    instructors: [],
    status: "active",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(schema),
    defaultValues: data || defaultValues,
  });

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
        status: "inactive", // Using inactive as draft status
      };

      let response;
      if (type === "create") {
        response = await fetch("/api/subjects/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedData),
        });
      } else if (type === "update" && id) {
        response = await fetch(`/api/subjects/${id}/draft`, {
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

  // If in view mode, don't render the form submission logic
  if (type === "view") {
  return (
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Basic Information</h3>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm text-blue-900">Subject Name</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {data?.name}
              </div>
            </div>
            <div>
              <Label htmlFor="code" className="text-sm text-blue-900">Subject Code</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {data?.code}
              </div>
            </div>
            <div>
              <Label htmlFor="type" className="text-sm text-blue-900">Type</Label>
              <div className="mt-1">
                <Badge variant={data?.type === "both" ? "info" : data?.type === "lecture" ? "success" : "warning"}>
                  {data?.type ? data.type.charAt(0).toUpperCase() + data.type.slice(1) : "Unknown"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Units Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Units</h3>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="units" className="text-sm text-blue-900">Total Units</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {data?.units}
              </div>
            </div>
            {data?.type === "both" && (
              <>
                <div>
                  <Label htmlFor="lecture_units" className="text-sm text-blue-900">Lecture Units</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                    {data?.lecture_units}
                  </div>
                </div>
                <div>
                  <Label htmlFor="laboratory_units" className="text-sm text-blue-900">Laboratory Units</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                    {data?.laboratory_units}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Schedule Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Schedule</h3>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="semester" className="text-sm text-blue-900">Semester</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {data?.semester}
              </div>
            </div>
            <div>
              <Label htmlFor="year_level" className="text-sm text-blue-900">Year Level</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {data?.year_level}
              </div>
            </div>
          </div>
        </div>

        {/* Department Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Description</h3>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description" className="text-sm text-blue-900">Subject Description</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700 min-h-[100px]">
                {data?.description || "No description provided"}
              </div>
            </div>
          </div>
        </div>

        {/* Instructors Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Assigned Instructors</h3>
              <span className="text-red-500">*</span>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-2">
            {instructors.map((instructor) => (
              <div key={instructor.id} className="flex items-center gap-2">
                <Checkbox
                  id={`instructor-${instructor.id}`}
                  checked={watch("instructors")?.includes(instructor.id)}
                  onCheckedChange={(checked) => {
                    const currentInstructors = watch("instructors") || [];
                    if (checked) {
                      setValue("instructors", [...currentInstructors, instructor.id]);
                    } else {
                      setValue(
                        "instructors",
                        currentInstructors.filter((id) => id !== instructor.id)
                      );
                    }
                  }}
                />
                <Label htmlFor={`instructor-${instructor.id}`} className="text-sm text-gray-700">
                  {instructor.name}
                </Label>
              </div>
            ))}
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
                Subject Status <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value as SubjectFormData["status"])}
                required
              >
                <SelectTrigger id="status" className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
              )}
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

  const onSubmit = async (formData: SubjectFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const normalizedData = {
        ...formData,
        // Ensure department is sent as an ID
        department: parseInt(formData.department),
      };

      let response;
      if (type === "create") {
        response = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedData),
        });
      } else if (type === "update" && id) {
        response = await fetch(`/api/subjects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalizedData),
        });
      }

      if (!response?.ok) {
        const errorData = await response?.json();
        throw new Error(errorData?.error || "Failed to save subject");
      }

      toast.success(type === "create" ? "Subject created successfully" : "Subject updated successfully");
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

      if (!id) throw new Error("No subject ID provided");

      const response = await fetch(`/api/subjects/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to delete subject");
      }

      toast.success("Subject deleted successfully");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (type === "delete") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-blue-900">Delete Subject</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete this subject? This action cannot be undone.
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
              Subject Name <span className="text-red-500">*</span>
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
              Subject Code <span className="text-red-500">*</span>
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
            <Label htmlFor="type" className="text-sm text-blue-900">
              Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("type")}
              onValueChange={(value) => setValue("type", value as SubjectFormData["type"])}
              required
            >
              <SelectTrigger id="type" className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lecture">Lecture</SelectItem>
                <SelectItem value="laboratory">Laboratory</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Units Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Units</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="units" className="text-sm text-blue-900">
              Total Units <span className="text-red-500">*</span>
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
          {watch("type") === "both" && (
            <>
              <div>
                <Label htmlFor="lecture_units" className="text-sm text-blue-900">
                  Lecture Units <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lecture_units"
                  type="number"
                  min={0}
                  {...register("lecture_units", { valueAsNumber: true })}
                  className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.lecture_units ? "border-red-500" : ""}`}
                  aria-invalid={!!errors.lecture_units}
                  aria-describedby={errors.lecture_units ? "lecture_units-error" : undefined}
                />
                {errors.lecture_units && (
                  <p id="lecture_units-error" className="text-sm text-red-600 mt-1">{errors.lecture_units.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="laboratory_units" className="text-sm text-blue-900">
                  Laboratory Units <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="laboratory_units"
                  type="number"
                  min={0}
                  {...register("laboratory_units", { valueAsNumber: true })}
                  className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.laboratory_units ? "border-red-500" : ""}`}
                  aria-invalid={!!errors.laboratory_units}
                  aria-describedby={errors.laboratory_units ? "laboratory_units-error" : undefined}
                />
                {errors.laboratory_units && (
                  <p id="laboratory_units-error" className="text-sm text-red-600 mt-1">{errors.laboratory_units.message}</p>
                )}
              </div>
            </>
        )}
        </div>
      </div>

      {/* Schedule Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Schedule</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="semester" className="text-sm text-blue-900">
              Semester <span className="text-red-500">*</span>
            </Label>
                <Select
              value={watch("semester")}
              onValueChange={(value) => setValue("semester", value as SubjectFormData["semester"])}
              required
                >
              <SelectTrigger id="semester" className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Semester</SelectItem>
                    <SelectItem value="2nd">2nd Semester</SelectItem>
                    <SelectItem value="3rd">3rd Semester</SelectItem>
                  </SelectContent>
                </Select>
            {errors.semester && (
              <p className="text-sm text-red-600 mt-1">{errors.semester.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="year_level" className="text-sm text-blue-900">
              Year Level <span className="text-red-500">*</span>
            </Label>
                <Select
              value={watch("year_level")}
              onValueChange={(value) => setValue("year_level", value as SubjectFormData["year_level"])}
              required
                >
              <SelectTrigger id="year_level" className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                    <SelectItem value="4th">4th Year</SelectItem>
                  </SelectContent>
                </Select>
            {errors.year_level && (
              <p className="text-sm text-red-600 mt-1">{errors.year_level.message}</p>
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
            <Label htmlFor="description" className="text-sm text-blue-900">Subject Description</Label>
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

      {/* Instructors Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Assigned Instructors</h3>
            <span className="text-red-500">*</span>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-2">
          {instructors.map((instructor) => (
            <div key={instructor.id} className="flex items-center gap-2">
              <Checkbox
                id={`instructor-${instructor.id}`}
                checked={watch("instructors")?.includes(instructor.id)}
                onCheckedChange={(checked) => {
                  const currentInstructors = watch("instructors") || [];
                  if (checked) {
                    setValue("instructors", [...currentInstructors, instructor.id]);
                  } else {
                    setValue(
                      "instructors",
                      currentInstructors.filter((id) => id !== instructor.id)
                    );
                  }
                }}
              />
              <Label htmlFor={`instructor-${instructor.id}`} className="text-sm text-gray-700">
                {instructor.name}
              </Label>
            </div>
          ))}
          {errors.instructors && (
            <p className="text-sm text-red-600 mt-1">{errors.instructors.message}</p>
          )}
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
              Subject Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("status")}
              onValueChange={(value) => setValue("status", value as SubjectFormData["status"])}
              required
            >
              <SelectTrigger id="status" className="mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
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
      <div className="flex justify-end gap-3">
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
              ? "Update Subject"
              : "Create Subject"}
        </Button>
      </div>
    </form>
  );
}