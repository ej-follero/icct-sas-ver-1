"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Shield, 
  Clock, 
  HardDrive, 
  Cloud,
  Info, 
  X, 
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export interface BackupSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: "DAILY" | "WEEKLY" | "MONTHLY";
  retentionDays: number;
  encryptionEnabled: boolean;
  cloudStorage: boolean;
  compressionLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  maxBackupSize: number; // in GB
}

export default function BackupSettingsDialog({ 
  open, 
  onOpenChange 
}: BackupSettingsDialogProps) {
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: true,
    backupFrequency: "WEEKLY",
    retentionDays: 30,
    encryptionEnabled: true,
    cloudStorage: false,
    compressionLevel: "MEDIUM",
    maxBackupSize: 10
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/backup/settings');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error loading backup settings:", error);
      toast.error("Failed to load backup settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/backup/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      const result = await response.json();
      toast.success(result.message || "Backup settings saved successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving backup settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save backup settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full bg-white/95 rounded-2xl p-0 border border-blue-100 shadow-2xl transition-all duration-300">
        <DialogHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6 relative flex-shrink-0">
          <DialogTitle asChild>
            <div className="flex items-start gap-4 pr-24">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-xl font-bold text-white mb-1 block">
                  Backup Settings
                </span>
                <span className="text-blue-100 text-sm block">
                  Configure backup preferences and policies
                </span>
              </div>
            </div>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-white/20 rounded-full transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-gray-600">Loading backup settings...</span>
              </div>
            </div>
          ) : (
            <div className="p-0 space-y-6">
              {/* Automatic Backup Section */}
              <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-md font-semibold text-blue-900">Automatic Backup</h3>
                </div>
                <div className="h-px bg-blue-100 w-full mb-4"></div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-blue-700">Enable Auto Backup</Label>
                      <p className="text-xs text-gray-500">Automatically create backups on schedule</p>
                    </div>
                    <Switch
                      checked={settings.autoBackup}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Backup Frequency</Label>
                    <Select 
                      value={settings.backupFrequency} 
                      onValueChange={(value: "DAILY" | "WEEKLY" | "MONTHLY") => setSettings(prev => ({ ...prev, backupFrequency: value }))}
                    >
                      <SelectTrigger className="mt-1 rounded">
                        <SelectValue className="text-gray-700" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Storage & Retention Section */}
              <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-5 h-5 text-blue-500" />
                  <h3 className="text-md font-semibold text-blue-900">Storage & Retention</h3>
                </div>
                <div className="h-px bg-blue-100 w-full mb-4"></div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Retention Period (Days)</Label>
                    <Input
                      type="number"
                      value={settings.retentionDays}
                      onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 30 }))}
                      className="mt-1"
                      min="1"
                      max="365"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Maximum Backup Size (GB)</Label>
                    <Input
                      type="number"
                      value={settings.maxBackupSize}
                      onChange={(e) => setSettings(prev => ({ ...prev, maxBackupSize: parseInt(e.target.value) || 10 }))}
                      className="mt-1"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-blue-700">Cloud Storage</Label>
                      <p className="text-xs text-gray-500">Store backups in cloud storage</p>
                    </div>
                    <Switch
                      checked={settings.cloudStorage}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, cloudStorage: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h3 className="text-md font-semibold text-blue-900">Security & Compression</h3>
                </div>
                <div className="h-px bg-blue-100 w-full mb-4"></div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-blue-700">Encryption</Label>
                      <p className="text-xs text-gray-500">Encrypt backup files for security</p>
                    </div>
                    <Switch
                      checked={settings.encryptionEnabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, encryptionEnabled: checked }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-700">Compression Level</Label>
                    <Select 
                      value={settings.compressionLevel} 
                      onValueChange={(value: "NONE" | "LOW" | "MEDIUM" | "HIGH") => setSettings(prev => ({ ...prev, compressionLevel: value }))}
                    >
                      <SelectTrigger className="mt-1 rounded">
                        <SelectValue className="text-gray-700" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Settings Information</h4>
                    <p className="text-blue-700 text-sm">
                      These settings will apply to all future backups. Changes will not affect existing backups.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end pt-4 border-t border-blue-100 bg-blue-50/50 px-6 py-4 mt-2 rounded-b-2xl">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="w-32 border border-blue-300 text-blue-500 rounded"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-32 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              {isSaving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 