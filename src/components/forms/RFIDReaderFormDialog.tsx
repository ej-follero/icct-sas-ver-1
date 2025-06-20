import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RFIDReaderForm from "./RFIDReaderForm";
import React from "react";

interface RFIDReaderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "create" | "update";
  data?: any;
  id?: number;
  onSuccess: (data: any) => void;
}

function RFIDReaderFormDialog({
  open,
  onOpenChange,
  type,
  data,
  id,
  onSuccess
}: RFIDReaderFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-blue-900">
            {type === "create" ? "Add New RFID Reader" : "Update RFID Reader"}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <RFIDReaderForm
            type={type}
            data={data}
            id={id}
            onSuccess={(formData) => {
              onSuccess(formData);
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RFIDReaderFormDialog; 