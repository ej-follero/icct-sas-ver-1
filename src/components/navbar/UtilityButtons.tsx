"use client";

import React from "react";
import { Sun, Moon, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export const UtilityButtons: React.FC = () => {
  const { theme, resolvedTheme, toggleTheme, changeTheme } = useTheme();

  const handleHelpClick = () => {
    window.location.href = "/help";
  };

  const handleThemeClick = () => {
    toggleTheme();
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Toggle theme" 
        onClick={handleThemeClick}
        title={resolvedTheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      >
        {resolvedTheme === "light" ? (
          <Moon className="w-5 h-5 text-gray-700" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-500" />
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Help/Support" 
        onClick={handleHelpClick}
        title="Help & Support"
      >
        <HelpCircle className="w-5 h-5 text-gray-700" />
      </Button>
    </>
  );
}; 