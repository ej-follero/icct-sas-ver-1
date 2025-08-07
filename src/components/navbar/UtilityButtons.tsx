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
        className="hover:bg-white rounded-xl"
      >
        {resolvedTheme === "light" ? (
          <Moon className="w-5 h-5 text-blue-700" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-500" />
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Help/Support" 
        onClick={handleHelpClick}
        className="hover:bg-white rounded-xl"
      >
        <HelpCircle className="w-5 h-5 text-blue-700" />
      </Button>
    </>
  );
}; 