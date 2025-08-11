import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate context-aware bulk actions based on selected items
 * This function can be used across all pages to show appropriate bulk actions
 */
export function generateBulkActions<T extends { [key: string]: any }>({
  selectedItems,
  entityLabel,
  onBulkDelete,
  onBulkRestore,
  onBulkActions,
  onExport,
  loading = false,
  statusField = 'status',
  deletedStatus = 'DELETED',
  activeStatuses = ['ACTIVE', 'INACTIVE'],
  exportHandler,
}: {
  selectedItems: T[];
  entityLabel: string;
  onBulkDelete: () => void;
  onBulkRestore: () => void;
  onBulkActions: () => void;
  onExport: () => void;
  loading?: boolean;
  statusField?: string;
  deletedStatus?: string;
  activeStatuses?: string[];
  exportHandler?: (type: 'csv' | 'excel' | 'pdf') => void;
}) {
  const hasDeletedItems = selectedItems.some(item => item[statusField] === deletedStatus);
  const hasActiveItems = selectedItems.some(item => activeStatuses.includes(item[statusField]));

  const baseActions = [
    {
      key: 'bulk-actions',
      label: 'Bulk Actions',
      icon: 'settings',
      onClick: onBulkActions,
      tooltip: `Open enhanced bulk actions dialog for selected ${entityLabel}`,
      variant: 'default' as const,
    },
    {
      key: 'export',
      label: 'Quick Export',
      icon: 'download',
      onClick: onExport,
      tooltip: `Quick export selected ${entityLabel} to CSV`,
      variant: 'outline' as const,
    },
  ];

  // Determine which delete/restore actions to show
  let deleteRestoreActions: any[] = [];

  // If all selected items are deleted, show Restore
  if (hasDeletedItems && !hasActiveItems) {
    deleteRestoreActions = [{
      key: 'restore',
      label: 'Restore',
      icon: 'rotate-ccw',
      onClick: onBulkRestore,
      tooltip: `Restore selected deleted ${entityLabel}`,
      variant: 'outline' as const,
    }];
  }
  // If all selected items are active/inactive, show Soft Delete
  else if (hasActiveItems && !hasDeletedItems) {
    deleteRestoreActions = [{
      key: 'delete',
      label: 'Soft Delete',
      icon: 'trash-2',
      onClick: onBulkDelete,
      loading,
      disabled: loading,
      tooltip: `Soft delete selected ${entityLabel}`,
      variant: 'destructive' as const,
    }];
  }
  // If mixed status, show both options
  else if (hasActiveItems && hasDeletedItems) {
    deleteRestoreActions = [
      {
        key: 'delete',
        label: 'Soft Delete',
        icon: 'trash-2',
        onClick: onBulkDelete,
        loading,
        disabled: loading,
        tooltip: `Soft delete selected active/inactive ${entityLabel}`,
        variant: 'destructive' as const,
      },
      {
        key: 'restore',
        label: 'Restore',
        icon: 'rotate-ccw',
        onClick: onBulkRestore,
        tooltip: `Restore selected deleted ${entityLabel}`,
        variant: 'outline' as const,
      }
    ];
  }

  return [...baseActions, ...deleteRestoreActions];
}

/**
 * Map icon names to React components
 */
export function getIconComponent(iconName: string) {
  const iconMap: { [key: string]: any } = {
    'settings': 'Settings',
    'download': 'Download',
    'trash-2': 'Trash2',
    'rotate-ccw': 'RotateCcw',
    'loader-2': 'Loader2',
  };
  
  return iconMap[iconName] || 'Settings';
}
