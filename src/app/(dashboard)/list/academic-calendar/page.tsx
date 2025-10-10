"use client";

import { useState, useEffect } from "react";
import { PageSkeleton } from "@/components/reusable/Skeleton";
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
  BarChart2,
  Printer
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
  // Debug logging for CalendarView
  console.log('CalendarView received:', {
    eventsCount: events.length,
    events: events,
    viewMode,
    currentDate
  });

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
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const checkDate = new Date(date);
      
      checkDate.setHours(0, 0, 0, 0);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);
      
      const isMatch = checkDate >= eventStart && checkDate <= eventEnd;
      
      // Debug logging for date matching
      if (isMatch) {
        console.log('Event matched to date:', {
          eventTitle: event.title,
          eventStart: eventStart.toDateString(),
          eventEnd: eventEnd.toDateString(),
          checkDate: checkDate.toDateString(),
          isMatch
        });
      }
      
      return isMatch;
    });
    
    return dayEvents;
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
                      className={`text-xs p-1 rounded cursor-pointer transition-all hover:shadow-sm ${
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
                      <div className="flex items-center gap-1 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          event.status === 'published' ? 'bg-green-500' : 
                          event.status === 'draft' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs opacity-75">
                          {event.priority === 'critical' ? '🔴' : 
                           event.priority === 'high' ? '🟡' : '🟢'}
                        </span>
                      </div>
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
        <div className="mb-6 p-4 bg-gray-50 rounded">
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
                  className={`p-3 border-l-4 rounded cursor-pointer transition-colors ${
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
                      <Button variant="ghost" size="sm" onClick={() => onEventSelect(event.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onEventSelect(event.id)}>
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
                        className={`absolute left-2 right-2 p-3 rounded cursor-pointer shadow-sm ${
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
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEventSelect(event.id)}>
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => onEventSelect(event.id)}>
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
                  <Button variant="ghost" size="sm" onClick={() => onEventSelect(event.id)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEventSelect(event.id)}>
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
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  
  // Add Event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    category: 'academic' as const,
    priority: 'medium' as const,
    startDate: '',
    endDate: '',
    location: '',
    allDay: false,
    recurring: false,
    requiresApproval: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Import/Export state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf' | 'ical'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      reminders: true
    },
    display: {
      showWeekends: true,
      showHolidays: true,
      colorCoding: true
    },
    integration: {
      googleSync: false,
      outlookSync: false
    }
  });

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await loadAcademicYears();
        
        // Load settings from localStorage
        const savedSettings = localStorage.getItem('academic-calendar-settings');
        if (savedSettings) {
          try {
            setSettings(JSON.parse(savedSettings));
          } catch (error) {
            console.error('Error loading settings:', error);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Reload events when academic year/semester selection changes
  useEffect(() => {
    if (selectedYear && selectedSemester) {
      loadEvents();
    } else {
      // Load events even without academic year/semester selection
      loadEvents();
    }
  }, [selectedYear, selectedSemester]);

  // Reload events when filters change
  useEffect(() => {
    loadEvents();
  }, [filters, search]);

  const loadAcademicYears = async () => {
    try {
      setError(null);
      const response = await fetch('/api/academic-years');
      if (!response.ok) throw new Error('Failed to fetch academic years');
      const data = await response.json();
      setAcademicYears(data);
      
      // Auto-select the first academic year and its first semester
      if (data.length > 0) {
        setSelectedYear(data[0]);
        if (data[0].semesters.length > 0) {
          setSelectedSemester(data[0].semesters[0]);
        }
      }
    } catch (error) {
      console.error('Error loading academic years:', error);
      setError('Failed to load academic years');
    }
  };

  const loadEvents = async () => {
    try {
      setError(null);
      setEventsLoading(true);
      
      // Build query parameters for filtering
      const params = new URLSearchParams();
      
      // Add date range filtering if academic year/semester is selected
      if (selectedYear && selectedSemester) {
        const startDate = selectedSemester.startDate instanceof Date 
          ? selectedSemester.startDate 
          : new Date(selectedSemester.startDate);
        const endDate = selectedSemester.endDate instanceof Date 
          ? selectedSemester.endDate 
          : new Date(selectedSemester.endDate);
        
        params.append('startDate', startDate.toISOString().split('T')[0]);
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }
      
      // Add other filters
      if (filters.category !== 'all') {
        params.append('eventType', filters.category.toUpperCase());
      }
      if (filters.status !== 'all') {
        params.append('status', filters.status.toUpperCase());
      }
      if (filters.priority !== 'all') {
        params.append('priority', filters.priority.toUpperCase());
      }
      if (search) {
        params.append('search', search);
      }
      
      // Add pagination for better performance
      params.append('pageSize', '100');
      
      console.log('Fetching events from:', `/api/events?${params.toString()}`);
      
      const response = await fetch(`/api/events?${params.toString()}`);
      console.log('API Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      // Transform the API response to match our AcademicEvent interface
      const transformedEvents: AcademicEvent[] = data.items?.map((event: any) => {
        console.log('Transforming event:', event);
        
        // The API returns date and startTime/endTime separately, combine them
        const startDateTime = event.startTime 
          ? new Date(event.date + 'T' + event.startTime)
          : new Date(event.date + 'T00:00:00');
        
        const endDateTime = event.endTime 
          ? new Date(event.date + 'T' + event.endTime)
          : startDateTime;

        const transformedEvent = {
          id: event.id,
          title: event.title,
          description: event.description,
          startDate: startDateTime,
          endDate: endDateTime,
          allDay: !event.startTime || event.startTime === '00:00',
          category: mapEventTypeToCategory(event.eventType),
          priority: mapPriorityToLevel(event.priority),
          location: event.location,
          isRecurring: false, // TODO: Add recurrence support
          status: mapStatusToEventStatus(event.status),
          createdBy: event.createdBy,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
          requiresApproval: event.requiresRegistration || false,
          color: getEventColor(mapEventTypeToCategory(event.eventType)),
          tags: [], // TODO: Add tags support
        };
        
        console.log('Transformed event:', transformedEvent);
        return transformedEvent;
      }) || [];
      
      console.log('Events loaded from database:', {
        totalEvents: transformedEvents.length,
        events: transformedEvents,
        apiResponse: data
      });
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadAcademicYears(), loadEvents()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper functions for data transformation
  const mapEventTypeToCategory = (eventType: string): 'academic' | 'administrative' | 'holiday' | 'special' | 'deadline' => {
    switch (eventType) {
      case 'ACADEMIC':
      case 'WORKSHOP':
      case 'SEMINAR':
        return 'academic';
      case 'MEETING':
        return 'administrative';
      case 'SOCIAL':
      case 'SPORTS':
        return 'holiday';
      case 'GRADUATION':
      case 'ORIENTATION':
        return 'special';
      case 'OTHER':
        return 'deadline';
      default:
        return 'academic';
    }
  };

  const mapPriorityToLevel = (priority: string): 'low' | 'medium' | 'high' | 'critical' => {
    switch (priority) {
      case 'LOW':
        return 'low';
      case 'NORMAL':
        return 'medium';
      case 'HIGH':
        return 'high';
      case 'URGENT':
        return 'critical';
      default:
        return 'medium';
    }
  };

  const mapStatusToEventStatus = (status: string): 'draft' | 'published' | 'cancelled' => {
    switch (status) {
      case 'DRAFT':
        return 'draft';
      case 'SCHEDULED':
      case 'ONGOING':
      case 'COMPLETED':
        return 'published';
      case 'CANCELLED':
      case 'POSTPONED':
        return 'cancelled';
      default:
        return 'draft';
    }
  };

  const getEventColor = (category: string): string => {
    switch (category) {
      case 'academic':
        return '#3B82F6';
      case 'administrative':
        return '#F97316';
      case 'holiday':
        return '#EF4444';
      case 'special':
        return '#8B5CF6';
      case 'deadline':
        return '#EAB308';
      default:
        return '#6B7280';
    }
  };

  // Database mapping functions
  const mapCategoryToEventType = (category: string): string => {
    switch (category) {
      case 'academic':
        return 'ACADEMIC';
      case 'administrative':
        return 'MEETING';
      case 'holiday':
        return 'SOCIAL';
      case 'special':
        return 'GRADUATION';
      case 'deadline':
        return 'OTHER';
      default:
        return 'ACADEMIC';
    }
  };

  const mapPriorityToDbLevel = (priority: string): string => {
    switch (priority) {
      case 'low':
        return 'LOW';
      case 'medium':
        return 'NORMAL';
      case 'high':
        return 'HIGH';
      case 'critical':
        return 'URGENT';
      default:
        return 'NORMAL';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
                         event.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filters.category === 'all' || event.category === filters.category;
    const matchesPriority = filters.priority === 'all' || event.priority === filters.priority;
    const matchesStatus = filters.status === 'all' || event.status === filters.status;
    
    const isMatch = matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    
    // Debug logging for filtering
    if (!isMatch) {
      console.log('Event filtered out:', {
        title: event.title,
        matchesSearch,
        matchesCategory,
        matchesPriority,
        matchesStatus,
        filters,
        search
      });
    }
    
    return isMatch;
  });

  // Debug logging for filtered events
  console.log('Filtered events:', {
    totalEvents: events.length,
    filteredEvents: filteredEvents.length,
    filters,
    search
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

  const handleDeleteEvents = async () => {
    if (selectedEvents.length === 0) {
      toast.error("Please select events to delete");
      return;
    }
    
    try {
      // Delete events one by one (in a real app, you'd have a bulk delete endpoint)
      const deletePromises = selectedEvents.map(eventId => 
        fetch(`/api/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'x-user-role': 'ADMIN', // TODO: Get from auth context
            'x-user-id': '1' // TODO: Get from auth context
          }
        })
      );
      
      await Promise.all(deletePromises);
      
      setEvents(events.filter(event => !selectedEvents.includes(event.id)));
      setSelectedEvents([]);
      toast.success(`${selectedEvents.length} event(s) deleted successfully`);
    } catch (error) {
      console.error('Error deleting events:', error);
      toast.error('Failed to delete some events');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedEvents.length === 0) {
      toast.error("Please select events first");
      return;
    }

    try {
      const updatePromises = selectedEvents.map(eventId => {
        const event = events.find(e => e.id === eventId);
        if (!event) return Promise.resolve();

        let newStatus: string;
        switch (action) {
          case 'publish':
            newStatus = 'SCHEDULED';
            break;
          case 'archive':
            newStatus = 'CANCELLED';
            break;
          default:
            return Promise.resolve();
        }

        return fetch(`/api/events/${eventId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'ADMIN', // TODO: Get from auth context
            'x-user-id': '1' // TODO: Get from auth context
          },
          body: JSON.stringify({
            status: newStatus,
            title: event.title,
            description: event.description,
            eventType: mapCategoryToEventType(event.category),
            eventDate: event.startDate.toISOString(),
            endDate: event.endDate.toISOString(),
            location: event.location,
            priority: mapPriorityToDbLevel(event.priority),
            isPublic: true,
            requiresRegistration: event.requiresApproval,
            capacity: null,
            imageUrl: null,
            contactEmail: null,
            contactPhone: null
          })
        });
      });

      await Promise.all(updatePromises);
      
      // Reload events to get updated data
      await loadEvents();
      
      const actionText = action === 'publish' ? 'published' : 'archived';
      toast.success(`${selectedEvents.length} event(s) ${actionText}`);
      setSelectedEvents([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to update some events');
    }
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

  // Calendar navigation functions
  const navigateToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  // Event action handlers
  const handleViewEvent = (event: AcademicEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleEditEvent = (event: AcademicEvent) => {
    setSelectedEvent(event);
    setShowEditEvent(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': 'ADMIN', // TODO: Get from auth context
          'x-user-id': '1' // TODO: Get from auth context
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }

      setEvents(events.filter(e => e.id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
    }
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newEvent.title.trim()) {
      errors.title = 'Event title is required';
    }
    
    if (!newEvent.startDate) {
      errors.startDate = 'Start date is required';
    }
    
    if (!newEvent.endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (newEvent.startDate && newEvent.endDate) {
      const startDate = new Date(newEvent.startDate);
      const endDate = new Date(newEvent.endDate);
      
      if (endDate <= startDate) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input changes
  const handleFormChange = (field: string, value: any) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle form submission
  const handleAddEventSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        eventType: mapCategoryToEventType(newEvent.category),
        eventDate: newEvent.startDate,
        endDate: newEvent.endDate,
        location: newEvent.location,
        priority: mapPriorityToDbLevel(newEvent.priority),
        isPublic: true,
        requiresRegistration: newEvent.requiresApproval,
        capacity: null,
        imageUrl: null,
        contactEmail: null,
        contactPhone: null
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'ADMIN', // TODO: Get from auth context
          'x-user-id': '1' // TODO: Get from auth context
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }

      const createdEvent = await response.json();
      
      // Transform the created event to match our interface
      const transformedEvent: AcademicEvent = {
        id: createdEvent.eventId,
        title: createdEvent.title,
        description: createdEvent.description,
        startDate: new Date(createdEvent.eventDate),
        endDate: createdEvent.endDate ? new Date(createdEvent.endDate) : new Date(createdEvent.eventDate),
        allDay: false, // TODO: Determine from time
        category: mapEventTypeToCategory(createdEvent.eventType),
        priority: mapPriorityToLevel(createdEvent.priority),
        location: createdEvent.location,
        attendees: [],
        isRecurring: false,
        recurrencePattern: undefined,
        status: mapStatusToEventStatus(createdEvent.status),
        createdBy: createdEvent.createdByAdmin?.userName || 'Unknown',
        createdAt: new Date(createdEvent.createdAt),
        updatedAt: new Date(createdEvent.updatedAt),
        requiresApproval: false,
        color: getEventColor(mapEventTypeToCategory(createdEvent.eventType)),
        tags: []
      };

      setEvents(prev => [...prev, transformedEvent]);
      setShowAddEvent(false);
      setNewEvent({
        title: '',
        description: '',
        category: 'academic',
        priority: 'medium',
        startDate: '',
        endDate: '',
        location: '',
        allDay: false,
        recurring: false,
        requiresApproval: false
      });
      setFormErrors({});
      toast.success('Event added successfully');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create event');
    }
  };

  // Reset form when dialog closes
  const handleAddEventClose = () => {
    setShowAddEvent(false);
    setNewEvent({
      title: '',
      description: '',
      category: 'academic',
      priority: 'medium',
      startDate: '',
      endDate: '',
      location: '',
      allDay: false,
      recurring: false,
      requiresApproval: false
    });
    setFormErrors({});
  };

  // Import functionality
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const parseCSV = (csvText: string): AcademicEvent[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const events: AcademicEvent[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const event: AcademicEvent = {
          id: Date.now() + i,
          title: values[0] || '',
          description: values[1] || '',
          startDate: new Date(values[2] || new Date()),
          endDate: new Date(values[3] || new Date()),
          allDay: values[4] === 'true',
          category: (values[5] as any) || 'academic',
          priority: (values[6] as any) || 'medium',
          location: values[7] || '',
          attendees: values[8] ? values[8].split(';') : [],
          isRecurring: values[9] === 'true',
          recurrencePattern: values[10] || undefined,
          status: 'draft',
          createdBy: 'Imported User',
          createdAt: new Date(),
          updatedAt: new Date(),
          requiresApproval: values[11] === 'true',
          color: getEventColor((values[5] as any) || 'academic'),
          tags: values[12] ? values[12].split(';') : []
        };
        events.push(event);
      }
    }
    return events;
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await importFile.text();
      const importedEvents = parseCSV(text);
      
      // Create events in database
      const createPromises = importedEvents.map(async (event, index) => {
        // Update progress
        setImportProgress(Math.round(((index + 1) / importedEvents.length) * 100));
        
        const eventData = {
          title: event.title,
          description: event.description,
          eventType: mapCategoryToEventType(event.category),
          eventDate: event.startDate.toISOString(),
          endDate: event.endDate.toISOString(),
          location: event.location,
          priority: mapPriorityToDbLevel(event.priority),
          isPublic: true,
          requiresRegistration: event.requiresApproval,
          capacity: null,
          imageUrl: null,
          contactEmail: null,
          contactPhone: null
        };

        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'ADMIN', // TODO: Get from auth context
            'x-user-id': '1' // TODO: Get from auth context
          },
          body: JSON.stringify(eventData)
        });

        if (!response.ok) {
          console.error(`Failed to create event: ${event.title}`);
        }
      });

      await Promise.all(createPromises);

      // Reload events from database
      await loadEvents();
      
      setShowImportDialog(false);
      setImportFile(null);
      setImportProgress(0);
      toast.success(`${importedEvents.length} events imported successfully`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import events. Please check the file format.');
    } finally {
      setIsImporting(false);
    }
  };

  // Export functionality
  const generateCSV = (events: AcademicEvent[]): string => {
    const headers = [
      'Title', 'Description', 'Start Date', 'End Date', 'All Day', 
      'Category', 'Priority', 'Location', 'Attendees', 'Recurring', 
      'Recurrence Pattern', 'Requires Approval', 'Tags'
    ];
    
    const rows = events.map(event => [
      event.title,
      event.description || '',
      event.startDate.toISOString(),
      event.endDate.toISOString(),
      event.allDay.toString(),
      event.category,
      event.priority,
      event.location || '',
      event.attendees?.join(';') || '',
      event.isRecurring.toString(),
      event.recurrencePattern || '',
      event.requiresApproval.toString(),
      event.tags?.join(';') || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const generateICal = (events: AcademicEvent[]): string => {
    let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ICCT//Academic Calendar//EN\n';
    
    events.forEach(event => {
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${event.id}@icct.edu\n`;
      ical += `DTSTART:${event.startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ical += `DTEND:${event.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
      ical += `SUMMARY:${event.title}\n`;
      if (event.description) {
        ical += `DESCRIPTION:${event.description}\n`;
      }
      if (event.location) {
        ical += `LOCATION:${event.location}\n`;
      }
      ical += 'END:VEVENT\n';
    });
    
    ical += 'END:VCALENDAR';
    return ical;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      let content = '';
      let mimeType = '';
      let fileExtension = '';
      
      switch (exportFormat) {
        case 'csv':
          content = generateCSV(events);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'ical':
          content = generateICal(events);
          mimeType = 'text/calendar';
          fileExtension = 'ics';
          break;
        case 'xlsx':
          // For Excel, we'll use CSV format as a fallback
          content = generateCSV(events);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
        case 'pdf':
          // For PDF, we'll use CSV format as a fallback
          content = generateCSV(events);
          mimeType = 'application/pdf';
          fileExtension = 'pdf';
          break;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `academic-calendar-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowExportDialog(false);
      toast.success(`Events exported to ${exportFormat.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export events');
    } finally {
      setIsExporting(false);
    }
  };

  // Settings management
  const handleSettingsChange = (category: string, setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // Save to localStorage for now (in a real app, this would be saved to database)
      localStorage.setItem('academic-calendar-settings', JSON.stringify(settings));
      
      // TODO: Add API call to save settings to database
      // const response = await fetch('/api/settings/academic-calendar', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'x-user-role': 'ADMIN',
      //     'x-user-id': '1'
      //   },
      //   body: JSON.stringify(settings)
      // });
      
      setShowSettings(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      notifications: {
        email: true,
        push: false,
        reminders: true
      },
      display: {
        showWeekends: true,
        showHolidays: true,
        colorCoding: true
      },
      integration: {
        googleSync: false,
        outlookSync: false
      }
    };
    setSettings(defaultSettings);
    toast.success('Settings reset to defaults');
  };

  // Quick action handlers
  const handleSetReminders = () => {
    toast.info('Reminder settings will be available in the Settings dialog');
    setShowSettings(true);
  };

  const handleShareCalendar = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'ICCT Academic Calendar',
        text: 'Check out our academic calendar',
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Calendar link copied to clipboard');
    }
  };

  const handleGenerateReport = () => {
    const reportData = {
      totalEvents: events.length,
      publishedEvents: events.filter(e => e.status === 'published').length,
      draftEvents: events.filter(e => e.status === 'draft').length,
      criticalEvents: events.filter(e => e.priority === 'critical').length,
      upcomingEvents: events.filter(e => e.startDate > new Date()).length,
      generatedAt: new Date().toISOString()
    };

    const reportContent = `
ICCT Academic Calendar Report
Generated: ${new Date().toLocaleDateString()}

Summary:
- Total Events: ${reportData.totalEvents}
- Published Events: ${reportData.publishedEvents}
- Draft Events: ${reportData.draftEvents}
- Critical Events: ${reportData.criticalEvents}
- Upcoming Events: ${reportData.upcomingEvents}

Event Categories:
${Object.entries(EVENT_CATEGORIES).map(([key, value]) => 
  `- ${value.label}: ${events.filter(e => e.category === key).length}`
).join('\n')}
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `academic-calendar-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Calendar report generated successfully');
  };

  const stats = getEventStats();
  const upcomingEvents = getUpcomingEvents();

  // Show loading state
  if (loading) {
    return <PageSkeleton />;
  }

  // Show error state
  if (error) {
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Calendar</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshData} disabled={refreshing}>
              {refreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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





      {/* Database Status & Stats */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-900">Database Connection Status</h3>
            <p className="text-xs text-blue-700">
              Events loaded: {events.length} | 
              Filtered: {filteredEvents.length} | 
              Academic Year: {selectedYear?.name || 'None'} | 
              Semester: {selectedSemester?.name || 'None'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${events.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-xs text-blue-700">
              {events.length > 0 ? 'Connected' : 'No data'}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadEvents}
              disabled={eventsLoading}
              className="ml-2"
            >
              <RefreshCw className={`w-3 h-3 ${eventsLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  const testEvent = {
                    title: 'Test Academic Event',
                    description: 'This is a test event created to verify the calendar display',
                    eventType: 'ACADEMIC',
                    eventDate: new Date().toISOString(),
                    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                    location: 'Test Location',
                    priority: 'NORMAL',
                    isPublic: true,
                    requiresRegistration: false,
                    capacity: null,
                    imageUrl: null,
                    contactEmail: null,
                    contactPhone: null
                  };

                  const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-user-role': 'ADMIN',
                      'x-user-id': '1'
                    },
                    body: JSON.stringify(testEvent)
                  });

                  if (response.ok) {
                    toast.success('Test event created successfully');
                    await loadEvents(); // Reload events
                  } else {
                    const error = await response.text();
                    toast.error(`Failed to create test event: ${error}`);
                  }
                } catch (error) {
                  console.error('Error creating test event:', error);
                  toast.error('Failed to create test event');
                }
              }}
              className="ml-2"
            >
              Create Test Event
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/events');
                  const data = await response.json();
                  console.log('Database check - Raw API response:', data);
                  toast.info(`Database has ${data.items?.length || 0} events`);
                } catch (error) {
                  console.error('Database check error:', error);
                  toast.error('Failed to check database');
                }
              }}
              className="ml-2"
            >
              Check DB
            </Button>
          </div>
        </div>
      </div>

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
                    <div key={event.id} className="p-3 border rounded">
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
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleSetReminders}>
                  <Bell className="w-4 h-4 mr-2" />
                  Set Reminders
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleShareCalendar}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Calendar
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleGenerateReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start" 
                  onClick={refreshData}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Syncing...' : 'Sync Calendar'}
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
                  <Button variant="outline" size="sm" onClick={navigateToPrevious}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={navigateToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={navigateToNext}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadEvents}
                    disabled={loading}
                    className="ml-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
                {eventsLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600">Loading events from database...</p>
                    </div>
                  </div>
                )}
                
                {!eventsLoading && (
                  <>
                    {viewMode === 'month' && (
                  <CalendarView 
                    events={filteredEvents}
                    currentDate={currentDate}
                    viewMode="month"
                    selectedEvents={selectedEvents}
                    onEventSelect={(eventId) => {
                      const event = events.find(e => e.id === eventId);
                      if (event) {
                        handleViewEvent(event);
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
                      const event = events.find(e => e.id === eventId);
                      if (event) {
                        handleViewEvent(event);
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
                      const event = events.find(e => e.id === eventId);
                      if (event) {
                        handleViewEvent(event);
                      }
                    }}
                  />
                )}
                
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {filteredEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                          {events.length === 0 ? 'No events available' : 'No events found'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {events.length === 0 
                            ? 'Start by creating your first academic event.'
                            : 'Try adjusting your filters or create a new event.'
                          }
                        </p>
                        {events.length === 0 && (
                          <Button className="mt-4" onClick={handleAddEvent}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create First Event
                          </Button>
                        )}
                      </div>
                    ) : (
                      filteredEvents.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded">
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
                              {event.location && (
                                <p className="text-sm text-gray-500 mt-1">
                                  📍 {event.location}
                                </p>
                              )}
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-gray-400">
                                  Created by: {event.createdBy}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Status: {event.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewEvent(event)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                              <Trash2 className="w-4 h-4" />
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
                      const event = events.find(e => e.id === eventId);
                      if (event) {
                        handleViewEvent(event);
                      }
                    }}
                  />
                )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddEvent} onOpenChange={handleAddEventClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input 
                  id="title" 
                  placeholder="Enter event title" 
                  value={newEvent.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className={formErrors.title ? 'border-red-500' : ''}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
                )}
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={newEvent.category} 
                  onValueChange={(value) => handleFormChange('category', value)}
                >
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
              <Textarea 
                id="description" 
                placeholder="Enter event description" 
                value={newEvent.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input 
                  id="startDate" 
                  type="datetime-local" 
                  value={newEvent.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                  className={formErrors.startDate ? 'border-red-500' : ''}
                />
                {formErrors.startDate && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.startDate}</p>
                )}
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input 
                  id="endDate" 
                  type="datetime-local" 
                  value={newEvent.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                  className={formErrors.endDate ? 'border-red-500' : ''}
                />
                {formErrors.endDate && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.endDate}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={newEvent.priority} 
                  onValueChange={(value) => handleFormChange('priority', value)}
                >
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
                <Input 
                  id="location" 
                  placeholder="Enter location" 
                  value={newEvent.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allDay" 
                  checked={newEvent.allDay}
                  onCheckedChange={(checked) => handleFormChange('allDay', checked)}
                />
                <Label htmlFor="allDay">All day event</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="recurring" 
                  checked={newEvent.recurring}
                  onCheckedChange={(checked) => handleFormChange('recurring', checked)}
                />
                <Label htmlFor="recurring">Recurring event</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="requiresApproval" 
                  checked={newEvent.requiresApproval}
                  onCheckedChange={(checked) => handleFormChange('requiresApproval', checked)}
                />
                <Label htmlFor="requiresApproval">Requires approval</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleAddEventClose}>
                Cancel
              </Button>
              <Button onClick={handleAddEventSubmit}>
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
              <Label htmlFor="importFile">Select CSV File</Label>
              <Input 
                id="importFile" 
                type="file" 
                accept=".csv" 
                onChange={handleFileSelect}
                disabled={isImporting}
              />
              {importFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing events...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
              <p className="text-sm text-blue-800">
                Your CSV file should have the following columns: Title, Description, Start Date, End Date, All Day, Category, Priority, Location, Attendees, Recurring, Recurrence Pattern, Requires Approval, Tags
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImportDialog(false);
                  setImportFile(null);
                  setImportProgress(0);
                }}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport}
                disabled={!importFile || isImporting}
              >
                {isImporting ? 'Importing...' : 'Import Events'}
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
              <Label htmlFor="exportFormat">Export Format</Label>
              <Select 
                value={exportFormat} 
                onValueChange={(value: any) => setExportFormat(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                  <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="ical">iCal Calendar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Export Information:</h4>
              <p className="text-sm text-gray-600">
                Exporting {events.length} events to {exportFormat.toUpperCase()} format.
                {exportFormat === 'ical' && ' This format is compatible with Google Calendar, Outlook, and other calendar applications.'}
              </p>
            </div>
            
            {isExporting && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Preparing export...</span>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowExportDialog(false)}
                disabled={isExporting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={isExporting || events.length === 0}
              >
                {isExporting ? 'Exporting...' : `Export to ${exportFormat.toUpperCase()}`}
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
                  <Switch 
                    id="emailNotif" 
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', 'email', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushNotif">Push Notifications</Label>
                  <Switch 
                    id="pushNotif" 
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', 'push', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="reminderNotif">Reminder Notifications</Label>
                  <Switch 
                    id="reminderNotif" 
                    checked={settings.notifications.reminders}
                    onCheckedChange={(checked) => handleSettingsChange('notifications', 'reminders', checked)}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-3">Display Options</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showWeekends">Show Weekends</Label>
                  <Switch 
                    id="showWeekends" 
                    checked={settings.display.showWeekends}
                    onCheckedChange={(checked) => handleSettingsChange('display', 'showWeekends', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showHolidays">Show Holidays</Label>
                  <Switch 
                    id="showHolidays" 
                    checked={settings.display.showHolidays}
                    onCheckedChange={(checked) => handleSettingsChange('display', 'showHolidays', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="colorCoding">Color Coding</Label>
                  <Switch 
                    id="colorCoding" 
                    checked={settings.display.colorCoding}
                    onCheckedChange={(checked) => handleSettingsChange('display', 'colorCoding', checked)}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-3">Integration</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="googleSync">Google Calendar Sync</Label>
                  <Switch 
                    id="googleSync" 
                    checked={settings.integration.googleSync}
                    onCheckedChange={(checked) => handleSettingsChange('integration', 'googleSync', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="outlookSync">Outlook Sync</Label>
                  <Switch 
                    id="outlookSync" 
                    checked={settings.integration.outlookSync}
                    onCheckedChange={(checked) => handleSettingsChange('integration', 'outlookSync', checked)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleResetSettings}>
                Reset to Defaults
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSettings}>
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedEvent.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      className={`text-xs ${EVENT_CATEGORIES[selectedEvent.category].textColor} bg-opacity-10`}
                    >
                      {EVENT_CATEGORIES[selectedEvent.category].label}
                    </Badge>
                    <Badge className={`text-xs ${PRIORITY_LEVELS[selectedEvent.priority].color}`}>
                      {PRIORITY_LEVELS[selectedEvent.priority].label}
                    </Badge>
                    <Badge variant={selectedEvent.status === 'published' ? 'default' : 'secondary'}>
                      {selectedEvent.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setShowEventDetails(false);
                    setShowEditEvent(true);
                  }}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowEventDetails(false)}>
                    Close
                  </Button>
                </div>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Start Date</h4>
                  <p className="text-gray-600">
                    {selectedEvent.startDate.toLocaleDateString()} at {selectedEvent.startDate.toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">End Date</h4>
                  <p className="text-gray-600">
                    {selectedEvent.endDate.toLocaleDateString()} at {selectedEvent.endDate.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              {selectedEvent.location && (
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <p className="text-gray-600">{selectedEvent.location}</p>
                </div>
              )}
              
              {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Attendees</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.attendees.map((attendee, index) => (
                      <Badge key={index} variant="outline">{attendee}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Created By</h4>
                  <p className="text-gray-600">{selectedEvent.createdBy}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Created At</h4>
                  <p className="text-gray-600">{selectedEvent.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={showEditEvent} onOpenChange={setShowEditEvent}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editTitle">Event Title</Label>
                  <Input id="editTitle" defaultValue={selectedEvent.title} />
                </div>
                <div>
                  <Label htmlFor="editCategory">Category</Label>
                  <Select defaultValue={selectedEvent.category}>
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
                <Label htmlFor="editDescription">Description</Label>
                <Textarea id="editDescription" defaultValue={selectedEvent.description} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStartDate">Start Date</Label>
                  <Input 
                    id="editStartDate" 
                    type="datetime-local" 
                    defaultValue={selectedEvent.startDate.toISOString().slice(0, 16)}
                  />
                </div>
                <div>
                  <Label htmlFor="editEndDate">End Date</Label>
                  <Input 
                    id="editEndDate" 
                    type="datetime-local" 
                    defaultValue={selectedEvent.endDate.toISOString().slice(0, 16)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPriority">Priority</Label>
                  <Select defaultValue={selectedEvent.priority}>
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
                  <Label htmlFor="editLocation">Location</Label>
                  <Input id="editLocation" defaultValue={selectedEvent.location} />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox id="editAllDay" defaultChecked={selectedEvent.allDay} />
                <Label htmlFor="editAllDay">All day event</Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditEvent(false)}>
                  Cancel
                </Button>
                <Button onClick={async () => {
                  try {
                    if (!selectedEvent) return;
                    
                    const eventData = {
                      title: (document.getElementById('editTitle') as HTMLInputElement)?.value || selectedEvent.title,
                      description: (document.getElementById('editDescription') as HTMLTextAreaElement)?.value || selectedEvent.description,
                      eventType: mapCategoryToEventType(selectedEvent.category),
                      eventDate: (document.getElementById('editStartDate') as HTMLInputElement)?.value || selectedEvent.startDate.toISOString(),
                      endDate: (document.getElementById('editEndDate') as HTMLInputElement)?.value || selectedEvent.endDate.toISOString(),
                      location: (document.getElementById('editLocation') as HTMLInputElement)?.value || selectedEvent.location,
                      priority: mapPriorityToDbLevel(selectedEvent.priority),
                      isPublic: true,
                      requiresRegistration: selectedEvent.requiresApproval,
                      capacity: null,
                      imageUrl: null,
                      contactEmail: null,
                      contactPhone: null
                    };

                    const response = await fetch(`/api/events/${selectedEvent.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-user-role': 'ADMIN', // TODO: Get from auth context
                        'x-user-id': '1' // TODO: Get from auth context
                      },
                      body: JSON.stringify(eventData)
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to update event');
                    }

                    // Reload events to get updated data
                    await loadEvents();
                    toast.success("Event updated successfully");
                    setShowEditEvent(false);
                  } catch (error) {
                    console.error('Error updating event:', error);
                    toast.error(error instanceof Error ? error.message : 'Failed to update event');
                  }
                }}>
                  Update Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 