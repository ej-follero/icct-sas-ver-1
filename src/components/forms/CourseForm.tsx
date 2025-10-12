"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { School, Info, RotateCcw, Save, X, BookOpen, FileText, BadgeInfo, Building2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter as DialogFooterUI,
  DialogClose,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import RichTextEditor from "@/components/RichTextEditor";

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
  major: z.string().optional(),
});

type Course = z.infer<typeof courseSchema>;

interface CourseFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update" | "delete" | "view";
  data?: Course;
  id?: string;
  onSuccess?: () => void;
}

// Department interface
interface Department {
  id: string;
  name: string;
  code: string;
}

const defaultValues: Course = {
  name: "",
  code: "",
  department: "",
  description: "",
  units: 0,
  status: "ACTIVE",
  courseType: "MANDATORY",
};

export default function CourseForm({ open, onOpenChange, type, data, id, onSuccess }: CourseFormProps) {
  // Remove dialogOpen state, use open/onOpenChange props
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Department state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);

  // Dialog-based notification state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Draft restoration state
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false);
  const [draftExists, setDraftExists] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
    control,
  } = useForm<Course>({
    resolver: zodResolver(courseSchema),
    defaultValues: data || defaultValues,
  });

  // Reset form when data changes (for edit mode)
  useEffect(() => {
    if (data && type === "update") {
      console.log("Resetting form with data:", data);
      reset(data);
    }
  }, [data, type, reset]);

  // On mount, check for draft
  useEffect(() => {
    if (type === 'create') {
      const savedDraft = localStorage.getItem('courseFormDraft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setDraftExists(true);
          setDraftTimestamp(draftData.savedAt || null);
          setShowDraftRestoreDialog(true);
        } catch {}
      }
    }
  }, [type]);

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      setDepartmentsError(null);
      try {
        const response = await fetch('/api/departments');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          setDepartments(data.data);
        } else if (Array.isArray(data)) {
          setDepartments(data);
        } else {
          throw new Error('Invalid data format received from server');
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
        setDepartmentsError('Failed to load departments. Please try again later.');
        toast.error('Failed to load departments. Please try again later.');
      } finally {
        setDepartmentsLoading(false);
      }
    };

    if (open) {
      fetchDepartments();
    }
  }, [open]);

  // Restore draft handler
  const handleRestoreDraft = () => {
    const savedDraft = localStorage.getItem('courseFormDraft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        reset({
          ...draftData,
        });
        setShowDraftRestoreDialog(false);
      } catch {}
    }
  };

  // Discard draft handler
  const handleDiscardDraft = () => {
    localStorage.removeItem('courseFormDraft');
    setShowDraftRestoreDialog(false);
    setDraftExists(false);
    setDraftTimestamp(null);
  };

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
    console.log("onSubmit called with formData:", formData);
    console.log("Form type:", type);
    console.log("Form ID:", id);
    
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate required fields
      if (!formData.name || !formData.code || !formData.department || !formData.units) {
        console.log("Validation failed - missing required fields:", {
          name: formData.name,
          code: formData.code,
          department: formData.department,
          units: formData.units
        });
        setErrorMessage("Please fill in all required fields");
        setShowErrorDialog(true);
        return;
      }

      // Validate department is a valid number
      const departmentId = parseInt(formData.department);
      if (isNaN(departmentId)) {
        setErrorMessage("Please select a valid department");
        setShowErrorDialog(true);
        return;
      }

      // Prepare data for API
      const normalizedData = {
        name: formData.name,
        code: formData.code,
        department: departmentId,
        description: formData.description || "",
        units: formData.units,
        status: formData.status,
        courseType: formData.courseType,
        major: formData.major || "",
      };

      console.log("Submitting course data:", normalizedData);

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
      } else {
        setErrorMessage("Invalid form type or missing course ID");
        setShowErrorDialog(true);
        return;
      }

      if (!response) {
        setErrorMessage("No response received from server");
        setShowErrorDialog(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        setErrorMessage(errorData?.error || `Failed to save course (${response.status})`);
        setShowErrorDialog(true);
        return;
      }

      const result = await response.json();
      console.log("Course saved successfully:", result);

      setSuccessMessage(type === "create" ? "Course created successfully" : "Course updated successfully");
      setShowSuccessDialog(true);
      // onSuccess will be called after dialog closes
    } catch (err: any) {
      console.error("Form submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred");
      setShowErrorDialog(true);
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
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-32 border border-blue-300 text-blue-500 rounded"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="w-32 rounded"
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    );
  }

  // Progress calculation: count required fields filled
  const requiredFields = [
    watch("name"),
    watch("code"),
    watch("department"),
    watch("units"),
    watch("status"),
    watch("courseType"),
  ];
  const filledCount = requiredFields.filter(
    (val) => val !== undefined && val !== null && val !== "" && !(typeof val === "number" && isNaN(val))
  ).length;
  const progress = Math.round((filledCount / requiredFields.length) * 100);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft && isDirty) {
          handleSaveDraft();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft) {
          handleReset();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft) {
          handleSubmit(onSubmit)();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isSubmitting, isSavingDraft, isDirty, handleSaveDraft, handleReset, handleSubmit, onSubmit]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full bg-white/95 rounded-2xl p-0 border border-blue-100 shadow-2xl transition-all duration-300">
        <DialogHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <DialogTitle asChild>
            <div className="flex items-start gap-4 pr-24">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-xl font-bold text-white mb-1 block">
                  {type === "create" ? "Create New Course" : type === "update" ? "Edit Course" : type === "view" ? "View Course" : "Delete Course"}
                </span>
                <span className="text-blue-100 text-sm block">
                  {type === "create"
                    ? "Add a new course to the system"
                    : type === "update"
                    ? "Update course information"
                    : type === "view"
                    ? "View course details"
                    : "Delete this course"}
                </span>
              </div>
            </div>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-green-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </DialogHeader>
        {/* The rest of the form will go here in the next step */}
        <div className="max-h-[70vh] overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <form onSubmit={handleSubmit(onSubmit)}>
{/* Info Bar */}
<div className="flex items-center gap-2 p-3 mb-4 bg-blue-50 border border-blue-100 rounded shadow-sm">
  <Info className="h-5 w-5 text-blue-600" />
  <span className="text-blue-800 text-sm">
    All fields marked with <span className="font-bold">*</span> are required
  </span>
</div>
<div className="p-0 space-y-6">
  {/* Basic Information Section */}
  <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-2">
      <BookOpen className="w-5 h-5 text-blue-500" />
      <h3 className="text-md font-semibold text-blue-900">Basic Information</h3>
    </div>
    <div className="h-px bg-blue-100 w-full mb-4"></div>
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course Name <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input {...field} className="focus:ring-blue-300 focus:border-blue-300" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course Code <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input {...field} className="focus:ring-blue-300 focus:border-blue-300" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="units"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Units <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Input type="number" min={1} {...field} className="focus:ring-blue-300 focus:border-blue-300" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="major"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Major (optional)</FormLabel>
            <FormControl>
              <Input {...field} className="focus:ring-blue-300 focus:border-blue-300" placeholder="Enter major (if applicable)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
  {/* Department Section */}
  <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-2">
      <Building2 className="w-5 h-5 text-blue-500" />
      <h3 className="text-md font-semibold text-blue-900">Department</h3>
    </div>
    <div className="h-px bg-blue-100 w-full mb-4"></div>
    <div className="space-y-4">
      <FormField
        control={control}
        name="department"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              {departmentsLoading ? (
                <div className="flex items-center gap-2 text-blue-600 p-2 border border-gray-300 rounded-md">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Loading departments...
                </div>
              ) : departmentsError ? (
                <div className="text-red-600 text-sm p-2 border border-red-300 rounded-md">
                  {departmentsError}
                </div>
              ) : departments.length > 0 ? (
                <Select value={field.value} onValueChange={field.onChange} required>
                  <SelectTrigger id="department" className="focus:ring-blue-300 focus:border-blue-300">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-gray-500 text-sm p-2 border border-gray-300 rounded-md">
                  No departments available
                </div>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
  {/* Description Section */}
  <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-2">
      <FileText className="w-5 h-5 text-blue-500" />
      <h3 className="text-md font-semibold text-blue-900">Description</h3>
    </div>
    <div className="h-px bg-blue-100 w-full mb-4"></div>
    <div className="space-y-4">
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course Description</FormLabel>
            <FormControl>
              <RichTextEditor {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
  {/* Status Section */}
  <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-2">
      <BadgeInfo className="w-5 h-5 text-blue-500" />
      <h3 className="text-md font-semibold text-blue-900">Status</h3>
    </div>
    <div className="h-px bg-blue-100 w-full mb-4"></div>
    <div className="space-y-4">
      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course Status <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange} required>
                <SelectTrigger id="status" className="focus:ring-blue-300 focus:border-blue-300">
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
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
  {/* Course Type Section */}
  <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
    <div className="flex items-center gap-2 mb-2">
      <BadgeInfo className="w-5 h-5 text-blue-500" />
      <h3 className="text-md font-semibold text-blue-900">Course Type</h3>
    </div>
    <div className="h-px bg-blue-100 w-full mb-4"></div>
    <div className="space-y-4">
      <FormField
        control={control}
        name="courseType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course Type <span className="text-red-500">*</span></FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange} required>
                <SelectTrigger id="courseType" className="focus:ring-blue-300 focus:border-blue-300">
                  <SelectValue placeholder="Select course type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANDATORY">Mandatory</SelectItem>
                  <SelectItem value="ELECTIVE">Elective</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>
</div>
          </form>
        </div>
        <DialogFooter className="flex items-center justify-end pt-4 border-t border-blue-100 bg-blue-50/50 px-6 py-4 mt-2 rounded-b-2xl">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset form to {data ? 'original values' : 'empty state'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || isSavingDraft || !isDirty}
                  className={`w-32 border border-blue-300 text-blue-500 ${isSavingDraft ? 'opacity-70' : ''}`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSavingDraft ? 'Saving...' : 'Save Draft'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Save current progress as draft (Ctrl+S)</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting || isSavingDraft}
                  className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting
                    ? (type === "update" ? "Saving..." : "Saving...")
                    : (type === "update" ? "Update Course" : "Create Course")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{type === "update" ? "Update course (Ctrl+Enter)" : "Create course (Ctrl+Enter)"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
      {/* Success and Error Dialogs */}
      {showSuccessDialog && (
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="max-w-md rounded">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Save className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-green-900">
                    Success
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700 mb-4">{successMessage}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => { setShowSuccessDialog(false); onSuccess?.(); }} className="bg-green-600 hover:bg-green-700 text-white rounded">OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {showErrorDialog && (
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent className="max-w-md rounded">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-red-900">
                    Error
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700 mb-4">{errorMessage}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowErrorDialog(false)} className="bg-red-600 hover:bg-red-700 text-white rounded">OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Draft Restore Dialog */}
      {showDraftRestoreDialog && (
        <Dialog open={showDraftRestoreDialog} onOpenChange={setShowDraftRestoreDialog}>
          <DialogContent className="max-w-md rounded">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-yellow-900">
                    Restore Draft?
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700 mb-4">
                A saved draft was found from your previous session. Would you like to restore it?
              </p>
              {draftTimestamp && (
                <p className="text-xs text-yellow-700 mt-1">
                  Draft saved: {new Date(draftTimestamp).toLocaleString()}
                </p>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDiscardDraft}
                className="flex-1 rounded border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                Discard Draft
              </Button>
              <Button
                onClick={handleRestoreDraft}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
              >
                Restore Draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}