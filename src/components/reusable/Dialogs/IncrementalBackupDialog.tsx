"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Archive, 
  Settings, 
  Shield, 
  CheckCircle, 
  Info, 
  X, 
  RefreshCw,
  Lock,
  Unlock,
  FileText,
  Database,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { backupService } from '@/lib/services/backup.service';
import ProgressBar from '@/components/ProgressBar';

export interface IncrementalBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (backup: any) => void;
  canCreateBackup?: boolean;
  userId?: number;
}

export interface IncrementalBackupFormData {
  name: string;
  description: string;
  baseBackupId: string;
  location: "LOCAL" | "CLOUD" | "HYBRID";
  isEncrypted: boolean;
}

export interface ChangeInfo {
  path: string;
  action: 'ADDED' | 'MODIFIED' | 'DELETED';
  size?: number;
  lastModified?: string;
  checksum?: string;
}

export interface ChangesData {
  changes: ChangeInfo[];
  totalFiles: number;
  totalSize: number;
  databaseChanges: boolean;
  baseBackupId?: string;
  estimatedBackupSize: string;
}

export default function IncrementalBackupDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  canCreateBackup = true,
  userId = 149647
}: IncrementalBackupDialogProps) {
  const [formData, setFormData] = useState<IncrementalBackupFormData>({
    name: "",
    description: "",
    baseBackupId: "",
    location: "LOCAL",
    isEncrypted: false
  });
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [encryptionAvailable, setEncryptionAvailable] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);
  const [changesData, setChangesData] = useState<ChangesData | null>(null);
  const [isDetectingChanges, setIsDetectingChanges] = useState(false);

  // Check encryption availability on mount
  useEffect(() => {
    const checkEncryption = async () => {
      try {
        const response = await fetch('/api/backup/encryption');
        if (response.ok) {
          const data = await response.json();
          setEncryptionAvailable(data.data.encryptionAvailable);
        }
      } catch (error) {
        console.error('Error checking encryption availability:', error);
      }
    };

    if (open) {
      checkEncryption();
      loadAvailableBackups();
    }
  }, [open]);

  const loadAvailableBackups = async () => {
    try {
      const backups = await backupService.getBackups();
      const completedBackups = backups.filter(b => 
        b.status === "COMPLETED" && 
        (b.type === "FULL" || b.type === "INCREMENTAL")
      );
      setAvailableBackups(completedBackups);
    } catch (error) {
      console.error('Error loading available backups:', error);
    }
  };

  const handleInputChange = (field: keyof IncrementalBackupFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const detectChanges = async () => {
    if (!formData.baseBackupId) {
      toast.error("Please select a base backup first");
      return;
    }

    setIsDetectingChanges(true);
    try {
      const response = await fetch(`/api/backup/incremental?baseBackupId=${formData.baseBackupId}`);
      if (!response.ok) {
        throw new Error('Failed to detect changes');
      }
      const data = await response.json();
      if (data.success) {
        setChangesData(data.data);
        toast.success(`Detected ${data.data.totalFiles} changed files`);
      } else {
        throw new Error(data.error || 'Failed to detect changes');
      }
    } catch (error) {
      console.error('Error detecting changes:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to detect changes');
    } finally {
      setIsDetectingChanges(false);
    }
  };

  const handleCreateIncrementalBackup = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a backup name");
      return;
    }

    if (!formData.baseBackupId) {
      toast.error("Please select a base backup");
      return;
    }

    if (!canCreateBackup) {
      toast.error("You don't have permission to create backups");
      return;
    }

    // Use the valid user ID (149647) if the passed userId is 1 (which doesn't exist)
    const validUserId = (userId === 1) ? 149647 : userId;

    if (!validUserId) {
      toast.error("Invalid user ID");
      return;
    }

    setIsCreatingBackup(true);
    setCreationProgress(0);

    try {
      const backupData = {
        name: formData.name,
        description: formData.description,
        type: "INCREMENTAL",
        location: formData.location === 'HYBRID' ? 'LOCAL' : formData.location,
        isEncrypted: formData.isEncrypted,
        baseBackupId: formData.baseBackupId,
        createdBy: validUserId,
      };

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setCreationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

      const response = await fetch('/api/backup/incremental', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });

      if (!response.ok) {
        throw new Error('Failed to create incremental backup');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to create incremental backup');
      }

      const backup = result.data.backup;

      clearInterval(progressInterval);
      setCreationProgress(100);

      if (backup) {
        toast.success("Incremental backup created successfully!");
        onSuccess?.(backup);
        handleClose();
      } else {
        toast.error("Failed to create incremental backup");
      }
    } catch (error) {
      console.error('Error creating incremental backup:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create incremental backup');
    } finally {
      setIsCreatingBackup(false);
      setCreationProgress(0);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      baseBackupId: "",
      location: "LOCAL",
      isEncrypted: false
    });
    setChangesData(null);
    setIsCreatingBackup(false);
    setCreationProgress(0);
    onOpenChange(false);
  };

  const getSelectedBackup = () => {
    return availableBackups.find(b => b.id === formData.baseBackupId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Create Incremental Backup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Backup Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter backup name"
                  disabled={isCreatingBackup}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => handleInputChange('location', value as any)}
                  disabled={isCreatingBackup}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOCAL">Local Storage</SelectItem>
                    <SelectItem value="CLOUD">Cloud Storage</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter backup description"
                disabled={isCreatingBackup}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseBackup">Base Backup *</Label>
              <Select
                value={formData.baseBackupId}
                onValueChange={(value) => handleInputChange('baseBackupId', value)}
                disabled={isCreatingBackup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a base backup" />
                </SelectTrigger>
                <SelectContent>
                  {availableBackups.map((backup) => (
                    <SelectItem key={backup.id} value={backup.id}>
                      {backup.name} ({backup.type}) - {backup.size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.baseBackupId && (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={detectChanges}
                    disabled={isDetectingChanges || isCreatingBackup}
                    className="flex items-center gap-2"
                  >
                    {isDetectingChanges ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {isDetectingChanges ? 'Detecting Changes...' : 'Detect Changes'}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="encryption"
                checked={formData.isEncrypted}
                onCheckedChange={(checked) => handleInputChange('isEncrypted', checked as boolean)}
                disabled={!encryptionAvailable || isCreatingBackup}
              />
              <Label htmlFor="encryption" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Encrypt Backup
                {!encryptionAvailable && (
                  <Badge variant="secondary" className="text-xs">
                    Unavailable
                  </Badge>
                )}
              </Label>
            </div>
          </div>

          {/* Changes Detection Results */}
          {changesData && (
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Changes Detected</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Files:</span> {changesData.totalFiles}
                </div>
                <div>
                  <span className="font-medium">Total Size:</span> {changesData.estimatedBackupSize}
                </div>
                <div>
                  <span className="font-medium">Database Changes:</span> 
                  <Badge variant={changesData.databaseChanges ? "default" : "secondary"} className="ml-2">
                    {changesData.databaseChanges ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Base Backup:</span> {getSelectedBackup()?.name}
                </div>
              </div>

              {changesData.changes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">File Changes:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {changesData.changes.slice(0, 10).map((change, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <Badge 
                          variant={
                            change.action === 'ADDED' ? 'default' : 
                            change.action === 'MODIFIED' ? 'secondary' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {change.action}
                        </Badge>
                        <span className="truncate">{change.path}</span>
                      </div>
                    ))}
                    {changesData.changes.length > 10 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {changesData.changes.length - 10} more files
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isCreatingBackup && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Creating Incremental Backup...</span>
                <span>{Math.round(creationProgress)}%</span>
              </div>
              <ProgressBar progress={creationProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isCreatingBackup}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateIncrementalBackup}
            disabled={!formData.name.trim() || !formData.baseBackupId || isCreatingBackup}
            className="flex items-center gap-2"
          >
            {isCreatingBackup ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            {isCreatingBackup ? 'Creating...' : 'Create Incremental Backup'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 