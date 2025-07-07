"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Clock, 
  MapPin,
  ScanLine,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface RFIDConfig {
  systemEnabled: boolean;
  autoAttendance: boolean;
  accessControl: boolean;
  scanTimeout: number;
  retryAttempts: number;
  logRetention: number;
  alertThreshold: number;
  maintenanceMode: boolean;
}

interface ReaderConfig {
  id: string;
  name: string;
  location: string;
  enabled: boolean;
  scanInterval: number;
  range: number;
  sensitivity: number;
  lastCalibration: string;
  status: 'online' | 'offline' | 'maintenance';
}

interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  allowedTags: string[];
  allowedTimes: string[];
  allowedLocations: string[];
  priority: number;
}

export default function RFIDConfigPage() {
  const [config, setConfig] = useState<RFIDConfig>({
    systemEnabled: true,
    autoAttendance: true,
    accessControl: false,
    scanTimeout: 30,
    retryAttempts: 3,
    logRetention: 90,
    alertThreshold: 5,
    maintenanceMode: false,
  });

  const [readers, setReaders] = useState<ReaderConfig[]>([]);
  const [policies, setPolicies] = useState<AccessPolicy[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API calls
    setReaders([
      {
        id: 'Reader-101',
        name: 'Room 101 Reader',
        location: 'Room 101',
        enabled: true,
        scanInterval: 1000,
        range: 5,
        sensitivity: 80,
        lastCalibration: '2024-01-10',
        status: 'online',
      },
      {
        id: 'Reader-102',
        name: 'Room 102 Reader',
        location: 'Room 102',
        enabled: true,
        scanInterval: 1000,
        range: 5,
        sensitivity: 75,
        lastCalibration: '2024-01-12',
        status: 'online',
      },
      {
        id: 'Reader-103',
        name: 'Library Reader',
        location: 'Library',
        enabled: false,
        scanInterval: 2000,
        range: 3,
        sensitivity: 60,
        lastCalibration: '2024-01-08',
        status: 'maintenance',
      },
    ]);

    setPolicies([
      {
        id: '1',
        name: 'Classroom Access',
        description: 'Allow students to access their assigned classrooms during class hours',
        enabled: true,
        allowedTags: ['RFID-001', 'RFID-002', 'RFID-003'],
        allowedTimes: ['08:00-17:00'],
        allowedLocations: ['Room 101', 'Room 102', 'Room 103'],
        priority: 1,
      },
      {
        id: '2',
        name: 'Library Access',
        description: 'Allow all students to access the library during open hours',
        enabled: true,
        allowedTags: ['*'],
        allowedTimes: ['07:00-22:00'],
        allowedLocations: ['Library'],
        priority: 2,
      },
      {
        id: '3',
        name: 'Computer Lab Access',
        description: 'Restrict computer lab access to authorized students only',
        enabled: false,
        allowedTags: ['RFID-004', 'RFID-005'],
        allowedTimes: ['09:00-18:00'],
        allowedLocations: ['Computer Lab'],
        priority: 3,
      },
    ]);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'maintenance': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleConfigChange = (key: keyof RFIDConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfig = () => {
    // Save configuration to backend
    console.log('Saving configuration:', config);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RFID Configuration</h1>
          <p className="text-muted-foreground">
            Configure RFID system settings, reader parameters, and access policies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSaveConfig}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System Settings</TabsTrigger>
          <TabsTrigger value="readers">Reader Configuration</TabsTrigger>
          <TabsTrigger value="policies">Access Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic RFID system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="system-enabled">System Enabled</Label>
                  <Switch
                    id="system-enabled"
                    checked={config.systemEnabled}
                    onCheckedChange={(checked) => handleConfigChange('systemEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-attendance">Auto Attendance</Label>
                  <Switch
                    id="auto-attendance"
                    checked={config.autoAttendance}
                    onCheckedChange={(checked) => handleConfigChange('autoAttendance', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="access-control">Access Control</Label>
                  <Switch
                    id="access-control"
                    checked={config.accessControl}
                    onCheckedChange={(checked) => handleConfigChange('accessControl', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <Switch
                    id="maintenance-mode"
                    checked={config.maintenanceMode}
                    onCheckedChange={(checked) => handleConfigChange('maintenanceMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Performance Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Settings</CardTitle>
                <CardDescription>Configure scan performance and timeouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scan-timeout">Scan Timeout (seconds)</Label>
                  <Input
                    id="scan-timeout"
                    type="number"
                    value={config.scanTimeout}
                    onChange={(e) => handleConfigChange('scanTimeout', parseInt(e.target.value))}
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <Label htmlFor="retry-attempts">Retry Attempts</Label>
                  <Input
                    id="retry-attempts"
                    type="number"
                    value={config.retryAttempts}
                    onChange={(e) => handleConfigChange('retryAttempts', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <Label htmlFor="log-retention">Log Retention (days)</Label>
                  <Input
                    id="log-retention"
                    type="number"
                    value={config.logRetention}
                    onChange={(e) => handleConfigChange('logRetention', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
                <div>
                  <Label htmlFor="alert-threshold">Alert Threshold</Label>
                  <Input
                    id="alert-threshold"
                    type="number"
                    value={config.alertThreshold}
                    onChange={(e) => handleConfigChange('alertThreshold', parseInt(e.target.value))}
                    min="1"
                    max="20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="readers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reader Configuration</CardTitle>
              <CardDescription>Manage individual RFID reader settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {readers.map((reader) => (
                  <div key={reader.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(reader.status)}
                        <div>
                          <h3 className="font-medium">{reader.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            <MapPin className="inline w-3 h-3 mr-1" />
                            {reader.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reader.enabled}
                          onCheckedChange={(checked) => {
                            setReaders(prev => 
                              prev.map(r => r.id === reader.id ? { ...r, enabled: checked } : r)
                            );
                          }}
                        />
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label>Scan Interval</Label>
                        <p className="font-medium">{reader.scanInterval}ms</p>
                      </div>
                      <div>
                        <Label>Range</Label>
                        <p className="font-medium">{reader.range}m</p>
                      </div>
                      <div>
                        <Label>Sensitivity</Label>
                        <p className="font-medium">{reader.sensitivity}%</p>
                      </div>
                      <div>
                        <Label>Last Calibration</Label>
                        <p className="font-medium">{reader.lastCalibration}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Access Policies</CardTitle>
                  <CardDescription>Configure access control policies for different areas</CardDescription>
                </div>
                <Button>
                  <Shield className="w-4 h-4 mr-2" />
                  Add Policy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{policy.name}</h3>
                        <p className="text-sm text-muted-foreground">{policy.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={policy.enabled ? "default" : "secondary"}>
                          {policy.enabled ? "Active" : "Inactive"}
                        </Badge>
                        <Switch
                          checked={policy.enabled}
                          onCheckedChange={(checked) => {
                            setPolicies(prev => 
                              prev.map(p => p.id === policy.id ? { ...p, enabled: checked } : p)
                            );
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label>Allowed Tags</Label>
                        <p className="font-medium">
                          {policy.allowedTags.includes('*') ? 'All Tags' : policy.allowedTags.join(', ')}
                        </p>
                      </div>
                      <div>
                        <Label>Allowed Times</Label>
                        <p className="font-medium">{policy.allowedTimes.join(', ')}</p>
                      </div>
                      <div>
                        <Label>Allowed Locations</Label>
                        <p className="font-medium">{policy.allowedLocations.join(', ')}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Shield className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 