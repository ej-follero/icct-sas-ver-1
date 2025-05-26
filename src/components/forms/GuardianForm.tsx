"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { 
  Person as PersonIcon,
  ContactMail as ContactMailIcon,
  FamilyRestroom as FamilyRestroomIcon,
} from '@mui/icons-material';
import InputField from "../InputField";
import SelectField from "./SelectField";
import FormSection from "./FormSection";
import { guardianSchema } from "@/lib/validations/form";
import { GuardianData, FormProps, UserGender, UserStatus } from "@/types/form";

const GuardianForm = ({ type, data, onSubmit, isLoading }: FormProps<GuardianData>) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuardianData>({
    resolver: zodResolver(guardianSchema),
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
          {type === "create" ? "Create New Guardian" : "Update Guardian"}
        </h1>
        <p className="text-sm text-gray-500">
          {type === "create" 
            ? "Fill in the details below to add a new guardian to the system" 
            : "Update the guardian's information in the system"}
        </p>
      </div>

      {/* Authentication Section */}
      <FormSection title="Authentication Details" icon={ContactMailIcon} color="blue">
        <InputField
          label="Username"
          type="text"
          error={errors.username?.message}
          {...register("username")}
          placeholder="Enter username"
        />
        <InputField
          label="Email Address"
          type="email"
          error={errors.email?.message}
          {...register("email")}
          placeholder="Enter email address"
        />
        {type === "create" && (
          <InputField
            label="Password"
            type="password"
            error={errors.password?.message}
            {...register("password")}
            placeholder="Enter password (min. 6 characters)"
          />
        )}
      </FormSection>

      {/* Personal Information Section */}
      <FormSection title="Personal Information" icon={PersonIcon} color="green">
        <InputField
          label="First Name"
          type="text"
          error={errors.firstName?.message}
          {...register("firstName")}
          placeholder="Enter first name"
        />
        <InputField
          label="Last Name"
          type="text"
          error={errors.lastName?.message}
          {...register("lastName")}
          placeholder="Enter last name"
        />
        <SelectField
          label="Gender"
          name="gender"
          options={Object.values(UserGender).map(gender => ({
            value: gender,
            label: gender.charAt(0) + gender.slice(1).toLowerCase()
          }))}
          register={register}
          error={errors.gender?.message}
          required
        />
        <SelectField
          label="Status"
          name="status"
          options={Object.values(UserStatus).map(status => ({
            value: status,
            label: status.charAt(0) + status.slice(1).toLowerCase()
          }))}
          register={register}
          error={errors.status?.message}
          required
        />
      </FormSection>

      {/* Contact Information Section */}
      <FormSection title="Contact Information" icon={FamilyRestroomIcon} color="purple">
        <InputField
          label="Phone Number"
          type="tel"
          error={errors.phoneNumber?.message}
          {...register("phoneNumber")}
          placeholder="Enter phone number"
        />
        <InputField
          label="Address"
          type="text"
          error={errors.address?.message}
          {...register("address")}
          placeholder="Enter complete address"
        />
        <InputField
          label="Relationship"
          type="text"
          error={errors.relationship?.message}
          {...register("relationship")}
          placeholder="Enter relationship to student"
        />
      </FormSection>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : type === "create" ? "Create Guardian" : "Update Guardian"}
        </button>
      </div>
    </form>
  );
};

export default GuardianForm; 