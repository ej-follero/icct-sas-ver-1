"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Shield, Info, RotateCcw, Save, X, UserCheck, FileText, BadgeInfo, Users, Settings, CheckCircle, AlertCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { roleService, type Role as ApiRole } from "@/lib/services/role.service";

// Define the role schema
const roleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(50, "Role name must be less than 50 characters"),
  description: z.string().optional(),
  permissions: z.array(z.string().min(1, "Permission cannot be empty")).min(1, "At least one permission is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

type FormRole = z.infer<typeof roleSchema>;

interface RoleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update" | "delete" | "view";
  data?: ApiRole;
  id?: string;
  onSuccess?: () => void;
}

// All available permissions (combined from all role types)
const ALL_PERMISSIONS = [
  // User Management
  'View Users', 'Edit Users', 'Delete Users', 'Assign Roles',
  'Manage Super Admins', 'Manage Admin Users', 'User Security Settings',
  
  // Attendance Management
  'View Attendance', 'Edit Attendance', 'Delete Attendance',
  'Override Attendance', 'Verify Attendance', 'Export Attendance',
  
  // Academic Management
  'Manage Courses', 'Manage Departments', 'Manage Subjects',
  'Manage Sections', 'Manage Instructors', 'Manage Students',
  'Manage Rooms', 'Manage Schedules',
  
  // Reports & Analytics
  'View Reports', 'Generate Reports', 'Export Data',
  'View Analytics', 'System Analytics',
  
  // System Administration
  'System Settings', 'Database Management', 'Backup & Restore',
  'Security Settings', 'API Management', 'System Monitoring',
  'Audit Logs', 'Emergency Access',
  
  // RFID Management
  'Manage RFID Tags', 'Manage RFID Readers',
  'View RFID Logs', 'RFID Configuration',
  
  // Communication
  'Send Announcements', 'Manage Communications',
  'Email Management', 'Notification Settings',
  
  // Department Specific
  'Department Management', 'Department Reports', 'Department Users',
];

// Permission categories for better organization
const PERMISSION_CATEGORIES = {
  'User Management': [
    'View Users', 'Edit Users', 'Delete Users', 'Assign Roles',
    'Manage Super Admins', 'Manage Admin Users', 'User Security Settings'
  ],
  'Attendance Management': [
    'View Attendance', 'Edit Attendance', 'Delete Attendance',
    'Override Attendance', 'Verify Attendance', 'Export Attendance'
  ],
  'Academic Management': [
    'Manage Courses', 'Manage Departments', 'Manage Subjects',
    'Manage Sections', 'Manage Instructors', 'Manage Students',
    'Manage Rooms', 'Manage Schedules'
  ],
  'Reports & Analytics': [
    'View Reports', 'Generate Reports', 'Export Data',
    'View Analytics', 'System Analytics'
  ],
  'System Administration': [
    'System Settings', 'Database Management', 'Backup & Restore',
    'Security Settings', 'API Management', 'System Monitoring',
    'Audit Logs', 'Emergency Access'
  ],
  'RFID Management': [
    'Manage RFID Tags', 'Manage RFID Readers', 'View RFID Logs',
    'RFID Configuration'
  ],
  'Communication': [
    'Send Announcements', 'Manage Communications',
    'Email Management', 'Notification Settings'
  ],
  'Department Specific': [
    'Department Management', 'Department Reports', 'Department Users'
  ]
};

const defaultValues: FormRole = {
  name: "",
  description: "",
  permissions: [],
  status: "ACTIVE",
};

export default function RoleForm({ open, onOpenChange, type, data, id, onSuccess }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showSelectAll, setShowSelectAll] = useState(false);

  // Dialog-based notification state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Draft restoration state
  const [showDraftRestoreDialog, setShowDraftRestoreDialog] = useState(false);

  const form = useForm<FormRole>({
    resolver: zodResolver(roleSchema),
    defaultValues: data ? {
      name: data.name,
      description: data.description,
      permissions: data.permissions,
      status: data.status as "ACTIVE" | "INACTIVE" | "ARCHIVED",
    } : defaultValues,
  });

  const { watch, setValue, handleSubmit, reset, formState: { isDirty, errors } } = form;

  // Watch form values for progress calculation
  const watchedValues = watch();

  // Initialize form with data when component mounts or data changes
  useEffect(() => {
    if (data) {
      reset({
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        status: data.status as "ACTIVE" | "INACTIVE" | "ARCHIVED",
      });
      setSelectedPermissions(data.permissions || []);
    } else {
      reset(defaultValues);
      setSelectedPermissions([]);
    }
  }, [data, reset]);

  // Reset form when opening for create mode
  useEffect(() => {
    if (open && type === "create" && !data) {
      reset(defaultValues);
      setSelectedPermissions([]);
    }
  }, [open, type, data, reset]);

  // Handle permission selection
  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newPermissions = checked
      ? [...selectedPermissions, permission]
      : selectedPermissions.filter(p => p !== permission);
    
    setSelectedPermissions(newPermissions);
    setValue('permissions', newPermissions, { shouldValidate: true });
  };

  // Handle select all permissions in a category
  const handleSelectAllInCategory = (category: string, checked: boolean) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
    const otherPermissions = selectedPermissions.filter(p => !categoryPermissions.includes(p));
    
    const newPermissions = checked
      ? [...otherPermissions, ...categoryPermissions]
      : otherPermissions;
    
    setSelectedPermissions(newPermissions);
    setValue('permissions', newPermissions, { shouldValidate: true });
  };

  // Handle select all permissions
  const handleSelectAll = (checked: boolean) => {
    const newPermissions = checked ? ALL_PERMISSIONS : [];
    setSelectedPermissions(newPermissions);
    setValue('permissions', newPermissions, { shouldValidate: true });
  };

  // Check if all permissions in a category are selected
  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
    return categoryPermissions.every(p => selectedPermissions.includes(p));
  };

  // Check if any permissions in a category are selected
  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
    const hasSelected = categoryPermissions.some(p => selectedPermissions.includes(p));
    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));
    return hasSelected && !allSelected;
  };

  const handleRestoreDraft = () => {
    const draft = localStorage.getItem('roleFormDraft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        reset(parsedDraft);
        setSelectedPermissions(parsedDraft.permissions || []);
        setShowDraftRestoreDialog(false);
        toast.success('Draft restored successfully');
      } catch (error) {
        toast.error('Failed to restore draft');
      }
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('roleFormDraft');
    setShowDraftRestoreDialog(false);
    toast.success('Draft discarded');
  };

  const onSubmit = async (formData: FormRole) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (type === "create") {
        // Create new role
        const newRole = await roleService.createRole({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          status: formData.status,
        });
        console.log('Created role:', newRole);
        toast.success('Role created successfully');
      } else if (type === "update" && id) {
        // Update existing role
        const updatedRole = await roleService.updateRole(id, {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          status: formData.status,
        });
        console.log('Updated role:', updatedRole);
        toast.success('Role updated successfully');
      }

      // Clear draft on successful submission
      localStorage.removeItem('roleFormDraft');
      
      setSuccessMessage(type === "create" ? "Role created successfully!" : "Role updated successfully!");
      setShowSuccessDialog(true);
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMsg);
      setErrorMessage(errorMsg);
      setShowErrorDialog(true);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) {
      toast.error('Role ID is required for deletion');
      return;
    }

    setIsSubmitting(true);
    try {
      await roleService.deleteRole(id);
      console.log('Deleted role:', id);
      toast.success('Role deleted successfully');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete role';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (data) {
      reset({
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        status: data.status as "ACTIVE" | "INACTIVE" | "ARCHIVED",
      });
      setSelectedPermissions(data.permissions || []);
    } else {
      reset(defaultValues);
      setSelectedPermissions([]);
    }
    toast.success('Form reset to original values');
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const currentData = form.getValues();
      localStorage.setItem('roleFormDraft', JSON.stringify(currentData));
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Check for existing draft on mount
  useEffect(() => {
    if (open && !data) {
      const draft = localStorage.getItem('roleFormDraft');
      if (draft) {
        setShowDraftRestoreDialog(true);
      }
    }
  }, [open, data]);

  // Progress calculation: count required fields filled
  const requiredFields = [
    watch("name"),
    watch("permissions"),
    watch("status"),
  ];
  const filledCount = requiredFields.filter(
    (val) => {
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== null && val !== "";
    }
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
      <DialogContent className="max-w-4xl w-full bg-white/95 rounded-2xl p-0 border border-blue-100 shadow-2xl transition-all duration-300">
        <DialogHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <DialogTitle asChild>
            <div className="flex items-start gap-4 pr-24">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-xl font-bold text-white mb-1 block">
                  {type === "create" ? "Create New Role" : type === "update" ? "Edit Role" : type === "view" ? "View Role" : "Delete Role"}
                </span>
                <span className="text-blue-100 text-sm block">
                  {type === "create"
                    ? "Add a new role with specific permissions"
                    : type === "update"
                    ? "Update role information and permissions"
                    : type === "view"
                    ? "View role details and permissions"
                    : "Delete this role"}
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              {/* Info Bar */}
              <div className="flex items-center gap-2 p-3 mb-4 bg-blue-50 border border-blue-100 rounded shadow-sm">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">
                  {type === "create" 
                    ? "Create a new role with specific permissions and access levels"
                    : type === "update"
                    ? "Update role information and modify permissions as needed"
                    : "View role details and assigned permissions"
                  }
                </span>
              </div>

              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <BadgeInfo className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter role name"
                            {...field}
                            disabled={type === "view"}
                          />
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
                        <FormLabel>Status *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={type === "view"}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
                      <FormControl>
                        <Textarea
                          placeholder="Enter role description"
                          className="min-h-[80px] rounded"
                          {...field}
                          disabled={type === "view"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Permissions</h3>
                    <Badge variant="secondary" className="ml-2">
                      {selectedPermissions.length} selected
                    </Badge>
                  </div>
                  {type !== "view" && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(true)}
                        disabled={selectedPermissions.length === ALL_PERMISSIONS.length}
                        className="rounded"
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAll(false)}
                        disabled={selectedPermissions.length === 0}
                        className="rounded"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="permissions"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 rounded p-4">
                          {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => (
                            <div key={category} className="space-y-2">
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={isCategoryFullySelected(category)}
                                    indeterminate={isCategoryPartiallySelected(category)}
                                    onCheckedChange={(checked) => 
                                      handleSelectAllInCategory(category, checked as boolean)
                                    }
                                    disabled={type === "view"}
                                  />
                                  <span className="font-medium text-blue-900">{category}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {permissions.filter(p => selectedPermissions.includes(p)).length}/{permissions.length}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                                {permissions.map((permission) => (
                                  <label
                                    key={permission}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={selectedPermissions.includes(permission)}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(permission, checked as boolean)
                                      }
                                      disabled={type === "view"}
                                    />
                                    <span className="text-sm text-blue-700">{permission}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6 border-t border-gray-200">
                {type === "delete" ? (
                  <div className="flex gap-2 w-full">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="w-32 rounded"
                    >
                      {isSubmitting ? "Deleting..." : "Delete"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                      className="w-32 rounded"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <div className="flex gap-2">
                      {type !== "view" && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSaveDraft}
                            disabled={isSavingDraft || !isDirty}
                            className="flex items-center gap-2 rounded"
                          >
                            <Save className="w-4 h-4" />
                            {isSavingDraft ? "Saving..." : "Save Draft"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 rounded"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                        className="rounded"
                      >
                        Cancel
                      </Button>
                      {type !== "view" && (
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center gap-2 rounded"
                        >
                          <Save className="w-4 h-4" />
                          {isSubmitting ? "Saving..." : (type === "create" ? "Create Role" : "Save Changes")}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </DialogFooter>
            </div>
          </form>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Success
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-blue-700">{successMessage}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowSuccessDialog(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Error Dialog */}
        <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Error
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-blue-700">{errorMessage}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowErrorDialog(false)}>OK</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Draft Restore Dialog */}
        <Dialog open={showDraftRestoreDialog} onOpenChange={setShowDraftRestoreDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Restore Draft?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-blue-700">
                A saved draft was found. Would you like to restore it?
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleDiscardDraft}>
                Discard
              </Button>
              <Button onClick={handleRestoreDraft}>Restore</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}