"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Shield, 
  Key, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  X,
  AlertTriangle,
  Info,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

interface EncryptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EncryptionKey {
  id: string;
  createdAt: string;
  isActive: boolean;
  iterations: number;
}

interface EncryptionStats {
  totalKeys: number;
  activeKeys: number;
  inactiveKeys: number;
  encryptionAvailable: boolean;
}

interface EncryptionData {
  stats: EncryptionStats;
  keys: EncryptionKey[];
  encryptionAvailable: boolean;
}

export default function EncryptionDialog({ 
  open, 
  onOpenChange 
}: EncryptionDialogProps) {
  const [encryptionData, setEncryptionData] = useState<EncryptionData>({
    stats: { totalKeys: 0, activeKeys: 0, inactiveKeys: 0, encryptionAvailable: false },
    keys: [],
    encryptionAvailable: false
  });
  const [loading, setLoading] = useState(false);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyData, setNewKeyData] = useState({
    keyId: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);

  // Load encryption data
  const loadEncryptionData = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (open) {
      loadEncryptionData();
    }
  }, [open]);

  // Handle key status change
  const handleKeyStatusChange = async (keyId: string, action: 'deactivate' | 'reactivate') => {
    try {
      const response = await fetch('/api/backup/encryption', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyId, action }),
      });

      if (response.ok) {
        toast.success(`Key ${action === 'deactivate' ? 'deactivated' : 'reactivated'} successfully`);
        loadEncryptionData(); // Refresh data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update key status');
      }
    } catch (error) {
      console.error('Error updating key status:', error);
      toast.error('Failed to update key status');
    }
  };

  // Handle create new key
  const handleCreateKey = async () => {
    if (!newKeyData.keyId.trim() || !newKeyData.password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newKeyData.password !== newKeyData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newKeyData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setCreatingKey(true);
      const response = await fetch('/api/backup/encryption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyId: newKeyData.keyId,
          password: newKeyData.password
        }),
      });

      if (response.ok) {
        toast.success('Encryption key created successfully');
        setShowCreateKey(false);
        setNewKeyData({ keyId: '', password: '', confirmPassword: '' });
        loadEncryptionData(); // Refresh data
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create encryption key');
      }
    } catch (error) {
      console.error('Error creating encryption key:', error);
      toast.error('Failed to create encryption key');
    } finally {
      setCreatingKey(false);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'success' : 'secondary';
  };

  // Get status icon
  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Backup Encryption Management
          </DialogTitle>
          <DialogDescription>
            Manage encryption keys and settings for backup security
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Encryption Status */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{encryptionData.stats.totalKeys}</div>
              <div className="text-sm text-blue-700">Total Keys</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{encryptionData.stats.activeKeys}</div>
              <div className="text-sm text-green-700">Active Keys</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{encryptionData.stats.inactiveKeys}</div>
              <div className="text-sm text-gray-700">Inactive Keys</div>
            </div>
            <div className={`p-4 rounded-lg ${encryptionData.stats.encryptionAvailable ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="text-2xl font-bold">{encryptionData.stats.encryptionAvailable ? 'Available' : 'Unavailable'}</div>
              <div className="text-sm">Encryption Status</div>
            </div>
          </div>

          {/* Encryption Keys Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Encryption Keys</span>
              </div>
              <Button
                onClick={() => setShowCreateKey(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Key
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Iterations</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading encryption keys...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : encryptionData.keys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No encryption keys found
                      </TableCell>
                    </TableRow>
                  ) : (
                    encryptionData.keys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-mono text-sm">{key.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(key.isActive)}
                            <Badge variant={getStatusBadgeVariant(key.isActive)}>
                              {key.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(key.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {key.iterations.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {key.isActive ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleKeyStatusChange(key.id, 'deactivate')}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              >
                                <Unlock className="w-4 h-4 mr-1" />
                                Deactivate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleKeyStatusChange(key.id, 'reactivate')}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <Lock className="w-4 h-4 mr-1" />
                                Activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Information Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <div className="font-medium text-blue-900">Encryption Information</div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Backup files are encrypted using AES-256-GCM</li>
                  <li>• Keys are derived using PBKDF2 with 100,000 iterations</li>
                  <li>• Each backup uses a unique IV for security</li>
                  <li>• File integrity is verified using SHA-256 checksums</li>
                  <li>• At least one active key is required for encryption</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Create Key Dialog */}
      <Dialog open={showCreateKey} onOpenChange={setShowCreateKey}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Create New Encryption Key
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="key-id" className="text-sm font-medium">
                Key ID *
              </Label>
              <Input
                id="key-id"
                value={newKeyData.keyId}
                onChange={(e) => setNewKeyData(prev => ({ ...prev, keyId: e.target.value }))}
                placeholder="Enter unique key identifier"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                Password *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={newKeyData.password}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter strong password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password *
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={newKeyData.confirmPassword}
                onChange={(e) => setNewKeyData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                className="mt-1"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>Important:</strong> Store your password securely. If you lose it, you won't be able to decrypt backups created with this key.
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateKey(false)}
              disabled={creatingKey}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateKey}
              disabled={creatingKey || !newKeyData.keyId.trim() || !newKeyData.password.trim() || newKeyData.password !== newKeyData.confirmPassword}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creatingKey ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
} 