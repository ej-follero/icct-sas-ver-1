"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { School, Book, Layers, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { subjectsApi } from '@/services/api/subjects';
import { departmentsApi } from '@/services/api/departments';
import { Subject } from '@/types/subject';
import { MultiSearchableSelectSearch } from '@/components/reusable/Search/SearchableSelect';

// Type for API request data
type SubjectApiData = {
  subjectName: string;
  subjectCode: string;
  subjectType: 'LECTURE' | 'LABORATORY' | 'HYBRID';
  status: 'ACTIVE' | 'INACTIVE';
  description: string;
  lectureUnits: number;
  labUnits: number;
  creditedUnits: number;
  totalHours: number;
  prerequisites: string;
  courseId: number;
  departmentId: number;
  academicYear: string;
  semester: 'FIRST_SEMESTER' | 'SECOND_SEMESTER' | 'THIRD_SEMESTER';
  maxStudents: number;
};

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

// Transformation function to convert Subject to SubjectFormData
const transformSubjectToFormData = (subject: any): SubjectFormData => {
  if (!subject) return {
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

  // Convert subject type
  let type: "lecture" | "laboratory" | "both" = "lecture";
  if (subject.subjectType === 'HYBRID') {
    type = "both";
  } else if (subject.subjectType === 'LABORATORY') {
    type = "laboratory";
  } else {
    type = "lecture";
  }

  // Convert semester
  let semester: "1st" | "2nd" | "3rd" = "1st";
  if (subject.semester === 'SECOND_SEMESTER') {
    semester = "2nd";
  } else if (subject.semester === 'THIRD_SEMESTER') {
    semester = "3rd";
  }

  // Convert status
  const status: "active" | "inactive" = subject.status === 'ACTIVE' ? "active" : "inactive";

  // Convert prerequisites string to array
  const prerequisites = subject.prerequisites ? subject.prerequisites.split(',').map((p: string) => p.trim()).filter(Boolean) : [];

  // Convert instructors to array of strings
  const instructors = subject.instructors ? subject.instructors.map((i: any) => `${i.firstName} ${i.lastName}`) : [];

  return {
    name: subject.subjectName || "",
    code: subject.subjectCode || "",
    description: subject.description || "",
    type,
    lecture_units: subject.lectureUnits || 0,
    laboratory_units: subject.labUnits || 0,
    units: subject.creditedUnits || 0,
    semester,
    year_level: "1st", // Default value as it's not in the Subject type
    department: subject.department?.departmentName || subject.departmentId?.toString() || "",
    prerequisites,
    instructors,
    status,
  };
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
  data?: Subject | SubjectFormData;
  id?: string;
  onSuccess?: () => void;
  showSubmitButton?: boolean;
  onFormDataChange?: (data: any) => void;
};

export default function SubjectForm({ type, data, id, onSuccess, showSubmitButton = true, onFormDataChange }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [instructors, setInstructors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

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
    getValues,
    formState: { errors, isDirty },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(schema),
    defaultValues: transformSubjectToFormData(data) || defaultValues,
  });

  // Watch form changes and notify parent
  useEffect(() => {
    if (onFormDataChange) {
      const subscription = watch((data) => {
        onFormDataChange(data);
      });
      return () => subscription.unsubscribe();
    }
  }, [onFormDataChange]);


  // Reset form when data changes (for edit mode)
  useEffect(() => {
    if (data) {
      const transformedData = transformSubjectToFormData(data);
      reset(transformedData);
    }
  }, [data, reset]);

  // Fetch departments and instructors on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch departments and instructors in parallel
        const [departmentsResponse, instructorsResponse] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/instructors')
        ]);

        // Handle departments response
        if (!departmentsResponse.ok) {
          console.error('Departments API error:', departmentsResponse.status, departmentsResponse.statusText);
          throw new Error(`Failed to fetch departments: ${departmentsResponse.status} ${departmentsResponse.statusText}`);
        }
        const departmentsData = await departmentsResponse.json();
        
        if (departmentsData.error) {
          throw new Error(departmentsData.error);
        }

        // Handle instructors response
        if (!instructorsResponse.ok) {
          console.error('Instructors API error:', instructorsResponse.status, instructorsResponse.statusText);
          throw new Error(`Failed to fetch instructors: ${instructorsResponse.status} ${instructorsResponse.statusText}`);
        }
        const instructorsData = await instructorsResponse.json();

        // Transform departments data to match expected format
        const formattedDepartments = (departmentsData.data || []).map((dept: any) => ({ 
          id: dept.id, 
          name: dept.name, 
          code: dept.code 
        }));

        setDepartments(formattedDepartments);
        setInstructors(instructorsData);
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load form data');
        
        // Set empty arrays as fallback
        setDepartments([]);
        setInstructors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const onSubmit = async (formData: SubjectFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Transform form data to match the API schema
      const subjectData = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        units: formData.units || 0,
        lecture_units: formData.type === 'both' ? (formData.lecture_units || 0) : (formData.units || 0),
        laboratory_units: formData.type === 'both' ? (formData.laboratory_units || 0) : 0,
        semester: formData.semester,
        year_level: formData.year_level,
        department: formData.department,
        description: formData.description,
        instructors: formData.instructors,
        courseId: 1, // Default course ID - should be selected from form
        academicYear: "2024-2025", // Should be selected from form
        maxStudents: 30, // Default value
      };

      if (type === "create") {
        await subjectsApi.createSubject(subjectData);
        toast.success("Subject created successfully");
      } else if (type === "update" && id) {
        await subjectsApi.updateSubject(id, subjectData);
        toast.success("Subject updated successfully");
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      setError(error.message || "Failed to save subject");
      toast.error(error.message || "Failed to save subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If in view mode, don't render the form submission logic
  if (type === "view") {
    const viewData = transformSubjectToFormData(data);
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
                {viewData.name}
              </div>
            </div>
            <div>
              <Label htmlFor="code" className="text-sm text-blue-900">Subject Code</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {viewData.code}
              </div>
            </div>
            <div>
              <Label htmlFor="type" className="text-sm text-blue-900">Type</Label>
              <div className="mt-1">
                <Badge variant={viewData.type === "both" ? "info" : viewData.type === "lecture" ? "success" : "warning"}>
                  {viewData.type ? viewData.type.charAt(0).toUpperCase() + viewData.type.slice(1) : "Unknown"}
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
                {viewData.units}
              </div>
            </div>
            {viewData.type === "both" && (
              <>
                <div>
                  <Label htmlFor="lecture_units" className="text-sm text-blue-900">Lecture Units</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                    {viewData.lecture_units}
                  </div>
                </div>
                <div>
                  <Label htmlFor="laboratory_units" className="text-sm text-blue-900">Laboratory Units</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                    {viewData.laboratory_units}
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
                {viewData.semester}
              </div>
            </div>
            <div>
              <Label htmlFor="year_level" className="text-sm text-blue-900">Year Level</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
                {viewData.year_level}
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
                {departments.find(d => d.id === viewData.department)?.name || viewData.department}
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
                {viewData.description || "No description provided"}
              </div>
            </div>
          </div>
        </div>

        {/* Instructors Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-md font-semibold text-blue-900">Assigned Instructors</h3>
            </div>
          </div>
          <div className="h-px bg-blue-100 w-full mb-4"></div>
          <div className="space-y-2">
            <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-700">
              {viewData.instructors && viewData.instructors.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {viewData.instructors.map((instructorName, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {instructorName}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500">No instructors assigned</span>
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

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!id) throw new Error("No subject ID provided");

      await subjectsApi.deleteSubject(id);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading form data...</span>
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
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-departments" disabled>
                    No departments available
                  </SelectItem>
                )}
                </SelectContent>
              </Select>
            {errors.department && (
              <p className="text-sm text-red-600 mt-1">{errors.department.message}</p>
            )}
            {departments.length === 0 && (
              <p className="text-sm text-yellow-600 mt-1">
                No departments found. Please create departments first.
              </p>
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
            </div>
          </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-2">
          {instructors.length > 0 ? (
            <MultiSearchableSelectSearch
              options={instructors.map(instructor => ({
                value: instructor.id,
                label: instructor.name
              }))}
              value={watch("instructors") || []}
              onChange={(selectedIds) => setValue("instructors", selectedIds)}
              placeholder="Search and select instructors..."
              className="w-full"
              maxDisplayItems={2}
              noOptionsMessage="No instructors found"
              noMoreOptionsMessage="No more instructors found"
              startTypingMessage="Start typing to search instructors"
            />
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
              No instructors available. Please create instructors first.
            </div>
          )}
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

      {/* Submit Button - Only show if showSubmitButton is true */}
      {showSubmitButton && (
        <div className="flex justify-end pt-4 border-t border-blue-100">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {type === "create" ? "Creating..." : "Updating..."}
              </>
            ) : (
              type === "create" ? "Create Subject" : "Update Subject"
            )}
          </Button>
        </div>
      )}
    </form>
  );
}