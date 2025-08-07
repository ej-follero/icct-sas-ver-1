"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TableSearch = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: TableSearchProps) => {
  return (
    <div className={`flex items-center gap-2 rounded ring-1 ring-gray-300 px-3 py-1 w-full md:w-auto max-w-[800px] ${className}`}>
      <Search className="w-4 h-4 text-blue-500" aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search table"
        className="bg-transparent border-none focus:ring-0 focus:outline-none focus-visible:outline-none p-0"
      />
    </div>
  );
};

export default TableSearch;
