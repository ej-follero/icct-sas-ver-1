"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  FormHelperText,
  CircularProgress,
  Divider,
  Autocomplete,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import InfoIcon from '@mui/icons-material/Info';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CloseIcon from '@mui/icons-material/Close';

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
    totalSections: z.number()
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
  onSuccess 
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
          const response = await fetch('/api/courses');
          if (!response.ok) {
            throw new Error('Failed to fetch courses');
          }
          const data = await response.json();
          setCourses(data);
        } catch (error) {
          console.error('Error fetching courses:', error);
          toast.error('Failed to fetch courses');
        } finally {
          setLoading(false);
        }
      };

      fetchCourses();
    }
  }, [open]);

  // Auto-focus Department Name
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

  // Watch code field for real-time validation
  useEffect(() => {
    if (!isEdit) {
      const sub = form.watch((value, { name }) => {
        if (name === 'code') {
          checkCodeExists(value.code || '');
        }
      });
      return () => sub.unsubscribe();
    }
  }, [form, isEdit]);

  // Save as Draft
  const handleSaveDraft = () => {
    const values = form.getValues();
    localStorage.setItem('departmentFormDraft', JSON.stringify(values));
    setDraftSaved(true);
    toast.success('Draft saved!');
  };

  // Restore draft if present
  useEffect(() => {
    if (open && !isEdit) {
      const draft = localStorage.getItem('departmentFormDraft');
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
        courseOfferings: data.courseOfferings.map(course => ({
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
    <Dialog 
      open={open} 
      onClose={() => onOpenChange(false)} 
      maxWidth="md" 
      fullWidth 
      PaperProps={{ 
        sx: { 
          borderRadius: 2,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          bgcolor: 'background.paper',
          overflow: 'hidden'
        } 
      }}
    >
      {/* Form Header */}
      <Box sx={{ 
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        p: 3,
        position: 'relative'
      }}>
        <Typography variant="h5" fontWeight={600}>
          {isEdit ? 'Edit Department' : 'Add New Department'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
          {isEdit ? 'Update department information and settings' : 'Create a new department with its details'}
        </Typography>
        <IconButton 
          aria-label="close" 
          onClick={() => onOpenChange(false)}
          sx={{ 
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'primary.contrastText',
            '&:hover': { 
              bgcolor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Box component="form" onSubmit={form.handleSubmit(onSubmit)} sx={{ mt: 0, display: 'flex', flexDirection: 'column', gap: 3, p: 3 }}>
          {/* Error Summary */}
          {showErrorSummary && hasErrors && (
            <Paper 
              elevation={0} 
              sx={{ 
                mb: 2, 
                p: 2, 
                bgcolor: 'error.light', 
                color: 'error.contrastText', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'error.main'
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">Please fix the following errors:</Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {Object.entries(form.formState.errors).map(([field, error]) => (
                  <li key={field}><Typography variant="body2">{(error as any).message}</Typography></li>
                ))}
              </ul>
            </Paper>
          )}
          {/* Basic Info Section */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, bgcolor: 'primary.50', p: 1.5, borderRadius: 1 }}>
              <InfoIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>Basic Information</Typography>
            </Box>
            <TextField
              fullWidth
              inputRef={nameInputRef}
              label={<span>Department Name <span style={{ color: 'error.main' }}>*</span></span>}
              placeholder="e.g. Computer Science"
              {...form.register("name", { required: true })}
              error={!!form.formState.errors.name}
              helperText={form.formState.errors.name?.message || <span style={{ color: 'text.secondary' }}>Enter the department name.</span>}
              margin="normal"
              sx={{ mb: 2 }}
              inputProps={{ 'aria-label': 'Department Name' }}
            />
            <Tooltip title="A unique code for this department (e.g. CS for Computer Science)" arrow>
              <TextField
                fullWidth
                label={<span>Department Code <span style={{ color: 'error.main' }}>*</span></span>}
                placeholder="e.g. CS"
                {...form.register("code", { required: true })}
                error={!!form.formState.errors.code || codeExists}
                helperText={
                  form.formState.errors.code?.message ||
                  (codeExists ? 'Department code already exists.' : <span style={{ color: 'text.secondary' }}>Enter a unique department code.</span>)
                }
                margin="normal"
                disabled={isEdit}
                sx={{ mb: 2 }}
                inputProps={{ 'aria-label': 'Department Code' }}
                InputProps={{
                  endAdornment: checkingCode && !isEdit ? <CircularProgress size={18} /> : null
                }}
              />
            </Tooltip>
            <TextField
              fullWidth
              label="Description"
              placeholder="Brief description of the department (optional)"
              {...form.register("description")}
              error={!!form.formState.errors.description}
              helperText={form.formState.errors.description?.message || <span style={{ color: 'text.secondary' }}>Describe the department.</span>}
              margin="normal"
              multiline
              rows={3}
              sx={{ mb: 1 }}
            />
          </Paper>
          {/* Head of Department Section */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, bgcolor: 'success.50', p: 1.5, borderRadius: 1 }}>
              <SupervisorAccountIcon color="success" />
              <Typography variant="h6" fontWeight={600}>Department Head</Typography>
            </Box>
            <FormControl fullWidth margin="normal" error={!!form.formState.errors.headOfDepartment}>
              <InputLabel>Head of Department <span style={{ color: 'error.main' }}>*</span></InputLabel>
              <Select
                label="Head of Department *"
                value={form.watch("headOfDepartment")}
                onChange={(e) => form.setValue("headOfDepartment", e.target.value)}
                sx={{ borderRadius: 1 }}
              >
                {instructors.map((instructor) => (
                  <MenuItem key={instructor.id} value={instructor.name}>
                    {instructor.name}
                  </MenuItem>
                ))}
              </Select>
              {form.formState.errors.headOfDepartment && (
                <FormHelperText>{form.formState.errors.headOfDepartment.message}</FormHelperText>
              )}
            </FormControl>
          </Paper>
          {/* Course Offerings Section */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, bgcolor: 'secondary.50', p: 1.5, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={600}>Course Offerings</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Select courses to be offered by this department
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : courses.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, mt: 1 }}>
                <FormControl fullWidth disabled>
                  <InputLabel>Course Offerings</InputLabel>
                  <Select value="" label="Course Offerings" sx={{ bgcolor: 'action.disabledBackground' }}>
                    <MenuItem value="">No courses available</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                  No available courses. <b>Please add courses first.</b>
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  sx={{ mt: 1 }}
                  href="/dashboard/courses"
                  target="_blank"
                  rel="noopener"
                >
                  Add Courses
                </Button>
              </Box>
            ) : (
              <Autocomplete
                options={courses.filter(course => !(form.watch("courseOfferings") || []).some((c: Course) => c.id === course.id))}
                getOptionLabel={(option) => `${option.name} (${option.code})`}
                onChange={(_, value) => {
                  if (value) {
                    const currentCourses = form.getValues("courseOfferings") || [];
                    form.setValue("courseOfferings", [...currentCourses, value]);
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Add Course" placeholder="Search courses..." />
                )}
                sx={{ mb: 2 }}
              />
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {(form.watch("courseOfferings") || []).map((course: Course) => (
                <Chip
                  key={course.id}
                  label={`${course.name} (${course.code})`}
                  onDelete={() => {
                    const currentCourses = form.getValues("courseOfferings") || [];
                    form.setValue(
                      "courseOfferings",
                      currentCourses.filter((c: Course) => c.id !== course.id)
                    );
                  }}
                  sx={{
                    backgroundColor: 'secondary.50',
                    color: 'secondary.dark',
                    fontWeight: 500,
                    borderRadius: 1,
                    '& .MuiChip-deleteIcon': {
                      color: 'secondary.dark',
                      '&:hover': {
                        color: 'error.main',
                      },
                    },
                  }}
                />
              ))}
            </Box>
            {(!form.watch("courseOfferings") || form.watch("courseOfferings").length === 0) && !loading && courses.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No courses selected. Use the search above to add courses.
              </Typography>
            )}
            {form.formState.errors.courseOfferings && (
              <FormHelperText error>
                {form.formState.errors.courseOfferings.message}
              </FormHelperText>
            )}
          </Paper>
          {/* Status Section */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, bgcolor: 'warning.50', p: 1.5, borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={600}>Status</Typography>
            </Box>
            <FormControl fullWidth margin="normal" error={!!form.formState.errors.status}>
              <InputLabel>Status <span style={{ color: 'error.main' }}>*</span></InputLabel>
              <Select
                label="Status *"
                value={form.watch("status")}
                onChange={(e) => form.setValue("status", e.target.value as "active" | "inactive")}
                sx={{ borderRadius: 1 }}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
              {form.formState.errors.status && (
                <FormHelperText>{form.formState.errors.status.message}</FormHelperText>
              )}
            </FormControl>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 2 }}>
        <Button 
          onClick={handleCancel} 
          variant="outlined" 
          color="inherit"
          sx={{ 
            borderRadius: 1,
            fontWeight: 500,
            minWidth: 120,
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'text.primary',
              bgcolor: 'action.hover'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={form.handleSubmit(onSubmit)}
          disabled={form.formState.isSubmitting || loading}
          sx={{ 
            borderRadius: 1,
            fontWeight: 600,
            minWidth: 180,
            boxShadow: 1,
            '&:hover': {
              boxShadow: 2
            }
          }}
          startIcon={isEdit ? <ListAltIcon /> : <ListAltIcon />}
        >
          {isEdit ? "Update" : "Add"} Department
        </Button>
        {!isEdit && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleSaveDraft}
            sx={{ borderRadius: 1, fontWeight: 500, minWidth: 140 }}
          >
            Save as Draft
          </Button>
        )}
      </DialogActions>
      <Dialog open={showCancelConfirm} onClose={() => setShowCancelConfirm(false)}>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to discard your changes?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelConfirm(false)}>No</Button>
          <Button color="error" onClick={confirmCancel}>Yes, Discard</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
} 