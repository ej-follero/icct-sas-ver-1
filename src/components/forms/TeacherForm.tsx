"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Key,
  Briefcase,
  Calendar,
  Droplet,
  Phone,
  Home,
} from "lucide-react";

import { teacherSchema } from "@/lib/validations/form";
import { TeacherData, FormProps, UserGender, UserStatus, BloodType } from "@/types/form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import FormSection from "./FormSection";

interface TeacherFormProps extends FormProps<TeacherData> {}

const genderOptions = Object.values(UserGender).map((gender) => ({
  value: gender,
  label: gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase(),
}));

const statusOptions = Object.values(UserStatus).map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
}));

const bloodTypeOptions = Object.values(BloodType).map((type) => ({
  value: type,
  label: type,
}));

export default function TeacherForm({ type, data, onSubmit, isLoading }: TeacherFormProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TeacherData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: data,
  });

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Form Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-gray-900">
          {type === "create" ? "Create New Instructor" : "Update Instructor"}
        </h1>
        <p className="text-sm text-gray-500">
          {type === "create"
            ? "Fill in the details below to add a new instructor to the system"
            : "Update the instructor's information in the system"}
        </p>
      </div>

      {/* Authentication Details Section */}
      <FormSection title="Authentication Details" icon={Mail} color="blue">
        <div className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter username"
              {...register("username")}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
              className={errors.username ? "border-destructive" : ""}
            />
            {errors.username && (
              <p id="username-error" className="text-destructive text-sm mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p id="email-error" className="text-destructive text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {type === "create" && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min. 6 characters)"
                {...register("password")}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={errors.password ? "border-destructive" : ""}
              />
              {errors.password && (
                <p id="password-error" className="text-destructive text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>
          )}
        </div>
      </FormSection>

      {/* Personal Information Section */}
      <FormSection title="Personal Information" icon={User} color="green">
        <div className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter first name"
              {...register("firstName")}
              aria-invalid={!!errors.firstName}
              aria-describedby={errors.firstName ? "firstName-error" : undefined}
              className={errors.firstName ? "border-destructive" : ""}
            />
            {errors.firstName && (
              <p id="firstName-error" className="text-destructive text-sm mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter last name"
              {...register("lastName")}
              aria-invalid={!!errors.lastName}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
              className={errors.lastName ? "border-destructive" : ""}
            />
            {errors.lastName && (
              <p id="lastName-error" className="text-destructive text-sm mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <Label>Gender</Label>
            <Select
              value={watch("gender") || ""}
              onValueChange={(value) => setValue("gender", value as UserGender)}
              aria-invalid={!!errors.gender}
              aria-describedby={errors.gender ? "gender-error" : undefined}
              required
            >
              <SelectTrigger className={errors.gender ? "border-destructive" : ""}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {genderOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gender && (
              <p id="gender-error" className="text-destructive text-sm mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={watch("status") || ""}
              onValueChange={(value) => setValue("status", value as UserStatus)}
              aria-invalid={!!errors.status}
              aria-describedby={errors.status ? "status-error" : undefined}
              required
            >
              <SelectTrigger className={errors.status ? "border-destructive" : ""}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p id="status-error" className="text-destructive text-sm mt-1">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Additional Information Section */}
      <FormSection title="Additional Information" icon={Briefcase} color="purple">
        <div className="space-y-4">
          <div>
            <Label htmlFor="birthday">Birthday</Label>
            <Input
              id="birthday"
              type="date"
              {...register("birthday")}
              aria-invalid={!!errors.birthday}
              aria-describedby={errors.birthday ? "birthday-error" : undefined}
              className={errors.birthday ? "border-destructive" : ""}
            />
            {errors.birthday && (
              <p id="birthday-error" className="text-destructive text-sm mt-1">
                {errors.birthday.message}
              </p>
            )}
          </div>

          <div>
            <Label>Blood Type</Label>
            <Select
              value={watch("bloodType") || ""}
              onValueChange={(value) => setValue("bloodType", value as BloodType)}
              aria-invalid={!!errors.bloodType}
              aria-describedby={errors.bloodType ? "bloodType-error" : undefined}
              required
            >
              <SelectTrigger className={errors.bloodType ? "border-destructive" : ""}>
                <SelectValue placeholder="Select blood type" />
              </SelectTrigger>
              <SelectContent>
                {bloodTypeOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bloodType && (
              <p id="bloodType-error" className="text-destructive text-sm mt-1">
                {errors.bloodType.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="Enter phone number"
              {...register("phoneNumber")}
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
              className={errors.phoneNumber ? "border-destructive" : ""}
            />
            {errors.phoneNumber && (
              <p id="phoneNumber-error" className="text-destructive text-sm mt-1">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              type="text"
              placeholder="Enter complete address"
              {...register("address")}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? "address-error" : undefined}
              className={errors.address ? "border-destructive" : ""}
            />
            {errors.address && (
              <p id="address-error" className="text-destructive text-sm mt-1">
                {errors.address.message}
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} variant="default">
          {isLoading ? "Saving..." : type === "create" ? "Create Teacher" : "Update Teacher"}
        </Button>
      </div>
    </form>
  );
}