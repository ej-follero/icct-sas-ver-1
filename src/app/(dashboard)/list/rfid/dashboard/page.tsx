"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataChart from "@/components/DataChart";
import { FileText, CreditCard, Wifi, WifiOff, ScanLine, ArrowRight, Info, Settings, Plus, Upload, Printer, RefreshCw, Download, Search, Bell, Building2, RotateCcw, Eye, Pencil, BookOpen, GraduationCap, BadgeInfo, X, ChevronRight, Hash, Tag, Layers, Clock, UserCheck as UserCheckIcon, Archive, Loader2, Columns3, List } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { EmptyState } from '@/components/reusable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Simulate loading state for demonstration
const useDashboardData = () => {
  // Mock data
  const stats = useMemo(() => ({
    totalTags: 120,
    activeTags: 100,
    lostTags: 5,
    damagedTags: 3,
    inactiveTags: 12,
    totalReaders: 10,
    onlineReaders: 8,
    offlineReaders: 2,
    totalLogs: 5000,
    todayLogs: 120,
    weeklyScans: 850,
    monthlyScans: 3200,
  }), []);
  const tagStatusData = useMemo(() => [
    { name: "Active", value: stats.activeTags },
    { name: "Inactive", value: stats.inactiveTags },
    { name: "Lost", value: stats.lostTags },
    { name: "Damaged", value: stats.damagedTags },
  ], [stats]);
  const readerStatusData = useMemo(() => [
    { name: "Online", value: stats.onlineReaders },
    { name: "Offline", value: stats.offlineReaders },
  ], [stats]);
  const scanTrendsData = useMemo(() => [
    { name: "Mon", value: 80 },
    { name: "Tue", value: 120 },
    { name: "Wed", value: 100 },
    { name: "Thu", value: 140 },
    { name: "Fri", value: 90 },
    { name: "Sat", value: 60 },
    { name: "Sun", value: 40 },
  ], []);
  const recentLogs = useMemo(() => [
    {
      id: "1",
      tagId: "RFID-001",
      studentName: "John Doe",
      readerId: "Reader-101",
      location: "Room 101",
      timestamp: "2024-06-20 09:15:00",
      status: "success",
      scanType: "attendance",
    },
    {
      id: "2",
      tagId: "RFID-002",
      studentName: "Jane Smith",
      readerId: "Reader-102",
      location: "Room 102",
      timestamp: "2024-06-20 09:10:00",
      status: "success",
      scanType: "attendance",
    },
    {
      id: "3",
      tagId: "RFID-003",
      studentName: "Mike Johnson",
      readerId: "Reader-103",
      location: "Library",
      timestamp: "2024-06-20 08:55:00",
      status: "error",
      scanType: "entry",
    },
    {
      id: "4",
      tagId: "RFID-004",
      studentName: "Sarah Wilson",
      readerId: "Reader-104",
      location: "Lab",
      timestamp: "2024-06-20 08:50:00",
      status: "unauthorized",
      scanType: "access",
    },
  ], []);
  return { stats, tagStatusData, readerStatusData, scanTrendsData, recentLogs };
};

const statusBadge = (status: string) => {
  switch (status) {
    case "success":
      return <Badge variant="default">Success</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    case "unauthorized":
      return <Badge variant="destructive">Unauthorized</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function RFIDDashboardPage() {
  const { stats, tagStatusData, readerStatusData, scanTrendsData, recentLogs } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");

  // Filter recent logs based on search and filters
  const filteredLogs = useMemo(() => {
    let filtered = recentLogs;

    if (searchInput) {
      filtered = filtered.filter(log => 
        log.studentName.toLowerCase().includes(searchInput.toLowerCase()) ||
        log.tagId.toLowerCase().includes(searchInput.toLowerCase()) ||
        log.readerId.toLowerCase().includes(searchInput.toLowerCase()) ||
        log.location.toLowerCase().includes(searchInput.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(log => log.location === locationFilter);
    }

    return filtered;
  }, [recentLogs, searchInput, statusFilter, locationFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Header */}
        <PageHeader
          title="RFID Overview"
          subtitle="Monitor, analyze, and manage your RFID system at a glance."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'RFID Management', href: '/list/rfid' },
            { label: 'Overview' }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<CreditCard className="text-blue-500 w-5 h-5" />}
            label="Total Tags"
            value={stats.totalTags}
            valueClassName="text-blue-900"
            sublabel="Total RFID tags in system"
          />
          <SummaryCard
            icon={<Wifi className="text-green-500 w-5 h-5" />}
            label="Online Readers"
            value={stats.onlineReaders}
            valueClassName="text-green-900"
            sublabel="Currently online"
          />
          <SummaryCard
            icon={<ScanLine className="text-blue-500 w-5 h-5" />}
            label="Today's Scans"
            value={stats.todayLogs}
            valueClassName="text-blue-900"
            sublabel="Scans recorded today"
          />
          <SummaryCard
            icon={<FileText className="text-purple-500 w-5 h-5" />}
            label="Total Logs"
            value={stats.totalLogs}
            valueClassName="text-purple-900"
            sublabel="All-time scan records"
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential RFID management tools"
            icon={
              <div className="w-6 h-6 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            }
            actionCards={[
              {
                id: 'add-tag',
                label: 'Add Tag',
                description: 'Register new RFID tag',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => window.location.href = '/list/rfid/tags'
              },
              {
                id: 'configure-reader',
                label: 'Configure Reader',
                description: 'Setup RFID reader',
                icon: <Settings className="w-5 h-5 text-white" />,
                onClick: () => window.location.href = '/list/rfid/readers'
              },
              {
                id: 'view-logs',
                label: 'View Logs',
                description: 'Check RFID activity logs',
                icon: <FileText className="w-5 h-5 text-white" />,
                onClick: () => window.location.href = '/list/rfid/logs'
              },
              {
                id: 'export-data',
                label: 'Export Data',
                description: 'Export RFID data',
                icon: <Download className="w-5 h-5 text-white" />,
                onClick: () => console.log('Export RFID data')
              },
              {
                id: 'print-report',
                label: 'Print Report',
                description: 'Generate RFID report',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => console.log('Print RFID report')
              },
              {
                id: 'refresh-data',
                label: 'Refresh Data',
                description: 'Reload RFID data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-white" />
                ),
                onClick: handleRefresh,
                disabled: isRefreshing,
                loading: isRefreshing
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Tag Status Distribution</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-blue-400 cursor-pointer" aria-label="Info about tag status distribution" />
                    </TooltipTrigger>
                    <TooltipContent>Breakdown of all RFID tag statuses</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>Breakdown of all RFID tag statuses</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }} className="p-6">
              <DataChart
                type="pie"
                data={tagStatusData}
                title="Tag Status"
                height="250px"
                showLegend
                dataKeys={["value"]}
              />
            </CardContent>
          </Card>
          <Card className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Reader Status</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-green-500 cursor-pointer" aria-label="Info about reader status" />
                    </TooltipTrigger>
                    <TooltipContent>Online vs Offline readers</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>Online vs Offline readers</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }} className="p-6">
              <DataChart
                type="pie"
                data={readerStatusData}
                title="Reader Status"
                height="250px"
                showLegend
                dataKeys={["value"]}
                colors={["#22c55e", "#ef4444"]}
              />
            </CardContent>
          </Card>
          <Card className="md:col-span-2 transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Scan Trends (This Week)</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-blue-400 cursor-pointer" aria-label="Info about scan trends" />
                    </TooltipTrigger>
                    <TooltipContent>RFID scans per day</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>RFID scans per day</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }} className="p-6">
              <DataChart
                type="bar"
                data={scanTrendsData}
                title="Scan Trends"
                height="250px"
                showLegend={false}
                dataKeys={["value"]}
                colors={["#3b82f6"]}
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity with Enhanced UI/UX from Course List */}
        <div className="w-full max-w-full pt-4">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
            <CardHeader className="p-0">
              {/* Blue Gradient Header - flush to card edge, no rounded corners */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Recent RFID Activity</h3>
                      <p className="text-blue-100 text-sm">Latest scans and events</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col xl:flex-row gap-2 sm:gap-3 items-start xl:items-center justify-between">
                {/* Search Bar */}
                <div className="relative w-full xl:w-auto xl:min-w-[200px] xl:max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search RFID logs..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Quick Filter Dropdowns */}
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full xl:w-auto">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600">●</span> Success
                        </span>
                      </SelectItem>
                      <SelectItem value="error">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500">●</span> Error
                        </span>
                      </SelectItem>
                      <SelectItem value="unauthorized">
                        <span className="flex items-center gap-2">
                          <span className="text-orange-500">●</span> Unauthorized
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="w-full sm:w-32 lg:w-40 xl:w-40 text-gray-700">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="Room 101">Room 101</SelectItem>
                      <SelectItem value="Room 102">Room 102</SelectItem>
                      <SelectItem value="Library">Library</SelectItem>
                      <SelectItem value="Lab">Lab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Table Content */}
            <div className="relative px-2 sm:px-3 lg:px-6 mt-3 sm:mt-4 lg:mt-6">
              <div className="overflow-x-auto bg-white/70 shadow-none relative">
                {/* Loader overlay when refreshing */}
                {isRefreshing && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                    <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                  </div>
                )}
                <div className="print-content">
                  {!isRefreshing && filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <EmptyState
                        icon={<FileText className="w-6 h-6 text-blue-400" />}
                        title="No RFID activity found"
                        description="Try adjusting your search criteria or filters to find the RFID logs you're looking for."
                        action={
                          <div className="flex flex-col gap-2 w-full">
                            <Button
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl"
                              onClick={handleRefresh}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Refresh Data
                            </Button>
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <Table className="border-0 shadow-none max-w-full">
                      <TableHeader>
                        <TableRow className="bg-blue-50">
                          <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                          <TableHead className="text-blue-900 font-semibold">Tag ID</TableHead>
                          <TableHead className="text-blue-900 font-semibold">Student</TableHead>
                          <TableHead className="text-blue-900 font-semibold">Reader</TableHead>
                          <TableHead className="text-blue-900 font-semibold">Location</TableHead>
                          <TableHead className="text-blue-900 font-semibold">Type</TableHead>
                          <TableHead className="text-blue-900 font-semibold">Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="[&>tr>td]:text-blue-900">
                        {filteredLogs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-muted/50 border-b">
                            <TableCell className="text-center">{statusBadge(log.status)}</TableCell>
                            <TableCell className="font-medium">{log.tagId}</TableCell>
                            <TableCell>{log.studentName}</TableCell>
                            <TableCell>{log.readerId}</TableCell>
                            <TableCell>{log.location}</TableCell>
                            <TableCell className="capitalize">{log.scanType}</TableCell>
                            <TableCell>{log.timestamp}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
