import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { RefObject } from "react";
import { TAG_TYPE_OPTIONS, TAG_STATUS_OPTIONS } from "../readers/constants";

interface FilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  typeFilter: string;
  setTypeFilter: (val: string) => void;
  handleResetPreferences: () => void;
  searchInputRef: RefObject<HTMLInputElement>;
}

export default function FilterBar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  handleResetPreferences,
  searchInputRef,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <input
        type="text"
        placeholder="Search by Tag Number..."
        className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300"
        value={search}
        onChange={e => setSearch(e.target.value)}
        ref={searchInputRef}
      />
      <select
        className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-blue-300"
        value={statusFilter}
        onChange={e => setStatusFilter(e.target.value)}
      >
        <option value="all">All Statuses</option>
        {TAG_STATUS_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select
        className="border border-blue-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={typeFilter}
        onChange={e => setTypeFilter(e.target.value)}
      >
        <option value="all">All Types</option>
        {TAG_TYPE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
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