"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button, TextField, FormControl, Select, MenuItem, FormHelperText } from "@mui/material";
import { 
  School as SchoolIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

// Define the course schema
const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  code: z.string().min(1, "Course code is required"),
  department: z.string().min(1, "Department is required"),
  description: z.string().optional(),
  units: z.number().min(1, "Units must be at least 1"),
  status: z.enum(["active", "inactive"]),
});

type Course = z.infer<typeof courseSchema>;

interface CourseFormProps {
  type: "create" | "update" | "delete";
  data?: Course;
  id?: string;
}

// Mock data for departments - replace with actual API call later
const departments = [
  { id: "1", name: "College of Information Technology" },
  { id: "2", name: "College of Engineering" },
  { id: "3", name: "College of Education" },
];

export default function CourseForm({ type, data, id }: CourseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Course>({
    resolver: zodResolver(courseSchema),
    defaultValues: data || {
      name: "",
      code: "",
      department: "",
      description: "",
      units: 0,
      status: "active",
    },
  });

  const onSubmit = async (formData: Course) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // TODO: Replace with actual API call
      console.log("Form submitted:", formData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Handle success
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // TODO: Replace with actual API call
      console.log("Deleting course:", id);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Handle success
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (type === "delete") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Delete Course</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to delete this course? This action cannot be undone.
          </p>
        </div>
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            disabled={isSubmitting}
            className="text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Form Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          Create New Course
        </h1>
        <p className="text-sm text-gray-500">
          Fill in the details below to add a new course to the system
        </p>
      </div>

      {/* Basic Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <SchoolIcon className="text-blue-600" style={{ fontSize: 20 }} />
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Course Name
            </label>
            <TextField
              id="name"
              fullWidth
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
              className="[&_.MuiOutlinedInput-root]:rounded-xl [&_.MuiOutlinedInput-root]:bg-gray-50/50"
            />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1.5">
              Course Code
            </label>
            <TextField
              id="code"
              fullWidth
              {...register("code")}
              error={!!errors.code}
              helperText={errors.code?.message}
              className="[&_.MuiOutlinedInput-root]:rounded-xl [&_.MuiOutlinedInput-root]:bg-gray-50/50"
            />
          </div>
          <div>
            <label htmlFor="units" className="block text-sm font-medium text-gray-700 mb-1.5">
              Units
            </label>
            <TextField
              id="units"
              type="number"
              fullWidth
              {...register("units", { valueAsNumber: true })}
              error={!!errors.units}
              helperText={errors.units?.message}
              className="[&_.MuiOutlinedInput-root]:rounded-xl [&_.MuiOutlinedInput-root]:bg-gray-50/50"
            />
          </div>
        </div>
      </div>

      {/* Department Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-green-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <BusinessIcon className="text-green-600" style={{ fontSize: 20 }} />
            <h2 className="text-lg font-semibold text-gray-900">Department</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1.5">
              Department
            </label>
            <FormControl fullWidth error={!!errors.department}>
              <Select
                id="department"
                {...register("department")}
                defaultValue={data?.department || ""}
                className="[&_.MuiOutlinedInput-root]:rounded-xl [&_.MuiOutlinedInput-root]:bg-gray-50/50"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.department && (
                <FormHelperText>{errors.department.message}</FormHelperText>
              )}
            </FormControl>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <DescriptionIcon className="text-purple-600" style={{ fontSize: 20 }} />
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
              Course Description
            </label>
            <TextField
              id="description"
              fullWidth
              multiline
              rows={4}
              {...register("description")}
              error={!!errors.description}
              helperText={errors.description?.message}
              className="[&_.MuiOutlinedInput-root]:rounded-xl [&_.MuiOutlinedInput-root]:bg-gray-50/50"
            />
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-orange-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <InfoIcon className="text-orange-600" style={{ fontSize: 20 }} />
            <h2 className="text-lg font-semibold text-gray-900">Status</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
              Course Status
            </label>
            <FormControl fullWidth error={!!errors.status}>
              <Select
                id="status"
                label="Status"
                {...register("status")}
                defaultValue={data?.status || "active"}
                className="[&_.MuiOutlinedInput-root]:rounded-xl [&_.MuiOutlinedInput-root]:bg-gray-50/50"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
              {errors.status && (
                <FormHelperText>{errors.status.message}</FormHelperText>
              )}
            </FormControl>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <InfoIcon style={{ fontSize: 16 }} />
          <span>All fields marked with * are required</span>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
            disabled={isSubmitting}
            className="text-gray-600 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            className="bg-sasBlue hover:bg-sasBlue/90"
          >
            {isSubmitting ? "Saving..." : "Create Course"}
          </Button>
        </div>
      </div>
    </form>
  );
} 