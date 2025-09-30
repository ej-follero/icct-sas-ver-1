"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Users, Calendar, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    recipients: [] as string[],
    schedule: false,
    scheduledDate: '',
    scheduledTime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notificationTypes = [
    { value: 'info', label: 'Information', icon: Info, color: 'bg-blue-100 text-blue-800' },
    { value: 'warning', label: 'Warning', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'urgent', label: 'Urgent', icon: Bell, color: 'bg-red-100 text-red-800' }
  ];

  const recipientOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'students', label: 'Students Only' },
    { value: 'instructors', label: 'Instructors Only' },
    { value: 'admins', label: 'Administrators Only' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Notification sent successfully!');
      onOpenChange(false);
      
      // Reset form
      setNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'normal',
        recipients: [],
        schedule: false,
        scheduledDate: '',
        scheduledTime: ''
      });
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecipientChange = (value: string, checked: boolean) => {
    if (checked) {
      setNotification(prev => ({
        ...prev,
        recipients: [...prev.recipients, value]
      }));
    } else {
      setNotification(prev => ({
        ...prev,
        recipients: prev.recipients.filter(r => r !== value)
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Send Notification
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                value={notification.title}
                onChange={(e) => setNotification(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter notification title"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Notification Type</Label>
              <Select
                value={notification.type}
                onValueChange={(value) => setNotification(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={notification.message}
              onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Enter your notification message"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Recipients</Label>
              <div className="space-y-2 mt-2">
                {recipientOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={notification.recipients.includes(option.value)}
                      onCheckedChange={(checked) => handleRecipientChange(option.value, checked as boolean)}
                    />
                    <Label htmlFor={option.value} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={notification.priority}
                onValueChange={(value) => setNotification(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="schedule"
                checked={notification.schedule}
                onCheckedChange={(checked) => setNotification(prev => ({ ...prev, schedule: checked as boolean }))}
              />
              <Label htmlFor="schedule">Schedule for later</Label>
            </div>

            {notification.schedule && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledDate">Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={notification.scheduledDate}
                    onChange={(e) => setNotification(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledTime">Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={notification.scheduledTime}
                    onChange={(e) => setNotification(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Notification
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
