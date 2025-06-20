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
import { Info, User, List, X, Building2, AlertCircle, Loader2, FileText, ToggleLeft, BadgeInfo, Pencil, Plus, Save, Clock, Image as ImageIcon, Search, Filter, Check, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import RichTextEditor from "@/components/RichTextEditor/index";
import Image from "next/image";

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: "active" | "inactive";
  totalStudents: number;
  totalSections: number;
  category?: string;
}

interface Instructor {
  id: string;
  name: string;
}

// Update the schema to remove settings
const departmentFormSchema = z.object({
  name: z.string()
    .min(2, "Department name must be at least 2 characters")
    .max(100, "Department name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9\s\-&]+$/, "Department name can only contain letters, numbers, spaces, hyphens, and ampersands"),
  code: z.string()
    .min(2, "Code must be at least 2 characters")
    .max(10, "Code must be less than 10 characters")
    .regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers"),
  headOfDepartment: z.string().min(1, "Head of Department is required"),
  description: z.string().optional(),
  courseOfferings: z.array(z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
  })).default([]),
  status: z.enum(["active", "inactive"]).default("active"),
  logo: z.string().optional(),
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
    logo?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const isEdit = !!initialData;
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [codeExists, setCodeExists] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftExists, setDraftExists] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formProgress, setFormProgress] = useState(0);
  const [selectedTab, setSelectedTab] = useState("basic");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [selectedCourseCategory, setSelectedCourseCategory] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
      headOfDepartment: initialData?.headOfDepartment || "",
      description: initialData?.description || "",
      courseOfferings: initialData?.courseOfferings || [],
      status: initialData?.status || "active",
      logo: initialData?.logo || "",
    },
  });

  const { formState: { isDirty } } = form;

  // Auto-save functionality
  const debouncedFormValues = useDebounce(form.watch(), 1000);

  useEffect(() => {
    if (form.formState.isDirty) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 5000);
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [debouncedFormValues]);

  const handleAutoSave = () => {
    const formData = form.getValues();
    localStorage.setItem('departmentFormDraft', JSON.stringify({
      ...formData,
      savedAt: new Date().toISOString(),
    }));
    setLastSaved(new Date());
    setDraftSaved(true);
    setDraftExists(true);
    toast.success("Progress auto-saved", {
      description: "Your changes have been automatically saved.",
    });
  };

  // Calculate form progress
  useEffect(() => {
    const values = form.getValues();
    const totalFields = Object.keys(departmentFormSchema.shape).length;
    const filledFields = Object.entries(values).filter(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => {
          if (typeof v === 'string') return v !== '';
          if (typeof v === 'number') return v !== 0;
          if (typeof v === 'boolean') return true;
          return v !== undefined && v !== null;
        });
      }
      return value !== undefined && value !== '';
    }).length;
    
    setFormProgress((filledFields / totalFields) * 100);
  }, [form.watch()]);

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file type", {
        description: "Please upload an image file.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File too large", {
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    try {
      setLoading(true);
      // Here you would typically upload to your storage service
      // For now, we'll just create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        form.setValue('logo', reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload logo", {
        description: "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced course selection
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
      course.code.toLowerCase().includes(courseSearch.toLowerCase());
    const matchesCategory = selectedCourseCategory === "all" || course.category === selectedCourseCategory;
    return matchesSearch && matchesCategory;
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
        logo: initialData.logo,
      });
    } else {
      form.reset({
        name: "",
        code: "",
        headOfDepartment: "",
        description: "",
        courseOfferings: [],
        status: "active",
        logo: "",
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

  // Cancel with confirmation if dirty
  const handleCancel = () => {
    if (form.formState.isDirty) {
      confirmCancel();
    } else {
      onOpenChange(false);
    }
  };

  const confirmCancel = () => {
    toast.error("Unsaved changes", {
      description: "You have unsaved changes. Are you sure you want to discard them?",
      action: {
        label: "Discard",
        onClick: () => {
          form.reset();
          onOpenChange(false);
          toast.info("Changes discarded", {
            description: "Your changes have been discarded.",
          });
        },
      },
    });
  };

  // Helper to check if there are any errors
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  async function onSubmit(data: DepartmentFormValues) {
    setShowErrorSummary(false);
    try {
      setLoading(true);
      const url = isEdit && initialData?.id ? `/api/departments/${initialData.id}` : "/api/departments";
      const method = isEdit ? "PUT" : "POST";
      const submitData = {
        ...data,
        courseOfferings: data.courseOfferings.map((course) => ({
          id: course.id,
          name: course.name,
          code: course.code,
        })),
      };
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (!response.ok) throw new Error("Failed to save department");
      toast.success(
        isEdit ? "Department updated successfully" : "Department created successfully",
        {
          description: isEdit 
            ? "The department has been updated."
            : "A new department has been created.",
        }
      );
      onSuccess();
      onOpenChange(false);
      localStorage.removeItem('departmentFormDraft');
    } catch (error) {
      setShowErrorSummary(true);
      toast.error("Failed to save department", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  // Add validation error toast
  useEffect(() => {
    const subscription = form.watch(() => {
      const errors = form.formState.errors;
      if (Object.keys(errors).length > 0) {
        const firstError = Object.values(errors)[0];
        if (firstError?.message) {
          toast.error("Validation Error", {
            description: firstError.message,
          });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Add the missing handleSaveDraft function
  const handleSaveDraft = () => {
    const formData = form.getValues();
    localStorage.setItem('departmentFormDraft', JSON.stringify({
      ...formData,
      savedAt: new Date().toISOString(),
    }));
    setLastSaved(new Date());
    setDraftSaved(true);
    setDraftExists(true);
    toast.success("Draft saved successfully", {
      description: "Your changes have been saved as a draft.",
    });
  };

  // Add handleClearDraft function
  const handleClearDraft = () => {
    localStorage.removeItem('departmentFormDraft');
    setDraftExists(false);
    setDraftTimestamp(null);
    toast.info("Draft cleared", {
      description: "The saved draft has been removed.",
    });
  };

  // Update the handleDeleteCourse function
  const handleDeleteCourse = (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentCourses = form.getValues('courseOfferings') || [];
    const courseToRemove = currentCourses.find(c => c.id === courseId);
    
    if (courseToRemove) {
      form.setValue(
        'courseOfferings',
        currentCourses.filter(c => c.id !== courseId)
      );
      
      toast.success("Course removed", {
        description: `${courseToRemove.name} has been removed from the department.`,
      });
    }
  };

  // Add handleReset function
  const handleReset = () => {
    form.reset();
    toast.info("Form reset", {
      description: "All fields have been cleared and reset to their default values.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-2xl font-semibold text-blue-900">
              {isEdit ? "Edit Department" : "Create New Department"}
            </DialogTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-blue-400 cursor-pointer">
                    <BadgeInfo className="w-5 h-5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-900 text-white">
                  {isEdit
                    ? "Update the department information below"
                    : "Fill in the details below to add a new department to the system"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        {/* Info: All fields required */}
        <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm">
          <Info className="h-5 w-5" />
          <span>All fields marked with <span className="font-bold">*</span> are required</span>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Basic Information</h3>
              </div>
            </div>
            <div className="h-px bg-blue-100 w-full mb-4"></div>
            <div className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="text-sm text-blue-900">Department Logo</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors bg-white">
                    {logoPreview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={logoPreview}
                          alt="Department logo"
                          fill
                          className="object-cover rounded-lg"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                  >
                    Upload Logo
                  </Button>
                </div>
              </div>

              {/* Department Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-blue-900">
                      Department Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter department name" className="border-blue-200 focus:border-blue-400 focus:ring-blue-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department Code */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-blue-900">
                      Department Code <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input {...field} placeholder="Enter department code" className="border-blue-200 focus:border-blue-400 focus:ring-blue-400" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const name = form.getValues('name');
                                  const code = name
                                    .split(' ')
                                    .map(word => word[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 5);
                                  form.setValue('code', code);
                                }}
                                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                              >
                                Auto-generate
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Generate code from department name
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Head of Department */}
              <FormField
                control={form.control}
                name="headOfDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-blue-900">
                      Head of Department <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue placeholder="Select head of department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <Command>
                          <CommandInput placeholder="Search instructors..." />
                          <CommandEmpty>No instructors found.</CommandEmpty>
                          <CommandGroup>
                            {instructors.map((instructor) => (
                              <CommandItem
                                key={instructor.id}
                                value={instructor.id}
                                onSelect={() => field.onChange(instructor.id)}
                              >
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback>
                                      {instructor.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{instructor.name}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-blue-900">Description</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter department description..."
                        className="border-blue-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Courses Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-blue-900">Courses</h3>
              </div>
              <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                {form.getValues('courseOfferings')?.length || 0} selected
              </Badge>
            </div>
            <div className="h-px bg-blue-100 w-full mb-4"></div>
            <div className="space-y-4">
              {/* Search and Filter Section */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="pl-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                  />
                </div>
                <Select
                  value={selectedCourseCategory || ""}
                  onValueChange={setSelectedCourseCategory}
                >
                  <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400 w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Courses Badges */}
              {form.getValues('courseOfferings')?.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <div className="w-full flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-blue-900">Selected Courses</span>
                  </div>
                  {form.getValues('courseOfferings')?.map((course) => (
                    <Badge
                      key={course.id}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1.5 bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-sm">{course.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-blue-100"
                        onClick={(e) => handleDeleteCourse(course.id, e)}
                      >
                        <X className="h-3 w-3 text-blue-600" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Course List */}
              <ScrollArea className="h-[300px] rounded-md border border-blue-100">
                <div className="p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No courses found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredCourses.map((course) => {
                        const isSelected = form.getValues('courseOfferings')?.some(c => c.id === course.id);
                        return (
                          <div
                            key={course.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors group",
                              isSelected
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                            )}
                            onClick={() => {
                              const currentCourses = form.getValues('courseOfferings') || [];
                              if (isSelected) {
                                form.setValue(
                                  'courseOfferings',
                                  currentCourses.filter(c => c.id !== course.id)
                                );
                              } else {
                                form.setValue('courseOfferings', [...currentCourses, course]);
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full transition-colors",
                                isSelected ? "bg-blue-500" : "bg-gray-300 group-hover:bg-blue-300"
                              )} />
                              <div>
                                <h4 className="font-medium text-blue-900 text-sm">{course.name}</h4>
                                <p className="text-xs text-gray-500">{course.code}</p>
                              </div>
                            </div>
                            {isSelected ? (
                              <Check className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </ScrollArea>
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
                className="w-40 bg-blue-600 hover:bg-blue-700 text-white h-10"
              >
                {isSubmitting
                  ? isEdit
                    ? "Saving..."
                    : "Saving..."
                  : isEdit
                    ? "Update Department"
                    : "Create Department"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// If you don't have 'uuid' installed, use a simple fallback:
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c: string) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Simple debounce implementation
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}