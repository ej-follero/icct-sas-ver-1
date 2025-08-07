"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Clock,
  Calendar,
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Settings,
  FileText,
  Database,
  Shield
} from "lucide-react";
import { backupSchedulingClientService, CreateScheduleRequest, Schedule, ScheduleStats } from "@/lib/services/backup-scheduling-client.service";

interface BackupSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ScheduleFormData {
  name: string;
  description: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  interval: number;
  timeOfDay: string;
  daysOfWeek: string[];
  dayOfMonth?: number;
  backupType: 'FULL' | 'INCREMENTAL';
  location: 'LOCAL' | 'CLOUD' | 'HYBRID';
  isEncrypted: boolean;
  retentionDays: number;
}

const DAYS_OF_WEEK = [
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' }
];

export default function BackupSchedulingDialog({ open, onOpenChange }: BackupSchedulingDialogProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<ScheduleStats>({
    totalSchedules: 0,
    activeSchedules: 0,
    inactiveSchedules: 0,
    totalRuns: 0,
    successfulRuns: 0,
    failedRuns: 0
  });
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [executingSchedule, setExecutingSchedule] = useState<string | null>(null);

  const [formData, setFormData] = useState<ScheduleFormData>({
    name: '',
    description: '',
    frequency: 'DAILY',
    interval: 1,
    timeOfDay: '02:00',
    daysOfWeek: [],
    dayOfMonth: undefined,
    backupType: 'FULL',
    location: 'LOCAL',
    isEncrypted: true,
    retentionDays: 30
  });

  // Load schedules and stats
  const loadData = async () => {
    try {
      setLoading(true);
      const [schedulesData, statsData] = await Promise.all([
        backupSchedulingClientService.getSchedules(),
        backupSchedulingClientService.getScheduleStats()
      ]);
      
      setSchedules(schedulesData.schedules || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  // Create or update schedule
  const handleSubmit = async () => {
    try {
      setCreating(true);
      
      const scheduleData: CreateScheduleRequest = {
        ...formData,
        createdBy: 1 // TODO: Get actual user ID
      };

      if (editingSchedule) {
        await backupSchedulingClientService.updateSchedule(editingSchedule.id.toString(), scheduleData);
        toast.success('Schedule updated successfully');
      } else {
        await backupSchedulingClientService.createSchedule(scheduleData);
        toast.success('Schedule created successfully');
      }

      setShowCreateForm(false);
      setEditingSchedule(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    } finally {
      setCreating(false);
    }
  };

  // Delete schedule
  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await backupSchedulingClientService.deleteSchedule(scheduleId);
      toast.success('Schedule deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  // Toggle schedule status
  const handleToggleStatus = async (scheduleId: string) => {
    try {
      await backupSchedulingClientService.toggleScheduleStatus(scheduleId);
      toast.success('Schedule status updated');
      loadData();
    } catch (error) {
      console.error('Error toggling schedule status:', error);
      toast.error('Failed to update schedule status');
    }
  };

  // Execute schedule
  const handleExecute = async (scheduleId: string) => {
    try {
      setExecutingSchedule(scheduleId);
      await backupSchedulingClientService.executeSchedule(scheduleId);
      toast.success('Schedule executed successfully');
      loadData();
    } catch (error) {
      console.error('Error executing schedule:', error);
      toast.error('Failed to execute schedule');
    } finally {
      setExecutingSchedule(null);
    }
  };

  // Edit schedule
  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      description: schedule.description || '',
      frequency: schedule.frequency as any,
      interval: schedule.interval,
      timeOfDay: schedule.timeOfDay,
      daysOfWeek: schedule.daysOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      backupType: schedule.backupType as any,
      location: schedule.location as any,
      isEncrypted: schedule.isEncrypted,
      retentionDays: schedule.retentionDays
    });
    setShowCreateForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      frequency: 'DAILY',
      interval: 1,
      timeOfDay: '02:00',
      daysOfWeek: [],
      dayOfMonth: undefined,
      backupType: 'FULL',
      location: 'LOCAL',
      isEncrypted: true,
      retentionDays: 30
    });
  };

  // Load data on mount
  useEffect(() => {
    if (open) {
      loadData();
      setShowCreateForm(false);
      setEditingSchedule(null);
      resetForm();
    }
  }, [open]);

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  // Get status badge variant
  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? 'default' : 'secondary';
  };

  // Get frequency display text
  const getFrequencyText = (frequency: string, interval: number, daysOfWeek: string[], dayOfMonth?: number) => {
    switch (frequency) {
      case 'DAILY':
        return `Every ${interval} day${interval > 1 ? 's' : ''}`;
      case 'WEEKLY':
        if (daysOfWeek.length > 0) {
          const dayNames = daysOfWeek.map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label).filter(Boolean);
          return `Every ${interval} week${interval > 1 ? 's' : ''} on ${dayNames.join(', ')}`;
        }
        return `Every ${interval} week${interval > 1 ? 's' : ''}`;
      case 'MONTHLY':
        if (dayOfMonth) {
          return `Every ${interval} month${interval > 1 ? 's' : ''} on day ${dayOfMonth}`;
        }
        return `Every ${interval} month${interval > 1 ? 's' : ''}`;
      case 'CUSTOM':
        return `Every ${interval} day${interval > 1 ? 's' : ''}`;
      default:
        return frequency;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Automated Backup Scheduling
          </DialogTitle>
          <DialogDescription>
            Create and manage automated backup schedules
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.totalSchedules}</div>
              <div className="text-sm text-blue-700">Total Schedules</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{stats.activeSchedules}</div>
              <div className="text-sm text-green-700">Active</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900">{stats.successfulRuns}</div>
              <div className="text-sm text-yellow-700">Successful Runs</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-900">{stats.failedRuns}</div>
              <div className="text-sm text-red-700">Failed Runs</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Schedule
            </Button>
            <Button
              onClick={loadData}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Schedule Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter schedule name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: any) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="interval">Interval</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={formData.interval}
                    onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="timeOfDay">Time</Label>
                  <Input
                    id="timeOfDay"
                    type="time"
                    value={formData.timeOfDay}
                    onChange={(e) => setFormData({ ...formData, timeOfDay: e.target.value })}
                  />
                </div>
              </div>

              {/* Weekly schedule options */}
              {formData.frequency === 'WEEKLY' && (
                <div>
                  <Label>Days of Week</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.value}
                          checked={formData.daysOfWeek.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                daysOfWeek: [...formData.daysOfWeek, day.value]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                daysOfWeek: formData.daysOfWeek.filter(d => d !== day.value)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={day.value} className="text-sm">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly schedule options */}
              {formData.frequency === 'MONTHLY' && (
                <div>
                  <Label htmlFor="dayOfMonth">Day of Month</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth || ''}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) || undefined })}
                    placeholder="1-31"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="backupType">Backup Type</Label>
                  <Select
                    value={formData.backupType}
                    onValueChange={(value: any) => setFormData({ ...formData, backupType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL">Full Backup</SelectItem>
                      <SelectItem value="INCREMENTAL">Incremental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value: any) => setFormData({ ...formData, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOCAL">Local</SelectItem>
                      <SelectItem value="CLOUD">Cloud</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="retentionDays">Retention (Days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    min="1"
                    value={formData.retentionDays}
                    onChange={(e) => setFormData({ ...formData, retentionDays: parseInt(e.target.value) || 30 })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isEncrypted"
                  checked={formData.isEncrypted}
                  onCheckedChange={(checked) => setFormData({ ...formData, isEncrypted: checked as boolean })}
                />
                <Label htmlFor="isEncrypted">Enable Encryption</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={creating || !formData.name}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingSchedule ? 'Update Schedule' : 'Create Schedule'
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingSchedule(null);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Schedules Table */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Backup Schedules</span>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Runs</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{schedule.name}</div>
                          {schedule.description && (
                            <div className="text-sm text-gray-500">{schedule.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getFrequencyText(schedule.frequency, schedule.interval, schedule.daysOfWeek, schedule.dayOfMonth)}
                        </div>
                        <div className="text-xs text-gray-500">at {schedule.timeOfDay}</div>
                      </TableCell>
                      <TableCell>
                        {schedule.nextRun ? (
                          <div className="text-sm">
                            {formatDate(schedule.nextRun)}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(schedule.isActive)}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            {schedule.successfulRuns}
                          </div>
                          <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-600" />
                            {schedule.failedRuns}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(schedule)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(schedule.id.toString())}
                          >
                            {schedule.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExecute(schedule.id.toString())}
                            disabled={executingSchedule === schedule.id.toString()}
                          >
                            {executingSchedule === schedule.id.toString() ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(schedule.id.toString())}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
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