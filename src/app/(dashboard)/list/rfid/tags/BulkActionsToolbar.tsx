import { Button } from "@/components/ui/button";

interface BulkActionsToolbarProps {
  selectedTagIds: number[];
  userRole: 'admin' | 'staff' | 'viewer';
  submitting: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;
  canBulk: boolean;
}

export default function BulkActionsToolbar({
  selectedTagIds,
  userRole,
  submitting,
  setBulkDeleteDialogOpen,
  canBulk,
}: BulkActionsToolbarProps) {
  if (selectedTagIds.length === 0) return null;
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
        {submitting ? "Deleting..." : `Delete Selected (${selectedTagIds.length})`}
      </Button>
    </div>
  );
} 