import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BadgeInfo } from "lucide-react";
import SubjectForm from "./SubjectForm";
import React from "react";

interface SubjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update";
  data?: any;
  id?: string;
  onSuccess: () => void;
}

function SubjectFormDialog({
  open,
  onOpenChange,
  type,
  data,
  id,
  onSuccess
}: SubjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-2xl font-semibold text-blue-900">
              {type === "create" ? "Add New Subject" : "Update Subject"}
            </DialogTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-blue-400 cursor-pointer">
                    <BadgeInfo className="w-5 h-5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-blue-900 text-white">
                  {type === "create"
                    ? "Fill in the details below to add a new subject to the system"
                    : "Fill in the details below to update the subject in the system"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>
        <div className="py-4">
          <SubjectForm
            type={type}
            data={data}
            id={id}
            onSuccess={onSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SubjectFormDialog; 