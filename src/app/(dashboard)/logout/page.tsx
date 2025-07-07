"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft, CheckCircle, AlertCircle, XCircle } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [confirm, setConfirm] = useState<null | boolean>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutComplete, setLogoutComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

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
      
      // Redirect after showing success state
      setTimeout(() => {
        router.replace("/login");
      }, 1000);
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
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8"
      role="main"
      aria-live="polite"
    >
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10 transform transition-all duration-500 ease-out animate-slide-up">
          
          {/* Error State */}
          {error && (
            <div className="text-center space-y-4 sm:space-y-6 animate-fade-in" role="alert">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Logout Failed</h2>
              <p className="text-red-600 text-sm sm:text-base">{error}</p>
              <button
                onClick={() => setError(null)}
                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-offset-2 text-sm sm:text-base"
                aria-label="Try again"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Initial State */}
          {confirm === null && !error && (
            <div className="text-center space-y-4 sm:space-y-6" role="dialog" aria-labelledby="logout-title">
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-slow" aria-hidden="true">
                <LogOut className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 id="logout-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Log Out
                </h1>
                <p className="text-gray-600 text-base sm:text-lg font-medium">
                  Are you sure you want to log out?
                </p>
              </div>

              {/* Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 space-y-2">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <div className="text-left">
                    <p className="text-blue-800 font-medium text-xs sm:text-sm">
                      What happens when you log out:
                    </p>
                    <ul className="text-blue-700 text-xs sm:text-sm space-y-1 mt-2">
                      <li>• Your session will be securely ended</li>
                      <li>• You'll need to sign in again to access your account</li>
                      <li>• Any unsaved work will be lost</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  id="logout-confirm"
                  onClick={handleConfirm}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-200 focus:ring-offset-2 text-sm sm:text-base"
                  aria-label="Confirm logout"
                >
                  Yes, Log Me Out
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-offset-2 text-sm sm:text-base"
                  aria-label="Cancel logout"
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          )}

          {/* Confirmation State */}
          {confirm === true && !isLoggingOut && !error && (
            <div className="text-center space-y-4 sm:space-y-6 animate-fade-in" role="status">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Confirming...</h2>
              <p className="text-gray-600 text-sm sm:text-base">Preparing to log you out securely</p>
            </div>
          )}

          {/* Logging Out State */}
          {isLoggingOut && !logoutComplete && !error && (
            <div className="text-center space-y-4 sm:space-y-6 animate-fade-in" role="status" aria-label="Logging out">
              <div className="relative">
                <div 
                  className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"
                  aria-hidden="true"
                ></div>
                <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <LogOut className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Logging Out</h2>
              <p className="text-gray-600 text-sm sm:text-base">Securely ending your session...</p>
              
              {/* Progress indicator */}
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
            <div className="text-center space-y-4 sm:space-y-6 animate-fade-in" role="status">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce" aria-hidden="true">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Successfully Logged Out</h2>
              <p className="text-gray-600 text-sm sm:text-base">Redirecting to login page...</p>
              
              {/* Success animation */}
              <div className="flex justify-center space-x-1" aria-hidden="true">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 