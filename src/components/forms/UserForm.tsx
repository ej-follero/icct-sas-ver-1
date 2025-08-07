"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, User, Mail, Shield, Calendar, Phone, CheckCircle, XCircle, X, Info, RotateCcw, Save } from "lucide-react";
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

// Define the user schema
const userSchema = z.object({
  userName: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "DEPARTMENT_HEAD", "INSTRUCTOR", "STUDENT", "GUARDIAN", "SYSTEM_AUDITOR"]),
  status: z.enum(["active", "inactive", "suspended", "pending", "blocked"]),
  isEmailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
});

type UserFormValues = z.infer<typeof userSchema>;

const defaultValues: UserFormValues = {
  userName: "",
  email: "",
  role: "ADMIN",
  status: "active",
  isEmailVerified: false,
  twoFactorEnabled: false,
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
    if (open && type === "update" && data) {
      console.log("Dialog opened for edit, resetting form with:", data);
      form.reset({
        userName: data.userName,
        email: data.email,
        role: data.role as "SUPER_ADMIN" | "ADMIN" | "DEPARTMENT_HEAD" | "INSTRUCTOR" | "STUDENT" | "GUARDIAN" | "SYSTEM_AUDITOR",
        status: data.status as "active" | "inactive" | "suspended" | "pending" | "blocked",
        isEmailVerified: data.isEmailVerified,
        twoFactorEnabled: data.twoFactorEnabled,
      });
    }
  }, [open, type, data, form]);

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
        ...(type === "create" ? { 
          passwordHash: "temporary_hash_placeholder" // In production, this should be properly hashed
        } : {}),
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save user");
      }
      localStorage.removeItem("userFormDraft");
      setShowDraft(false);
      setShowSuccessDialog(true);
      setSuccessMessage(type === "update" ? "User updated successfully" : "User created successfully");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      setShowErrorDialog(true);
      setErrorMessage(error.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  // Progress calculation: count required fields filled
  const requiredFields = [
    form.watch("userName"),
    form.watch("email"),
    form.watch("role"),
    form.watch("status"),
  ];
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
          <Form {...form}>
            <div className="space-y-6">
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
            </div>
          </Form>
        </div>
        <DialogFooter className="flex items-center justify-end pt-4 border-t border-blue-100 bg-blue-50/50 px-6 py-4 mt-2 rounded-b-2xl">
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
            <Tooltip>
              <TooltipTrigger asChild>
                                 <Button
                   type="button"
                   disabled={loading || isSavingDraft}
                   onClick={form.handleSubmit(onSubmit)}
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
          </TooltipProvider>
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
  );
} 