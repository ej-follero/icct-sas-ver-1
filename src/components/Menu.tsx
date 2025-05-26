"use client";

import { role } from "@/lib/data";
import Link from "next/link";
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import NfcIcon from '@mui/icons-material/Nfc';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CampaignIcon from '@mui/icons-material/Campaign';
import SettingsIcon from '@mui/icons-material/Settings';
import ArchiveIcon from '@mui/icons-material/Archive';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MessageIcon from '@mui/icons-material/Message';
import AppsIcon from '@mui/icons-material/Apps';
import { Activity } from 'lucide-react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Box,
  Typography,
  useTheme,
  Paper
} from '@mui/material';
import Logo from "@/components/Logo";
import { usePathname } from 'next/navigation';

type MenuItem = {
  icon: JSX.Element;
  label: string;
  href: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type Role = 'admin' | 'teacher' | 'student' | 'parent';

// Base menu items shared across all roles
const baseMenuItems: MenuSection[] = [
  {
    title: "DASHBOARD",
    items: [
      {
        icon: <DashboardIcon style={{ fontSize: 22 }} />,
        label: "Overview",
        href: "/overview",
      },
    ],
  },
];

// Role-specific menu items
const roleSpecificItems: Record<Role, MenuSection[]> = {
  admin: [
    {
      title: "ATTENDANCE MANAGEMENT",
      items: [
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "Live Attendance Feed",
          href: "/list/live-attendance",
        },
        {
          icon: <AssessmentIcon style={{ fontSize: 22 }} />,
          label: "Student Attendance",
          href: "/list/attendance/students",
        },
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Instructor Attendance",
          href: "/list/attendance/instructors",
        },
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "Class Schedules",
          href: "/list/schedules",
        },
      ],
    },
    {
      title: "ACADEMIC MANAGEMENT",
      items: [
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "Departments",
          href: "/list/departments",
        },
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "Courses",
          href: "/list/courses",
        },
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "Subjects",
          href: "/list/subjects",
        },
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "Sections",
          href: "/list/sections",
        },
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "Rooms",
          href: "/list/rooms",
        },
      ],
    },
    {
      title: "USER MANAGEMENT",
      items: [
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Students",
          href: "/list/students",
        },
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Instructors",
          href: "/list/instructorsn",
        },
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Parents",
          href: "/list/parents",
        },
      ],
    },
    {
      title: "RFID MANAGEMENT",
      items: [
        {
          icon: <NfcIcon style={{ fontSize: 22 }} />,
          label: "RFID Readers",
          href: "/list/rfid/readers",
        },
        {
          icon: <NfcIcon style={{ fontSize: 22 }} />,
          label: "RFID Tags",
          href: "/list/rfid/tags",
        },
        {
          icon: <NfcIcon style={{ fontSize: 22 }} />,
          label: "Tag Assignments",
          href: "/list/rfid/assignments",
        },
        {
          icon: <NfcIcon style={{ fontSize: 22 }} />,
          label: "Reader Logs",
          href: "/list/rfid/logs",
        },
      ],
    },
    {
      title: "ANALYTICS & INSIGHTS",
      items: [
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Daily Summary",
          href: "/analytics/daily",
        },
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Late/Absent Reports",
          href: "/analytics/late-absent",
        },
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Attendance Trends",
          href: "/analytics/trends",
        },
      ],
    },
    {
      title: "REPORT GENERATION",
      items: [
        {
          icon: <AssessmentIcon style={{ fontSize: 22 }} />,
          label: "Student Attendance Report",
          href: "/reports/student-attendance",
        },
        {
          icon: <AssessmentIcon style={{ fontSize: 22 }} />,
          label: "Instructor Attendance Report",
          href: "/reports/instructor-attendance",
        },
        {
          icon: <AssessmentIcon style={{ fontSize: 22 }} />,
          label: "RFID Log Report",
          href: "/reports/rfid-logs",
        },
      ],
    },
    {
      title: "COMMUNICATION",
      items: [
        {
          icon: <CampaignIcon style={{ fontSize: 22 }} />,
          label: "Announcements",
          href: "/list/announcements",
        },
        {
          icon: <CampaignIcon style={{ fontSize: 22 }} />,
          label: "Events",
          href: "/list/events",
        },
        {
          icon: <CampaignIcon style={{ fontSize: 22 }} />,
          label: "Messages",
          href: "/list/messages",
        },
      ],
    },
    {
      title: "SYSTEM SETTINGS",
      items: [
        {
          icon: <SettingsIcon style={{ fontSize: 22 }} />,
          label: "Admin Users",
          href: "/settings/admin-users",
        },
        {
          icon: <SettingsIcon style={{ fontSize: 22 }} />,
          label: "Roles & Permissions",
          href: "/settings/roles",
        },
        {
          icon: <SettingsIcon style={{ fontSize: 22 }} />,
          label: "Audit Logs",
          href: "/settings/audit-logs",
        },
        {
          icon: <SettingsIcon style={{ fontSize: 22 }} />,
          label: "System Status",
          href: "/settings/system-status",
        },
        {
          icon: <SettingsIcon style={{ fontSize: 22 }} />,
          label: "Backup & Restore",
          href: "/settings/backup",
        },
      ],
    },
  ],
  teacher: [
    {
      title: "SCHEDULE",
      items: [
        {
          icon: <CalendarMonthIcon style={{ fontSize: 22 }} />,
          label: "My Schedule",
          href: "/list/schedule",
        },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "Record Attendance",
          href: "/list/attendance/record",
        },
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "My Attendance Log",
          href: "/list/attendance/log",
        },
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "Class Attendance Summary",
          href: "/list/attendance/summary",
        },
      ],
    },
    {
      title: "CLASS MANAGEMENT",
      items: [
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "My Classes",
          href: "/list/classes",
        },
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "My Subjects",
          href: "/list/subjects",
        },
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "Student List",
          href: "/list/students",
        },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "My Attendance Overview",
          href: "/list/analytics/overview",
        },
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Class Attendance Trends",
          href: "/list/analytics/trends",
        },
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Daily Summary",
          href: "/list/analytics/daily",
        },
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Top Absentees",
          href: "/list/analytics/absentees",
        },
      ],
    },
    {
      title: "REPORTS",
      items: [
        {
          icon: <AssessmentIcon style={{ fontSize: 22 }} />,
          label: "Generate Report",
          href: "/list/reports/generate",
        },
        {
          icon: <AssessmentIcon style={{ fontSize: 22 }} />,
          label: "View Reports",
          href: "/list/reports/view",
        },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        {
          icon: <CampaignIcon style={{ fontSize: 22 }} />,
          label: "View Announcements",
          href: "/list/announcements",
        },
        {
          icon: <CampaignIcon style={{ fontSize: 22 }} />,
          label: "Post Announcement",
          href: "/list/announcements/post",
        },
      ],
    },
    {
      title: "MESSAGES",
      items: [
        {
          icon: <MessageIcon style={{ fontSize: 22 }} />,
          label: "Inbox",
          href: "/list/messages/inbox",
        },
        {
          icon: <MessageIcon style={{ fontSize: 22 }} />,
          label: "Contact Students",
          href: "/list/messages/contact",
        },
      ],
    },
    {
      title: "PROFILE",
      items: [
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "View Profile",
          href: "/profile",
        },
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Edit Info",
          href: "/profile/edit",
        },
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Change Password",
          href: "/profile/password",
        },
      ],
    },
    {
      title: "LOGOUT",
      items: [
        {
          icon: <LogoutIcon style={{ fontSize: 22 }} />,
          label: "Logout",
          href: "/logout",
        },
      ],
    },
  ],
  student: [
    {
      title: "SCHEDULE",
      items: [
        {
          icon: <CalendarMonthIcon style={{ fontSize: 22 }} />,
          label: "Weekly Timetable",
          href: "/list/schedule",
        },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "Attendance Records",
          href: "/list/attendance/records",
        },
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "Absences & Late Logs",
          href: "/list/attendance/logs",
        },
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "RFID Scan History",
          href: "/list/attendance/rfid-history",
        },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "My Attendance Overview",
          href: "/list/analytics/overview",
        },
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Attendance Trends",
          href: "/list/analytics/trends",
        },
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Daily Summary",
          href: "/list/analytics/daily",
        },
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Performance Insights",
          href: "/list/analytics/performance",
        },
      ],
    },
    {
      title: "ACADEMICS",
      items: [
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "Subjects",
          href: "/list/subjects",
        },
        {
          icon: <SchoolIcon style={{ fontSize: 22 }} />,
          label: "Class Info",
          href: "/list/class-info",
        },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        {
          icon: <CampaignIcon style={{ fontSize: 22 }} />,
          label: "School Events",
          href: "/list/announcements/events",
        },
        {
          icon: <CampaignIcon style={{ fontSize: 22 }} />,
          label: "Class Updates",
          href: "/list/announcements/updates",
        },
      ],
    },
    {
      title: "MESSAGES",
      items: [
        {
          icon: <MessageIcon style={{ fontSize: 22 }} />,
          label: "Inbox",
          href: "/list/messages/inbox",
        },
        {
          icon: <MessageIcon style={{ fontSize: 22 }} />,
          label: "Contact Instructor",
          href: "/list/messages/contact",
        },
      ],
    },
    {
      title: "PROFILE",
      items: [
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "View Profile",
          href: "/profile",
        },
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Edit Info",
          href: "/profile/edit",
        },
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Change Password",
          href: "/profile/password",
        },
      ],
    },
    {
      title: "LOGOUT",
      items: [
        {
          icon: <LogoutIcon style={{ fontSize: 22 }} />,
          label: "Logout",
          href: "/logout",
        },
      ],
    },
  ],
  parent: [
    {
      title: "SCHEDULE",
      items: [
        {
          icon: <CalendarMonthIcon style={{ fontSize: 22 }} />,
          label: "Class Schedule",
          href: "/list/schedule",
        },
      ],
    },
    {
      title: "ATTENDANCE",
      items: [
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "My Child's Daily Attendance",
          href: "/list/attendance/daily",
        },
        {
          icon: <AccessTimeIcon style={{ fontSize: 22 }} />,
          label: "Absences & Late Records",
          href: "/list/attendance/records",
        },
      ],
    },
    {
      title: "ANALYTICS",
      items: [
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Attendance Summary",
          href: "/list/analytics/summary",
        },
        {
          icon: <AnalyticsIcon style={{ fontSize: 22 }} />,
          label: "Attendance Trends",
          href: "/list/analytics/trends",
        },
      ],
    },
    {
      title: "ANNOUNCEMENTS",
      items: [
        {
          icon: <CampaignIcon style={{ fontSize: 22 }} />,
          label: "View Announcements",
          href: "/list/announcements",
        },
      ],
    },
    {
      title: "MESSAGES",
      items: [
        {
          icon: <MessageIcon style={{ fontSize: 22 }} />,
          label: "Inbox",
          href: "/list/messages/inbox",
        },
      ],
    },
    {
      title: "PROFILE",
      items: [
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "View Profile",
          href: "/profile",
        },
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Settings",
          href: "/profile/settings",
        },
        {
          icon: <PersonIcon style={{ fontSize: 22 }} />,
          label: "Change Password",
          href: "/profile/password",
        },
      ],
    },
    {
      title: "LOGOUT",
      items: [
        {
          icon: <LogoutIcon style={{ fontSize: 22 }} />,
          label: "Logout",
          href: "/logout",
        },
      ],
    },
  ],
};

const HEADER_HEIGHT = 64;

interface MenuProps {
  variant?: 'sidebar' | 'drawer';
  onNavigate?: () => void; // Optional callback for closing drawer on navigation
}

const Menu = ({ variant = 'sidebar', onNavigate }: MenuProps) => {
  const theme = useTheme();
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'DASHBOARD': true,
  });

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  // Get menu items based on role
  const menuItems = [...baseMenuItems, ...(roleSpecificItems[role as Role] || [])];

  return (
    <Paper elevation={0} sx={{
      position: variant === 'sidebar' ? 'fixed' : 'relative',
      top: variant === 'sidebar' ? HEADER_HEIGHT : 0,
      left: 0,
      width: 260,
      height: variant === 'sidebar' ? `calc(100vh - ${HEADER_HEIGHT}px)` : '100%',
      bgcolor: '#012970',
      borderRadius: 0,
      p: 0,
      zIndex: 1100,
      boxShadow: variant === 'drawer' ? 3 : 0,
    }}>
      <List
        component="nav"
        disablePadding
        sx={{
          p: 2,
          maxHeight: '100%',
          overflowY: 'auto',
          // Custom scrollbar
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
        }}
      >
        {menuItems.map((section, idx) => (
          <Box key={section.title} sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => toggleSection(section.title)}
              aria-expanded={expandedSections[section.title]}
              aria-controls={`section-${section.title}`}
              aria-label={`Toggle ${section.title} section`}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: expandedSections[section.title] ? 'rgba(255,255,255,0.08)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                px: 2,
                py: 1.2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                outline: 'none',
                '&.Mui-focusVisible': {
                  boxShadow: '0 0 0 2px #90caf9',
                  bgcolor: 'rgba(255,255,255,0.16)',
                },
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'white', letterSpacing: 1 }}>
                {section.title}
              </Typography>
              {expandedSections[section.title] ? (
                <ExpandLessIcon fontSize="small" sx={{ color: 'white' }} />
              ) : (
                <ExpandMoreIcon fontSize="small" sx={{ color: 'white' }} />
              )}
            </ListItemButton>
            <Collapse in={expandedSections[section.title]} timeout="auto" unmountOnExit>
              <List disablePadding id={`section-${section.title}`}>
                {section.items.map((item, itemIdx) => {
                  const isActive = pathname === item.href;
                  return (
                    <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        component={Link}
                        href={item.href}
                        onClick={onNavigate}
                        sx={{
                          borderRadius: 2,
                          px: 2.5,
                          py: 1.1,
                          color: 'white',
                          gap: 1.5,
                          bgcolor: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                          fontWeight: isActive ? 700 : 500,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.16)', color: '#90caf9' },
                          '&.Mui-focusVisible': {
                            boxShadow: '0 0 0 2px #90caf9',
                            bgcolor: 'rgba(255,255,255,0.16)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32, color: 'white' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 15, fontWeight: isActive ? 700 : 500, color: 'white' }} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </Collapse>
            {idx < menuItems.length - 1 && <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.12)' }} />}
          </Box>
        ))}
      </List>
    </Paper>
  );
};

export default Menu;
