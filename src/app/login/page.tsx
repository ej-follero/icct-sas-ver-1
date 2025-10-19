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
  IDENTIFIER: 'identifier',
};

const LoginPage = () => {
  const router = useRouter();
  const [loginType, setLoginType] = useState(LOGIN_TYPES.IDENTIFIER);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
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
        body: JSON.stringify({ 
          identifier: formData.identifier, 
          password: formData.password, 
          rememberMe 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Add minimum loading time to show "Signing in..." for longer
      const minLoadingTime = 2000; // 2 seconds minimum
      const startTime = Date.now();
      
      // Redirect based on user role
      const redirectToDashboard = () => {
        switch (data.user.role) {
          case 'SUPER_ADMIN':
          case 'ADMIN':
          case 'DEPARTMENT_HEAD':
            router.push('/dashboard');
            break;
          case 'INSTRUCTOR':
            router.push('/dashboard');
            break;
          case 'STUDENT':
            router.push('/dashboard');
            break;
          default:
            router.push('/dashboard');
        }
        
        // Keep loading state active until dashboard loads
        // The loading will be cleared when the component unmounts (dashboard loads)
      };

      // Ensure minimum loading time has passed before redirecting
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      setTimeout(() => {
        redirectToDashboard();
        // Don't set isLoading to false here - let it continue until dashboard loads
      }, remainingTime);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred during login');
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
            {/* Concise login hint */}
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-10 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-7" noValidate>
                {/* Single identifier field */}
                <div className="mb-2">
                  <Label htmlFor="identifier" className="block mb-1 text-gray-700 font-semibold text-base text-left">Email or ID</Label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-gray-400">
                      <User size={20} />
                    </span>
                    <Input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.identifier}
                      onChange={handleChange}
                      className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200 text-gray-900"
                      placeholder="e.g. email, 2025-01234, or 102"
                    />
                  </div>
                </div>
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
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 p-1 rounded transition-colors duration-200"
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
