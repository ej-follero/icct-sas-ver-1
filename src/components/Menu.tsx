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

// --- FULL MENU CONFIG ---
const menuConfig: Record<Role, MenuSection[]> = {
  admin: [
    {
      title: "DASHBOARD",
      items: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: "Overview", href: "/overview" },
      ],
    },
    {
      title: "ATTENDANCE MANAGEMENT",
      items: [
        { icon: <Clock className="w-5 h-5" />, label: "Live Attendance Feed", href: "/list/live-attendance" },
        { icon: <AppWindow className="w-5 h-5" />, label: "Student Attendance", href: "/list/attendance/students" },
        { icon: <User className="w-5 h-5" />, label: "Instructor Attendance", href: "/list/attendance/instructors" },
        { icon: <Clock className="w-5 h-5" />, label: "Class Schedules", href: "/list/schedules" },
      ],
    },
    {
      title: "ACADEMIC MANAGEMENT",
      items: [
        { icon: <School className="w-5 h-5" />, label: "Departments", href: "/list/departments" },
        { icon: <School className="w-5 h-5" />, label: "Courses", href: "/list/courses" },
        { icon: <School className="w-5 h-5" />, label: "Subjects", href: "/list/subjects" },
        { icon: <School className="w-5 h-5" />, label: "Sections", href: "/list/sections" },
        { icon: <School className="w-5 h-5" />, label: "Rooms", href: "/list/rooms" },
      ],
    },
    {
      title: "USER MANAGEMENT",
      items: [
        { icon: <User className="w-5 h-5" />, label: "Students", href: "/list/students" },
        { icon: <User className="w-5 h-5" />, label: "Instructors", href: "/list/instructorsn" },
        { icon: <User className="w-5 h-5" />, label: "Parents", href: "/list/parents" },
      ],
    },
    {
      title: "RFID MANAGEMENT",
      items: [
        { icon: <ScanLine className="w-5 h-5" />, label: "RFID Readers", href: "/list/rfid/readers" },
        { icon: <ScanLine className="w-5 h-5" />, label: "RFID Tags", href: "/list/rfid/tags" },
        { icon: <ScanLine className="w-5 h-5" />, label: "Tag Assignments", href: "/list/rfid/assignments" },
        { icon: <ScanLine className="w-5 h-5" />, label: "Reader Logs", href: "/list/rfid/logs" },
      ],
    },
    {
      title: "ANALYTICS & INSIGHTS",
      items: [
        { icon: <BarChart2 className="w-5 h-5" />, label: "Daily Summary", href: "/analytics/daily" },
        { icon: <BarChart2 className="w-5 h-5" />, label: "Late/Absent Reports", href: "/analytics/late-absent" },
        { icon: <BarChart2 className="w-5 h-5" />, label: "Attendance Trends", href: "/analytics/trends" },
      ],
    },
    {
      title: "REPORT GENERATION",
      items: [
        { icon: <FileBarChart2 className="w-5 h-5" />, label: "Student Attendance Report", href: "/reports/student-attendance" },
        { icon: <FileBarChart2 className="w-5 h-5" />, label: "Instructor Attendance Report", href: "/reports/instructor-attendance" },
        { icon: <FileBarChart2 className="w-5 h-5" />, label: "RFID Log Report", href: "/reports/rfid-logs" },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        { icon: <Megaphone className="w-5 h-5" />, label: "Announcements", href: "/list/announcements" },
        { icon: <Megaphone className="w-5 h-5" />, label: "Events", href: "/list/events" },
        { icon: <MessageCircle className="w-5 h-5" />, label: "Messages", href: "/list/messages" },
      ],
    },
    {
      title: "SYSTEM SETTINGS",
      items: [
        { icon: <Settings className="w-5 h-5" />, label: "Admin Users", href: "/settings/admin-users" },
        { icon: <Settings className="w-5 h-5" />, label: "Roles & Permissions", href: "/settings/roles" },
        { icon: <Settings className="w-5 h-5" />, label: "Audit Logs", href: "/settings/audit-logs" },
        { icon: <Settings className="w-5 h-5" />, label: "System Status", href: "/settings/system-status" },
        { icon: <Settings className="w-5 h-5" />, label: "Backup & Restore", href: "/settings/backup" },
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
        { icon: <BarChart2 className="w-5 h-5" />, label: "My Attendance Overview", href: "/list/analytics/overview" },
        { icon: <BarChart2 className="w-5 h-5" />, label: "Class Attendance Trends", href: "/list/analytics/trends" },
        { icon: <BarChart2 className="w-5 h-5" />, label: "Daily Summary", href: "/list/analytics/daily" },
        { icon: <BarChart2 className="w-5 h-5" />, label: "Top Absentees", href: "/list/analytics/absentees" },
      ],
    },
    {
      title: "REPORTS",
      items: [
        { icon: <FileBarChart2 className="w-5 h-5" />, label: "Generate Report", href: "/list/reports/generate" },
        { icon: <FileBarChart2 className="w-5 h-5" />, label: "View Reports", href: "/list/reports/view" },
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
        { icon: <BarChart2 className="w-5 h-5" />, label: "My Attendance Overview", href: "/list/analytics/overview" },
        { icon: <BarChart2 className="w-5 h-5" />, label: "Attendance Trends", href: "/list/analytics/trends" },
        { icon: <BarChart2 className="w-5 h-5" />, label: "Daily Summary", href: "/list/analytics/daily" },
        { icon: <BarChart2 className="w-5 h-5" />, label: "Performance Insights", href: "/list/analytics/performance" },
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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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
                "flex items-center w-full text-xs font-semibold uppercase tracking-wider px-3 py-2 mb-1 rounded transition",
                openSections[section.title]
                  ? "bg-blue-800 text-white"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              )}
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
            <ul className={cn("space-y-1 pl-2", !openSections[section.title] && "hidden")}>
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition",
                      pathname === item.href
                        ? "text-white font-bold"
                        : "text-blue-100 hover:bg-blue-800 hover:text-white"
                    )}
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