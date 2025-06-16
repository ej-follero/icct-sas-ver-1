import { Button } from "@/components/ui/button";
import { STATUS_OPTIONS } from "./constants";

interface BulkActionsToolbarProps {
  selectedReaderIds: number[];
  userRole: 'admin' | 'staff' | 'viewer';
  submitting: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  bulkStatus: string;
  setBulkStatus: (status: string) => void;
  handleBulkStatusUpdate: () => void;
  setPendingBulkStatus: (status: string) => void;
  setConfirmBulkStatus: (open: boolean) => void;
  canBulk: boolean;
}

export default function BulkActionsToolbar({
  selectedReaderIds,
  userRole,
  submitting,
  setBulkDeleteDialogOpen,
  bulkStatus,
  setBulkStatus,
  handleBulkStatusUpdate,
  setPendingBulkStatus,
  setConfirmBulkStatus,
  canBulk,
}: BulkActionsToolbarProps) {
  if (selectedReaderIds.length === 0) return null;
  if (!canBulk) {
    return (
      <div className="flex flex-col sm:flex-row justify-end mb-2 gap-2 sm:items-center">
        <span className="text-xs text-blue-400">Bulk actions are restricted for your role.</span>
      </div>
    );
  }
  if (userRole === 'viewer') {
    return (
      <div className="flex flex-col sm:flex-row justify-end mb-2 gap-2 sm:items-center">
        <span className="text-xs text-blue-400">Bulk actions are restricted for your role.</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row justify-end mb-2 gap-2 sm:items-center">
      <Button variant="destructive" onClick={() => setBulkDeleteDialogOpen(true)} disabled={submitting}>
        {submitting ? "Deleting..." : `Delete Selected (${selectedReaderIds.length})`}
      </Button>
      <div className="flex gap-2 items-center">
        <select
          className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={bulkStatus}
          onChange={e => setBulkStatus(e.target.value)}
          disabled={submitting}
          aria-label="Bulk update status"
        >
          <option value="">Set Status...</option>
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          variant="outline"
          onClick={() => { setPendingBulkStatus(bulkStatus); setConfirmBulkStatus(true); }}
          disabled={!bulkStatus || submitting}
          aria-label="Apply status to selected readers"
        >
          {submitting ? "Updating..." : "Apply"}
        </Button>
      </div>
    </div>
  );
} 