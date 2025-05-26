"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { School as SchoolIcon } from '@mui/icons-material';
import { z } from "zod";

type SubjectFormData = {
  name: string;
  description: string;
  code: string;
  type: "lecture" | "laboratory" | "both";
  lecture_units: number;
  laboratory_units: number;
  units: number;
  semester: "1st" | "2nd" | "3rd";
  year_level: "1st" | "2nd" | "3rd" | "4th";
  department: string;
  prerequisites: string[];
};

const schema = z.object({
  name: z.string().min(1, "Subject name is required"),
  description: z.string().min(1, "Description is required"),
  code: z.string().min(1, "Subject code is required"),
  type: z.enum(["lecture", "laboratory", "both"], { message: "Invalid subject type" }),
  lecture_units: z.number().optional(),
  laboratory_units: z.number().optional(),
  units: z.number().optional(),
  semester: z.enum(["1st", "2nd", "3rd"], { message: "Invalid semester" }),
  year_level: z.enum(["1st", "2nd", "3rd", "4th"], { message: "Invalid year level" }),
  department: z.string().min(1, "Department is required"),
  prerequisites: z.array(z.string()).default([]),
}).superRefine((data, ctx) => {
  if (data.type === "both") {
    if (data.lecture_units === undefined || data.lecture_units < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lecture_units"],
        message: "Lecture units is required and must be at least 1",
      });
    } else if (data.lecture_units > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lecture_units"],
        message: "Lecture units cannot exceed 3",
      });
    }
    if (data.laboratory_units === undefined || data.laboratory_units < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["laboratory_units"],
        message: "Laboratory units is required and must be at least 1",
      });
    } else if (data.laboratory_units > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["laboratory_units"],
        message: "Laboratory units cannot exceed 3",
      });
    }
    // units is not required in this case
  } else {
    if (data.units === undefined || data.units < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["units"],
        message: "Units is required and must be at least 1",
      });
    } else if (data.units > 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["units"],
        message: "Units cannot exceed 6",
      });
    }
    // lecture_units and laboratory_units are not required in this case
  }
});

type Props = {
  type: "create" | "update";
  data?: SubjectFormData;
  onSubmit: (data: SubjectFormData) => void;
  isLoading?: boolean;
};

const SubjectForm = ({ type, data, onSubmit, isLoading = false }: Props) => {
  const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>(data?.prerequisites || []);
  const [subjectType, setSubjectType] = useState<"lecture" | "laboratory" | "both">(data?.type || "lecture");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SubjectFormData>({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  const watchType = watch("type");

  useEffect(() => {
    setSubjectType(watchType);
  }, [watchType]);

  const handleFormSubmit = (formData: SubjectFormData) => {
    onSubmit({
      ...formData,
      prerequisites: selectedPrerequisites,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {type === "create" ? "Add New Subject" : "Update Subject"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the subject details below. Fields marked with * are required.
        </p>
      </div>

      {/* Basic Information Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-800">Basic Information</h3>
        
        {/* Subject Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Subject Name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SchoolIcon className="text-gray-400" style={{ fontSize: 20 }} />
            </div>
            <input
              type="text"
              id="name"
              {...register("name")}
              className={`pl-10 w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.name ? "border-red-300" : "border-gray-200"
              }`}
              placeholder="e.g., Introduction to Programming"
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Subject Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Subject Code *
          </label>
          <input
            type="text"
            id="code"
            {...register("code")}
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.code ? "border-red-300" : "border-gray-200"
            }`}
            placeholder="e.g., CS101"
          />
          <p className="mt-1 text-sm text-gray-500">Enter the official subject code</p>
          {errors.code && (
            <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={3}
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.description ? "border-red-300" : "border-gray-200"
            }`}
            placeholder="Provide a brief description of the subject"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Subject Details Section */}
      <div className="space-y-6 pt-4 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">Subject Details</h3>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Subject Type *
          </label>
          <select
            id="type"
            {...register("type")}
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.type ? "border-red-300" : "border-gray-200"
            }`}
          >
            <option value="">Select type</option>
            <option value="lecture">Lecture</option>
            <option value="laboratory">Laboratory</option>
            <option value="both">Lecture and Laboratory</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">Choose whether this is a lecture, laboratory, or both</p>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* Units Section */}
        {subjectType === "both" ? (
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700">Units Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lecture_units" className="block text-sm font-medium text-gray-700 mb-1">
                  Lecture Units *
                </label>
                <input
                  type="number"
                  id="lecture_units"
                  {...register("lecture_units")}
                  min={1}
                  max={3}
                  disabled={!subjectType}
                  className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.lecture_units ? "border-red-300" : "border-gray-200"
                  } ${!subjectType ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder={!subjectType ? "Select subject type first" : "Enter lecture units"}
                />
                {errors.lecture_units && (
                  <p className="mt-1 text-sm text-red-600">{errors.lecture_units.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="laboratory_units" className="block text-sm font-medium text-gray-700 mb-1">
                  Laboratory Units *
                </label>
                <input
                  type="number"
                  id="laboratory_units"
                  {...register("laboratory_units")}
                  min={1}
                  max={3}
                  disabled={!subjectType}
                  className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    errors.laboratory_units ? "border-red-300" : "border-gray-200"
                  } ${!subjectType ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder={!subjectType ? "Select subject type first" : "Enter laboratory units"}
                />
                {errors.laboratory_units && (
                  <p className="mt-1 text-sm text-red-600">{errors.laboratory_units.message}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="units" className="block text-sm font-medium text-gray-700 mb-1">
              Units *
            </label>
            <input
              type="number"
              id="units"
              {...register("units")}
              min={1}
              max={6}
              disabled={!subjectType}
              className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.units ? "border-red-300" : "border-gray-200"
              } ${!subjectType ? "bg-gray-100 cursor-not-allowed" : ""}`}
              placeholder={!subjectType ? "Select subject type first" : "Enter number of units"}
            />
            <p className="mt-1 text-sm text-gray-500">
              {!subjectType 
                ? "Please select a subject type first"
                : "Enter the total number of units (1-6)"}
            </p>
            {errors.units && (
              <p className="mt-1 text-sm text-red-600">{errors.units.message}</p>
            )}
          </div>
        )}

        {/* Semester and Year Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">
              Semester *
            </label>
            <select
              id="semester"
              {...register("semester")}
              className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.semester ? "border-red-300" : "border-gray-200"
              }`}
            >
              <option value="">Select semester</option>
              <option value="1st">1st Semester</option>
              <option value="2nd">2nd Semester</option>
              <option value="3rd">3rd Semester</option>
            </select>
            {errors.semester && (
              <p className="mt-1 text-sm text-red-600">{errors.semester.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="year_level" className="block text-sm font-medium text-gray-700 mb-1">
              Year Level *
            </label>
            <select
              id="year_level"
              {...register("year_level")}
              className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                errors.year_level ? "border-red-300" : "border-gray-200"
              }`}
            >
              <option value="">Select year level</option>
              <option value="1st">1st Year</option>
              <option value="2nd">2nd Year</option>
              <option value="3rd">3rd Year</option>
              <option value="4th">4th Year</option>
            </select>
            {errors.year_level && (
              <p className="mt-1 text-sm text-red-600">{errors.year_level.message}</p>
            )}
          </div>
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department *
          </label>
          <select
            id="department"
            {...register("department")}
            className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
              errors.department ? "border-red-300" : "border-gray-200"
            }`}
          >
            <option value="">Select department</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Information Systems">Information Systems</option>
            <option value="Computer Engineering">Computer Engineering</option>
          </select>
          {errors.department && (
            <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
          )}
        </div>

        {/* Prerequisites */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prerequisites
          </label>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Select any subjects that must be completed before taking this subject
            </p>
            {/* Add your prerequisites selection UI here */}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            type === "create" ? "Add Subject" : "Update Subject"
          )}
        </button>
      </div>
    </form>
  );
};

export default SubjectForm; 