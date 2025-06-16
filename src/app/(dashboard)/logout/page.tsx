"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const [confirm, setConfirm] = useState<null | boolean>(null);

  const handleLogout = () => {
    // Clear authentication tokens or session here
    if (typeof window !== "undefined") {
      localStorage.removeItem("token"); // Adjust key as needed
      sessionStorage.clear();
      // Optionally clear cookies if used
      // document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    router.replace("/login");
  };

  const handleCancel = () => {
    // Redirect to dashboard or previous page
    router.replace("/overview"); // Adjust as needed
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 animate-fade-in">
      <div className="text-center bg-white/90 p-10 rounded-3xl shadow-2xl border border-blue-100 max-w-md w-full transition-all duration-300">
        {confirm === null && (
          <>
            <div className="flex flex-col items-center mb-6">
              <span className="bg-blue-100 p-4 rounded-full mb-4 animate-pop">
                <LogOut className="w-10 h-10 text-blue-600" />
              </span>
              <div className="text-2xl font-extrabold text-blue-800 mb-2">Log Out?</div>
              <p className="text-blue-700 text-lg mb-2">Are you sure you want to log out?</p>
              <p className="text-blue-400 text-sm">You will need to sign in again to access your dashboard.</p>
            </div>
            <div className="flex justify-center gap-6 mt-8">
              <button
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 active:scale-95 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all text-lg focus:outline-none focus:ring-4 focus:ring-blue-200"
                onClick={() => setConfirm(true)}
              >
                Yes, Log me out
              </button>
              <button
                className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 active:scale-95 text-blue-700 font-bold px-8 py-3 rounded-xl shadow transition-all text-lg border border-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                onClick={handleCancel}
              >
                No, Stay logged in
              </button>
            </div>
          </>
        )}
        {confirm === true && (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600 mb-4"></div>
              <div className="text-xl font-semibold text-blue-700">Logging out...</div>
            </div>
            {setTimeout(handleLogout, 1000) && null}
          </>
        )}
      </div>
      <style jsx>{`
        .animate-fade-in {
          animation: fadeInBg 0.7s ease;
        }
        @keyframes fadeInBg {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-pop {
          animation: popIn 0.5s cubic-bezier(0.23, 1.12, 0.32, 1) both;
        }
        @keyframes popIn {
          0% { transform: scale(0.7); opacity: 0; }
          80% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
} 