"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  School,
  Mail,
  Badge,
  Loader2,
} from "lucide-react";

import { Form } from "@/components/ui/form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import FormSection from "./FormSection"; // Assuming you want to keep this wrapper component
import { studentSchema } from "@/lib/validations/form";
import { StudentData, FormProps, UserGender, UserStatus, StudentType, YearLevel } from "@/types/form";

const StudentForm = ({ type, data, onSubmit, isLoading }: FormProps<StudentData>) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const form = useForm<StudentData>({
    resolver: zodResolver(studentSchema),
    defaultValues: data,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = form;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to generate select options with capitalized labels
  const formatLabel = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace(/_/g, " ");

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            {type === "create" ? "Create New Student" : "Update Student"}
          </h1>
          <p className="text-sm text-gray-500">
            {type === "create"
              ? "Fill in the details below to add a new student to the system"
              : "Update the student's information in the system"}
          </p>
        </div>

        {/* Student Identification Section */}
        <FormSection title="Student Identification" icon={Badge} color="blue">
          {/* Student ID Number */}
          <FormField
            control={form.control}
            name="studentIdNum"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Student ID Number</FormLabel>
                <FormControl field={field}>
                  <Input
                    placeholder="Enter student ID number"
                    {...field}
                  />
                </FormControl>
                <FormMessage>{errors.studentIdNum?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* RFID Tag */}
          <FormField
            control={form.control}
            name="rfidTag"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>RFID Tag</FormLabel>
                <FormControl field={field}>
                  <Input
                    placeholder="Enter RFID tag"
                    {...field}
                  />
                </FormControl>
                <FormMessage>{errors.rfidTag?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Student Type */}
          <FormField
            control={form.control}
            name="studentType"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Student Type</FormLabel>
                <Select
                  onValueChange={(value: string) => field.onChange(value)}
                  value={field.value || ""}
                  defaultValue={field.value || ""}
                >
                  <FormControl field={field}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(StudentType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.studentType?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Year Level */}
          <FormField
            control={form.control}
            name="yearLevel"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Year Level</FormLabel>
                <Select
                  onValueChange={(value: string) => field.onChange(value)}
                  value={field.value || ""}
                  defaultValue={field.value || ""}
                >
                  <FormControl field={field}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(YearLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {formatLabel(level)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.yearLevel?.message}</FormMessage>
              </FormItem>
            )}
          />
        </FormSection>

        {/* Personal Information Section */}
        <FormSection title="Personal Information" icon={School} color="green">
          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl field={field}>
                  <Input placeholder="Enter first name" {...field} />
                </FormControl>
                <FormMessage>{errors.firstName?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Middle Name */}
          <FormField
            control={form.control}
            name="middleName"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Middle Name</FormLabel>
                <FormControl field={field}>
                  <Input placeholder="Enter middle name" {...field} />
                </FormControl>
                <FormMessage>{errors.middleName?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl field={field}>
                  <Input placeholder="Enter last name" {...field} />
                </FormControl>
                <FormMessage>{errors.lastName?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Suffix */}
          <FormField
            control={form.control}
            name="suffix"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Suffix</FormLabel>
                <FormControl field={field}>
                  <Input placeholder="Enter suffix (e.g., Jr., Sr.)" {...field} />
                </FormControl>
                <FormMessage>{errors.suffix?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={(value: string) => field.onChange(value)}
                  value={field.value || ""}
                  defaultValue={field.value || ""}
                >
                  <FormControl field={field}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(UserGender).map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {formatLabel(gender)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.gender?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={(value: string) => field.onChange(value)}
                  value={field.value || ""}
                  defaultValue={field.value || ""}
                >
                  <FormControl field={field}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(UserStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage>{errors.status?.message}</FormMessage>
              </FormItem>
            )}
          />
        </FormSection>

        {/* Contact Information Section */}
        <FormSection title="Contact Information" icon={Mail} color="purple">
          {/* Email Address */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl field={field}>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage>{errors.email?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Phone Number */}
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl field={field}> 
                  <Input type="tel" placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage>{errors.phoneNumber?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }: { field: any }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl field={field}>
                  <Input placeholder="Enter complete address" {...field} />
                </FormControl>
                <FormMessage>{errors.address?.message}</FormMessage>
              </FormItem>
            )}
          />
        </FormSection>

        {/* Image Upload (optional) */}
        <FormSection title="Profile Image" icon={School} color="gray">
          <div className="flex flex-col items-center gap-4">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Selected profile"
                className="w-32 h-32 rounded-full object-cover border border-gray-300"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-300">
                No Image
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </FormSection>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="w-full max-w-xs">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : type === "create" ? (
              "Create Student"
            ) : (
              "Update Student"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StudentForm;