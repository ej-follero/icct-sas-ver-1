"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  title: string;
  submitLabel?: string;
  defaultValues?: any;
  schema: z.ZodType<any>;
  fields: {
    name: string;
    label: string;
    type?: "text" | "number" | "multiline" | "select";
    options?: { value: string; label: string }[];
  }[];
}

export default function FormModal({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel = "Submit",
  defaultValues,
  schema,
  fields,
}: FormModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Reset form when modal closes or defaultValues change
  useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg sm:p-8">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogClose asChild>
            <button
              aria-label="Close"
              className="rounded-md p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 space-y-4"
          noValidate
        >
          {fields.map((field) => (
            <Controller
              key={field.name}
              name={field.name}
              control={control}
              render={({ field: { onChange, value } }) => {
                if (field.type === "select") {
                  return (
                    <div>
                      <Label htmlFor={field.name} className="mb-1">
                        {field.label}
                      </Label>
                      <Select
                        onValueChange={onChange}
                        value={value || ""}
                        defaultValue={value || ""}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors[field.name] && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors[field.name]?.message as string}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div>
                    <Label htmlFor={field.name} className="mb-1">
                      {field.label}
                    </Label>
                    {field.type === "multiline" ? (
                      <textarea
                        id={field.name}
                        value={value || ""}
                        onChange={onChange}
                        placeholder={field.label}
                        className="resize-y h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type === "number" ? "number" : "text"}
                        value={value || ""}
                        onChange={onChange}
                        placeholder={field.label}
                      />
                    )}
                    {errors[field.name] && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors[field.name]?.message as string}
                      </p>
                    )}
                  </div>
                );
              }}
            />
          ))}

          <DialogFooter className="pt-6 flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
