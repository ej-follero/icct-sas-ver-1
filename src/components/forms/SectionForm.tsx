"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Info, RotateCcw, Save } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

const sectionFormSchema = z.object({
  sectionName: z.string().min(1, "Section name is required"),
  sectionType: z.enum(["REGULAR", "IRREGULAR", "SUMMER"]),
  sectionCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  sectionStatus: z.enum(["ACTIVE", "INACTIVE"]),
  yearLevel: z.string().refine((val) => ["1", "2", "3", "4"].includes(val), {
    message: "Year level must be between 1 and 4",
  }),
  courseId: z.string().refine((val) => ["1", "2", "3"].includes(val), {
    message: "Course is required",
  }),
});

type SectionFormData = z.infer<typeof sectionFormSchema>;

interface SectionFormProps {
  type: "create" | "update";
  data?: SectionFormData;
  id?: string;
  onSuccess?: (section: SectionFormData) => void;
}

export default function SectionForm({ type, data, id, onSuccess }: SectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultValues: SectionFormData = {
    sectionName: "",
    sectionType: "REGULAR",
    sectionCapacity: 40,
    sectionStatus: "ACTIVE",
    yearLevel: "1",
    courseId: "1",
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

  const onSubmit = async (formData: SectionFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      // Simulate API call or pass data up
      onSuccess?.(formData);
      toast.success(type === "create" ? "Section created successfully" : "Section updated successfully");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset(data || defaultValues);
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      setError(null);
      // Simulate saving draft (could be an API call)
      toast.success("Draft saved successfully");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Info: All fields required */}
      <div className="flex items-center gap-2 mb-3 text-gray-500 text-sm">
        <Info className="h-5 w-5" />
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
          <div>
            <Label htmlFor="sectionType" className="text-sm text-blue-900">
              Section Type <span className="text-red-500">*</span>
            </Label>
            <Select value={watch("sectionType")} onValueChange={(v) => setValue("sectionType", v as any)} required>
              <SelectTrigger id="sectionType" className="w-full mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REGULAR">Regular</SelectItem>
                <SelectItem value="IRREGULAR">Irregular</SelectItem>
                <SelectItem value="SUMMER">Summer</SelectItem>
              </SelectContent>
            </Select>
            {errors.sectionType && (
              <p className="text-sm text-red-600 mt-1">{errors.sectionType.message}</p>
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
            <Select value={watch("yearLevel")} onValueChange={(v) => setValue("yearLevel", v)} required>
              <SelectTrigger id="yearLevel" className="w-full mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
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
            <Label htmlFor="courseId" className="text-sm text-blue-900">
              Course <span className="text-red-500">*</span>
            </Label>
            <Select value={watch("courseId")} onValueChange={(v) => setValue("courseId", v)} required>
              <SelectTrigger id="courseId" className="w-full mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">BSIT</SelectItem>
                <SelectItem value="2">BSCS</SelectItem>
                <SelectItem value="3">BSIS</SelectItem>
              </SelectContent>
            </Select>
            {errors.courseId && (
              <p className="text-sm text-red-600 mt-1">{errors.courseId.message}</p>
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
              <SelectTrigger id="sectionStatus" className="w-full mt-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400">
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
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">{error}</div>
      )}
      <DialogFooter className="flex items-center justify-end pt-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={handleReset}
            disabled={isSubmitting || !isDirty}
            className="w-32 border border-blue-300 text-blue-500"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting || isSavingDraft || !isDirty}
            className="w-32 border border-blue-300 text-blue-500"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isSavingDraft}
            className="w-32 bg-blue-600 hover:bg-blue-700 text-white"
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
      </DialogFooter>
    </form>
  );
} 