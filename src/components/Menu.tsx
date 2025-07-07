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
  MessageCircle,
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
} from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn classnames utility

type MenuItem = {
  icon: JSX.Element;
  label: string;
  href: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type Role = "admin" | "teacher" | "student" | "parent";

type MenuConfig = Record<Role, MenuSection[]>;

// --- FULL MENU CONFIG ---
const menuConfig: MenuConfig = {
  admin: [
    {
      title: "DASHBOARD",
      items: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" },
      ],
    },
    {
      title: "ATTENDANCE MANAGEMENT",
      items: [
        { icon: <Users className="w-5 h-5" />, label: "Student Attendance", href: "/list/attendance/students" },
        { icon: <UserCheck className="w-5 h-5" />, label: "Instructor Attendance", href: "/list/attendance/instructors" },
        { icon: <Activity className="w-5 h-5" />, label: "Live Attendance Feed", href: "/list/live-attendance" },
      ],
    },
    {
      title: "ACADEMIC MANAGEMENT",
      items: [
        { icon: <School className="w-5 h-5" />, label: "Departments", href: "/list/departments" },
        { icon: <BookOpen className="w-5 h-5" />, label: "Courses", href: "/list/courses" },
        { icon: <Book className="w-5 h-5" />, label: "Subjects", href: "/list/subjects" },
        { icon: <Users className="w-5 h-5" />, label: "Sections", href: "/list/sections" },
        { icon: <DoorOpen className="w-5 h-5" />, label: "Rooms", href: "/list/rooms" },
        { icon: <CalendarRange className="w-5 h-5" />, label: "Class Schedules", href: "/list/schedules" },
        { icon: <Calendar className="w-5 h-5" />, label: "Academic Calendar", href: "/list/academic-calendar" },
      ],
    },
    {
      title: "USER MANAGEMENT",
      items: [
        { icon: <Users className="w-5 h-5" />, label: "Students", href: "/list/students" },
        { icon: <UserCheck className="w-5 h-5" />, label: "Instructors", href: "/list/instructors" },
        { icon: <UserCircle className="w-5 h-5" />, label: "Parents", href: "/list/parents" },
        { icon: <Shield className="w-5 h-5" />, label: "Student User Accounts", href: "/list/user-management/students" },
      ],
    },
    {
      title: "RFID MANAGEMENT",
      items: [
        { icon: <Activity className="w-5 h-5" />, label: "RFID Dashboard", href: "/list/rfid/dashboard" },
        { icon: <ScanLine className="w-5 h-5" />, label: "Readers", href: "/list/rfid/readers" },
        { icon: <CreditCard className="w-5 h-5" />, label: "Tags", href: "/list/rfid/tags" },
        { icon: <FileText className="w-5 h-5" />, label: "Access Logs", href: "/list/rfid/logs" },
        { icon: <Settings className="w-5 h-5" />, label: "Configuration", href: "/list/rfid/config" },
      ],
    },
    {
      title: "ANALYTICS & REPORTS",
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "Dashboard", href: "/analytics/dashboard" },
        { icon: <TrendingUp className="w-5 h-5" />, label: "Attendance Trends", href: "/analytics/trends" },
        { icon: <Users className="w-5 h-5" />, label: "Student Performance", href: "/analytics/student-performance" },
        { icon: <School className="w-5 h-5" />, label: "Department Analytics", href: "/analytics/department" },
        { icon: <Activity className="w-5 h-5" />, label: "RFID Insights", href: "/analytics/rfid" },
        { icon: <FileText className="w-5 h-5" />, label: "Report Hub", href: "/reports" },
        { icon: <Download className="w-5 h-5" />, label: "Export Data", href: "/reports/export" },
        { icon: <FileText className="w-5 h-5" />, label: "System Logs", href: "/reports/system-logs" },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        { icon: <MessageCircle className="w-5 h-5" />, label: "Communication Hub", href: "/list/communication" },
        { icon: <Megaphone className="w-5 h-5" />, label: "Announcements", href: "/list/announcements" },
        { icon: <Calendar className="w-5 h-5" />, label: "Events", href: "/list/events" },
        { icon: <Mail className="w-5 h-5" />, label: "Email Management", href: "/list/communication?tab=email" },
        { icon: <FileText className="w-5 h-5" />, label: "Communication Logs", href: "/list/communication?tab=logs" },
      ],
    },
    {
      title: "SYSTEM SETTINGS",
      items: [
        { icon: <Users className="w-5 h-5" />, label: "Admin Users", href: "/settings/admin-users" },
        { icon: <Shield className="w-5 h-5" />, label: "Roles & Permissions", href: "/settings/roles" },
        { icon: <Shield className="w-5 h-5" />, label: "Security", href: "/settings/security" },
        { icon: <Activity className="w-5 h-5" />, label: "System Status", href: "/settings/system-status" },
        { icon: <FileText className="w-5 h-5" />, label: "Audit Logs", href: "/settings/audit-logs" },
        { icon: <Database className="w-5 h-5" />, label: "Backup & Restore", href: "/settings/backup" },
        { icon: <Settings className="w-5 h-5" />, label: "General", href: "/settings/general" },
        { icon: <Zap className="w-5 h-5" />, label: "Integrations", href: "/settings/integrations" },
        { icon: <Palette className="w-5 h-5" />, label: "Theme/Appearance", href: "/settings/theme" },
        { icon: <Bell className="w-5 h-5" />, label: "Notifications", href: "/settings/notifications" },
      ],
    },
    {
      title: "LOGOUT",
      items: [
        { icon: <LogOut className="w-5 h-5" />, label: "Logout", href: "/logout" },
      ],
    },
  ],

  teacher: [
    {
      title: "SCHEDULE",
      items: [
        { icon: <Calendar className="w-5 h-5" />, label: "My Schedule", href: "/list/schedule" },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        { icon: <Clock className="w-5 h-5" />, label: "Record Attendance", href: "/list/attendance/record" },
        { icon: <Clock className="w-5 h-5" />, label: "My Attendance Log", href: "/list/attendance/log" },
        { icon: <Clock className="w-5 h-5" />, label: "Class Attendance Summary", href: "/list/attendance/summary" },
      ],
    },
    {
      title: "CLASS MANAGEMENT",
      items: [
        { icon: <School className="w-5 h-5" />, label: "My Classes", href: "/list/classes" },
        { icon: <School className="w-5 h-5" />, label: "My Subjects", href: "/list/subjects" },
        { icon: <School className="w-5 h-5" />, label: "Student List", href: "/list/students" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "My Analytics", href: "/teacher/analytics" },
        { icon: <TrendingUp className="w-5 h-5" />, label: "Class Trends", href: "/teacher/class-trends" },
        { icon: <Users className="w-5 h-5" />, label: "Student Insights", href: "/teacher/student-insights" },
        { icon: <Target className="w-5 h-5" />, label: "Performance Metrics", href: "/teacher/performance" },
      ],
    },
    {
      title: "REPORTS",
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "My Reports", href: "/teacher/reports" },
        { icon: <FileText className="w-5 h-5" />, label: "Class Reports", href: "/teacher/class-reports" },
        { icon: <Download className="w-5 h-5" />, label: "Export Data", href: "/teacher/export" },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        { icon: <Megaphone className="w-5 h-5" />, label: "View Announcements", href: "/list/announcements" },
        { icon: <Megaphone className="w-5 h-5" />, label: "Post Announcement", href: "/list/announcements/post" },
      ],
    },
    {
      title: "MESSAGES",
      items: [
        { icon: <MessageCircle className="w-5 h-5" />, label: "Inbox", href: "/list/messages/inbox" },
        { icon: <MessageCircle className="w-5 h-5" />, label: "Contact Students", href: "/list/messages/contact" },
      ],
    },
    {
      title: "PROFILE",
      items: [
        { icon: <User className="w-5 h-5" />, label: "View Profile", href: "/profile" },
        { icon: <User className="w-5 h-5" />, label: "Edit Info", href: "/profile/edit" },
        { icon: <User className="w-5 h-5" />, label: "Change Password", href: "/profile/password" },
      ],
    },
    {
      title: "LOGOUT",
      items: [
        { icon: <LogOut className="w-5 h-5" />, label: "Logout", href: "/logout" },
      ],
    },
  ],

  student: [
    {
      title: "SCHEDULE",
      items: [
        { icon: <Calendar className="w-5 h-5" />, label: "Weekly Timetable", href: "/list/schedule" },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        { icon: <Clock className="w-5 h-5" />, label: "Attendance Records", href: "/list/attendance/records" },
        { icon: <Clock className="w-5 h-5" />, label: "Absences & Late Logs", href: "/list/attendance/logs" },
        { icon: <ScanLine className="w-5 h-5" />, label: "RFID Scan History", href: "/list/attendance/rfid-history" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { icon: <BarChart3 className="w-5 h-5" />, label: "My Analytics", href: "/student/analytics" },
        { icon: <TrendingUp className="w-5 h-5" />, label: "Attendance Trends", href: "/student/trends" },
        { icon: <Target className="w-5 h-5" />, label: "Performance Insights", href: "/student/performance" },
        { icon: <Activity className="w-5 h-5" />, label: "RFID Activity", href: "/student/rfid-activity" },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        { icon: <School className="w-5 h-5" />, label: "Subjects", href: "/list/subjects" },
        { icon: <School className="w-5 h-5" />, label: "Class Info", href: "/list/class-info" },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        { icon: <Megaphone className="w-5 h-5" />, label: "School Events", href: "/list/announcements/events" },
        { icon: <Megaphone className="w-5 h-5" />, label: "Class Updates", href: "/list/announcements/updates" },
      ],
    },
    {
      title: "MESSAGES",
      items: [
        { icon: <MessageCircle className="w-5 h-5" />, label: "Inbox", href: "/list/messages/inbox" },
        { icon: <MessageCircle className="w-5 h-5" />, label: "Contact Instructor", href: "/list/messages/contact" },
      ],
    },
    {
      title: "PROFILE",
      items: [
        { icon: <User className="w-5 h-5" />, label: "View Profile", href: "/profile" },
        { icon: <User className="w-5 h-5" />, label: "Edit Info", href: "/profile/edit" },
        { icon: <User className="w-5 h-5" />, label: "Change Password", href: "/profile/password" },
      ],
    },
    {
      title: "LOGOUT",
      items: [
        { icon: <LogOut className="w-5 h-5" />, label: "Logout", href: "/logout" },
      ],
    },
  ],

  parent: [
    {
      title: "SCHEDULE",
      items: [
        { icon: <Calendar className="w-5 h-5" />, label: "Class Schedule", href: "/list/schedule" },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        { icon: <Clock className="w-5 h-5" />, label: "My Child's Daily Attendance", href: "/list/attendance/daily" },
        { icon: <Clock className="w-5 h-5" />, label: "Absences & Late Records", href: "/list/attendance/records" },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        { icon: <BarChart2 className="w-5 h-5" />, label: "Attendance Summary", href: "/list/analytics/summary" },
        { icon: <BarChart2 className="w-5 h-5" />, label: "Attendance Trends", href: "/list/analytics/trends" },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        { icon: <Megaphone className="w-5 h-5" />, label: "School Events", href: "/list/announcements/events" },
        { icon: <Megaphone className="w-5 h-5" />, label: "Class Updates", href: "/list/announcements/updates" },
      ],
    },
    {
      title: "MESSAGES",
      items: [
        { icon: <MessageCircle className="w-5 h-5" />, label: "Inbox", href: "/list/messages/inbox" },
        { icon: <MessageCircle className="w-5 h-5" />, label: "Contact Teacher", href: "/list/messages/contact" },
      ],
    },
    {
      title: "PROFILE",
      items: [
        { icon: <User className="w-5 h-5" />, label: "View Profile", href: "/profile" },
        { icon: <User className="w-5 h-5" />, label: "Edit Info", href: "/profile/edit" },
        { icon: <User className="w-5 h-5" />, label: "Change Password", href: "/profile/password" },
      ],
    },
    {
      title: "LOGOUT",
      items: [
        { icon: <LogOut className="w-5 h-5" />, label: "Logout", href: "/logout" },
      ],
    },
  ],
};
// --- END FULL MENU CONFIG ---

export default function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    // Initialize sections based on current path
    const initial: Record<string, boolean> = {};
    menuConfig[role].forEach((section) => {
      initial[section.title] = section.items.some((item) => pathname.startsWith(item.href));
    });
    return initial;
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r flex flex-col">
      <div className="h-16 flex items-center justify-center border-b bg-[#0c2556]">
        <Logo />
      </div>
      <nav className="flex-1 bg-[#0c2556] backdrop-blur-md shadow-lg overflow-y-auto px-3 py-6">
        {menuConfig[role].map((section) => (
          <div key={section.title} className="mb-4">
            <button
              type="button"
              onClick={() => toggleSection(section.title)}
              className={cn(
                "flex items-center w-full text-xs font-semibold uppercase tracking-wider px-3 py-2 mb-1 rounded transition-colors duration-200",
                openSections[section.title]
                  ? "bg-blue-800 text-white"
                  : "text-blue-200 hover:bg-blue-800/50 hover:text-white"
              )}
              aria-expanded={openSections[section.title]}
            >
              {section.title}
              <span className="ml-auto">
                {openSections[section.title] ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>
            <ul 
              className={cn(
                "space-y-1 pl-2 transition-all duration-200",
                !openSections[section.title] && "hidden"
              )}
              role="menu"
            >
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                      pathname === item.href
                        ? "bg-blue-700 text-white font-semibold"
                        : "text-blue-100 hover:bg-blue-800/50 hover:text-white"
                    )}
                    role="menuitem"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
export type { Role };