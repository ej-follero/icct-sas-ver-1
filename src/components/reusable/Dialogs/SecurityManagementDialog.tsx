"use client";

import { useState, useEffect } from "react";
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
import { 
  Shield, 
  Lock, 
  Unlock, 
  CheckCircle, 
  X, 
  RefreshCw,
  AlertTriangle,
  Info,
  Key,
  Eye,
  EyeOff,
  Settings,
  FileText,
  Database
} from "lucide-react";
import { toast } from "sonner";

export interface SecurityManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SecurityManagementDialog({ 
  open, 
  onOpenChange 
}: SecurityManagementDialogProps) {
  const [activeTab, setActiveTab] = useState("encryption");
  const [encryptionData, setEncryptionData] = useState<any>(null);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [encryptionLoading, setEncryptionLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Encryption form state
  const [encryptionForm, setEncryptionForm] = useState({
    password: "",
    confirmPassword: "",
    description: ""
  });

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadEncryptionData();
      loadVerificationData();
    }
  }, [open]);

  const loadEncryptionData = async () => {
    setEncryptionLoading(true);
    try {
      const response = await fetch('/api/backup/encryption');
      if (response.ok) {
        const data = await response.json();
        setEncryptionData(data.data);
      } else {
        toast.error('Failed to load encryption data');
      }
    } catch (error) {
      console.error('Error loading encryption data:', error);
      toast.error('Failed to load encryption data');
    } finally {
      setEncryptionLoading(false);
    }
  };

  const loadVerificationData = async () => {
    setVerificationLoading(true);
    try {
      const response = await fetch('/api/backup/verification');
      if (response.ok) {
        const data = await response.json();
        setVerificationData(data.data);
      } else {
        toast.error('Failed to load verification data');
      }
    } catch (error) {
      console.error('Error loading verification data:', error);
      toast.error('Failed to load verification data');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleEncryptionAction = async (action: 'activate' | 'deactivate', keyId?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup/encryption', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, keyId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Key ${action === 'deactivate' ? 'deactivated' : 'reactivated'} successfully`);
        loadEncryptionData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update key status');
      }
    } catch (error) {
      console.error('Error updating encryption key:', error);
      toast.error('Failed to update key status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEncryptionKey = async () => {
    if (!encryptionForm.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (encryptionForm.password !== encryptionForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (encryptionForm.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/backup/encryption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: encryptionForm.password,
          description: encryptionForm.description
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Encryption key created successfully');
        setEncryptionForm({ password: "", confirmPassword: "", description: "" });
        loadEncryptionData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create encryption key');
      }
    } catch (error) {
      console.error('Error creating encryption key:', error);
      toast.error('Failed to create encryption key');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBackup = async (backupId?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Backup verification completed');
        loadVerificationData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to verify backup');
      }
    } catch (error) {
      console.error('Error verifying backup:', error);
      toast.error('Failed to verify backup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAllBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup/verification', {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Bulk verification completed: ${data.data.valid} valid, ${data.data.invalid} invalid`);
        loadVerificationData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to verify all backups');
      }
    } catch (error) {
      console.error('Error verifying all backups:', error);
      toast.error('Failed to verify all backups');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full bg-white/95 rounded-2xl p-0 border border-blue-100 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-t-2xl p-6">
          <DialogTitle asChild>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <span className="text-xl font-bold text-white mb-1 block">
                  Security Management
                </span>
                <span className="text-blue-100 text-sm block">
                  Manage encryption keys and backup verification
                </span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="encryption" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Encryption
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Verification
              </TabsTrigger>
            </TabsList>

            {/* Encryption Tab */}
            <TabsContent value="encryption" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Encryption Keys */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-blue-500" />
                      Encryption Keys
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {encryptionLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-600">Loading encryption data...</span>
                      </div>
                    ) : encryptionData ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Encryption Available</span>
                          </div>
                          <Badge variant="success" className="text-xs">
                            Active
                          </Badge>
                        </div>

                        {encryptionData.keys && encryptionData.keys.length > 0 ? (
                          <div className="space-y-3">
                            {encryptionData.keys.map((key: any) => (
                              <div key={key.id} className="p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Key {key.id}</span>
                                  <Badge variant={key.active ? "success" : "secondary"}>
                                    {key.active ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-600 mb-2">{key.description}</p>
                                <div className="flex gap-2">
                                  {key.active ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEncryptionAction('deactivate', key.id)}
                                      disabled={loading}
                                    >
                                      <Unlock className="w-3 h-3 mr-1" />
                                      Deactivate
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEncryptionAction('activate', key.id)}
                                      disabled={loading}
                                    >
                                      <Lock className="w-3 h-3 mr-1" />
                                      Activate
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              No encryption keys found. Create a new key to enable backup encryption.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Failed to load encryption data. Please try again.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Create New Key */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="w-5 h-5 text-blue-500" />
                      Create New Key
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="password" className="text-sm font-medium">
                          Master Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={encryptionForm.password}
                          onChange={(e) => setEncryptionForm(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter master password"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="confirm-password" className="text-sm font-medium">
                          Confirm Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={encryptionForm.confirmPassword}
                          onChange={(e) => setEncryptionForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm master password"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-sm font-medium">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="description"
                          value={encryptionForm.description}
                          onChange={(e) => setEncryptionForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter key description"
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleCreateEncryptionKey}
                        disabled={loading || !encryptionForm.password || !encryptionForm.confirmPassword}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 mr-2" />
                            Create Encryption Key
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Verification Tab */}
            <TabsContent value="verification" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Verification Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Verification Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {verificationLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-green-500" />
                        <span className="ml-2 text-gray-600">Loading verification data...</span>
                      </div>
                    ) : verificationData ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {verificationData.validCount || 0}
                            </div>
                            <div className="text-sm text-green-700">Valid Backups</div>
                          </div>
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {verificationData.invalidCount || 0}
                            </div>
                            <div className="text-sm text-red-700">Invalid Backups</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Total Backups:</span>
                            <span className="font-medium">{verificationData.totalCount || 0}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Last Verified:</span>
                            <span className="font-medium">
                              {verificationData.lastVerified ? new Date(verificationData.lastVerified).toLocaleDateString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Failed to load verification data. Please try again.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Verification Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-500" />
                      Verification Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Backup Verification</span>
                        </div>
                        <p className="text-xs text-blue-600">
                          Verify the integrity and completeness of your backup files
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Button
                          onClick={() => handleVerifyAllBackups()}
                          disabled={loading}
                          className="w-full"
                          variant="outline"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Verifying All...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify All Backups
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() => handleVerifyBackup()}
                          disabled={loading}
                          className="w-full"
                          variant="outline"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Database className="w-4 h-4 mr-2" />
                              Verify Latest Backup
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Verification Results */}
              {verificationData && verificationData.recentResults && verificationData.recentResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Recent Verification Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Backup</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Verified</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {verificationData.recentResults.map((result: any) => (
                          <TableRow key={result.id}>
                            <TableCell className="font-medium">{result.backupName}</TableCell>
                            <TableCell>
                              <Badge variant={result.valid ? "success" : "destructive"}>
                                {result.valid ? "Valid" : "Invalid"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(result.verifiedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {result.details || "No issues found"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
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