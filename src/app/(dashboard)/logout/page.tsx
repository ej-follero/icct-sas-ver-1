"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import Logo from '@/components/Logo';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LogoutPage() {
  const router = useRouter();
  const [confirm, setConfirm] = useState<null | boolean>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutComplete, setLogoutComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);
    
    try {
      // Make API call to invalidate session
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to logout. Please try again.");
      }

      // Clear client-side auth data
      localStorage.removeItem("token");
      sessionStorage.clear();
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      
      setLogoutComplete(true);
      // Remove the automatic redirect
      // setTimeout(() => {
      //   router.replace("/login");
      // }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setIsLoggingOut(false);
      setConfirm(null);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleConfirm = () => {
    setConfirm(true);
    // Auto-start logout after confirmation
    setTimeout(() => handleLogout(), 500);
  };

  // Manage focus when states change
  useEffect(() => {
    if (confirm === null) {
      const primaryButton = document.getElementById("logout-confirm");
      if (primaryButton) {
        primaryButton.focus();
      }
    }
  }, [confirm]);

  // Handle escape key to cancel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoggingOut && !logoutComplete) {
        handleCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isLoggingOut, logoutComplete]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Centered Logo for all screens */}
      <div className="flex justify-center pb-2">
        <Logo />
      </div>
      {/* Logout Card centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-0">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl p-10 border border-gray-100">
              {/* Error State */}
              {error && (
                <div className="text-center space-y-6 animate-fade-in" role="alert">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-blue-900">Logout Failed</h2>
                  <p className="text-red-600 text-base">{error}</p>
                  <Button
                    onClick={() => setError(null)}
                    className="w-full rounded-xl"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              )}
              {/* Initial State */}
              {confirm === null && !error && (
                <div className="text-center space-y-6" role="dialog" aria-labelledby="logout-title">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-slow" aria-hidden="true">
                    <LogOut className="w-10 h-10 text-white" />
                  </div>
                  <h1 id="logout-title" className="text-3xl font-extrabold text-blue-900 mb-2 tracking-tight">Log Out</h1>
                  <p className="text-gray-600 text-base">Are you sure you want to log out?</p>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                      <div className="text-left">
                        <p className="text-blue-800 font-medium text-sm">
                          What happens when you log out:
                        </p>
                        <ul className="text-blue-700 text-sm space-y-1 mt-2">
                          <li>• Your session will be securely ended</li>
                          <li>• You'll need to sign in again to access your account</li>
                          <li>• Any unsaved work will be lost</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 pt-4">
                    <Button
                      id="logout-confirm"
                      onClick={handleConfirm}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-200 focus:ring-offset-2 text-base"
                      aria-label="Confirm logout"
                    >
                      Yes, Log Me Out
                    </Button>
                    <Button
                      onClick={handleCancel}
                      className="w-full rounded-xl"
                      variant="outline"
                      aria-label="Cancel logout"
                    >
                      Stay Logged In
                    </Button>
                  </div>
                </div>
              )}
              {/* Confirmation State */}
              {confirm === true && !isLoggingOut && !error && (
                <div className="text-center space-y-6 animate-fade-in" role="status">
                  <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-blue-900">Confirming...</h2>
                  <p className="text-gray-600 text-base">Preparing to log you out securely</p>
                </div>
              )}
              {/* Logging Out State */}
              {isLoggingOut && !logoutComplete && !error && (
                <div className="text-center space-y-6 animate-fade-in" role="status" aria-label="Logging out">
                  <div className="relative">
                    <div 
                      className="w-14 h-14 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
                      aria-hidden="true"
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                      <LogOut className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-blue-900">Logging Out</h2>
                  <p className="text-gray-600 text-base">Securely ending your session...</p>
                  <div 
                    className="w-full bg-gray-200 rounded-full h-2"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={60}
                  >
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}
              {/* Success State */}
              {logoutComplete && !error && (
                <div className="text-center space-y-6 animate-fade-in" role="status">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce" aria-hidden="true">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-blue-900">Successfully Logged Out</h2>
                  <p className="text-gray-600 text-base">You have been securely logged out.</p>
                  <Button
                    onClick={() => router.replace("/login")}
                    className="w-full flex items-center justify-center gap-2 rounded"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Login
                  </Button>
                  <div className="flex justify-center space-x-1" aria-hidden="true">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      {/* Footer */}
      <footer className="mt-10 text-center text-xs text-slate-400 w-full">
        &copy; {new Date().getFullYear()} ICCT Smart Attendance System. All rights reserved.
      </footer>
      <style jsx global>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.4,0,0.2,1) both;
        }
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
      `}</style>
    </div>
  );
} 