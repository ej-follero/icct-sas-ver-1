"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Mail, 
  Bell, 
  Send, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Megaphone,
  Calendar,
  Settings,
  Search,
  Filter,
  Plus,
  Archive,
  Trash2,
  Edit,
  Eye
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
  },
  {
    id: '4',
    type: 'notification',
    title: 'Late Arrival Notice',
    content: 'Your child arrived 15 minutes late to school today.',
    sender: 'System',
    recipient: 'Parent',
    timestamp: '2025-01-12 08:45 AM',
    status: 'failed',
    priority: 'urgent'
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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-500 text-white';
    case 'high':
      return 'bg-orange-500 text-white';
    case 'normal':
      return 'bg-blue-500 text-white';
    case 'low':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-500 text-white';
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

export default function CommunicationPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'messages', 'email', 'announcements', 'logs'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === mockCommunications.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(mockCommunications.map(item => item.id));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm flex-1 m-4 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication Hub</h1>
          <p className="text-gray-600 mt-1">Manage all communications and notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button className={`${ICCT_CLASSES.bg.primary} hover:${ICCT_CLASSES.bg.secondary}`}>
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Sent</p>
                <p className="text-2xl font-bold text-blue-800">1,247</p>
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
                <p className="text-2xl font-bold text-green-800">1,189</p>
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
                <p className="text-2xl font-bold text-purple-800">987</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Failed</p>
                <p className="text-2xl font-bold text-red-800">58</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Communications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Communications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {mockCommunications.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{item.title}</h4>
                            <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{item.content}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{item.sender} → {item.recipient}</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-sm">Send Message</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Mail className="h-6 w-6" />
                    <span className="text-sm">Send Email</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Megaphone className="h-6 w-6" />
                    <span className="text-sm">Post Announcement</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Bell className="h-6 w-6" />
                    <span className="text-sm">Send Notification</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Messages
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCommunications.filter(item => item.type === 'message').map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{item.sender} → {item.recipient}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Management
                </CardTitle>
                <Button className={`${ICCT_CLASSES.bg.primary} hover:${ICCT_CLASSES.bg.secondary}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Compose Email
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCommunications.filter(item => item.type === 'email').map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{item.sender} → {item.recipient}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Announcements
                </CardTitle>
                <Button className={`${ICCT_CLASSES.bg.primary} hover:${ICCT_CLASSES.bg.secondary}`}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Announcement
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCommunications.filter(item => item.type === 'announcement').map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{item.sender} → {item.recipient}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Communication Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCommunications.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{item.sender} → {item.recipient}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                      {item.status}
                    </Badge>
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