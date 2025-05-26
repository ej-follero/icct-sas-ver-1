"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { 
  Person as PersonIcon,
  ContactMail as ContactMailIcon,
  Work as WorkIcon,
  Bloodtype as BloodtypeIcon,
} from '@mui/icons-material';
import InputField from "../InputField";
import SelectField from "./SelectField";
import FormSection from "./FormSection";
import { teacherSchema } from "@/lib/validations/form";
import { TeacherData, FormProps, UserGender, UserStatus, BloodType } from "@/types/form";

const TeacherForm = ({ type, data, onSubmit, isLoading }: FormProps<TeacherData>) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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
          {type === "create" ? "Create New Teacher" : "Update Teacher"}
        </h1>
        <p className="text-sm text-gray-500">
          {type === "create" 
            ? "Fill in the details below to add a new teacher to the system" 
            : "Update the teacher's information in the system"}
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

      {/* Additional Information Section */}
      <FormSection title="Additional Information" icon={WorkIcon} color="purple">
        <InputField
          label="Birthday"
          type="date"
          error={errors.birthday?.message}
          {...register("birthday")}
        />
        <SelectField
          label="Blood Type"
          name="bloodType"
          options={Object.values(BloodType).map(type => ({
            value: type,
            label: type
          }))}
          register={register}
          error={errors.bloodType?.message}
          required
        />
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
      </FormSection>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : type === "create" ? "Create Teacher" : "Update Teacher"}
        </button>
      </div>
    </form>
  );
};

export default TeacherForm;
