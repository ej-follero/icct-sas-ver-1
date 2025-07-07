"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Mail, 
  Bell, 
  Send, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Megaphone,
  Eye,
  Plus
} from "lucide-react";
import { ICCT_CLASSES } from "@/lib/colors";

interface CommunicationItem {
  id: string;
  type: 'message' | 'email' | 'announcement' | 'notification';
  title: string;
  content: string;
  sender: string;
  recipient: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const mockCommunications: CommunicationItem[] = [
  {
    id: '1',
    type: 'message',
    title: 'Attendance Alert - John Doe',
    content: 'Your child was absent from Mathematics class today.',
    sender: 'System',
    recipient: 'Parent',
    timestamp: '2025-01-15 08:30 AM',
    status: 'delivered',
    priority: 'high'
  },
  {
    id: '2',
    type: 'email',
    title: 'Weekly Attendance Report',
    content: 'Please find attached the weekly attendance report for your child.',
    sender: 'Admin',
    recipient: 'Parent',
    timestamp: '2025-01-14 05:00 PM',
    status: 'read',
    priority: 'normal'
  },
  {
    id: '3',
    type: 'announcement',
    title: 'Parent-Teacher Meeting',
    content: 'Parent-teacher meeting scheduled for next Friday at 3:00 PM.',
    sender: 'Principal',
    recipient: 'All Parents',
    timestamp: '2025-01-13 10:00 AM',
    status: 'sent',
    priority: 'normal'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'delivered':
      return 'bg-yellow-100 text-yellow-800';
    case 'read':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageCircle className="w-4 h-4" />;
    case 'email':
      return <Mail className="w-4 h-4" />;
    case 'announcement':
      return <Megaphone className="w-4 h-4" />;
    case 'notification':
      return <Bell className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

export default function CommunicationWidget() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            Communication Hub
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-800">1,247</p>
            <p className="text-xs text-blue-600">Total Sent</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-800">987</p>
            <p className="text-xs text-green-600">Read</p>
          </div>
        </div>

        {/* Recent Communications */}
        <div>
          <h4 className="font-medium text-sm mb-2">Recent Communications</h4>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {mockCommunications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 p-2 rounded border hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-xs truncate">{item.title}</h5>
                    <p className="text-xs text-gray-600 truncate">{item.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                      <span>{item.sender}</span>
                      <span>{item.timestamp.split(' ')[1]}</span>
                    </div>
                  </div>
                  <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-8">
            <Send className="w-3 h-3 mr-1" />
            Send
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Eye className="w-3 h-3 mr-1" />
            View All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 