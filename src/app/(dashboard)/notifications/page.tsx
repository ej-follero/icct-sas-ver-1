"use client";

import { useMemo, useState } from "react";
import PageHeader from '@/components/PageHeader/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, Check, Search, Inbox, RefreshCw, X, Trash2, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import SummaryCard from '@/components/SummaryCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead, getStats, refresh } = useNotifications();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [dateKey, setDateKey] = useState<'date'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [folder, setFolder] = useState<'all' | 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash'>('all');

  const stats = useMemo(() => getStats(), [getStats]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const allIds = useMemo(() => notifications.map(n => n.id), [notifications]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === allIds.length;
  const indeterminate = selectedIds.length > 0 && selectedIds.length < allIds.length;
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);

  const toggleOne = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelectedIds(prev => (prev.length === allIds.length ? [] : allIds));
  };

  const markSelectedRead = async () => {
    for (const id of selectedIds) {
      await markAsRead(id, 'notification');
    }
    setSelectedIds([]);
  };

  const clearSelection = () => setSelectedIds([]);

  const deleteOne = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok || !result?.success) throw new Error(result?.error || 'Delete failed');
      setHiddenIds(prev => prev.includes(id) ? prev : [...prev, id]);
      setSelectedIds(prev => prev.filter(x => x !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const deleteSelected = async () => {
    try {
      const res = await fetch('/api/notifications/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      const result = await res.json();
      if (!res.ok || !result?.success) throw new Error(result?.error || 'Bulk delete failed');
      setHiddenIds(prev => Array.from(new Set([...prev, ...selectedIds])));
      setSelectedIds([]);
    } catch (e) {
      console.error('Bulk delete failed', e);
    }
  };

  const renderItem = (item: any) => (
    <div key={`notification-${item.id}`} className="flex items-start justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/40 rounded-xl border border-blue-200/50 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="pt-1">
          <Checkbox
            checked={selectedIds.includes(item.id)}
            onCheckedChange={() => toggleOne(item.id)}
            aria-label={`Select ${item.title || 'notification'}`}
          />
        </div>
        <div>
          <p className="font-medium text-blue-900">
            {item.title || 'Notification'}
          </p>
          <p className="text-sm text-blue-700">{item.message}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-gray-500">{item.time}</span>
            {item.priority && (
              <Badge variant="outline" className={
                item.priority === 'high' ? 'text-red-700 border-red-200 bg-red-50' :
                item.priority === 'medium' ? 'text-amber-700 border-amber-200 bg-amber-50' :
                'text-gray-700 border-gray-200 bg-gray-50'
              }>
                {item.priority}
              </Badge>
            )}
            {item.unread && (<Badge className="bg-blue-600">Unread</Badge>)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-700 hover:text-blue-800"
                onClick={() => markAsRead(item.id, 'notification')}
                disabled={!item.unread}
                aria-label="Mark read"
              >
                <Check className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark read</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-600 hover:text-red-700"
                onClick={() => deleteOne(item.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {item.actionUrl && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-blue-700 hover:text-blue-800"
                  onClick={() => window.location.assign(item.actionUrl)}
                  aria-label="Open"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] overflow-x-hidden">
      <div className="w-full max-w-none px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 lg:py-6 space-y-4 sm:space-y-5 md:space-y-6">
        <PageHeader
          title="Notifications"
          subtitle="Review and manage your notifications"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Notifications' }
          ]}
        />

        {/* Summary Cards - using SummaryCard component */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <SummaryCard
            label="Total Unread"
            value={stats.unread}
            icon={<Bell className="h-5 w-5" />}
            sublabel="Across all notifications"
          />
          <SummaryCard
            label="Unread Notifications"
            value={stats.notifications}
            icon={<Inbox className="h-5 w-5" />}
            sublabel="Alerts pending review"
          />
          <SummaryCard
            label="Read Notifications"
            value={Math.max(0, (stats.total || stats.unread) - stats.unread)}
            icon={<Check className="h-5 w-5" />}
            sublabel="Already acknowledged"
          />
          <SummaryCard
            label="System Status"
            value={loading ? '—' : 'Up to date'}
            icon={<AlertTriangle className="h-5 w-5" />}
            sublabel="Real-time updates enabled"
          />
        </div>

        {/* Toolbar + List (matches other list pages pattern) */}
        <Card className="bg-white/80 backdrop-blur-sm border border-blue-200/50 shadow-sm rounded-2xl overflow-hidden p-0">
          {/* Gradient header like list pages */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5" />
                <div>
                  <div className="text-lg font-semibold leading-tight">All Notifications</div>
                  <div className="text-sm opacity-90">Search and filter notifications</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="bg-transparent text-white hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                onClick={() => refresh()}
                aria-label="Refresh"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6">
            {/* Toolbar under header */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {/* Left (actions) */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    className={indeterminate ? 'data-[state=indeterminate]:opacity-100' : ''}
                  />
                  <span className="text-sm text-gray-600">Select all</span>
                </div>
              </div>
              {/* Right (controls) */}
              <div className="flex flex-wrap items-center gap-3 ml-auto">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search notifications..."
                    className="pl-8 w-72 text-gray-700 placeholder:text-gray-500 rounded"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v: 'all'|'unread'|'read') => setStatusFilter(v)}>
                  <SelectTrigger className="w-44 text-gray-500 rounded">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(v: 'all'|'high'|'medium'|'low') => setPriorityFilter(v)}>
                  <SelectTrigger className="w-44 text-gray-500 rounded">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateKey} onValueChange={(v: 'date') => setDateKey(v)}>
                  <SelectTrigger className="w-36 text-gray-500 rounded">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={(v: 'desc'|'asc') => setSortOrder(v)}>
                  <SelectTrigger className="w-32 text-gray-500 rounded">
                    <SelectValue placeholder="Desc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedIds.length > 0 && (
              <div className="mb-4 flex items-center justify-between rounded border border-blue-200 bg-blue-50/70 px-3 py-2">
                <div className="text-sm text-blue-800">
                  {selectedIds.length} selected
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="text-xs rounded" onClick={markSelectedRead}>
                    <Check className="h-3 w-3 mr-1" /> Mark selected read
                  </Button>
                  <Button variant="destructive" size="sm" className="text-xs rounded" onClick={deleteSelected}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete selected
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs text-blue-800 hover:text-blue-900 rounded" onClick={clearSelection}>
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </div>
              </div>
            )}
            
            {loading ? (
              <div className="text-center py-12 text-blue-700">Loading notifications…</div>
            ) : (
              <div className="space-y-3">
                {notifications
                  .filter(n => !hiddenIds.includes(n.id))
                  .filter(n => {
                    const q = query.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      (n.title || '').toLowerCase().includes(q) ||
                      (n.message || '').toLowerCase().includes(q)
                    );
                  })
                  .filter(n => {
                    if (statusFilter === 'unread') return n.unread;
                    if (statusFilter === 'read') return !n.unread;
                    return true;
                  })
                  .filter(n => {
                    if (priorityFilter === 'all') return true;
                    return (n.priority || 'low') === priorityFilter;
                  })
                  .map(n => renderItem(n))}
                {notifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No notifications</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


