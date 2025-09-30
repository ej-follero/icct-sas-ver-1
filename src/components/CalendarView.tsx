"use client";

import { useState } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek as dfnsStartOfWeek, getDay, addDays, isSameDay, addMonths, subMonths } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { MoreHorizontal, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => dfnsStartOfWeek(date, { weekStartsOn: 0 }), // Always returns Sunday
  getDay,
  locales,
});

interface Event {
  id: number;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  time?: string;
  sectionCode?: string;
  subject?: string;
  instructor?: string;
  day?: string;
}

interface CalendarViewProps {
  mode?: "work-week" | "month";
  events: Event[];
  showEventCards?: boolean;
  minTime?: Date;
  maxTime?: Date;
  className?: string;
}

const timeRanges = {
  morning: { min: { h: 6, m: 0 }, max: { h: 12, m: 0 } },
  noon: { min: { h: 12, m: 0 }, max: { h: 17, m: 0 } },
  evening: { min: { h: 17, m: 0 }, max: { h: 23, m: 0 } },
  all: { min: { h: 6, m: 0 }, max: { h: 23, m: 0 } },
};

const timeRangeInfo = {
  all: {
    label: "All",
    description: "Shows all classes from 6AM to 11PM.",
    range: "6:00 AM - 11:00 PM",
  },
  morning: {
    label: "Morning",
    description: "Shows only morning classes.",
    range: "6:00 AM - 12:00 PM",
  },
  noon: {
    label: "Noon",
    description: "Shows only noon/afternoon classes.",
    range: "12:00 PM - 5:00 PM",
  },
  evening: {
    label: "Evening",
    description: "Shows only evening classes.",
    range: "5:00 PM - 11:00 PM",
  },
};

// Helper to get Sunday of the current week
function getSundayOfCurrentWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = -day; // go back to Sunday
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + diff);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

// Helper: get all days for a month grid (6 weeks, Sun-Sat)
function getMonthGrid(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  // First day of month
  const firstDay = new Date(year, month, 1);
  // Last day of month
  const lastDay = new Date(year, month + 1, 0);
  // Start from the Sunday before (or of) the first day
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());
  // End at the Saturday after (or of) the last day
  const end = new Date(lastDay);
  end.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  // Build grid
  const days = [];
  let d = new Date(start);
  while (d <= end) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

// Custom Month Grid
function CustomMonthGrid({ date, events, onEventClick }: { date: Date; events: Event[]; onEventClick: (event: Event) => void }) {
  const days = getMonthGrid(date);
  const today = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  // Group events by day string
  const eventsByDay: { [key: string]: Event[] } = {};
  events.forEach(ev => {
    const key = `${ev.start.getFullYear()}-${ev.start.getMonth()}-${ev.start.getDate()}`;
    if (!eventsByDay[key]) eventsByDay[key] = [];
    eventsByDay[key].push(ev);
  });
  // Color palette (reuse from eventColors)
  const eventColors = [
    { bg: 'bg-pink-100', text: 'text-pink-700' },
    { bg: 'bg-blue-100', text: 'text-blue-700' },
    { bg: 'bg-purple-100', text: 'text-purple-700' },
    { bg: 'bg-green-100', text: 'text-green-700' },
    { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  ];
  return (
    <div className="w-full pt-4 rounded">
      {/* Days of week header */}
      <div className="grid grid-cols-7 border-t-2 border-b-2 border-gray-300 bg-[#f8fafc]">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
          <div
            key={i}
            className={
              "py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide" +
              (i === 0 ? " border-l-2 border-gray-300" : "") +
              (i === 6 ? " border-r-2 border-gray-300" : "")
            }
          >
            {d}
          </div>
        ))}
      </div>
      {/* Month grid */}
      <div className="grid grid-cols-7 grid-rows-6 min-h-[420px] ">
        {days.map((d, i) => {
          const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
          const isCurrentMonth = d.getMonth() === month;
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          const dayEvents = eventsByDay[key] || [];
          return (
            <div
              key={i}
              className={`border border-gray-200 p-1 sm:p-2 min-h-[70px] flex flex-col items-stretch relative ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'} ${isToday ? 'bg-yellow-50 border-yellow-300' : ''}`}
              style={{ height: 80 }}
            >
              <div className={`text-xs font-bold mb-1 ${isToday ? 'text-yellow-700' : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>{d.getDate()}</div>
              <div className="flex flex-col gap-1">
                {dayEvents.map((ev, idx) => {
                  // Color by event id
                  const colorIdx = ev.id % eventColors.length;
                  const color = eventColors[colorIdx];
                  return (
                    <div
                      key={ev.id}
                      className={`truncate px-2 py-1 rounded-lg text-xs font-medium cursor-pointer ${color.bg} ${color.text}`}
                      title={ev.title}
                      onClick={() => onEventClick(ev)}
                    >
                      {ev.title.length > 18 ? ev.title.slice(0, 16) + '…' : ev.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Custom week header component
const CustomWeekHeader = ({ date, localizer }: { date: Date; localizer: any }) => {
  // Get the start of the week (Monday)
  const weekStart = dfnsStartOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  return (
    <div className="flex w-full bg-[#f8fafc] px-2 py-1 border-b border-blue-100">
      {days.map((day, idx) => {
        const isToday = isSameDay(day, today);
        return (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
          >
            <span className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>{localizer.format(day, 'EEE', 'en-US')}</span>
            <span className={`text-xl font-bold tracking-wide mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{day.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
};

// Custom header cell for react-big-calendar
const CustomHeaderCell = ({ label, date }: { label: string; date: Date }) => {
  const today = new Date();
  const isToday = isSameDay(date, today);
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 w-full">
      <span className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>{label}</span>
      <span className={`text-xl font-bold tracking-wide mt-0.5 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{date.getDate()}</span>
    </div>
  );
};

// Custom toolbar for react-big-calendar
const CustomToolbar = (toolbarProps: any) => {
  const goToBack = () => toolbarProps.onNavigate('PREV');
  const goToNext = () => toolbarProps.onNavigate('NEXT');
  const goToToday = () => toolbarProps.onNavigate('TODAY');
  return (
    <div className="flex items-center gap-2 mb-2">
      <button
        onClick={goToToday}
        className="px-3 py-1 rounded border border-gray-200 bg-white text-gray-700 hover:bg-blue-50 text-sm font-medium"
      >
        Today
      </button>
      <button
        onClick={goToBack}
        className="p-2 rounded border border-gray-200 bg-white text-gray-700 hover:bg-blue-50"
        aria-label="Previous week"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goToNext}
        className="p-2 rounded border border-gray-200 bg-white text-gray-700 hover:bg-blue-50"
        aria-label="Next week"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <span className="mx-4 text-blue-700 font-semibold text-base">
        {toolbarProps.label}
      </span>
      <div className="ml-auto flex gap-1">
        {toolbarProps.views.map((view: string) => (
          <button
            key={view}
            className={`px-3 py-1 rounded border border-gray-200 text-sm font-medium ${toolbarProps.view === view ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
            onClick={() => toolbarProps.onView(view)}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

const CalendarView = ({
  mode = "work-week",
  events,
  showEventCards = false,
  minTime,
  maxTime,
  className = "",
}: CalendarViewProps) => {
  const [view, setView] = useState<View>(mode === "work-week" ? Views.WORK_WEEK : Views.MONTH);
  const [date, setDate] = useState<Date>(getSundayOfCurrentWeek());
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'noon' | 'evening'>('all');
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);

  // Set min/max time based on filter
  const getTime = (type: 'min' | 'max') => {
    const range = timeRanges[timeFilter];
    const d = new Date(2025, 1, 0, range[type].h, range[type].m, 0);
    return d;
  };

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  // Navigation handler for controlled date
  const handleNavigate = (newDate: Date, newView: View, action: string) => {
    setDate(newDate);
    if (newView !== view) setView(newView);
  };

  // Helper: format label for toolbar
  function getToolbarLabel(view: View | string, date: Date) {
    if (view === 'month') {
      return format(date, 'MMMM yyyy');
    }
    if (view === 'week' || view === 'work_week') {
      const start = date;
      const end = addDays(date, 6);
      return `${format(start, 'MMMM d')} – ${format(end, 'd, yyyy')}`;
    }
    if (view === 'day') {
      return format(date, 'MMMM d, yyyy');
    }
    return '';
  }

  // Modern pastel color palette for events
  const eventColors = [
    { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900' },
    { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900' },
    { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900' },
    { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-900' },
    { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-900' },
    { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-900' },
  ];

  // Custom event style: pastel block, subtle left border, clickable
  const eventStyleGetter = (event: Event, _start: Date, _end: Date, isSelected: boolean) => {
    // Pick color by sectionCode or event id
    let colorIdx = 0;
    if (event.sectionCode) {
      colorIdx = event.sectionCode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % eventColors.length;
    } else if (event.id) {
      colorIdx = event.id % eventColors.length;
    }
    const color = eventColors[colorIdx];
    return {
      className: `${color.bg} ${color.border} ${color.text} rounded-xl px-2 py-1 border-l-4 shadow-sm cursor-pointer transition-all duration-150 ${isSelected ? 'ring-2 ring-blue-400' : ''}`,
      style: {
        display: 'flex',
        alignItems: 'center',
        minHeight: 40,
        fontWeight: 500,
        fontSize: 14,
        background: undefined, // use Tailwind class
        border: undefined, // use Tailwind class
      },
    };
  };

  // Custom event component: block with title/time, opens dialog on click
  const EventComponent = ({ event }: { event: Event }) => {
    return (
      <div
        className="w-full h-full flex flex-col justify-center cursor-pointer"
        onClick={e => { e.stopPropagation(); setDialogEvent(event); }}
      >
        <div className="font-semibold truncate leading-tight">
          {event.subject || event.title}
        </div>
        <div className="text-xs opacity-70 truncate">
          {event.sectionCode}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-[#f8fafc] p-4 rounded-xl shadow-sm border border-blue-100 ${className}`}>
      {/* Custom Toolbar (always visible) */}
      <div className="flex items-center gap-2 mb-2 pb-4">
        <button
          onClick={() => setDate(new Date())}
          className="px-3 py-1 rounded border border-gray-200 bg-white text-gray-700 hover:bg-blue-50 text-sm font-medium"
        >
          Today
        </button>
        <button
          onClick={() => {
            if (view === 'month') setDate(prev => subMonths(prev, 1));
            else if (view === 'day') setDate(prev => addDays(prev, -1));
            else setDate(prev => addDays(prev, -7));
          }}
          className="p-2 rounded border border-gray-200 bg-white text-gray-700 hover:bg-blue-50"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            if (view === 'month') setDate(prev => addMonths(prev, 1));
            else if (view === 'day') setDate(prev => addDays(prev, 1));
            else setDate(prev => addDays(prev, 7));
          }}
          className="p-2 rounded border border-gray-200 bg-white text-gray-700 hover:bg-blue-50"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="flex-1 flex justify-center">
          <span className="text-gray-700 font-semibold text-base text-center">
            {getToolbarLabel(view, date)}
          </span>
        </div>
        <div className="ml-auto flex gap-1">
          {['month', 'week', 'day'].map(v => (
            <button
              key={v}
              className={`px-3 py-1 rounded border border-gray-200 text-sm font-medium ${view === v ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700 hover:bg-blue-50'}`}
              onClick={() => setView(v as View)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="-mt-2">
        {view === 'month' ? (
          <CustomMonthGrid
            date={date}
            events={events}
            onEventClick={setDialogEvent}
          />
        ) : (
          <Calendar
            localizer={localizer}
            events={events.map(ev => ({
              ...ev,
              sectionCode: ev.sectionCode,
              subject: ev.subject,
              instructor: ev.instructor,
              day: ev.day,
              time: ev.time,
              description: ev.description,
            }))}
            startAccessor="start"
            endAccessor="end"
            views={['week', 'day']}
            view={view === 'work_week' ? 'week' : view}
            onView={handleOnChangeView}
            onSelectEvent={(event) => setDialogEvent(event)}
            min={getTime('min')}
            max={getTime('max')}
            className="rounded-xl"
            style={{ height: showEventCards ? "60%" : "98%", background: '#f8fafc', border: 'none' }}
            eventPropGetter={eventStyleGetter}
            components={{
              event: (props: any) => <EventComponent event={props.event} />,
              header: ({ label, date }: { label: string; date: Date }) => (
                <CustomHeaderCell label={format(date, 'EEE', { locale: enUS })} date={date} />
              ),
              // Remove toolbar from here
            }}
            dayLayoutAlgorithm="no-overlap"
            toolbar={false}
            popup={true}
            timeslots={2}
            step={30}
            defaultView={'week'}
            defaultDate={getSundayOfCurrentWeek()}
            date={date}
            onNavigate={handleNavigate}
            formats={{
              dayFormat: (date, culture, loc) => (loc ? loc.format(date, 'EEEE', culture) : format(date, 'EEEE')),
            }}
            culture="en-US"
          />
        )}
      </div>
      {/* Dialog for event info */}
      {dialogEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-2xl border border-blue-200 max-w-sm w-full p-6 relative animate-fade-in">
            <button
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-blue-50 text-blue-500"
              onClick={() => setDialogEvent(null)}
              aria-label="Close dialog"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-start gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white font-semibold text-sm mb-2">
                {dialogEvent.sectionCode || '-'}
              </span>
              <div className="text-blue-800 font-semibold text-lg mb-1 text-left">{dialogEvent.subject || '-'}</div>
              <div className="text-gray-700 text-sm mb-1 text-left">Instructor: <span className="font-medium text-blue-700">{dialogEvent.instructor || '-'}</span></div>
              <div className="text-gray-700 text-sm mb-1 text-left">Day: <span className="font-medium text-blue-700">{dialogEvent.day || '-'}</span></div>
              <div className="text-gray-700 text-sm mb-1 text-left">Time: <span className="font-medium text-blue-700">{dialogEvent.time || '-'}</span></div>
            </div>
          </div>
        </div>
      )}
      {/* Only show event cards for Week/Day views */}
      {showEventCards && view !== Views.MONTH && (
        <>
          <div className="flex items-center justify-between mt-6 mb-4">
            <h1 className="text-xl font-semibold text-blue-800">Events</h1>
            <button
              aria-label="More options"
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              type="button"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-5 rounded border-2 border-blue-100 border-t-4 ${
                  event.id % 2 === 1
                    ? "border-t-blue-400 bg-blue-50"
                    : "border-t-blue-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-blue-800">{event.title}</h2>
                  <span className="text-blue-500 text-xs">{event.time}</span>
                </div>
                {event.description && (
                  <p className="mt-2 text-gray-600 text-sm">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarView;
