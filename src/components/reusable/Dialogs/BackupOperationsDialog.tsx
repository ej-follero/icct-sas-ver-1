"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Archive, 
  Upload, 
  Download, 
  FileText, 
  CheckCircle, 
  X, 
  RefreshCw,
  AlertTriangle,
  Info,
  Cloud,
  HardDrive,
  Settings,
  Eye,
  Trash2,
  Clock,
  Database
} from "lucide-react";
import { toast } from "sonner";

export interface BackupOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newBackup: any) => void;
  canUploadBackup?: boolean;
  canDownloadBackup?: boolean;
  userId?: number;
}

export default function BackupOperationsDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  canUploadBackup = true,
  canDownloadBackup = true,
  userId
}: BackupOperationsDialogProps) {
  // Validate props
  if (!onOpenChange) {
    console.error('BackupOperationsDialog: Missing required props');
    return null;
  }
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    type: "FULL",
    location: "LOCAL"
  });

  // Download form state
  const [downloadForm, setDownloadForm] = useState({
    selectedBackupId: "",
    format: "ZIP"
  });

  // Load available backups when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableBackups();
    }
  }, [open]);

  const loadAvailableBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const response = await fetch('/api/backup');
      if (response.ok) {
        const data = await response.json();
        setAvailableBackups(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to load available backups');
      }
    } catch (error) {
      console.error('Error loading available backups:', error);
      toast.error('Failed to load available backups');
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Auto-fill the name field with the file name (without extension)
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setUploadForm(prev => ({ ...prev, name: fileName }));
    }
  }, []);

  const handleUploadBackup = useCallback(async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast.error('Please select a backup file to upload');
      return;
    }

    if (!uploadForm.name.trim()) {
      toast.error('Please enter a backup name');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('name', uploadForm.name);
    formData.append('description', uploadForm.description);
    formData.append('type', uploadForm.type);
    formData.append('location', uploadForm.location);
    if (userId) {
      formData.append('createdBy', userId.toString());
    }

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          toast.success('Backup uploaded successfully');
          setUploadForm({ name: "", description: "", type: "FULL", location: "LOCAL" });
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setUploadProgress(0);
          onSuccess?.(response.data);
          loadAvailableBackups(); // Refresh the list
        } else {
          const errorData = JSON.parse(xhr.responseText);
          toast.error(errorData.error || 'Failed to upload backup');
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        toast.error('Upload failed. Please try again.');
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.open('POST', '/api/backup/upload');
      xhr.send(formData);

    } catch (error) {
      console.error('Error uploading backup:', error);
      toast.error('Failed to upload backup');
      setUploading(false);
      setUploadProgress(0);
    }
  }, [uploadForm, userId, onSuccess, loadAvailableBackups]);

  const handleDownloadBackup = useCallback(async () => {
    if (!downloadForm.selectedBackupId) {
      toast.error('Please select a backup to download');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(`/api/backup/${downloadForm.selectedBackupId}/download`, {
        method: 'GET',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${downloadForm.selectedBackupId}.${downloadForm.format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Backup downloaded successfully');
        setDownloadProgress(100);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to download backup');
      }
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Failed to download backup');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [downloadForm]);

  const handleDeleteBackup = useCallback(async (backupId: string) => {
    if (!window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Backup deleted successfully');
        loadAvailableBackups(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete backup');
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Failed to delete backup');
    }
  }, [loadAvailableBackups]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full bg-white/95 rounded-2xl p-0 border border-blue-100 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6">
          <DialogTitle asChild>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Archive className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-xl font-bold text-white mb-1 block">
                  Backup Operations
                </span>
                <span className="text-blue-100 text-sm block">
                  Upload and download backup files
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Backup
              </TabsTrigger>
              <TabsTrigger value="download" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Backup
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-500" />
                      Upload Backup File
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* File Selection */}
                      <div>
                        <Label htmlFor="backup-file" className="text-sm font-medium">
                          Backup File <span className="text-red-500">*</span>
                        </Label>
                        <div className="mt-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            id="backup-file"
                            accept=".zip,.tar,.gz,.backup"
                            onChange={handleFileSelect}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={uploading}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Supported formats: ZIP, TAR, GZ, BACKUP
                        </p>
                      </div>

                      {/* Backup Name */}
                      <div>
                        <Label htmlFor="backup-name" className="text-sm font-medium">
                          Backup Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="backup-name"
                          value={uploadForm.name}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter backup name"
                          className="mt-1"
                          disabled={uploading}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <Label htmlFor="backup-description" className="text-sm font-medium">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="backup-description"
                          value={uploadForm.description}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter backup description"
                          className="mt-1"
                          rows={3}
                          disabled={uploading}
                        />
                      </div>

                      {/* Backup Type */}
                      <div>
                        <Label htmlFor="backup-type" className="text-sm font-medium">
                          Backup Type
                        </Label>
                        <select
                          id="backup-type"
                          value={uploadForm.type}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={uploading}
                        >
                          <option value="FULL">Full Backup</option>
                          <option value="INCREMENTAL">Incremental Backup</option>
                          <option value="DIFFERENTIAL">Differential Backup</option>
                        </select>
                      </div>

                      {/* Location */}
                      <div>
                        <Label htmlFor="backup-location" className="text-sm font-medium">
                          Storage Location
                        </Label>
                        <select
                          id="backup-location"
                          value={uploadForm.location}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={uploading}
                        >
                          <option value="LOCAL">Local Storage</option>
                          <option value="CLOUD">Cloud Storage</option>
                        </select>
                      </div>

                      {/* Upload Progress */}
                      {uploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} className="w-full" />
                        </div>
                      )}

                      {/* Upload Button */}
                      <Button
                        onClick={handleUploadBackup}
                        disabled={uploading || !canUploadBackup || !fileInputRef.current?.files?.[0] || !uploadForm.name.trim()}
                        className="w-full"
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Backup
                          </>
                        )}
                      </Button>

                      {!canUploadBackup && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            You don't have permission to upload backups.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Upload Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-500" />
                      Upload Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Upload Guidelines</span>
                        </div>
                        <ul className="text-xs text-blue-600 space-y-1">
                          <li>• Maximum file size: 2GB</li>
                          <li>• Supported formats: ZIP, TAR, GZ, BACKUP</li>
                          <li>• Files are automatically validated</li>
                          <li>• Encryption is applied if enabled</li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Storage Available:</span>
                          <span className="font-medium">1.2 TB</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Upload Speed:</span>
                          <span className="font-medium">~10 MB/s</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Encryption:</span>
                          <Badge variant="success" className="text-xs">Enabled</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Download Tab */}
            <TabsContent value="download" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Download Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-green-500" />
                      Download Backup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Backup Selection */}
                      <div>
                        <Label htmlFor="backup-select" className="text-sm font-medium">
                          Select Backup <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="backup-select"
                          value={downloadForm.selectedBackupId}
                          onChange={(e) => setDownloadForm(prev => ({ ...prev, selectedBackupId: e.target.value }))}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={downloading || loadingBackups}
                        >
                          <option value="">Choose a backup...</option>
                          {availableBackups
                            .filter(backup => backup.status === "COMPLETED")
                            .map(backup => (
                              <option key={backup.id} value={backup.id}>
                                {backup.name} ({backup.size})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Download Format */}
                      <div>
                        <Label htmlFor="download-format" className="text-sm font-medium">
                          Download Format
                        </Label>
                        <select
                          id="download-format"
                          value={downloadForm.format}
                          onChange={(e) => setDownloadForm(prev => ({ ...prev, format: e.target.value }))}
                          className="w-full mt-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={downloading}
                        >
                          <option value="ZIP">ZIP Archive</option>
                          <option value="TAR">TAR Archive</option>
                          <option value="GZ">Compressed (GZ)</option>
                        </select>
                      </div>

                      {/* Download Progress */}
                      {downloading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Downloading...</span>
                            <span>{downloadProgress}%</span>
                          </div>
                          <Progress value={downloadProgress} className="w-full" />
                        </div>
                      )}

                      {/* Download Button */}
                      <Button
                        onClick={handleDownloadBackup}
                        disabled={downloading || !canDownloadBackup || !downloadForm.selectedBackupId}
                        className="w-full"
                      >
                        {downloading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Download Backup
                          </>
                        )}
                      </Button>

                      {!canDownloadBackup && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            You don't have permission to download backups.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Available Backups */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-500" />
                      Available Backups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingBackups ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-600">Loading backups...</span>
                      </div>
                    ) : availableBackups.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {availableBackups
                          .filter(backup => backup.status === "COMPLETED")
                          .map(backup => (
                            <div key={backup.id} className="p-3 border border-gray-200 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{backup.name}</span>
                                <Badge variant="success" className="text-xs">
                                  {backup.type}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                <span>{backup.size}</span>
                                <span>{new Date(backup.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDownloadForm(prev => ({ ...prev, selectedBackupId: backup.id }))}
                                  disabled={downloading}
                                  className="flex-1"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Select
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteBackup(backup.id)}
                                  disabled={downloading}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          No completed backups available for download.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-end p-6 border-t border-gray-200">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 