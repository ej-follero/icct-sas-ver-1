"use client";

import { useState } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { MoreHorizontal } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
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
}

interface CalendarViewProps {
  mode?: "work-week" | "month";
  events: Event[];
  showEventCards?: boolean;
  minTime?: Date;
  maxTime?: Date;
  className?: string;
}

const CalendarView = ({
  mode = "work-week",
  events,
  showEventCards = false,
  minTime = new Date(2025, 1, 0, 8, 0, 0),
  maxTime = new Date(2025, 1, 0, 17, 0, 0),
  className = "",
}: CalendarViewProps) => {
  const [view, setView] = useState<View>(
    mode === "work-week" ? Views.WORK_WEEK : Views.MONTH
  );

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  return (
    <div className={`bg-white p-4 rounded-md shadow-sm ${className}`}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={mode === "work-week" ? ["work_week", "day"] : ["month", "week", "day"]}
        view={view}
        style={{ height: showEventCards ? "60%" : "98%" }}
        onView={handleOnChangeView}
        min={minTime}
        max={maxTime}
        className="rounded-md"
      />

      {showEventCards && (
        <>
          <div className="flex items-center justify-between mt-6 mb-4">
            <h1 className="text-xl font-semibold">Events</h1>
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
                className={`p-5 rounded-md border-2 border-gray-100 border-t-4 ${
                  event.id % 2 === 1
                    ? "border-t-sky-300"
                    : "border-t-rose-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-700">{event.title}</h2>
                  <span className="text-gray-400 text-xs">{event.time}</span>
                </div>
                {event.description && (
                  <p className="mt-2 text-gray-500 text-sm">{event.description}</p>
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
