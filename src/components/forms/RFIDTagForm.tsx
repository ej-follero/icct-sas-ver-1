"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// RFID Tag form schema
const rfidTagFormSchema = z.object({
  tagNumber: z.string()
    .min(1, "Tag number is required")
    .max(50, "Tag number must be less than 50 characters")
    .regex(/^[A-Z0-9\-_]+$/, "Tag number can only contain uppercase letters, numbers, hyphens, and underscores"),
  tagType: z.enum(["STUDENT_CARD", "INSTRUCTOR_CARD", "TEMPORARY_PASS", "VISITOR_PASS", "MAINTENANCE", "TEST"]),
  status: z.enum(["ACTIVE", "INACTIVE", "LOST", "DAMAGED", "EXPIRED", "REPLACED", "RESERVED"]),
  notes: z.string().optional(),
  studentId: z.number().optional(),
  instructorId: z.number().optional(),
  assignedBy: z.number().optional(),
  assignmentReason: z.string().optional(),
  expiresAt: z.string().optional(),
});

type RFIDTagFormValues = z.infer<typeof rfidTagFormSchema>;

interface RFIDTagFormProps {
  initialData?: {
    tagId: number;
    tagNumber: string;
    tagType: 'STUDENT_CARD' | 'INSTRUCTOR_CARD' | 'TEMPORARY_PASS' | 'VISITOR_PASS' | 'MAINTENANCE' | 'TEST';
    status: 'ACTIVE' | 'INACTIVE' | 'LOST' | 'DAMAGED' | 'EXPIRED' | 'REPLACED' | 'RESERVED';
    notes?: string;
    studentId?: number;
    instructorId?: number;
    assignedBy?: number;
    assignmentReason?: string;
    expiresAt?: string;
  };
  onSubmit: (data: RFIDTagFormValues) => Promise<void>;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
  showFooter?: boolean;
}

export function RFIDTagForm({ 
  initialData, 
  onSubmit, 
  isSubmitting = false, 
  mode = 'create',
  showFooter = true
}: RFIDTagFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RFIDTagFormValues>({
    resolver: zodResolver(rfidTagFormSchema),
    defaultValues: {
      tagNumber: initialData?.tagNumber || '',
      tagType: initialData?.tagType || 'STUDENT_CARD',
      status: initialData?.status || 'ACTIVE',
      notes: initialData?.notes || '',
      studentId: initialData?.studentId || undefined,
      instructorId: initialData?.instructorId || undefined,
      assignedBy: initialData?.assignedBy || undefined,
      assignmentReason: initialData?.assignmentReason || '',
      expiresAt: initialData?.expiresAt || '',
    },
  });

  const handleSubmit = async (data: RFIDTagFormValues) => {
    try {
      setIsLoading(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save tag');
    } finally {
      setIsLoading(false);
    }
  };

  const tagTypeOptions = [
    { value: 'STUDENT_CARD', label: 'Student Card' },
    { value: 'INSTRUCTOR_CARD', label: 'Instructor Card' },
    { value: 'TEMPORARY_PASS', label: 'Temporary Pass' },
    { value: 'VISITOR_PASS', label: 'Visitor Pass' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'TEST', label: 'Test' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'LOST', label: 'Lost' },
    { value: 'DAMAGED', label: 'Damaged' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'REPLACED', label: 'Replaced' },
    { value: 'RESERVED', label: 'Reserved' },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tag Number */}
          <FormField
            control={form.control}
            name="tagNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Tag Number *
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g., TAG001, STUDENT123"
                    className="w-full"
                    disabled={isSubmitting || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tag Type */}
          <FormField
            control={form.control}
            name="tagType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Tag Type *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting || isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tag type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tagTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Status *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting || isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expires At */}
          <FormField
            control={form.control}
            name="expiresAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">
                  Expires At
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="datetime-local"
                    className="w-full"
                    disabled={isSubmitting || isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">
                Notes
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Additional notes about this tag..."
                  className="w-full min-h-[80px]"
                  disabled={isSubmitting || isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Assignment Details */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700 border-b pb-2">
            Assignment Details
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student ID */}
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Student ID
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Student ID"
                      className="w-full"
                      disabled={isSubmitting || isLoading}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instructor ID */}
            <FormField
              control={form.control}
              name="instructorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Instructor ID
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="Instructor ID"
                      className="w-full"
                      disabled={isSubmitting || isLoading}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assigned By */}
            <FormField
              control={form.control}
              name="assignedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Assigned By
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="User ID who assigned this tag"
                      className="w-full"
                      disabled={isSubmitting || isLoading}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assignment Reason */}
            <FormField
              control={form.control}
              name="assignmentReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Assignment Reason
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Reason for assignment"
                      className="w-full"
                      disabled={isSubmitting || isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit Button - Only show if showFooter is true */}
        {showFooter && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Create Tag' : 'Update Tag'}
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
