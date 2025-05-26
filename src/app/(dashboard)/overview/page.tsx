"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Clock, School, AlertCircle, TrendingUp, Calendar, Bell, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

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
    icon: <Clock className="h-5 w-5" />,
    href: '/list/live-attendance',
    color: 'bg-sasLightBlue hover:bg-sasBlue hover:text-white'
  },
  {
    title: 'Generate Reports',
    description: 'Create attendance reports',
    icon: <TrendingUp className="h-5 w-5" />,
    href: '/reports',
    color: 'bg-sasLightGreen hover:bg-sasGreen hover:text-white'
  },
  {
    title: 'Manage Classes',
    description: 'View and edit class schedules',
    icon: <Calendar className="h-5 w-5" />,
    href: '/list/schedules',
    color: 'bg-sasPink hover:bg-sasPurple hover:text-white'
  },
  {
    title: 'RFID Management',
    description: 'Configure RFID readers',
    icon: <Bell className="h-5 w-5" />,
    href: '/list/rfid/readers',
    color: 'bg-sasRedLight hover:bg-sasRed hover:text-white'
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

  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date().toLocaleTimeString());
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-sasBlue to-sasPurple bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Last updated: {currentTime}
        </Badge>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={mockStats.students.total.toLocaleString()}
          change={mockStats.students.change}
          icon={<Users className="h-4 w-4 text-sasBlue" />}
          color="bg-sasLightBlue"
        />
        <StatCard
          title="Active Classes"
          value={mockStats.classes.total}
          change={mockStats.classes.active}
          icon={<School className="h-4 w-4 text-sasGreen" />}
          color="bg-sasLightGreen"
        />
        <StatCard
          title="Today's Attendance"
          value={`${mockStats.attendance.rate}%`}
          change={mockStats.attendance.change}
          icon={<Clock className="h-4 w-4 text-sasPurple" />}
          color="bg-sasPink"
        />
        <StatCard
          title="Late Arrivals"
          value={mockStats.lateArrivals.total}
          change={mockStats.lateArrivals.change}
          icon={<AlertCircle className="h-4 w-4 text-sasRed" />}
          color="bg-sasRedLight"
        />
        </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link 
                  key={index}
                  href={action.href}
                  className={`p-4 ${action.color} rounded-lg transition-all duration-300 flex flex-col group`}
                  onMouseEnter={() => setHoveredAction(index)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium group-hover:text-white transition-colors">
                      {action.title}
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform group-hover:text-white ${
                      hoveredAction === index ? 'translate-x-1' : ''
                    }`} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1 group-hover:text-white/80 transition-colors">
                    {action.description}
                  </p>
                </Link>
              ))}
              </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
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
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-white/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activity.avatar} />
                    <AvatarFallback>
                      {activity.title.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{activity.title}</p>
                      <Badge variant={
                        activity.status === 'success' ? 'default' :
                        activity.status === 'warning' ? 'destructive' :
                        'secondary'
                      }>
                        {activity.status}
                      </Badge>
                </div>
                    <p className="text-sm text-gray-500">{activity.details}</p>
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