"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Input,
} from "@/components/ui/input";
import {
  Button,
} from "@/components/ui/button";
import {
  Label,
} from "@/components/ui/label";
import {
  Avatar,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Mail as EmailIcon,
  Lock as LockIcon,
  Eye,
  EyeOff,
  User,
} from "lucide-react";

const MIN_PASSWORD_LENGTH = 6;

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect based on user role
      switch (data.user.role) {
        case 'ADMIN':
          router.push('/dashboard');
          break;
        case 'TEACHER':
          router.push('/dashboard');
          break;
        case 'STUDENT':
          router.push('/dashboard');
          break;
        case 'GUARDIAN':
          router.push('/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{" "}
              <Link
                href="/sign-up"
                className="text-blue-600 font-medium hover:underline"
              >
                create a new account
              </Link>
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Email Input */}
              <div>
                <Label htmlFor="email" className="mb-1 font-semibold">
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <EmailIcon size={20} />
                  </span>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <Label htmlFor="password" className="mb-1 font-semibold">
                  Password
                </Label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <LockIcon size={20} />
                  </span>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember me and forgot password */}
              <div className="flex items-center justify-between">
                <Label htmlFor="remember" className="flex items-center space-x-2 cursor-pointer">
                  <input
                    id="remember"
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 select-none">Remember me</span>
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm text-center bg-red-50 p-2 rounded-md"
                >
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full py-3 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-grow border-t border-gray-200" />
              <span className="mx-4 text-gray-400 text-sm">Or continue with</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            {/* Alternative Auth Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1 font-medium">
                <User className="mr-2 h-5 w-5" />
                Student ID
              </Button>
              <Button variant="outline" className="flex-1 font-medium">
                <User className="mr-2 h-5 w-5" />
                Employee ID
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
