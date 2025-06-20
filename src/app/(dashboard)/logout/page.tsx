"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [confirm, setConfirm] = useState<null | boolean>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutComplete, setLogoutComplete] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Simulate logout process with proper timing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Clear authentication tokens or session here
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      sessionStorage.clear();
      // Clear any other auth-related data
      localStorage.removeItem("user");
      localStorage.removeItem("role");
    }
    
    setLogoutComplete(true);
    
    // Redirect after showing success state
    setTimeout(() => {
      router.replace("/login");
    }, 1000);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleConfirm = () => {
    setConfirm(true);
    // Auto-start logout after confirmation
    setTimeout(() => handleLogout(), 500);
  };

  // Auto-focus the primary action button for better UX
  useEffect(() => {
    const primaryButton = document.getElementById("logout-confirm");
    if (primaryButton) {
      primaryButton.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8 lg:p-10 transform transition-all duration-500 ease-out animate-slide-up">
          
          {/* Initial State */}
          {confirm === null && (
            <div className="text-center space-y-4 sm:space-y-6">
              {/* Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce-slow">
                <LogOut className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Log Out
                </h1>
                <p className="text-gray-600 text-base sm:text-lg font-medium">
                  Are you sure you want to log out?
                </p>
              </div>

              {/* Description */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 space-y-2">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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
                >
                  Yes, Log Me Out
                </button>
                <button
                  onClick={handleCancel}
                  className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-offset-2 text-sm sm:text-base"
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          )}

          {/* Confirmation State */}
          {confirm === true && !isLoggingOut && (
            <div className="text-center space-y-4 sm:space-y-6 animate-fade-in">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Confirming...</h2>
              <p className="text-gray-600 text-sm sm:text-base">Preparing to log you out securely</p>
            </div>
          )}

          {/* Logging Out State */}
          {isLoggingOut && !logoutComplete && (
            <div className="text-center space-y-4 sm:space-y-6 animate-fade-in">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <LogOut className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 animate-pulse" />
                </div>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Logging Out</h2>
              <p className="text-gray-600 text-sm sm:text-base">Securely ending your session...</p>
              
              {/* Progress indicator */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {/* Success State */}
          {logoutComplete && (
            <div className="text-center space-y-4 sm:space-y-6 animate-fade-in">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Successfully Logged Out</h2>
              <p className="text-gray-600 text-sm sm:text-base">Redirecting to login page...</p>
              
              {/* Success animation */}
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
} 