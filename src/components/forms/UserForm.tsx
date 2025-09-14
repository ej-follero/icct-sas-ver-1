"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, Calendar, Phone, CheckCircle, XCircle, X, Info, RotateCcw, Save, GraduationCap, School, Building2, Users, ChevronRight, ChevronLeft } from "lucide-react";
import { User as UserType } from "@/types/users-list";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

interface User extends UserType {}

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update";
  data?: User;
  id?: string;
  onSuccess?: () => void;
}

// Enhanced user schema with role-specific fields
const userSchema = z.object({
  // Basic user fields
  userName: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "DEPARTMENT_HEAD", "INSTRUCTOR", "STUDENT", "GUARDIAN", "SYSTEM_AUDITOR"]),
  status: z.enum(["active", "inactive", "suspended", "pending", "blocked"]),
  isEmailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  
  // Personal information
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  suffix: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  address: z.string().optional(),
  
  // Role-specific fields aligned to schema
  // Instructor
  instructorType: z.enum(["FULL_TIME", "PART_TIME"]).optional(),
  departmentId: z.number().optional(),
  officeLocation: z.string().optional(),
  officeHours: z.string().optional(),
  specialization: z.string().optional(),
  employeeId: z.string().optional(),
  
  // Student
  studentIdNum: z.string().optional(),
  studentType: z.enum(["REGULAR", "IRREGULAR"]).optional(),
  yearLevel: z.enum(["FIRST_YEAR", "SECOND_YEAR", "THIRD_YEAR", "FOURTH_YEAR"]).optional(),
  courseId: z.number().optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  guardianId: z.number().optional(),
  
  // Guardian
  guardianType: z.enum(["PARENT", "GUARDIAN"]).optional(),
  occupation: z.string().optional(),
  workplace: z.string().optional(),
  emergencyContact: z.string().optional(),
  relationshipToStudent: z.string().optional(),
  
  // RFID and system fields
  rfidTag: z.string().optional(),
}).refine((data) => {
  // Instructor required by schema: middleName (non-null), rfidTag, employeeId, instructorType, departmentId
  if (data.role === "INSTRUCTOR") {
    return !!(data.instructorType && data.departmentId && data.employeeId && (data.middleName !== undefined) && (data.rfidTag && data.rfidTag.length > 0));
  }
  // Student required: studentIdNum, studentType, yearLevel, (courseId can be null), address, email, phoneNumber, rfidTag
  if (data.role === "STUDENT") {
    return !!(data.studentIdNum && data.studentType && data.yearLevel && (data.address && data.address.length > 0) && (data.rfidTag && data.rfidTag.length > 0));
  }
  // Guardian required: guardianType, relationshipToStudent
  if (data.role === "GUARDIAN") {
    return !!(data.guardianType && data.relationshipToStudent);
  }
  return true;
}, {
  message: "Please fill in all required fields for the selected role",
  path: ["role"]
});

type UserFormValues = z.infer<typeof userSchema>;

const defaultValues: UserFormValues = {
  userName: "",
  email: "",
  role: "ADMIN",
  status: "active",
  isEmailVerified: false,
  twoFactorEnabled: false,
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  phoneNumber: "",
  gender: "MALE",
  address: "",
  instructorType: undefined,
  departmentId: undefined,
  officeLocation: "",
  officeHours: "",
  specialization: "",
  employeeId: "",
  studentIdNum: "",
  studentType: undefined,
  yearLevel: undefined,
  courseId: undefined,
  birthDate: "",
  nationality: "",
  guardianId: undefined,
  guardianType: undefined,
  occupation: "",
  workplace: "",
  emergencyContact: "",
  relationshipToStudent: "",
  rfidTag: "",
};

export function UserForm({ open, onOpenChange, type, data, id, onSuccess }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftExists, setDraftExists] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState<Array<{departmentId: number, departmentName: string}>>([]);
  const [courses, setCourses] = useState<Array<{courseId: number, courseName: string}>>([]);
  const [guardians, setGuardians] = useState<Array<{guardianId: number, firstName: string, lastName: string}>>([]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: data ? {
      userName: data.userName,
      email: data.email,
      role: data.role as "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_HEAD" | "INSTRUCTOR" | "STUDENT" | "GUARDIAN" | "SYSTEM_AUDITOR",
      status: data.status as "active" | "inactive" | "suspended" | "pending" | "blocked",
      isEmailVerified: data.isEmailVerified,
      twoFactorEnabled: data.twoFactorEnabled,
    } : defaultValues,
    mode: "onTouched",
  });

  // Reset form when data changes (for edit mode)
  useEffect(() => {
    if (open && data && type === "update") {
      console.log("Resetting form with data:", data);
      form.reset({
        userName: data.userName,
        email: data.email,
        role: data.role as "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_HEAD" | "INSTRUCTOR" | "STUDENT" | "GUARDIAN" | "SYSTEM_AUDITOR",
        status: data.status as "active" | "inactive" | "suspended" | "pending" | "blocked",
        isEmailVerified: data.isEmailVerified,
        twoFactorEnabled: data.twoFactorEnabled,
      });
    }
  }, [open, data, type, form]);

  // Reset form when dialog opens for edit mode
  useEffect(() => {
    if (open) {
      if (type === "update" && data) {
        console.log("Dialog opened for edit, resetting form with:", data);
        form.reset({
          userName: data.userName,
          email: data.email,
          role: data.role as "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_HEAD" | "INSTRUCTOR" | "STUDENT" | "GUARDIAN" | "SYSTEM_AUDITOR",
          status: data.status as "active" | "inactive" | "suspended" | "pending" | "blocked",
          isEmailVerified: data.isEmailVerified,
          twoFactorEnabled: data.twoFactorEnabled,
          firstName: data.fullName?.split(' ')[0] || "",
          lastName: data.fullName?.split(' ').slice(-1)[0] || "",
          middleName: data.fullName?.split(' ').slice(1, -1).join(' ') || "",
          phoneNumber: "",
          gender: "MALE",
          address: "",
        });
      } else if (type === "create") {
        // Reset to step 1 for create mode
        setCurrentStep(1);
        form.reset(defaultValues);
      }
    }
  }, [open, type, data, form]);

  // Fetch reference data when form opens
  useEffect(() => {
    if (open) {
      fetchDepartments();
      fetchCourses();
      fetchGuardians();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchGuardians = async () => {
    try {
      const response = await fetch('/api/guardians');
      if (response.ok) {
        const data = await response.json();
        setGuardians(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch guardians:', error);
    }
  };

  // Step management
  const getTotalSteps = () => {
    const role = form.watch("role");
    if (role === "INSTRUCTOR" || role === "STUDENT" || role === "GUARDIAN") {
      return 3; // Basic info + Personal info + Role-specific info
    }
    return 2; // Basic info + Personal info
  };

  const canGoToNextStep = () => {
    const currentValues = form.getValues();
    if (currentStep === 1) {
      return currentValues.userName && currentValues.email && currentValues.role && currentValues.status;
    }
    if (currentStep === 2) {
      return currentValues.firstName && currentValues.lastName && currentValues.phoneNumber && currentValues.gender;
    }
    return true;
  };

  const handleNextStep = () => {
    if (canGoToNextStep() && currentStep < getTotalSteps()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Draft logic (localStorage, etc.)
  useEffect(() => {
    if (open && type === "create") {
      const savedDraft = localStorage.getItem("userFormDraft");
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setDraftExists(true);
          setDraftTimestamp(draftData.savedAt || null);
          setShowDraftRestoreDialog(true);
        } catch {}
      }
    }
  }, [open, type]);

  const handleRestoreDraft = () => {
    const savedDraft = localStorage.getItem("userFormDraft");
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        form.reset(draftData);
        setShowDraftRestoreDialog(false);
        setShowDraft(true);
      } catch {}
    }
  };
  const handleDiscardDraft = () => {
    localStorage.removeItem("userFormDraft");
    setShowDraftRestoreDialog(false);
    setShowDraft(false);
    setDraftExists(false);
    setDraftTimestamp(null);
  };
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    const formData = form.getValues();
    const draftData = {
      ...formData,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("userFormDraft", JSON.stringify(draftData));
    setTimeout(() => {
      setIsSavingDraft(false);
      setShowDraft(true);
      toast.success("Draft saved");
    }, 500);
  };

  const handleReset = () => {
    form.reset(data ? {
      userName: data.userName,
      email: data.email,
      role: data.role as "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_HEAD" | "INSTRUCTOR" | "STUDENT" | "GUARDIAN" | "SYSTEM_AUDITOR",
      status: data.status as "active" | "inactive" | "suspended" | "pending" | "blocked",
      isEmailVerified: data.isEmailVerified,
      twoFactorEnabled: data.twoFactorEnabled,
    } : defaultValues);
  };

  const onSubmit = async (values: UserFormValues) => {
    setLoading(true);
    try {
      const url = data ? `/api/users/${data.id}` : "/api/users";
      const method = data ? "PATCH" : "POST";
      
      // Prepare the data for the API
      const apiData = {
        ...values,
        fullName: `${values.firstName} ${values.middleName ? values.middleName + ' ' : ''}${values.lastName}${values.suffix ? ' ' + values.suffix : ''}`.trim(),
        ...(type === "create" ? { 
          passwordHash: "temporary_hash_placeholder" // In production, this should be properly hashed
        } : {}),
      };
      
      // For create mode, we need to create both User and role-specific records
      if (type === "create") {
        // Create user and role-specific record in one transaction
        const createResponse = await fetch("/api/users/create-with-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });
        
        if (!createResponse.ok) {
          let errorMessage = 'Failed to create user';
          try {
            const err = await createResponse.json();
            errorMessage = err?.error || errorMessage;
          } catch {}
          throw new Error(errorMessage);
        }
      } else {
        // Update mode - just update the user
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update user");
        }
        
        // Update role-specific record as well (IDs align to userId per schema)
        if (data) {
          if (values.role === "INSTRUCTOR") {
            const instructorPayload = {
              email: values.email,
              phoneNumber: values.phoneNumber,
              firstName: values.firstName,
              middleName: values.middleName ?? null,
              lastName: values.lastName,
              suffix: values.suffix ?? null,
              gender: values.gender,
              instructorType: values.instructorType,
              departmentId: values.departmentId,
              officeLocation: values.officeLocation ?? null,
              officeHours: values.officeHours ?? null,
              specialization: values.specialization ?? null,
              employeeId: values.employeeId,
              rfidTag: values.rfidTag,
            };
            const iRes = await fetch(`/api/instructors/${data.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(instructorPayload),
            });
            if (!iRes.ok) {
              const err = await iRes.json().catch(() => ({}));
              throw new Error(err.error || 'Failed to update instructor');
            }
          }
          if (values.role === "STUDENT") {
            const studentPayload = {
              studentIdNum: values.studentIdNum,
              email: values.email,
              phoneNumber: values.phoneNumber,
              firstName: values.firstName,
              middleName: values.middleName ?? null,
              lastName: values.lastName,
              suffix: values.suffix ?? null,
              address: values.address ?? '',
              gender: values.gender,
              birthDate: values.birthDate || null,
              nationality: values.nationality ?? null,
              studentType: values.studentType,
              yearLevel: values.yearLevel,
              courseId: values.courseId,
              guardianId: values.guardianId ?? null,
              rfidTag: values.rfidTag,
            };
            const sRes = await fetch(`/api/students/${data.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(studentPayload),
            });
            if (!sRes.ok) {
              const err = await sRes.json().catch(() => ({}));
              throw new Error(err.error || 'Failed to update student');
            }
          }
          if (values.role === "GUARDIAN") {
            const guardianPayload = {
              email: values.email,
              phoneNumber: values.phoneNumber,
              firstName: values.firstName,
              middleName: values.middleName ?? null,
              lastName: values.lastName,
              suffix: values.suffix ?? null,
              address: values.address ?? '',
              gender: values.gender,
              guardianType: values.guardianType,
              occupation: values.occupation ?? null,
              workplace: values.workplace ?? null,
              emergencyContact: values.emergencyContact ?? null,
              relationshipToStudent: values.relationshipToStudent,
            };
            const gRes = await fetch(`/api/guardians/${data.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(guardianPayload),
            });
            if (!gRes.ok) {
              const err = await gRes.json().catch(() => ({}));
              throw new Error(err.error || 'Failed to update guardian');
            }
          }
        }
      }
      
      localStorage.removeItem("userFormDraft");
      setShowDraft(false);
      setShowSuccessDialog(true);
      setSuccessMessage(type === "update" ? "User updated successfully" : "User created successfully");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const message = error?.message || "Failed to save user";
      if (message.toLowerCase().includes('email') && message.toLowerCase().includes('exists')) {
        form.setError('email', { type: 'server', message: 'Email already exists' });
      }
      if (message.toLowerCase().includes('instructor') && message.toLowerCase().includes('rfid')) {
        form.setError('rfidTag', { type: 'server', message: 'RFID tag is required for instructors' });
      }
      if (message.toLowerCase().includes('student') && message.toLowerCase().includes('address')) {
        form.setError('address', { type: 'server', message: 'Address is required for students' });
      }
      setShowErrorDialog(true);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Progress calculation: count required fields filled
  const getRequiredFields = () => {
    const role = form.watch("role");
    const baseFields = [
      form.watch("userName"),
      form.watch("email"),
      form.watch("role"),
      form.watch("status"),
      form.watch("firstName"),
      form.watch("lastName"),
      form.watch("phoneNumber"),
      form.watch("gender"),
    ];
    
    if (role === "INSTRUCTOR") {
      return [...baseFields, form.watch("instructorType"), form.watch("departmentId"), form.watch("employeeId")];
    }
    if (role === "STUDENT") {
      return [...baseFields, form.watch("studentIdNum"), form.watch("studentType"), form.watch("yearLevel"), form.watch("courseId")];
    }
    if (role === "GUARDIAN") {
      return [...baseFields, form.watch("guardianType"), form.watch("relationshipToStudent")];
    }
    
    return baseFields;
  };
  
  const requiredFields = getRequiredFields();
  const filledCount = requiredFields.filter(
    (val) => val !== undefined && val !== null && val !== ""
  ).length;
  const progress = Math.round((filledCount / requiredFields.length) * 100);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (!loading && !isSavingDraft && form.formState.isDirty) {
          handleSaveDraft();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (!loading && !isSavingDraft) {
          handleReset();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!loading && !isSavingDraft) {
          form.handleSubmit(onSubmit)();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, isSavingDraft, form.formState.isDirty, handleSaveDraft, handleReset, form, onSubmit]);

  if (!open) return null;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full bg-white/95 rounded-2xl p-0 border border-blue-100 shadow-2xl transition-all duration-300">
          <DialogHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
            <DialogTitle asChild>
              <div className="flex items-start gap-4 pr-24">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <span className="text-xl font-bold text-white mb-1 block">
                    {type === "create" ? "Create New User" : "Edit User"}
                  </span>
                  <span className="text-blue-100 text-sm block">
                    {type === "create"
                      ? "Add a new user to the system"
                      : "Update user information"}
                  </span>
                  {/* Step Indicator */}
                  {type === "create" && (
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3].map((step) => (
                        <div key={step} className="flex items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            step <= currentStep 
                              ? 'bg-white text-blue-600' 
                              : 'bg-white/20 text-white'
                          }`}>
                            {step}
                          </div>
                          {step < getTotalSteps() && (
                            <div className={`w-8 h-0.5 mx-1 ${
                              step < currentStep ? 'bg-white' : 'bg-white/20'
                            }`} />
                          )}
                        </div>
                      ))}
                      <span className="text-blue-100 text-xs ml-2">
                        Step {currentStep} of {getTotalSteps()}
                      </span>
                    </div>
                  )}
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
          <div className="max-h-[70vh] overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
            <Form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Provide onSubmit at Form level to avoid nested forms */}
              <div className="space-y-6">
                {/* Info Bar */}
                <div className="flex items-center gap-2 p-3 mb-4 bg-blue-50 border border-blue-100 rounded shadow-sm">
                  <Info className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 text-sm">
                    All fields marked with <span className="font-bold">*</span> are required
                  </span>
                </div>
                
                {/* Step 1: Basic Information */}
                {(type === "update" || currentStep === 1) && (
                  <div className="p-0 space-y-6">
                    <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-blue-500" />
                        <h3 className="text-md font-semibold text-blue-900">Basic Information</h3>
                      </div>
                      <div className="h-px bg-blue-100 w-full mb-4"></div>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="userName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter username" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="Enter email address" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={field.onChange} required>
                                    <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                      <SelectItem value="ADMIN">Admin</SelectItem>
                                      <SelectItem value="DEPARTMENT_HEAD">Department Head</SelectItem>
                                      <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                                      <SelectItem value="STUDENT">Student</SelectItem>
                                      <SelectItem value="GUARDIAN">Guardian</SelectItem>
                                      <SelectItem value="SYSTEM_AUDITOR">System Auditor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={field.onChange} required>
                                    <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                      <SelectItem value="suspended">Suspended</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="blocked">Blocked</SelectItem>
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
                    
                    {/* Verification Settings Section */}
                    <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <h3 className="text-md font-semibold text-blue-900">Verification Settings</h3>
                      </div>
                      <div className="h-px bg-blue-100 w-full mb-4"></div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="isEmailVerified"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-medium text-gray-700">
                                    Email Verified
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="twoFactorEnabled"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-medium text-gray-700">
                                    Two-Factor Auth
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Personal Information */}
                {(type === "update" || currentStep >= 2) && (
                  <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-blue-500" />
                      <h3 className="text-md font-semibold text-blue-900">Personal Information</h3>
                    </div>
                    <div className="h-px bg-blue-100 w-full mb-4"></div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter first name" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter last name" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="middleName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Middle Name</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter middle name (optional)" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="suffix"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Suffix</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Jr., Sr., III" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter phone number" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange} required>
                                  <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MALE">Male</SelectItem>
                                    <SelectItem value="FEMALE">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter address" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
                
                {/* Step 3: Role-Specific Information */}
                {(type === "update" || currentStep >= 3) && (
                  <div className="space-y-6">
                    {/* Instructor-specific fields */}
                    {form.watch("role") === "INSTRUCTOR" && (
                      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <GraduationCap className="w-5 h-5 text-blue-500" />
                          <h3 className="text-md font-semibold text-blue-900">Instructor Information</h3>
                        </div>
                        <div className="h-px bg-blue-100 w-full mb-4"></div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="instructorType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Instructor Type <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Select value={field.value || ""} onValueChange={field.onChange} required>
                                      <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                        <SelectValue placeholder="Select instructor type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="departmentId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Select value={field.value?.toString() || ""} onValueChange={(value) => field.onChange(parseInt(value))} required>
                                      <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                        <SelectValue placeholder="Select department" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {departments
                                          .filter((dept) => dept && typeof dept.departmentId === 'number')
                                          .map((dept) => (
                                            <SelectItem key={dept.departmentId} value={String(dept.departmentId)}>
                                              {dept.departmentName}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="employeeId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Employee ID <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter employee ID" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="rfidTag"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>RFID Tag</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter RFID tag number" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="officeLocation"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Office Location</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter office location" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="officeHours"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Office Hours</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Mon-Fri 9AM-5PM" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="specialization"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Specialization</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter specialization or expertise" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Student-specific fields */}
                    {form.watch("role") === "STUDENT" && (
                      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <School className="w-5 h-5 text-blue-500" />
                          <h3 className="text-md font-semibold text-blue-900">Student Information</h3>
                        </div>
                        <div className="h-px bg-blue-100 w-full mb-4"></div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="studentIdNum"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Student ID Number <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter student ID number" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="studentType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Student Type <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Select value={field.value || ""} onValueChange={field.onChange} required>
                                      <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                        <SelectValue placeholder="Select student type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="REGULAR">Regular</SelectItem>
                                        <SelectItem value="IRREGULAR">Irregular</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="yearLevel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Year Level <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Select value={field.value || ""} onValueChange={field.onChange} required>
                                      <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                        <SelectValue placeholder="Select year level" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="FIRST_YEAR">First Year</SelectItem>
                                        <SelectItem value="SECOND_YEAR">Second Year</SelectItem>
                                        <SelectItem value="THIRD_YEAR">Third Year</SelectItem>
                                        <SelectItem value="FOURTH_YEAR">Fourth Year</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="courseId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Course <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Select value={field.value?.toString() || ""} onValueChange={(value) => field.onChange(parseInt(value))} required>
                                      <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                        <SelectValue placeholder="Select course" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {courses
                                          .filter((course) => course && typeof course.courseId === 'number')
                                          .map((course) => (
                                            <SelectItem key={course.courseId} value={String(course.courseId)}>
                                              {course.courseName}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="birthDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Birth Date</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="date" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="nationality"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nationality</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter nationality" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="rfidTag"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>RFID Tag</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter RFID tag number" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="guardianId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Guardian</FormLabel>
                                  <FormControl>
                                    <Select value={field.value?.toString() || ""} onValueChange={(value) => field.onChange(parseInt(value))}>
                                      <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                        <SelectValue placeholder="Select guardian" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {guardians
                                          .filter((g) => g && typeof g.guardianId === 'number')
                                          .map((guardian) => (
                                            <SelectItem key={guardian.guardianId} value={String(guardian.guardianId)}>
                                              {guardian.firstName} {guardian.lastName}
                                            </SelectItem>
                                          ))}
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
                    )}
                    
                    {/* Guardian-specific fields */}
                    {form.watch("role") === "GUARDIAN" && (
                      <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5 text-blue-500" />
                          <h3 className="text-md font-semibold text-blue-900">Guardian Information</h3>
                        </div>
                        <div className="h-px bg-blue-100 w-full mb-4"></div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="guardianType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Guardian Type <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Select value={field.value || ""} onValueChange={field.onChange} required>
                                      <SelectTrigger className="focus:ring-blue-300 focus:border-blue-300 rounded">
                                        <SelectValue placeholder="Select guardian type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PARENT">Parent</SelectItem>
                                        <SelectItem value="GUARDIAN">Guardian</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="relationshipToStudent"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Relationship to Student <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Father, Mother, Legal Guardian" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="occupation"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Occupation</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter occupation" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="workplace"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Workplace</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Enter workplace" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="emergencyContact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Emergency Contact</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter emergency contact number" className="focus:ring-blue-300 focus:border-blue-300 rounded" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Form>
          </div>
          <DialogFooter className="flex items-center justify-between pt-4 border-t border-blue-100 bg-blue-50/50 px-6 py-4 mt-2 rounded-b-2xl">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleReset}
                      disabled={loading || !form.formState.isDirty}
                      className="w-32 border border-blue-300 text-blue-500 rounded"
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
                      disabled={loading || isSavingDraft || !form.formState.isDirty}
                      className={`w-32 border border-blue-300 text-blue-500 rounded ${isSavingDraft ? 'opacity-70' : ''}`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSavingDraft ? 'Saving...' : 'Save Draft'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save current progress as draft (Ctrl+S)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-center gap-2">
              {type === "create" && currentStep > 1 && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={handlePrevStep}
                  disabled={loading}
                  className="w-32 border border-blue-300 text-blue-500 rounded"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              {type === "create" && currentStep < getTotalSteps() ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading || !canGoToNextStep()}
                  className="w-32 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      disabled={loading || isSavingDraft}
                      className="w-32 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      {loading
                        ? (type === "update" ? "Saving..." : "Saving...")
                        : (type === "update" ? "Update User" : "Create User")}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{type === "update" ? "Update user (Ctrl+Enter)" : "Create user (Ctrl+Enter)"}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
        {/* Success Dialog */}
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
        {/* Error Dialog */}
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
                    <User className="w-5 h-5 text-yellow-600" />
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
    </TooltipProvider>
  );
} 