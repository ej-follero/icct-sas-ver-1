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

// Enhanced form schema with more validation
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
  settings: z.object({
    autoGenerateCode: z.boolean().default(false),
    allowCourseOverlap: z.boolean().default(false),
    maxInstructors: z.number().min(1).max(100).optional(),
  }).default({}),
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
    settings: {
      autoGenerateCode: boolean;
      allowCourseOverlap: boolean;
      maxInstructors: number;
    };
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
      settings: {
        autoGenerateCode: false,
        allowCourseOverlap: false,
        maxInstructors: 10,
      },
    },
  });

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
        settings: initialData.settings,
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
        settings: {
          autoGenerateCode: false,
          allowCourseOverlap: false,
          maxInstructors: 10,
        },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-900">
            {isEdit ? "Edit Department" : "Create New Department"}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">Form Progress</span>
            <span className="text-blue-700">{Math.round(formProgress)}%</span>
          </div>
          <Progress value={formProgress} className="h-2" />
        </div>

        {/* Last Saved Indicator */}
        {lastSaved && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Department Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
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
                        <ImageIcon className="w-8 h-8 text-gray-400" />
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
                  >
                    Upload Logo
                  </Button>
                </div>
              </div>

              {/* Basic Information Fields */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter department name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Code</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input {...field} placeholder="Enter department code" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  // Auto-generate code logic
                                  const name = form.getValues('name');
                                  const code = name
                                    .split(' ')
                                    .map(word => word[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 5);
                                  form.setValue('code', code);
                                }}
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

              <FormField
                control={form.control}
                name="headOfDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head of Department</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter department description..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="courses" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search courses..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select
                    value={selectedCourseCategory || ""}
                    onValueChange={setSelectedCourseCategory}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {/* Add your course categories here */}
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCourses.map((course) => (
                      <Card
                        key={course.id}
                        className={cn(
                          "cursor-pointer transition-colors",
                          form.getValues('courseOfferings')?.some(c => c.id === course.id)
                            ? "border-blue-500 bg-blue-50"
                            : "hover:border-blue-300"
                        )}
                        onClick={() => {
                          const currentCourses = form.getValues('courseOfferings') || [];
                          const isSelected = currentCourses.some(c => c.id === course.id);
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
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{course.name}</h4>
                              <p className="text-sm text-gray-500">{course.code}</p>
                            </div>
                            {form.getValues('courseOfferings')?.some(c => c.id === course.id) && (
                              <Check className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <FormField
                control={form.control}
                name="settings.autoGenerateCode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Auto-generate Department Code</FormLabel>
                      <p className="text-sm text-gray-500">
                        Automatically generate department code from name
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.allowCourseOverlap"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Allow Course Overlap</FormLabel>
                      <p className="text-sm text-gray-500">
                        Allow courses to be scheduled at the same time
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.maxInstructors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Instructors</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!form.formState.isDirty}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              {draftExists && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearDraft}
                >
                  Clear Draft
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                toast.info("Form reset", {
                  description: "All fields have been cleared and reset to their default values.",
                });
              }}
              className="border-blue-400 text-blue-600 hover:text-blue-700 hover:border-blue-500"
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={loading || !form.formState.isDirty}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update Department" : "Create Department"}
            </Button>
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