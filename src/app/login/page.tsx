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
  Loader2,
} from "lucide-react";
import Logo from '@/components/Logo';
import { Checkbox } from '@/components/ui/checkbox';

const MIN_PASSWORD_LENGTH = 6;

const LOGIN_TYPES = {
  EMAIL: 'email',
  STUDENT_ID: 'studentId',
  EMPLOYEE_ID: 'employeeId',
};

const LoginPage = () => {
  const router = useRouter();
  const [loginType, setLoginType] = useState(LOGIN_TYPES.EMAIL);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    studentId: "",
    employeeId: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
        body: JSON.stringify({ ...formData, rememberMe }),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      {/* Centered Logo for all screens */}
      <div className="flex justify-center pt-16 pb-10">
        <Logo variant="default" />
      </div>
      {/* Login Form centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-0">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="text-center mb-8 mt-8">
              <h2 className="text-3xl font-extrabold text-blue-900 mb-2 tracking-tight">Welcome Back</h2>
              <p className="text-gray-600 text-base">Sign in to access your account</p>
            </div>
            {/* Login Type Switcher */}
            <div className="mb-8">
              <div className="flex justify-center gap-2 mb-4">
                {[LOGIN_TYPES.EMAIL, LOGIN_TYPES.STUDENT_ID, LOGIN_TYPES.EMPLOYEE_ID].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLoginType(type)}
                    className={`flex-1 min-w-[100px] px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 h-12
                      ${loginType === type ? 'bg-gradient-to-r from-indigo-500 to-blue-400 text-white shadow' : 'bg-white text-blue-900 border border-blue-200 hover:bg-blue-50'}`}
                    aria-pressed={loginType === type}
                    style={{ flexBasis: '0', flexGrow: 1 }}
                  >
                    {type === LOGIN_TYPES.EMAIL ? <EmailIcon className="inline-block mr-1 h-4 w-4 align-text-bottom" /> : <User className="inline-block mr-1 h-4 w-4 align-text-bottom" />} {type === LOGIN_TYPES.EMAIL ? 'Email' : type === LOGIN_TYPES.STUDENT_ID ? 'Student ID' : 'Employee ID'}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-10 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                {/* Dynamic Input Fields */}
                {loginType === LOGIN_TYPES.EMAIL && (
                  <div className="mb-2">
                    <Label htmlFor="email" className="block mb-1 text-gray-700 font-semibold text-base text-left">Email Address</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
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
                        className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200 text-gray-900"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                )}
                {loginType === LOGIN_TYPES.STUDENT_ID && (
                  <div className="mb-2">
                    <Label htmlFor="studentId" className="block mb-1 text-gray-700 font-semibold text-base text-left">Student ID</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                        <User size={20} />
                      </span>
                      <Input
                        id="studentId"
                        name="studentId"
                        type="text"
                        autoComplete="username"
                        required
                        value={formData.studentId}
                        onChange={handleChange}
                        className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200 text-gray-900"
                        placeholder="Enter your student ID"
                      />
                    </div>
                  </div>
                )}
                {loginType === LOGIN_TYPES.EMPLOYEE_ID && (
                  <div className="mb-2">
                    <Label htmlFor="employeeId" className="block mb-1 text-gray-700 font-semibold text-base text-left">Employee ID</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                        <User size={20} />
                      </span>
                      <Input
                        id="employeeId"
                        name="employeeId"
                        type="text"
                        autoComplete="username"
                        required
                        value={formData.employeeId}
                        onChange={handleChange}
                        className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200 text-gray-900"
                        placeholder="Enter your employee ID"
                      />
                    </div>
                  </div>
                )}
                {/* Password Input (always shown) */}
                <div className="mb-2">
                  <Label htmlFor="password" className="block mb-1 text-gray-700 font-semibold text-base text-left">Password</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
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
                      className="pl-12 pr-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200 text-gray-700"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1 rounded-lg transition-colors duration-200"
                      tabIndex={0}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>
                {/* Remember me and forgot password in the same row */}
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="flex items-center space-x-3 cursor-pointer select-none"
                    onClick={() => setRememberMe((prev) => !prev)}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={rememberMe}
                    onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') setRememberMe(prev => !prev); }}
                  >
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={setRememberMe}
                      aria-label="Remember me"
                      tabIndex={-1}
                    />
                    <span className="text-sm text-gray-700 font-medium">Remember me</span>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>
                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm text-center bg-red-50 p-4 rounded-xl border border-red-200"
                  >
                    {error}
                  </motion.div>
                )}
                {/* Submit Button */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="animate-spin mr-2 h-5 w-5" />}
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="border-t border-gray-200 mt-12" />
      <footer className="w-full text-center py-4 text-xs text-gray-400">
        © {new Date().getFullYear()} ICCT Smart Attendance System. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginPage;
