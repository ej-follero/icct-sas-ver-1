"use client";

import { useState, useEffect } from "react";
import { Calendar, RefreshCw, Plus, Filter, Download, Upload, Edit, Trash2, AlertTriangle, Clock, Users, MapPin, CheckCircle, XCircle, Search } from "lucide-react";
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
import Pagination from "@/components/Pagination";

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
  const [filters, setFilters] = useState({
    semester: 'all',
    status: 'all',
    day: 'all',
    instructor: 'all',
    room: 'all',
  });

  useEffect(() => {
    fetchSchedules();
  }, [search, page, itemsPerPage, filters]);

  const fetchSchedules = async () => {
    setLoading(true);
    setError("");
    try {
      // Filter out "all" values and only include actual filter values
      const filterParams = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value && value !== 'all') {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

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
      } else {
        throw new Error(data.error || 'Failed to fetch schedules');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch schedules");
      toast.error("Failed to fetch schedules");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: "Select", accessor: "select" },
    { header: "Subject", accessor: "subject" },
    { header: "Section", accessor: "section" },
    { header: "Instructor", accessor: "instructor" },
    { header: "Room", accessor: "room" },
    { header: "Day", accessor: "day" },
    { header: "Time", accessor: "time" },
    { header: "Type", accessor: "scheduleType" },
    { header: "Status", accessor: "status" },
    { header: "Enrollment", accessor: "enrollment" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderRow = (schedule: Schedule) => (
    <>
      <td className="py-2 px-4">
        <Checkbox
          checked={selectedSchedules.includes(schedule.subjectSchedId)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedSchedules([...selectedSchedules, schedule.subjectSchedId]);
            } else {
              setSelectedSchedules(selectedSchedules.filter(id => id !== schedule.subjectSchedId));
            }
          }}
        />
      </td>
      <td className="py-2 px-4">
        <div>
          <div className="font-medium">{schedule.subject.subjectName}</div>
          <div className="text-sm text-gray-500">{schedule.subject.subjectCode}</div>
        </div>
      </td>
      <td className="py-2 px-4">{schedule.section.sectionName}</td>
      <td className="py-2 px-4">
        <div>
          <div>{`${schedule.instructor.firstName} ${schedule.instructor.lastName}`}</div>
          <div className="text-sm text-gray-500">ID: {schedule.instructor.instructorId}</div>
        </div>
      </td>
      <td className="py-2 px-4">
        <div>
          <div>{schedule.room.roomNo}</div>
          <div className="text-sm text-gray-500">Cap: {schedule.room.roomCapacity}</div>
        </div>
      </td>
      <td className="py-2 px-4">
        <Badge variant="outline">{schedule.day}</Badge>
      </td>
      <td className="py-2 px-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {schedule.startTime} - {schedule.endTime}
        </div>
      </td>
      <td className="py-2 px-4">
        <Badge variant={schedule.scheduleType === 'Regular' ? 'default' : 'secondary'}>
          {schedule.scheduleType}
        </Badge>
      </td>
      <td className="py-2 px-4">
        <Badge variant={schedule.status === 'Active' ? 'default' : 'destructive'}>
          {schedule.status}
        </Badge>
      </td>
      <td className="py-2 px-4">
        <div className="flex items-center gap-2">
          <div className="text-sm">
            {schedule.currentEnrollment}/{schedule.maxStudents}
          </div>
          <Progress 
            value={(schedule.currentEnrollment / schedule.maxStudents) * 100} 
            className="w-16 h-2"
          />
        </div>
      </td>
      <td className="py-2 px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </>
  );

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

  const calendarEvents = schedules.map(schedule => ({
    id: schedule.subjectSchedId,
    title: `${schedule.subject.subjectName} - ${schedule.section.sectionName}`,
    start: new Date(`2024-01-01T${schedule.startTime}:00`),
    end: new Date(`2024-01-01T${schedule.endTime}:00`),
    description: `${schedule.instructor.firstName} ${schedule.instructor.lastName} | ${schedule.room.roomNo}`,
  }));

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Class Schedules</h1>
            <p className="text-gray-600">Manage and monitor all class schedules</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => toast.info("Add schedule functionality coming soon")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Active schedules
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => s.status === 'Active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(schedules.map(s => s.instructor.instructorId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Teaching this semester
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(schedules.map(s => s.room.roomId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              In use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search schedules..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select value={filters.semester} onValueChange={(value) => setFilters({ ...filters, semester: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All semesters</SelectItem>
                  <SelectItem value="1st">1st Semester</SelectItem>
                  <SelectItem value="2nd">2nd Semester</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
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
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="day">Day</Label>
              <Select value={filters.day} onValueChange={(value) => setFilters({ ...filters, day: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All days</SelectItem>
                  <SelectItem value="Monday">Monday</SelectItem>
                  <SelectItem value="Tuesday">Tuesday</SelectItem>
                  <SelectItem value="Wednesday">Wednesday</SelectItem>
                  <SelectItem value="Thursday">Thursday</SelectItem>
                  <SelectItem value="Friday">Friday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="instructor">Instructor</Label>
              <Select value={filters.instructor} onValueChange={(value) => setFilters({ ...filters, instructor: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All instructors</SelectItem>
                  {Array.from(new Set(schedules.map(s => `${s.instructor.firstName} ${s.instructor.lastName}`))).map(instructor => (
                    <SelectItem key={instructor} value={instructor}>{instructor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="room">Room</Label>
              <Select value={filters.room} onValueChange={(value) => setFilters({ ...filters, room: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rooms</SelectItem>
                  {Array.from(new Set(schedules.map(s => s.room.roomNo))).map(room => (
                    <SelectItem key={room} value={room}>{room}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Selector and Content */}
      <div className="flex-1">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar View
            </TabsTrigger>
          </TabsList>

          {/* Bulk Actions */}
          {selectedSchedules.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{selectedSchedules.length} schedule(s) selected</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Activate
                    </Button>
                    <Button variant="outline" size="sm">
                      Deactivate
                    </Button>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Content Area */}
          <TabsContent value="table" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Schedule List</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading schedules...</span>
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new schedule.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => toast.info("Add schedule functionality coming soon")}> 
                        <Plus className="w-4 h-4 mr-2" />
                        Add Schedule
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table columns={columns} data={schedules} renderRow={renderRow} />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="pageSize" className="text-sm">Rows per page:</Label>
                        <Select value={String(itemsPerPage)} onValueChange={(value) => { setItemsPerPage(Number(value)); setPage(1); }}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAGE_SIZE_OPTIONS.map(size => (
                              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Calendar View</CardTitle>
              </CardHeader>
              <CardContent>
                <CalendarView 
                  mode="work-week" 
                  events={calendarEvents}
                  className="h-[600px]"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 