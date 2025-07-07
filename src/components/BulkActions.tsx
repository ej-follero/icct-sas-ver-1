import { Alert, AlertDescription } from "./ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import React from "react";

interface BulkActionsProps {
  selectedCount: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({ selectedCount, onActivate, onDeactivate, onDelete }) => (
  <Alert className="mb-4">
    <AlertTriangle className="h-4 w-4 text-yellow-500" />
    <AlertDescription>
      <div className="flex items-center justify-between">
        <span>{selectedCount} schedule(s) selected</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onActivate}>
            Activate
          </Button>
          <Button variant="outline" size="sm" onClick={onDeactivate}>
            Deactivate
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </AlertDescription>
  </Alert>
);

export default BulkActions; 