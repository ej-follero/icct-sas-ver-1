import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Filter, SortAsc } from 'lucide-react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import React from 'react';

interface FilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  filters: any;
  setFilters: (v: any) => void;
  sortField: string;
  setSortField: (v: string) => void;
  sortOrder: string;
  setSortOrder: (v: string) => void;
  columnStatusFilter: string;
  setColumnStatusFilter: (v: string) => void;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  showSort: boolean;
  setShowSort: (v: boolean) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  search, setSearch, filters, setFilters,
  sortField, setSortField, sortOrder, setSortOrder,
  columnStatusFilter, setColumnStatusFilter,
  showFilters, setShowFilters, showSort, setShowSort
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto mb-4">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          className="pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
          placeholder="Search sections by name, code, or course..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <Select value={filters.type} onValueChange={v => setFilters((f: any) => ({ ...f, type: v }))}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="REGULAR">Regular</SelectItem>
          <SelectItem value="IRREGULAR">Irregular</SelectItem>
          <SelectItem value="SUMMER">Summer</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.status} onValueChange={v => setFilters((f: any) => ({ ...f, status: v }))}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.yearLevel} onValueChange={v => setFilters((f: any) => ({ ...f, yearLevel: v }))}>
        <SelectTrigger className="w-32"><SelectValue placeholder="Year Level" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Years</SelectItem>
          <SelectItem value="1">1st Year</SelectItem>
          <SelectItem value="2">2nd Year</SelectItem>
          <SelectItem value="3">3rd Year</SelectItem>
          <SelectItem value="4">4th Year</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.course} onValueChange={v => setFilters((f: any) => ({ ...f, course: v }))}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Course" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Courses</SelectItem>
          <SelectItem value="Bachelor of Science in Information Technology">BSIT</SelectItem>
          <SelectItem value="Bachelor of Science in Computer Science">BSCS</SelectItem>
          <SelectItem value="Bachelor of Science in Information Systems">BSIS</SelectItem>
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="border-blue-200 hover:bg-blue-50" aria-label="Sort">
            <SortAsc className="h-4 w-4 text-blue-700" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 bg-white/90 border border-blue-100 shadow-lg rounded-xl mt-2">
          <DropdownMenuItem onClick={() => { setSortField('sectionName'); setSortOrder(sortField === 'sectionName' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'sectionName' ? 'font-bold text-blue-700' : ''}>
            Section Name {sortField === 'sectionName' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSortField('sectionType'); setSortOrder(sortField === 'sectionType' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'sectionType' ? 'font-bold text-blue-700' : ''}>
            Type {sortField === 'sectionType' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSortField('sectionCapacity'); setSortOrder(sortField === 'sectionCapacity' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'sectionCapacity' ? 'font-bold text-blue-700' : ''}>
            Capacity {sortField === 'sectionCapacity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSortField('sectionStatus'); setSortOrder(sortField === 'sectionStatus' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'sectionStatus' ? 'font-bold text-blue-700' : ''}>
            Status {sortField === 'sectionStatus' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { setSortField('yearLevel'); setSortOrder(sortField === 'yearLevel' && sortOrder === 'asc' ? 'desc' : 'asc'); }} className={sortField === 'yearLevel' ? 'font-bold text-blue-700' : ''}>
            Year Level {sortField === 'yearLevel' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FilterBar; 