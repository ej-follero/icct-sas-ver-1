"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import dynamic from "next/dynamic";
import {
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Dynamically import form components
const TeacherForm = dynamic(() => import("./forms/TeacherForm"));
const StudentForm = dynamic(() => import("./forms/StudentForm"));
const ParentForm = dynamic(() => import("./forms/ParentForm"));
const SubjectForm = dynamic(() => import("./forms/SubjectForm"));
const DepartmentForm = dynamic(() => import("./forms/DepartmentForm").then(mod => mod.DepartmentForm));
const CourseForm = dynamic(() => import("./forms/CourseForm"));
const ClassForm = dynamic(() => import("./forms/ClassForm"));

// Mock data for instructors and courses
const instructors = [
  { id: "1", name: "Mr. J. Dela Cruz" },
  { id: "2", name: "Dr. Maria Santos" },
  { id: "3", name: "Prof. John Smith" },
];

const courses = [
  { id: "1", name: "BSIT" },
  { id: "2", name: "BSCS" },
  { id: "3", name: "BSIS" },
  { id: "4", name: "BSE" },
  { id: "5", name: "BEE" },
  { id: "6", name: "BPE" },
];

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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          {fields.map((field) => (
            <Controller
              key={field.name}
              name={field.name}
              control={control}
              render={({ field: { onChange, value } }) => {
                if (field.type === "select") {
                  return (
                    <FormControl fullWidth margin="normal" error={!!errors[field.name]}>
                      <InputLabel>{field.label}</InputLabel>
                      <Select
                        value={value || ""}
                        label={field.label}
                        onChange={onChange}
                      >
                        {field.options?.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  );
                }

                return (
                  <TextField
                    fullWidth
                    label={field.label}
                    value={value || ""}
                    onChange={onChange}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]?.message as string}
                    margin="normal"
                    type={field.type === "number" ? "number" : "text"}
                    multiline={field.type === "multiline"}
                    rows={field.type === "multiline" ? 3 : 1}
                  />
                );
              }}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
