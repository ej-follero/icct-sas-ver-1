import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export const PageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 w-32 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-white/10 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="relative overflow-hidden border border-gray-200 bg-white rounded-xl shadow-lg">
              <CardContent className="p-0">
                <div className="flex h-full min-h-[80px]">
                  {/* Left Colored Section Skeleton */}
                  <div className="relative flex items-center justify-center w-16 min-w-[64px] rounded-l-xl bg-gray-200 animate-pulse">
                    <div className="w-10 h-10 bg-white rounded-full border-2 border-white/80 flex items-center justify-center shadow-sm">
                      <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Right White Section Skeleton */}
                  <div className="flex-1 flex flex-col justify-center px-4 py-3">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-12 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions Panel Skeleton */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden mb-6">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center">
                  <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
                </div>
                <div>
                  <div className="h-6 w-32 bg-white/20 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-48 bg-white/10 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-24 bg-white/20 rounded animate-pulse"></div>
                <div className="w-8 h-8 bg-white/20 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Action Cards Grid Skeleton */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div 
                  key={index}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-xl flex items-center justify-center animate-pulse">
                        <div className="w-5 h-5 bg-gray-400 rounded animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-4 w-24 bg-gray-300 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Skeleton */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-right">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse ml-auto"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area Skeleton */}
        <div className="w-full max-w-full">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
            {/* Blue Gradient Header Skeleton */}
            <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
              <div className="py-4 sm:py-6">
                <div className="flex items-center gap-3 px-4 sm:px-6">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div className="w-5 h-5 bg-white/20 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-5 w-32 bg-white/20 rounded animate-pulse mb-1"></div>
                    <div className="h-4 w-48 bg-white/10 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Section Skeleton */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-between">
                <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
                  <div className="h-10 w-full bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                  <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-9 w-28 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Table Content Skeleton */}
            <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
              {/* Table Header Skeleton */}
              <div className="hidden xl:block">
                <div className="grid grid-cols-8 gap-4 py-3 border-b border-gray-200">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
                
                {/* Table Rows Skeleton */}
                {[...Array(5)].map((_, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-8 gap-4 py-4 border-b border-gray-100">
                    {[...Array(8)].map((_, colIndex) => (
                      <div key={colIndex} className="h-4 bg-gray-100 rounded animate-pulse"></div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Card Layout Skeleton for Mobile */}
              <div className="block xl:hidden p-2 sm:p-3 lg:p-4 max-w-full">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
                      <div className="h-4 w-28 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Skeleton */}
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton; 