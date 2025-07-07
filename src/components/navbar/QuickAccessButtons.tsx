"use client";

import React from "react";
import { LayoutDashboard, FileBarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickAccessButtonsProps {
  onDashboardClick: () => void;
  onReportsClick: () => void;
}

export const QuickAccessButtons: React.FC<QuickAccessButtonsProps> = ({
  onDashboardClick,
  onReportsClick,
}) => {
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Dashboard" 
        onClick={onDashboardClick}
        title="Dashboard"
      > 
        <LayoutDashboard className="w-5 h-5 text-gray-700" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Reports" 
        onClick={onReportsClick}
        title="Reports"
      > 
        <FileBarChart2 className="w-5 h-5 text-gray-700" />
      </Button>
    </>
  );
}; 