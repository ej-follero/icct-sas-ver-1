"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Camera,
  Info,
  Briefcase,
  Droplet,
  Cake,
  Venus,
  Mars,
} from "lucide-react";
import { InputField } from "./InputField";
import FormSection from "./FormSection";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from "@/components/ui";

const schema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
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
  data?: Partial<FormData>;
}

export default function ParentForm({ type, data }: ParentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Title */}
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
        <FormSection title="Authentication Details" icon={Mail} color="blue">
          <InputField
            label="Username"
            name="username"
            control={form.control}
            error={form.formState.errors.username?.message}
            placeholder="Enter username"
          />
          <InputField
            label="Email Address"
            name="email"
            type="email"
            control={form.control}
            error={form.formState.errors.email?.message}
            placeholder="Enter email address"
          />
          {type === "create" && (
            <InputField
              label="Password"
              name="password"
              type="password"
              control={form.control}
              error={form.formState.errors.password?.message}
              placeholder="Enter password (min. 6 characters)"
            />
          )}
        </FormSection>

        {/* Personal Information Section */}
        <FormSection title="Personal Information" icon={User} color="green">
          <InputField
            label="First Name"
            name="firstName"
            control={form.control}
            error={form.formState.errors.firstName?.message}
            placeholder="Enter first name"
          />
          <InputField
            label="Last Name"
            name="lastName"
            control={form.control}
            error={form.formState.errors.lastName?.message}
            placeholder="Enter last name"
          />
          <InputField
            label="Phone Number"
            name="phone"
            type="tel"
            control={form.control}
            error={form.formState.errors.phone?.message}
            placeholder="Enter phone number"
          />
          <InputField
            label="Address"
            name="address"
            control={form.control}
            error={form.formState.errors.address?.message}
            placeholder="Enter complete address"
          />
          <InputField
            label="Occupation"
            name="occupation"
            control={form.control}
            error={form.formState.errors.occupation?.message}
            placeholder="Enter occupation"
          />
        </FormSection>

        {/* Additional Information Section */}
        <FormSection title="Additional Information" icon={Briefcase} color="purple">
          {/* Blood Type */}
          <FormField
            control={form.control}
            name="bloodType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood Type</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage>{form.formState.errors.bloodType?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Sex */}
          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sex</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage>{form.formState.errors.sex?.message}</FormMessage>
              </FormItem>
            )}
          />

          {/* Birthday */}
          <FormField
            control={form.control}
            name="birthday"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Birthday</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage>{form.formState.errors.birthday?.message}</FormMessage>
              </FormItem>
            )}
          />
        </FormSection>

        {/* Photo Upload Section */}
        <FormSection title="Parent Photo" icon={Camera} color="orange">
          <div className="flex items-center gap-6 col-span-2">
            <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-100 flex-shrink-0">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="text-gray-300" size={48} />
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
                <Camera size={20} />
                Choose Photo
              </label>
            </div>
          </div>
        </FormSection>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info size={16} />
            <span>All fields marked with * are required</span>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : type === "create" ? "Add Parent" : "Update Parent"}
          </Button>
        </div>
      </form>
    </Form>
  );
}