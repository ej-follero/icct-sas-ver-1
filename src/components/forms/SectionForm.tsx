"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Info, RotateCcw, Save } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

const sectionFormSchema = z.object({
  sectionName: z.string().min(1, "Section name is required"),
  sectionCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  sectionStatus: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.coerce.number().min(1).max(4, "Year level must be between 1 and 4"),
  departmentId: z.coerce.number().min(1, "Department is required"),
  courseId: z.coerce.number().min(1, "Course is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  semester: z.enum(["FIRST_SEMESTER", "SECOND_SEMESTER", "THIRD_SEMESTER"], {
    required_error: "Semester is required",
  }),
  currentEnrollment: z.coerce.number().min(0).default(0),
  scheduleNotes: z.string().optional(),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;

interface SectionFormProps {
  type: "create" | "update";
  data?: SectionFormData;
  id?: string;
  onSuccess?: (section: SectionFormData) => void;
  onProgressChange?: (progress: number) => void;
  onDialogClose?: () => void;
}

export default function SectionForm({ type, data, id, onSuccess, onProgressChange, onDialogClose }: SectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftExists, setDraftExists] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [showDraftCleared, setShowDraftCleared] = useState(false);
  const [showDraftRestored, setShowDraftRestored] = useState(false);
  const [showDraftError, setShowDraftError] = useState(false);
  const [draftErrorMessage, setDraftErrorMessage] = useState("");
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: number; name: string; startDate: string; endDate: string; isActive: boolean }[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);
  const [loadingEditData, setLoadingEditData] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Helper functions to get display names
  const getDepartmentDisplayName = () => {
    const departmentId = watch("departmentId");
    if (!departmentId || departmentId === 0) return null;
    const department = departments.find(dept => dept.id === departmentId.toString());
    return department ? `${department.code} - ${department.name}` : null;
  };

  const getCourseDisplayName = () => {
    const courseId = watch("courseId");
    if (!courseId || courseId === 0) return null;
    const course = courses.find(course => course.id === courseId.toString());
    return course ? `${course.code} - ${course.name}` : null;
  };

  const getAcademicYearDisplayName = () => {
    const academicYear = watch("academicYear");
    if (!academicYear) return null;
    const year = academicYears.find(year => year.name === academicYear);
    return year ? year.name : academicYear;
  };

  const defaultValues: SectionFormData = {
    sectionName: "",
    sectionCapacity: 40,
    sectionStatus: "ACTIVE",
    yearLevel: 1,
    departmentId: 0,
    courseId: 1, // Default to course ID 1 instead of 0
    academicYear: "",
    semester: "FIRST_SEMESTER",
    currentEnrollment: 0,
    scheduleNotes: "",
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: data || defaultValues,
  });

  // Progress calculation
  useEffect(() => {
    const values = watch();
    const totalFields = Object.keys(sectionFormSchema.shape).length;
    const filledFields = Object.entries(values).filter(([_, value]) => value !== undefined && value !== "" && value !== null).length;
    const progress = Math.round((filledFields / totalFields) * 100);
    onProgressChange?.(progress);
  }, [watch, onProgressChange]);

  // Fetch departments and academic years on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const data = await response.json();
          const deptData = data.data || data; // Handle different response formats
          setDepartments(deptData.map((dept: any) => ({
            id: dept.id,
            name: dept.name,
            code: dept.code
          })));
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
      } finally {
        setLoadingDepartments(false);
      }
    };

    const fetchAcademicYears = async () => {
      setLoadingAcademicYears(true);
      try {
        const response = await fetch('/api/academic-years');
        if (response.ok) {
          const data = await response.json();
          setAcademicYears(data.map((year: any) => ({
            id: year.id,
            name: year.name,
            startDate: year.startDate,
            endDate: year.endDate,
            isActive: year.isActive
          })));
        }
      } catch (error) {
        console.error('Error fetching academic years:', error);
        toast.error('Failed to load academic years');
      } finally {
        setLoadingAcademicYears(false);
      }
    };

    fetchDepartments();
    fetchAcademicYears();
  }, []);

  // Handle edit mode - fetch department for the course and load courses
  useEffect(() => {
    if (type === "update" && data?.courseId) {
      const fetchDepartmentForCourse = async () => {
        setLoadingEditData(true);
        try {
          // Fetch the course to get its department
          const response = await fetch(`/api/courses/${data.courseId}`);
          if (response.ok) {
            const courseData = await response.json();
            const departmentId = courseData.departmentId || courseData.Department?.departmentId;
            
            if (departmentId) {
              // Set the department ID in the form
              setValue("departmentId", departmentId);
              
              // Load courses for this department and preserve the current course ID
              await handleDepartmentChange(departmentId, data.courseId);
            }
          }
        } catch (error) {
          console.error('Error fetching department for course:', error);
          toast.error('Failed to load department information');
        } finally {
          setLoadingEditData(false);
        }
      };

      fetchDepartmentForCourse();
    }
  }, [type, data?.courseId, setValue]);

  // Handle department change - fetch courses for selected department
  const handleDepartmentChange = async (departmentId: number, preserveCourseId?: number) => {
    setValue("departmentId", departmentId);
    
    // Only reset course selection if not preserving it (i.e., not in edit mode)
    if (!preserveCourseId) {
      setValue("courseId", 0);
    }
    
    if (departmentId === 0) {
      setCourses([]);
      return;
    }

    setLoadingCourses(true);
    try {
      const response = await fetch(`/api/departments/${departmentId}`);
      if (response.ok) {
        const data = await response.json();
        const courseData = data.CourseOffering || [];
        setCourses(courseData.map((course: any) => ({
          id: course.courseId.toString(),
          name: course.courseName,
          code: course.courseCode
        })));
        
        // If preserving course ID (edit mode), set it back after loading courses
        if (preserveCourseId) {
          setValue("courseId", preserveCourseId);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses for selected department');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Draft save/restore/clear logic
  useEffect(() => {
    if (type === "create") {
      const savedDraft = localStorage.getItem("sectionFormDraft");
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setDraftExists(true);
          setDraftTimestamp(draftData.savedAt);
          setShowRestorePrompt(true);
        } catch {
          localStorage.removeItem("sectionFormDraft");
        }
      }
    }
  }, [type]);

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      setError(null);
      const formData = watch();
      const draftData = {
        ...formData,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("sectionFormDraft", JSON.stringify(draftData));
      setDraftSaved(true);
      setDraftExists(true);
      setDraftTimestamp(draftData.savedAt);
      toast.success("Draft saved successfully");
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (err: any) {
      setError(err.message);
      setDraftErrorMessage("Failed to save draft");
      setShowDraftError(true);
      toast.error(err.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleRestoreDraft = () => {
    const savedDraft = localStorage.getItem("sectionFormDraft");
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        reset(draftData);
        setShowRestorePrompt(false);
        setDraftSaved(true);
        setShowDraftRestored(true);
      } catch {
        setDraftErrorMessage("Failed to restore draft");
        setShowDraftError(true);
      }
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem("sectionFormDraft");
    setDraftExists(false);
    setDraftTimestamp(null);
    setDraftSaved(false);
    setShowDraftCleared(true);
  };

  const handleReset = () => {
    if (isDirty) {
      setShowResetConfirm(true);
    } else {
      reset(data || defaultValues);
      setShowResetSuccess(true);
    }
  };

  const handleConfirmReset = () => {
    reset(data || defaultValues);
    setShowResetConfirm(false);
    setShowResetSuccess(true);
  };

  const onSubmit = async (formData: SectionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      console.log("Submitting section data:", formData);

      // Validate required fields before submitting
      if (!formData.sectionName || !formData.courseId || formData.courseId === 0) {
        setError("Please fill in all required fields including selecting a valid course.");
        setIsSubmitting(false);
        return;
      }

      // Remove departmentId from the data sent to API since API doesn't use it
      const { departmentId, ...apiData } = formData;
      console.log("API data (without departmentId):", apiData);
      
      // Debug: Check if we have authentication cookies
      console.log("Document cookies:", document.cookie);

      let response;
      if (type === "create") {
        response = await fetch("/api/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify(apiData),
        });
      } else if (type === "update") {
        // Allow fallback to data.sectionId when id prop is not explicitly passed
        const targetId = id ?? (data as any)?.sectionId ?? (data as any)?.id;
        if (!targetId) {
          setError("Invalid form type or missing section ID");
          toast.error("Invalid form type or missing section ID");
          setIsSubmitting(false);
          return;
        }
        response = await fetch(`/api/sections/${String(targetId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', // Include cookies for authentication
          body: JSON.stringify(apiData),
        });
      } else {
        setError("Invalid form type or missing section ID");
        toast.error("Invalid form type or missing section ID");
        setIsSubmitting(false);
        return;
      }

      if (!response) {
        setError("No response received from server");
        toast.error("No response received from server");
        return;
      }

      if (!response.ok) {
        // First, get the raw response text
        let responseText;
        try {
          responseText = await response.text();
          console.error("Raw response text:", responseText);
        } catch (textError) {
          console.error("Could not read response text:", textError);
          responseText = '';
        }
        
        // Try to parse as JSON
        let errorData;
        try {
          errorData = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          rawResponse: responseText
        });
        
        const errorMessage = errorData?.error || errorData?.details || `Failed to save section (${response.status})`;
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const result = await response.json();
      console.log("Section saved successfully:", result);

      onSuccess?.(result);
      toast.success(type === "create" ? "Section created successfully" : "Section updated successfully");
      localStorage.removeItem("sectionFormDraft");
      onDialogClose?.();
    } catch (err: any) {
      console.error("Form submission error:", err);
      setError(err.message || "An unexpected error occurred");
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDialogClose?.();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft && isDirty) {
          handleSaveDraft();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft) {
          formRef.current?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        event.preventDefault();
        if (!isSubmitting && !isSavingDraft) {
          handleReset();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault();
        if (draftExists && !isSubmitting && !isSavingDraft) {
          handleClearDraft();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, isSavingDraft, isDirty, draftExists]);

  return (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      {/* Draft Restoration Dialog */}
      {showRestorePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Save className="w-5 h-5 text-yellow-600" />
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
              <Button variant="outline" onClick={() => setShowRestorePrompt(false)} className="flex-1 rounded">
                Start Fresh
              </Button>
              <Button onClick={handleRestoreDraft} className="flex-1 bg-yellow-600 hover:bg-yellow-700 rounded">
                Restore Draft
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Info: All fields required */}
      <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded border border-blue-100 text-blue-700 text-sm">
        <Info className="h-4 w-4 text-blue-600" />
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
            <Label htmlFor="sectionName" className="text-sm text-blue-900">
              Section Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sectionName"
              {...register("sectionName")}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.sectionName ? "border-red-500" : ""}`}
              aria-invalid={!!errors.sectionName}
              aria-describedby={errors.sectionName ? "sectionName-error" : undefined}
            />
            {errors.sectionName && (
              <p id="sectionName-error" className="text-sm text-red-600 mt-1">{errors.sectionName.message}</p>
            )}
          </div>
        </div>
      </div>
      {/* Assignment Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Assignment</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="yearLevel" className="text-sm text-blue-900">
              Year Level <span className="text-red-500">*</span>
            </Label>
            <Select value={watch("yearLevel").toString()} onValueChange={(v) => setValue("yearLevel", parseInt(v))} required>
              <SelectTrigger id="yearLevel" className="w-full mt-1 rounded border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select year level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1st Year</SelectItem>
                <SelectItem value="2">2nd Year</SelectItem>
                <SelectItem value="3">3rd Year</SelectItem>
                <SelectItem value="4">4th Year</SelectItem>
              </SelectContent>
            </Select>
            {errors.yearLevel && (
              <p className="text-sm text-red-600 mt-1">{errors.yearLevel.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="departmentId" className="text-sm text-blue-900">
              Department <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={watch("departmentId")?.toString() || "0"} 
              onValueChange={(v) => handleDepartmentChange(parseInt(v))} 
              required
              disabled={loadingDepartments || loadingEditData}
            >
              <SelectTrigger id="departmentId" className="w-full mt-1 rounded border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder={
                  loadingEditData 
                    ? "Loading section data..." 
                    : loadingDepartments 
                      ? "Loading departments..." 
                      : "Select department"
                }>
                  {getDepartmentDisplayName()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Select a department</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.code} - {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && (
              <p className="text-sm text-red-600 mt-1">{errors.departmentId.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="courseId" className="text-sm text-blue-900">
              Course <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={watch("courseId")?.toString() || "0"} 
              onValueChange={(v) => setValue("courseId", parseInt(v))} 
              required
              disabled={loadingCourses || loadingEditData || (watch("departmentId") || 0) === 0}
            >
              <SelectTrigger id="courseId" className="w-full mt-1 rounded border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder={
                  loadingEditData
                    ? "Loading section data..."
                    : (watch("departmentId") || 0) === 0 
                      ? "Select a department first" 
                      : loadingCourses 
                        ? "Loading courses..." 
                        : "Select course"
                }>
                  {getCourseDisplayName()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Select a course</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.courseId && (
              <p className="text-sm text-red-600 mt-1">{errors.courseId.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="academicYear" className="text-sm text-blue-900">
              Academic Year <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={watch("academicYear")} 
              onValueChange={(v) => setValue("academicYear", v)} 
              required
              disabled={loadingAcademicYears}
            >
              <SelectTrigger id="academicYear" className="w-full mt-1 rounded border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder={
                  loadingAcademicYears 
                    ? "Loading academic years..." 
                    : "Select academic year"
                }>
                  {getAcademicYearDisplayName()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.name}>
                    {year.name} {year.isActive ? "(Active)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.academicYear && (
              <p id="academicYear-error" className="text-sm text-red-600 mt-1">{errors.academicYear.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="semester" className="text-sm text-blue-900">
              Semester <span className="text-red-500">*</span>
            </Label>
            <Select value={watch("semester")} onValueChange={(v) => setValue("semester", v as "FIRST_SEMESTER" | "SECOND_SEMESTER" | "THIRD_SEMESTER")} required>
              <SelectTrigger id="semester" className="w-full mt-1 rounded border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIRST_SEMESTER">First Trimester</SelectItem>
                <SelectItem value="SECOND_SEMESTER">Second Trimester</SelectItem>
                <SelectItem value="THIRD_SEMESTER">Third Trimester</SelectItem>
              </SelectContent>
            </Select>
            {errors.semester && (
              <p className="text-sm text-red-600 mt-1">{errors.semester.message}</p>
            )}
          </div>
        </div>
      </div>
      {/* Capacity & Status Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Capacity & Status</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="sectionCapacity" className="text-sm text-blue-900">
              Capacity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sectionCapacity"
              type="number"
              min={1}
              {...register("sectionCapacity", { valueAsNumber: true })}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.sectionCapacity ? "border-red-500" : ""}`}
              aria-invalid={!!errors.sectionCapacity}
              aria-describedby={errors.sectionCapacity ? "sectionCapacity-error" : undefined}
            />
            {errors.sectionCapacity && (
              <p id="sectionCapacity-error" className="text-sm text-red-600 mt-1">{errors.sectionCapacity.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sectionStatus" className="text-sm text-blue-900">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select value={watch("sectionStatus")} onValueChange={(v) => setValue("sectionStatus", v as any)} required>
              <SelectTrigger id="sectionStatus" className="w-full mt-1 rounded border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.sectionStatus && (
              <p className="text-sm text-red-600 mt-1">{errors.sectionStatus.message}</p>
            )}
          </div>
        </div>
      </div>
      {/* Additional Information Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-md font-semibold text-blue-900">Additional Information</h3>
          </div>
        </div>
        <div className="h-px bg-blue-100 w-full mb-4"></div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentEnrollment" className="text-sm text-blue-900">
              Current Enrollment
            </Label>
            <Input
              id="currentEnrollment"
              type="number"
              min={0}
              {...register("currentEnrollment", { valueAsNumber: true })}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.currentEnrollment ? "border-red-500" : ""}`}
              aria-invalid={!!errors.currentEnrollment}
              aria-describedby={errors.currentEnrollment ? "currentEnrollment-error" : undefined}
            />
            {errors.currentEnrollment && (
              <p id="currentEnrollment-error" className="text-sm text-red-600 mt-1">{errors.currentEnrollment.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="scheduleNotes" className="text-sm text-blue-900">
              Schedule Notes
            </Label>
            <Input
              id="scheduleNotes"
              {...register("scheduleNotes")}
              className={`mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 ${errors.scheduleNotes ? "border-red-500" : ""}`}
              placeholder="e.g., Monday-Friday, 8:00 AM - 10:00 AM"
              aria-invalid={!!errors.scheduleNotes}
              aria-describedby={errors.scheduleNotes ? "scheduleNotes-error" : undefined}
            />
            {errors.scheduleNotes && (
              <p id="scheduleNotes-error" className="text-sm text-red-600 mt-1">{errors.scheduleNotes.message}</p>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded">{error}</div>
      )}
      {/* Footer Buttons */}
      <div className="flex items-center justify-end pt-6 border-t border-gray-200 bg-gray-50/50 px-6 py-4 gap-3">
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
        <Button
          variant="outline"
          type="button"
          onClick={handleSaveDraft}
          disabled={isSubmitting || isSavingDraft || !isDirty}
          className={`border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-500 rounded transition-all duration-200 ${draftSaved ? 'bg-green-100 border-green-500 text-green-700 shadow-sm' : ''}`}
        >
          {isSavingDraft ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-spin" />
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
        <Button
          type="submit"
          disabled={isSubmitting || isSavingDraft}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded"
        >
          {isSubmitting
            ? type === "update"
              ? "Saving..."
              : "Saving..."
            : type === "update"
              ? "Update Section"
              : "Create Section"}
        </Button>
      </div>
      {/* Reset/Draft dialogs */}
      {/* Reset Confirm Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md mx-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Confirm Reset</h3>
            <p className="text-gray-700 mb-4">Are you sure you want to reset the form? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowResetConfirm(false)} className="flex-1 rounded">Cancel</Button>
              <Button onClick={handleConfirmReset} className="flex-1 bg-orange-600 hover:bg-orange-700 rounded">Reset Form</Button>
            </div>
          </div>
        </div>
      )}
      {/* Reset Success Dialog */}
      {showResetSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md mx-4 shadow-xl">
            <h3 className="font-semibold text-green-900 mb-2">Form Reset Successfully</h3>
            <p className="text-gray-700 mb-4">All fields have been reset.</p>
            <Button onClick={() => setShowResetSuccess(false)} className="bg-green-600 hover:bg-green-700 text-white rounded">Continue</Button>
          </div>
        </div>
      )}
      {/* Draft Cleared Dialog */}
      {showDraftCleared && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md mx-4 shadow-xl">
            <h3 className="font-semibold text-blue-900 mb-2">Draft Cleared</h3>
            <p className="text-gray-700 mb-4">The saved draft has been removed successfully.</p>
            <Button onClick={() => setShowDraftCleared(false)} className="bg-blue-600 hover:bg-blue-700 text-white rounded">OK</Button>
          </div>
        </div>
      )}
      {/* Draft Restored Dialog */}
      {showDraftRestored && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md mx-4 shadow-xl">
            <h3 className="font-semibold text-green-900 mb-2">Draft Restored</h3>
            <p className="text-gray-700 mb-4">Your saved draft has been restored successfully. You can continue editing from where you left off.</p>
            <Button onClick={() => setShowDraftRestored(false)} className="bg-green-600 hover:bg-green-700 text-white rounded">Continue Editing</Button>
          </div>
        </div>
      )}
      {/* Draft Error Dialog */}
      {showDraftError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md mx-4 shadow-xl">
            <h3 className="font-semibold text-red-900 mb-2">Cannot Save Draft</h3>
            <p className="text-gray-700 mb-4">{draftErrorMessage}</p>
            <Button onClick={() => setShowDraftError(false)} className="bg-red-600 hover:bg-red-700 text-white rounded">OK</Button>
          </div>
        </div>
      )}
    </form>
  );
} 