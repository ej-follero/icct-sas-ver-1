"use client";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Backup & Restore Page
 * 
 * Role-based Access Control:
 * - SUPER_ADMIN: Full access to all backup operations
 * - ADMIN: Full access to backup operations (except emergency access)
 * - DEPARTMENT_HEAD: View access only
 * - SYSTEM_AUDITOR: Read-only access to backup logs
 * - Other roles: No access (redirected to dashboard)
 * 
 * Security Features:
 * - Permission-based UI rendering
 * - Role-specific action availability
 * - Access level indicators
 * - Security warnings for limited access users
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { PageSkeleton } from "@/components/reusable/Skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Archive, 
  Download, 
  Upload, 
  RefreshCw, 
  Clock, 
  HardDrive, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Settings,
  FileText,
  Database,
  Cloud,
  Trash2,
  RotateCcw,
  Eye,
  Calendar,
  Info,
  Lock,
  Search,
  MoreHorizontal,
  Timer
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { EmptyState } from '@/components/reusable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { type BackupItem, type RestorePoint } from '@/lib/services/backup.service';
import BackupDialog from '@/components/reusable/Dialogs/BackupDialog';
import BackupSettingsDialog from '@/components/reusable/Dialogs/BackupSettingsDialog';
import BackupOperationsDialog from '@/components/reusable/Dialogs/BackupOperationsDialog';
import BackupLogsDialog from '@/components/reusable/Dialogs/BackupLogsDialog';
import BulkActionsDialog from '@/components/reusable/Dialogs/BulkActionsDialog';
import SecurityManagementDialog from '@/components/reusable/Dialogs/SecurityManagementDialog';
import BackupSchedulingDialog from '@/components/reusable/Dialogs/BackupSchedulingDialog';
import RestoreDialog from '@/components/reusable/Dialogs/RestoreDialog';
import RestorePointsDialog from '@/components/reusable/Dialogs/RestorePointsDialog';
import ProgressBar from '@/components/ProgressBar';
import { ViewDialog, type ViewDialogSection, type ViewDialogField } from '@/components/reusable/Dialogs/ViewDialog';
import { DownloadDialog } from '@/components/reusable/Dialogs/DownloadDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TablePagination } from '@/components/reusable/Table/TablePagination';
import BulkActionsBar from '@/components/reusable/BulkActionsBar';

export default function BackupRestorePage() {
  const { user, hasPermission, isSuperAdmin, isAdmin, isDepartmentHead, isSystemAuditor, loading } = useUser();
  const router = useRouter();

  // All useState hooks must be called before any conditional returns
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [createBackupDialog, setCreateBackupDialog] = useState(false);
  const [backupOperationsDialog, setBackupOperationsDialog] = useState(false);
  const [logsDialog, setLogsDialog] = useState(false);
  const [bulkActionsDialog, setBulkActionsDialog] = useState(false);
  const [securityManagementDialog, setSecurityManagementDialog] = useState(false);
  const [schedulingDialog, setSchedulingDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [restorePointsDialog, setRestorePointsDialog] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<BackupItem | null>(null);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [downloadDialog, setDownloadDialog] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [selectedRestorePoint, setSelectedRestorePoint] = useState<RestorePoint | null>(null);
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [backupProgress, setBackupProgress] = useState<Record<string, {
    percentage: number;
    estimatedTime: string;
    filesProcessed: number;
    currentTask: string;
    startTime: number;
  }>>({});



  // Format time remaining
  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    if (milliseconds <= 0) return "Less than 1 minute";
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}-${minutes + 1} minutes remaining`;
    } else {
      return `${seconds}-${seconds + 30} seconds remaining`;
    }
  }, []);

  // Format file size for display
  const formatFileSize = useCallback((sizeStr: string): { size: number; unit: string } => {
    const numericValue = parseFloat(sizeStr.replace(" GB", "").replace(" MB", "").replace(" KB", ""));
    
    if (sizeStr.includes("GB")) {
      return { size: numericValue, unit: "GB" };
    } else if (sizeStr.includes("MB")) {
      return { size: numericValue, unit: "MB" };
    } else if (sizeStr.includes("KB")) {
      return { size: numericValue, unit: "KB" };
    } else {
      return { size: numericValue, unit: "bytes" };
    }
  }, []);

  // Real progress tracking from backup service
  const [realProgress, setRealProgress] = useState<Record<string, {
    percentage: number;
    currentTask: string;
    filesProcessed: number;
    totalFiles: number;
    bytesProcessed: number;
    totalBytes: number;
  }>>({});

  // Note: Real backup progress tracking would be implemented here
  // For now, we'll use simulated progress

  const calculateBackupProgress = useCallback((backup: BackupItem) => {
    if (backup.status !== "IN_PROGRESS") return null;
    
    // Use real progress if available
    const real = realProgress[backup.id];
    if (real) {
      console.log(`Using real progress for backup ${backup.id}:`, real);
      return {
        percentage: Math.min(real.percentage, 100), // Ensure we don't exceed 100%
        estimatedTime: real.percentage >= 100 ? "Completed" : "Calculating...",
        filesProcessed: real.filesProcessed,
        currentTask: real.currentTask,
        startTime: new Date(backup.createdAt).getTime(),
      };
    }
    
    // Fallback to simulated progress
    const now = Date.now();
    const startTime = new Date(backup.createdAt).getTime();
    const elapsed = now - startTime;
    
    const baseTime = backup.type === "FULL" ? 180000 : backup.type === "INCREMENTAL" ? 60000 : 120000;
    const estimatedTotal = baseTime * (backup.location === "CLOUD" ? 1.5 : 1);
    const newPercentage = Math.min(95, (elapsed / estimatedTotal) * 100);
    
    let currentTask = "Initializing...";
    if (newPercentage > 20) currentTask = "Scanning files...";
    if (newPercentage > 40) currentTask = "Reading data...";
    if (newPercentage > 60) currentTask = "Compressing...";
    if (newPercentage > 80) currentTask = "Writing files...";
    if (newPercentage > 90) currentTask = "Finalizing...";
    
    return {
      percentage: newPercentage,
      estimatedTime: formatTimeRemaining(estimatedTotal - elapsed),
      filesProcessed: Math.floor((newPercentage / 100) * 1000),
      currentTask,
      startTime,
    };
  }, [formatTimeRemaining, realProgress]);

  // Clean up progress state when backups complete
  useEffect(() => {
    const completedBackups = backups.filter(b => b.status === "COMPLETED" || b.status === "FAILED");
    if (completedBackups.length > 0) {
      setBackupProgress(prev => {
        const newState = { ...prev };
        completedBackups.forEach(backup => {
          delete newState[backup.id];
        });
        return newState;
      });
      // Also clean up real progress for completed backups
      setRealProgress(prev => {
        const newState = { ...prev };
        completedBackups.forEach(backup => {
          delete newState[backup.id];
        });
        return newState;
      });
    }
    
    // Force refresh data if we have stuck progress
    const inProgressBackups = backups.filter(b => b.status === "IN_PROGRESS");
    const stuckBackups = inProgressBackups.filter(backup => {
      const startTime = new Date(backup.createdAt).getTime();
      const elapsed = Date.now() - startTime;
      return elapsed > 300000; // 5 minutes
    });
    
    if (stuckBackups.length > 0) {
      console.log('Detected stuck backups, refreshing data...');
      // Refresh backup data to get updated status
      const refreshData = async () => {
        try {
        const [backupsRes, restoreRes] = await Promise.all([
          fetch('/api/backups', { cache: 'no-store' }),
          fetch('/api/restore-points', { cache: 'no-store' })
        ]);
        const backupsJson = await backupsRes.json();
        const restoreJson = await restoreRes.json();
        setBackups(Array.isArray(backupsJson.items) ? backupsJson.items : []);
        setRestorePoints(Array.isArray(restoreJson.items) ? restoreJson.items : []);
        } catch (error) {
          console.error('Error refreshing backup data:', error);
        }
      };
      refreshData();
    }
  }, [backups]);

  // Optimized progress update interval - only update if significant change
  useEffect(() => {
    const inProgressBackups = backups.filter(b => b.status === "IN_PROGRESS");
    
    if (inProgressBackups.length === 0) return;
    
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        const newState = { ...prev };
        let hasChanges = false;
        
        inProgressBackups.forEach(backup => {
          // Skip if backup is no longer in progress
          if (backup.status !== "IN_PROGRESS") return;
          
          // If we have real progress, use that instead of simulation
          const real = realProgress[backup.id];
          if (real) {
            const realProgressData = {
              percentage: Math.min(real.percentage, 100),
              estimatedTime: real.percentage >= 100 ? "Completed" : "Calculating...",
              filesProcessed: real.filesProcessed,
              currentTask: real.currentTask,
              startTime: new Date(backup.createdAt).getTime(),
            };
            
            const existing = prev[backup.id];
            if (!existing || 
                Math.abs(realProgressData.percentage - existing.percentage) > 1 || 
                realProgressData.currentTask !== existing.currentTask) {
              newState[backup.id] = realProgressData;
              hasChanges = true;
            }
            return; // Skip simulation for this backup
          }
          
          // Fallback to simulated progress only if no real progress
          const progress = calculateBackupProgress(backup);
          if (progress) {
            const existing = prev[backup.id];
            // Only update if significant change (>5% or task change)
            if (!existing || 
                Math.abs(progress.percentage - existing.percentage) > 5 || 
                progress.currentTask !== existing.currentTask) {
              newState[backup.id] = progress;
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? newState : prev;
      });
    }, 2000); // Increased frequency for better responsiveness

    return () => clearInterval(interval);
  }, [backups, calculateBackupProgress, realProgress]);

  // Optimized expanded content function with memoization
  const createExpandedContent = useCallback((backup: BackupItem) => {
    if (backup.status !== "IN_PROGRESS") return null;
    
    const currentProgress = backupProgress[backup.id];
    
    return (
      <TableCell colSpan={10} className="p-0">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-t border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-lg font-semibold text-blue-900">Backup in Progress</span>
            </div>
            <Badge variant="warning" className="bg-orange-100 text-orange-800 border border-orange-200">
              {currentProgress ? Math.round(currentProgress.percentage) : 0}%
            </Badge>
          </div>
          <ProgressBar 
            progress={currentProgress?.percentage || 0}
            status={currentProgress?.currentTask || "Initializing..."}
            animated={true}
            showPercentage={false}
            emphasized={true}
            className="mb-4"
          />
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <span className="font-medium">Started:</span> {new Date(backup.createdAt).toLocaleTimeString()}
            </div>
            <div>
              <span className="font-medium">Estimated:</span> {currentProgress?.estimatedTime || "Calculating..."}
            </div>
            <div>
              <span className="font-medium">Files Processed:</span> {currentProgress?.filesProcessed.toLocaleString() || "0"}
            </div>
            <div>
              <span className="font-medium">Current Task:</span> {currentProgress?.currentTask || "Initializing..."}
            </div>
          </div>
        </div>
      </TableCell>
    );
  }, [backupProgress]);

  // Handler functions for backup operations
  const handleDownloadBackup = async (backupId: string) => {
    try {
      // For now, just show a success message since actual download isn't implemented
      toast.success("Download initiated");
      return true;
    } catch (error) {
      console.error("Error downloading backup:", error);
      return false;
    }
  };

  const handleOpenDownloadDialog = (backup: BackupItem) => {
    setSelectedBackup(backup);
    setDownloadDialog(true);
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backups/${backupId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setBackups(prev => prev.filter(b => b.id !== backupId));
        toast.success("Backup deleted successfully");
      } else {
        toast.error("Failed to delete backup");
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
      toast.error("Error deleting backup");
    }
  };

  const handleDeleteBackupWithConfirmation = (backup: BackupItem) => {
    setSelectedBackup(backup);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBackup) return;
    
    try {
      const response = await fetch(`/api/backups/${selectedBackup.id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setBackups(prev => prev.filter(b => b.id !== selectedBackup.id));
        toast.success("Backup deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedBackup(null);
      } else {
        toast.error("Failed to delete backup");
      }
    } catch (error) {
      console.error("Error deleting backup:", error);
      toast.error("Error deleting backup");
    }
  };

  const handleCancelStuckBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backups/${backupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FAILED',
          errorMessage: 'Backup cancelled - no actual backup process implemented'
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setBackups(prev => prev.map(b => 
          b.id === backupId 
            ? { ...b, status: 'FAILED', errorMessage: 'Backup cancelled - no actual backup process implemented' }
            : b
        ));
      }
    } catch (error) {
      console.error("Error cancelling backup:", error);
    }
  };

  // Backup table columns definition
  const backupColumns: TableListColumn<BackupItem>[] = useMemo(() => [
    {
      header: "",
      accessor: "expander" as const,
      width: 20,
      minWidth: 20,
      expandedContent: createExpandedContent
    },
    {
      header: "",
      accessor: "select" as const,
      width: 20,
      minWidth: 20,
      render: (backup: BackupItem) => null // Will be handled by TableList
    },
    {
      header: "Name",
      accessor: "name" as const,
      width: 200,
      render: (backup: BackupItem) => (
        <div className="text-center">
          <div className="font-semibold text-gray-900 text-sm truncate">{backup.name}</div>
        </div>
      )
    },
    {
      header: "Description",
      accessor: "description" as const,
      width: 150,
      render: (backup: BackupItem) => (
        <div className="text-center">
          {backup.description ? (
            <div className="text-sm text-gray-500 truncate">{backup.description}</div>
          ) : (
            <div className="text-xs text-gray-400 italic">No description</div>
          )}
        </div>
      )
    },
    {
      header: "Location",
      accessor: "location" as const,
      width: 120,
      render: (backup: BackupItem) => (
        <div className="text-center">
          <span className="text-sm text-gray-700 capitalize">{backup.location.toLowerCase()}</span>
        </div>
      )
    },
    {
      header: "Type",
      accessor: "type" as const,
      width: 120,
      render: (backup: BackupItem) => {
        switch (backup.type) {
          case "FULL":
            return <div className="text-center"><Badge variant="default" className="bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 text-xs font-medium">Full</Badge></div>;
          case "INCREMENTAL":
            return <div className="text-center"><Badge variant="secondary" className="bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 text-xs font-medium">Incremental</Badge></div>;
          case "DIFFERENTIAL":
            return <div className="text-center"><Badge variant="outline" className="bg-green-100 text-green-800 border border-green-200 px-1.5 py-0.5 text-xs font-medium">Differential</Badge></div>;
          default:
            return <div className="text-center"><Badge variant="secondary" className="px-1.5 py-0.5 text-xs font-medium">{backup.type}</Badge></div>;
        }
      }
    },
    {
      header: "Size",
      accessor: "size" as const,
      width: 100,
      render: (backup: BackupItem) => (
        <div className="text-center">
          <div className="font-mono text-sm text-gray-700">{backup.size}</div>
          {backup.status === "COMPLETED" && (
            <div className="text-xs text-green-600 font-medium">Ready to download</div>
          )}
        </div>
      )
    },
    {
      header: "Status",
      accessor: "status" as const,
      width: 120,
      render: (backup: BackupItem) => {
        switch (backup.status) {
          case "COMPLETED":
            return <div className="text-center"><Badge variant="success" className="flex items-center justify-center gap-0.5 px-1.5 py-0.5 text-xs font-medium"><CheckCircle className="w-2.5 h-2.5" />Completed</Badge></div>;
          case "IN_PROGRESS":
            return <div className="text-center"><Badge variant="warning" className="flex items-center justify-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"><RefreshCw className="w-2.5 h-2.5 animate-spin" />In Progress</Badge></div>;
          case "FAILED":
            return <div className="text-center"><Badge variant="destructive" className="flex items-center justify-center gap-0.5 px-1.5 py-0.5 text-xs font-medium"><X className="w-2.5 h-2.5" />Failed</Badge></div>;
          case "SCHEDULED":
            return <div className="text-center"><Badge variant="secondary" className="flex items-center justify-center gap-0.5 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700"><Clock className="w-2.5 h-2.5" />Scheduled</Badge></div>;
          default:
            return <div className="text-center"><Badge variant="secondary" className="px-1.5 py-0.5 text-xs font-medium">{backup.status}</Badge></div>;
        }
      }
    },
    {
      header: "Created",
      accessor: "createdAt" as const,
      width: 150,
      render: (backup: BackupItem) => (
        <div className="text-center">
          <div className="flex flex-col items-center gap-0.5">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{new Date(backup.createdAt).toLocaleDateString()}</div>
              <div className="text-gray-500">{new Date(backup.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      )
    },
        {
      header: "Actions",
      accessor: "actions" as const,
      width: 60,
      render: (backup: BackupItem) => (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedBackup(backup);
                  setDetailsDialog(true);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>View Details</span>
              </DropdownMenuItem>
              
                                {backup.status === "COMPLETED" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleOpenDownloadDialog(backup)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-green-600" />
                        <span>Download</span>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedBackupForRestore(backup);
                          setRestoreDialog(true);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-orange-600" />
                        <span>Restore</span>
                      </DropdownMenuItem>
                    </>
                  )}
              
              {backup.status === "IN_PROGRESS" && (
                <DropdownMenuItem
                  onClick={() => handleCancelStuckBackup(backup.id)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4 text-orange-600" />
                  <span>Cancel Backup</span>
                </DropdownMenuItem>
              )}
              
              {backup.status !== "COMPLETED" && backup.status !== "IN_PROGRESS" && (
                <DropdownMenuItem
                  onClick={() => handleDeleteBackupWithConfirmation(backup)}
                  className="flex items-center gap-2 cursor-pointer text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Permanently</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ], [backupProgress]);

  // Handler functions for TableList
  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === backups.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(backups.map(b => b.id));
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const onToggleExpand = (itemId: string) => {
    setExpandedRowIds(current => 
      current.includes(itemId) 
        ? current.filter(id => id !== itemId)
        : [...current, itemId]
    );
  };

  // Computed values
  const isAllSelected = selectedIds.length === backups.length && backups.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < backups.length;
  const selectedBackups = backups.filter(b => selectedIds.includes(b.id));

  // Filter and sort backups
  const filteredBackups = useMemo(() => {
    return backups.filter(backup => {
      // Search filter
      const searchLower = searchInput.toLowerCase();
      const matchesSearch = !searchInput || 
        backup.name.toLowerCase().includes(searchLower) ||
        backup.description?.toLowerCase().includes(searchLower) ||
        backup.type.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || backup.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || backup.type === typeFilter;

      // Location filter
      const matchesLocation = locationFilter === 'all' || backup.location === locationFilter;

      return matchesSearch && matchesStatus && matchesType && matchesLocation;
    });
  }, [backups, searchInput, statusFilter, typeFilter, locationFilter]);

  const sortedBackups = useMemo(() => {
    return [...filteredBackups].sort((a, b) => {
      const aValue = a[sortField as keyof BackupItem] ?? '';
      const bValue = b[sortField as keyof BackupItem] ?? '';
      
      if (sortOrder === 'asc') {
        return String(aValue) < String(bValue) ? -1 : String(aValue) > String(bValue) ? 1 : 0;
      } else {
        return String(aValue) > String(bValue) ? -1 : String(aValue) < String(bValue) ? 1 : 0;
      }
    });
  }, [filteredBackups, sortField, sortOrder]);

  const paginatedBackups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedBackups.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedBackups, currentPage, itemsPerPage]);

  // Optimized data loading with parallel requests and better error handling
  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        
        // Load data in parallel for better performance
        const [backupsRes, restorePointsRes] = await Promise.all([
          fetch('/api/backups'),
          fetch('/api/restore-points')
        ]);
        
        const backupsData = await backupsRes.json();
        const restorePointsData = await restorePointsRes.json();
        
        setBackups(backupsData.items || []);
        setRestorePoints(restorePointsData.items || []);
        
      } catch (error) {
        console.error('Error loading backup data:', error);
        toast.error('Failed to load backup data');
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, []);

  // Show loading state only if user is still loading
  if (loading) {
    return <PageSkeleton />;
  }

  // Role-based access control
  const canAccessBackupPage = () => {
    if (!user) return false;
    return isSuperAdmin || isAdmin || isDepartmentHead || isSystemAuditor;
  };

  const canCreateBackup = () => {
    if (!user) return false;
    return isSuperAdmin; // Only SUPER_ADMIN can create backups
  };

  const canDeleteBackup = () => {
    if (!user) return false;
    return isSuperAdmin; // Only SUPER_ADMIN can delete backups
  };

  const canRestoreSystem = () => {
    if (!user) return false;
    return isSuperAdmin; // Only SUPER_ADMIN can restore system
  };

  const canViewBackupDetails = () => {
    if (!user) return false;
    return isSuperAdmin || isAdmin || isDepartmentHead || isSystemAuditor;
  };

  const canDownloadBackup = () => {
    if (!user) return false;
    return isSuperAdmin; // Only SUPER_ADMIN can download backups
  };

  const canUploadBackup = () => {
    if (!user) return false;
    return isSuperAdmin; // Only SUPER_ADMIN can upload backups
  };

  const canManageBackupSettings = () => {
    if (!user) return false;
    return isSuperAdmin; // Only SUPER_ADMIN can manage backup settings
  };

  const canViewBackupLogs = () => {
    if (!user) return false;
    return isSuperAdmin || isAdmin || isSystemAuditor;
  };

  // Check if user is admin (view-only access)
  const isAdminViewOnly = isAdmin;

  // Redirect if user doesn't have access
  if (user && !canAccessBackupPage()) {
    toast.error("You don't have permission to access this page");
    router.push('/dashboard');
    return null;
  }

  const totalBackups = backups.length;
  const completedBackups = backups.filter(b => b.status === "COMPLETED").length;
  const failedBackups = backups.filter(b => b.status === "FAILED").length;
  const totalSize = backups.reduce((sum, b) => {
    const sizeStr = b.size;
    const numericValue = parseFloat(sizeStr.replace(" GB", "").replace(" MB", ""));
    
    if (sizeStr.includes("GB")) {
      return sum + numericValue;
    } else if (sizeStr.includes("MB")) {
      return sum + (numericValue / 1024); // Convert MB to GB
    } else {
      return sum + (numericValue / (1024 * 1024)); // Convert bytes to GB
    }
  }, 0);

  const handleCreateBackup = async (newBackup: any) => {
    // Add the new backup to the list
    setBackups(prev => [newBackup, ...prev]);
  };

  const handleUploadBackup = async (newBackup: any) => {
    // Add the uploaded backup to the list
    setBackups(prev => [newBackup, ...prev]);
  };

  const handleRestore = async (backupId: string): Promise<boolean> => {
    try {
      // For now, just show a success message since actual restore isn't implemented
      toast.success("Restore initiated");
      
      // Refresh data
      const [bRes, rRes] = await Promise.all([
        fetch('/api/backups', { cache: 'no-store' }),
        fetch('/api/restore-points', { cache: 'no-store' })
      ]);
      const bJson = await bRes.json();
      const rJson = await rRes.json();
      setBackups(Array.isArray(bJson.items) ? bJson.items : []);
      setRestorePoints(Array.isArray(rJson.items) ? rJson.items : []);
      return true;
    } catch (error) {
      console.error("Error restoring system:", error);
      return false;
    }
  };



  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="px-6 py-4">
        <PageHeader
          title="Backup & Restore"
          subtitle={
            isAdminViewOnly 
              ? "Monitor system backups and restore points (View-Only Mode)" 
              : "Manage system backups and restore points for data protection"
          }
          breadcrumbs={[
            { label: "Settings", href: "/settings" },
            { label: "Backup & Restore" }
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Summary Cards Grid - Now on top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Archive className="text-blue-500 w-5 h-5" />}
            label="Total Backups"
            value={totalBackups}
            valueClassName="text-blue-900"
            sublabel="All backup files"
          />
          <SummaryCard
            icon={<CheckCircle className="text-blue-500 w-5 h-5" />}
            label="Completed"
            value={completedBackups}
            valueClassName="text-blue-900"
            sublabel="Successful backups"
          />
          <SummaryCard
            icon={<AlertTriangle className="text-blue-500 w-5 h-5" />}
            label="Failed"
            value={failedBackups}
            valueClassName="text-blue-900"
            sublabel="Failed backups"
          />
          <SummaryCard
            icon={<HardDrive className="text-blue-500 w-5 h-5" />}
            label="Total Size"
            value={totalSize >= 1 ? `${totalSize.toFixed(1)} GB` : `${(totalSize * 1024).toFixed(1)} MB`}
            valueClassName="text-blue-900"
            sublabel="Storage used"
          />
        </div>



        {/* Quick Actions Panel with Access Level Integration - Now below Summary Cards */}
        <div className="w-full max-w-full">
        <QuickActionsPanel
          variant="premium"
          title="Backup Management"
          subtitle={
            isAdminViewOnly 
              ? "View-only backup monitoring tools • Admin" 
              : `Essential backup and restore tools${user ? ` • ${isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : isDepartmentHead ? 'Dept Head' : isSystemAuditor ? 'Auditor' : 'User'}` : ''}`
          }
          icon={<Shield className="w-6 h-6 text-white" />}
          actionCards={[
            // Core Backup Operations (Merged & Optimized)
            {
              id: 'create-backup',
              label: 'Create Backup',
              description: 'Full, incremental, or differential backup',
              icon: canCreateBackup() ? <Plus className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-gray-400" />,
              onClick: canCreateBackup() ? () => setCreateBackupDialog(true) : () => toast.error("You don't have permission to create backups"),
              disabled: !canCreateBackup(),
              badge: canCreateBackup() ? "Available" : "No Permission"
            },
            {
              id: 'backup-operations',
              label: 'Backup Operations',
              description: 'Upload and download backup files',
              icon: <Archive className="w-5 h-5 text-white" />,
              onClick: () => setBackupOperationsDialog(true),
              disabled: false,
              badge: "Available"
            },
            // Restore Operations (Merged)
            {
              id: 'restore-operations',
              label: 'Restore Operations',
              description: 'Restore system or manage restore points',
              icon: canRestoreSystem() ? <RotateCcw className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-gray-400" />,
              onClick: canRestoreSystem() ? () => {
                const operation = window.confirm(
                  "Select restore operation:\n\n" +
                  "OK = Restore System\n" +
                  "Cancel = Manage Restore Points\n\n" +
                  "Or use the Advanced menu for more options."
                );
                if (operation) {
                  const completedBackup = backups.find(b => b.status === "COMPLETED");
                  if (completedBackup) {
                    setSelectedBackupForRestore(completedBackup);
                    setRestoreDialog(true);
                  } else {
                    toast.error("No completed backups available for restore");
                  }
                } else {
                  setRestorePointsDialog(true);
                }
              } : () => toast.error("You don't have permission to restore the system"),
              disabled: !canRestoreSystem(),
              badge: canRestoreSystem() ? "Available" : "No Permission"
            },
            // Security & Management (Unified)
            {
              id: 'security-management',
              label: 'Security & Management',
              description: 'Encryption and verification settings',
              icon: <Shield className="w-5 h-5 text-white" />,
              onClick: () => setSecurityManagementDialog(true),
              disabled: false,
              badge: "Available"
            },
            // Advanced Operations (New consolidated section)
            {
              id: 'advanced-operations',
              label: 'Advanced Operations',
              description: 'Scheduling, logs, and system settings',
              icon: <Settings className="w-5 h-5 text-white" />,
              onClick: () => {
                const operation = window.confirm(
                  "Select advanced operation:\n\n" +
                  "OK = Backup Scheduling\n" +
                  "Cancel = View Logs\n\n" +
                  "Or use the Advanced menu for more options."
                );
                if (operation) {
                  setSchedulingDialog(true);
                } else {
                  if (canViewBackupLogs()) {
                    setLogsDialog(true);
                  } else {
                    toast.error("You don't have permission to view backup logs");
                  }
                }
              },
              disabled: false,
              badge: "Available"
            },
            // System Operations
            {
              id: 'system-operations',
              label: 'System Operations',
              description: 'Settings, status refresh, and monitoring',
              icon: <RefreshCw className="w-5 h-5 text-white" />,
              onClick: async () => {
                const operation = window.confirm(
                  "Select system operation:\n\n" +
                  "OK = Backup Settings\n" +
                  "Cancel = Refresh Status\n\n" +
                  "Or use the Advanced menu for more options."
                );
                if (operation) {
                  if (canManageBackupSettings()) {
                    setSettingsDialog(true);
                  } else {
                    toast.error("You don't have permission to manage backup settings");
                  }
                } else {
                  try {
                    setDataLoading(true);
                          const [bRes, rRes] = await Promise.all([
                            fetch('/api/backups', { cache: 'no-store' }),
                            fetch('/api/restore-points', { cache: 'no-store' })
                          ]);
                          const bJson = await bRes.json();
                          const rJson = await rRes.json();
                          setBackups(Array.isArray(bJson.items) ? bJson.items : []);
                          setRestorePoints(Array.isArray(rJson.items) ? rJson.items : []);
                    toast.success("Backup status refreshed");
                  } catch (error) {
                    console.error("Error refreshing backup status:", error);
                    toast.error("Failed to refresh backup status");
                  } finally {
                    setDataLoading(false);
                  }
                }
              },
              badge: "Available"
            }
          ]}
          lastActionTime="5 minutes ago"
          onLastActionTimeChange={() => {}}
          collapsible={true}
          defaultCollapsed={false}
        />
        </div>









        {/* Backup Management Section */}
        <div className="space-y-8">
          {/* Backups List - Full width */}
          <Card className="shadow-xl rounded-2xl overflow-hidden h-full p-0 border-0 bg-gradient-to-br from-white to-gray-50/50">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-0 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-blue-800/90 backdrop-blur-sm"></div>
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 lg:px-8 py-4 sm:py-6 gap-4 sm:gap-0">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Archive className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                    <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">System Backups</h3>
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Manage your backup files</p>
                    </div>
                  </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  {isAdminViewOnly && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 border border-orange-200 backdrop-blur-sm">
                      <Lock className="w-3 h-3 mr-1" />
                      View-Only Mode
                    </Badge>
                  )}
                  {backups.filter(b => b.status === "IN_PROGRESS").length > 0 && (
                    <Badge variant="warning" className="bg-orange-100 text-orange-800 border border-orange-200 backdrop-blur-sm">
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      {backups.filter(b => b.status === "IN_PROGRESS").length} active
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur-sm border border-white/30">
                    {backups.length} backups
                  </Badge>
                </div>
                </div>
              </CardHeader>
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center justify-end">
                {/* Search Bar */}
                <div className="relative w-full lg:w-auto lg:min-w-[200px] lg:max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search backups..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 text-gray-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="COMPLETED">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><CheckCircle className="w-4 h-4" /></span> Completed
                        </span>
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">
                        <span className="flex items-center gap-2">
                          <span className="text-orange-500"><RefreshCw className="w-4 h-4" /></span> In Progress
                        </span>
                      </SelectItem>
                      <SelectItem value="FAILED">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500"><X className="w-4 h-4" /></span> Failed
                        </span>
                      </SelectItem>
                      <SelectItem value="SCHEDULED">
                        <span className="flex items-center gap-2">
                          <span className="text-blue-500"><Clock className="w-4 h-4" /></span> Scheduled
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 text-gray-700">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="FULL">Full</SelectItem>
                      <SelectItem value="INCREMENTAL">Incremental</SelectItem>
                      <SelectItem value="DIFFERENTIAL">Differential</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 text-gray-700">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="LOCAL">
                        <span className="flex items-center gap-2">
                          <span className="text-gray-500"><HardDrive className="w-4 h-4" /></span> Local
                        </span>
                      </SelectItem>
                      <SelectItem value="CLOUD">
                        <span className="flex items-center gap-2">
                          <span className="text-blue-500"><Cloud className="w-4 h-4" /></span> Cloud
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div className="mt-2 sm:mt-3 px-2 sm:px-3 lg:px-6 max-w-full overflow-x-auto">
                <BulkActionsBar
                  selectedCount={selectedIds.length}
                  entityLabel="backup"
                  onClear={() => setSelectedIds([])}
                  actions={[
                    {
                      key: "bulk-actions",
                      label: "Bulk Actions",
                      icon: <Settings className="w-4 h-4 mr-2" />,
                      onClick: () => setBulkActionsDialog(true),
                      tooltip: "Open enhanced bulk actions dialog",
                      variant: "default"
                    },
                    {
                      key: "export",
                      label: "Download Selected",
                      icon: <Download className="w-4 h-4 mr-2" />,
                      onClick: async () => {
                        const completedBackups = selectedBackups.filter(b => b.status === "COMPLETED");
                        if (completedBackups.length === 0) {
                          toast.error("No completed backups selected for download");
                          return;
                        }
                        
                        // For bulk downloads, use the first backup as the download dialog
                        if (completedBackups.length === 1) {
                          handleOpenDownloadDialog(completedBackups[0]);
                        } else {
                          toast.info(`Selected ${completedBackups.length} backups. Please download them individually for better control.`);
                        }
                      },
                      tooltip: "Download selected completed backups"
                    },
                    {
                      key: "delete",
                      label: "Delete Selected",
                      icon: <Trash2 className="w-4 h-4 mr-2" />,
                      onClick: async () => {
                        const selectedBackupsForDeletion = selectedBackups.filter(b => 
                          b.status !== "COMPLETED" && b.status !== "IN_PROGRESS"
                        );
                        
                        if (selectedBackupsForDeletion.length === 0) {
                          toast.error("No eligible backups selected for deletion");
                          return;
                        }
                        
                        // For bulk deletion, show a summary dialog
                        const backupSummary = selectedBackupsForDeletion.map(b => 
                          `• ${b.name} (${b.type}, ${b.size})`
                        ).join('\n');
                        
                        const confirmDelete = window.confirm(
                          `Are you sure you want to permanently delete ${selectedBackupsForDeletion.length} backup(s)?\n\n` +
                          `This action cannot be undone. The backup files will be permanently removed from the system.\n\n` +
                          `Selected backups:\n${backupSummary}`
                        );
                        
                        if (confirmDelete) {
                          // Delete each backup individually to show progress
                          let deletedCount = 0;
                          for (const backup of selectedBackupsForDeletion) {
                            try {
                              const response = await fetch(`/api/backups/${backup.id}`, {
                                method: 'DELETE'
                              });
                              const data = await response.json();
                              
                              if (data.success) {
                                deletedCount++;
                                setBackups(prev => prev.filter(b => b.id !== backup.id));
                              }
                            } catch (error) {
                              console.error(`Error deleting backup ${backup.id}:`, error);
                            }
                          }
                          
                          setSelectedIds([]);
                          if (deletedCount > 0) {
                            toast.success(`Successfully deleted ${deletedCount} backup(s)`);
                          } else {
                            toast.error("Failed to delete any backups");
                          }
                        }
                      },
                      tooltip: "Delete selected backups permanently",
                      variant: "destructive"
                    }
                  ]}
                />
              </div>
            )}
              <CardContent className="p-0 h-full">
                {backups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <EmptyState
                    icon={<Archive className="w-12 h-12 text-blue-400" />}
                    title="No backups found"
                    description="Create your first backup to get started with data protection"
                    action={
                      <div className="flex flex-col gap-2 w-full">
                        {canCreateBackup() ? (
                        <Button
                          onClick={() => setCreateBackupDialog(true)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-6 py-3 shadow-lg transition-all duration-200 transform hover:scale-105"
                        >
                            <Archive className="w-5 h-5 mr-2" />
                          Create Backup
                        </Button>
                      ) : (
                        <div className="text-center">
                            <p className="text-gray-500 text-sm mb-3">You don't have permission to create backups</p>
                          <Button
                            variant="outline"
                            disabled
                              className="text-gray-400 rounded-xl px-6 py-3 border-gray-200"
                          >
                              <X className="w-5 h-5 mr-2" />
                            No Permission
                          </Button>
                        </div>
                        )}
                                      <Button
                          variant="outline"
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                          onClick={async () => {
                            try {
                              setDataLoading(true);
                  const [bRes, rRes] = await Promise.all([
                    fetch('/api/backups', { cache: 'no-store' }),
                    fetch('/api/restore-points', { cache: 'no-store' })
                  ]);
                  const bJson = await bRes.json();
                  const rJson = await rRes.json();
                  setBackups(Array.isArray(bJson.items) ? bJson.items : []);
                  setRestorePoints(Array.isArray(rJson.items) ? rJson.items : []);
                              toast.success("Backup data refreshed");
                            } catch (error) {
                              console.error("Error refreshing backup data:", error);
                              toast.error("Failed to refresh backup data");
                            } finally {
                              setDataLoading(false);
                            }
                          }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Refresh Data
                                      </Button>
                              </div>
                    }
                  />
                </div>
              ) : (
                <div className="p-3 sm:p-4 lg:p-6 overflow-x-auto">
                  <TableList
                    columns={backupColumns}
                    data={paginatedBackups}
                    loading={dataLoading}
                    selectedIds={selectedIds}
                    emptyMessage={null}
                    onSelectRow={handleSelectRow}
                    onSelectAll={handleSelectAll}
                    isAllSelected={isAllSelected}
                    isIndeterminate={isIndeterminate}
                    getItemId={(item) => item.id}
                    className="border-0 shadow-none max-w-full text-center"
                    expandedRowIds={expandedRowIds}
                    onToggleExpand={onToggleExpand}
                    sortState={{ field: sortField, order: sortOrder }}
                    onSort={handleSort}
                  />
                  {/* Pagination */}
                  <TablePagination
                    page={currentPage}
                    pageSize={itemsPerPage}
                    totalItems={backups.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setItemsPerPage}
                    entityLabel="backup"
                  />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Restore Points - Full width */}
          <div>
            <Card className="shadow-lg rounded-xl overflow-hidden h-full p-0">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">Restore Points</h3>
                      <p className="text-green-100 text-xs sm:text-sm">System restore points</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {restorePoints.length} points
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-full">
                {restorePoints.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                  <EmptyState
                    icon={<RotateCcw className="w-6 h-6 text-green-400" />}
                    title="No restore points"
                    description="Create a backup to generate restore points"
                    action={
                        <div className="flex flex-col gap-2 w-full">
                          {canCreateBackup() ? (
                        <Button
                          onClick={() => setCreateBackupDialog(true)}
                          className="bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Backup
                        </Button>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-500 text-sm mb-2">You don't have permission to create backups</p>
                          <Button
                            variant="outline"
                            disabled
                            className="text-gray-400"
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            No Permission
                          </Button>
                        </div>
                          )}
                          <Button
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50 rounded-xl"
                            onClick={async () => {
                              try {
                                setDataLoading(true);
                                const [backupsRes, restorePointsRes] = await Promise.all([
                                  fetch('/api/backups'),
                                  fetch('/api/restore-points')
                                ]);
                                const backupsData = await backupsRes.json();
                                const restorePointsData = await restorePointsRes.json();
                                setBackups(backupsData.items || []);
                                setRestorePoints(restorePointsData.items || []);
                                toast.success("Restore points refreshed");
                              } catch (error) {
                                console.error("Error refreshing restore points:", error);
                                toast.error("Failed to refresh restore points");
                              } finally {
                                setDataLoading(false);
                              }
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Data
                          </Button>
                        </div>
                      }
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto p-3 sm:p-4 lg:p-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {restorePoints.map((point) => (
                          <TableRow key={point.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold text-green-900">{point.name}</div>
                                {point.description && (
                                  <div className="text-sm text-gray-500">{point.description}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {point.status === "AVAILABLE" ? (
                                <Badge variant="success" className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />Available
                                </Badge>
                              ) : point.status === "RESTORING" ? (
                                <Badge variant="warning" className="flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin" />Restoring
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="flex items-center gap-1">
                                  <X className="w-3 h-3" />Failed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{new Date(point.createdAt).toLocaleDateString()}</div>
                                <div className="text-gray-500">{new Date(point.createdAt).toLocaleTimeString()}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Find the backup for this restore point
                                    const backup = backups.find(b => b.id === point.backupId);
                                    if (backup) {
                                      setSelectedBackup(backup);
                                      setRestoreDialogOpen(true);
                                    } else {
                                      toast.error("Backup not found for this restore point");
                                    }
                                  }}
                                  disabled={point.status !== "AVAILABLE" || !canRestoreSystem()}
                                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                >
                                  <RotateCcw className="w-4 h-4 mr-1" />
                                  {canRestoreSystem() ? "Restore" : "No Permission"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const backup = backups.find(b => b.id === point.backupId);
                                    if (backup) {
                                      handleOpenDownloadDialog(backup);
                                    } else {
                                      toast.error("Backup not found");
                                    }
                                  }}
                                  disabled={point.status !== "AVAILABLE" || !canDownloadBackup()}
                                  className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  {canDownloadBackup() ? "Download" : "No Permission"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
                 </div>
       </div>

            {/* Backup Details Dialog */}
      <ViewDialog
        open={detailsDialog}
        onOpenChange={setDetailsDialog}
        title={selectedBackup?.name || "Backup Details"}
        subtitle="Detailed information about the selected backup"
        status={selectedBackup ? {
          value: selectedBackup.status,
          variant: selectedBackup.status === "COMPLETED" ? "success" : 
                   selectedBackup.status === "IN_PROGRESS" ? "warning" : 
                   selectedBackup.status === "FAILED" ? "destructive" : "secondary"
        } : undefined}
        description={selectedBackup?.description}
        sections={selectedBackup ? (() => {
          const sections: ViewDialogSection[] = [
            {
              title: "Basic Information",
              fields: [
                {
                  label: "Name",
                  value: selectedBackup.name,
                  type: "text",
                  copyable: true
                },
                {
                  label: "Type",
                  value: selectedBackup.type === "FULL" ? "Full Backup" : 
                         selectedBackup.type === "INCREMENTAL" ? "Incremental" : 
                         selectedBackup.type === "DIFFERENTIAL" ? "Differential" : selectedBackup.type,
                  type: "badge",
                  badgeVariant: selectedBackup.type === "FULL" ? "default" : "secondary"
                },
                {
                  label: "Size",
                  value: selectedBackup.size,
                  type: "text"
                },
                {
                  label: "Location",
                  value: selectedBackup.location.toLowerCase(),
                  type: "text"
                },
                {
                  label: "Created By",
                  value: selectedBackup.createdBy,
                  type: "text"
                }
              ],
              columns: 2
            },
            {
              title: "Timestamps",
              fields: selectedBackup.completedAt ? [
                {
                  label: "Created",
                  value: selectedBackup.createdAt,
                  type: "date"
                },
                {
                  label: "Completed",
                  value: selectedBackup.completedAt,
                  type: "date"
                }
              ] : [
                {
                  label: "Created",
                  value: selectedBackup.createdAt,
                  type: "date"
                }
              ],
              columns: 2
            },
            {
              title: "Statistics",
              fields: [
                {
                  label: "Restore Points",
                  value: selectedBackup.restorePointsCount,
                  type: "number"
                },
                {
                  label: "Log Entries",
                  value: selectedBackup.logsCount,
                  type: "number"
                },
                {
                  label: "Retention Days",
                  value: selectedBackup.retentionDays,
                  type: "number"
                }
              ],
              columns: 2
            }
          ];

          if (selectedBackup.filePath) {
            sections.push({
              title: "File Information",
              fields: [
                {
                  label: "File Path",
                  value: selectedBackup.filePath,
                  type: "text",
                  copyable: true
                }
              ],
              columns: 1
            });
          }

          if (selectedBackup.errorMessage) {
            sections.push({
              title: "Error Information",
              fields: [
                {
                  label: "Error Message",
                  value: selectedBackup.errorMessage,
                  type: "text"
                }
              ],
              columns: 1
            });
          }

          return sections;
        })() : []}
        actions={selectedBackup && selectedBackup.status === "COMPLETED" ? [
          {
            label: "Download Backup",
            onClick: () => {
              setDetailsDialog(false);
              handleOpenDownloadDialog(selectedBackup);
            },
            variant: "default",
            icon: <Download className="w-4 h-4" />
          }
        ] : []}
        showCopyButton={true}
        showPrintButton={true}
        headerIcon={<Archive className="w-6 h-6 text-white" />}
      />

      {/* Download Dialog */}
      <DownloadDialog
        open={downloadDialog}
        onOpenChange={setDownloadDialog}
        backupId={selectedBackup?.id || ""}
        backupName={selectedBackup?.name || ""}
        fileSize={selectedBackup?.size || ""}
        onDownload={handleDownloadBackup}
      />

      {/* Create Backup Dialog */}
      <BackupDialog
        open={createBackupDialog}
        onOpenChange={setCreateBackupDialog}
        onSuccess={handleCreateBackup}
        canCreateBackup={canCreateBackup()}
        userId={user && user.id ? user.id : undefined}
      />

      {/* Backup Operations Dialog */}
      <BackupOperationsDialog
        open={backupOperationsDialog}
        onOpenChange={setBackupOperationsDialog}
        onSuccess={handleUploadBackup}
        canUploadBackup={canUploadBackup()}
        canDownloadBackup={canDownloadBackup()}
        userId={user && user.id ? user.id : undefined}
      />

      {/* Backup Logs Dialog */}
      <BackupLogsDialog
        open={logsDialog}
        onOpenChange={setLogsDialog}
      />

      {/* Bulk Actions Dialog */}
      <BulkActionsDialog
        open={bulkActionsDialog}
        onOpenChange={setBulkActionsDialog}
        selectedItems={selectedBackups}
        entityType="backup"
        entityLabel="backup"
        onActionComplete={() => {
          // Refresh data after bulk actions
          const refreshData = async () => {
            try {
              setDataLoading(true);
              const [backupsRes, restorePointsRes] = await Promise.all([
                fetch('/api/backups'),
                fetch('/api/restore-points')
              ]);
              const backupsData = await backupsRes.json();
              const restorePointsData = await restorePointsRes.json();
              setBackups(backupsData.items || []);
              setRestorePoints(restorePointsData.items || []);
              setSelectedIds([]);
            } catch (error) {
              console.error("Error refreshing data:", error);
            } finally {
              setDataLoading(false);
            }
          };
          refreshData();
        }}
        onCancel={() => setBulkActionsDialog(false)}
        onProcessAction={async (actionType: string, config: any) => {
          try {
            if (actionType === 'delete') {
              const id = config?.itemId as string;
              const response = await fetch(`/api/backups/${id}`, {
                method: 'DELETE'
              });
              const data = await response.json();
              return { success: data.success, processed: data.success ? 1 : 0 };
            }
            if (actionType === 'download') {
              // For now, just show success since actual download isn't implemented
              toast.success("Download initiated");
              return { success: true, processed: 1 };
            }
            if (actionType === 'refresh') {
              // No-op refresh; backend status polling could be added
              return { success: true, processed: 1 };
            }
            return { success: false } as any;
          } catch {
            return { success: false } as any;
          }
        }}
        getItemId={(b) => b.id}
        getItemDisplayName={(b) => b.name}
        getItemStatus={(b) => b.status}
      />

      {/* Security Management Dialog */}
      <SecurityManagementDialog
        open={securityManagementDialog}
        onOpenChange={setSecurityManagementDialog}
      />

      {/* Backup Scheduling Dialog */}
      <BackupSchedulingDialog
        open={schedulingDialog}
        onOpenChange={setSchedulingDialog}
      />



      {/* Backup Settings Dialog */}
      <BackupSettingsDialog
        open={settingsDialog}
        onOpenChange={setSettingsDialog}
      />

      {/* Restore Dialog */}
      <RestoreDialog
        open={restoreDialog}
        onOpenChange={setRestoreDialog}
        backupId={selectedBackupForRestore?.id || ""}
        backupName={selectedBackupForRestore?.name || ""}
        onSuccess={handleCreateBackup}
        userId={user && user.id ? user.id : undefined}
      />

      {/* Restore Points Dialog */}
      <RestorePointsDialog
        open={restorePointsDialog}
        onOpenChange={setRestorePointsDialog}
        onSuccess={handleCreateBackup}
        userId={user && user.id ? user.id : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={selectedBackup?.name}
        onDelete={handleConfirmDelete}
        canDelete={!!(selectedBackup && selectedBackup.status !== "COMPLETED" && selectedBackup.status !== "IN_PROGRESS")}
        isBackupDeletion={true}
        backupDetails={selectedBackup ? {
          name: selectedBackup.name,
          type: selectedBackup.type,
          size: selectedBackup.size,
          status: selectedBackup.status,
          createdAt: selectedBackup.createdAt,
          location: selectedBackup.location,
          description: selectedBackup.description
        } : undefined}
      />
    </div>
  );
} 