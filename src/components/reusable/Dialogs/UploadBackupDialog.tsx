"use client";

import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Cloud,
  HardDrive,
  Info,
  Loader2
} from "lucide-react";
import { backupService, type BackupItem } from "@/lib/services/backup.service";

interface UploadBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (backup: BackupItem) => void;
  canUploadBackup?: boolean;
  userId?: number;
}

interface UploadFormData {
  name: string;
  description: string;
}

export default function UploadBackupDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  canUploadBackup = true,
  userId = 149647
}: UploadBackupDialogProps) {
  const [formData, setFormData] = useState<UploadFormData>({
    name: "",
    description: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [fileValidation, setFileValidation] = useState<{
    isValid: boolean;
    error?: string;
    size?: string;
  }>({ isValid: false });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // File validation
  const validateFile = useCallback((file: File) => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = ['.zip', '.tar.gz', '.tar'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      };
    }

    // Check file type
    if (!allowedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      };
    }

    return {
      isValid: true,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    setFileValidation(validation);
    
    if (validation.isValid) {
      setSelectedFile(file);
      // Auto-generate name if not provided
      if (!formData.name.trim()) {
        const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
        setFormData(prev => ({ ...prev, name: fileName }));
      }
    } else {
      toast.error(validation.error || 'Invalid file');
    }
  }, [validateFile, formData.name]);

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  // Handle form input changes
  const handleInputChange = (field: keyof UploadFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter a backup name");
      return;
    }

    if (!canUploadBackup) {
      toast.error("You don't have permission to upload backups");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('description', formData.description || '');
      uploadFormData.append('createdBy', userId.toString());

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      
      // Set up progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle response
      const newBackup = await new Promise<BackupItem>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve(response.data);
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch (error) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || 'Upload failed'));
            } catch {
              reject(new Error('Upload failed'));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', '/api/backup/upload');
        xhr.send(uploadFormData);
      });

      if (newBackup) {
        onSuccess?.(newBackup);
        onOpenChange(false);
        
        // Reset form
        setFormData({ name: "", description: "" });
        setSelectedFile(null);
        setFileValidation({ isValid: false });
        setUploadProgress(0);
      }
    } catch (error) {
      console.error("Error uploading backup:", error);
      toast.error("Failed to upload backup. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onOpenChange(false);
    // Reset form
    setFormData({ name: "", description: "" });
    setSelectedFile(null);
    setFileValidation({ isValid: false });
    setUploadProgress(0);
  };

  // Handle file removal
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileValidation({ isValid: false });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger file input
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Backup
          </DialogTitle>
          <DialogDescription>
            Upload a backup file to the system. Supported formats: ZIP, TAR, TAR.GZ (max 500MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Backup File</Label>
            
            {/* Drag & Drop Zone */}
            <div
              ref={dropZoneRef}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : selectedFile 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.tar,.tar.gz"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <div className="font-semibold text-green-900">{selectedFile.name}</div>
                      <div className="text-sm text-green-700">{fileValidation.size}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      Drop your backup file here
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      or click to browse
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBrowseClick}
                    className="mt-2"
                  >
                    Browse Files
                  </Button>
                </div>
              )}
            </div>

            {/* File Validation Error */}
            {!fileValidation.isValid && fileValidation.error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{fileValidation.error}</span>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading backup...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>

          {/* Backup Details Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="backup-name" className="text-sm font-medium">
                Backup Name *
              </Label>
              <Input
                id="backup-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter backup name"
                disabled={isUploading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="backup-description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="backup-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter backup description"
                disabled={isUploading}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          {/* Information Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <div className="font-medium text-blue-900">Upload Guidelines</div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Maximum file size: 500MB</li>
                  <li>• Supported formats: ZIP, TAR, TAR.GZ</li>
                  <li>• File will be validated before import</li>
                  <li>• A restore point will be created automatically</li>
                  <li>• Uploaded backups are stored locally by default</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              !canUploadBackup || 
              !selectedFile || 
              !formData.name.trim() || 
              !fileValidation.isValid || 
              isUploading
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Backup
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 