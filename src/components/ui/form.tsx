"use client";

import * as React from "react";
import { Controller, FieldValues, FieldPath, Control } from "react-hook-form";
import { Label } from "@/components/ui/label";

const Form = (props: any) => props.children;

interface FormFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  control: Control<TFieldValues>;
  name: TName;
  render: (props: { field: any; fieldState: any }) => React.ReactNode;
}

function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: FormFieldProps<TFieldValues, TName>
) {
  return <Controller {...props} />;
}

function FormItem({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function FormLabel({ children, ...props }: { children: React.ReactNode }) {
  return <Label {...props}>{children}</Label>;
}

function FormControl({ field, children }: { field: any; children: React.ReactElement }) {
  return React.cloneElement(children, { ...field });
}

function FormMessage({ children }: { children: React.ReactNode }) {
  return children ? <p className="text-destructive text-sm mt-1">{children}</p> : null;
}

export { Form, FormField, FormItem, FormLabel, FormControl, FormMessage }; 