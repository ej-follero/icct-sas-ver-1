"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import InputField from "../InputField";
import { useState } from "react";
import { 
  Person as PersonIcon,
  ContactMail as ContactMailIcon,
  LocationOn as LocationOnIcon,
  PhotoCamera as PhotoCameraIcon,
  Info as InfoIcon,
  Work as WorkIcon,
  Bloodtype as BloodtypeIcon,
  Cake as CakeIcon,
  Wc as WcIcon
} from '@mui/icons-material';

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  bloodType: z.string().min(1, "Blood type is required"),
  birthday: z.string().min(1, "Birthday is required"),
  sex: z.string().min(1, "Sex is required"),
  occupation: z.string().min(1, "Occupation is required"),
  img: z.any().optional(),
});

type FormData = z.infer<typeof schema>;

interface ParentFormProps {
  type: "create" | "update";
  data?: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    bloodType: string;
    birthday: string;
    sex: string;
    occupation: string;
  };
}

const ParentForm = ({ type, data }: ParentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: data
      ? {
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          address: data.address,
          bloodType: data.bloodType,
          birthday: data.birthday,
          sex: data.sex,
          occupation: data.occupation,
        }
      : undefined,
  });

  const onSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      // Handle form submission
      console.log(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

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
          {type === "create" ? "Create New Parent" : "Update Parent"}
        </h1>
        <p className="text-sm text-gray-500">
          {type === "create" 
            ? "Fill in the details below to add a new parent to the system" 
            : "Update the parent's information in the system"}
        </p>
      </div>

      {/* Authentication Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <ContactMailIcon className="text-blue-600" style={{ fontSize: 20 }} />
            <h2 className="text-lg font-semibold text-gray-900">Authentication Details</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Username"
            type="text"
            error={errors.username?.message?.toString()}
            {...register("username")}
            placeholder="Enter username"
          />
          <InputField
            label="Email Address"
            type="email"
            error={errors.email?.message?.toString()}
            {...register("email")}
            placeholder="Enter email address"
          />
          {type === "create" && (
            <InputField
              label="Password"
              type="password"
              error={errors.password?.message?.toString()}
              {...register("password")}
              placeholder="Enter password (min. 6 characters)"
            />
          )}
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-green-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <PersonIcon className="text-green-600" style={{ fontSize: 20 }} />
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="First Name"
            type="text"
            error={errors.firstName?.message?.toString()}
            {...register("firstName")}
            placeholder="Enter first name"
          />
          <InputField
            label="Last Name"
            type="text"
            error={errors.lastName?.message?.toString()}
            {...register("lastName")}
            placeholder="Enter last name"
          />
          <InputField
            label="Phone Number"
            type="tel"
            error={errors.phone?.message?.toString()}
            {...register("phone")}
            placeholder="Enter phone number"
          />
          <InputField
            label="Address"
            type="text"
            error={errors.address?.message?.toString()}
            {...register("address")}
            placeholder="Enter complete address"
          />
          <InputField
            label="Occupation"
            type="text"
            error={errors.occupation?.message?.toString()}
            {...register("occupation")}
            placeholder="Enter occupation"
          />
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-purple-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <WorkIcon className="text-purple-600" style={{ fontSize: 20 }} />
            <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Blood Type
            </label>
            <select
              {...register("bloodType")}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select blood type</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.bloodType && (
              <p className="mt-1 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                {errors.bloodType.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sex
            </label>
            <select
              {...register("sex")}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.sex && (
              <p className="mt-1 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                {errors.sex.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Birthday
            </label>
            <input
              type="date"
              {...register("birthday")}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {errors.birthday && (
              <p className="mt-1 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                {errors.birthday.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Photo Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 bg-orange-600 rounded-full"></div>
          <div className="flex items-center gap-2">
            <PhotoCameraIcon className="text-orange-600" style={{ fontSize: 20 }} />
            <h2 className="text-lg font-semibold text-gray-900">Parent Photo</h2>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-100 flex-shrink-0">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <PersonIcon className="text-gray-300" style={{ fontSize: 48 }} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload Parent Photo
            </label>
            <p className="text-sm text-gray-500">
              Upload a clear photo of the parent. Recommended size: 400x400 pixels
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-500 transition-all duration-200 cursor-pointer"
            >
              <PhotoCameraIcon style={{ fontSize: 20 }} />
              Choose Photo
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <InfoIcon style={{ fontSize: 16 }} />
          <span>All fields marked with * are required</span>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : type === "create" ? "Add Parent" : "Update Parent"}
        </button>
      </div>
    </form>
  );
};

export default ParentForm; 