"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Plus, Download, Upload, Edit, Trash2, AlertTriangle, Clock, Users, MapPin, CheckCircle, XCircle, Search, RefreshCw, Printer, Columns3, List, Settings, Bell, Building2, RotateCcw, Eye, Pencil, BookOpen, GraduationCap, BadgeInfo, X, ChevronRight, Hash, Tag, Layers, FileText, Info, UserCheck as UserCheckIcon, Archive } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Checkbox } from "../../../../components/ui/checkbox";
import { Label } from "../../../../components/ui/label";
import { Alert, AlertDescription } from "../../../../components/ui/alert";
import { Progress } from "../../../../components/ui/progress";
import { toast } from "sonner";
import CalendarView from "@/components/CalendarView";
import Table from "@/components/Table";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { TableList, TableListColumn } from '@/components/reusable/Table/TableList';
import { TablePagination } from '@/components/reusable/Table/TablePagination';

import BulkActions from '../../../../components/BulkActions';
import { ICCT_CLASSES } from '../../../../lib/colors';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

interface Schedule {
  subjectSchedId: number;
  subject: { subjectName: string; subjectCode: string };
  section: { sectionName: string; sectionId: number };
  instructor: { firstName: string; lastName: string; instructorId: number };
  room: { roomNo: string; roomId: number; roomCapacity: number };
  day: string;
  startTime: string;
  endTime: string;
  slots: number;
  scheduleType: string;
  status: string;
  semester: { semesterName: string; semesterId: number };
  academicYear: string;
  maxStudents: number;
  currentEnrollment: number;
  conflicts?: string[];
}

export default function ClassSchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<string>("all");
  const [instructorFilter, setInstructorFilter] = useState<string>("all");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  // New filter states
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState<string>("all");
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>("all");
  const [enrollmentFilter, setEnrollmentFilter] = useState<string>("all");
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>('subject');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  useEffect(() => {
    fetchSchedules();
  }, [search, page, itemsPerPage, statusFilter, semesterFilter, dayFilter, instructorFilter, roomFilter, scheduleTypeFilter, academicYearFilter, subjectFilter, sectionFilter, departmentFilter, timeRangeFilter, enrollmentFilter, buildingFilter, floorFilter, roomTypeFilter]);

  const fetchSchedules = async (refresh: boolean = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");
    try {
      // Filter out "all" values and only include actual filter values
      const filterParams: Record<string, string> = {};
      if (statusFilter !== 'all') filterParams.status = statusFilter;
      if (semesterFilter !== 'all') filterParams.semester = semesterFilter;
      if (dayFilter !== 'all') filterParams.day = dayFilter;
      if (instructorFilter !== 'all') filterParams.instructor = instructorFilter;
      if (roomFilter !== 'all') filterParams.room = roomFilter;
      if (scheduleTypeFilter !== 'all') filterParams.scheduleType = scheduleTypeFilter;
      if (academicYearFilter !== 'all') filterParams.academicYear = academicYearFilter;
      if (subjectFilter !== 'all') filterParams.subject = subjectFilter;
      if (sectionFilter !== 'all') filterParams.section = sectionFilter;
      if (departmentFilter !== 'all') filterParams.department = departmentFilter;
      if (timeRangeFilter !== 'all') filterParams.timeRange = timeRangeFilter;
      if (enrollmentFilter !== 'all') filterParams.enrollment = enrollmentFilter;
      if (buildingFilter !== 'all') filterParams.building = buildingFilter;
      if (floorFilter !== 'all') filterParams.floor = floorFilter;
      if (roomTypeFilter !== 'all') filterParams.roomType = roomTypeFilter;

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(itemsPerPage),
        search,
        ...filterParams,
      });
      const response = await fetch(`/api/schedules?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setSchedules(data.data || []);
        setTotal(data.total || 0);
        if (refresh) toast.success('Schedules refreshed successfully');
      } else {
        throw new Error(data.error || 'Failed to fetch schedules');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch schedules");
      if (refresh) {
        toast.error('Failed to refresh schedules. Please try again later.');
      } else {
        toast.error("Failed to fetch schedules");
      }
    } finally {
      if (refresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Selection handlers
  const isAllSelected = schedules.length > 0 && schedules.every(s => selectedSchedules.includes(s.subjectSchedId));
  const isIndeterminate = selectedSchedules.length > 0 && !isAllSelected;
  
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(schedules.map(s => s.subjectSchedId));
    }
  };
  
  const handleSelectRow = (id: string) => {
    setSelectedSchedules(prev => 
      prev.includes(Number(id)) 
        ? prev.filter(s => s !== Number(id))
        : [...prev, Number(id)]
    );
  };

  // Sort handler
  const handleSort = (field: string) => {
    setSortField(field);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Expand handler
  const onToggleExpand = (itemId: string) => {
    setExpandedRowIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Table columns for TableList
  const columns: TableListColumn<Schedule>[] = [
    {
      header: (
        <Checkbox 
          checked={isAllSelected} 
          indeterminate={isIndeterminate} 
          onCheckedChange={handleSelectAll}
          aria-label="Select all schedules"
        />
      ),
      accessor: 'select',
      className: 'w-12 text-center',
    },
    {
      header: 'Subject',
      accessor: 'subject',
      className: 'text-center',
      sortable: true,
      render: (item: Schedule) => (
        <div className="text-sm font-medium text-blue-900 text-center">
          <div>{item.subject.subjectName}</div>
          <div className="text-xs text-gray-500">{item.subject.subjectCode}</div>
        </div>
      )
    },
    {
      header: 'Section',
      accessor: 'section',
      className: 'text-center',
      sortable: true,
      render: (item: Schedule) => (
        <span className="text-sm text-blue-900 text-center">{item.section.sectionName}</span>
      )
    },
    {
      header: 'Instructor',
      accessor: 'instructor',
      className: 'text-center',
      sortable: true,
      render: (item: Schedule) => (
        <div className="text-sm text-blue-900 text-center">
          <div>{`${item.instructor.firstName} ${item.instructor.lastName}`}</div>
          <div className="text-xs text-gray-500">ID: {item.instructor.instructorId}</div>
        </div>
      )
    },
    {
      header: 'Room',
      accessor: 'room',
      className: 'text-center',
      sortable: true,
      render: (item: Schedule) => (
        <div className="text-sm text-blue-900 text-center">
          <div>{item.room.roomNo}</div>
          <div className="text-xs text-gray-500">Cap: {item.room.roomCapacity}</div>
        </div>
      )
    },
    {
      header: 'Day',
      accessor: 'day',
      className: 'text-center',
      sortable: true,
      render: (item: Schedule) => (
        <Badge variant="outline" className="text-center">{item.day}</Badge>
      )
    },
    {
      header: 'Time',
      accessor: 'time',
      className: 'text-center',
      sortable: true,
      render: (item: Schedule) => (
        <div className="flex items-center gap-1 justify-center">
          <Clock className="w-3 h-3" />
          <span className="text-sm text-blue-900">{item.startTime} - {item.endTime}</span>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'scheduleType',
      className: 'text-center',
      sortable: true,
      render: (item: Schedule) => (
        <Badge variant={item.scheduleType === 'Regular' ? 'default' : 'secondary'} className="text-center">
          {item.scheduleType}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      className: 'text-center',
      sortable: true,
      render: (item: Schedule) => (
        <Badge variant={item.status === 'Active' ? 'default' : 'destructive'} className="text-center">
          {item.status}
        </Badge>
      )
    },
    {
      header: 'Enrollment',
      accessor: 'enrollment',
      className: 'text-center',
      sortable: true,
      render: (item: Schedule) => (
        <div className="flex items-center gap-2 justify-center">
          <div className="text-sm text-blue-900">
            {item.currentEnrollment}/{item.maxStudents}
          </div>
          <Progress 
            value={(item.currentEnrollment / item.maxStudents) * 100} 
            className="w-16 h-2"
          />
        </div>
      )
    },
    {
      header: "Actions",
      accessor: "actions",
      className: "text-center",
      render: (item: Schedule) => (
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit Schedule"
            className="hover:bg-green-50"
            onClick={() => toast.info("Edit functionality coming soon")}
          >
            <Edit className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete Schedule"
            className="hover:bg-red-50"
            onClick={() => toast.info("Delete functionality coming soon")}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )
    }
  ];



  const handleExportCSV = () => {
    const csvRows = [
      columns.slice(1, -1).map((col) => col.header).join(","),
      ...schedules.map((schedule) =>
        [
          schedule.subject.subjectName,
          schedule.section.sectionName,
          `${schedule.instructor.firstName} ${schedule.instructor.lastName}`,
          schedule.room.roomNo,
          schedule.day,
          `${schedule.startTime} - ${schedule.endTime}`,
          schedule.scheduleType,
          schedule.status,
          `${schedule.currentEnrollment}/${schedule.maxStudents}`,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `class-schedules-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Schedule exported successfully');
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  // Get unique values for filter options
  const semesterOptions = useMemo(() => {
    const semesters = schedules.map(s => s.semester.semesterName).filter((name): name is string => !!name);
    return Array.from(new Set(semesters)).sort();
  }, [schedules]);

  const dayOptions = useMemo(() => {
    const days = schedules.map(s => s.day).filter((day): day is string => !!day);
    return Array.from(new Set(days)).sort();
  }, [schedules]);

  const instructorOptions = useMemo(() => {
    const instructors = schedules.map(s => `${s.instructor.firstName} ${s.instructor.lastName}`).filter((name): name is string => !!name);
    return Array.from(new Set(instructors)).sort();
  }, [schedules]);

  const roomOptions = useMemo(() => {
    const rooms = schedules.map(s => s.room.roomNo).filter((room): room is string => !!room);
    return Array.from(new Set(rooms)).sort();
  }, [schedules]);

  // New filter options
  const subjectOptions = useMemo(() => {
    const subjects = schedules.map(s => s.subject.subjectName).filter((subject): subject is string => !!subject);
    return Array.from(new Set(subjects)).sort();
  }, [schedules]);

  const sectionOptions = useMemo(() => {
    const sections = schedules.map(s => s.section.sectionName).filter((section): section is string => !!section);
    return Array.from(new Set(sections)).sort();
  }, [schedules]);

  const academicYearOptions = useMemo(() => {
    const years = schedules.map(s => s.academicYear).filter((year): year is string => !!year);
    return Array.from(new Set(years)).sort().reverse(); // Most recent first
  }, [schedules]);

  const scheduleTypeOptions = useMemo(() => {
    const types = schedules.map(s => s.scheduleType).filter((type): type is string => !!type);
    return Array.from(new Set(types)).sort();
  }, [schedules]);

  // Map schedules to calendar events with proper date calculation
  const dayToIndex = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0,
  };
  
  const calendarEvents = schedules
    .filter((schedule) => schedule.startTime && schedule.endTime)
    .map((schedule, idx) => {
      // Parse start/end time as Date objects for the next week
      const now = new Date();
      const dayKey = schedule.day as keyof typeof dayToIndex;
      const nextDay = new Date(now);
      nextDay.setDate(now.getDate() + ((7 + dayToIndex[dayKey] - now.getDay()) % 7));
      
      // Ensure the day is set correctly
      nextDay.setHours(0, 0, 0, 0);
      
      const [startHour, startMinute] = schedule.startTime.split(":").map(Number);
      const [endHour, endMinute] = schedule.endTime.split(":").map(Number);
      
      const start = new Date(nextDay);
      start.setHours(startHour, startMinute, 0, 0);
      
      const end = new Date(nextDay);
      end.setHours(endHour, endMinute, 0, 0);
      
      // Ensure end time is not before start time
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      
      return {
        id: schedule.subjectSchedId || idx,
        title: `${schedule.subject.subjectName} (${schedule.section.sectionName})`.trim(),
        start,
        end,
        description: `Section: ${schedule.section.sectionName}, Instructor: ${schedule.instructor.firstName} ${schedule.instructor.lastName}, Room: ${schedule.room.roomNo}`,
        time: `${schedule.startTime} - ${schedule.endTime}`,
        sectionCode: schedule.section.sectionName,
        subject: schedule.subject.subjectName,
        instructor: `${schedule.instructor.firstName} ${schedule.instructor.lastName}`,
        room: schedule.room.roomNo,
        day: schedule.day,
        status: schedule.status,
        scheduleType: schedule.scheduleType,
        enrollment: `${schedule.currentEnrollment}/${schedule.maxStudents}`,
      };
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f8fafc] p-0 overflow-x-hidden">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <PageHeader
          title="Class Schedules"
          subtitle="Manage class schedules and timetables"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Academic Management", href: "/academic-management" },
            { label: "Class Schedules" }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<Calendar className="text-blue-500 w-5 h-5" />}
            label="Total Schedules"
            value={total}
            valueClassName="text-blue-900"
            sublabel="Total number of schedules"
          />
          <SummaryCard
            icon={<CheckCircle className="text-blue-500 w-5 h-5" />}
            label="Active Schedules"
            value={schedules.filter(s => s.status === 'Active').length}
            valueClassName="text-blue-900"
            sublabel="Currently active"
          />
          <SummaryCard
            icon={<Users className="text-blue-500 w-5 h-5" />}
            label="Total Instructors"
            value={new Set(schedules.map(s => s.instructor.instructorId)).size}
            valueClassName="text-blue-900"
            sublabel="Teaching this semester"
          />
          <SummaryCard
            icon={<MapPin className="text-blue-500 w-5 h-5" />}
            label="Total Rooms"
            value={new Set(schedules.map(s => s.room.roomId)).size}
            valueClassName="text-blue-900"
            sublabel="In use"
          />
        </div>

        {/* Quick Actions Panel */}
        <div className="w-full max-w-full pt-4">
          <QuickActionsPanel
            variant="premium"
            title="Quick Actions"
            subtitle="Essential tools and shortcuts"
            icon={
              <div className="w-6 h-6 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
            }
            actionCards={[
              {
                id: 'add-schedule',
                label: 'Add Schedule',
                description: 'Create new schedule',
                icon: <Plus className="w-5 h-5 text-white" />,
                onClick: () => toast.info("Add schedule functionality coming soon")
              },
              {
                id: 'import-data',
                label: 'Import Data',
                description: 'Import schedules from file',
                icon: <Upload className="w-5 h-5 text-white" />,
                onClick: () => toast.info("Import functionality coming soon")
              },
              {
                id: 'print-page',
                label: 'Print Page',
                description: 'Print schedule list',
                icon: <Printer className="w-5 h-5 text-white" />,
                onClick: () => toast.info("Print functionality coming soon")
              },
              {
                id: 'visible-columns',
                label: 'Visible Columns',
                description: 'Manage table columns',
                icon: <Columns3 className="w-5 h-5 text-white" />,
                onClick: () => toast.info("Column management coming soon")
              },
              {
                id: 'refresh-data',
                label: 'Refresh Data',
                description: 'Reload schedule data',
                icon: isRefreshing ? (
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                onClick: () => fetchSchedules(true),
                disabled: isRefreshing,
                loading: isRefreshing
              },
              {
                id: 'sort-options',
                label: 'Sort Options',
                description: 'Configure sorting',
                icon: <List className="w-5 h-5 text-white" />,
                onClick: () => toast.info("Sort options coming soon")
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

        {/* Main Content Area */}
        <div className="w-full max-w-full pt-4">
          <Card className="shadow-lg rounded-xl overflow-hidden p-0 w-full max-w-full">
            <CardHeader className="p-0">
              {/* Blue Gradient Header - flush to card edge, no rounded corners */}
              <div className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-0">
                <div className="py-4 sm:py-6">
                  <div className="flex items-center gap-3 px-4 sm:px-6">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Schedule List</h3>
                      <p className="text-blue-100 text-sm">Search and filter schedule information</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Search and Filter Section */}
            <div className="border-b border-gray-200 shadow-sm p-3 sm:p-4 lg:p-6 pb-6">
              <div className="flex flex-row gap-2 sm:gap-3 items-center justify-between">
                {/* Search Bar - More compact */}
                <div className="relative flex-shrink-0 w-48 sm:w-56 lg:w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search schedules..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  />
                </div>
                {/* Primary Filter Dropdowns - Compact widths */}
                <div className="flex gap-2 sm:gap-3 flex-1 justify-end">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-24 sm:w-28 text-gray-700">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">
                        <span className="flex items-center gap-2">
                          <span className="text-green-600"><CheckCircle className="w-4 h-4" /></span> Active
                        </span>
                      </SelectItem>
                      <SelectItem value="Inactive">
                        <span className="flex items-center gap-2">
                          <span className="text-red-500"><X className="w-4 h-4" /></span> Inactive
                        </span>
                      </SelectItem>
                      <SelectItem value="Completed">
                        <span className="flex items-center gap-2">
                          <span className="text-blue-500"><Clock className="w-4 h-4" /></span> Completed
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                    <SelectTrigger className="w-24 sm:w-28 text-gray-700">
                      <SelectValue placeholder="Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Semesters</SelectItem>
                      {semesterOptions.map((semester) => (
                        <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={dayFilter} onValueChange={setDayFilter}>
                    <SelectTrigger className="w-20 sm:w-24 text-gray-700">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Days</SelectItem>
                      {dayOptions.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                    <SelectTrigger className="w-28 sm:w-32 text-gray-700">
                      <SelectValue placeholder="Instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Instructors</SelectItem>
                      {instructorOptions.map((instructor) => (
                        <SelectItem key={instructor} value={instructor}>{instructor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={roomFilter} onValueChange={setRoomFilter}>
                    <SelectTrigger className="w-20 sm:w-24 text-gray-700">
                      <SelectValue placeholder="Room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rooms</SelectItem>
                      {roomOptions.map((room) => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="w-28 sm:w-32 text-gray-700">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjectOptions.map((subject) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300 hover:border-gray-400 whitespace-nowrap"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Advanced</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-90' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {/* Advanced Filters Section */}
              {showAdvancedFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Advanced Filters</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Reset all advanced filters
                        setScheduleTypeFilter("all");
                        setAcademicYearFilter("all");
                        setSectionFilter("all");
                        setDepartmentFilter("all");
                        setTimeRangeFilter("all");
                        setEnrollmentFilter("all");
                        setBuildingFilter("all");
                        setFloorFilter("all");
                        setRoomTypeFilter("all");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    <Select value={scheduleTypeFilter} onValueChange={setScheduleTypeFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {scheduleTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {academicYearOptions.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={sectionFilter} onValueChange={setSectionFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                        <SelectValue placeholder="Section" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {sectionOptions.map((section) => (
                          <SelectItem key={section} value={section}>{section}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                        <SelectValue placeholder="Time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Times</SelectItem>
                        <SelectItem value="morning">Morning (6AM-12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM-6PM)</SelectItem>
                        <SelectItem value="evening">Evening (6PM-10PM)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={enrollmentFilter} onValueChange={setEnrollmentFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                        <SelectValue placeholder="Enrollment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="overbooked">Overbooked</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                        <SelectValue placeholder="Building" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Buildings</SelectItem>
                        <SelectItem value="BuildingA">Building A</SelectItem>
                        <SelectItem value="BuildingB">Building B</SelectItem>
                        <SelectItem value="BuildingC">Building C</SelectItem>
                        <SelectItem value="BuildingD">Building D</SelectItem>
                        <SelectItem value="BuildingE">Building E</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={floorFilter} onValueChange={setFloorFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                        <SelectValue placeholder="Floor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Floors</SelectItem>
                        <SelectItem value="F1">Floor 1</SelectItem>
                        <SelectItem value="F2">Floor 2</SelectItem>
                        <SelectItem value="F3">Floor 3</SelectItem>
                        <SelectItem value="F4">Floor 4</SelectItem>
                        <SelectItem value="F5">Floor 5</SelectItem>
                        <SelectItem value="F6">Floor 6</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                      <SelectTrigger className="w-full sm:w-28 lg:w-32 xl:w-28 text-gray-700">
                        <SelectValue placeholder="Room Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="LECTURE">Lecture</SelectItem>
                        <SelectItem value="LABORATORY">Laboratory</SelectItem>
                        <SelectItem value="CONFERENCE">Conference</SelectItem>
                        <SelectItem value="OFFICE">Office</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* View Mode Selector and Content */}
            <div className="flex-1 px-3 sm:px-4 lg:px-6 pb-6 pt-6">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger value="table" className="flex items-center gap-2 text-sm font-medium text-blue-400 data-[state=active]:text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                    <Calendar className="w-4 h-4 text-blue-400 data-[state=active]:text-blue-700" />
                    Table View
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="flex items-center gap-2 text-sm font-medium text-blue-400 data-[state=active]:text-blue-700 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">
                    <Calendar className="w-4 h-4 text-blue-400 data-[state=active]:text-blue-700" />
                    Calendar View
                  </TabsTrigger>
                </TabsList>

                {/* Bulk Actions */}
                {selectedSchedules.length > 0 && (
                  <div className="mb-4">
                    <BulkActions
                      selectedCount={selectedSchedules.length}
                      onActivate={() => toast.info('Activate action coming soon')}
                      onDeactivate={() => toast.info('Deactivate action coming soon')}
                      onDelete={() => toast.info('Delete action coming soon')}
                    />
                  </div>
                )}

                                 {/* Content Area */}
                 <TabsContent value="table" className="space-y-4">
                   {error ? (
                     <Alert variant="destructive">
                       <XCircle className="h-4 w-4" />
                       <AlertDescription>{error}</AlertDescription>
                     </Alert>
                   ) : (
                     <div className="hidden xl:block">
                       <div className="px-4 sm:px-6 pt-6 pb-6">
                         <div className="overflow-x-auto bg-white/70 shadow-none relative">
                           <TableList
                             columns={columns}
                             data={schedules}
                             loading={loading}
                             selectedIds={selectedSchedules.map(String)}
                             emptyMessage={null}
                             onSelectRow={handleSelectRow}
                             onSelectAll={handleSelectAll}
                             isAllSelected={isAllSelected}
                             isIndeterminate={isIndeterminate}
                             getItemId={(item) => String(item.subjectSchedId)}
                             className="border-0 shadow-none max-w-full"
                             expandedRowIds={expandedRowIds}
                             onToggleExpand={onToggleExpand}
                             sortState={{ field: sortField, order: sortOrder }}
                             onSort={handleSort}
                           />
                         </div>
                       </div>
                     </div>
                   )}
                   {/* Pagination */}
                   <TablePagination
                     page={page}
                     pageSize={itemsPerPage}
                     totalItems={total}
                     onPageChange={setPage}
                     onPageSizeChange={setItemsPerPage}
                     entityLabel="schedule"
                   />
                 </TabsContent>

                                                  <TabsContent value="calendar" className="space-y-4">
                     <CalendarView 
                       mode="work-week" 
                       events={calendarEvents}
                       showEventCards={false}
                 className="mt-2"
                     />
                 </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 