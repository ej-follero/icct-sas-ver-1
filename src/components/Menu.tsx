"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import {
  LayoutDashboard,
  Clock,
  School,
  User,
  ScanLine,
  BarChart2,
  FileBarChart2,
  Megaphone,
  Settings,
  Archive,
  UserCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  Calendar,
  AppWindow,
  Mail,
  Shield,
  Bell,
  FileText,
  BarChart3,
  Users,
  Download,
  TrendingUp,
  Activity,
  Target,
  CreditCard,
  BookOpen,
  Book,
  DoorOpen,
  CalendarRange,
  UserCheck,
  Edit,
  AlertTriangle,
  Database,
  Palette,
  Zap,
  Wifi,
  RotateCcw,
  Key,
  Globe,
  Upload,
  Building2,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn classnames utility
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type MenuItem = {
  icon: JSX.Element;
  label: string;
  href: string;
  description?: string;
  subItems?: MenuItem[];
};

type MenuSection = {
  title: string;
  sectionIcon: JSX.Element;
  items: MenuItem[];
  compact?: boolean;
};

type Role = "super_admin" | "admin" | "department_head" | "teacher" | "student";

type MenuConfig = Record<Role, MenuSection[]>;

// --- FULL MENU CONFIG ---
const menuConfig: MenuConfig = {
  super_admin: [
    {
      title: "DASHBOARD",
      sectionIcon: <LayoutDashboard className="w-5 h-5" />,
      items: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: "System Dashboard", href: "/dashboard", description: "System-wide overview" },
      ],
    },
    {
      title: "USER MANAGEMENT",
      sectionIcon: <UserCircle className="w-5 h-5" />,
      items: [
        { icon: <Users className="w-5 h-5" />, label: "All Users", href: "/list/users", description: "Manage all users with role-based filtering" },
        { icon: <Shield className="w-5 h-5" />, label: "Roles & Permissions", href: "/settings/roles", description: "Manage roles and permissions" },
        { icon: <UserCheck className="w-5 h-5" />, label: "Super Admin Users", href: "/settings/super-admin-users", description: "Manage Super Admin accounts" },
        { icon: <Activity className="w-5 h-5" />, label: "Admin Audit", href: "/settings/admin-audit", description: "Admin user audit trail" },
      ],
    },
    {
      title: "EMERGENCY & RECOVERY",
      sectionIcon: <AlertTriangle className="w-5 h-5" />,
      compact: true,
      items: [
        { icon: <AlertTriangle className="w-5 h-5" />, label: "Emergency Access", href: "/settings/emergency-access", description: "Emergency system access" },
        { icon: <RotateCcw className="w-5 h-5" />, label: "System Recovery", href: "/settings/system-recovery", description: "System recovery procedures" },
        { icon: <Activity className="w-5 h-5" />, label: "Emergency Procedures", href: "/settings/emergency-procedures", description: "Emergency escalation paths" },
      ],
    },
    {
      title: "DATABASE ADMINISTRATION",
      sectionIcon: <Database className="w-5 h-5" />,
      compact: true,
      items: [
        { icon: <Database className="w-5 h-5" />, label: "Database Management", href: "/settings/database-management", description: "Database operations" },
        { icon: <Upload className="w-5 h-5" />, label: "Migrations", href: "/settings/database-migrations", description: "Schema migrations" },
        { icon: <Download className="w-5 h-5" />, label: "Advanced Backup", href: "/settings/database-backup", description: "Advanced backup management" },
        { icon: <RotateCcw className="w-5 h-5" />, label: "Data Restoration", href: "/settings/database-restore", description: "Data restoration" },
      ],
    },
    {
      title: "API MANAGEMENT",
      sectionIcon: <Settings className="w-5 h-5" />,
      compact: true,
      items: [
        { icon: <Key className="w-5 h-5" />, label: "API Keys", href: "/settings/api-keys", description: "API key management" },
        { icon: <Globe className="w-5 h-5" />, label: "API Endpoints", href: "/settings/api-endpoints", description: "API endpoint configuration" },
        { icon: <Activity className="w-5 h-5" />, label: "API Monitoring", href: "/settings/api-monitoring", description: "API usage monitoring" },
      ],
    },
    {
      title: "RFID MANAGEMENT",
      sectionIcon: <ScanLine className="w-5 h-5" />,
      compact: true,
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "Overview", href: "/list/rfid/dashboard", description: "System dashboard & analytics" },
        {
          icon: <Wifi className="w-5 h-5" />,
          label: "Devices",
          href: "#",
          description: "Manage RFID readers and tags",
          subItems: [
            { icon: <Wifi className="w-5 h-5" />, label: "Readers", href: "/list/rfid/readers", description: "Manage RFID devices" },
            { icon: <CreditCard className="w-5 h-5" />, label: "Tags", href: "/list/rfid/tags", description: "Manage student cards" },
          ]
        },
        { icon: <FileText className="w-5 h-5" />, label: "Activity", href: "/list/rfid/logs", description: "View scan history" },
        { icon: <Settings className="w-5 h-5" />, label: "Config", href: "/list/rfid/config", description: "System configuration" },
      ],
    },
    {
      title: "COMMUNICATION",
      sectionIcon: <Mail className="w-5 h-5" />,
      compact: true,
      items: [
        {
          icon: <Megaphone className="w-5 h-5" />,
          label: "Broadcasts",
          href: "#",
          description: "Announcements and events",
          subItems: [
            { icon: <Megaphone className="w-5 h-5" />, label: "Announcements", href: "/list/announcements", description: "Broadcast announcements" },
            { icon: <Calendar className="w-5 h-5" />, label: "Events", href: "/list/events", description: "Manage events" },
          ]
        },
        { icon: <Mail className="w-5 h-5" />, label: "Email", href: "/list/email", description: "Email management" },
        
      ],
    },
    {
      title: "SYSTEM ANALYTICS",
      sectionIcon: <BarChart3 className="w-5 h-5" />,
      compact: true,
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "System-wide Analytics", href: "/analytics/system-wide", description: "System-wide analytics" },
        { icon: <Activity className="w-5 h-5" />, label: "Performance Metrics", href: "/analytics/performance-metrics", description: "Performance monitoring" },
        { icon: <Shield className="w-5 h-5" />, label: "Security Analytics", href: "/analytics/security-analytics", description: "Security analytics" },
      ],
    },
    {
      title: "SYSTEM SETTINGS",
      sectionIcon: <Settings className="w-5 h-5" />,
      compact: true,
      items: [
        {
          icon: <Shield className="w-5 h-5" />, label: "Access Control", href: "#", description: "Security settings",
          subItems: [
            { icon: <Shield className="w-5 h-5" />, label: "Security", href: "/settings/security", description: "Security settings" },
          ]
        },
        {
          icon: <Activity className="w-5 h-5" />, label: "System Health", href: "#", description: "Monitor and maintain system health",
          subItems: [
            { icon: <Activity className="w-5 h-5" />, label: "Status", href: "/settings/system-status", description: "System status overview" },
            { icon: <Database className="w-5 h-5" />, label: "Backup", href: "/settings/backup", description: "Backup and restore data" },
          ]
        },
        {
          icon: <Settings className="w-5 h-5" />, label: "Advanced Configuration", href: "#", description: "Advanced system settings",
          subItems: [
            { icon: <Settings className="w-5 h-5" />, label: "System Override", href: "/settings/system-override", description: "System configuration override" },
            { icon: <Settings className="w-5 h-5" />, label: "Advanced Config", href: "/settings/advanced-config", description: "Advanced system settings" },
            { icon: <Zap className="w-5 h-5" />, label: "Performance Tuning", href: "/settings/performance-tuning", description: "Performance optimization" },
          ]
        },
      ],
    },
    {
      title: "LOGOUT",
      sectionIcon: <LogOut className="w-5 h-5" />,
      items: [
        { icon: <LogOut className="w-5 h-5" />, label: "Logout", href: "/logout" },
      ],
    },
  ],

  admin: [
    {
      title: "DASHBOARD",
      sectionIcon: <LayoutDashboard className="w-5 h-5" />,
      items: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      title: "ATTENDANCE MANAGEMENT",
      sectionIcon: <UserCheck className="w-5 h-5" />,
      items: [
        { icon: <Users className="w-5 h-5" />, label: "Student Attendance", href: "/list/attendance/students" },
        { icon: <UserCheck className="w-5 h-5" />, label: "Instructor Attendance", href: "/list/attendance/instructors" },
        { icon: <Activity className="w-5 h-5" />, label: "Live Attendance Feed", href: "/list/live-attendance" },
      ],
    },
    
    {
      title: "ACADEMIC MANAGEMENT",
      sectionIcon: <BookOpen className="w-5 h-5" />,
      compact: true,
      items: [
        {
          icon: <School className="w-5 h-5" />, label: "Structure", href: "#", description: "Core academic entities",
          subItems: [
            { icon: <School className="w-5 h-5" />, label: "Departments", href: "/list/departments", description: "Manage departments" },
            { icon: <BookOpen className="w-5 h-5" />, label: "Courses", href: "/list/courses", description: "Manage courses" },
            { icon: <Book className="w-5 h-5" />, label: "Subjects", href: "/list/subjects", description: "Manage subjects" },
          ]
        },
        {
          icon: <CalendarRange className="w-5 h-5" />, label: "Scheduling", href: "#", description: "Time and schedule management",
          subItems: [
            { icon: <CalendarRange className="w-5 h-5" />, label: "Schedules", href: "/list/schedules", description: "Class schedules" },
            { icon: <Calendar className="w-5 h-5" />, label: "Calendar", href: "/list/academic-calendar", description: "Academic calendar" },
          ]
        },
        {
          icon: <Users className="w-5 h-5" />, label: "Resources", href: "#", description: "Physical and logical resources",
          subItems: [
            { icon: <Users className="w-5 h-5" />, label: "Sections", href: "/list/sections", description: "Manage sections" },
            { icon: <DoorOpen className="w-5 h-5" />, label: "Rooms", href: "/list/rooms", description: "Manage rooms" },
          ]
        },
      ],
    },
    {
      title: "USER MANAGEMENT",
      sectionIcon: <UserCircle className="w-5 h-5" />,
      items: [
        { icon: <Users className="w-5 h-5" />, label: "All Users", href: "/list/users", description: "Manage all users with role-based filtering" },
        { icon: <Shield className="w-5 h-5" />, label: "Roles & Permissions", href: "/settings/roles", description: "Manage roles and permissions" },
      ],
    },
    {
      title: "RFID MANAGEMENT",
      sectionIcon: <ScanLine className="w-5 h-5" />,
      compact: true,
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "Overview", href: "/list/rfid/dashboard", description: "System dashboard & analytics" },
        {
          icon: <Wifi className="w-5 h-5" />,
          label: "Devices",
          href: "#",
          description: "Manage RFID readers and tags",
          subItems: [
            { icon: <Wifi className="w-5 h-5" />, label: "Readers", href: "/list/rfid/readers", description: "Manage RFID devices" },
            { icon: <CreditCard className="w-5 h-5" />, label: "Tags", href: "/list/rfid/tags", description: "Manage student cards" },
          ]
        },
        { icon: <FileText className="w-5 h-5" />, label: "Activity", href: "/list/rfid/logs", description: "View scan history" },
        { icon: <Settings className="w-5 h-5" />, label: "Config", href: "/list/rfid/config", description: "System configuration" },
      ],
    },
    {
      title: "COMMUNICATION",
      sectionIcon: <Mail className="w-5 h-5" />,
      compact: true,
      items: [
        {
          icon: <Megaphone className="w-5 h-5" />,
          label: "Broadcasts",
          href: "#",
          description: "Announcements and events",
          subItems: [
            { icon: <Megaphone className="w-5 h-5" />, label: "Announcements", href: "/list/announcements", description: "Broadcast announcements" },
            { icon: <Calendar className="w-5 h-5" />, label: "Events", href: "/list/events", description: "Manage events" },
          ]
        },
        { icon: <Mail className="w-5 h-5" />, label: "Email", href: "/list/email", description: "Email management" },
      ],
    },
    {
      title: "SYSTEM SETTINGS",
      sectionIcon: <Settings className="w-5 h-5" />,
      compact: true,
      items: [
        {
          icon: <Shield className="w-5 h-5" />, label: "Access Control", href: "#", description: "Security settings",
          subItems: [
            { icon: <Shield className="w-5 h-5" />, label: "Security", href: "/settings/security", description: "Security settings" },
          ]
        },
        {
          icon: <Activity className="w-5 h-5" />, label: "System Health", href: "#", description: "Monitor and maintain system health",
          subItems: [
            { icon: <Activity className="w-5 h-5" />, label: "Status", href: "/settings/system-status", description: "System status overview" },
            { icon: <Database className="w-5 h-5" />, label: "Backup", href: "/settings/backup", description: "Backup and restore data" },
          ]
        },
      ],
    },
    {
      title: "LOGOUT",
      sectionIcon: <LogOut className="w-5 h-5" />,
      items: [
        { icon: <LogOut className="w-5 h-5" />, label: "Logout", href: "/logout" },
      ],
    },
  ],

  department_head: [
    {
      title: "DASHBOARD",
      sectionIcon: <LayoutDashboard className="w-5 h-5" />,
      items: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      title: "ACADEMIC MANAGEMENT",
      sectionIcon: <BookOpen className="w-5 h-5" />,
      compact: true,
      items: [
        {
          icon: <School className="w-5 h-5" />, label: "Structure", href: "#", description: "Core academic entities",
          subItems: [
            { icon: <School className="w-5 h-5" />, label: "Departments", href: "/list/departments", description: "Manage departments" },
            { icon: <BookOpen className="w-5 h-5" />, label: "Courses", href: "/list/courses", description: "Manage courses" },
            { icon: <Book className="w-5 h-5" />, label: "Subjects", href: "/list/subjects", description: "Manage subjects" },
          ]
        },
        {
          icon: <CalendarRange className="w-5 h-5" />, label: "Scheduling", href: "#", description: "Time and schedule management",
          subItems: [
            { icon: <CalendarRange className="w-5 h-5" />, label: "Schedules", href: "/list/schedules", description: "Class schedules" },
            { icon: <Calendar className="w-5 h-5" />, label: "Calendar", href: "/list/academic-calendar", description: "Academic calendar" },
          ]
        },
        {
          icon: <Users className="w-5 h-5" />, label: "Resources", href: "#", description: "Physical and logical resources",
          subItems: [
            { icon: <Users className="w-5 h-5" />, label: "Sections", href: "/list/sections", description: "Manage sections" },
            { icon: <DoorOpen className="w-5 h-5" />, label: "Rooms", href: "/list/rooms", description: "Manage rooms" },
          ]
        },
      ],
    },
         {
       title: "USER MANAGEMENT",
       sectionIcon: <UserCircle className="w-5 h-5" />,
       items: [
         { icon: <Users className="w-5 h-5" />, label: "All Users", href: "/list/users", description: "Manage all users with role-based filtering" },
         { icon: <Shield className="w-5 h-5" />, label: "Roles & Permissions", href: "/settings/roles", description: "Manage roles and permissions" },
       ],
     },
    {
      title: "RFID MANAGEMENT",
      sectionIcon: <ScanLine className="w-5 h-5" />,
      compact: true,
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "Overview", href: "/list/rfid/dashboard", description: "System dashboard & analytics" },
        {
          icon: <Wifi className="w-5 h-5" />,
          label: "Devices",
          href: "#",
          description: "Manage RFID readers and tags",
          subItems: [
            { icon: <Wifi className="w-5 h-5" />, label: "Readers", href: "/list/rfid/readers", description: "Manage RFID devices" },
            { icon: <CreditCard className="w-5 h-5" />, label: "Tags", href: "/list/rfid/tags", description: "Manage student cards" },
          ]
        },
        { icon: <FileText className="w-5 h-5" />, label: "Activity", href: "/list/rfid/logs", description: "View scan history" },
        { icon: <Settings className="w-5 h-5" />, label: "Config", href: "/list/rfid/config", description: "System configuration" },
      ],
    },
    {
      title: "COMMUNICATION",
      sectionIcon: <Mail className="w-5 h-5" />,
      compact: true,
      items: [
        {
          icon: <Megaphone className="w-5 h-5" />,
          label: "Broadcasts",
          href: "#",
          description: "Announcements and events",
          subItems: [
            { icon: <Megaphone className="w-5 h-5" />, label: "Announcements", href: "/list/announcements", description: "Broadcast announcements" },
            { icon: <Calendar className="w-5 h-5" />, label: "Events", href: "/list/events", description: "Manage events" },
          ]
        },
        { icon: <Mail className="w-5 h-5" />, label: "Email", href: "/list/email", description: "Email management" },
      ],
    },
    {
      title: "SYSTEM SETTINGS",
      sectionIcon: <Settings className="w-5 h-5" />,
      compact: true,
      items: [
        {
          icon: <Shield className="w-5 h-5" />, label: "Access Control", href: "#", description: "Security settings",
          subItems: [
            { icon: <Shield className="w-5 h-5" />, label: "Security", href: "/settings/security", description: "Security settings" },
          ]
        },
        {
          icon: <Activity className="w-5 h-5" />, label: "System Health", href: "#", description: "Monitor and maintain system health",
          subItems: [
            { icon: <Activity className="w-5 h-5" />, label: "Status", href: "/settings/system-status", description: "System status overview" },
            { icon: <Database className="w-5 h-5" />, label: "Backup", href: "/settings/backup", description: "Backup and restore data" },
          ]
        },
      ],
    },
    {
      title: "LOGOUT",
      sectionIcon: <LogOut className="w-5 h-5" />,
      items: [
        { icon: <LogOut className="w-5 h-5" />, label: "Logout", href: "/logout" },
      ],
    },
  ],

  teacher: [
    {
      title: "SCHEDULE",
      sectionIcon: <Calendar className="w-5 h-5" />,
      items: [
        { icon: <Calendar className="w-5 h-5" />, label: "My Schedule", href: "/list/schedule" },
      ],
    },
    {
      title: "ATTENDANCE",
      sectionIcon: <Clock className="w-5 h-5" />,
      items: [
        { icon: <Clock className="w-5 h-5" />, label: "Record Attendance", href: "/list/attendance/record" },
        { icon: <Clock className="w-5 h-5" />, label: "My Attendance Log", href: "/list/attendance/log" },
        { icon: <Clock className="w-5 h-5" />, label: "Class Attendance Summary", href: "/list/attendance/summary" },
      ],
    },
    {
      title: "CLASS MANAGEMENT",
      sectionIcon: <School className="w-5 h-5" />,
      items: [
        { icon: <School className="w-5 h-5" />, label: "My Classes", href: "/list/classes" },
        { icon: <School className="w-5 h-5" />, label: "My Subjects", href: "/list/subjects" },
                 { icon: <School className="w-5 h-5" />, label: "Student List", href: "/list/users" },
      ],
    },
    {
      title: "ANALYTICS",
      sectionIcon: <BarChart3 className="w-5 h-5" />,
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "My Analytics", href: "/teacher/analytics" },
        { icon: <TrendingUp className="w-5 h-5" />, label: "Class Trends", href: "/teacher/class-trends" },
        { icon: <Users className="w-5 h-5" />, label: "Student Insights", href: "/teacher/student-insights" },
        { icon: <Target className="w-5 h-5" />, label: "Performance Metrics", href: "/teacher/performance" },
      ],
    },
    {
      title: "REPORTS",
      sectionIcon: <BarChart3 className="w-5 h-5" />,
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "My Reports", href: "/teacher/reports" },
        { icon: <FileText className="w-5 h-5" />, label: "Class Reports", href: "/teacher/class-reports" },
        { icon: <Download className="w-5 h-5" />, label: "Export Data", href: "/teacher/export" },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      sectionIcon: <Megaphone className="w-5 h-5" />,
      items: [
        { icon: <Megaphone className="w-5 h-5" />, label: "View Announcements", href: "/list/announcements" },
        { icon: <Megaphone className="w-5 h-5" />, label: "Post Announcement", href: "/list/announcements/post" },
      ],
    },
    
    {
      title: "PROFILE",
      sectionIcon: <User className="w-5 h-5" />,
      items: [
        { icon: <User className="w-5 h-5" />, label: "View Profile", href: "/profile" },
        { icon: <User className="w-5 h-5" />, label: "Edit Info", href: "/profile/edit" },
        { icon: <User className="w-5 h-5" />, label: "Change Password", href: "/profile/password" },
      ],
    },
    {
      title: "LOGOUT",
      sectionIcon: <LogOut className="w-5 h-5" />,
      items: [
        { icon: <LogOut className="w-5 h-5" />, label: "Logout", href: "/logout" },
      ],
    },
  ],

  student: [
    {
      title: "SCHEDULE",
      sectionIcon: <Calendar className="w-5 h-5" />,
      items: [
        { icon: <Calendar className="w-5 h-5" />, label: "Weekly Timetable", href: "/list/schedule" },
      ],
    },
    {
      title: "ATTENDANCE",
      sectionIcon: <Clock className="w-5 h-5" />,
      items: [
        { icon: <Clock className="w-5 h-5" />, label: "Attendance Records", href: "/list/attendance/records" },
        { icon: <Clock className="w-5 h-5" />, label: "Absences & Late Logs", href: "/list/attendance/logs" },
        { icon: <ScanLine className="w-5 h-5" />, label: "RFID Scan History", href: "/list/attendance/rfid-history" },
      ],
    },
    {
      title: "ANALYTICS",
      sectionIcon: <BarChart3 className="w-5 h-5" />,
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "My Analytics", href: "/student/analytics" },
        { icon: <TrendingUp className="w-5 h-5" />, label: "Attendance Trends", href: "/student/trends" },
        { icon: <Target className="w-5 h-5" />, label: "Performance Insights", href: "/student/performance" },
        { icon: <Activity className="w-5 h-5" />, label: "RFID Activity", href: "/student/rfid-activity" },
      ],
    },
    {
      title: "ACADEMICS",
      sectionIcon: <School className="w-5 h-5" />,
      items: [
        { icon: <School className="w-5 h-5" />, label: "Subjects", href: "/list/subjects" },
        { icon: <School className="w-5 h-5" />, label: "Class Info", href: "/list/class-info" },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      sectionIcon: <Megaphone className="w-5 h-5" />,
      items: [
        { icon: <Megaphone className="w-5 h-5" />, label: "School Events", href: "/list/announcements/events" },
        { icon: <Megaphone className="w-5 h-5" />, label: "Class Updates", href: "/list/announcements/updates" },
      ],
    },
    
    {
      title: "PROFILE",
      sectionIcon: <User className="w-5 h-5" />,
      items: [
        { icon: <User className="w-5 h-5" />, label: "View Profile", href: "/profile" },
        { icon: <User className="w-5 h-5" />, label: "Edit Info", href: "/profile/edit" },
        { icon: <User className="w-5 h-5" />, label: "Change Password", href: "/profile/password" },
      ],
    },
    {
      title: "LOGOUT",
      sectionIcon: <LogOut className="w-5 h-5" />,
      items: [
        { icon: <LogOut className="w-5 h-5" />, label: "Logout", href: "/logout" },
      ],
    },
  ],


};
// --- END FULL MENU CONFIG ---

export default function Sidebar({ role, collapsed = false }: { role: Role; collapsed?: boolean }) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    // Initialize sections based on current path
    const initial: Record<string, boolean> = {};
    menuConfig[role].forEach((section) => {
      initial[section.title] = section.items.some((item) => pathname.startsWith(item.href));
    });
    return initial;
  });

  // Hover state for hover-expandable sidebar
  const [hovered, setHovered] = useState(false);

  // Sidebar is expanded if not collapsed, or if collapsed but hovered
  const expanded = !collapsed || hovered;

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <TooltipProvider>
      <aside
        className={
          `transition-all duration-200 min-h-screen flex flex-col
          ${collapsed && !hovered ? 'w-16 items-center bg-[#0c2556]' : 'w-64 bg-white'}
          ${collapsed && hovered ? 'fixed z-40 left-0' : ''}`
        }
        onMouseEnter={() => collapsed && setHovered(true)}
        onMouseLeave={() => collapsed && setHovered(false)}
        style={
          collapsed && hovered
            ? {
                transition: 'width 0.2s',
                top: '64px', // Navbar height
                height: 'calc(100vh - 64px)',
              }
            : { transition: 'width 0.2s' }
        }
      >
        <nav className={`flex-1 bg-[#0c2556] backdrop-blur-md shadow-lg overflow-y-auto ${expanded ? 'px-3 py-6' : 'px-0 py-2'}`}>
          {menuConfig[role].map((section) => (
            <div key={section.title} className={`mb-4 ${!expanded ? 'flex flex-col items-center' : ''}`}>
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "flex items-center w-full text-xs font-semibold uppercase tracking-wider px-3 py-2 mb-1 rounded transition-colors duration-200",
                  openSections[section.title]
                    ? "bg-blue-800 text-white"
                    : "text-blue-200 hover:bg-blue-800/50 hover:text-white",
                  !expanded ? 'justify-center px-0' : 'justify-start text-left'
                )}
                aria-expanded={openSections[section.title]}
              >
                {section.sectionIcon}
                {expanded && (
                  <>
                    <span className="ml-2 text-left">{section.title}</span>
                    <span className="ml-auto">
                      {openSections[section.title] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </span>
                  </>
                )}
              </button>
              <ul
                className={cn(
                  "space-y-1 pl-2 transition-all duration-200",
                  !openSections[section.title] && "hidden",
                  !expanded ? 'pl-0 space-y-0' : '',
                  section.compact ? 'space-y-0.5' : ''
                )}
                role="menu"
              >
                {section.items.map((item) => (
                  item.subItems ? (
                    <li key={item.label} className={!expanded ? 'flex flex-col items-center' : ''}>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded text-sm font-semibold text-blue-200",
                        section.compact ? 'py-1.5' : '',
                        !expanded ? 'justify-center px-0' : 'justify-start text-left'
                      )}>
                        {item.icon}
                        {expanded && <span className="text-left">{item.label}</span>}
                      </div>
                      <ul className="pl-6 space-y-0.5">
                        {item.subItems.map((sub) => (
                          <li key={sub.href} className={!expanded ? 'flex justify-center' : ''}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  href={sub.href}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors duration-200",
                                    pathname === sub.href
                                      ? "bg-blue-500 text-white font-semibold"
                                      : "text-blue-100 hover:bg-blue-800/50 hover:text-white",
                                    !expanded ? 'justify-center px-0' : 'justify-start text-left',
                                    section.compact ? 'py-1.5' : ''
                                  )}
                                  role="menuitem"
                                >
                                  {sub.icon}
                                  {expanded && <span className="text-left">{sub.label}</span>}
                                </Link>
                              </TooltipTrigger>
                              {(!expanded || sub.description) && (
                                <TooltipContent side="right" className="max-w-xs">
                                  <div>
                                    <p className="font-medium">{sub.label}</p>
                                    {sub.description && <p className="text-xs text-muted-foreground">{sub.description}</p>}
                                  </div>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ) : (
                    <li key={item.href} className={!expanded ? 'flex justify-center' : ''}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors duration-200",
                              pathname === item.href
                                ? "bg-blue-500 text-white font-semibold"
                                : "text-blue-100 hover:bg-blue-800/50 hover:text-white",
                              !expanded ? 'justify-center px-0' : 'justify-start text-left',
                              section.compact ? 'py-1.5' : ''
                            )}
                            role="menuitem"
                          >
                            {item.icon}
                            {expanded && <span className="text-left">{item.label}</span>}
                          </Link>
                        </TooltipTrigger>
                        {(!expanded || item.description) && (
                          <TooltipContent side="right" className="max-w-xs">
                            <div>
                              <p className="font-medium">{item.label}</p>
                              {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </li>
                  )
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
export type { Role };
