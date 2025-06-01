"use client";

import { Loader2 } from "lucide-react";

const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
        <p className="text-gray-600 text-base font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;
