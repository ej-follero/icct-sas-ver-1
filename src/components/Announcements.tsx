"use client";

import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: number;
  title: string;
  date: string;
  description: string;
}

const announcements: Announcement[] = [
  {
    id: 1,
    title: "Lorem ipsum dolor sit",
    date: "2025-01-01",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatum, expedita. Rerum, quidem facilis?",
  },
  {
    id: 2,
    title: "Lorem ipsum dolor sit",
    date: "2025-01-01",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatum, expedita. Rerum, quidem facilis?",
  },
  {
    id: 3,
    title: "Lorem ipsum dolor sit",
    date: "2025-01-01",
    description:
      "Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatum, expedita. Rerum, quidem facilis?",
  },
];

const Announcements = () => {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        <Button
          variant="link"
          size="sm"
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          aria-label="View all announcements"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {announcements.map(({ id, title, date, description }) => (
          <div
            key={id}
            className="bg-sasLightBlue rounded-md p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            role="article"
            tabIndex={0}
            aria-labelledby={`announcement-title-${id}`}
          >
            <div className="flex items-center justify-between">
              <h2
                id={`announcement-title-${id}`}
                className="font-medium text-gray-900"
              >
                {title}
              </h2>
              <time
                dateTime={date}
                className="text-xs text-gray-500 bg-white rounded-md px-2 py-1 select-none"
              >
                {date}
              </time>
            </div>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;