import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Search } from "lucide-react";
import React from "react";

interface ScheduleFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  schedules: any[];
  search: string;
  setSearch: (val: string) => void;
}

const ScheduleFilters: React.FC<ScheduleFiltersProps> = ({ filters, setFilters, schedules, search, setSearch }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {/* Search */}
    <div>
      <Label htmlFor="search">Search</Label>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
        <Input
          id="search"
          placeholder="Search schedules..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
    {/* Semester */}
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
    {/* Status */}
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
    {/* Day */}
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
    {/* Instructor */}
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
    {/* Room */}
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
);

export default ScheduleFilters; 