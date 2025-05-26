"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { 
  Person as PersonIcon,
  School as SchoolIcon,
  ContactMail as ContactMailIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import InputField from "../InputField";
import SelectField from "./SelectField";
import FormSection from "./FormSection";
import { studentSchema } from "@/lib/validations/form";
import { StudentData, FormProps, UserGender, UserStatus, StudentType, YearLevel } from "@/types/form";
//import { z } from "zod";

const StudentForm = ({ type, data, onSubmit, isLoading }: FormProps<StudentData>) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentData>({
    resolver: zodResolver(studentSchema),
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
          {type === "create" ? "Create New Student" : "Update Student"}
        </h1>
        <p className="text-sm text-gray-500">
          {type === "create" 
            ? "Fill in the details below to add a new student to the system" 
            : "Update the student's information in the system"}
        </p>
      </div>

      {/* Student Identification Section */}
      <FormSection title="Student Identification" icon={BadgeIcon} color="blue">
        <InputField
          label="Student ID Number"
          type="text"
          error={errors.studentIdNum?.message}
          {...register("studentIdNum")}
          placeholder="Enter student ID number"
        />
        <InputField
          label="RFID Tag"
          type="text"
          error={errors.rfidTag?.message}
          {...register("rfidTag")}
          placeholder="Enter RFID tag"
        />
        <SelectField
          label="Student Type"
          name="studentType"
          options={Object.values(StudentType).map(type => ({
            value: type,
            label: type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ')
          }))}
          register={register}
          error={errors.studentType?.message}
          required
        />
        <SelectField
          label="Year Level"
          name="yearLevel"
          options={Object.values(YearLevel).map(level => ({
            value: level,
            label: level.charAt(0) + level.slice(1).toLowerCase().replace('_', ' ')
          }))}
          register={register}
          error={errors.yearLevel?.message}
          required
        />
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
          label="Middle Name"
          type="text"
          error={errors.middleName?.message}
          {...register("middleName")}
          placeholder="Enter middle name"
        />
        <InputField
          label="Last Name"
          type="text"
          error={errors.lastName?.message}
          {...register("lastName")}
          placeholder="Enter last name"
        />
        <InputField
          label="Suffix"
          type="text"
          error={errors.suffix?.message}
          {...register("suffix")}
          placeholder="Enter suffix (e.g., Jr., Sr.)"
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
      <FormSection title="Contact Information" icon={ContactMailIcon} color="purple">
        <InputField
          label="Email Address"
          type="email"
          error={errors.email?.message}
          {...register("email")}
          placeholder="Enter email address"
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
          {isLoading ? "Saving..." : type === "create" ? "Create Student" : "Update Student"}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
