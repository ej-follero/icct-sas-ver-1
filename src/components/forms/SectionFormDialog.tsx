import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, X } from "lucide-react";
import SectionForm from "./SectionForm";
import React, { useState } from "react";

interface SectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update";
  data?: any;
  id?: string;
  onSuccess: (section: any) => void;
}

function SectionFormDialog({
  open,
  onOpenChange,
  type,
  data,
  id,
  onSuccess
}: SectionFormDialogProps) {
  // Progress state (will be updated by SectionForm via callback)
  const [progress, setProgress] = useState(0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm border border-blue-200 shadow-2xl rounded-2xl p-0 mx-2 my-1 sm:max-w-[600px] sm:mx-4 sm:my-1 md:max-w-[750px] md:mx-6 md:my-1 lg:max-w-[900px] lg:mx-8 lg:my-1 flex flex-col">
        {/* Visually hidden DialogTitle for accessibility */}
        <DialogTitle className="sr-only">
          {type === "update" ? "Edit Section" : "Create New Section"}
        </DialogTitle>
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-4 pr-24">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {type === "update" ? "Edit Section" : "Create New Section"}
              </h2>
              <p className="text-blue-100 text-sm">
                {type === "update"
                  ? "Update section information and settings"
                  : "Add a new class section to the system"}
              </p>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-green-400 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <SectionForm
            type={type}
            data={data}
            id={id}
            onSuccess={onSuccess}
            onProgressChange={setProgress}
            onDialogClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SectionFormDialog; 