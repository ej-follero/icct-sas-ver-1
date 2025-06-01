"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { School, Book, Layers, Loader2, FileDiff } from "lucide-react";

type SubjectFormData = {
  name: string;
  description: string;
  code: string;
  type: "lecture" | "laboratory" | "both";
  lecture_units?: number;
  laboratory_units?: number;
  units?: number;
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
  }
});

type Props = {
  type: "create" | "update";
  data?: SubjectFormData;
  onSubmit: (data: SubjectFormData) => void;
  isLoading?: boolean;
};

export default function SubjectForm({ type, data, onSubmit, isLoading = false }: Props) {
  const [selectedPrerequisites, setSelectedPrerequisites] = useState<string[]>(data?.prerequisites || []);
  const [subjectType, setSubjectType] = useState<"lecture" | "laboratory" | "both">(data?.type || "lecture");

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    control,
  } = form;

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

  // Dummy prerequisites (replace with your data)
  const allPrerequisites = [
    "Introduction to Programming",
    "Mathematics I",
    "Discrete Structures",
    "Data Structures",
  ];

  const togglePrerequisite = (prereq: string) => {
    setSelectedPrerequisites((prev) =>
      prev.includes(prereq) ? prev.filter((p) => p !== prereq) : [...prev, prereq]
    );
  };

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Book className="w-6 h-6 text-blue-600" />
          {type === "create" ? "Add New Subject" : "Update Subject"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the subject details below. Fields marked with * are required.
        </p>
      </div>

      {/* Basic Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <School className="w-5 h-5 text-blue-500" />
          Basic Information
        </h3>
        {/* Subject Name */}
        <FormField control={control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Subject Name *</FormLabel>
            <div className="relative">
              <FormControl field={field}>
                <Input
                  id="name"
                  placeholder="e.g., Introduction to Programming"
                  className="pl-10"
                  {...field}
                />
              </FormControl>
              <School className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground pointer-events-none" />
            </div>
            <FormMessage>{errors.name?.message}</FormMessage>
          </FormItem>
        )} />

        {/* Subject Code */}
        <FormField control={control} name="code" render={({ field }) => (
          <FormItem>
            <FormLabel>Subject Code *</FormLabel>
            <FormControl field={field}>
              <Input
                id="code"
                placeholder="e.g., CS101"
                {...field}
              />
            </FormControl>
            <span className="text-xs text-muted-foreground">
              Enter the official subject code
            </span>
            <FormMessage>{errors.code?.message}</FormMessage>
          </FormItem>
        )} />

        {/* Description */}
        <FormField control={control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Description *</FormLabel>
            <FormControl field={field}>
              <Textarea
                id="description"
                rows={3}
                placeholder="Provide a brief description of the subject"
                {...field}
              />
            </FormControl>
            <FormMessage>{errors.description?.message}</FormMessage>
          </FormItem>
        )} />
      </div>

      {/* Subject Details */}
      <div className="space-y-6 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-500" />
          Subject Details
        </h3>

        {/* Subject Type */}
        <FormField control={control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Subject Type *</FormLabel>
            <FormControl field={field}>
              <Select
                defaultValue={data?.type || ""}
                onValueChange={(v: any) => setValue("type", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture</SelectItem>
                  <SelectItem value="laboratory">Laboratory</SelectItem>
                  <SelectItem value="both">Lecture and Laboratory</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <span className="text-xs text-muted-foreground">
              Choose whether this is a lecture, laboratory, or both
            </span>
            <FormMessage>{errors.type?.message}</FormMessage>
          </FormItem>
        )} />

        {/* Units */}
        {subjectType === "both" ? (
          <div className="bg-muted p-4 rounded-lg space-y-4">
            <h4 className="text-sm font-medium">Units Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={control} name="lecture_units" render={({ field }) => (
                <FormItem>
                  <FormLabel>Lecture Units *</FormLabel>
                  <FormControl field={field}>
                    <Input
                      type="number"
                      min={1}
                      max={3}
                      placeholder="Enter lecture units"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{errors.lecture_units?.message}</FormMessage>
                </FormItem>
              )} />
              <FormField control={control} name="laboratory_units" render={({ field }) => (
                <FormItem>
                  <FormLabel>Laboratory Units *</FormLabel>
                  <FormControl field={field}>
                    <Input
                      type="number"
                      min={1}
                      max={3}
                      placeholder="Enter laboratory units"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{errors.laboratory_units?.message}</FormMessage>
                </FormItem>
              )} />
            </div>
          </div>
        ) : (
          <FormField control={control} name="units" render={({ field }) => (
            <FormItem>
              <FormLabel>Units *</FormLabel>
              <FormControl field={field}>
                <Input
                  type="number"
                  min={1}
                  max={6}
                  placeholder="Enter number of units"
                  {...field}
                />
              </FormControl>
              <span className="text-xs text-muted-foreground">
                Enter the total number of units (1-6)
              </span>
              <FormMessage>{errors.units?.message}</FormMessage>
            </FormItem>
          )} />
        )}

        {/* Semester and Year Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={control} name="semester" render={({ field }) => (
            <FormItem>
              <FormLabel>Semester *</FormLabel>
              <FormControl field={field}>
                <Select
                  defaultValue={data?.semester || ""}
                  onValueChange={(v: any) => setValue("semester", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Semester</SelectItem>
                    <SelectItem value="2nd">2nd Semester</SelectItem>
                    <SelectItem value="3rd">3rd Semester</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage>{errors.semester?.message}</FormMessage>
            </FormItem>
          )} />
          <FormField control={control} name="year_level" render={({ field }) => (
            <FormItem>
              <FormLabel>Year Level *</FormLabel>
              <FormControl field={field}>
                <Select
                  defaultValue={data?.year_level || ""}
                  onValueChange={(v: any) => setValue("year_level", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                    <SelectItem value="4th">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage>{errors.year_level?.message}</FormMessage>
            </FormItem>
          )} />
        </div>

        {/* Department */}
        <FormField control={control} name="department" render={({ field }) => (
          <FormItem>
            <FormLabel>Department *</FormLabel>
            <FormControl field={field}>
              <Select
                defaultValue={data?.department || ""}
                onValueChange={(v: any) => setValue("department", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Information Systems">Information Systems</SelectItem>
                  <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage>{errors.department?.message}</FormMessage>
          </FormItem>
        )} />

        {/* Prerequisites */}
        <div>
          <Label>Prerequisites</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Select any subjects that must be completed before taking this subject
          </p>
          <div className="flex flex-wrap gap-2">
            {allPrerequisites.map((prereq) => (
              <Button
                key={prereq}
                type="button"
                variant={selectedPrerequisites.includes(prereq) ? "default" : "outline"}
                size="sm"
                onClick={() => togglePrerequisite(prereq)}
                className="rounded-full"
              >
                {prereq}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t flex">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {type === "create" ? "Add Subject" : "Update Subject"}
        </Button>
      </div>
    </Form>
  );
}