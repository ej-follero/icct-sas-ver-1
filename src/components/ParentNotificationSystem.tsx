'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mail, Clock, CheckCircle, AlertTriangle, User, FileText } from 'lucide-react';

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'absence' | 'tardiness' | 'improvement' | 'concern' | 'general';
  subject: string;
  message: string;
}

const mockTemplates: NotificationTemplate[] = [
  {
    id: '1',
    name: 'Daily Absence Alert',
    type: 'absence',
    subject: 'Student Absence Notification',
    message: 'Dear Parent, your child was absent from class today. Please contact the school if this was an excused absence.'
  },
  {
    id: '2',
    name: 'Tardiness Notice',
    type: 'tardiness',
    subject: 'Late Arrival Notification',
    message: 'Your child arrived late to school today. Please help ensure punctual attendance.'
  }
];

export default function ParentNotificationSystem() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [notificationMethod, setNotificationMethod] = useState<'email'>('email');

  const handleSendNotification = () => {
    console.log('Sending notification:', {
      template: selectedTemplate,
      customMessage,
      students: selectedStudents,
      method: notificationMethod
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Sent Today</p>
                <p className="text-2xl font-bold text-blue-800">24</p>
              </div>
              <Send className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Delivered</p>
                <p className="text-2xl font-bold text-green-800">22</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Read</p>
                <p className="text-2xl font-bold text-purple-800">18</p>
              </div>
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-800">2</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template">Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template or create custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Message</SelectItem>
                {mockTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your custom message or select a template..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="method">Method</Label>
            <Select value={notificationMethod} onValueChange={(value: any) => setNotificationMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email Only</SelectItem>
                
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Recipients</Label>
            <div className="mt-2 space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
              {['John Doe', 'Jane Smith', 'Mike Johnson'].map((student) => (
                <div key={student} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={student}
                    className="rounded"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, student]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(s => s !== student));
                      }
                    }}
                  />
                  <label htmlFor={student} className="text-sm">{student}</label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSendNotification} className="w-full">
            Send Notification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 