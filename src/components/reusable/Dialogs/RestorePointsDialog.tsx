"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  RotateCcw, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { restoreClientService, type RestorePoint, type RestoreResult } from "@/lib/services/restore-client.service";

export interface RestorePointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: RestoreResult) => void;
  userId?: number;
}

export interface CreateRestorePointFormData {
  name: string;
  description: string;
  backupId: string;
}

export default function RestorePointsDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  userId 
}: RestorePointsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateRestorePointFormData>({
    name: "",
    description: "",
    backupId: ""
  });
  const [availableBackups, setAvailableBackups] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadRestorePoints();
      loadAvailableBackups();
    }
  }, [open]);

  const loadRestorePoints = async () => {
    try {
      setLoading(true);
      const result = await restoreClientService.getRestorePoints();
      setRestorePoints(result.restorePoints || []);
    } catch (error) {
      console.error('Error loading restore points:', error);
      toast.error('Failed to load restore points');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableBackups = async () => {
    try {
      // This would need to be implemented in the backup service
      // For now, we'll use a placeholder
      setAvailableBackups([]);
    } catch (error) {
      console.error('Error loading available backups:', error);
    }
  };

  const handleCreateRestorePoint = async () => {
    if (!createFormData.name || !createFormData.backupId) {
      toast.error('Name and backup are required');
      return;
    }

    try {
      setLoading(true);
      const result = await restoreClientService.createRestorePoint(
        createFormData.backupId,
        createFormData.name,
        createFormData.description
      );
      
      toast.success('Restore point created successfully');
      setShowCreateForm(false);
      setCreateFormData({ name: "", description: "", backupId: "" });
      loadRestorePoints();
    } catch (error) {
      console.error('Error creating restore point:', error);
      toast.error('Failed to create restore point');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (restorePointId: string) => {
    if (!userId) {
      toast.error('User ID is required');
      return;
    }

    try {
      setLoading(true);
      const result = await restoreClientService.rollbackToRestorePoint(restorePointId, userId);
      
      if (result.success) {
        toast.success('Rollback completed successfully');
        onSuccess?.(result);
        onOpenChange(false);
      } else {
        toast.error('Rollback failed');
      }
    } catch (error) {
      console.error('Error rolling back:', error);
      toast.error('Failed to rollback');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'IN_PROGRESS':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">Available</Badge>;
    }
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
            Restore Points Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Restore Point */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create Restore Point
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(!showCreateForm)}
                >
                  {showCreateForm ? "Cancel" : "New Restore Point"}
                </Button>
              </CardTitle>
            </CardHeader>
            {showCreateForm && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter restore point name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backupId">Backup ID</Label>
                    <Input
                      id="backupId"
                      value={createFormData.backupId}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, backupId: e.target.value }))}
                      placeholder="Enter backup ID"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter description (optional)"
                  />
                </div>
                <Button
                  onClick={handleCreateRestorePoint}
                  disabled={loading || !createFormData.name || !createFormData.backupId}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Create Restore Point
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Restore Points List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Restore Points ({restorePoints.length})
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadRestorePoints}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading restore points...</span>
                </div>
              ) : restorePoints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Files</TableHead>
                      <TableHead>Database</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restorePoints.map((point) => (
                      <TableRow key={point.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(point.status)}
                            {getStatusBadge(point.status)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{point.name}</TableCell>
                        <TableCell>
                          {point.description || (
                            <span className="text-muted-foreground">No description</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(point.createdAt)}</TableCell>
                        <TableCell>
                          {point.filesRestored !== undefined ? (
                            <Badge variant="outline">{point.filesRestored} files</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {point.databaseRestored !== undefined ? (
                            <Badge variant={point.databaseRestored ? "default" : "secondary"}>
                              {point.databaseRestored ? "Yes" : "No"}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {point.status === 'COMPLETED' && (
                              <Button
                                size="sm"
                                onClick={() => handleRollback(point.id)}
                                disabled={loading}
                                className="flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Rollback
                              </Button>
                            )}
                            {point.status === 'FAILED' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No restore points found</p>
                  <p className="text-sm">Create a restore point to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Information */}
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Restore Points:</strong> These are snapshots of your system at specific points in time. 
              You can rollback to any completed restore point to restore your system to that state. 
              Failed restore points can be deleted to clean up the list.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 