import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { RefObject } from "react";
import { STATUS_OPTIONS } from "./constants";

interface FilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  roomFilter: string;
  setRoomFilter: (val: string) => void;
  rooms: any[];
  setCurrentPage: (page: number) => void;
  handleResetPreferences: () => void;
  searchInputRef: RefObject<HTMLInputElement>;
}

export default function FilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  roomFilter,
  setRoomFilter,
  rooms,
  setCurrentPage,
  handleResetPreferences,
  searchInputRef,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <input
        type="text"
        placeholder="Search by Device ID, Name, or Room..."
        className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300"
        value={search}
        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
        ref={searchInputRef}
      />
      <select
        className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300"
        value={statusFilter}
        onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
      >
        <option value="all">All Statuses</option>
        {STATUS_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={roomFilter}
        onChange={e => { setRoomFilter(e.target.value); setCurrentPage(1); }}
      >
        <option value="all">All Rooms</option>
        {rooms.map(r => (
          <option key={r.roomNo || r.id || r.roomId} value={(r.roomNo || r.id || r.roomId).toString()}>
            {r.roomName || r.roomType || "Room"} ({r.roomNo || r.id || r.roomId})
          </option>
        ))}
      </select>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1 text-xs"
        onClick={handleResetPreferences}
        aria-label="Reset preferences"
        title="Reset all filters, columns, and sorting to default"
      >
        <RefreshCw className="w-4 h-4" /> Reset
      </Button>
    </div>
  );
} 