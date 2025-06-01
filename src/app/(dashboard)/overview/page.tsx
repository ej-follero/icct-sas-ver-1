"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Clock, School, AlertCircle, TrendingUp, Calendar, Bell, ChevronRight, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface MockStats {
  students: { total: number; change: number };
  classes: { total: number; active: number };
  attendance: { rate: number; change: number };
  lateArrivals: { total: number; change: number };
}

interface RecentActivity {
  id: number;
  type: 'class_start' | 'late_arrival' | 'rfid_register';
  title: string;
  details: string;
  status: 'success' | 'warning' | 'info';
  avatar: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

// Mock data for demonstration
const mockStats: MockStats = {
  students: { total: 1234, change: 12 },
  classes: { total: 45, active: 8 },
  attendance: { rate: 92, change: 2 },
  lateArrivals: { total: 23, change: -5 }
};

const mockRecentActivity: RecentActivity[] = [
  {
    id: 1,
    type: 'class_start',
    title: 'Class ICT 101 Started',
    details: 'Room 203 • 5 minutes ago',
    status: 'success',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ICT101'
  },
  {
    id: 2,
    type: 'late_arrival',
    title: 'Late Arrival Recorded',
    details: 'Juan Dela Cruz • 10 minutes ago',
    status: 'warning',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juan'
  },
  {
    id: 3,
    type: 'rfid_register',
    title: 'New RFID Tag Registered',
    details: 'Tag #12345 • 15 minutes ago',
    status: 'info',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RFID'
  }
];

const quickActions: QuickAction[] = [
  {
    title: 'View Live Attendance',
    description: 'Monitor real-time attendance',
    icon: <Clock className="h-5 w-5 text-blue-700" />,
    href: '/list/live-attendance',
    color: 'bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-100'
  },
  {
    title: 'Generate Reports',
    description: 'Create attendance reports',
    icon: <TrendingUp className="h-5 w-5 text-blue-700" />,
    href: '/reports',
    color: 'bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-100'
  },
  {
    title: 'Manage Classes',
    description: 'View and edit class schedules',
    icon: <Calendar className="h-5 w-5 text-blue-700" />,
    href: '/list/schedules',
    color: 'bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-100'
  },
  {
    title: 'RFID Management',
    description: 'Configure RFID readers',
    icon: <Bell className="h-5 w-5 text-blue-700" />,
    href: '/list/rfid/readers',
    color: 'bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-100'
  }
];

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="hover:shadow-lg transition-all duration-300 border-none bg-white/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`p-2 rounded-full ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 mt-1">
          {change > 0 ? (
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          )}
          <p className="text-xs text-gray-500">
            {Math.abs(change)}% from last month
          </p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function OverviewPage() {
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Download report stub
  const handleDownload = () => {
    alert('Download report (stub)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 p-0">
      {/* Sticky glassy header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-blue-100 shadow flex items-center justify-between px-6 py-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-blue-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs md:text-sm bg-white/80 border-blue-200 text-blue-700 font-semibold">
            Last updated: {currentTime}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleDownload} aria-label="Download Report">
                  <Download className="w-5 h-5 text-blue-700" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download Report</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Search bar (hides navbar search bar) */}
      <div className="flex justify-end px-6 pt-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Input
                ref={searchInputRef}
                type="search"
                aria-label="Search"
                placeholder="Search dashboard..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-xs rounded-full border border-blue-200 bg-white/80 focus:ring-2 focus:ring-blue-400 px-4 py-2 text-sm shadow"
              />
            </TooltipTrigger>
            <TooltipContent>Search dashboard</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-6">
        <StatCard
          title="Total Students"
          value={mockStats.students.total.toLocaleString()}
          change={mockStats.students.change}
          icon={<Users className="h-5 w-5 text-blue-700" />}
          color="bg-blue-50 border border-blue-100"
        />
        <StatCard
          title="Active Classes"
          value={mockStats.classes.total}
          change={mockStats.classes.active}
          icon={<School className="h-5 w-5 text-blue-700" />}
          color="bg-blue-50 border border-blue-100"
        />
        <StatCard
          title="Today's Attendance"
          value={`${mockStats.attendance.rate}%`}
          change={mockStats.attendance.change}
          icon={<Clock className="h-5 w-5 text-blue-700" />}
          color="bg-blue-50 border border-blue-100"
        />
        <StatCard
          title="Late Arrivals"
          value={mockStats.lateArrivals.total}
          change={mockStats.lateArrivals.change}
          icon={<AlertCircle className="h-5 w-5 text-blue-700" />}
          color="bg-blue-50 border border-blue-100"
        />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pb-8">
        {/* Quick Actions */}
        <Card className="border border-blue-100 bg-white/90 backdrop-blur-md shadow-sm">
          <CardHeader>
            <CardTitle className="font-bold text-blue-800">Quick Actions</CardTitle>
            <CardDescription>Access frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={action.href}
                        className={`p-4 ${action.color} rounded-xl transition-all duration-300 flex flex-col group shadow-sm hover:scale-[1.03]`}
                        onMouseEnter={() => setHoveredAction(index)}
                        onMouseLeave={() => setHoveredAction(null)}
                        tabIndex={0}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold group-hover:text-white transition-colors">
                            {action.title}
                          </div>
                          <ChevronRight className={`h-5 w-5 transition-transform group-hover:text-white ${hoveredAction === index ? 'translate-x-1' : ''}`} />
                        </div>
                        <p className="text-xs text-gray-600 mt-1 group-hover:text-white/80 transition-colors">
                          {action.description}
                        </p>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>{action.title}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border border-blue-100 bg-white/90 backdrop-blur-md shadow-sm">
          <CardHeader>
            <CardTitle className="font-bold text-blue-800">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-blue-100/60 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.avatar} />
                    <AvatarFallback>
                      {activity.title.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-blue-800">{activity.title}</p>
                      <Badge variant={
                        activity.status === 'success' ? 'default' :
                        activity.status === 'warning' ? 'destructive' :
                        'secondary'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{activity.details}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 