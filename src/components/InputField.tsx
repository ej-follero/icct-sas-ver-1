"use client";

import React from "react";
import { UseFormRegister } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils"; // Optional: utility for conditional classes

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  register?: UseFormRegister<any>;
}

const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, register, id, name, className, ...props }, ref) => {
    const inputId = id || name;

    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        <Input
          id={inputId}
          {...props}
          {...(register && name ? register(name) : {})}
          ref={ref}
          className={cn(className, error && "border-red-600 focus:ring-red-600")}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
