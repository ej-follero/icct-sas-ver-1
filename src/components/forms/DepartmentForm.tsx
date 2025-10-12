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
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Info, User, List, X, Building2, AlertCircle, Loader2, FileText, ToggleLeft, BadgeInfo, Pencil, Plus, Save, Clock, Image as ImageIcon, Search, Filter, RotateCcw, Trash2, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import RichTextEditor from "@/components/RichTextEditor/index";
import SearchableSelectSearch, { MultiSearchableSelectSearch } from "@/components/reusable/Search/SearchableSelect";
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
  headOfDepartment: z.string().optional(),
  description: z.string().optional(),
  courseOfferings: z.array(z.object({
    id: z.string(),
    name: z.string(),
    code: z.string(),
    status: z.enum(["active", "inactive"]).optional(),
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

  
  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  
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
  const [instructorSearch, setInstructorSearch] = useState<string>("");
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>(instructors);
  const [resetKey, setResetKey] = useState<number>(0);
  const [richTextKey, setRichTextKey] = useState<number>(0);
  const [coursesKey, setCoursesKey] = useState<number>(0);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Dialog states for Save Draft functionality
  const [showDraftSavedDialog, setShowDraftSavedDialog] = useState(false);
  const [showDraftErrorDialog, setShowDraftErrorDialog] = useState(false);
  const [draftErrorMessage, setDraftErrorMessage] = useState("");
  const [showDraftClearedDialog, setShowDraftClearedDialog] = useState(false);
  const [showDraftRestoredDialog, setShowDraftRestoredDialog] = useState(false);
  
  // Dialog states for Reset functionality
  const [showResetConfirmDialog, setShowResetConfirmDialog] = useState(false);
  const [showResetSuccessDialog, setShowResetSuccessDialog] = useState(false);
  
  // Dialog states for Create/Update functionality
  const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState(false);
  const [showSubmitSuccessDialog, setShowSubmitSuccessDialog] = useState(false);
  const [showSubmitErrorDialog, setShowSubmitErrorDialog] = useState(false);
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState("");

  // Dialog states for notifications (replacing toasts)
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  } | null>(null);

  // Helper function to show notification dialogs
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string, action?: { label: string; onClick: () => void }) => {
    setNotificationConfig({ type, title, message, action });
    setShowNotificationDialog(true);
  };

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

    // Add error handling for form initialization
  useEffect(() => {
    try {
      console.log('DepartmentForm: initialData changed', { initialData, instructorsLength: instructors.length });
      
      if (initialData) {
        // Map instructor name to ID if we have instructors loaded
        let headOfDepartmentId = initialData.headOfDepartment || "";
        if (initialData.headOfDepartment && instructors.length > 0) {
          console.log('Looking for instructor match:', initialData.headOfDepartment);
          console.log('Available instructors:', instructors.map(i => ({ id: i.id, name: i.name })));
          
          // Try exact match first
          let matchingInstructor = instructors.find(instructor => 
            instructor.name.toLowerCase() === initialData.headOfDepartment.toLowerCase()
          );
          
          // If no exact match, try partial match (in case the stored name is incomplete)
          if (!matchingInstructor) {
            matchingInstructor = instructors.find(instructor => 
              instructor.name.toLowerCase().includes(initialData.headOfDepartment.toLowerCase()) ||
              initialData.headOfDepartment.toLowerCase().includes(instructor.name.toLowerCase())
            );
          }
          
          if (matchingInstructor) {
            headOfDepartmentId = matchingInstructor.id;
            console.log('Found matching instructor:', matchingInstructor);
          } else {
            console.log('No matching instructor found for:', initialData.headOfDepartment);
          }
        }

        form.reset({
          name: initialData.name || "",
          code: initialData.code || "",
          headOfDepartment: headOfDepartmentId,
          description: initialData.description || "",
          courseOfferings: initialData.courseOfferings || [],
          status: initialData.status || "active",
          logo: initialData.logo || "",
        });
        
        // Set logo preview if logo exists
        if (initialData.logo) {
          setLogoPreview(initialData.logo);
        } else {
          setLogoPreview(null);
        }
      } else {
        // Clear form when creating new department (no initialData)
        form.reset({
          name: "",
          code: "",
          headOfDepartment: "",
          description: "",
          courseOfferings: [],
          status: "active",
          logo: "",
        });
        setLogoPreview(null);
      }
    } catch (error) {
      console.error("Error initializing form:", error);
      setHasError(true);
      setError("Failed to initialize form");
    }
  }, [initialData, form, instructors]);

  // Separate useEffect for draft restoration when dialog opens
  useEffect(() => {
    if (open && !initialData) {
      // Check for existing draft when opening form for new department
      const savedDraft = localStorage.getItem('departmentFormDraft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          const draftAge = new Date().getTime() - new Date(draftData.savedAt).getTime();
          const draftAgeHours = draftAge / (1000 * 60 * 60);
          
          // Show draft restoration prompt if draft is less than 24 hours old
          if (draftAgeHours < 24) {
            setDraftExists(true);
            setDraftTimestamp(draftData.savedAt);
            setShowRestorePrompt(true);
          } else {
            // Clear old draft
            localStorage.removeItem('departmentFormDraft');
            setDraftExists(false);
            setDraftTimestamp(null);
          }
        } catch (error) {
          console.error('Error parsing saved draft:', error);
          localStorage.removeItem('departmentFormDraft');
        }
      }
    }
  }, [open, initialData]);

  const { formState: { isDirty } } = form;

  // Auto-save functionality
  const debouncedFormValues = useDebounce(form.watch(), 1000);

  useEffect(() => {
    if (form.formState.isDirty && !isEdit) { // Only auto-save for new departments
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 5000); // Auto-save after 5 seconds of inactivity
    }
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [debouncedFormValues, isEdit]);

  const handleAutoSave = () => {
    const formData = form.getValues();
    
    // Only auto-save if there are meaningful changes
    const hasChanges = Object.values(formData).some(value => {
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null;
    });
    
    if (hasChanges) {
      const draftData = {
        ...formData,
        savedAt: new Date().toISOString(),
        formProgress: formProgress,
        isDraft: true,
        autoSaved: true,
      };
      
      localStorage.setItem('departmentFormDraft', JSON.stringify(draftData));
      setLastSaved(new Date());
      setDraftSaved(true);
      setDraftExists(true);
      setDraftTimestamp(draftData.savedAt);
      
      // Show a subtle notification for auto-save
      showNotification('success', 'Progress Auto-Saved', 'Your changes have been automatically saved.');
    }
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
      showNotification('error', 'Invalid File Type', 'Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showNotification('error', 'File Too Large', 'Please upload an image smaller than 5MB.');
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload to server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Set the logo URL and preview
      setLogoPreview(result.url);
      form.setValue('logo', result.url);
      
      showNotification('success', 'Logo Uploaded', 'Logo uploaded successfully');
    } catch (error) {
      showNotification('error', 'Upload Failed', error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };





  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);

          console.log("Fetching courses from /api/courses...");
          
          // First, check if the health endpoint is available
          try {
            const healthResponse = await fetch("/api/health", {
              method: 'HEAD',
            });
            console.log("Health check status:", healthResponse.status);
          } catch (healthError) {
            console.warn("Health check failed:", healthError);
          }
          
          // Fetch courses with better error handling
          const coursesResponse = await fetch("/api/courses", {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log("Courses response status:", coursesResponse.status);
          
          if (!coursesResponse.ok) {
            let errorText = "";
            try {
              errorText = await coursesResponse.text();
            } catch (textError) {
              errorText = "Unable to read error response";
            }
            
            console.error("Courses API error response:", errorText);
            
            // Provide more specific error messages based on status code
            let errorMessage = "Failed to fetch courses";
            if (coursesResponse.status === 404) {
              errorMessage = "Courses API endpoint not found";
            } else if (coursesResponse.status === 500) {
              errorMessage = "Database connection error - please check if the database is running";
            } else if (coursesResponse.status === 503) {
              errorMessage = "Database service unavailable";
            } else if (errorText) {
              try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorMessage;
              } catch {
                errorMessage = `Server error: ${coursesResponse.status} - ${errorText}`;
              }
            } else {
              errorMessage = `HTTP ${coursesResponse.status}: ${coursesResponse.statusText}`;
            }
            
            throw new Error(errorMessage);
          }
          
          let coursesData;
          try {
            coursesData = await coursesResponse.json();
          } catch (jsonError) {
            console.error("Failed to parse courses JSON:", jsonError);
            throw new Error("Invalid response format from courses API");
          }
          
          console.log("Courses data received:", coursesData);

          // Validate that coursesData is an array
          if (!Array.isArray(coursesData)) {
            console.error("Courses data is not an array:", coursesData);
            throw new Error("Invalid courses data format");
          }

          setCourses(coursesData);
          
          // Note: Instructors are passed as props, so we don't need to fetch them here
          // The parent component should fetch instructors and pass them down
          
        } catch (error) {
          console.error("Error fetching data:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
          setError(`Failed to fetch courses: ${errorMessage}`);
          showNotification('error', 'Failed to Fetch Courses', errorMessage);
          setCourses([]);
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (open && nameInputRef.current) {
      nameInputRef.current.focus();
    }
    
    // Reset form state when dialog opens/closes
    if (!open) {
      // Clear form state when dialog closes
      setLogoPreview(null);
      setInstructorSearch("");
      setFilteredInstructors(instructors);
      setShowErrorSummary(false);
      setCodeExists(false);
      setDraftSaved(false);
      setDraftExists(false);
      setDraftTimestamp(null);
      setLastSaved(null);
      setFormProgress(0);
      setResetKey(0);
      setRichTextKey(0);
      setCoursesKey(0); // Reset courses key
      setSelectedCourseIds([]); // Reset selected course IDs
    }
  }, [open, instructors]);

  // Update filtered instructors when instructors prop changes
  useEffect(() => {

    setFilteredInstructors(instructors);
  }, [instructors]);

  // Synchronize selectedCourseIds with form field
  useEffect(() => {
    try {
      const currentCourseIds = form.getValues('courseOfferings')?.map(c => c?.id).filter((id): id is string => id !== undefined) || [];
      console.log('Syncing selectedCourseIds from form field:', currentCourseIds);
      setSelectedCourseIds(currentCourseIds);
    } catch (error) {
      console.error('Error syncing selectedCourseIds:', error);
      setSelectedCourseIds([]);
    }
  }, [form.watch('courseOfferings')]);

  // Also sync when form is reset
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'courseOfferings') {
        try {
          const currentCourseIds = value.courseOfferings?.map(c => c?.id).filter((id): id is string => id !== undefined) || [];
          console.log('Form watch - syncing selectedCourseIds:', currentCourseIds);
          setSelectedCourseIds(currentCourseIds);
        } catch (error) {
          console.error('Error in form watch sync:', error);
          setSelectedCourseIds([]);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Debug log for selectedCourseIds changes
  useEffect(() => {
    console.log('MultiSearchableSelect render - selectedCourseIds:', selectedCourseIds);
  }, [selectedCourseIds]);

  // Force sync when coursesKey changes (reset)
  useEffect(() => {
    console.log('coursesKey changed, forcing sync of selectedCourseIds');
    const currentCourseIds = form.getValues('courseOfferings')?.map(c => c?.id).filter((id): id is string => id !== undefined) || [];
    setSelectedCourseIds(currentCourseIds);
  }, [coursesKey, form]);

  // Aggressive reset handling
  useEffect(() => {
    if (coursesKey > 0) {
      // This means a reset was triggered
      console.log('Reset detected, ensuring courses are cleared');
      const formValue = form.getValues('courseOfferings');
      if (!initialData && (!formValue || formValue.length === 0)) {
        setSelectedCourseIds([]);
        console.log('Forcing selectedCourseIds to empty array');
      }
    }
  }, [coursesKey, initialData, form]);

  // Filter instructors based on search
  useEffect(() => {

    if (instructorSearch.trim() === "") {
      setFilteredInstructors(instructors);
    } else {
      const filtered = instructors.filter(instructor =>
        instructor.name.toLowerCase().includes(instructorSearch.toLowerCase())
      );
      setFilteredInstructors(filtered);
    }

  }, [instructorSearch, instructors]);

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
    showNotification('error', 'Unsaved Changes', 'You have unsaved changes. Are you sure you want to discard them?', {
      label: "Discard",
      onClick: () => {
        // Reset form to initial state
        if (initialData) {
          form.reset({
            name: initialData.name || "",
            code: initialData.code || "",
            headOfDepartment: initialData.headOfDepartment || "",
            description: initialData.description || "",
            courseOfferings: initialData.courseOfferings || [],
            status: initialData.status || "active",
            logo: initialData.logo || "",
          });
          setSelectedCourseIds(initialData.courseOfferings?.map(c => c.id) || []);
          setLogoPreview(initialData.logo || null);
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
          setSelectedCourseIds([]);
          setLogoPreview(null);
        }
        
        // Reset other state
        setInstructorSearch("");
        setFilteredInstructors(instructors);
        setShowErrorSummary(false);
        setCodeExists(false);
        setDraftSaved(false);
        setDraftExists(false);
        setDraftTimestamp(null);
        setLastSaved(null);
        setFormProgress(0);
        
        // Clear any saved drafts
        localStorage.removeItem('departmentFormDraft');
        
        onOpenChange(false);
        showNotification('info', 'Changes Discarded', 'Your changes have been discarded.');
      },
    });
  };

  // Helper to check if there are any errors
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  async function onSubmit(data: DepartmentFormValues) {
    console.log('onSubmit function called with data:', data);
    console.log('Form state:', form.formState);
    console.log('Is edit mode:', isEdit);
    console.log('Initial data:', initialData);
    
    setShowErrorSummary(false);
    try {
      setIsSubmitting(true);
      const url = isEdit && initialData?.id ? `/api/departments/${initialData.id}` : "/api/departments";
      const method = isEdit ? "PATCH" : "POST";
      
      console.log('API URL:', url);
      console.log('HTTP Method:', method);
      
      // Send all the data including course assignments and instructor assignment
      const submitData = {
        name: data.name,
        code: data.code,
        description: data.description,
        status: data.status,
        headOfDepartment: data.headOfDepartment,
        logo: data.logo,
        courseOfferings: data.courseOfferings.map((course) => ({
          id: course.id,
          name: course.name,
          code: course.code,
        })),
      };
      
      console.log('Submit data being sent:', submitData);
      

      
      console.log('Making API call to:', url);
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('API Error data:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('API Success result:', result);
      
      // Set success message and show dialog
      setSubmitSuccessMessage(
        isEdit 
          ? "The department has been updated successfully."
          : "A new department has been created successfully."
      );
      setShowSubmitSuccessDialog(true);
      
      // Clear draft after successful submission
      localStorage.removeItem('departmentFormDraft');
      
      // Close form and call success callback after dialog closes
      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
      }, 1000);
      
    } catch (error) {
      setShowErrorSummary(true);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setSubmitErrorMessage(errorMessage);
      setShowSubmitErrorDialog(true);
      console.error('Department save error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle submit button click with confirmation
  const handleSubmitClick = () => {
    console.log('Submit button clicked');
    console.log('Form errors:', form.formState.errors);
    console.log('Form values:', form.getValues());
    
    // Check if form has validation errors
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      if (firstError?.message) {
        console.log('Validation error found:', firstError.message);
        setSubmitErrorMessage(`Validation Error: ${firstError.message}`);
        setShowSubmitErrorDialog(true);
        return;
      }
    }
    
    console.log('No validation errors, showing confirmation dialog');
    // Show confirmation dialog
    setShowSubmitConfirmDialog(true);
  };

  // Handle actual form submission
  const handleConfirmSubmit = () => {
    console.log('Confirming submit, calling form.handleSubmit');
    setShowSubmitConfirmDialog(false);
    form.handleSubmit(onSubmit)();
  };

  // Add the missing handleSaveDraft function
  const handleSaveDraft = async () => {
    try {
      console.log('Save Draft button clicked');
      setIsSavingDraft(true);
      const formData = form.getValues();
      
      console.log('Form data to save:', formData);
      
      // For drafts, we should allow saving even with incomplete data
      // Only validate if there's actual content to validate
      const hasContent = Object.values(formData).some(value => {
        if (typeof value === 'string') return value.trim() !== '';
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null;
      });
      
      if (hasContent) {
        // Only validate if there's content, but be more lenient for drafts
        const draftValidationSchema = z.object({
          name: z.string().optional(),
          code: z.string().optional(),
          headOfDepartment: z.string().optional(),
          description: z.string().optional(),
          courseOfferings: z.array(z.object({
            id: z.string(),
            name: z.string(),
            code: z.string(),
            status: z.enum(["active", "inactive"]).optional(),
          })).default([]),
          status: z.enum(["active", "inactive"]).default("active"),
          logo: z.string().optional(),
        });
        
        const validationResult = draftValidationSchema.safeParse(formData);
        if (!validationResult.success) {
          console.log('Draft validation failed:', validationResult.error);
          setDraftErrorMessage("Please fix validation errors before saving draft.");
          setShowDraftErrorDialog(true);
          return;
        }
      }
      
      const draftData = {
        ...formData,
        savedAt: new Date().toISOString(),
        formProgress: formProgress,
        isDraft: true,
      };
      
      console.log('Saving draft data:', draftData);
      localStorage.setItem('departmentFormDraft', JSON.stringify(draftData));
      setLastSaved(new Date());
      setDraftSaved(true);
      setDraftExists(true);
      setDraftTimestamp(draftData.savedAt);
      
      console.log('Draft saved successfully, showing dialog...');
      
      // Show success dialog
      setShowDraftSavedDialog(true);
      
      console.log('Dialog should be visible now');
      
      // Show a brief visual confirmation on the button
      setTimeout(() => {
        setDraftSaved(false); // Reset the visual state after 2 seconds
      }, 2000);
      
    } catch (error) {
      console.error('Error saving draft:', error);
      setDraftErrorMessage("An error occurred while saving your draft.");
      setShowDraftErrorDialog(true);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Add handleClearDraft function
  const handleClearDraft = () => {
    localStorage.removeItem('departmentFormDraft');
    setDraftExists(false);
    setDraftTimestamp(null);
    setDraftSaved(false);
    setLastSaved(null);
    setShowDraftClearedDialog(true);
  };

  // Add handleRestoreDraft function
  const handleRestoreDraft = () => {
    try {
      const savedDraft = localStorage.getItem('departmentFormDraft');
      if (!savedDraft) {
        showNotification('error', 'No Draft Found', 'There is no saved draft to restore.');
        return;
      }

      const draftData = JSON.parse(savedDraft);
      
      // Restore form data
      form.reset({
        name: draftData.name || "",
        code: draftData.code || "",
        headOfDepartment: draftData.headOfDepartment || "",
        description: draftData.description || "",
        courseOfferings: draftData.courseOfferings || [],
        status: draftData.status || "active",
        logo: draftData.logo || "",
      });
      
      // Restore logo preview
      if (draftData.logo) {
        setLogoPreview(draftData.logo);
      } else {
        setLogoPreview(null);
      }
      
      // Restore course selection
      if (draftData.courseOfferings && draftData.courseOfferings.length > 0) {
        const courseIds = draftData.courseOfferings.map((c: any) => c.id);
        setSelectedCourseIds(courseIds);
      } else {
        setSelectedCourseIds([]);
      }
      
      setShowRestorePrompt(false);
      setDraftSaved(true);
      
      setShowDraftRestoredDialog(true);
    } catch (error) {
      console.error('Error restoring draft:', error);
      setDraftErrorMessage("An error occurred while restoring your draft.");
      setShowDraftErrorDialog(true);
    }
  };

  // Add handleDiscardDraft function
  const handleDiscardDraft = () => {
    setShowRestorePrompt(false);
    setDraftExists(false);
    setDraftTimestamp(null);
    setShowDraftClearedDialog(true);
  };



  // Add handleReset function with confirmation
  const handleReset = () => {
    // Show confirmation dialog if form has changes
    if (form.formState.isDirty) {
      setShowResetConfirmDialog(true);
    } else {
      performReset();
    }
  };

  const performReset = () => {
    console.log('Performing reset...', { initialData, isEdit });
    
    // Clear all form errors first
    form.clearErrors();
    
    // Reset form to initial values
    if (initialData) {
      // If editing, reset to original data
      let headOfDepartmentId = initialData.headOfDepartment || "";
      if (initialData.headOfDepartment && instructors.length > 0) {
        // Try to find matching instructor
        let matchingInstructor = instructors.find(instructor => 
          instructor.name.toLowerCase() === initialData.headOfDepartment.toLowerCase()
        );
        
        if (!matchingInstructor) {
          matchingInstructor = instructors.find(instructor => 
            instructor.name.toLowerCase().includes(initialData.headOfDepartment.toLowerCase()) ||
            initialData.headOfDepartment.toLowerCase().includes(instructor.name.toLowerCase())
          );
        }
        
        if (matchingInstructor) {
          headOfDepartmentId = matchingInstructor.id;
        }
      }

      // Reset form with original data
      form.reset({
        name: initialData.name || "",
        code: initialData.code || "",
        headOfDepartment: headOfDepartmentId,
        description: initialData.description || "",
        courseOfferings: initialData.courseOfferings || [],
        status: initialData.status || "active",
        logo: initialData.logo || "",
      });
      
      console.log('Reset to original data:', {
        name: initialData.name,
        code: initialData.code,
        description: initialData.description,
        status: initialData.status,
        courseOfferings: initialData.courseOfferings?.length || 0
      });
      
      // Set logo preview if logo exists
      if (initialData.logo) {
        setLogoPreview(initialData.logo);
      } else {
        setLogoPreview(null);
      }
      
      // Set course selection for edit mode
      const courseIds = initialData.courseOfferings?.map(c => c.id) || [];
      setSelectedCourseIds(courseIds);
      console.log('Setting selectedCourseIds for edit mode:', courseIds);
    } else {
      // If creating new, reset to empty values
      form.reset({
        name: "",
        code: "",
        headOfDepartment: "",
        description: "",
        courseOfferings: [],
        status: "active",
        logo: "",
      });
      
      console.log('Reset to empty values');
      
      // Clear logo preview
      setLogoPreview(null);
      
      // Clear course selection for create mode
      setSelectedCourseIds([]);
      console.log('Clearing selectedCourseIds for create mode');
      
      // Force clear the form field immediately
      form.setValue("courseOfferings", []);
    }
    
    // Reset additional state
    setInstructorSearch("");
    setFilteredInstructors(instructors);
    setShowErrorSummary(false);
    setCodeExists(false);
    
    // Force re-render of components by incrementing reset key
    setResetKey(prev => prev + 1);
    setRichTextKey(prev => prev + 1);
    setCoursesKey(prev => prev + 1); // Increment courses key
    
    console.log('Reset keys updated:', { resetKey: resetKey + 1, richTextKey: richTextKey + 1, coursesKey: coursesKey + 1 });
    
    // Additional manual reset for problematic fields with longer delay
    setTimeout(() => {
      if (!initialData) {
        // Ensure all fields are cleared
        form.setValue("name", "");
        form.setValue("code", "");
        form.setValue("headOfDepartment", "");
        form.setValue("description", "");
        form.setValue("courseOfferings", []);
        form.setValue("status", "active");
        form.setValue("logo", "");
        
        // Ensure courses are cleared again
        setSelectedCourseIds([]);
        
        console.log('Manual field clearing completed');
      }
    }, 100); // Increased delay
    
    setShowResetSuccessDialog(true);
  };

  // Show error state if there's an error
  if (hasError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <DialogTitle className="text-red-600">Error Loading Form</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error || "An error occurred while loading the form."}</p>
            <Button
              onClick={() => {
                setHasError(false);
                setError(null);
                onOpenChange(false);
              }}
              variant="outline"
              className="rounded"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Keyboard shortcuts for view and edit functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to cancel
      if (event.key === 'Escape') {
        event.preventDefault();
        handleCancel();
      }
      
      // Ctrl/Cmd + S to save draft
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft && isDirty) {
          handleSaveDraft();
        }
      }
      
      // Ctrl/Cmd + Enter to submit
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft) {
          handleSubmitClick();
        }
      }
      
      // Ctrl/Cmd + R to reset form
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft) {
          handleReset();
        }
      }
      
      // Ctrl/Cmd + D to clear draft (when draft exists)
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        if (draftExists && !isSubmitting && !isSavingDraft) {
          handleClearDraft();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitting, isSavingDraft, isDirty, form, draftExists]);



  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={isEdit ? `edit-${initialData?.id}` : 'create'}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[600px] sm:mx-4 sm:my-1 md:max-w-[750px] md:mx-6 md:my-1 lg:max-w-[900px] lg:mx-8 lg:my-1 flex flex-col">
        {/* Visually hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          {isEdit ? "Edit Department" : "Create New Department"}
        </DialogTitle>
        
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {isEdit ? "Edit Department" : "Create New Department"}
              </h2>
              <p className="text-blue-100 text-sm">
                {isEdit 
                  ? "Update department information and settings"
                  : "Add a new academic department to the system"
                }
              </p>
              
              {/* Draft Status Indicator */}
              {draftExists && !isEdit && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Draft Available
                  </Badge>
                  {draftTimestamp && (
                    <span className="text-blue-100 text-xs">
                      Saved {new Date(draftTimestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
              
              {/* Last Saved Indicator */}
              {lastSaved && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-blue-100 text-xs">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div 
              className="h-full bg-green-400 transition-all duration-300 ease-out"
              style={{ width: `${formProgress}%` }}
            />
          </div>
        </div>

        {/* Draft Restoration Dialog */}
        {showRestorePrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 max-w-md mx-4 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Restore Draft?</h3>
                  <p className="text-sm text-gray-600">A saved draft was found</p>
                </div>
              </div>
              
              <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  We found a saved draft from your previous session. Would you like to restore it?
                </p>
                {draftTimestamp && (
                  <p className="text-xs text-yellow-700 mt-1">
                    Draft saved: {new Date(draftTimestamp).toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDiscardDraft}
                  className="flex-1 rounded"
                >
                  Start Fresh
                </Button>
                <Button
                  onClick={handleRestoreDraft}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 rounded"
                >
                  Restore Draft
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              {/* Draft Management Bar */}
              {draftExists && !isEdit && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Draft saved {draftTimestamp ? new Date(draftTimestamp).toLocaleString() : ''}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreDraft}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 rounded"
                    >
                      Restore
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearDraft}
                      className="text-red-600 border-red-300 hover:bg-red-50 rounded"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

            {/* Info: All fields required */}
            <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded border border-blue-100 text-blue-700 text-sm">
              <Info className="h-4 w-4 text-blue-600" />
              <span>All fields marked with <span className="font-bold">*</span> are required</span>
            </div>
            

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading form...</p>
            </div>
          </div>
        ) : (
          <form className="space-y-6">
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
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors bg-white">
                    {logoPreview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={logoPreview}
                          alt="Department logo"
                          className="object-cover rounded w-full h-full"
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
                    className="border-blue-200 text-blue-700 rounded hover:bg-blue-50 hover:text-blue-800 rounded"
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
                      <Input 
                        key={`name-${resetKey}`}
                        {...field} 
                        placeholder="Enter department name" 
                        className="border-blue-200 focus:border-blue-400 focus:ring-blue-400" 
                      />
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
                        <Input 
                          key={`code-${resetKey}`}
                          {...field} 
                          placeholder="Enter department code" 
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400" 
                        />
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
                                className="border-blue-200 text-blue-700 rounded hover:bg-blue-50 hover:text-blue-800 rounded"
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
                      Head of Department
                    </FormLabel>
                    <FormControl>
                      <Select 
                        key={`head-${resetKey}`}
                        value={field.value} 
                        onValueChange={field.onChange}
                        onOpenChange={(open) => {
                          if (!open) {
                            setInstructorSearch("");
                            setFilteredInstructors(instructors);
                          }
                        }}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue placeholder="Search and select head of department..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <div className="p-2">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-40" />
                              <input
                                type="text"
                                placeholder="Search instructors..."
                                value={instructorSearch}
                                onChange={(e) => setInstructorSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyDown={(e) => {
                                  // Prevent dropdown from closing when typing
                                  e.stopPropagation();
                                }}
                              />
                            </div>
                          </div>
                          <div className="max-h-40 overflow-y-auto">
                            {filteredInstructors.length > 0 ? (
                              filteredInstructors.map((instructor) => (
                                <SelectItem
                                  key={instructor.id}
                                  value={instructor.id}
                                  className="cursor-pointer hover:bg-blue-50"
                                >
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{instructor.name}</span>
                                  </div>
                                </SelectItem>
                              ))
                            ) : instructorSearch.trim() !== "" ? (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                No instructors found matching "{instructorSearch}"
                              </div>
                            ) : instructors.length === 0 ? (
                              <div className="p-2 text-sm text-amber-600 text-center">
                                {loading ? "Loading instructors..." : "No instructors available in database"}
                              </div>
                            ) : (
                              <div className="p-2 text-sm text-gray-500 text-center">
                                No instructors available
                              </div>
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {loading && (
                      <p className="text-sm text-blue-600">
                        Loading instructors...
                      </p>
                    )}
                    {instructors.length === 0 && !loading && (
                      <p className="text-sm text-amber-600">
                        No instructors available. Please add instructors first.
                      </p>
                    )}
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
                        key={`description-${richTextKey}`}
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Enter department description..."
                        className="border-blue-200 rounded"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Department Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-blue-900">
                      Department Status <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select 
                        key={`status-${resetKey}`}
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                          <SelectValue placeholder="Select department status..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active" className="cursor-pointer hover:bg-blue-50">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Active</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive" className="cursor-pointer hover:bg-blue-50">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>Inactive</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {isEdit && initialData && field.value === "active" && initialData.status === "inactive" && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>This will reactivate the department and make it available for use.</span>
                      </div>
                    )}
                    {isEdit && initialData && field.value === "inactive" && initialData.status === "active" && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-sm">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span>This will deactivate the department. It can be reactivated later.</span>
                      </div>
                    )}
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
                {selectedCourseIds.length} selected
              </Badge>
            </div>
            <div className="h-px bg-blue-100 w-full mb-4"></div>
            <div className="space-y-4">
              {/* Course Selection */}
              <FormField
                control={form.control}
                name="courseOfferings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-blue-900">Select Courses</FormLabel>
                    <FormControl>
                      {error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-700">Failed to load courses</span>
                          </div>
                          <p className="text-sm text-red-600 mb-3">{error}</p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setError(null);
                                // Trigger a re-fetch
                                const fetchData = async () => {
                                  try {
                                    setLoading(true);
                                    const coursesResponse = await fetch("/api/courses");
                                    if (coursesResponse.ok) {
                                      const coursesData = await coursesResponse.json();
                                      if (Array.isArray(coursesData)) {
                                        setCourses(coursesData);
                                        setError(null);
                                      } else {
                                        throw new Error("Invalid response format");
                                      }
                                    } else {
                                      const errorText = await coursesResponse.text();
                                      throw new Error(`HTTP ${coursesResponse.status}: ${errorText}`);
                                    }
                                  } catch (error) {
                                    setError(`Retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                  } finally {
                                    setLoading(false);
                                  }
                                };
                                fetchData();
                              }}
                              className="border-red-300 text-red-700 hover:bg-red-50 rounded"
                            >
                              Retry
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setError(null);
                                setCourses([]);
                                showNotification('info', 'Courses Disabled', 'You can continue without courses and add them later.');
                              }}
                              className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded"
                            >
                              Continue Without Courses
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const testResponse = await fetch("/api/test-db");
                                  const testResult = await testResponse.json();
                                  
                                  if (testResult.status === "success") {
                                    showNotification('success', 'Database Test Passed', 'Database connectivity is working properly.');
                                  } else {
                                    showNotification('error', 'Database Test Failed', testResult.message || "Database connectivity issue detected.");
                                  }
                                } catch (testError) {
                                  showNotification('error', 'Database Test Failed', 'Unable to reach the database test endpoint.');
                                }
                              }}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded"
                            >
                              Test Database
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                showNotification('info', 'Database Setup Guide', 'Run \'npm run check:db\' in your terminal to diagnose database issues.', {
                                  label: "Copy Command",
                                  onClick: () => {
                                    navigator.clipboard.writeText("npm run check:db");
                                    showNotification('success', 'Command Copied', 'Command copied to clipboard');
                                  }
                                });
                              }}
                              className="border-green-300 text-green-700 hover:bg-green-50 rounded"
                            >
                              Get Help
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <MultiSearchableSelectSearch
                          key={`courses-${coursesKey}`}
                          options={courses.map(course => ({
                            value: course.id,
                            label: `${course.name} (${course.code})`
                          }))}
                          value={selectedCourseIds}
                          onChange={(selectedIds) => {
                            console.log('MultiSearchableSelect onChange:', selectedIds);
                            setSelectedCourseIds(selectedIds);
                            const selectedCourses = courses.filter(course => selectedIds.includes(course.id));
                            field.onChange(selectedCourses);
                          }}
                          placeholder={loading ? "Loading courses..." : courses.length > 0 ? "Search and select courses..." : "No courses available"}
                          className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                          maxDisplayItems={5}
                          noOptionsMessage="No courses found"
                          noMoreOptionsMessage="No more courses found"
                          startTypingMessage="Start typing to search courses"
                        />
                      )}
                    </FormControl>
                    {courses.length === 0 && !loading && !error && (
                      <p className="text-sm text-amber-600">
                        No courses available. Please add courses first.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Course Info */}
              {selectedCourseIds.length > 0 && (
                <div className="p-4 bg-blue-50/50 rounded border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-blue-900">Selected Courses</span>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                      {selectedCourseIds.length} courses
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {form.getValues('courseOfferings')?.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                      >
                        <div>
                          <div className="font-medium text-sm text-blue-900">{course.name}</div>
                          <div className="text-xs text-gray-500">{course.code}</div>
                        </div>
                        <Badge 
                          variant={course.status === 'active' ? 'success' : course.status === 'inactive' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {course.status || 'Course'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded">
              {error}
            </div>
          )}

          {/* Footer Buttons */}
          <DialogFooter className="flex items-center justify-end pt-6 border-t border-gray-200 bg-gray-50/50 px-6 py-4">
            {/* Action buttons */}
            <div className="flex gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleReset}
                      disabled={isSubmitting || isSavingDraft}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset form to {initialData ? 'original values' : 'empty state'}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSubmitting || isSavingDraft || !isDirty}
                      className={`border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-500 rounded transition-all duration-200 ${
                        draftSaved ? 'bg-green-100 border-green-500 text-green-700 shadow-sm' : ''
                      }`}
                    >
                      {isSavingDraft ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : draftSaved ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Draft Saved!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Draft
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {draftSaved 
                        ? "Draft has been saved successfully! (Ctrl+S)" 
                        : "Save current progress as draft (Ctrl+S)"
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
                
                {draftExists && !isEdit && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={handleClearDraft}
                        disabled={isSubmitting || isSavingDraft}
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-500 rounded"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Draft
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove saved draft permanently</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      onClick={handleSubmitClick}
                      disabled={isSubmitting || isSavingDraft}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isEdit ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          {isEdit ? "Update Department" : "Create Department"}
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isEdit ? "Update department" : "Create new department"} (Ctrl+Enter)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </DialogFooter>
        </form>
        )}
        </div>
        </ScrollArea>
        </div>
      </DialogContent>
      
      {/* Draft Saved Success Dialog */}
      <Dialog open={showDraftSavedDialog} onOpenChange={setShowDraftSavedDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Save className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-green-900">
                  Draft Saved Successfully
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Your progress has been saved as a draft. You can continue editing or close the form and return later to complete it.
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="w-4 h-4" />
                <span>Draft saved at {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowDraftSavedDialog(false)}
              className="bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Continue Editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draft Error Dialog */}
      <Dialog open={showDraftErrorDialog} onOpenChange={setShowDraftErrorDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-red-900">
                  Cannot Save Draft
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {draftErrorMessage}
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <Info className="w-4 h-4" />
                <span>Please fix the issues and try again</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowDraftErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700 text-white rounded"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draft Cleared Dialog */}
      <Dialog open={showDraftClearedDialog} onOpenChange={setShowDraftClearedDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-blue-900">
                  Draft Cleared
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              The saved draft has been removed successfully.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Info className="w-4 h-4" />
                <span>You can continue editing the current form</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowDraftClearedDialog(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Draft Restored Dialog */}
      <Dialog open={showDraftRestoredDialog} onOpenChange={setShowDraftRestoredDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-green-900">
                  Draft Restored
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Your saved draft has been restored successfully. You can continue editing from where you left off.
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="w-4 h-4" />
                <span>Draft restored from {draftTimestamp ? new Date(draftTimestamp).toLocaleString() : 'previous session'}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowDraftRestoredDialog(false)}
              className="bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Continue Editing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirmDialog} onOpenChange={setShowResetConfirmDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-orange-900">
                  Confirm Reset
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              You have unsaved changes. Are you sure you want to reset the form? This action cannot be undone.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-orange-700">
                <Info className="w-4 h-4" />
                <span>All current changes will be lost</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowResetConfirmDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setShowResetConfirmDialog(false);
                performReset();
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded"
            >
              Reset Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Success Dialog */}
      <Dialog open={showResetSuccessDialog} onOpenChange={setShowResetSuccessDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-green-900">
                  Form Reset Successfully
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {initialData 
                ? "All fields have been reset to their original values."
                : "All fields have been cleared successfully."
              }
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Info className="w-4 h-4" />
                <span>You can now start fresh with the form</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowResetSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitConfirmDialog} onOpenChange={setShowSubmitConfirmDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-blue-900">
                  {isEdit ? "Update Department" : "Create Department"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {isEdit 
                ? "Are you sure you want to update this department? This will save all current changes."
                : "Are you sure you want to create this department? This will save all current information."
              }
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Info className="w-4 h-4" />
                <span>
                  {isEdit 
                    ? "The department will be updated with the current form data."
                    : "A new department will be created with the current form data."
                  }
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowSubmitConfirmDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {isEdit ? "Update Department" : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Success Dialog */}
      <Dialog open={showSubmitSuccessDialog} onOpenChange={setShowSubmitSuccessDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-green-900">
                  {isEdit ? "Department Updated" : "Department Created"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {submitSuccessMessage}
            </p>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Info className="w-4 h-4" />
                <span>The form will close automatically</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowSubmitSuccessDialog(false)}
              className="bg-green-600 hover:bg-green-700 text-white rounded"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Error Dialog */}
      <Dialog open={showSubmitErrorDialog} onOpenChange={setShowSubmitErrorDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-red-900">
                  {isEdit ? "Update Failed" : "Creation Failed"}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {submitErrorMessage}
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2 text-sm text-red-700">
                <Info className="w-4 h-4" />
                <span>Please fix the issues and try again</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowSubmitErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700 text-white rounded"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent className="max-w-md rounded">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                notificationConfig?.type === 'success' ? 'bg-green-100' :
                notificationConfig?.type === 'error' ? 'bg-red-100' :
                notificationConfig?.type === 'warning' ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                {notificationConfig?.type === 'success' && <Check className="w-5 h-5 text-green-600" />}
                {notificationConfig?.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                {notificationConfig?.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                {notificationConfig?.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <DialogTitle className={`text-lg font-semibold ${
                  notificationConfig?.type === 'success' ? 'text-green-900' :
                  notificationConfig?.type === 'error' ? 'text-red-900' :
                  notificationConfig?.type === 'warning' ? 'text-yellow-900' :
                  'text-blue-900'
                }`}>
                  {notificationConfig?.title}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              {notificationConfig?.message}
            </p>
            {notificationConfig?.action && (
              <div className={`border rounded p-3 ${
                notificationConfig?.type === 'success' ? 'bg-green-50 border-green-200' :
                notificationConfig?.type === 'error' ? 'bg-red-50 border-red-200' :
                notificationConfig?.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className={`flex items-center gap-2 text-sm ${
                  notificationConfig?.type === 'success' ? 'text-green-700' :
                  notificationConfig?.type === 'error' ? 'text-red-700' :
                  notificationConfig?.type === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  <Info className="w-4 h-4" />
                  <span>Additional action available</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            {notificationConfig?.action && (
              <Button
                onClick={() => {
                  notificationConfig.action?.onClick();
                  setShowNotificationDialog(false);
                }}
                className={`${
                  notificationConfig?.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                  notificationConfig?.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                  notificationConfig?.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                } text-white rounded`}
              >
                {notificationConfig.action.label}
              </Button>
            )}
            <Button
              onClick={() => setShowNotificationDialog(false)}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded"
            >
              {notificationConfig?.action ? 'Cancel' : 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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