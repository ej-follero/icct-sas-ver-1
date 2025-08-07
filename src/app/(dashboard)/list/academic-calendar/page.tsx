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
import PageHeader from '@/components/PageHeader/PageHeader';

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

// Filter Panel Component
interface FilterPanelProps {
  academicYears: AcademicYear[];
  selectedYear: AcademicYear | null;
  selectedSemester: Semester | null;
  onYearChange: (year: AcademicYear | null) => void;
  onSemesterChange: (semester: Semester | null) => void;
  search: string;
  onSearchChange: (search: string) => void;
  filters: {
    category: string;
    priority: string;
    status: string;
    dateRange: string;
  };
  onFiltersChange: (filters: any) => void;
}

// Calendar View Component
interface CalendarViewProps {
  events: AcademicEvent[];
  currentDate: Date;
  viewMode: 'month' | 'week' | 'day' | 'timeline';
  selectedEvents: number[];
  onEventSelect: (eventId: number) => void;
}

function CalendarView({ events, currentDate, viewMode, selectedEvents, onEventSelect }: CalendarViewProps) {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const checkDate = new Date(date);
      
      checkDate.setHours(0, 0, 0, 0);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (viewMode === 'month') {
    const days = getDaysInMonth(currentDate);
    const weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="calendar-month">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded cursor-pointer ${
                        selectedEvents.includes(event.id) 
                          ? 'ring-2 ring-blue-500' 
                          : ''
                      }`}
                      style={{ backgroundColor: event.color + '20', color: event.color }}
                      onClick={() => onEventSelect(event.id)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      {!event.allDay && (
                        <div className="text-xs opacity-75">
                          {formatTime(new Date(event.startDate))}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (viewMode === 'week') {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekDays: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      weekDays.push(day);
    }

    const timeSlots = [];
    for (let hour = 6; hour <= 22; hour++) {
      timeSlots.push(hour);
    }

    return (
      <div className="calendar-week">
        {/* Time slots */}
        <div className="grid grid-cols-8 gap-1">
          <div className="w-16"></div> {/* Empty corner */}
          {weekDays.map(day => (
            <div key={day.toDateString()} className="p-2 text-center text-sm font-medium border-b">
              <div>{day.toLocaleDateString([], { weekday: 'short' })}</div>
              <div className={`text-lg ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : ''}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
          
          {timeSlots.map(hour => (
            <div key={hour} className="contents">
              <div className="w-16 p-1 text-xs text-gray-500 text-right border-r">
                {hour}:00
              </div>
              {weekDays.map(day => {
                const dayEvents = events.filter(event => {
                  const eventDate = new Date(event.startDate);
                  const eventHour = eventDate.getHours();
                  return eventDate.toDateString() === day.toDateString() && eventHour === hour;
                });

                return (
                  <div key={`${day.toDateString()}-${hour}`} className="min-h-[60px] border-b border-r relative">
                    {dayEvents.map(event => (
                      <div
                        key={event.id}
                        className={`absolute left-1 right-1 p-1 text-xs rounded cursor-pointer ${
                          selectedEvents.includes(event.id) 
                            ? 'ring-2 ring-blue-500' 
                            : ''
                        }`}
                        style={{ backgroundColor: event.color + '20', color: event.color }}
                        onClick={() => onEventSelect(event.id)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="opacity-75">
                          {formatTime(new Date(event.startDate))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'day') {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startDate);
      const checkDate = new Date(currentDate);
      
      checkDate.setHours(0, 0, 0, 0);
      eventDate.setHours(0, 0, 0, 0);
      
      return eventDate.toDateString() === checkDate.toDateString();
    });

    const allDayEvents = dayEvents.filter(event => event.allDay);
    const timedEvents = dayEvents.filter(event => !event.allDay).sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const timeSlots = [];
    for (let hour = 6; hour <= 22; hour++) {
      timeSlots.push(hour);
    }

    return (
      <div className="calendar-day">
        {/* Day Header */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900">
            {currentDate.toLocaleDateString([], { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        {/* All Day Events */}
        {allDayEvents.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">All Day Events</h4>
            <div className="space-y-2">
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  className={`p-3 border-l-4 rounded-lg cursor-pointer transition-colors ${
                    selectedEvents.includes(event.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  style={{ borderLeftColor: event.color }}
                  onClick={() => onEventSelect(event.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium">{event.title}</h5>
                        <Badge 
                          className={`text-xs ${EVENT_CATEGORIES[event.category].textColor} bg-opacity-10`}
                        >
                          {EVENT_CATEGORIES[event.category].label}
                        </Badge>
                        <Badge className={`text-xs ${PRIORITY_LEVELS[event.priority].color}`}>
                          {PRIORITY_LEVELS[event.priority].label}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600">{event.description}</p>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time-based Events */}
        <div className="relative">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Scheduled Events</h4>
          <div className="grid grid-cols-1 gap-1">
            {timeSlots.map(hour => {
              const hourEvents = timedEvents.filter(event => {
                const eventHour = new Date(event.startDate).getHours();
                return eventHour === hour;
              });

              return (
                <div key={hour} className="flex">
                  <div className="w-20 p-2 text-sm text-gray-500 text-right border-r border-gray-200">
                    {hour}:00
                  </div>
                  <div className="flex-1 min-h-[60px] border-b border-gray-200 relative">
                    {hourEvents.map(event => (
                      <div
                        key={event.id}
                        className={`absolute left-2 right-2 p-3 rounded-lg cursor-pointer shadow-sm ${
                          selectedEvents.includes(event.id) 
                            ? 'ring-2 ring-blue-500' 
                            : 'hover:shadow-md'
                        }`}
                        style={{ 
                          backgroundColor: event.color + '20', 
                          color: event.color,
                          top: '4px',
                          bottom: '4px'
                        }}
                        onClick={() => onEventSelect(event.id)}
                      >
                        <div className="flex items-start justify-between h-full">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium text-sm truncate">{event.title}</h5>
                              <Badge 
                                className={`text-xs ${EVENT_CATEGORIES[event.category].textColor} bg-opacity-10`}
                              >
                                {EVENT_CATEGORIES[event.category].label}
                              </Badge>
                            </div>
                            <div className="text-xs opacity-75">
                              {formatTime(new Date(event.startDate))} - {formatTime(new Date(event.endDate))}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </div>
                            )}
                            {event.description && (
                              <p className="text-xs opacity-75 mt-1 line-clamp-2">{event.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* No Events Message */}
        {dayEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events scheduled</h3>
            <p className="text-gray-500">
              {currentDate.toLocaleDateString([], { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })} is free
            </p>
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'timeline') {
    const sortedEvents = [...events].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return (
      <div className="calendar-timeline">
        <div className="space-y-4">
          {sortedEvents.map(event => (
            <div
              key={event.id}
              className={`p-4 border-l-4 rounded-r-lg cursor-pointer transition-colors ${
                selectedEvents.includes(event.id) 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              style={{ borderLeftColor: event.color }}
              onClick={() => onEventSelect(event.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
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
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {event.startDate.toLocaleDateString()} - {event.endDate.toLocaleDateString()}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                    {!event.allDay && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(new Date(event.startDate))} - {formatTime(new Date(event.endDate))}
                      </div>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function FilterPanel({
  academicYears,
  selectedYear,
  selectedSemester,
  onYearChange,
  onSemesterChange,
  search,
  onSearchChange,
  filters,
  onFiltersChange
}: FilterPanelProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Filter & Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Search */}
          <div className="lg:col-span-3">
            <Label htmlFor="search">Search Events</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by title, description, or tags..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Academic Year */}
          <div className="lg:col-span-2">
            <Label htmlFor="academicYear">Academic Year</Label>
            <Select 
              value={selectedYear?.id.toString()} 
              onValueChange={(value) => {
                const year = academicYears.find(y => y.id.toString() === value);
                onYearChange(year || null);
                onSemesterChange(year?.semesters[0] || null);
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
          
          {/* Semester */}
          <div className="lg:col-span-2">
            <Label htmlFor="semester">Semester</Label>
            <Select 
              value={selectedSemester?.id.toString()} 
              onValueChange={(value) => {
                const semester = selectedYear?.semesters.find(s => s.id.toString() === value);
                onSemesterChange(semester || null);
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
          
          {/* Category */}
          <div className="lg:col-span-1">
            <Label htmlFor="category">Category</Label>
            <Select value={filters.category} onValueChange={(value) => onFiltersChange({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(EVENT_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Priority */}
          <div className="lg:col-span-1">
            <Label htmlFor="priority">Priority</Label>
            <Select value={filters.priority} onValueChange={(value) => onFiltersChange({ ...filters, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(PRIORITY_LEVELS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Status */}
          <div className="lg:col-span-1">
            <Label htmlFor="status">Status</Label>
            <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range */}
          <div className="lg:col-span-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <Select value={filters.dateRange} onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}>
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
        </div>
      </CardContent>
    </Card>
  );
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
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list' | 'timeline'>('month');
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
      <PageHeader
        title="Academic Calendar"
        subtitle="Manage academic events, deadlines, and important dates"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Academic Management', href: '/academic-management' },
          { label: 'Academic Calendar' }
        ]}
      />





      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 pt-6">
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
      <FilterPanel
        academicYears={academicYears}
        selectedYear={selectedYear}
        selectedSemester={selectedSemester}
        onYearChange={setSelectedYear}
        onSemesterChange={setSelectedSemester}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFiltersChange={setFilters}
      />

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
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleImportEvents}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportEvents}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" className="w-full justify-start" onClick={handleAddEvent}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
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
                      <TabsTrigger value="day" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Day
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
                  <CalendarView 
                    events={filteredEvents}
                    currentDate={currentDate}
                    viewMode="month"
                    selectedEvents={selectedEvents}
                    onEventSelect={(eventId) => {
                      if (selectedEvents.includes(eventId)) {
                        setSelectedEvents(selectedEvents.filter(id => id !== eventId));
                      } else {
                        setSelectedEvents([...selectedEvents, eventId]);
                      }
                    }}
                  />
                )}
                
                {viewMode === 'week' && (
                  <CalendarView 
                    events={filteredEvents}
                    currentDate={currentDate}
                    viewMode="week"
                    selectedEvents={selectedEvents}
                    onEventSelect={(eventId) => {
                      if (selectedEvents.includes(eventId)) {
                        setSelectedEvents(selectedEvents.filter(id => id !== eventId));
                      } else {
                        setSelectedEvents([...selectedEvents, eventId]);
                      }
                    }}
                  />
                )}
                
                {viewMode === 'day' && (
                  <CalendarView 
                    events={filteredEvents}
                    currentDate={currentDate}
                    viewMode="day"
                    selectedEvents={selectedEvents}
                    onEventSelect={(eventId) => {
                      if (selectedEvents.includes(eventId)) {
                        setSelectedEvents(selectedEvents.filter(id => id !== eventId));
                      } else {
                        setSelectedEvents([...selectedEvents, eventId]);
                      }
                    }}
                  />
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
                  <CalendarView 
                    events={filteredEvents}
                    currentDate={currentDate}
                    viewMode="timeline"
                    selectedEvents={selectedEvents}
                    onEventSelect={(eventId) => {
                      if (selectedEvents.includes(eventId)) {
                        setSelectedEvents(selectedEvents.filter(id => id !== eventId));
                      } else {
                        setSelectedEvents([...selectedEvents, eventId]);
                      }
                    }}
                  />
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