"use client";

import { useState } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
} from "date-fns";
import enUS from "date-fns/locale/en-US";
import Image from "next/image";
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
  const [view, setView] = useState<View>(mode === "work-week" ? Views.WORK_WEEK : Views.MONTH);

  const handleOnChangeView = (selectedView: View) => {
    setView(selectedView);
  };

  return (
    <div className={`bg-white p-4 rounded-md ${className}`}>
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
      />
      
      {showEventCards && (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold my-4">Events</h1>
            <Image src="/moreDark.png" alt="" width={20} height={20} />
          </div>
          <div className="flex flex-col gap-4">
            {events.map((event) => (
              <div
                className="p-5 rounded-md border-2 border-gray-100 border-t-4 odd:border-t-sasSkyLight even:border-t-sasRedLight"
                key={event.id}
              >
                <div className="flex items-center justify-between">
                  <h1 className="font-semibold text-gray-600">{event.title}</h1>
                  <span className="text-gray-300 text-xs">{event.time}</span>
                </div>
                {event.description && (
                  <p className="mt-2 text-gray-400 text-sm">{event.description}</p>
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