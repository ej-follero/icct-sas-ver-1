"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail as EmailIcon, Loader2 } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSubmitted(false);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      <div className="flex justify-center pt-16 pb-10">
        <Logo variant="default" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-0">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 mt-8">
            <h2 className="text-3xl font-extrabold text-blue-900 mb-2 tracking-tight">Forgot Password</h2>
            <p className="text-gray-600 text-base">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-10 border border-gray-100">
            {submitted ? (
              <div className="text-center">
                <p className="text-blue-300 font-semibold mb-4">If an account with that email exists, a reset link has been sent.</p>
                <Link href="/login" className="text-blue-600 hover:underline font-semibold text-base">Back to Login</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7" noValidate>
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
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-12 h-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-200 text-gray-900"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                {error && <p className="text-red-600 text-sm text-left font-medium bg-red-50 p-3 rounded-xl border border-red-200">{error}</p>}
                <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-400 text-white font-semibold text-lg py-3 shadow hover:from-indigo-600 hover:to-blue-500 transition-all duration-200 flex items-center justify-center" disabled={!!error || submitted}>
                  {submitted ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                  Send Reset Link
                </Button>
                <div className="text-center mt-4">
                  <Link href="/login" className="text-blue-600 hover:underline font-semibold text-base">Back to Login</Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 mt-12" />
      <footer className="w-full text-center py-4 text-xs text-gray-400">
        © {new Date().getFullYear()} ICCT Smart Attendance System. All rights reserved.
      </footer>
    </div>
  );
};

export default ForgotPasswordPage; 