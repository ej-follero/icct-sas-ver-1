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

// Define the course schema
const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  units: z.coerce.number().min(1, "Units must be at least 1"),
  status: z.enum(["active", "inactive"]),
});

type Course = z.infer<typeof courseSchema>;

interface CourseFormProps {
  type: "create" | "update" | "delete";
  data?: Course;
  id?: string;
}

// Mock data for departments - replace with actual API call later
const departments = [
  { id: "1", name: "College of Information Technology" },
  { id: "2", name: "College of Engineering" },
  { id: "3", name: "College of Education" },
];

export default function CourseForm({ type, data, id }: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Course>({
    resolver: zodResolver(courseSchema),
    defaultValues: data || {
      name: "",
      code: "",
      department: "",
      description: "",
      units: 0,
      status: "active",
    },
  });

  const onSubmit = async (formData: Course) => {
    try {
      setIsSubmitting(true);
      setError(null);
      // TODO: Replace with actual API call
      console.log("Form submitted:", formData);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      // TODO: Replace with actual API call
      console.log("Deleting course:", id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (type === "delete") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Delete Course</h3>
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
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Form Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          {type === "update" ? "Update Course" : "Create New Course"}
        </h1>
        <p className="text-sm text-gray-500">
          Fill in the details below to {type === "update" ? "update" : "add"} a course to the system
        </p>
      </div>

      {/* Basic Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <School className="text-blue-600 w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Course Name</Label>
            <Input
              id="name"
              {...register("name")}
              className={errors.name && "border-red-500"}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="code">Course Code</Label>
            <Input
              id="code"
              {...register("code")}
              className={errors.code && "border-red-500"}
              aria-invalid={!!errors.code}
              aria-describedby={errors.code ? "code-error" : undefined}
            />
            {errors.code && (
              <p id="code-error" className="text-sm text-red-600 mt-1">{errors.code.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="units">Units</Label>
            <Input
              id="units"
              type="number"
              min={1}
              {...register("units", { valueAsNumber: true })}
              className={errors.units && "border-red-500"}
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-green-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <Building2 className="text-green-600 w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-900">Department</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="department">Department</Label>
            <Select
              value={watch("department")}
              onValueChange={(value) => setValue("department", value)}
              required
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <FileText className="text-purple-600 w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="description">Course Description</Label>
            <Textarea
              id="description"
              rows={4}
              {...register("description")}
              className={errors.description && "border-red-500"}
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-orange-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <Info className="text-orange-600 w-5 h-5" />
            <h2 className="text-lg font-semibold text-gray-900">Status</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="status">Course Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(value) => setValue("status", value as "active" | "inactive")}
              required
            >
              <SelectTrigger id="status">
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
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Info className="w-4 h-4" />
          <span>All fields marked with * are required</span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => window.location.reload()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
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
      </div>
    </form>
  );
}