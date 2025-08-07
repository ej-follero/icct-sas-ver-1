"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Trash2, 
  Archive, 
  RefreshCw, 
  Download, 
  Printer, 
  Upload,
  Inbox,
  MailOpen,
  MailCheck,
  MailX,
  MailWarning,
  FileText,
  User
} from "lucide-react";
import PageHeader from "@/components/PageHeader/PageHeader";
import SummaryCard from '@/components/SummaryCard';
import { EmptyState } from '@/components/reusable';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { toast } from "sonner";

interface Email {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'draft' | 'pending';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type: 'inbox' | 'sent' | 'draft' | 'spam' | 'trash';
  content: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
}

const mockEmails: Email[] = [
  {
    id: '1',
    subject: 'Welcome to ICCT Smart Attendance System',
    sender: 'admin@icct.edu',
    recipient: 'all-students@icct.edu',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'sent',
    priority: 'normal',
    type: 'sent',
    content: 'Welcome to the new ICCT Smart Attendance System.',
    isRead: true,
    isStarred: false,
    isImportant: true
  },
  {
    id: '2',
    subject: 'Attendance Report - Week 1',
    sender: 'system@icct.edu',
    recipient: 'instructors@icct.edu',
    timestamp: '2024-01-15T09:15:00Z',
    status: 'delivered',
    priority: 'high',
    type: 'inbox',
    content: 'Weekly attendance report for all classes is now available.',
    isRead: false,
    isStarred: true,
    isImportant: false
  },
  {
    id: '3',
    subject: 'RFID Card Activation Required',
    sender: 'it-support@icct.edu',
    recipient: 'new-students@icct.edu',
    timestamp: '2024-01-15T08:45:00Z',
    status: 'read',
    priority: 'urgent',
    type: 'inbox',
    content: 'Please activate your RFID card at the IT office before classes begin.',
    isRead: true,
    isStarred: false,
    isImportant: true
  }
];

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>(mockEmails);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const filteredEmails = useMemo(() => {
    let filtered = emails;

    if (searchValue) {
      filtered = filtered.filter(email => 
        email.subject.toLowerCase().includes(searchValue.toLowerCase()) ||
        email.sender.toLowerCase().includes(searchValue.toLowerCase()) ||
        email.recipient.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(email => email.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(email => email.priority === priorityFilter);
    }

    return filtered;
  }, [emails, searchValue, statusFilter, priorityFilter]);

  const stats = {
    total: emails.length,
    inbox: emails.filter(e => e.type === 'inbox').length,
    sent: emails.filter(e => e.type === 'sent').length,
    draft: emails.filter(e => e.type === 'draft').length,
    unread: emails.filter(e => !e.isRead).length,
    important: emails.filter(e => e.isImportant).length,
    starred: emails.filter(e => e.isStarred).length,
    failed: emails.filter(e => e.status === 'failed').length,
  };

  const getStatusIcon = (status: Email['status']) => {
    switch (status) {
      case 'sent': return <Send className="w-4 h-4 text-green-500" />;
      case 'delivered': return <MailCheck className="w-4 h-4 text-blue-500" />;
      case 'read': return <MailOpen className="w-4 h-4 text-blue-600" />;
      case 'failed': return <MailX className="w-4 h-4 text-red-500" />;
      case 'draft': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: Email['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: Email['status']) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-700 border-green-200';
      case 'delivered': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'read': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Email Management"
          subtitle="View and manage all email communications"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Email" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Inbox className="text-blue-500 w-5 h-5" />}
            label="Inbox"
            value={stats.inbox}
            valueClassName="text-blue-900"
            sublabel="Unread emails"
          />
          <SummaryCard
            icon={<Send className="text-green-500 w-5 h-5" />}
            label="Sent"
            value={stats.sent}
            valueClassName="text-green-900"
            sublabel="Sent emails"
          />
          <SummaryCard
            icon={<FileText className="text-yellow-500 w-5 h-5" />}
            label="Drafts"
            value={stats.draft}
            valueClassName="text-yellow-900"
            sublabel="Draft emails"
          />
          <SummaryCard
            icon={<MailX className="text-red-500 w-5 h-5" />}
            label="Failed"
            value={stats.failed}
            valueClassName="text-red-900"
            sublabel="Failed deliveries"
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential email tools"
            icon={
              <div className="w-6 h-6 text-white">
                <Mail className="w-6 h-6" />
              </div>
            }
            actionCards={[
              {
                id: 'compose-email',
                label: 'Compose Email',
                description: 'Create new email',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => toast.success("Compose email feature coming soon!")
              },
              {
                id: 'import-emails',
                label: 'Import Data',
                description: 'Import emails from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => toast.success("Import feature coming soon!")
              },
              {
                id: 'print-emails',
                label: 'Print Page',
                description: 'Print email list',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => toast.success("Print feature coming soon!")
              },
              {
                id: 'refresh-data',
                label: 'Refresh Data',
                description: 'Reload email data',
                icon: <RefreshCw className="w-5 h-5 text-white" />,
                onClick: () => toast.success("Data refreshed!")
              }
            ]}
            lastActionTime="2 minutes ago"
            onLastActionTimeChange={() => {}}
            collapsible={true}
            defaultCollapsed={true}
            onCollapseChange={(collapsed) => {
              console.log('Quick Actions Panel collapsed:', collapsed);
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="w-full max-w-full pt-4">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
            <CardHeader className="p-0">
              {/* Blue Gradient Header */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Email List</h3>
                      <p className="text-blue-100 text-sm">Search and filter email communications</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-end">
                {/* Search Bar */}
                <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value)}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Email List */}
            <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                <div className="print-content">
                  {filteredEmails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<Mail className="w-6 h-6 text-blue-400" />}
                        title="No emails found"
                        description="Try adjusting your search criteria or filters to find the emails you're looking for."
                        action={
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                              onClick={() => setSearchValue('')}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Clear Filters
                            </Button>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredEmails.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => {
                              setSelectedItems(prev => 
                                prev.includes(item.id) 
                                  ? prev.filter(id => id !== item.id)
                                  : [...prev, item.id]
                              );
                            }}
                            aria-label={`Select ${item.subject}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium ${!item.isRead ? 'font-semibold' : ''}`}>
                                {item.subject}
                              </h4>
                              {item.isStarred && <Badge className="text-xs bg-yellow-100 text-yellow-700">⭐</Badge>}
                              {item.isImportant && <Badge className="text-xs bg-red-100 text-red-700">!</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <span>From: {item.sender}</span>
                              <span>To: {item.recipient}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{new Date(item.timestamp).toLocaleString()}</span>
                              <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                {item.status}
                              </Badge>
                              <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                                {item.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="View email"
                                    className="hover:bg-blue-50"
                                    onClick={() => toast.success(`Viewing email: ${item.subject}`)}
                                  >
                                    <Eye className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center" className="bg-blue-900 text-white">
                                  View details
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 