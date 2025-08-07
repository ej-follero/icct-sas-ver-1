"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  RotateCcw, 
  FileText, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  HardDrive,
  Eye,
  Shield,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { restoreClientService, type RestorePreview, type RestoreValidation, type RestoreResult } from "@/lib/services/restore-client.service";

export interface RestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupId: string;
  backupName: string;
  onSuccess?: (result: RestoreResult) => void;
  userId?: number;
}

export interface RestoreFormData {
  restorePointName: string;
  restoreFiles: boolean;
  restoreDatabase: boolean;
  description: string;
}

export default function RestoreDialog({ 
  open, 
  onOpenChange, 
  backupId, 
  backupName, 
  onSuccess,
  userId 
}: RestoreDialogProps) {
  const [activeTab, setActiveTab] = useState("preview");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<RestorePreview | null>(null);
  const [validation, setValidation] = useState<RestoreValidation | null>(null);
  const [formData, setFormData] = useState<RestoreFormData>({
    restorePointName: `Restore from ${backupName}`,
    restoreFiles: true,
    restoreDatabase: true,
    description: ""
  });

  useEffect(() => {
    if (open && backupId) {
      loadPreview();
      validateRestore();
    }
  }, [open, backupId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      const previewData = await restoreClientService.getRestorePreview(backupId);
      setPreview(previewData);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast.error('Failed to load restore preview');
    } finally {
      setLoading(false);
    }
  };

  const validateRestore = async () => {
    try {
      const validationData = await restoreClientService.validateRestore(backupId);
      setValidation(validationData);
    } catch (error) {
      console.error('Error validating restore:', error);
      toast.error('Failed to validate restore');
    }
  };

  const handleRestore = async () => {
    if (!userId) {
      toast.error('User ID is required');
      return;
    }

    try {
      setLoading(true);
      const result = await restoreClientService.performRestore({
        backupId,
        restorePointName: formData.restorePointName,
        restoreFiles: formData.restoreFiles,
        restoreDatabase: formData.restoreDatabase
      });

      if (result.success) {
        toast.success('Restore completed successfully');
        onSuccess?.(result);
        onOpenChange(false);
      } else {
        toast.error('Restore failed');
      }
    } catch (error) {
      console.error('Error performing restore:', error);
      toast.error('Failed to perform restore');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Restore from Backup
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Validation
            </TabsTrigger>
            <TabsTrigger value="restore" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Restore
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading preview...</span>
              </div>
            ) : preview ? (
              <div className="space-y-4">
                {/* Backup Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HardDrive className="w-5 h-5" />
                      Backup Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Name</Label>
                        <p className="text-sm text-muted-foreground">{preview.backupInfo.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Size</Label>
                        <p className="text-sm text-muted-foreground">{preview.backupInfo.size}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Type</Label>
                        <Badge variant="outline">{preview.backupInfo.type}</Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground">{formatDate(preview.backupInfo.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Files to Restore */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Files to Restore ({preview.filesToRestore.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {preview.filesToRestore.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm font-mono">{file.path}</span>
                          <Badge variant="secondary">{formatBytes(file.size)}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Database Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Database Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Tables</Label>
                        <p className="text-sm text-muted-foreground">{preview.databaseInfo.tables.length}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Records</Label>
                        <p className="text-sm text-muted-foreground">{preview.databaseInfo.recordCount}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Size</Label>
                        <p className="text-sm text-muted-foreground">{preview.databaseInfo.size}</p>
                      </div>
                    </div>
                    {preview.databaseInfo.tables.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Tables</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {preview.databaseInfo.tables.slice(0, 10).map((table, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {table}
                            </Badge>
                          ))}
                          {preview.databaseInfo.tables.length > 10 && (
                            <Badge variant="outline" className="text-xs">
                              +{preview.databaseInfo.tables.length - 10} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Conflicts */}
                {preview.conflicts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="w-5 h-5" />
                        Conflicts Found ({preview.conflicts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {preview.conflicts.map((conflict, index) => (
                          <Alert key={index} variant="destructive">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>
                              <strong>{conflict.type === 'file' ? 'File' : 'Database'}:</strong> {conflict.description}
                              {conflict.path && <span className="block text-xs mt-1">Path: {conflict.path}</span>}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No preview available
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            {validation ? (
              <div className="space-y-4">
                {/* Validation Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {validation.isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      Validation Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={validation.isValid ? "default" : "destructive"}>
                      {validation.isValid ? "Valid" : "Invalid"}
                    </Badge>
                  </CardContent>
                </Card>

                {/* Errors */}
                {validation.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        Errors ({validation.errors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {validation.errors.map((error, index) => (
                          <Alert key={index} variant="destructive">
                            <XCircle className="w-4 h-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Warnings */}
                {validation.warnings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="w-5 h-5" />
                        Warnings ({validation.warnings.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {validation.warnings.map((warning, index) => (
                          <Alert key={index} variant="default">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>{warning}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Conflicts */}
                {validation.conflicts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertTriangle className="w-5 h-5" />
                        Conflicts ({validation.conflicts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {validation.conflicts.map((conflict, index) => (
                          <Alert key={index} variant="default">
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>{conflict.description}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No validation data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="restore" className="space-y-4">
            <div className="space-y-4">
              {/* Restore Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Restore Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="restorePointName">Restore Point Name</Label>
                    <Input
                      id="restorePointName"
                      value={formData.restorePointName}
                      onChange={(e) => setFormData(prev => ({ ...prev, restorePointName: e.target.value }))}
                      placeholder="Enter restore point name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description for this restore operation"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="restoreFiles"
                        checked={formData.restoreFiles}
                                                 onCheckedChange={(checked) => 
                           setFormData(prev => ({ ...prev, restoreFiles: checked === true }))
                         }
                      />
                      <Label htmlFor="restoreFiles" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Restore Files
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="restoreDatabase"
                        checked={formData.restoreDatabase}
                                                 onCheckedChange={(checked) => 
                           setFormData(prev => ({ ...prev, restoreDatabase: checked === true }))
                         }
                      />
                      <Label htmlFor="restoreDatabase" className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Restore Database
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Validation Summary */}
              {validation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Validation Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {validation.isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm">
                          {validation.isValid ? "Ready to restore" : "Cannot restore due to errors"}
                        </span>
                      </div>
                      {validation.errors.length > 0 && (
                        <p className="text-sm text-red-600">
                          {validation.errors.length} error(s) found
                        </p>
                      )}
                      {validation.warnings.length > 0 && (
                        <p className="text-sm text-orange-600">
                          {validation.warnings.length} warning(s) found
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            disabled={loading || (validation ? !validation.isValid : false)}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {loading ? "Restoring..." : "Restore"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 