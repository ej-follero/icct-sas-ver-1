import { Alert, AlertDescription } from "./ui/alert";
import { AlertTriangle, Copy, Download, Archive, Edit, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import React from "react";

interface BulkActionsProps {
  selectedCount: number;
  selectedSchedules: Array<{ status: string }>;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onBulkEdit: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onArchive: () => void;
  onBulkStatusChange: (status: string) => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({ 
  selectedCount, 
  selectedSchedules, 
  onActivate, 
  onDeactivate, 
  onDelete,
  onBulkEdit,
  onDuplicate,
  onExport,
  onArchive,
  onBulkStatusChange
}) => {
  // Determine which buttons to show based on status
  const hasInactiveSchedules = selectedSchedules.some(schedule => schedule.status === 'Inactive');
  const hasActiveSchedules = selectedSchedules.some(schedule => schedule.status === 'Active');
  
  const statusOptions = [
    { value: 'Active', label: 'Active', color: 'text-green-600' },
    { value: 'Inactive', label: 'Inactive', color: 'text-gray-600' },
    { value: 'Completed', label: 'Completed', color: 'text-blue-600' },
    { value: 'Postponed', label: 'Postponed', color: 'text-yellow-600' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'text-red-600' },
  ];
  
  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>{selectedCount} schedule(s) selected</span>
          <div className="flex items-center gap-2">
            {/* Primary Actions */}
            {hasInactiveSchedules && (
              <Button variant="outline" size="sm" onClick={onActivate}>
                Activate
              </Button>
            )}
            {hasActiveSchedules && (
              <Button variant="outline" size="sm" onClick={onDeactivate}>
                Deactivate
              </Button>
            )}
            
            {/* Bulk Edit */}
            <Button variant="outline" size="sm" onClick={onBulkEdit}>
              <Edit className="w-4 h-4 mr-1" />
              Bulk Edit
            </Button>
            
            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-1" />
                  More Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Settings className="w-4 h-4 mr-2" />
                      Change Status
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {statusOptions.map((status) => (
                      <DropdownMenuItem 
                        key={status.value}
                        onClick={() => onBulkStatusChange(status.value)}
                        className={status.color}
                      >
                        {status.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Soft Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default BulkActions; 