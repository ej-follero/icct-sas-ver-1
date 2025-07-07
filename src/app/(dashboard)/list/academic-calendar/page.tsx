"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  Users, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Search,
  Bell,
  Settings,
  FileText,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Copy,
  Share2,
  Archive,
  RefreshCw,
  BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import AttendanceHeader from '../../../../components/AttendanceHeader';

// Types
interface AcademicEvent {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  category: 'academic' | 'administrative' | 'holiday' | 'special' | 'deadline';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  attendees?: string[];
  isRecurring: boolean;
  recurrencePattern?: string;
  status: 'draft' | 'published' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  color: string;
  tags: string[];
}

interface AcademicYear {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  semesters: Semester[];
}

interface Semester {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  type: '1st' | '2nd' | 'Summer';
  isActive: boolean;
}

const EVENT_CATEGORIES = {
  academic: { label: 'Academic', color: 'bg-blue-500', textColor: 'text-blue-500' },
  administrative: { label: 'Administrative', color: 'bg-orange-500', textColor: 'text-orange-500' },
  holiday: { label: 'Holiday', color: 'bg-red-500', textColor: 'text-red-500' },
  special: { label: 'Special Event', color: 'bg-purple-500', textColor: 'text-purple-500' },
  deadline: { label: 'Deadline', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
};

const PRIORITY_LEVELS = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-800' },
};

export default function AcademicCalendarPage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list' | 'timeline'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    status: 'all',
    dateRange: 'all',
  });
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockAcademicYears: AcademicYear[] = [
      {
        id: 1,
        name: "2024-2025",
        startDate: new Date(2024, 5, 1), // June 1, 2024
        endDate: new Date(2025, 4, 31), // May 31, 2025
        isActive: true,
        semesters: [
          {
            id: 1,
            name: "1st Semester",
            startDate: new Date(2024, 7, 1), // August 1, 2024
            endDate: new Date(2024, 11, 20), // December 20, 2024
            type: '1st',
            isActive: true,
          },
          {
            id: 2,
            name: "2nd Semester",
            startDate: new Date(2025, 0, 15), // January 15, 2025
            endDate: new Date(2025, 4, 15), // May 15, 2025
            type: '2nd',
            isActive: false,
          },
          {
            id: 3,
            name: "Summer",
            startDate: new Date(2025, 4, 20), // May 20, 2025
            endDate: new Date(2025, 6, 15), // July 15, 2025
            type: 'Summer',
            isActive: false,
          },
        ],
      },
    ];

    const mockEvents: AcademicEvent[] = [
      {
        id: 1,
        title: "Enrollment Period - 1st Semester",
        description: "Regular enrollment for incoming and continuing students",
        startDate: new Date(2024, 6, 15), // July 15, 2024
        endDate: new Date(2024, 7, 30), // August 30, 2024
        allDay: true,
        category: 'academic',
        priority: 'high',
        location: "Registrar's Office",
        isRecurring: true,
        recurrencePattern: "yearly",
        status: 'published',
        createdBy: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        requiresApproval: false,
        color: "#3B82F6",
        tags: ["enrollment", "registration"],
      },
      {
        id: 2,
        title: "Classes Begin - 1st Semester",
        description: "First day of classes for 1st Semester",
        startDate: new Date(2024, 7, 1), // August 1, 2024
        endDate: new Date(2024, 7, 1), // August 1, 2024
        allDay: true,
        category: 'academic',
        priority: 'critical',
        isRecurring: true,
        recurrencePattern: "yearly",
        status: 'published',
        createdBy: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        requiresApproval: false,
        color: "#3B82F6",
        tags: ["classes", "semester-start"],
      },
      {
        id: 3,
        title: "Midterm Examinations",
        description: "Midterm examination period for all courses",
        startDate: new Date(2024, 9, 15), // October 15, 2024
        endDate: new Date(2024, 9, 25), // October 25, 2024
        allDay: true,
        category: 'academic',
        priority: 'high',
        isRecurring: true,
        recurrencePattern: "yearly",
        status: 'published',
        createdBy: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        requiresApproval: false,
        color: "#3B82F6",
        tags: ["examinations", "midterm"],
      },
      {
        id: 4,
        title: "Christmas Break",
        description: "Christmas and New Year holiday break",
        startDate: new Date(2024, 11, 20), // December 20, 2024
        endDate: new Date(2025, 0, 5), // January 5, 2025
        allDay: true,
        category: 'holiday',
        priority: 'medium',
        isRecurring: true,
        recurrencePattern: "yearly",
        status: 'published',
        createdBy: "Admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        requiresApproval: false,
        color: "#EF4444",
        tags: ["holiday", "break"],
      },
      {
        id: 5,
        title: "Faculty Meeting",
        description: "Monthly faculty meeting to discuss academic matters",
        startDate: new Date(2024, 7, 15, 14, 0), // August 15, 2024 2:00 PM
        endDate: new Date(2024, 7, 15, 16, 0), // August 15, 2024 4:00 PM
        allDay: false,
        category: 'administrative',
        priority: 'medium',
        location: "Conference Room A",
        attendees: ["All Faculty"],
        isRecurring: true,
        recurrencePattern: "monthly",
        status: 'published',
        createdBy: "Dean",
        createdAt: new Date(),
        updatedAt: new Date(),
        requiresApproval: true,
        approvedBy: "Admin",
        approvedAt: new Date(),
        color: "#F97316",
        tags: ["faculty", "meeting"],
      },
      {
        id: 6,
        title: "Payment Deadline",
        description: "Deadline for tuition fee payment",
        startDate: new Date(2024, 7, 31), // August 31, 2024
        endDate: new Date(2024, 7, 31), // August 31, 2024
        allDay: true,
        category: 'deadline',
        priority: 'critical',
        isRecurring: true,
        recurrencePattern: "yearly",
        status: 'published',
        createdBy: "Finance Office",
        createdAt: new Date(),
        updatedAt: new Date(),
        requiresApproval: false,
        color: "#EAB308",
        tags: ["payment", "deadline"],
      },
    ];

    setAcademicYears(mockAcademicYears);
    setSelectedYear(mockAcademicYears[0]);
    setSelectedSemester(mockAcademicYears[0].semesters[0]);
    setEvents(mockEvents);
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
                         event.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filters.category === 'all' || event.category === filters.category;
    const matchesPriority = filters.priority === 'all' || event.priority === filters.priority;
    const matchesStatus = filters.status === 'all' || event.status === filters.status;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  const handleAddEvent = () => {
    setShowAddEvent(true);
  };

  const handleImportEvents = () => {
    setShowImportDialog(true);
  };

  const handleExportEvents = () => {
    setShowExportDialog(true);
  };

  const handleDeleteEvents = () => {
    if (selectedEvents.length === 0) {
      toast.error("Please select events to delete");
      return;
    }
    
    setEvents(events.filter(event => !selectedEvents.includes(event.id)));
    setSelectedEvents([]);
    toast.success(`${selectedEvents.length} event(s) deleted successfully`);
  };

  const handleBulkAction = (action: string) => {
    if (selectedEvents.length === 0) {
      toast.error("Please select events first");
      return;
    }

    switch (action) {
      case 'publish':
        setEvents(events.map(event => 
          selectedEvents.includes(event.id) 
            ? { ...event, status: 'published' as const }
            : event
        ));
        toast.success(`${selectedEvents.length} event(s) published`);
        break;
      case 'archive':
        setEvents(events.map(event => 
          selectedEvents.includes(event.id) 
            ? { ...event, status: 'cancelled' as const }
            : event
        ));
        toast.success(`${selectedEvents.length} event(s) archived`);
        break;
      default:
        break;
    }
    setSelectedEvents([]);
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return filteredEvents
      .filter(event => event.startDate >= today && event.startDate <= nextWeek)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 5);
  };

  const getEventStats = () => {
    const total = events.length;
    const published = events.filter(e => e.status === 'published').length;
    const pending = events.filter(e => e.status === 'draft').length;
    const critical = events.filter(e => e.priority === 'critical').length;
    
    return { total, published, pending, critical };
  };

  const stats = getEventStats();
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      <AttendanceHeader
        title="Academic Calendar"
        subtitle="Manage academic events, deadlines, and important dates"
        currentSection="Academic Calendar"
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-full">
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Academic Calendar</h1>
            <p className="text-gray-600">Manage academic events, deadlines, and important dates</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={handleImportEvents}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportEvents}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddEvent}>
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Academic Year & Semester Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Academic Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Select 
                value={selectedYear?.id.toString()} 
                onValueChange={(value) => {
                  const year = academicYears.find(y => y.id.toString() === value);
                  setSelectedYear(year || null);
                  setSelectedSemester(year?.semesters[0] || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map(year => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name} {year.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select 
                value={selectedSemester?.id.toString()} 
                onValueChange={(value) => {
                  const semester = selectedYear?.semesters.find(s => s.id.toString() === value);
                  setSelectedSemester(semester || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {selectedYear?.semesters.map(semester => (
                    <SelectItem key={semester.id} value={semester.id.toString()}>
                      {semester.name} {semester.isActive && "(Active)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All events
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
            <p className="text-xs text-muted-foreground">
              Active events
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Draft events
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">
              High priority
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {Object.entries(EVENT_CATEGORIES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="semester">This semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Upcoming Events */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-500">
                            {event.startDate.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge 
                          className={`text-xs ${EVENT_CATEGORIES[event.category].textColor} bg-opacity-10`}
                        >
                          {EVENT_CATEGORIES[event.category].label}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Bell className="w-4 h-4 mr-2" />
                  Set Reminders
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Calendar
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sync Calendar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Calendar Area */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                    <TabsList>
                      <TabsTrigger value="month" className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Month
                      </TabsTrigger>
                      <TabsTrigger value="week" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Week
                      </TabsTrigger>
                      <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="w-4 h-4" />
                        List
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" />
                        Timeline
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    Today
                  </Button>
                  <Button variant="outline" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Bulk Actions */}
              {selectedEvents.length > 0 && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{selectedEvents.length} event(s) selected</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleBulkAction('publish')}>
                          Publish
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleBulkAction('archive')}>
                          Archive
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDeleteEvents}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Calendar Content */}
              <div className="min-h-[600px]">
                {viewMode === 'month' && (
                  <div className="text-center py-20">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Monthly Calendar View</h3>
                    <p className="text-gray-500">Interactive monthly calendar with event display</p>
                  </div>
                )}
                
                {viewMode === 'week' && (
                  <div className="text-center py-20">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Weekly Calendar View</h3>
                    <p className="text-gray-500">Detailed weekly schedule with time slots</p>
                  </div>
                )}
                
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Try adjusting your filters or create a new event.
                        </p>
                      </div>
                    ) : (
                      filteredEvents.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={selectedEvents.includes(event.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedEvents([...selectedEvents, event.id]);
                                } else {
                                  setSelectedEvents(selectedEvents.filter(id => id !== event.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{event.title}</h4>
                                <Badge 
                                  className={`text-xs ${EVENT_CATEGORIES[event.category].textColor} bg-opacity-10`}
                                >
                                  {EVENT_CATEGORIES[event.category].label}
                                </Badge>
                                <Badge className={`text-xs ${PRIORITY_LEVELS[event.priority].color}`}>
                                  {PRIORITY_LEVELS[event.priority].label}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                              </p>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {viewMode === 'timeline' && (
                  <div className="text-center py-20">
                    <BarChart2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline View</h3>
                    <p className="text-gray-500">Gantt-style timeline for long-term planning</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" placeholder="Enter event title" />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_CATEGORIES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter event description" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="datetime-local" />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="datetime-local" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Enter location" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="allDay" />
              <Label htmlFor="allDay">All day event</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="recurring" />
              <Label htmlFor="recurring">Recurring event</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox id="requiresApproval" />
              <Label htmlFor="requiresApproval">Requires approval</Label>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddEvent(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Event added successfully");
                setShowAddEvent(false);
              }}>
                Add Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Events</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="importFile">Select File</Label>
              <Input id="importFile" type="file" accept=".csv,.xlsx" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Events imported successfully");
                setShowImportDialog(false);
              }}>
                Import
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Events</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exportFormat">Format</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="ical">iCal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Events exported successfully");
                setShowExportDialog(false);
              }}>
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Calendar Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailNotif">Email Notifications</Label>
                  <Switch id="emailNotif" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushNotif">Push Notifications</Label>
                  <Switch id="pushNotif" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminderNotif">Reminder Notifications</Label>
                  <Switch id="reminderNotif" />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-3">Display Options</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showWeekends">Show Weekends</Label>
                  <Switch id="showWeekends" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showHolidays">Show Holidays</Label>
                  <Switch id="showHolidays" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="colorCoding">Color Coding</Label>
                  <Switch id="colorCoding" defaultChecked />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-3">Integration</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="googleSync">Google Calendar Sync</Label>
                  <Switch id="googleSync" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="outlookSync">Outlook Sync</Label>
                  <Switch id="outlookSync" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Settings saved successfully");
                setShowSettings(false);
              }}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 