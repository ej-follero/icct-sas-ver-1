"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, User, List, X } from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  totalStudents: number;
  totalSections: number;
}

interface Instructor {
  id: string;
  name: string;
}

const departmentFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Department name is required"),
  code: z.string().min(1, "Department code is required"),
  headOfDepartment: z.string().min(1, "Head of Department is required"),
  description: z.string().optional(),
  courseOfferings: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Course name is required"),
    code: z.string().min(1, "Course code is required"),
    description: z.string().optional(),
    status: z.enum(["active", "inactive"]),
    totalStudents: z.number(),
    totalSections: z.number(),
  })),
  status: z.enum(["active", "inactive"]),
  totalInstructors: z.number().optional(),
});

type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id: string;
    name: string;
    code: string;
    headOfDepartment: string;
    description?: string;
    courseOfferings: Course[];
    status: "active" | "inactive";
    totalInstructors?: number;
  };
  instructors: Instructor[];
  onSuccess: () => void;
}

export function DepartmentForm({
  open,
  onOpenChange,
  initialData,
  instructors,
  onSuccess,
}: DepartmentFormModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const isEdit = !!initialData;
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [codeExists, setCodeExists] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      headOfDepartment: initialData?.headOfDepartment || "",
      description: initialData?.description || "",
      courseOfferings: initialData?.courseOfferings || [],
      status: initialData?.status || "active",
      totalInstructors: initialData?.totalInstructors || 0,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        code: initialData.code,
        headOfDepartment: initialData.headOfDepartment,
        description: initialData.description,
        courseOfferings: initialData.courseOfferings,
        status: initialData.status,
        totalInstructors: initialData.totalInstructors,
      });
    } else {
      form.reset({
        name: "",
        code: "",
        headOfDepartment: "",
        description: "",
        courseOfferings: [],
        status: "active",
        totalInstructors: 0,
      });
    }
  }, [initialData, form]);

  useEffect(() => {
    if (open) {
      const fetchCourses = async () => {
        try {
          setLoading(true);
          const response = await fetch("/api/courses");
          if (!response.ok) {
            throw new Error("Failed to fetch courses");
          }
          const data = await response.json();
          setCourses(data);
        } catch (error) {
          console.error("Error fetching courses:", error);
          toast.error("Failed to fetch courses");
        } finally {
          setLoading(false);
        }
      };
      fetchCourses();
    }
  }, [open]);

  useEffect(() => {
    if (open && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [open]);

  // Async validation for department code
  const checkCodeExists = async (code: string) => {
    if (!code) return false;
    setCheckingCode(true);
    try {
      const res = await fetch(`/api/departments?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      setCodeExists(data && data.length > 0);
      return data && data.length > 0;
    } catch {
      setCodeExists(false);
      return false;
    } finally {
      setCheckingCode(false);
    }
  };

  useEffect(() => {
    if (!isEdit) {
      const sub = form.watch((value, { name }) => {
        if (name === "code") {
          checkCodeExists(value.code || "");
        }
      });
      return () => sub.unsubscribe();
    }
  }, [form, isEdit]);

  // Save as Draft
  const handleSaveDraft = () => {
    const values = form.getValues();
    localStorage.setItem("departmentFormDraft", JSON.stringify(values));
    setDraftSaved(true);
    toast.success("Draft saved!");
  };

  // Restore draft if present
  useEffect(() => {
    if (open && !isEdit) {
      const draft = localStorage.getItem("departmentFormDraft");
      if (draft) {
        form.reset(JSON.parse(draft));
      }
    }
  }, [open, isEdit, form]);

  // Cancel with confirmation if dirty
  const handleCancel = () => {
    if (form.formState.isDirty) {
      setShowCancelConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    onOpenChange(false);
    form.reset();
  };

  // Helper to check if there are any errors
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  async function onSubmit(data: DepartmentFormValues) {
    setShowErrorSummary(false);
    try {
      const url = isEdit && initialData?.id ? `/api/departments/${initialData.id}` : "/api/departments";
      const method = isEdit ? "PUT" : "POST";
      const submitData = {
        ...data,
        courseOfferings: data.courseOfferings.map((course) => ({
          id: course.id,
          name: course.name,
          code: course.code,
          description: course.description,
          status: course.status,
          totalStudents: course.totalStudents,
          totalSections: course.totalSections,
        })),
      };
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (!response.ok) throw new Error("Failed to save department");
      toast.success(isEdit ? "Department updated successfully" : "Department created successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      setShowErrorSummary(true);
      toast.error("Something went wrong");
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <Info className="text-blue-600" size={22} />
                  {isEdit ? "Edit Department" : "Add New Department"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEdit
                    ? "Update department information and settings"
                    : "Create a new department with its details"}
                </p>
              </div>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-red-600">
                  <X size={20} />
                </Button>
              </DialogClose>
            </div>

            {/* Error Summary */}
            {showErrorSummary && hasErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-red-700 mb-2">Please fix the following errors:</h3>
                <ul className="list-disc pl-5 text-red-600 text-sm">
                  {Object.entries(form.formState.errors).map(([field, error]) => (
                    <li key={field}>{(error as any).message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Basic Info Section */}
            <div className="bg-white rounded-lg border p-4 mb-4">
              <h4 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <Info className="text-blue-600" size={18} /> Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name *</FormLabel>
                      <FormControl field={field}>
                        <Input
                          ref={nameInputRef}
                          placeholder="e.g. Computer Science"
                          aria-label="Department Name"
                        />
                      </FormControl>
                      <FormMessage> </FormMessage>    
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Code *</FormLabel>
                      <FormControl field={field}>
                        <Input
                          placeholder="e.g. CS"
                          aria-label="Department Code"
                          disabled={isEdit}
                        />
                      </FormControl>
                      {checkingCode && !isEdit && (
                        <span className="text-xs text-blue-600 ml-2">Checking...</span>
                      )}
                      {codeExists && !isEdit && (
                        <span className="text-xs text-red-600 ml-2">Department code already exists.</span>
                      )}
                    <FormMessage> </FormMessage>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl field={field}>
                      <Textarea
                        placeholder="Brief description of the department (optional)"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage> </FormMessage>  
                  </FormItem>
                )}
              />
            </div>

            {/* Head of Department Section */}
            <div className="bg-white rounded-lg border p-4 mb-4">
              <h4 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <User className="text-green-600" size={18} /> Department Head
              </h4>
              <FormField
                control={form.control}
                name="headOfDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head of Department *</FormLabel>
                    <FormControl field={field}>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select head of department" />
                        </SelectTrigger>
                        <SelectContent>
                          {instructors.map((instructor) => (
                            <SelectItem key={instructor.id} value={instructor.name}>
                              {instructor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage> </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            {/* Course Offerings Section */}
            <div className="bg-white rounded-lg border p-4 mb-4">
              <h4 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <List className="text-purple-600" size={18} /> Course Offerings
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                Select courses to be offered by this department
              </p>
              {loading ? (
                <div className="flex justify-center items-center py-4">
                  <span className="text-blue-600 animate-spin">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                  </span>
                </div>
              ) : courses.length === 0 ? (
                <div className="flex flex-col items-start gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">No available courses. <b>Please add courses first.</b></span>
                  <Button asChild variant="link" className="p-0 h-auto text-blue-600">
                    <a href="/dashboard/courses" target="_blank" rel="noopener">Add Courses</a>
                  </Button>
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="courseOfferings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Add Course</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const course = courses.find((c) => c.id === value);
                            if (course && !field.value.some((c: Course) => c.id === course.id)) {
                              field.onChange([...field.value, course]);
                            }
                          }}
                          value=""
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Search courses..." />
                          </SelectTrigger>
                          <SelectContent>
                            {courses
                              .filter((course) => !(field.value || []).some((c: Course) => c.id === course.id))
                              .map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name} ({course.code})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(field.value || []).map((course: Course) => (
                            <Badge
                              key={course.id}
                              className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full"
                            >
                              {course.name} ({course.code})
                              <button
                                type="button"
                                className="ml-1 text-purple-500 hover:text-red-600"
                                onClick={() => {
                                  field.onChange(
                                    (field.value || []).filter((c: Course) => c.id !== course.id)
                                  );
                                }}
                              >
                                <X size={14} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        {(field.value || []).length === 0 && courses.length > 0 && (
                          <span className="text-xs text-muted-foreground mt-1 block">
                            No courses selected. Use the search above to add courses.
                          </span>
                        )}
                        <FormMessage> </FormMessage>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            {/* Status Section */}
            <div className="bg-white rounded-lg border p-4 mb-4">
              <h4 className="font-semibold text-lg flex items-center gap-2 mb-2">
                <List className="text-yellow-600" size={18} /> Status
              </h4>
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <FormControl field={field}>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage> </FormMessage>  
                  </FormItem>
                )}
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="min-w-[120px]"
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                {!isEdit && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleSaveDraft}
                    className="min-w-[140px]"
                  >
                    Save as Draft
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="default"
                  className="min-w-[180px] flex items-center gap-2"
                  disabled={form.formState.isSubmitting || loading}
                >
                  <List size={18} />
                  {isEdit ? "Update" : "Add"} Department
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}