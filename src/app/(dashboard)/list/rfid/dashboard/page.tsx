"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataChart from "@/components/DataChart";
import { FileText, CreditCard, Wifi, WifiOff, ScanLine, ArrowRight, Info, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from '@/components/PageHeader/PageHeader';

// Simulate loading state for demonstration
const useDashboardData = () => {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
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
  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
    }, 1200);
  };
  return { stats, tagStatusData, readerStatusData, scanTrendsData, recentLogs, loading, lastUpdated, refresh };
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
  const { stats, tagStatusData, readerStatusData, scanTrendsData, recentLogs, loading, lastUpdated, refresh } = useDashboardData();

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <PageHeader
          title="RFID Dashboard"
          subtitle="Monitor, analyze, and manage your RFID system at a glance."
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'RFID Management', href: '/rfid' },
            { label: 'Dashboard' }
          ]}
        />

        {/* Top Bar: Refresh & Last Updated */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground" aria-live="polite">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button onClick={refresh} variant="outline" size="sm" aria-label="Refresh dashboard" disabled={loading} className="gap-2">
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Stat Card Example */}
          <Card tabIndex={0} className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  Total Tags
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-blue-400 cursor-pointer" aria-label="Info about total tags" />
                    </TooltipTrigger>
                    <TooltipContent>Total number of RFID tags in the system</TooltipContent>
                  </Tooltip>
                </span>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold mt-2">
                {loading ? <Skeleton className="h-7 w-16" /> : stats.totalTags}
              </div>
            </CardContent>
          </Card>
          <Card tabIndex={0} className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  Active Tags
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-green-400 cursor-pointer" aria-label="Info about active tags" />
                    </TooltipTrigger>
                    <TooltipContent>Tags currently active and assigned</TooltipContent>
                  </Tooltip>
                </span>
                <Badge variant="default">Active</Badge>
              </div>
              <div className="text-2xl font-bold mt-2">
                {loading ? <Skeleton className="h-7 w-16" /> : stats.activeTags}
              </div>
            </CardContent>
          </Card>
          <Card tabIndex={0} className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  Online Readers
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-green-500 cursor-pointer" aria-label="Info about online readers" />
                    </TooltipTrigger>
                    <TooltipContent>RFID readers currently online</TooltipContent>
                  </Tooltip>
                </span>
                <Wifi className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold mt-2">
                {loading ? <Skeleton className="h-7 w-16" /> : stats.onlineReaders}
              </div>
            </CardContent>
          </Card>
          <Card tabIndex={0} className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  Offline Readers
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-red-500 cursor-pointer" aria-label="Info about offline readers" />
                    </TooltipTrigger>
                    <TooltipContent>RFID readers currently offline</TooltipContent>
                  </Tooltip>
                </span>
                <WifiOff className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-2xl font-bold mt-2">
                {loading ? <Skeleton className="h-7 w-16" /> : stats.offlineReaders}
              </div>
            </CardContent>
          </Card>
          <Card tabIndex={0} className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardContent className="p-6">
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  Today's Scans
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-blue-500 cursor-pointer" aria-label="Info about today's scans" />
                    </TooltipTrigger>
                    <TooltipContent>Number of RFID scans today</TooltipContent>
                  </Tooltip>
                </span>
                <ScanLine className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold mt-2">
                {loading ? <Skeleton className="h-7 w-16" /> : stats.todayLogs}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Tag Status Distribution</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-blue-400 cursor-pointer" aria-label="Info about tag status distribution" />
                  </TooltipTrigger>
                  <TooltipContent>Breakdown of all RFID tag statuses</TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>Breakdown of all RFID tag statuses</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }} className="p-6">
              {loading ? (
                <Skeleton className="h-56 w-full rounded-lg" />
              ) : (
                <DataChart
                  type="pie"
                  data={tagStatusData}
                  title="Tag Status"
                  height="250px"
                  showLegend
                  dataKeys={["value"]}
                />
              )}
            </CardContent>
          </Card>
          <Card className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Reader Status</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-green-500 cursor-pointer" aria-label="Info about reader status" />
                  </TooltipTrigger>
                  <TooltipContent>Online vs Offline readers</TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>Online vs Offline readers</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }} className="p-6">
              {loading ? (
                <Skeleton className="h-56 w-full rounded-lg" />
              ) : (
                <DataChart
                  type="pie"
                  data={readerStatusData}
                  title="Reader Status"
                  height="250px"
                  showLegend
                  dataKeys={["value"]}
                  colors={["#22c55e", "#ef4444"]}
                />
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2 transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Scan Trends (This Week)</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-blue-400 cursor-pointer" aria-label="Info about scan trends" />
                  </TooltipTrigger>
                  <TooltipContent>RFID scans per day</TooltipContent>
                </Tooltip>
              </div>
              <CardDescription>RFID scans per day</CardDescription>
            </CardHeader>
            <CardContent style={{ height: 300 }} className="p-6">
              {loading ? (
                <Skeleton className="h-56 w-full rounded-lg" />
              ) : (
                <DataChart
                  type="bar"
                  data={scanTrendsData}
                  title="Scan Trends"
                  height="250px"
                  showLegend={false}
                  dataKeys={["value"]}
                  colors={["#3b82f6"]}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/dashboard/list/rfid/tags" aria-label="Go to RFID Tags">
            <Card tabIndex={0} className="hover:shadow-lg focus:ring-2 focus:ring-blue-400 transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-6">
                <CreditCard className="h-8 w-8 text-blue-500 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold">RFID Tags</div>
                  <div className="text-sm text-muted-foreground">Manage tags</div>
                </div>
                <ArrowRight className="ml-auto text-blue-400 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/list/rfid/readers" aria-label="Go to RFID Readers">
            <Card tabIndex={0} className="hover:shadow-lg focus:ring-2 focus:ring-blue-400 transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-6">
                <Wifi className="h-8 w-8 text-green-500 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold">RFID Readers</div>
                  <div className="text-sm text-muted-foreground">Manage devices</div>
                </div>
                <ArrowRight className="ml-auto text-green-400 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/list/rfid/logs" aria-label="Go to RFID Logs">
            <Card tabIndex={0} className="hover:shadow-lg focus:ring-2 focus:ring-blue-400 transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-6">
                <FileText className="h-8 w-8 text-gray-500 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold">RFID Logs</div>
                  <div className="text-sm text-muted-foreground">View scan history</div>
                </div>
                <ArrowRight className="ml-auto text-gray-400 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/list/rfid/config" aria-label="Go to RFID Config">
            <Card tabIndex={0} className="hover:shadow-lg focus:ring-2 focus:ring-blue-400 transition-shadow cursor-pointer group">
              <CardContent className="flex items-center gap-4 p-6">
                <ScanLine className="h-8 w-8 text-purple-500 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-semibold">RFID Config</div>
                  <div className="text-sm text-muted-foreground">System settings</div>
                </div>
                <ArrowRight className="ml-auto text-purple-400 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="transition-shadow focus:ring-2 focus:ring-blue-400 hover:shadow-lg group">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Recent RFID Activity</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-blue-400 cursor-pointer" aria-label="Info about recent activity" />
                </TooltipTrigger>
                <TooltipContent>Latest scans and events</TooltipContent>
              </Tooltip>
            </div>
            <CardDescription>Latest scans and events</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              {loading ? (
                <Skeleton className="h-32 w-full rounded-lg" />
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-2 py-2 text-left">Status</th>
                      <th className="px-2 py-2 text-left">Tag ID</th>
                      <th className="px-2 py-2 text-left">Student</th>
                      <th className="px-2 py-2 text-left">Reader</th>
                      <th className="px-2 py-2 text-left">Location</th>
                      <th className="px-2 py-2 text-left">Type</th>
                      <th className="px-2 py-2 text-left">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="px-2 py-2">{statusBadge(log.status)}</td>
                        <td className="px-2 py-2 font-medium">{log.tagId}</td>
                        <td className="px-2 py-2">{log.studentName}</td>
                        <td className="px-2 py-2">{log.readerId}</td>
                        <td className="px-2 py-2">{log.location}</td>
                        <td className="px-2 py-2">{log.scanType}</td>
                        <td className="px-2 py-2">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {!loading && recentLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No recent RFID activity found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
