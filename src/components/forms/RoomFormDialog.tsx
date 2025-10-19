import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BadgeInfo } from "lucide-react";
import RoomForm from "./RoomForm";
import React, { useCallback, useState, useEffect } from "react";

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update";
  data?: any;
  id?: string | number;
  onSuccess: (room: any) => void;
}

function RoomFormDialog({
  open,
  onOpenChange,
  type,
  data,
  id,
  onSuccess
}: RoomFormDialogProps) {
  // Validate props
  if (!onOpenChange || !onSuccess) {
    console.error('RoomFormDialog: Missing required props');
    return null;
  }

  const handleSuccess = useCallback((room: any) => {
    try {
      onSuccess(room);
      onOpenChange(false); // Close dialog on success
    } catch (error) {
      console.error('Room form success handler error:', error);
    }
  }, [onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-2xl font-semibold text-blue-900">
              {type === "create" ? "Add New Room" : "Update Room"}
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
                    ? "Fill in the details below to add a new room to the system"
                    : "Fill in the details below to update the room in the system"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>
        <div className="py-4">
          <RoomForm
            open={open}
            onOpenChange={onOpenChange}
            type={type}
            data={data}
            id={id}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RoomFormDialog; 