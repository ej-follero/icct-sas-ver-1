"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Zap, 
  Shield, 
  Activity, 
  Database, 
  Bell, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Lock,
  Timer,
  Gauge,
  HardDrive,
  Mail,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  performance: {
    maxConnections: number;
    connectionTimeout: number;
    queryTimeout: number;
    cacheTTL: number;
    maxCacheSize: number;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireMFA: boolean;
    allowedOrigins: string[];
  };
  monitoring: {
    enableMetrics: boolean;
    metricsInterval: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableAlerts: boolean;
    alertThresholds: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      responseTime: number;
    };
  };
  backup: {
    enableAutoBackup: boolean;
    backupInterval: number;
    retentionDays: number;
    compressionEnabled: boolean;
  };
  notifications: {
    enableEmail: boolean;
    enableSMS: boolean;
    enablePush: boolean;
    adminEmail: string;
  };
}

export default function SystemSettingsConfig() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SystemSettings | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/system-status/settings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSettings(data);
      setOriginalSettings(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system settings';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      
      const response = await fetch('/api/system-status/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error saving system settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save system settings';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  const updateSetting = (section: keyof SystemSettings, key: string, value: any) => {
    if (!settings) return;

    setSettings(prev => {
      if (!prev) return prev;
      
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value
        }
      };

      // Check if there are changes
      const hasChanges = JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
      setHasChanges(hasChanges);

      return newSettings;
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading system settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <span className="ml-2 text-red-500">{error}</span>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={fetchSettings} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings Configuration
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
            <Button
              onClick={saveSettings}
              disabled={!hasChanges || saving}
              size="sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
            {hasChanges && (
              <Button
                onClick={resetSettings}
                variant="outline"
                size="sm"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure system performance, security, monitoring, backup, and notification settings.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="maxConnections">Max Connections</Label>
                <Input
                  id="maxConnections"
                  type="number"
                  value={settings.performance.maxConnections}
                  onChange={(e) => updateSetting('performance', 'maxConnections', parseInt(e.target.value))}
                  placeholder="100"
                />
                <p className="text-xs text-muted-foreground">Maximum number of concurrent database connections</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="connectionTimeout">Connection Timeout (ms)</Label>
                <Input
                  id="connectionTimeout"
                  type="number"
                  value={settings.performance.connectionTimeout}
                  onChange={(e) => updateSetting('performance', 'connectionTimeout', parseInt(e.target.value))}
                  placeholder="30000"
                />
                <p className="text-xs text-muted-foreground">Database connection timeout in milliseconds</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="queryTimeout">Query Timeout (ms)</Label>
                <Input
                  id="queryTimeout"
                  type="number"
                  value={settings.performance.queryTimeout}
                  onChange={(e) => updateSetting('performance', 'queryTimeout', parseInt(e.target.value))}
                  placeholder="5000"
                />
                <p className="text-xs text-muted-foreground">Maximum query execution time</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="cacheTTL">Cache TTL (seconds)</Label>
                <Input
                  id="cacheTTL"
                  type="number"
                  value={settings.performance.cacheTTL}
                  onChange={(e) => updateSetting('performance', 'cacheTTL', parseInt(e.target.value))}
                  placeholder="3600"
                />
                <p className="text-xs text-muted-foreground">Cache time-to-live in seconds</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="maxCacheSize">Max Cache Size (MB)</Label>
                <Input
                  id="maxCacheSize"
                  type="number"
                  value={settings.performance.maxCacheSize}
                  onChange={(e) => updateSetting('performance', 'maxCacheSize', parseInt(e.target.value))}
                  placeholder="512"
                />
                <p className="text-xs text-muted-foreground">Maximum cache memory usage</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  placeholder="3600"
                />
                <p className="text-xs text-muted-foreground">User session timeout duration</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground">Maximum failed login attempts before lockout</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="passwordMinLength">Password Min Length</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                  placeholder="8"
                />
                <p className="text-xs text-muted-foreground">Minimum password length requirement</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="requireMFA">Require MFA</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requireMFA"
                    checked={settings.security.requireMFA}
                    onCheckedChange={(checked) => updateSetting('security', 'requireMFA', checked)}
                  />
                  <Label htmlFor="requireMFA">Enable multi-factor authentication</Label>
                </div>
                <p className="text-xs text-muted-foreground">Require MFA for all users</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="enableMetrics">Enable Metrics</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableMetrics"
                    checked={settings.monitoring.enableMetrics}
                    onCheckedChange={(checked) => updateSetting('monitoring', 'enableMetrics', checked)}
                  />
                  <Label htmlFor="enableMetrics">Collect system performance metrics</Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="metricsInterval">Metrics Interval (ms)</Label>
                <Input
                  id="metricsInterval"
                  type="number"
                  value={settings.monitoring.metricsInterval}
                  onChange={(e) => updateSetting('monitoring', 'metricsInterval', parseInt(e.target.value))}
                  placeholder="5000"
                />
                <p className="text-xs text-muted-foreground">Metrics collection interval</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="logLevel">Log Level</Label>
                <Select
                  value={settings.monitoring.logLevel}
                  onValueChange={(value) => updateSetting('monitoring', 'logLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="enableAlerts">Enable Alerts</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAlerts"
                    checked={settings.monitoring.enableAlerts}
                    onCheckedChange={(checked) => updateSetting('monitoring', 'enableAlerts', checked)}
                  />
                  <Label htmlFor="enableAlerts">Send system alerts</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-3">Alert Thresholds</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="cpuThreshold">CPU Usage Threshold (%)</Label>
                  <Input
                    id="cpuThreshold"
                    type="number"
                    value={settings.monitoring.alertThresholds.cpuUsage}
                    onChange={(e) => updateSetting('monitoring', 'alertThresholds', {
                      ...settings.monitoring.alertThresholds,
                      cpuUsage: parseInt(e.target.value)
                    })}
                    placeholder="80"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="memoryThreshold">Memory Usage Threshold (%)</Label>
                  <Input
                    id="memoryThreshold"
                    type="number"
                    value={settings.monitoring.alertThresholds.memoryUsage}
                    onChange={(e) => updateSetting('monitoring', 'alertThresholds', {
                      ...settings.monitoring.alertThresholds,
                      memoryUsage: parseInt(e.target.value)
                    })}
                    placeholder="85"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="diskThreshold">Disk Usage Threshold (%)</Label>
                  <Input
                    id="diskThreshold"
                    type="number"
                    value={settings.monitoring.alertThresholds.diskUsage}
                    onChange={(e) => updateSetting('monitoring', 'alertThresholds', {
                      ...settings.monitoring.alertThresholds,
                      diskUsage: parseInt(e.target.value)
                    })}
                    placeholder="90"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="responseThreshold">Response Time Threshold (ms)</Label>
                  <Input
                    id="responseThreshold"
                    type="number"
                    value={settings.monitoring.alertThresholds.responseTime}
                    onChange={(e) => updateSetting('monitoring', 'alertThresholds', {
                      ...settings.monitoring.alertThresholds,
                      responseTime: parseInt(e.target.value)
                    })}
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="enableAutoBackup">Enable Auto Backup</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableAutoBackup"
                    checked={settings.backup.enableAutoBackup}
                    onCheckedChange={(checked) => updateSetting('backup', 'enableAutoBackup', checked)}
                  />
                  <Label htmlFor="enableAutoBackup">Automatically create backups</Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="backupInterval">Backup Interval (seconds)</Label>
                <Input
                  id="backupInterval"
                  type="number"
                  value={settings.backup.backupInterval}
                  onChange={(e) => updateSetting('backup', 'backupInterval', parseInt(e.target.value))}
                  placeholder="86400"
                />
                <p className="text-xs text-muted-foreground">Time between automatic backups</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="retentionDays">Retention Days</Label>
                <Input
                  id="retentionDays"
                  type="number"
                  value={settings.backup.retentionDays}
                  onChange={(e) => updateSetting('backup', 'retentionDays', parseInt(e.target.value))}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">Number of days to keep backups</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="compressionEnabled">Enable Compression</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="compressionEnabled"
                    checked={settings.backup.compressionEnabled}
                    onCheckedChange={(checked) => updateSetting('backup', 'compressionEnabled', checked)}
                  />
                  <Label htmlFor="compressionEnabled">Compress backup files</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label htmlFor="enableEmail">Enable Email Notifications</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableEmail"
                    checked={settings.notifications.enableEmail}
                    onCheckedChange={(checked) => updateSetting('notifications', 'enableEmail', checked)}
                  />
                  <Label htmlFor="enableEmail">Send email notifications</Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="enableSMS">Enable SMS Notifications</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableSMS"
                    checked={settings.notifications.enableSMS}
                    onCheckedChange={(checked) => updateSetting('notifications', 'enableSMS', checked)}
                  />
                  <Label htmlFor="enableSMS">Send SMS notifications</Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="enablePush">Enable Push Notifications</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enablePush"
                    checked={settings.notifications.enablePush}
                    onCheckedChange={(checked) => updateSetting('notifications', 'enablePush', checked)}
                  />
                  <Label htmlFor="enablePush">Send push notifications</Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.notifications.adminEmail}
                  onChange={(e) => updateSetting('notifications', 'adminEmail', e.target.value)}
                  placeholder="admin@icct.edu.ph"
                />
                <p className="text-xs text-muted-foreground">Primary admin email for notifications</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
